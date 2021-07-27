<template>
  <q-page padding>
    <div class="row">
      <q-card flat bordered class="col-12 col-md-8 q-mb-md">
        <q-card-section>
          <div class="text-h5">System</div>
          <div class="text-subtitle1 q-pt-md">CPU</div>
          <div class="row">
            <div
              class="column flex-center flex-wrap q-ma-md"
              v-for="metric in Object.keys(
                $store.state.node.data.metrics
              ).filter((m) => m.includes('cpu'))"
              :key="metric"
            >
              <span class="text-overline">{{ metric.split('_')[1] }}</span>
              <q-circular-progress
                show-value
                class="text-accent"
                :value="parseFloat($store.state.node.data.metrics[metric])"
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
                      $store.state.node.data.metrics.system_memory_total_bytes,
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
                  $store.state.node.data.metrics.system_network_received_bytes,
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
      <q-card flat bordered class="col-12 col-md-3 offset-md-1 q-mb-md">
        <q-card-section>
          <div class="text-h5">Typesense</div>

          <div class="text-subtitle1 q-pt-md">Node</div>

          <div>Protocole: {{ $store.state.node.loginData?.node.protocol }}</div>
          <div>Host: {{ $store.state.node.loginData?.node.host }}</div>
          <div>Port: {{ $store.state.node.loginData?.node.port }}</div>

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
    };
  },
  mounted() {
    this.refreshInterval = window.setInterval(() => {
      void this.$store.dispatch('node/refreshServerStatus');
    }, 2000);
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
