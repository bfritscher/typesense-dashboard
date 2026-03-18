<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">
      <q-icon name="sym_s_search" size="sm" class="q-mr-sm" />
      Search Preview
    </div>

    <div class="row q-col-gutter-md">
      <!-- Left: Facet Panel -->
      <div class="col-12 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Facets</div>

            <!-- Category -->
            <div v-if="facetResults.category_id && facetResults.category_id.length > 0" class="q-mb-md">
              <div class="text-caption text-weight-bold q-mb-xs">Category</div>
              <q-option-group
                v-model="selectedFacets.category_id"
                :options="facetResults.category_id.map(f => ({ label: `${f.value} (${f.count})`, value: f.value }))"
                type="checkbox"
                dense
              />
            </div>

            <!-- Rating -->
            <div v-if="facetResults.avg_rating && facetResults.avg_rating.length > 0" class="q-mb-md">
              <div class="text-caption text-weight-bold q-mb-xs">Rating</div>
              <q-option-group
                v-model="selectedFacets.avg_rating"
                :options="facetResults.avg_rating.map(f => ({ label: `${f.value} (${f.count})`, value: f.value }))"
                type="checkbox"
                dense
              />
            </div>

            <!-- Price Range -->
            <div v-if="facetResults.price_range && facetResults.price_range.length > 0" class="q-mb-md">
              <div class="text-caption text-weight-bold q-mb-xs">Price Range</div>
              <q-option-group
                v-model="selectedFacets.price_range"
                :options="facetResults.price_range.map(f => ({ label: `${f.value} (${f.count})`, value: f.value }))"
                type="checkbox"
                dense
              />
            </div>

            <!-- Kind -->
            <div v-if="facetResults.kind && facetResults.kind.length > 0" class="q-mb-md">
              <div class="text-caption text-weight-bold q-mb-xs">Kind</div>
              <q-option-group
                v-model="selectedFacets.kind"
                :options="facetResults.kind.map(f => ({ label: `${f.value} (${f.count})`, value: f.value }))"
                type="checkbox"
                dense
              />
            </div>

            <!-- Effects -->
            <div v-if="facetResults.effects && facetResults.effects.length > 0" class="q-mb-md">
              <div class="text-caption text-weight-bold q-mb-xs">Effects</div>
              <q-option-group
                v-model="selectedFacets.effects"
                :options="facetResults.effects.map(f => ({ label: `${f.value} (${f.count})`, value: f.value }))"
                type="checkbox"
                dense
              />
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

          <!-- Pin toggle -->
          <div class="col-auto">
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

          <!-- Filter context -->
          <div class="col-auto">
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
        <div class="q-mt-md q-mb-sm text-subtitle2" v-if="searchResult">
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
              <q-badge color="primary" :label="String(index + 1)" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ hit.document?.name || hit.document?.title || hit.document?.id || 'Unknown' }}
              </q-item-label>
              <q-item-label caption>
                ID: {{ hit.document?.id }}
                <span v-if="hit.document?.is_available !== undefined">
                  &middot;
                  <q-badge
                    :color="hit.document.is_available ? 'positive' : 'grey'"
                    :label="hit.document.is_available ? 'Available' : 'Unavailable'"
                    dense
                  />
                </span>
                <span v-if="hit.document?.min_price !== undefined">
                  &middot; Price: {{ hit.document.min_price }}
                </span>
                <span v-if="hit.document?.avg_rating !== undefined">
                  &middot; Rating: {{ hit.document.avg_rating }}
                </span>
                <span v-if="hit.document?.popularity !== undefined">
                  &middot; Popularity: {{ hit.document.popularity }}
                </span>
                <span v-if="hit.document?.pin_priority !== undefined">
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNodeStore } from 'src/stores/node';
import type { Api } from 'src/shared/api';

const store = useNodeStore();
const route = useRoute();

const searchQuery = ref((route.query.q as string) || '');
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

interface FacetResults {
  category_id: FacetValue[];
  avg_rating: FacetValue[];
  price_range: FacetValue[];
  kind: FacetValue[];
  effects: FacetValue[];
}

const facetResults = ref<FacetResults>({
  category_id: [],
  avg_rating: [],
  price_range: [],
  kind: [],
  effects: [],
});

const selectedFacets = ref<Record<string, string[]>>({
  category_id: [],
  avg_rating: [],
  price_range: [],
  kind: [],
  effects: [],
});

const noFacets = computed(() => {
  return (
    facetResults.value.category_id.length === 0 &&
    facetResults.value.avg_rating.length === 0 &&
    facetResults.value.price_range.length === 0 &&
    facetResults.value.kind.length === 0 &&
    facetResults.value.effects.length === 0
  );
});

const sortModeOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Price', value: 'price' },
  { label: 'Rating', value: 'rating' },
  { label: 'THC', value: 'thc' },
  { label: 'Popularity', value: 'popularity' },
  { label: 'Distance', value: 'distance' },
];

const filterContextOptions = [
  { label: 'All vendors', value: 'all' },
  { label: 'Featured vendors', value: 'featured' },
  { label: 'Specific vendor', value: 'specific_vendor' },
  { label: 'Delivery method', value: 'delivery_method' },
];

function getSortBy(): string {
  switch (sortMode.value) {
    case 'price':
      return 'min_price:asc';
    case 'rating':
      return 'avg_rating:desc';
    case 'thc':
      return 'max_thc:desc';
    case 'popularity':
      return 'popularity:desc';
    case 'distance':
      return '_geo_dist_meters:asc';
    default:
      return withPins.value
        ? 'is_available:desc,default_rank_with_pin:desc,kind_sort:asc'
        : 'is_available:desc,default_rank:desc,kind_sort:asc';
  }
}

function getFilterBy(): string {
  const filters: string[] = [];

  // Filter context
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
      sort_by: getSortBy(),
      per_page: 50,
      facet_by: 'category_id,avg_rating,price_range,kind,effects',
    };

    const filterBy = getFilterBy();
    if (filterBy) {
      params.filter_by = filterBy;
    }

    const result = await api.search(collectionName, params);
    searchResult.value = result;

    // Extract facets
    if (result?.facet_counts) {
      const newFacets: FacetResults = {
        category_id: [],
        avg_rating: [],
        price_range: [],
        kind: [],
        effects: [],
      };
      for (const facet of result.facet_counts) {
        const field = facet.field_name as keyof FacetResults;
        if (field in newFacets) {
          newFacets[field] = (facet.counts || []).map((c: any) => ({
            value: String(c.value),
            count: c.count,
          }));
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
  performSearch();
}

// Watch facet selections to re-search
watch(selectedFacets, () => {
  performSearch();
}, { deep: true });

onMounted(() => {
  if (searchQuery.value) {
    performSearch();
  }
});
</script>
