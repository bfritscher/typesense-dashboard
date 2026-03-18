<template>
  <q-page padding>
    <analytics-setup-wizard />

    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6">
          <q-icon name="sym_s_trending_up" size="sm" class="q-mr-sm" />
          Popular Queries
        </div>
      </q-card-section>

      <q-card-section v-if="loading">
        <q-spinner color="primary" size="2em" class="q-mr-sm" />
        Loading popular queries...
      </q-card-section>

      <q-card-section v-else-if="error">
        <q-banner class="bg-negative text-white rounded-borders">
          {{ error }}
        </q-banner>
      </q-card-section>

      <q-card-section v-else-if="queries.length === 0">
        <q-banner class="bg-grey-3 rounded-borders">
          <template #avatar>
            <q-icon name="sym_s_info" color="grey-7" />
          </template>
          No data yet. Popular queries will appear here once search analytics data has been
          collected.
        </q-banner>
      </q-card-section>

      <template v-else>
        <!-- Bar chart of top 20 queries -->
        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">Top {{ chartQueries.length }} Queries</div>
          <div class="q-gutter-y-xs">
            <div
              v-for="item in chartQueries"
              :key="item.q"
              class="row items-center q-gutter-x-sm"
              style="min-height: 28px"
            >
              <div class="col-3 col-md-2 text-right text-caption ellipsis" :title="item.q">
                {{ item.q }}
              </div>
              <div class="col">
                <div
                  :style="{
                    width: barWidth(item.count) + '%',
                    height: '20px',
                    backgroundColor: '#1976d2',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                    minWidth: '2px',
                  }"
                ></div>
              </div>
              <div class="text-caption" style="min-width: 40px">{{ item.count }}</div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Full table -->
        <q-table
          flat
          :rows="queries"
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
              <router-link
                :to="`/search/preview?q=${encodeURIComponent(props.row.q)}`"
                class="text-primary"
                style="text-decoration: none"
              >
                {{ props.row.q }}
              </router-link>
            </q-td>
          </template>
        </q-table>
      </template>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useNodeStore } from 'src/stores/node';
import type { QTableProps } from 'quasar';
import AnalyticsSetupWizard from 'src/components/analytics/AnalyticsSetupWizard.vue';
import type { Api } from 'src/shared/api';

interface PopularQuery {
  q: string;
  count: number;
}

const store = useNodeStore();
const loading = ref(true);
const error = ref<string | null>(null);
const queries = ref<PopularQuery[]>([]);
const filter = ref('');

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
    label: 'Count',
    field: 'count',
    align: 'right',
    sortable: true,
    sort: (a: number, b: number) => a - b,
  },
];

const chartQueries = computed(() => queries.value.slice(0, 20));

const maxCount = computed(() => {
  if (chartQueries.value.length === 0) return 1;
  return Math.max(...chartQueries.value.map((q) => q.count), 1);
});

function barWidth(count: number): number {
  return Math.round((count / maxCount.value) * 100);
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

    // Check if the popular_queries collection exists
    const collectionNames = store.data.collections.map((c) => c.name);
    if (!collectionNames.includes('popular_queries')) {
      queries.value = [];
      return;
    }

    const result = await api.search('popular_queries', {
      q: '*',
      query_by: 'q',
      sort_by: 'count:desc',
      per_page: 250,
    });

    if (result?.hits) {
      queries.value = result.hits.map((hit: any) => ({
        q: hit.document.q as string,
        count: hit.document.count as number,
      }));
    } else {
      queries.value = [];
    }
  } catch (err) {
    const message = (err as Error).message || 'Failed to load popular queries';
    // Treat "not found" as empty data
    if (message.toLowerCase().includes('not found')) {
      queries.value = [];
    } else {
      error.value = message;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void fetchQueries();
});
</script>
