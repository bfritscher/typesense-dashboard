<template>
  <div class="fullscreen row bg-primary text-center q-pa-md flex flex-center">
    <div class="col col-md-4">
      <div>
        <h5 class="text-h5 text-white q-my-md">Typesense Dashboard</h5>
      </div>
      <div>
        <q-card bordered class="q-pa-lg shadow-1">
          <q-card-section>
            <q-form class="q-gutter-md">
              <q-input v-model="state.apiKey" filled type="password" label="Api Key" />
              <p v-if="$q.platform.is.electron">
                requires server with cors enabled only for search function.
              </p>
              <p v-else>requires server with cors enabled.</p>
              <q-select
                v-model="state.node.protocol"
                filled
                :options="state.protocolOptions"
                label="Protocol"
              />
              <q-input v-model="state.node.host" filled type="text" label="host" />
              <q-input v-model.number="state.node.port" filled type="number" label="port" />
              <q-input
                v-model="state.node.path"
                filled
                type="text"
                label="path"
                hint="optional: leave blank or start with / and end without /"
              />
              <div class="text-left">
                <q-toggle
                  v-if="$q.platform.is.electron && state.node.protocol === 'https'"
                  v-model="state.node.tls"
                  label="Check TLS"
                />
              </div>
            </q-form>
          </q-card-section>
          <q-card-section v-if="store.error">
            <p class="text-red">{{ store.error }}</p>
          </q-card-section>
          <q-card-actions class="q-px-md row">
            <q-btn
              unelevated
              color="primary"
              size="lg"
              style="flex: 1"
              label="Login"
              @click="login()"
            />
            <q-btn color="primary" size="lg" icon="sym_s_history">
              <q-menu>
                <server-history></server-history>
              </q-menu>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ServerHistory from 'components/ServerHistory.vue';
import { useNodeStore } from 'src/stores/node';
import { onMounted, ref } from 'vue';

const store = useNodeStore();

onMounted(() => {
  store.connectionCheck();
});

const state = ref({
  apiKey: '',
  node: {
    host: 'localhost',
    port: 8108,
    protocol: 'http',
    path: '',
    tls: true,
  },
  protocolOptions: ['http', 'https'],
});

function login() {
  void store.login({
    apiKey: state.value.apiKey,
    node: state.value.node,
  });
}
</script>
