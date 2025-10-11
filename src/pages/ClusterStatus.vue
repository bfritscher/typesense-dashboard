<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5 q-mr-md">Cluster Status</div>
      <q-space />
    </div>

    <div v-if="!store.currentClusterTag">
      <q-banner rounded class="bg-grey-2 text-grey-9 q-pa-md">
        Current server is not part of a cluster.
      </q-banner>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div
        v-for="(entry, idx) in store.clusterMembersForCurrent"
        :key="idx"
        class="col-12 col-md-6 col-lg-4"
      >
        <NodeStatusCard :entry="entry" :is-current="isCurrent(entry)" @connect="connect(entry)" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useNodeStore } from 'src/stores/node';
import type { NodeLoginDataInterface } from 'src/stores/node';
import NodeStatusCard from '../components/NodeStatusCard.vue';

const store = useNodeStore();

function isCurrent(entry: NodeLoginDataInterface) {
  const login = store.loginData;
  if (!login) return false;
  const ak = String(login.apiKey) === String(entry.apiKey);
  const sameNode = JSON.stringify(login.node) === JSON.stringify(entry.node);
  return ak && sameNode;
}

function connect(entry: NodeLoginDataInterface) {
  // Do not redirect to home from the cluster page
  store.login({ node: entry.node, apiKey: entry.apiKey });
}
</script>
