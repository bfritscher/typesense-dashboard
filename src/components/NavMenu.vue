<template>
  <div class="column fit no-wrap">
    <q-list class="col overflow-auto">
      <q-item v-ripple clickable to="/" exact>
        <q-item-section avatar>
          <q-icon name="sym_s_dns" />
        </q-item-section>

        <q-item-section> Server Status </q-item-section>
      </q-item>

      <q-item v-if="!!store.currentClusterTag" v-ripple clickable :to="{ name: 'Clusters' }">
        <q-item-section avatar>
          <q-icon name="sym_s_view_column" />
        </q-item-section>

        <q-item-section> Cluster Status </q-item-section>
      </q-item>

      <!-- Merchandising Section -->
      <q-expansion-item
        v-model="sections.merchandising"
        icon="sym_s_storefront"
        label="Merchandising"
        header-class="text-weight-bold"
        dense
      >
        <q-item v-ripple clickable to="/merchandising/products" exact :disable="!store.isConnected" dense>
          <q-item-section avatar>
            <q-icon name="sym_s_sort" />
          </q-item-section>
          <q-item-section>Product Positioning</q-item-section>
        </q-item>

        <q-item v-ripple clickable to="/merchandising/vendors" exact :disable="!store.isConnected" dense>
          <q-item-section avatar>
            <q-icon name="sym_s_store" />
          </q-item-section>
          <q-item-section>Vendor Controls</q-item-section>
        </q-item>
      </q-expansion-item>

      <!-- Search Section -->
      <q-expansion-item
        v-model="sections.search"
        icon="sym_s_search"
        label="Search"
        header-class="text-weight-bold"
        dense
      >
        <q-item v-ripple clickable to="/search/debugger" exact :disable="!store.isConnected" dense>
          <q-item-section avatar>
            <q-icon name="sym_s_bug_report" />
          </q-item-section>
          <q-item-section>Query Debugger</q-item-section>
        </q-item>

        <q-item v-ripple clickable to="/search/autocomplete" exact :disable="!store.isConnected" dense>
          <q-item-section avatar>
            <q-icon name="sym_s_auto_awesome" />
          </q-item-section>
          <q-item-section>Autocomplete Preview</q-item-section>
        </q-item>
      </q-expansion-item>

      <!-- Relevance Section -->
      <q-expansion-item
        v-model="sections.relevance"
        icon="sym_s_tune"
        label="Relevance"
        header-class="text-weight-bold"
        dense
      >
        <q-item v-ripple clickable to="/relevance/ranking" exact :disable="!store.isConnected" dense>
          <q-item-section avatar>
            <q-icon name="sym_s_leaderboard" />
          </q-item-section>
          <q-item-section>Ranking Formula</q-item-section>
        </q-item>

        <q-item v-ripple clickable to="/relevance/weights" exact :disable="!store.isConnected" dense>
          <q-item-section avatar>
            <q-icon name="sym_s_balance" />
          </q-item-section>
          <q-item-section>Search Weights</q-item-section>
        </q-item>
      </q-expansion-item>

      <!-- Curations Section -->
      <q-expansion-item
        v-model="sections.curations"
        icon="sym_s_low_priority"
        label="Curations"
        header-class="text-weight-bold"
        dense
      >
        <q-item v-ripple clickable to="/curations/overrides" exact :disable="!store.isConnected" dense>
          <q-item-section avatar>
            <q-icon name="sym_s_photo_filter" />
          </q-item-section>
          <q-item-section>Overrides</q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          :to="`/collection/${currentCollection?.name}/synonyms`"
          exact
          :disable="!currentCollection"
          dense
        >
          <q-item-section avatar>
            <q-icon name="sym_s_dataset_linked" />
          </q-item-section>
          <q-item-section>Synonyms</q-item-section>
        </q-item>

        <q-item v-ripple clickable to="/stopwords" exact :disable="!store.data.features.stopwords" dense>
          <q-item-section avatar>
            <q-icon name="sym_s_playlist_remove" />
          </q-item-section>
          <q-item-section>Stopwords</q-item-section>
        </q-item>
      </q-expansion-item>

      <!-- Analytics Section -->
      <q-expansion-item
        v-model="sections.analytics"
        icon="sym_s_query_stats"
        label="Analytics"
        header-class="text-weight-bold"
        dense
        :disable="!store.data.features.analyticsRules"
      >
        <q-item v-ripple clickable to="/analytics/popular" exact :disable="!store.data.features.analyticsRules" dense>
          <q-item-section avatar>
            <q-icon name="sym_s_trending_up" />
          </q-item-section>
          <q-item-section>Popular Queries</q-item-section>
        </q-item>

        <q-item v-ripple clickable to="/analytics/noresults" exact :disable="!store.data.features.analyticsRules" dense>
          <q-item-section avatar>
            <q-icon name="sym_s_search_off" />
          </q-item-section>
          <q-item-section>No-Results Queries</q-item-section>
        </q-item>

        <q-item v-ripple clickable to="/analytics/health" exact :disable="!store.isConnected" dense>
          <q-item-section avatar>
            <q-icon name="sym_s_monitor_heart" />
          </q-item-section>
          <q-item-section>Search Health KPIs</q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          to="/analyticsrules"
          exact
          :disable="!store.data.features.analyticsRules"
          dense
        >
          <q-item-section avatar>
            <q-icon name="sym_s_rule" />
          </q-item-section>
          <q-item-section>Analytics Rules</q-item-section>
        </q-item>
      </q-expansion-item>

      <q-separator spaced />

      <!-- Existing server-level items -->
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
        to="/searchpresets"
        exact
        :disable="!store.data.features.searchPresets"
      >
        <q-item-section avatar>
          <q-icon name="sym_s_manage_search" />
        </q-item-section>

        <q-item-section> Search Presets </q-item-section>
      </q-item>

      <q-item
        v-ripple
        clickable
        to="/stemming"
        exact
        :disable="!store.data.features.stemmingDictionaries"
      >
        <q-item-section avatar>
          <q-icon name="sym_s_spellcheck" />
        </q-item-section>

        <q-item-section> Stemming </q-item-section>
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
import { computed, ref, reactive } from 'vue';
import { useNodeStore } from 'src/stores/node';
import ProjectInfo from './ProjectInfo.vue';

const store = useNodeStore();

const sections = reactive({
  merchandising: false,
  search: false,
  relevance: false,
  curations: false,
  analytics: false,
});

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
