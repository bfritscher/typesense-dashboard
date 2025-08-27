<template>
  <div class="column fit no-wrap">
    <q-list class="col overflow-auto">
      <q-item v-ripple clickable to="/" exact>
        <q-item-section avatar>
          <q-icon name="sym_s_dns" />
        </q-item-section>

        <q-item-section> Server Status </q-item-section>
      </q-item>

      <q-item v-ripple clickable to="/collections" exact>
        <q-item-section avatar>
          <q-icon name="sym_s_grid_view" />
        </q-item-section>

        <q-item-section>
          <q-item-label>Collections</q-item-label>
        </q-item-section>
      </q-item>

      <q-item v-ripple clickable to="/aliases" exact :disable="!store.data.features.aliases">
        <q-item-section avatar>
          <q-icon name="sym_s_call_split" />
        </q-item-section>

        <q-item-section> Aliases </q-item-section>
      </q-item>

      <q-item v-ripple clickable to="/apikeys" exact :disable="!store.data.features.apiKeys">
        <q-item-section avatar>
          <q-icon name="sym_s_key" />
        </q-item-section>

        <q-item-section> API Keys </q-item-section>
      </q-item>

      <q-item
        v-ripple
        clickable
        to="/analyticsrules"
        exact
        :disable="!store.data.features.analyticsRules"
      >
        <q-item-section avatar>
          <q-icon name="sym_s_query_stats" />
        </q-item-section>

        <q-item-section> Analytics Rules </q-item-section>
      </q-item>

      <q-item
        v-ripple
        clickable
        to="/searchpresets"
        exact
        :disable="!store.data.features.searchPresets"
      >
        <q-item-section avatar>
          <q-icon name="sym_s_manage_search" />
        </q-item-section>

        <q-item-section> Search Presets </q-item-section>
      </q-item>

      <q-item v-ripple clickable to="/stopwords" exact :disable="!store.data.features.stopwords">
        <q-item-section avatar>
          <q-icon name="sym_s_playlist_remove" />
        </q-item-section>

        <q-item-section> Stopwords </q-item-section>
      </q-item>

      <q-separator spaced />

      <q-item>
        <q-item-section>
          <q-select
            v-model="currentCollection"
            borderless
            :options="filteredCollections"
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            label="Collection"
            option-label="name"
            color="white"
            label-color="white"
            dark
            @filter="collectionFilterFn"
          />
        </q-item-section>
      </q-item>

      <q-item
        v-ripple
        clickable
        :to="`/collection/${currentCollection?.name}/search`"
        exact
        :disable="!currentCollection"
      >
        <q-item-section avatar>
          <q-icon name="sym_s_search" />
        </q-item-section>

        <q-item-section> Search </q-item-section>
      </q-item>

      <q-item
        v-ripple
        clickable
        :to="`/collection/${currentCollection?.name}/synonyms`"
        exact
        :disable="!currentCollection"
      >
        <q-item-section avatar>
          <q-icon name="sym_s_dataset_linked" />
        </q-item-section>

        <q-item-section> Synonyms </q-item-section>
      </q-item>

      <q-item
        v-ripple
        clickable
        :to="`/collection/${currentCollection?.name}/curations`"
        exact
        :disable="!currentCollection"
      >
        <q-item-section avatar>
          <q-icon name="sym_s_low_priority" />
        </q-item-section>

        <q-item-section> Curations </q-item-section>
      </q-item>

      <q-item
        v-ripple
        clickable
        :to="`/collection/${currentCollection?.name}/schema`"
        exact
        :disable="!currentCollection"
      >
        <q-item-section avatar>
          <q-icon name="sym_s_data_object" />
        </q-item-section>

        <q-item-section> Schema </q-item-section>
      </q-item>

      <q-item
        v-ripple
        clickable
        :to="`/collection/${currentCollection?.name}/document`"
        exact
        :disable="!currentCollection"
      >
        <q-item-section avatar>
          <q-icon name="sym_s_library_add" />
        </q-item-section>

        <q-item-section> Add Document </q-item-section>
      </q-item>
    </q-list>
    <ProjectInfo v-if="!store.uiConfig.hideProjectInfo" />
  </div>
</template>

<script setup lang="ts">
import type { CollectionSchema } from 'typesense/lib/Typesense/Collection';
import { computed, ref } from 'vue';
import { useNodeStore } from 'src/stores/node';
import ProjectInfo from './ProjectInfo.vue';

const store = useNodeStore();

const sortedCollections = computed(() =>
  store.data.collections.slice(0).sort((a, b) => a.name.localeCompare(b.name)),
);

const filteredCollections = ref<CollectionSchema[]>([]);

function collectionFilterFn(val: string, update: (fn: () => void) => void) {
  if (val === '') {
    update(() => {
      filteredCollections.value = sortedCollections.value;
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    filteredCollections.value = sortedCollections.value.filter((v) =>
      v.name.toLowerCase().includes(needle),
    );
  });
}

const currentCollection = computed({
  get() {
    return store.currentCollection;
  },
  set(value: CollectionSchema | null) {
    store.loadCurrentCollection(value);
  },
});
</script>

<style scoped>
.q-item.q-router-link--active,
.q-item--active {
  background-color: #fff;
}
.body--dark .q-item.q-router-link--active,
.body--dark .q-item--active {
  background-color: #111827;
  color: #fff;
}
</style>
