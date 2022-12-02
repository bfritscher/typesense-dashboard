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
              <q-input
                filled
                v-model="apiKey"
                type="password"
                label="Api Key"
              />
              <p v-if="$q.platform.is.electron">
                requires server with cors enabled only for search function.
              </p>
              <p v-else>requires server with cors enabled.</p>
              <q-select
                filled
                v-model="node.protocol"
                :options="protocolOptions"
                label="Protocol"
              />
              <q-input filled v-model="node.host" type="text" label="host" />
              <q-input filled v-model="node.port" type="number" label="port" />
              <q-input filled v-model="node.path" type="text" label="path" hint="optional: leave blank or start with / and end without /"/>
              <div class="text-left">
                <q-toggle
                  v-if="$q.platform.is.electron && node.protocol === 'https'"
                  label="Check TLS"
                  v-model="node.tls"
                />
              </div>
            </q-form>
          </q-card-section>
          <q-card-section v-if="error">
            <p class="text-red">{{ error }}</p>
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

<script lang="ts">
import { NodeLoginDataInterface } from 'src/store/node/state';
import { defineComponent } from 'vue';
import ServerHistory from 'components/ServerHistory.vue';

export default defineComponent({
  name: 'Login',
  components: {
    ServerHistory,
  },
  data() {
    return {
      apiKey: '',
      node: {
        host: 'localhost',
        port: '8108',
        protocol: 'http',
        path: '',
        tls: true,
      },
      protocolOptions: ['http', 'https'],
    };
  },
  computed: {
    loginHistory() {
      return this.$store.state.node.loginHistory.map(
        (j) => JSON.parse(j) as NodeLoginDataInterface
      );
    },
    error() {
      return this.$store.state.node.error;
    },
  },
  methods: {
    login() {
      void this.$store.dispatch('node/login', {
        apiKey: this.apiKey,
        node: this.node,
      });
    },
    loginWithHistory(h: NodeLoginDataInterface) {
      void this.$store.dispatch('node/login', h);
    },
  },
});
</script>
