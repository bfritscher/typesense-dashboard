<template>
  <div class="row q-col-gutter-md">
    <!-- Left: Facet Panel -->
    <div class="col-12 col-md-3">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">Facets</div>

          <div v-for="field in facetFields" :key="field" class="q-mb-md">
            <template v-if="facetResults[field] && facetResults[field].length > 0">
              <div class="text-caption text-weight-bold q-mb-xs">{{ field }}</div>
              <q-option-group
                v-model="selectedFacets[field]"
                :options="facetResults[field].map(f => ({ label: `${f.value} (${f.count})`, value: f.value }))"
                type="checkbox"
                dense
              />
            </template>
          </div>

          <div v-if="noFacets" class="text-grey-6 text-caption">
            No facet data available. Run a search to see facets.
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Right: Search + Controls + Results -->
    <div class="col-12 col-md-9">
      <!-- Search input -->
      <q-input
        v-model="searchQuery"
        filled
        label="Search query"
        debounce="300"
        clearable
        @update:model-value="performSearch"
      >
        <template #prepend>
          <q-icon name="sym_s_search" />
        </template>
      </q-input>

      <!-- Controls row -->
      <div class="row q-col-gutter-sm q-mt-sm items-center">
        <!-- Sort mode -->
        <div class="col-auto">
          <q-select
            v-model="sortMode"
            :options="sortModeOptions"
            label="Sort mode"
            dense
            filled
            emit-value
            map-options
            style="min-width: 180px"
            @update:model-value="performSearch"
          />
        </div>

        <!-- Pin toggle (visible only when default_rank_with_pin exists) -->
        <div v-if="hasDefaultRankWithPin" class="col-auto">
          <q-btn-toggle
            v-model="withPins"
            toggle-color="primary"
            :options="[
              { label: 'With pins', value: true },
              { label: 'Without pins', value: false },
            ]"
            dense
            unelevated
            @update:model-value="performSearch"
          />
        </div>

        <!-- Filter context (hidden when no filter fields exist) -->
        <div v-if="filterContextOptions.length > 0" class="col-auto">
          <q-select
            v-model="filterContext"
            :options="filterContextOptions"
            label="Filter context"
            dense
            filled
            emit-value
            map-options
            style="min-width: 200px"
            @update:model-value="onFilterContextChange"
          />
        </div>

        <!-- Vendor ID input (visible when Specific vendor selected) -->
        <div v-if="filterContext === 'specific_vendor'" class="col-auto">
          <q-input
            v-model="vendorId"
            filled
            dense
            label="Vendor ID"
            style="width: 150px"
            @update:model-value="performSearch"
          />
        </div>

        <!-- Delivery method input (visible when Delivery method selected) -->
        <div v-if="filterContext === 'delivery_method'" class="col-auto">
          <q-input
            v-model="deliveryMethod"
            filled
            dense
            label="Delivery method"
            style="width: 150px"
            @update:model-value="performSearch"
          />
        </div>
      </div>

      <!-- Results summary -->
      <div v-if="searchResult" class="q-mt-md q-mb-sm text-subtitle2">
        {{ searchResult.found }} results found
        <span v-if="searchResult.search_time_ms !== undefined">
          in {{ searchResult.search_time_ms }}ms
        </span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="q-mt-md">
        <q-spinner color="primary" size="2em" class="q-mr-sm" />
        Searching...
      </div>

      <!-- Error -->
      <q-banner v-if="error" class="bg-negative text-white rounded-borders q-mt-md">
        {{ error }}
      </q-banner>

      <!-- Results list -->
      <q-list v-if="searchResult && searchResult.hits" separator bordered class="q-mt-sm rounded-borders">
        <q-item v-for="(hit, index) in searchResult.hits" :key="hit.document?.id || index">
          <q-item-section side>
            <q-badge color="primary" :label="String((index as number) + 1)" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ hit.document?.name || hit.document?.title || hit.document?.id || 'Unknown' }}
            </q-item-label>
            <q-item-label caption>
              ID: {{ hit.document?.id }}
              <span v-if="hasIsAvailable && hit.document?.is_available !== undefined">
                &middot;
                <q-badge
                  :color="hit.document.is_available ? 'positive' : 'grey'"
                  :label="hit.document.is_available ? 'Available' : 'Unavailable'"
                  dense
                />
              </span>
              <span v-if="hasMinPrice && hit.document?.min_price !== undefined">
                &middot; Price: {{ hit.document.min_price }}
              </span>
              <span v-if="hasAvgRating && hit.document?.avg_rating !== undefined">
                &middot; Rating: {{ hit.document.avg_rating }}
              </span>
              <span v-if="hasPopularity && hit.document?.popularity !== undefined">
                &middot; Popularity: {{ hit.document.popularity }}
              </span>
              <span v-if="hasPinPriority && hit.document?.pin_priority !== undefined">
                &middot; Pin: {{ hit.document.pin_priority }}
              </span>
            </q-item-label>
            <q-item-label caption class="text-grey-6">
              text_match: {{ hit.text_match }}
              <span v-if="hit.text_match_info">
                &middot; score: {{ hit.text_match_info.score }}
              </span>
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <div v-if="searchResult && searchResult.hits && searchResult.hits.length === 0" class="q-mt-md text-grey-6">
        No results found for this query.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useNodeStore } from 'src/stores/node';
import type { Api } from 'src/shared/api';

const store = useNodeStore();

const searchQuery = ref('');
const sortMode = ref('default');
const withPins = ref(true);
const filterContext = ref('all');
const vendorId = ref('');
const deliveryMethod = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const searchResult = ref<any>(null);

interface FacetValue {
  value: string;
  count: number;
}

const facetResults = ref<Record<string, FacetValue[]>>({});
const selectedFacets = ref<Record<string, string[]>>({});

// --- Field detection computed properties ---

function collectionHasField(fieldName: string): boolean {
  const col = store.currentCollection;
  if (!col || !col.fields) return false;
  return (col.fields as any[]).some((f: any) => f.name === fieldName);
}

const hasVendorIds = computed(() => collectionHasField('vendor_ids'));
const hasFeaturedVendorIds = computed(() => collectionHasField('featured_vendor_ids'));
const hasDeliveryMethods = computed(() => collectionHasField('delivery_methods'));
const hasMinPrice = computed(() => collectionHasField('min_price'));
const hasAvgRating = computed(() => collectionHasField('avg_rating'));
const hasPopularity = computed(() => collectionHasField('popularity'));
const hasDefaultRankWithPin = computed(() => collectionHasField('default_rank_with_pin'));
const hasDefaultRank = computed(() => collectionHasField('default_rank'));
const hasIsAvailable = computed(() => collectionHasField('is_available'));
const hasPinPriority = computed(() => collectionHasField('pin_priority'));

// --- Facets ---

const noFacets = computed(() => {
  return Object.values(facetResults.value).every((arr) => arr.length === 0);
});

const facetFields = computed(() => {
  const col = store.currentCollection;
  if (!col || !col.fields) return [];
  return (col.fields as any[]).filter((f: any) => f.facet === true).map((f: any) => f.name);
});

// --- Dynamic sort mode options ---

const sortModeOptions = computed(() => {
  const options = [{ label: 'Default', value: 'default' }];
  if (hasMinPrice.value) {
    options.push({ label: 'Price', value: 'price' });
  }
  if (hasAvgRating.value) {
    options.push({ label: 'Rating', value: 'rating' });
  }
  if (hasPopularity.value) {
    options.push({ label: 'Popularity', value: 'popularity' });
  }
  return options;
});

// --- Dynamic filter context options ---

const filterContextOptions = computed(() => {
  const options: { label: string; value: string }[] = [];
  if (hasVendorIds.value) {
    options.push({ label: 'All vendors', value: 'all' });
    options.push({ label: 'Specific vendor', value: 'specific_vendor' });
  }
  if (hasFeaturedVendorIds.value) {
    options.push({ label: 'Featured vendors', value: 'featured' });
  }
  if (hasDeliveryMethods.value) {
    options.push({ label: 'Delivery method', value: 'delivery_method' });
  }
  return options;
});

// --- Sort logic ---

function getSortBy(): string {
  switch (sortMode.value) {
    case 'price':
      return 'min_price:asc';
    case 'rating':
      return 'avg_rating:desc';
    case 'popularity':
      return 'popularity:desc';
    default: {
      // Default sort with pin toggle awareness
      if (withPins.value && hasDefaultRankWithPin.value) {
        const prefix = hasIsAvailable.value ? 'is_available:desc,' : '';
        return `${prefix}default_rank_with_pin:desc`;
      }
      if (!withPins.value && hasDefaultRank.value) {
        const prefix = hasIsAvailable.value ? 'is_available:desc,' : '';
        return `${prefix}default_rank:desc`;
      }
      // Neither rank field exists — fall back to no explicit sort (relevance)
      return '';
    }
  }
}

// --- Filter logic ---

function getFilterBy(): string {
  const filters: string[] = [];

  switch (filterContext.value) {
    case 'featured':
      filters.push('featured_vendor_ids:!=[]');
      break;
    case 'specific_vendor':
      if (vendorId.value.trim()) {
        filters.push(`vendor_ids:=[${vendorId.value.trim()}]`);
      }
      break;
    case 'delivery_method':
      if (deliveryMethod.value.trim()) {
        filters.push(`delivery_methods:=[${deliveryMethod.value.trim()}]`);
      }
      break;
  }

  // Facet filters
  for (const [field, values] of Object.entries(selectedFacets.value)) {
    if (values.length > 0) {
      filters.push(`${field}:[${values.join(',')}]`);
    }
  }

  return filters.join(' && ');
}

// --- Search ---

async function performSearch() {
  const collectionName = store.currentCollection?.name;
  if (!collectionName) {
    error.value = 'No collection selected. Please select a collection first.';
    return;
  }

  const q = searchQuery.value?.trim() || '*';
  loading.value = true;
  error.value = null;

  try {
    const api = store.api as Api;
    if (!api) {
      error.value = 'Not connected to Typesense server';
      return;
    }

    const params: Record<string, any> = {
      q,
      query_by: 'name',
      per_page: 50,
    };

    const sortBy = getSortBy();
    if (sortBy) {
      params.sort_by = sortBy;
    }

    if (facetFields.value.length > 0) {
      params.facet_by = facetFields.value.join(',');
    }

    const filterBy = getFilterBy();
    if (filterBy) {
      params.filter_by = filterBy;
    }

    const result = await api.search(collectionName, params);
    searchResult.value = result;

    // Extract facets
    if (result?.facet_counts) {
      const newFacets: Record<string, FacetValue[]> = {};
      for (const facet of result.facet_counts) {
        newFacets[facet.field_name] = (facet.counts || []).map((c: any) => ({
          value: String(c.value),
          count: c.count,
        }));
        if (!selectedFacets.value[facet.field_name]) {
          selectedFacets.value[facet.field_name] = [];
        }
      }
      facetResults.value = newFacets;
    }
  } catch (err) {
    error.value = (err as Error).message || 'Search failed';
  } finally {
    loading.value = false;
  }
}

function onFilterContextChange() {
  void performSearch();
}

// Watch facet selections to re-search
watch(selectedFacets, () => {
  void performSearch();
}, { deep: true });

// Reset filter context when filter options change (e.g., collection switch)
watch(filterContextOptions, (newOptions) => {
  if (newOptions.length > 0 && !newOptions.some(o => o.value === filterContext.value)) {
    filterContext.value = newOptions[0]!.value;
  }
}, { immediate: true });

// Reset sort mode when sort options change
watch(sortModeOptions, (newOptions) => {
  if (!newOptions.some(o => o.value === sortMode.value)) {
    sortMode.value = 'default';
  }
}, { immediate: true });
</script>
