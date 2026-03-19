<template>
  <q-page padding>
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12">
        <div class="row items-center justify-between">
          <div class="text-h5">
            <q-icon name="sym_s_monitoring" size="sm" class="q-mr-sm" />
            Search Health KPIs
          </div>
          <div class="row items-center q-gutter-sm">
            <q-badge :color="autoRefreshEnabled ? 'positive' : 'grey'" class="q-pa-xs">
              {{ autoRefreshEnabled ? 'Auto-refresh ON' : 'Auto-refresh OFF' }}
            </q-badge>
            <q-select
              v-model="refreshIntervalSeconds"
              :options="intervalOptions"
              emit-value
              map-options
              dense
              outlined
              style="min-width: 120px"
              label="Interval"
            />
            <q-btn
              flat
              dense
              :icon="autoRefreshEnabled ? 'sym_s_pause' : 'sym_s_play_arrow'"
              :color="autoRefreshEnabled ? 'negative' : 'positive'"
              @click="toggleAutoRefresh"
            />
            <q-btn flat dense icon="sym_s_refresh" color="primary" @click="refreshAll" />
          </div>
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="row q-col-gutter-md q-mb-md">
      <!-- Node Health -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-caption text-grey">Node Health</div>
            <div class="q-mt-sm">
              <q-icon
                :name="healthIcon"
                :color="healthColor"
                size="3em"
              />
            </div>
            <div class="text-subtitle1 q-mt-xs" :class="`text-${healthColor}`">
              {{ healthLabel }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Request Rate -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-caption text-grey">Total Requests</div>
            <div class="text-h4 q-mt-sm">{{ totalRequests }}</div>
            <div class="text-caption text-grey">from /stats.json</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Search Latency -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-caption text-grey">Search Latency</div>
            <div class="text-h4 q-mt-sm">{{ searchLatency }}</div>
            <div class="text-caption text-grey">avg ms</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Index Size -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-caption text-grey">Index Size (products)</div>
            <div class="text-h4 q-mt-sm">{{ docCount }}</div>
            <div class="text-caption text-grey">documents</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Index Freshness -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6">
          <q-icon name="sym_s_update" size="sm" class="q-mr-sm" />
          Index Freshness
        </div>
      </q-card-section>

      <q-card-section v-if="!productsCollectionExists">
        <q-banner class="bg-grey-3 rounded-borders">
          <template #avatar>
            <q-icon name="sym_s_info" color="grey-7" />
          </template>
          No <strong>products</strong> collection found. Index freshness data is unavailable.
        </q-banner>
      </q-card-section>

      <q-card-section v-else>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey">Document Count</div>
            <div class="text-h5">{{ docCount }}</div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey">Most Recent Document</div>
            <div class="text-h5">{{ latestDocTimestamp || 'N/A' }}</div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey">Freshness</div>
            <div class="row items-center q-gutter-sm">
              <q-icon
                name="sym_s_circle"
                :color="freshnessColor"
                size="1.5em"
              />
              <span class="text-subtitle1">{{ freshnessLabel }}</span>
            </div>
            <div class="text-caption text-grey q-mt-xs">
              {{ freshnessDescription }}
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Stats Details -->
    <q-card v-if="!statsAvailable" flat bordered>
      <q-card-section>
        <q-banner class="bg-warning text-white rounded-borders">
          <template #avatar>
            <q-icon name="sym_s_warning" color="white" />
          </template>
          Stats endpoint is not available. The server may not have analytics/stats enabled.
        </q-banner>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useNodeStore } from 'src/stores/node';
import type { Api } from 'src/shared/api';

const store = useNodeStore();

const refreshIntervalSeconds = ref(5);
const autoRefreshEnabled = ref(true);
let intervalHandle: number | undefined;

const healthOk = ref<boolean | null>(null);
const statsData = ref<Record<string, any>>({});
const productsDocCount = ref<number>(0);
const productsCollectionExists = ref(false);
const latestDocTimestamp = ref<string | null>(null);
const latestDocAge = ref<number | null>(null); // milliseconds

const intervalOptions = [
  { label: '2s', value: 2 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
];

const statsAvailable = computed(() => store.data.features.stats);

const healthColor = computed(() => {
  if (healthOk.value === null) return 'grey';
  return healthOk.value ? 'positive' : 'negative';
});

const healthIcon = computed(() => {
  if (healthOk.value === null) return 'sym_s_help';
  return healthOk.value ? 'sym_s_check_circle' : 'sym_s_error';
});

const healthLabel = computed(() => {
  if (healthOk.value === null) return 'Unknown';
  return healthOk.value ? 'Healthy' : 'Unhealthy';
});

const totalRequests = computed(() => {
  const val = statsData.value?.total_requests_per_second;
  if (val !== undefined && val !== null) return String(val);
  // Fallback: try to read from nested latency_ms keys
  const keys = Object.keys(statsData.value || {});
  const requestKey = keys.find((k) => k.includes('total_requests'));
  if (requestKey) return String(statsData.value[requestKey]);
  return '--';
});

const searchLatency = computed(() => {
  const latencyMs = statsData.value?.search_latency_ms;
  if (latencyMs !== undefined && latencyMs !== null) return String(latencyMs);
  const keys = Object.keys(statsData.value || {});
  const latencyKey = keys.find((k) => k.includes('latency'));
  if (latencyKey) return String(statsData.value[latencyKey]);
  return '--';
});

const docCount = computed(() =>
  productsCollectionExists.value ? productsDocCount.value.toLocaleString() : '--',
);

// Freshness: green (<5 min), yellow (<30 min), red (>30 min)
const freshnessColor = computed(() => {
  if (latestDocAge.value === null) return 'grey';
  const minutes = latestDocAge.value / (1000 * 60);
  if (minutes < 5) return 'positive';
  if (minutes < 30) return 'warning';
  return 'negative';
});

const freshnessLabel = computed(() => {
  if (latestDocAge.value === null) return 'Unknown';
  const minutes = latestDocAge.value / (1000 * 60);
  if (minutes < 5) return 'Fresh';
  if (minutes < 30) return 'Stale';
  return 'Outdated';
});

const freshnessDescription = computed(() => {
  if (latestDocAge.value === null) return 'Could not determine latest document age.';
  const minutes = Math.round(latestDocAge.value / (1000 * 60));
  if (minutes < 60) return `Last document indexed ${minutes} minute${minutes !== 1 ? 's' : ''} ago.`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `Last document indexed ${hours} hour${hours !== 1 ? 's' : ''} ago.`;
  const days = Math.round(hours / 24);
  return `Last document indexed ${days} day${days !== 1 ? 's' : ''} ago.`;
});

async function fetchHealth() {
  try {
    const api = store.api as Api;
    if (!api) return;
    const response = await api.get('/health');
    healthOk.value = response?.data?.ok ?? null;
  } catch {
    healthOk.value = false;
  }
}

async function fetchStats() {
  try {
    const api = store.api as Api;
    if (!api) return;
    const response = await api.get('/stats.json');
    if (response?.data) {
      statsData.value = response.data;
    }
  } catch {
    statsData.value = {};
  }
}

async function fetchProductsInfo() {
  try {
    const api = store.api as Api;
    if (!api) return;

    const collection = store.data.collections.find((c) => c.name === 'products');
    if (!collection) {
      productsCollectionExists.value = false;
      return;
    }

    productsCollectionExists.value = true;
    productsDocCount.value = (collection as any).num_documents ?? 0;

    // Try to get the most recent document by created_at
    try {
      const result = await api.search('products', {
        q: '*',
        query_by: 'name',
        sort_by: 'created_at:desc',
        per_page: 1,
      });

      if (result?.hits && result.hits.length > 0) {
        const doc = result.hits[0]?.document as Record<string, any> | undefined;
        if (!doc) return;
        const createdAt = doc.created_at;
        if (typeof createdAt === 'number') {
          // Unix timestamp (seconds)
          const date = new Date(createdAt * 1000);
          latestDocTimestamp.value = date.toLocaleString();
          latestDocAge.value = Date.now() - date.getTime();
        } else if (typeof createdAt === 'string') {
          const date = new Date(createdAt);
          if (!isNaN(date.getTime())) {
            latestDocTimestamp.value = date.toLocaleString();
            latestDocAge.value = Date.now() - date.getTime();
          } else {
            latestDocTimestamp.value = createdAt;
            latestDocAge.value = null;
          }
        } else {
          latestDocTimestamp.value = null;
          latestDocAge.value = null;
        }
      }
    } catch {
      // The products collection may not have a created_at field; that's fine
      latestDocTimestamp.value = null;
      latestDocAge.value = null;
    }
  } catch {
    productsCollectionExists.value = false;
  }
}

async function refreshAll() {
  await Promise.all([fetchHealth(), fetchStats(), fetchProductsInfo()]);
}

function startAutoRefresh() {
  stopAutoRefresh();
  if (autoRefreshEnabled.value) {
    intervalHandle = window.setInterval(() => {
      void refreshAll();
    }, refreshIntervalSeconds.value * 1000);
  }
}

function stopAutoRefresh() {
  if (intervalHandle !== undefined) {
    window.clearInterval(intervalHandle);
    intervalHandle = undefined;
  }
}

function toggleAutoRefresh() {
  autoRefreshEnabled.value = !autoRefreshEnabled.value;
  if (autoRefreshEnabled.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}

// Watch for interval changes
import { watch } from 'vue';
watch(refreshIntervalSeconds, () => {
  if (autoRefreshEnabled.value) {
    startAutoRefresh();
  }
});

onMounted(async () => {
  await refreshAll();
  startAutoRefresh();
});

onBeforeUnmount(() => {
  stopAutoRefresh();
});
</script>
