<template>
  <q-page padding>
    <div class="row">
      <div class="col col-12 col-md-8">
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h5">System</div>
            <div class="text-subtitle1 q-pt-md">CPU</div>
            <div class="row">
              <div
                class="column flex-center flex-wrap q-ma-md"
                v-for="cpu in sortedCPU"
                :key="cpu.node"
              >
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
            <div class="text-subtitle1 q-pt-md">Memory</div>
            <q-linear-progress
              size="25px"
              :value="
                parseInt(
                  $store.state.node.data.metrics.system_memory_used_bytes,
                  10
                ) /
                parseInt(
                  $store.state.node.data.metrics.system_memory_total_bytes,
                  10
                )
              "
              color="accent"
            >
              <div class="absolute-full flex flex-center">
                <q-badge
                  color="white"
                  text-color="accent"
                  :label="
                    prettyBytes(
                      parseInt(
                        $store.state.node.data.metrics.system_memory_used_bytes,
                        10
                      )
                    )
                  "
                />
              </div>
              <div class="absolute-full flex justify-end">
                <q-badge
                  color="white"
                  text-color="accent"
                  :label="
                    prettyBytes(
                      parseInt(
                        $store.state.node.data.metrics
                          .system_memory_total_bytes,
                        10
                      )
                    )
                  "
                />
              </div>
            </q-linear-progress>

            <div class="text-subtitle1 q-pt-md">Disk</div>

            <q-linear-progress
              size="25px"
              :value="
                parseInt(
                  $store.state.node.data.metrics.system_disk_used_bytes,
                  10
                ) /
                parseInt(
                  $store.state.node.data.metrics.system_disk_total_bytes,
                  10
                )
              "
              color="accent"
            >
              <div class="absolute-full flex flex-center">
                <q-badge
                  color="white"
                  text-color="accent"
                  :label="
                    prettyBytes(
                      parseInt(
                        $store.state.node.data.metrics.system_disk_used_bytes,
                        10
                      )
                    )
                  "
                />
              </div>
              <div class="absolute-full flex justify-end">
                <q-badge
                  color="white"
                  text-color="accent"
                  :label="
                    prettyBytes(
                      parseInt(
                        $store.state.node.data.metrics.system_disk_total_bytes,
                        10
                      )
                    )
                  "
                />
              </div>
            </q-linear-progress>
            <div class="text-subtitle1 q-pt-md">System Network</div>
            <div>
              Received:
              {{
                prettyBytes(
                  parseInt(
                    $store.state.node.data.metrics
                      .system_network_received_bytes,
                    10
                  )
                )
              }}
              Sent:
              {{
                prettyBytes(
                  parseInt(
                    $store.state.node.data.metrics.system_network_sent_bytes,
                    10
                  )
                )
              }}
            </div>
          </q-card-section>
        </q-card>
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h5 q-mb-md">Operations</div>
            <div class="text-subtitle1 q-pt-md">Cache</div>
            <p>
              Responses of search requests that are sent with use_cache
              parameter are cached in a LRU cache.
            </p>
            <q-btn
              label="Clear Search Cache"
              color="accent"
              unelevated
              size="md"
              padding="sm lg"
              @click="$store.dispatch('node/clearCache')"
            />
            <div class="text-subtitle1 q-pt-md">Slow Request Log</div>
            <p>
              Slow requests are logged to the primary log file, with the prefix
              SLOW REQUEST
            </p>
            <q-input
              outlined
              label="Threshold (ms)"
              type="number"
              v-model.number="slowQueryThreshold"
              hint="Enable logging of requests that take over a defined threshold of time. (-1 to disable)"
            >
              <template v-slot:after>
                <q-btn
                  unelevated
                  label="set"
                  color="accent"
                  size="md"
                  padding="sm lg"
                  @click="$store.dispatch('node/slowQueryThreshold', slowQueryThreshold)"
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
              @click="$store.dispatch('node/operationCompactDB')"
            />
          </q-card-section>
        </q-card>
      </div>
      <q-card flat bordered class="col-12 col-md-3 offset-md-1 q-mb-md">
        <q-card-section>
          <div class="text-h5">Typesense</div>

          <div class="text-subtitle1 q-pt-md">Node</div>

          <div>Protocol: {{ $store.state.node.loginData?.node.protocol }}</div>
          <div>Host: {{ $store.state.node.loginData?.node.host }}</div>
          <div>Port: {{ $store.state.node.loginData?.node.port }}</div>
          <div>Version: {{ $store.state.node.data.debug.version }}</div>
          <div
            v-if="
              Object.hasOwnProperty.call($store.state.node.data.debug, 'state')
            "
          >
            Role:
            {{
              $store.state.node.data.debug.state === 1 ? 'Leader' : 'Follower'
            }}
          </div>

          <div class="text-subtitle1 q-pt-md">Memory</div>
          <div
            v-for="metric in Object.keys($store.state.node.data.metrics).filter(
              (m) => m.includes('typesense')
            )"
            :key="metric"
          >
            {{ metric.split('_')[2] }} :
            {{
              metric.includes('bytes')
                ? prettyBytes(
                    parseInt($store.state.node.data.metrics[metric], 10)
                  )
                : $store.state.node.data.metrics[metric]
            }}
          </div>
          <div class="text-subtitle1 q-pt-md">Stats</div>
          <div v-if="!$store.state.node.data.features.stats">
            Stats are not enabled on this node.
          </div>
          <div
            v-for="(content, label) in $store.state.node.data.stats"
            :key="label"
          >
            <div v-if="isObject(content)">
              {{ label }}
              <div v-for="(value, entry) in content" :key="entry">
                {{ entry }} : {{ value }}
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import prettyBytes from 'pretty-bytes';

export default defineComponent({
  name: 'serverStatus',
  data() {
    return {
      refreshInterval: undefined as number | undefined,
      slowQueryThreshold: -1 as number,
    };
  },
  mounted() {
    this.refreshInterval = window.setInterval(() => {
      void this.$store.dispatch('node/refreshServerStatus');
    }, 2000);
  },
  computed: {
    sortedCPU() {
      return Object.entries(this.$store.state.node.data.metrics)
        .filter(([key]) => key.includes('cpu'))
        .map(([key, value]) => {
          return { node: parseInt(key.split('_')[1].replace('cpu', ''))  || 0, value: parseFloat(<string>value) }
        })
        .sort((a, b) => a.node - b.node)
    }
  },
  methods: {
    prettyBytes,
    isObject(obj: unknown) {
      return typeof obj === 'object';
    },
  },
  beforeUnmount() {
    window.clearInterval(this.refreshInterval);
  },
});
</script>
