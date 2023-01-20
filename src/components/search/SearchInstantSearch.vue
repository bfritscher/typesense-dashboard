<template>
    <ais-instant-search
      v-if="searchClient && currentCollection"
      :search-client="searchClient"
      :index-name="currentCollection.name"
      :middlewares="middlewares"
    >
      <ais-configure :hits-per-page.camel="12" />
      <ais-search-box placeholder="" />
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

          <div class="q-mb-sm" v-for="name in facetNumberFields" :key="name">
            <div class="text-subtitle2 q-pt-md">{{ name }}</div>
            <ais-range-input :searchable="true" :attribute="name" />
          </div>

          <div class="q-mb-sm" v-for="name in facetStringFields" :key="name">
            <div class="text-subtitle2 q-pt-md">{{ name }}</div>
            <ais-refinement-list
              class="q-mb-sm"
              :searchable="true"
              :attribute="name"
            />
          </div>
        </div>
        <div class="col-9">
          <ais-pagination class="q-mb-md" />
          <ais-hits>
            <template v-slot:item="{ item }" v-if="currentCollection">
              <search-result-item :item="item"></search-result-item>
            </template>
          </ais-hits>
          <ais-pagination class="q-my-md" />
        </div>
      </div>
    </ais-instant-search>
</template>

<script lang="ts">
import SearchResultItem from 'src/components/SearchResultItem.vue';
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import { CollectionSchema } from 'typesense/lib/Typesense/Collection';
import { defineComponent } from 'vue';

export default defineComponent({
  components: { SearchResultItem },
  name: 'SearchInstantSearch',
  data() {
    const data = {
      searchClient: null,
      instantSearchInstance: null as any,
      middlewares: [
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ instantSearchInstance }: any) => {
          return {
            subscribe() {
              // Do something when the InstantSearch instance starts.
              data.instantSearchInstance = instantSearchInstance;
            },
            unsubscribe() {
              // Do something when the InstantSearch instance is disposed.
              data.instantSearchInstance = null;
            },
          };
        },
      ],
    };
    return data;
  },
  computed: {
    currentCollection(): CollectionSchema | null {
      return this.$store.state.node.currentCollection;
    },
    facetNumberFields(): string[] {
      if (!this.currentCollection) return [];
      return this.currentCollection.fields
        .filter(
          (f) =>
            f.facet &&
            [
              'int32',
              'int64',
              'float',
              'int32[]',
              'int64[]',
              'float[]',
            ].includes(f.type)
            && !f.name.includes('.*')
        )
        .map((f) => f.name);
    },
    facetStringFields(): string[] {
      if (!this.currentCollection) return [];
      return this.currentCollection.fields
        .filter((f) => f.facet && ['string', 'string[]'].includes(f.type) && !f.name.includes('.*'))
        .map((f) => f.name);
    },
    sortBy(): { value: string; label: string }[] {
      if (!this.currentCollection) return [];
      const sortBy = [{ value: this.currentCollection.name, label: 'Default' }];
      this.currentCollection.fields
        .filter((f) => ['int32', 'float'].includes(f.type) || (f.type === 'string' && f.sort))
        .forEach((f) => {
          if (!this.currentCollection) return;
          sortBy.push({
            value: `${this.currentCollection.name}/sort/${f.name}:asc`,
            label: `${f.name} asc`,
          });
          sortBy.push({
            value: `${this.currentCollection.name}/sort/${f.name}:desc`,
            label: `${f.name} desc`,
          });
        });
      return sortBy;
    },
  },
  methods: {
    async exportPage() {
      if (this.instantSearchInstance && this.currentCollection) {
        await this.$store.dispatch(
          'node/exportToJson',
          this.instantSearchInstance.renderState[this.currentCollection.name]
            .hits.results.hits
        );
      }
    },
  },
  watch: {
    currentCollection: {
      handler() {
        this.searchClient = null;
        // set first to null to reset instantClient DOM
        window.setTimeout(() => {
          if (!this.$store.state.node.loginData || !this.currentCollection)
            return;
          const typesenseInstantsearchAdapter =
            new TypesenseInstantSearchAdapter({
              server: {
                nodes: [
                  {
                    ...this.$store.state.node.loginData.node,
                  },
                ],
                apiKey: this.$store.state.node.loginData.apiKey,
              },
              // The following parameters are directly passed to Typesense's search API endpoint.
              //  So you can pass any parameters supported by the search endpoint below.
              //  queryBy is required.
              additionalSearchParameters: {
                exhaustive_search: true,
                query_by: this.currentCollection.fields
                  .filter(
                    (f) => f.index && ['string', 'string[]'].includes(f.type) && !f.name.includes('.*')
                  )
                  .map((f) => f.name)
                  .join(','),
              },
            });
          this.searchClient = typesenseInstantsearchAdapter.searchClient;
        });
      },
      immediate: true,
    },
  },
});
</script>
