<template>
  <ais-instant-search
    v-if="searchClient && currentCollection"
    :search-client="searchClient"
    :index-name="currentCollection.name"
    :middlewares="middlewares"
  >
    <ais-configure :hits-per-page.camel="12" />
    <ais-search-box index-name="instant_search" :search-client="searchClient">
      <debounced-search-box />
    </ais-search-box>
    <ais-stats></ais-stats>
    <ais-current-refinements />

    <div class="row q-mt-md">
      <div class="col-3 q-pr-sm">
        <ais-hits-per-page
          :items="[
            { label: '12 hits per page', value: 12, default: true },
            { label: '48 hits per page', value: 48 },
            { label: '100 hits per page', value: 100 },
            { label: '250 hits per page', value: 250 },
          ]"
        />
        <q-btn flat @click="exportPage()">export current page</q-btn>

        <div class="text-subtitle2 q-pt-md">Sort By</div>
        <ais-sort-by :items="sortBy" />

        <div class="text-subtitle2 q-pt-md">Stopwords</div>
        <q-select
          v-model="currentStopwordsSet"
          :disable="!store.data.features.stopwords"
          outlined
          clearable
          dense
          options-dense
          :options="stopwords"
          @update:model-value="updateTypesenseAdapterConfiguration()"
        ></q-select>

        <div class="text-subtitle2 q-pt-md">Max Candidates</div>
        <q-input
          v-model.number="maxCandidates"
          type="number"
          outlined
          dense
          :min="0"
          :max="10000"
          hint="Number of similar words for prefix and typo searching"
          @update:model-value="updateTypesenseAdapterConfiguration()"
        ></q-input>

        <div v-for="name in facetNumberFields" :key="name" class="q-mb-sm">
          <div class="text-subtitle2 q-pt-md">{{ name }}</div>
          <ais-range-input :searchable="true" :attribute="name" />
        </div>

        <div v-for="name in facetStringFields" :key="name" class="q-mb-sm">
          <div class="text-subtitle2 q-pt-md">{{ name }}</div>
          <ais-refinement-list class="q-mb-sm" :searchable="true" :attribute="name" />
        </div>

        <div v-for="name in facetBooleanFields" :key="name" class="q-mb-sm">
          <div class="text-subtitle2 q-pt-md">{{ name }}</div>
          <ais-refinement-list class="q-mb-sm" :attribute="name" />
        </div>
      </div>
      <div class="col-9">
        <ais-pagination class="q-mb-md" />
        <ais-hits>
          <template v-if="currentCollection" #item="{ item }">
            <search-result-item
              :item="item"
              @deleted="instantSearchInstance.refresh()"
            ></search-result-item>
          </template>
        </ais-hits>
        <ais-pagination class="q-my-md" />
      </div>
    </div>
  </ais-instant-search>
  <div v-else-if="searchClientError">
    <q-banner inline-actions class="text-white bg-red">
      {{ searchClientError }}
    </q-banner>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useNodeStore } from 'src/stores/node';
import SearchResultItem from 'src/components/search/SearchResultItem.vue';
import DebouncedSearchBox from 'src/components/search/DebouncedSearchBox.vue';
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import type { CollectionSchema } from 'typesense/lib/Typesense/Collection';

const store = useNodeStore();
const searchClient = ref<any>(null);
const typesenseInstantsearchAdapter = ref<TypesenseInstantSearchAdapter>();
const instantSearchInstance = ref<any>();
const searchClientError = ref<string | null>(null);
const currentStopwordsSet = ref(null);
const maxCandidates = ref(4);

const middlewares = [
  ({ instantSearchInstance: instance }: any) => {
    return {
      subscribe() {
        instantSearchInstance.value = instance;
      },
      unsubscribe() {
        instantSearchInstance.value = null;
      },
    };
  },
];

const currentCollection = computed((): CollectionSchema | null => {
  return store.currentCollection;
});

const facetNumberFields = computed((): string[] => {
  if (!currentCollection.value || !currentCollection.value.fields) return [];
  return currentCollection.value.fields
    .filter(
      (f) =>
        f.facet &&
        ['int32', 'int64', 'float', 'int32[]', 'int64[]', 'float[]'].includes(f.type) &&
        !f.name.includes('.*'),
    )
    .map((f) => f.name);
});

const facetStringFields = computed((): string[] => {
  if (!currentCollection.value || !currentCollection.value.fields) return [];
  return currentCollection.value.fields
    .filter((f) => f.facet && ['string', 'string[]'].includes(f.type) && !f.name.includes('.*'))
    .map((f) => f.name);
});

const facetBooleanFields = computed((): string[] => {
  if (!currentCollection.value || !currentCollection.value.fields) return [];
  return currentCollection.value.fields
    .filter((f) => f.facet && ['bool', 'bool[]'].includes(f.type) && !f.name.includes('.*'))
    .map((f) => f.name);
});

const sortBy = computed((): { value: string; label: string }[] => {
  if (!currentCollection.value || !currentCollection.value.fields) return [];
  const sortBy = [{ value: currentCollection.value.name, label: 'Default' }];
  currentCollection.value.fields
    .filter((f) => ['int32', 'float'].includes(f.type) || (f.type === 'string' && f.sort))
    .forEach((f) => {
      if (!currentCollection.value) return;
      sortBy.push({
        value: `${currentCollection.value.name}/sort/${f.name}:asc`,
        label: `${f.name} asc`,
      });
      sortBy.push({
        value: `${currentCollection.value.name}/sort/${f.name}:desc`,
        label: `${f.name} desc`,
      });
    });
  return sortBy;
});

const stopwords = computed(() => {
  return store.data.stopwords.map((set) => set.id);
});

const exportPage = () => {
  if (instantSearchInstance.value && currentCollection.value) {
    store.exportToJson(
      instantSearchInstance.value.renderState[currentCollection.value.name].hits.results.hits,
    );
  }
};

const updateTypesenseAdapterConfiguration = () => {
  if (typesenseInstantsearchAdapter.value && currentCollection.value) {
    typesenseInstantsearchAdapter.value.updateConfiguration({
      // @ts-expect-error internal property
      ...typesenseInstantsearchAdapter.value.configuration,
      additionalSearchParameters: {
        // @ts-expect-error internal property
        ...typesenseInstantsearchAdapter.value.configuration.additionalSearchParameters,
        stopwords: currentStopwordsSet.value,
        max_candidates: maxCandidates.value,
      },
    });
  }
};

watch(
  () => currentCollection.value,
  () => {
    searchClient.value = null;
    searchClientError.value = null;

    window.setTimeout(() => {
      if (!store.loginData || !currentCollection.value) return;
      const query_by = (currentCollection.value?.fields || [])
        .filter((f) => f.index && ['string', 'string[]'].includes(f.type) && !f.name.includes('.*'))
        .map((f) => f.name)
        .join(',');

      try {
        const adapter = new TypesenseInstantSearchAdapter({
          server: {
            nodes: [
              {
                ...store.loginData.node,
              },
            ],
            apiKey: store.loginData.apiKey,
          },
          additionalSearchParameters: {
            max_candidates: maxCandidates.value,
            query_by,
          },
        });
        typesenseInstantsearchAdapter.value = adapter;
        searchClient.value = adapter.searchClient;
      } catch (error) {
        searchClientError.value = (error as Error).message + 'Using query_by: ' + query_by;
        console.error(error);
      }
    });
  },
  { immediate: true },
);
</script>

<style>
.body--dark .ais-SearchBox-input,
.body--dark .ais-MenuSelect-select,
.body--dark .ais-NumericSelector-select,
.body--dark .ais-HitsPerPage-select,
.body--dark .ais-ResultsPerPage-select,
.body--dark .ais-SortBy-select {
  background-color: rgba(255, 255, 255, 0.07);
  color: #fff;
}

.body--dark .ais-InstantSearch option {
  background-color: #1f2937;
  color: #fff;
}

.ais-InfiniteHits-item,
.ais-InfiniteResults-item,
.ais-Hits-item,
.ais-Results-item {
  box-shadow: none;
}
</style>
