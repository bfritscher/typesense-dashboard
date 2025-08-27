<template>
  <div class="row">
    <div class="col-9">
      <monaco-editor
        v-model="searchParametersJson"
        style="height: 30vh; min-height: 200px"
      ></monaco-editor>
    </div>
    <div class="col-3">
      <q-scroll-area style="height: 100%">
        <q-list bordered separator dense>
          <q-item-label header>History</q-item-label>
          <q-item
            v-for="h in history"
            :key="h"
            v-ripple
            clickable
            :title="h"
            @click="searchParametersJson = h"
          >
            <q-item-section>
              {{ h.slice(0, 60) }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </div>
  </div>
  <q-banner v-if="jsonError" inline-actions class="text-white bg-red">
    Invalid Format: {{ jsonError }}
  </q-banner>
  <div class="q-mt-md">
    <q-btn
      size="md"
      padding="sm lg"
      unelevated
      color="primary"
      :disable="!!jsonError"
      @click="search()"
      >Run Query</q-btn
    >
    <q-btn
      size="md"
      padding="sm lg"
      unelevated
      color="accent"
      class="q-ml-sm"
      :disable="!results || !results.hits"
      @click="exportHits()"
      >Export Hits</q-btn
    >
    <q-btn
      size="md"
      padding="sm lg"
      unelevated
      color="accent"
      class="q-ml-sm"
      :disable="!results"
      @click="exportResults()"
      >Export Raw Results</q-btn
    >
  </div>
  <div v-if="hits" class="ais-Hits q-mt-md">
    <ol class="ais-Hits-list">
      <li v-for="item in hits" :key="item.id" class="ais-Hits-item">
        <search-result-item :item="item" />
      </li>
    </ol>
  </div>
  <div v-if="results && results.hits && results.hits.length === 0" class="text-h5 q-mt-md">
    No match found
  </div>
  <pre v-if="results && !results.hits">
          {{ resultsJson }}
        </pre
  >
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { LocalStorage } from 'quasar';
import { useNodeStore } from 'src/stores/node';
import MonacoEditor from 'src/components/MonacoEditor.vue';
import SearchResultItem from 'src/components/search/SearchResultItem.vue';
import type { SearchParams } from 'typesense/lib/Typesense/Documents';

const store = useNodeStore();
const STORAGE_KEY_SEARCH_HISTORY = 'typesense-search-history';

const history = ref<string[]>([]);
const searchParameters = ref<SearchParams<any>>({
  q: 'stark',
  query_by: 'company_name',
  filter_by: 'num_employees:>100',
  sort_by: 'num_employees:desc',
  page: 1,
  per_page: 10,
  exhaustive_search: true,
});
const jsonError = ref<string | null>(null);
const results = ref<any>(null);

const currentCollection = computed(() => store.currentCollection);

const searchParametersJson = computed({
  get: () => JSON.stringify(searchParameters.value, null, 2),
  set: (json: string) => {
    try {
      searchParameters.value = JSON.parse(json);
      jsonError.value = null;
    } catch (e) {
      jsonError.value = (e as Error).message;
    }
  },
});

const hits = computed(() => {
  if (!results.value?.hits) return [];

  return results.value.hits.map((item: any) => {
    const transformedItem = Object.assign({}, item.document);

    // Create a deep copy of the document structure for _highlightResult
    const createHighlightStructure = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return { value: String(obj), matchLevel: 'none' };
      }

      if (Array.isArray(obj)) {
        return obj.map((subItem: any) => createHighlightStructure(subItem));
      }

      if (typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = createHighlightStructure(obj[key]);
          }
        }
        return result;
      }

      return { value: String(obj), matchLevel: 'none' };
    };

    transformedItem._highlightResult = createHighlightStructure(item.document);

    // Apply highlights to the appropriate nested paths
    item.highlights.forEach((h: any) => {
      const fieldPath = h.field.split('.');
      let current = transformedItem._highlightResult;

      // Navigate to the correct nested location
      for (let i = 0; i < fieldPath.length - 1; i++) {
        const pathSegment = fieldPath[i];
        if (current[pathSegment] !== undefined) {
          current = current[pathSegment];
        }
      }

      const finalKey = fieldPath[fieldPath.length - 1];
      if (current[finalKey] !== undefined) {
        if (Array.isArray(current[finalKey])) {
          // For arrays, we need to find the matching item or update all
          // This is a simplified approach - in a real scenario you might want
          // to match based on indices or content
          current[finalKey] = current[finalKey].map((item: any) => {
            if (typeof item === 'object' && item.value !== undefined) {
              return { ...item, value: h.snippet, matchLevel: 'full' };
            }
            return { value: h.snippet, matchLevel: 'full' };
          });
        } else if (typeof current[finalKey] === 'object' && current[finalKey].value !== undefined) {
          current[finalKey] = { value: h.snippet, matchLevel: 'full' };
        } else {
          current[finalKey] = { value: h.snippet, matchLevel: 'full' };
        }
      }
    });

    return transformedItem;
  });
});

const resultsJson = computed(() => JSON.stringify(results.value, null, 2));

const exportResults = () => {
  if (results.value) {
    store.exportToJson(results.value);
  }
};

const exportHits = () => {
  if (results.value?.hits) {
    const data = results.value.hits.map((h: any) => h.document);
    store.exportToJson(data);
  }
};

const saveHistory = () => {
  LocalStorage.set(
    `${STORAGE_KEY_SEARCH_HISTORY}-${currentCollection.value?.name || ''}`,
    history.value.slice(0, 20),
  );
};

const addToHistory = () => {
  const json = searchParametersJson.value;
  const index = history.value.indexOf(json);
  if (index === 0) return;
  if (index > 0) {
    history.value.splice(index, 1);
  }
  history.value.unshift(json);
  saveHistory();
};

const search = async () => {
  results.value = null;
  jsonError.value = null;
  addToHistory();
  try {
    results.value = await store.search(searchParameters.value);
  } catch (error) {
    jsonError.value = (error as Error).message;
  }
};

const loadHistory = () => {
  history.value =
    LocalStorage.getItem(`${STORAGE_KEY_SEARCH_HISTORY}-${currentCollection.value?.name || ''}`) ||
    [];
};

watch(currentCollection, loadHistory, { immediate: true });
</script>
