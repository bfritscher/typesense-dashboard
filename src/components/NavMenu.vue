<template>
  <div class="column fit no-wrap">
    <q-list class="col overflow-auto">
      <!-- Collection Selector -->
      <q-item class="collection-selector">
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

      <!-- Server Section -->
      <q-expansion-item
        v-model="sections.server"
        icon="sym_s_dns"
        label="Server"
        header-class="text-weight-bold"
        dense
      >
        <q-item v-ripple clickable to="/" exact dense>
          <q-item-section avatar>
            <q-icon name="sym_s_dns" />
          </q-item-section>
          <q-item-section>Server Status</q-item-section>
        </q-item>

        <q-item v-if="!!store.currentClusterTag" v-ripple clickable :to="{ name: 'Clusters' }" dense>
          <q-item-section avatar>
            <q-icon name="sym_s_view_column" />
          </q-item-section>
          <q-item-section>Cluster Status</q-item-section>
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
        <q-item
          v-ripple
          clickable
          :to="currentCollection ? `/collection/${currentCollection.name}/search` : undefined"
          exact
          :disable="!currentCollection"
          dense
        >
          <q-item-section avatar>
            <q-icon name="sym_s_search" />
          </q-item-section>
          <q-item-section>Search</q-item-section>
        </q-item>

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
          :to="currentCollection ? `/collection/${currentCollection.name}/synonyms` : undefined"
          exact
          :disable="!currentCollection"
          dense
        >
          <q-item-section avatar>
            <q-icon name="sym_s_dataset_linked" />
          </q-item-section>
          <q-item-section>Synonyms</q-item-section>
        </q-item>

        <q-item
          v-if="store.data.features.stopwords"
          v-ripple
          clickable
          to="/stopwords"
          exact
          dense
        >
          <q-item-section avatar>
            <q-icon name="sym_s_playlist_remove" />
          </q-item-section>
          <q-item-section>Stopwords</q-item-section>
        </q-item>
      </q-expansion-item>

      <!-- Analytics Section -->
      <q-expansion-item
        v-if="store.data.features.analyticsRules"
        v-model="sections.analytics"
        icon="sym_s_query_stats"
        label="Analytics"
        header-class="text-weight-bold"
        dense
      >
        <q-item v-ripple clickable to="/analytics/popular" exact dense>
          <q-item-section avatar>
            <q-icon name="sym_s_trending_up" />
          </q-item-section>
          <q-item-section>Popular Queries</q-item-section>
        </q-item>

        <q-item v-ripple clickable to="/analytics/noresults" exact dense>
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

        <q-item v-ripple clickable to="/analytics/rules" exact dense>
          <q-item-section avatar>
            <q-icon name="sym_s_rule" />
          </q-item-section>
          <q-item-section>Analytics Rules</q-item-section>
        </q-item>
      </q-expansion-item>

      <!-- Configuration Section -->
      <q-expansion-item
        v-model="sections.configuration"
        icon="sym_s_settings"
        label="Configuration"
        header-class="text-weight-bold"
        dense
      >
        <q-item v-ripple clickable to="/collections" exact dense>
          <q-item-section avatar>
            <q-icon name="sym_s_grid_view" />
          </q-item-section>
          <q-item-section>Collections</q-item-section>
        </q-item>

        <q-item v-if="store.data.features.aliases" v-ripple clickable to="/aliases" exact dense>
          <q-item-section avatar>
            <q-icon name="sym_s_call_split" />
          </q-item-section>
          <q-item-section>Aliases</q-item-section>
        </q-item>

        <q-item v-if="store.data.features.apiKeys" v-ripple clickable to="/apikeys" exact dense>
          <q-item-section avatar>
            <q-icon name="sym_s_key" />
          </q-item-section>
          <q-item-section>API Keys</q-item-section>
        </q-item>

        <q-item v-if="store.data.features.searchPresets" v-ripple clickable to="/searchpresets" exact dense>
          <q-item-section avatar>
            <q-icon name="sym_s_manage_search" />
          </q-item-section>
          <q-item-section>Search Presets</q-item-section>
        </q-item>

        <q-item v-if="store.data.features.stemmingDictionaries" v-ripple clickable to="/stemming" exact dense>
          <q-item-section avatar>
            <q-icon name="sym_s_spellcheck" />
          </q-item-section>
          <q-item-section>Stemming</q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          :to="currentCollection ? `/collection/${currentCollection.name}/schema` : undefined"
          exact
          :disable="!currentCollection"
          dense
        >
          <q-item-section avatar>
            <q-icon name="sym_s_data_object" />
          </q-item-section>
          <q-item-section>Schema</q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          :to="currentCollection ? `/collection/${currentCollection.name}/document` : undefined"
          exact
          :disable="!currentCollection"
          dense
        >
          <q-item-section avatar>
            <q-icon name="sym_s_library_add" />
          </q-item-section>
          <q-item-section>Add Document</q-item-section>
        </q-item>
      </q-expansion-item>
    </q-list>
    <ProjectInfo v-if="!store.uiConfig.hideProjectInfo" />
  </div>
</template>

<script setup lang="ts">
import type { CollectionSchema } from 'typesense/lib/Typesense/Collection';
import { computed, ref, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNodeStore } from 'src/stores/node';
import ProjectInfo from './ProjectInfo.vue';

const store = useNodeStore();
const route = useRoute();

const sections = reactive({
  server: false,
  search: false,
  merchandising: false,
  relevance: false,
  curations: false,
  analytics: false,
  configuration: false,
});

// Route-to-group mapping for auto-expand
function getGroupForRoute(path: string): keyof typeof sections | null {
  if (path === '/' || path.startsWith('/clusters')) return 'server';
  if (path.startsWith('/search/') || path.match(/\/collection\/[^/]+\/search$/)) return 'search';
  if (path.startsWith('/merchandising/')) return 'merchandising';
  if (path.startsWith('/relevance/')) return 'relevance';
  if (path.startsWith('/curations/') || path.startsWith('/stopwords') || path.match(/\/collection\/[^/]+\/synonyms$/)) return 'curations';
  if (path.startsWith('/analytics/')) return 'analytics';
  if (
    path.startsWith('/collections') ||
    path.startsWith('/aliases') ||
    path.startsWith('/apikeys') ||
    path.startsWith('/searchpresets') ||
    path.startsWith('/stemming') ||
    path.match(/\/collection\/[^/]+\/schema$/) ||
    path.match(/\/collection\/[^/]+\/document$/)
  ) return 'configuration';
  return null;
}

watch(
  () => route.path,
  (path) => {
    const group = getGroupForRoute(path);
    if (group) {
      sections[group] = true;
    }
  },
  { immediate: true },
);

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
.collection-selector {
  padding: 8px 16px 0;
}

.q-item.q-router-link--active,
.q-item--active {
  background-color: #fff;
  color: var(--q-primary);
}
.body--dark .q-item.q-router-link--active,
.body--dark .q-item--active {
  background-color: #111827;
  color: #fff;
}
</style>
