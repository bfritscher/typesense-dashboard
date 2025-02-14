<template>
  <q-page padding>
    <q-tabs v-model="tab" dense class="bg-primary text-white" align="justify" narrow-indicator>
      <q-tab name="form" label="InstantSearch Mode" />
      <q-tab name="json" label="JSON Mode" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="tab" animated keep-alive>
      <q-tab-panel name="form">
        <search-instant-search />
      </q-tab-panel>
      <q-tab-panel name="json" class="q-pa-none">
        <search-json />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SearchJson from 'src/components/search/SearchJson.vue';
import SearchInstantSearch from 'src/components/search/SearchInstantSearch.vue';

const tab = ref('form');
</script>
<style>
.ais-Hits-item,
.ais-InfiniteHits-item,
.ais-InfiniteResults-item,
.ais-Results-item {
  border-radius: 4px;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.ais-Hits-item .text-body2 [class^='ais-'] {
  font-size: 0.875rem !important;
}

@media (max-width: 1979px) {
  .ais-Hits-item,
  .ais-InfiniteHits-item,
  .ais-InfiniteResults-item,
  .ais-Results-item {
    width: calc(33% - 1rem);
  }
}

@media (max-width: 1023px) {
  .ais-Hits-item,
  .ais-InfiniteHits-item,
  .ais-InfiniteResults-item,
  .ais-Results-item {
    width: calc(50% - 1rem);
  }
}

@media (max-width: 599px) {
  .ais-Hits-item,
  .ais-InfiniteHits-item,
  .ais-InfiniteResults-item,
  .ais-Results-item {
    width: calc(100% - 1rem);
  }
}
</style>
