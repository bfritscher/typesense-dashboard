<template>
  <q-list style="min-width: 100px">
    <q-item
      v-if="$props.showLogout"
      clickable
      v-close-popup
      @click="logout"
    >
      <q-item-section>Logout</q-item-section>
      <q-item-section avatar>
        <q-icon name="sym_s_logout" />
      </q-item-section>
    </q-item>
    <q-separator v-if="$props.showLogout" />
    <q-item
      clickable
      v-close-popup
      @click="$store.commit('node/clearHistory')"
    >
      <q-item-section>Clear history</q-item-section>
      <q-item-section avatar>
        <q-icon name="sym_s_delete" />
      </q-item-section>
    </q-item>
    <q-separator />
    <q-item-label header v-if="loginHistory.length === 0">No History</q-item-label>
    <q-item-label header v-if="loginHistory.length > 0">Server History</q-item-label>
    <q-item
      clickable
      v-close-popup
      v-for="(history, index) in loginHistory"
      :key="index"
      @click="loginWithHistory(history)"
    >
      <q-item-section
        >{{ history.node.protocol }}://{{ history.node.host }}:{{
          history.node.port
        }}</q-item-section>
    </q-item>
  </q-list>
</template>


<script lang="ts">
import { NodeLoginDataInterface } from 'src/store/node/state';
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'ServerHistory',
  props: {
    showLogout: {
      default: false,
    },
  },
  computed: {
    loginHistory() {
      return this.$store.state.node.loginHistory.map(
        (history) => JSON.parse(history) as NodeLoginDataInterface
      );
    },
    error() {
      return this.$store.state.node.error;
    },
  },
  methods: {
    logout() {
        void this.$store.dispatch('node/logout');
    },
    loginWithHistory(history: NodeLoginDataInterface) {
      // Force redirection used the MainLayout Menu
      const forceHomeRedirect = this.$props.showLogout;
      void this.$store.dispatch('node/login', {...history, forceHomeRedirect});
    },
  },
});
</script>
