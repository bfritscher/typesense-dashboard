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
            <q-item clickable v-ripple v-for="h in history" :key="h" :title="h" @click="searchParametersJson=h">
              <q-item-section>
                {{ h.slice(0, 60) }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </div>
    </div>
    <q-banner inline-actions class="text-white bg-red" v-if="jsonError">
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
    <div class="ais-Hits q-mt-md" v-if="hits">
      <ol class="ais-Hits-list">
        <li class="ais-Hits-item" v-for="item in hits" :key="item.id">
          <search-result-item :item="item" />
        </li>
      </ol>
    </div>
    <div
      v-if="results && results.hits && results.hits.length === 0"
      class="text-h5 q-mt-md"
    >
      No match found
    </div>
    <pre v-if="results && !results.hits">
          {{ resultsJson }}
        </pre
    >
</template>

<script lang="ts">
import MonacoEditor from 'src/components/MonacoEditor.vue';
import SearchResultItem from 'src/components/SearchResultItem.vue';
import { defineComponent } from 'vue';
import { LocalStorage } from 'quasar';
import { SearchParams } from 'typesense/lib/Typesense/Documents';
import { CollectionSchema } from 'typesense/lib/Typesense/Collection';

const STORAGE_KEY_SEARCH_HISTORY = 'typesense-search-history';

export default defineComponent({
  components: { SearchResultItem, MonacoEditor },
  name: 'Search',
  data() {
    return {
      tab: 'form',
      history: [] as string[],
      searchParameters: {
        q: 'stark',
        query_by: 'company_name',
        filter_by: 'num_employees:>100',
        sort_by: 'num_employees:desc',
        page: 1,
        per_page: 10,
        exhaustive_search: true,
      } as SearchParams,
      jsonError: null as string | null,
      results: null as any,
    };
  },
  computed: {
    currentCollection(): CollectionSchema | null {
      return this.$store.state.node.currentCollection;
    },
    searchParametersJson: {
      get(): string {
        return JSON.stringify(this.searchParameters, null, 2);
      },
      set(json: string) {
        try {
          this.searchParameters = JSON.parse(json);
          this.jsonError = null;
        } catch (e) {
          this.jsonError = (e as Error).message;
        }
      },
    },
    hits(): any[] {
      // convert from typesense api to instantsearch api to reuse SearchResultItem
      if (!this.results || !this.results.hits) return [];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return this.results.hits.map((item: any) => {
        const transformedItem: any = Object.assign({}, item.document);
        transformedItem._highlightResult = Object.keys(item.document).reduce(
          (obj: any, key: any) => {
            obj[key] = { value: String(item.document[key]) };
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return obj;
          },
          {}
        );
        item.highlights.forEach((h: any) => {
          transformedItem._highlightResult[h.field] = { value: h.snippet };
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return transformedItem;
      });
    },
    resultsJson(): string {
      return JSON.stringify(this.results, null, 2);
    },
  },
  methods: {
    async exportResults() {
      if (this.results) {
        await this.$store.dispatch('node/exportToJson', this.results);
      }
    },
    async exportHits() {
      if (this.results && this.results.hits) {
        const data = this.results.hits.map((h: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return h.document;
        });
        await this.$store.dispatch('node/exportToJson', data);
      }
    },
    async search() {
      this.results = null;
      this.jsonError = null;
      this.addToHistory();
      try {
        this.results = await this.$store.dispatch('node/search', this.searchParameters);
      } catch (error) {
        this.jsonError = (error as Error).message;
      }
    },
    addToHistory() {
      const json = this.searchParametersJson;
      const index = this.history.indexOf(json);
      if (index === 0) return;
      if (index > 0) {
        this.history.splice(index, 1);
      }
      this.history.unshift(json);
      this.saveHistory();
    },
    loadHistory() {
      this.history = LocalStorage.getItem(`${STORAGE_KEY_SEARCH_HISTORY}-${this.currentCollection?.name || ''}`) || [];
    },
    saveHistory() {
      LocalStorage.set(`${STORAGE_KEY_SEARCH_HISTORY}-${this.currentCollection?.name || ''}`, this.history.slice(0, 20))
    },
  },
 watch: {
    currentCollection: {
      handler() {
        this.loadHistory();
      },
      immediate: true,
    },
  },
});
</script>
