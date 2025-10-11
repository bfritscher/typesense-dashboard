<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="row items-center no-wrap q-mb-sm">
        <div class="text-subtitle1">
          {{ entry.node.protocol }}://{{ entry.node.host }}:{{ entry.node.port }}
        </div>
        <q-space />
        <q-badge v-if="version" color="info" outline> v{{ version }} </q-badge>
      </div>
      <div class="row items-center no-wrap q-mb-xs">
        <div class="text-caption">
          <template v-if="role">
            <q-chip v-if="role === 'Leader'" color="positive" text-color="white" dense square>
              Leader
            </q-chip>
            <q-chip v-else color="grey-6" text-color="white" dense square>Follower</q-chip>
          </template>
          <template v-else> Role: - </template>
        </div>
        <q-space />
        <div>
          <health-tag :health="health" />
          <q-chip v-if="isCurrent" color="positive" text-color="white" dense>Current</q-chip>
          <q-btn v-else dense flat size="sm" label="Connect" @click="$emit('connect')" />
        </div>
      </div>
      <div v-if="error" class="text-negative text-body2">{{ error }}</div>
      <div v-else>
        <div class="q-mb-sm">CPU</div>
        <q-linear-progress
          v-if="hasCpuOverall"
          size="12px"
          :value="cpuOverallRatio"
          color="accent"
        />
        <div class="text-caption q-mt-xs">
          <template v-if="hasCpuOverall">
            {{ cpuOverallPercent }}% · {{ coreCount }} cores
          </template>
          <template v-else> - </template>
        </div>

        <div class="q-mb-sm">Memory</div>
        <q-linear-progress
          v-if="metrics.system_memory_total_bytes && metrics.system_memory_used_bytes"
          size="12px"
          :value="memRatio"
          color="accent"
        />
        <div class="text-caption q-mt-xs">
          {{ prettyBytesNum(metrics.system_memory_used_bytes) }} /
          {{ prettyBytesNum(metrics.system_memory_total_bytes) }}
        </div>

        <div class="q-mt-md q-mb-sm">Disk</div>
        <q-linear-progress
          v-if="metrics.system_disk_total_bytes && metrics.system_disk_used_bytes"
          size="12px"
          :value="diskRatio"
          color="accent"
        />
        <div class="text-caption q-mt-xs">
          {{ prettyBytesNum(metrics.system_disk_used_bytes) }} /
          {{ prettyBytesNum(metrics.system_disk_total_bytes) }}
        </div>

        <div class="q-mt-md q-mb-xs">Typesense Memory</div>
        <div class="text-caption">
          <div
            v-for="metric in Object.keys(metrics).filter((m) => m.includes('typesense'))"
            :key="metric"
          >
            {{ metric.split('_')[2] }} :
            {{ metric.includes('bytes') ? prettyBytesNum(metrics[metric]) : metrics[metric] }}
          </div>
        </div>

        <div class="q-mt-md q-mb-xs">System Network</div>
        <div class="text-caption">
          Rx: {{ prettyBytesNum(metrics.system_network_received_bytes) }} · Tx:
          {{ prettyBytesNum(metrics.system_network_sent_bytes) }}
        </div>

        <div class="q-mt-md q-mb-xs">Stats</div>
        <div v-if="!hasStats" class="text-caption">Stats are not enabled on this node.</div>
        <div v-else class="scroll">
          <div v-for="(content, label) in safeStats" :key="String(label)">
            <div v-if="isObject(content)">
              <div class="text-caption q-mt-xs">{{ label }}</div>
              <div
                v-for="(value, statKey) in content as Record<string, any>"
                :key="String(statKey)"
                class="row no-wrap justify-between"
              >
                <div class="text-caption">{{ statKey }}</div>
                <div class="text-caption">{{ value }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-caption q-mt-md">Updated: {{ lastUpdatedLabel }}</div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import prettyBytes from 'pretty-bytes';
import { Api } from 'src/shared/api';
import type { NodeLoginDataInterface, Health } from 'src/stores/node';
import HealthTag from 'src/components/HealthTag.vue';

const props = defineProps<{
  entry: NodeLoginDataInterface;
  refreshTrigger?: number;
  isCurrent?: boolean;
}>();

defineEmits<(e: 'connect') => void>();

const api = new Api();
const metrics = ref<Record<string, any>>({});
const debugInfo = ref<any>({});
const stats = ref<Record<string, any>>({});
const health = ref<Health | null>(null);
const error = ref<string | null>(null);
const intervalId = ref<number | undefined>(undefined);
const lastUpdated = ref<number | null>(null);

function initApi() {
  api.init({ node: props.entry.node, apiKey: props.entry.apiKey });
}

async function fetchAll() {
  try {
    error.value = null;
    const [m, d, s, h] = await Promise.all([
      Promise.resolve(api.get('/metrics.json')),
      Promise.resolve(api.getDebug()),
      Promise.resolve(api.get('/stats.json')).catch(() => undefined),
      Promise.resolve(api.get('/health')).catch(() => undefined),
    ]);

    function isObject(x: unknown): x is Record<string, unknown> {
      return x !== null && typeof x === 'object';
    }
    function hasDataField(x: unknown): x is { data: any } {
      return isObject(x) && 'data' in x;
    }

    const mData: any = hasDataField(m) ? m.data : (m ?? {});
    metrics.value = mData || {};
    debugInfo.value = d || {};
    const sData: any = hasDataField(s) ? (s as { data: any }).data : (s ?? {});
    stats.value = sData || {};
    health.value = h.data || null;
    lastUpdated.value = Date.now();
  } catch (e: any) {
    error.value = e?.message || 'Failed to fetch';
  }
}

const memRatio = computed(() => {
  const used = parseInt(String(metrics.value.system_memory_used_bytes || 0), 10);
  const total = parseInt(String(metrics.value.system_memory_total_bytes || 1), 10);
  return total > 0 ? used / total : 0;
});

const diskRatio = computed(() => {
  const used = parseInt(String(metrics.value.system_disk_used_bytes || 0), 10);
  const total = parseInt(String(metrics.value.system_disk_total_bytes || 1), 10);
  return total > 0 ? used / total : 0;
});

const hasCpuOverall = computed(() =>
  Object.prototype.hasOwnProperty.call(metrics.value || {}, 'system_cpu_active_percentage'),
);

const cpuOverallRatio = computed(() => {
  const raw = (metrics.value || {})['system_cpu_active_percentage'];
  const v = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseFloat(raw) : NaN;
  if (!isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v / 100));
});

const cpuOverallPercent = computed(() => Math.round(cpuOverallRatio.value * 100));

const coreCount = computed(() => {
  const m = metrics.value || {};
  return Object.keys(m).filter((k) => /^system_cpu\d+_active_percentage$/.test(k)).length;
});

const version = computed(() => debugInfo.value?.version);
const role = computed(() =>
  Object.hasOwn(debugInfo.value || {}, 'state')
    ? debugInfo.value.state === 1
      ? 'Leader'
      : 'Follower'
    : undefined,
);

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) return '—';
  const diff = Math.round((Date.now() - lastUpdated.value) / 1000);
  return `${diff}s ago`;
});

function prettyBytesNum(v?: string | number) {
  if (!v && v !== 0) return '-';
  return prettyBytes(parseInt(String(v), 10));
}

const hasStats = computed(() => Object.keys(stats.value || {}).length > 0);
const safeStats = computed(() => stats.value || {});
function isObject(obj: unknown) {
  return typeof obj === 'object' && obj !== null;
}

onMounted(() => {
  initApi();
  void fetchAll();
  intervalId.value = window.setInterval(() => void fetchAll(), 2000);
});

onBeforeUnmount(() => {
  if (intervalId.value) window.clearInterval(intervalId.value);
});

watch(
  () => props.refreshTrigger,
  () => void fetchAll(),
);
</script>
