<template>
  <q-page padding>
    <div class="row">
      <div class="col col-12 col-md-8">
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h5">System</div>
            <div class="text-subtitle1 q-pt-md">CPU</div>
            <q-linear-progress
              v-if="hasCpuOverall"
              size="25px"
              :value="cpuOverallRatio"
              color="accent"
            >
              <div class="absolute-full flex flex-center">
                <q-badge color="white" text-color="accent" :label="`${cpuOverallPercent}%`" />
              </div>
            </q-linear-progress>

            <div class="row q-mt-sm">
              <div
                v-for="cpu in sortedCPU"
                :key="cpu.node"
                class="col-6 col-sm-4 col-md-3 col-lg-2 q-mb-md flex flex-center"
              >
                <div class="column items-center">
                  <span class="text-overline">CPU {{ cpu.node }}</span>
                  <q-circular-progress
                    show-value
                    :value="cpu.value"
                    size="50px"
                    color="accent"
                    track-color="grey-3"
                  />
                </div>
              </div>
            </div>
            <div class="text-subtitle1 q-pt-md">Memory</div>
            <q-linear-progress
              size="25px"
              :value="
                parseInt(store.data.metrics.system_memory_used_bytes, 10) /
                parseInt(store.data.metrics.system_memory_total_bytes, 10)
              "
              color="accent"
            >
              <div class="absolute-full flex flex-center">
                <q-badge
                  color="white"
                  text-color="accent"
                  :label="prettyBytes(parseInt(store.data.metrics.system_memory_used_bytes, 10))"
                />
              </div>
              <div class="absolute-full flex justify-end">
                <q-badge
                  color="white"
                  text-color="accent"
                  :label="prettyBytes(parseInt(store.data.metrics.system_memory_total_bytes, 10))"
                />
              </div>
            </q-linear-progress>

            <div class="text-subtitle1 q-pt-md">Disk</div>

            <q-linear-progress
              size="25px"
              :value="
                parseInt(store.data.metrics.system_disk_used_bytes, 10) /
                parseInt(store.data.metrics.system_disk_total_bytes, 10)
              "
              color="accent"
            >
              <div class="absolute-full flex flex-center">
                <q-badge
                  color="white"
                  text-color="accent"
                  :label="prettyBytes(parseInt(store.data.metrics.system_disk_used_bytes, 10))"
                />
              </div>
              <div class="absolute-full flex justify-end">
                <q-badge
                  color="white"
                  text-color="accent"
                  :label="prettyBytes(parseInt(store.data.metrics.system_disk_total_bytes, 10))"
                />
              </div>
            </q-linear-progress>
            <div class="text-subtitle1 q-pt-md">System Network</div>
            <div>
              Received:
              {{ prettyBytes(parseInt(store.data.metrics.system_network_received_bytes, 10)) }}
              Sent:
              {{ prettyBytes(parseInt(store.data.metrics.system_network_sent_bytes, 10)) }}
            </div>
          </q-card-section>
        </q-card>
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h5 q-mb-md">Operations</div>
            <div class="text-subtitle1 q-pt-md">Cache</div>
            <p>
              Responses of search requests that are sent with use_cache parameter are cached in a
              LRU cache.
            </p>
            <q-btn
              label="Clear Search Cache"
              color="accent"
              unelevated
              size="md"
              padding="sm lg"
              @click="store.clearCache"
            />
            <div class="text-subtitle1 q-pt-md">Slow Request Log</div>
            <p>Slow requests are logged to the primary log file, with the prefix SLOW REQUEST</p>
            <q-input
              v-model.number="slowQueryThreshold"
              outlined
              label="Threshold (ms)"
              type="number"
              hint="Enable logging of requests that take over a defined threshold of time. (-1 to disable)"
            >
              <template #after>
                <q-btn
                  unelevated
                  label="set"
                  color="accent"
                  size="md"
                  padding="sm lg"
                  @click="store.slowQueryThreshold(slowQueryThreshold)"
                />
              </template>
            </q-input>
            <div class="text-subtitle1 q-pt-md">Compacting the on-disk database</div>
            <p>Recommended to run it during off-peak hours.</p>
            <q-btn
              label="Compact Database"
              color="accent"
              unelevated
              size="md"
              padding="sm lg"
              @click="store.operationCompactDB"
            />
            <div class="text-subtitle1 q-pt-md">Create Snapshot</div>
            <p>
              Creates a point-in-time snapshot of the node's state and data for backup purposes.
            </p>
            <q-btn
              label="Create Snapshot"
              color="accent"
              unelevated
              size="md"
              padding="sm lg"
              @click="showSnapshotDialog()"
            />
          </q-card-section>
        </q-card>
      </div>
      <q-card flat bordered class="col-12 col-md-3 offset-md-1 q-mb-md">
        <q-card-section>
          <div class="text-h5">Typesense</div>

          <div class="text-subtitle1 q-pt-md">
            Node
            <health-tag :health="store.data.health"></health-tag>
          </div>

          <div>Protocol: {{ store.loginData?.node.protocol }}</div>
          <div>Host: {{ store.loginData?.node.host }}</div>
          <div>Port: {{ store.loginData?.node.port }}</div>
          <div v-if="store.data.debug.version">Version: {{ store.data.debug.version }}</div>
          <div v-if="Object.hasOwnProperty.call(store.data.debug, 'state')">
            Role:
            {{ store.data.debug.state === 1 ? 'Leader' : 'Follower' }}
          </div>

          <template v-if="store.currentClusterTag">
            <div class="text-subtitle1 q-pt-md">Cluster: {{ store.currentClusterTag }}</div>
            <q-list dense separator class="q-mt-xs">
              <q-item
                v-for="(member, idx) in store.clusterMembersForCurrent"
                :key="idx"
                clickable
                :disable="store.isCurrent(member)"
                @click="connectTo(member)"
              >
                <q-item-section>
                  {{ member.node.protocol }}://{{ member.node.host }}:{{ member.node.port }}
                </q-item-section>
                <q-item-section side>
                  <q-chip
                    v-if="store.isCurrent(member)"
                    color="positive"
                    text-color="white"
                    dense
                    size="sm"
                  >
                    Current
                  </q-chip>
                  <q-btn v-else flat dense size="sm" label="Connect" />
                </q-item-section>
              </q-item>
            </q-list>
          </template>

          <div class="text-subtitle1 q-pt-md">Memory</div>
          <div
            v-for="metric in Object.keys(store.data.metrics).filter((m) => m.includes('typesense'))"
            :key="metric"
          >
            {{ metric.split('_')[2] }} :
            {{
              metric.includes('bytes')
                ? prettyBytes(parseInt(store.data.metrics[metric], 10))
                : store.data.metrics[metric]
            }}
          </div>
          <div class="text-subtitle1 q-pt-md">Stats</div>
          <div v-if="!store.data.features.stats">Stats are not enabled on this node.</div>
          <div v-for="(content, label) in store.data.stats" :key="label">
            <div v-if="isObject(content)">
              {{ label }}
              <div v-for="(value, entry) in content" :key="entry">{{ entry }} : {{ value }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Create Snapshot Dialog -->
    <q-dialog v-model="isSnapshotDialogVisible" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Create Snapshot</div>
          <div class="text-subtitle2 text-grey-7 q-mt-sm">
            Enter the directory path where the snapshot should be saved on the server.
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="snapshotPath"
            outlined
            label="Snapshot Path"
            hint="Example: /tmp/typesense-data-snapshot"
            :rules="[(val) => (val && val.length > 0) || 'Snapshot path is required']"
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" @click="cancelSnapshot" />
          <q-btn
            flat
            label="Create Snapshot"
            color="accent"
            :disable="!isSnapshotPathValid"
            @click="createSnapshot"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { useNodeStore } from 'src/stores/node';
import type { NodeLoginDataInterface } from 'src/stores/node';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import prettyBytes from 'pretty-bytes';
import HealthTag from 'src/components/HealthTag.vue';

const store = useNodeStore();

const refreshInterval = ref<number | undefined>(undefined);
const slowQueryThreshold = ref<number>(-1);
const isSnapshotDialogVisible = ref<boolean>(false);
const snapshotPath = ref<string>('/tmp/typesense-data-snapshot');

function isObject(obj: unknown) {
  return typeof obj === 'object';
}

function showSnapshotDialog() {
  snapshotPath.value = `/tmp/typesense-data-snapshot-${new Date().toISOString().replace(/:\d{2}\.\d{3}Z$/, '')}`;
  isSnapshotDialogVisible.value = true;
}

function cancelSnapshot() {
  isSnapshotDialogVisible.value = false;
  snapshotPath.value = '/tmp/typesense-data-snapshot';
}

function createSnapshot() {
  if (isSnapshotPathValid.value) {
    void store.createSnapshot(snapshotPath.value);
    isSnapshotDialogVisible.value = false;
  }
}

const isSnapshotPathValid = computed(() => {
  return snapshotPath.value && snapshotPath.value.length > 0;
});

onMounted(() => {
  refreshInterval.value = window.setInterval(() => {
    store.refreshServerStatus();
  }, 2000);
});

onBeforeUnmount(() => {
  window.clearInterval(refreshInterval.value);
});

const sortedCPU = computed(() => {
  return Object.entries(store.data.metrics)
    .filter(([key]) => /^system_cpu\d+_active_percentage$/.test(key))
    .map(([key, value]) => {
      let node = 0;
      const keyData = key.split('_');
      if (keyData.length > 1 && keyData[1]) {
        node = parseInt(keyData[1].replace('cpu', '')) || 0;
      }
      return {
        node,
        value: parseFloat(value as string),
      };
    })
    .sort((a, b) => a.node - b.node);
});

const hasCpuOverall = computed(() =>
  Object.prototype.hasOwnProperty.call(store.data.metrics, 'system_cpu_active_percentage'),
);

const cpuOverallRatio = computed(() => {
  const metrics = store.data.metrics as Record<string, unknown> | undefined;
  const raw = metrics ? metrics['system_cpu_active_percentage'] : undefined;
  const v = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseFloat(raw) : NaN;
  if (!isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v / 100));
});

const cpuOverallPercent = computed(() => Math.round(cpuOverallRatio.value * 100));

function connectTo(member: NodeLoginDataInterface) {
  void store.login({ apiKey: member.apiKey, node: member.node, forceHomeRedirect: true });
}
</script>
