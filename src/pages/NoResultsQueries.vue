<template>
  <q-page padding>
    <analytics-setup-wizard />

    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6">
          <q-icon name="sym_s_search_off" size="sm" class="q-mr-sm" />
          No Results Queries
        </div>
      </q-card-section>

      <q-card-section v-if="loading">
        <q-spinner color="primary" size="2em" class="q-mr-sm" />
        Loading no-results queries...
      </q-card-section>

      <q-card-section v-else-if="error">
        <q-banner class="bg-negative text-white rounded-borders">
          {{ error }}
        </q-banner>
      </q-card-section>

      <q-card-section v-else-if="visibleQueries.length === 0 && allQueries.length === 0">
        <q-banner class="bg-grey-3 rounded-borders">
          <template #avatar>
            <q-icon name="sym_s_info" color="grey-7" />
          </template>
          No data yet. Queries that return no results will appear here once search analytics data
          has been collected.
        </q-banner>
      </q-card-section>

      <template v-else>
        <q-card-section v-if="dismissedCount > 0">
          <q-chip
            color="grey-4"
            text-color="grey-8"
            icon="sym_s_visibility_off"
            removable
            @remove="restoreDismissed"
          >
            {{ dismissedCount }} dismissed {{ dismissedCount === 1 ? 'query' : 'queries' }}
            (click x to restore)
          </q-chip>
        </q-card-section>

        <q-table
          flat
          :rows="visibleQueries"
          :columns="columns"
          row-key="q"
          :pagination="{ rowsPerPage: 25, sortBy: 'count', descending: true }"
          :filter="filter"
        >
          <template #top-right>
            <q-input v-model="filter" borderless dense debounce="300" placeholder="Filter queries">
              <template #append>
                <q-icon name="sym_s_search" />
              </template>
            </q-input>
          </template>

          <template #body-cell-q="props">
            <q-td :props="props">
              {{ props.row.q }}
            </q-td>
          </template>

          <template #body-cell-count="props">
            <q-td :props="props" class="text-right">
              {{ props.row.count }}
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                dense
                color="primary"
                icon="sym_s_swap_horiz"
                label="Synonym"
                size="sm"
                :to="synonymRoute(props.row.q)"
                class="q-mr-xs"
              />
              <q-btn
                flat
                dense
                color="secondary"
                icon="sym_s_tune"
                label="Override"
                size="sm"
                :to="overrideRoute(props.row.q)"
                class="q-mr-xs"
              />
              <q-btn
                flat
                dense
                color="grey"
                icon="sym_s_visibility_off"
                label="Dismiss"
                size="sm"
                @click="dismissQuery(props.row.q)"
              />
            </q-td>
          </template>

          <template #no-data>
            <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
              <q-icon name="sym_s_check_circle" size="2em" />
              <span>All no-results queries have been dismissed.</span>
            </div>
          </template>
        </q-table>
      </template>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useNodeStore } from 'src/stores/node';
import { LocalStorage } from 'quasar';
import type { QTableProps } from 'quasar';
import AnalyticsSetupWizard from 'src/components/analytics/AnalyticsSetupWizard.vue';
import type { Api } from 'src/shared/api';

interface NohitsQuery {
  q: string;
  count: number;
}

const DISMISSED_STORAGE_KEY = 'typesense-dismissed-nohits-queries';

const store = useNodeStore();
const loading = ref(true);
const error = ref<string | null>(null);
const allQueries = ref<NohitsQuery[]>([]);
const dismissedQueries = ref<string[]>([]);
const filter = ref('');

// Find first non-analytics collection for synonym/override routes
const primaryCollection = computed(() => {
  const col = store.data.collections.find(
    (c) => c.name !== 'popular_queries' && c.name !== 'nohits_queries',
  );
  return col?.name || 'products';
});

const columns: QTableProps['columns'] = [
  {
    name: 'q',
    label: 'Query',
    field: 'q',
    align: 'left',
    sortable: true,
  },
  {
    name: 'count',
    label: 'Attempt Count',
    field: 'count',
    align: 'right',
    sortable: true,
    sort: (a: number, b: number) => a - b,
  },
  {
    name: 'actions',
    label: 'Actions',
    field: '',
    align: 'right',
  },
];

const visibleQueries = computed(() =>
  allQueries.value.filter((q) => !dismissedQueries.value.includes(q.q)),
);

const dismissedCount = computed(() => {
  const dismissed = new Set(dismissedQueries.value);
  return allQueries.value.filter((q) => dismissed.has(q.q)).length;
});

function synonymRoute(query: string): string {
  return `/collection/${primaryCollection.value}/synonyms?prefill=${encodeURIComponent(query)}`;
}

function overrideRoute(query: string): string {
  return `/curations/overrides?query=${encodeURIComponent(query)}`;
}

function dismissQuery(query: string) {
  if (!dismissedQueries.value.includes(query)) {
    dismissedQueries.value.push(query);
    LocalStorage.set(DISMISSED_STORAGE_KEY, dismissedQueries.value);
  }
}

function restoreDismissed() {
  dismissedQueries.value = [];
  LocalStorage.set(DISMISSED_STORAGE_KEY, []);
}

function loadDismissed() {
  const stored = LocalStorage.getItem(DISMISSED_STORAGE_KEY);
  if (Array.isArray(stored)) {
    dismissedQueries.value = stored as string[];
  }
}

async function fetchQueries() {
  loading.value = true;
  error.value = null;

  try {
    const api = store.api as Api;
    if (!api) {
      error.value = 'Not connected to Typesense server';
      return;
    }

    // Check if the nohits_queries collection exists
    const collectionNames = store.data.collections.map((c) => c.name);
    if (!collectionNames.includes('nohits_queries')) {
      allQueries.value = [];
      return;
    }

    const result = await api.search('nohits_queries', {
      q: '*',
      query_by: 'q',
      sort_by: 'count:desc',
      per_page: 250,
    });

    if (result?.hits) {
      allQueries.value = result.hits.map((hit: any) => ({
        q: hit.document.q as string,
        count: hit.document.count as number,
      }));
    } else {
      allQueries.value = [];
    }
  } catch (err) {
    const message = (err as Error).message || 'Failed to load no-results queries';
    if (message.toLowerCase().includes('not found')) {
      allQueries.value = [];
    } else {
      error.value = message;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDismissed();
  void fetchQueries();
});
</script>
