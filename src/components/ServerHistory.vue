<template>
  <q-list style="min-width: 100px">
    <q-item v-if="props.showLogout" v-close-popup clickable @click="store.logout">
      <q-item-section>Logout</q-item-section>
      <q-item-section avatar>
        <q-icon name="sym_s_logout" />
      </q-item-section>
    </q-item>
    <q-separator v-if="props.showLogout" />
    <q-item v-close-popup clickable @click="store.clearHistory">
      <q-item-section>Clear history</q-item-section>
      <q-item-section avatar>
        <q-icon name="sym_s_delete" />
      </q-item-section>
    </q-item>
    <q-separator />
    <q-item-label v-if="loginHistory.length === 0" header>No History</q-item-label>
    <q-item-label v-if="loginHistory.length > 0" header>Server History</q-item-label>
    <q-item
      v-for="(history, index) in loginHistory"
      :key="index"
      v-close-popup
      clickable
      @click="loginWithHistory(history)"
    >
      <q-item-section
        >{{ history.node.protocol }}://{{ history.node.host }}:{{
          history.node.port
        }}</q-item-section
      >
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useNodeStore } from 'src/stores/node';
import type { NodeLoginDataInterface } from 'src/stores/node';

const props = defineProps({
  showLogout: {
    type: Boolean,
    default: false,
  },
});

const store = useNodeStore();

const loginHistory = computed(() =>
  store.loginHistory.map((history) => JSON.parse(history) as NodeLoginDataInterface),
);

function loginWithHistory(history: NodeLoginDataInterface) {
  // Force redirection used the MainLayout Menu
  const forceHomeRedirect = props.showLogout;
  void store.login({ ...history, forceHomeRedirect });
}
</script>
