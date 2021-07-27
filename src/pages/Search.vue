<template>
  <q-page padding>
    <ais-instant-search
      v-if="searchClient && currentCollection"
      :search-client="searchClient"
      :index-name="currentCollection.name"
    >
    <ais-configure
    :hits-per-page.camel="12"
/>
      <ais-search-box placeholder="" />
      <ais-stats></ais-stats>

      <ais-current-refinements />

      <div class="row q-mt-md">
        <div class="col-3 q-pr-sm">
          <ais-range-input
            class="q-mb-sm"
            :searchable="true"
            v-for="name in facetNumberFields"
            :key="name"
            :attribute="name"
          />

          <ais-refinement-list
            class="q-mb-sm"
            :searchable="true"
            v-for="name in facetStringFields"
            :key="name"
            :attribute="name"
          />
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
  </q-page>
</template>

<script lang="ts">
import SearchResultItem from 'src/components/SearchResultItem.vue';
import { Collection } from 'typesense';
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import { defineComponent } from 'vue';
export default defineComponent({
  components: { SearchResultItem },
  name: 'Search',
  data() {
    return {
      searchClient: null,
    };
  },
  computed: {
    currentCollection(): Collection | null {
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
        )
        .map((f) => f.name);
    },
    facetStringFields(): string[] {
      if (!this.currentCollection) return [];
      return this.currentCollection.fields
        .filter((f) => f.facet && ['string', 'string[]'].includes(f.type))
        .map((f) => f.name);
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
                queryBy: this.currentCollection.fields
                  .filter((f) => ['string', 'string[]'].includes(f.type))
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
<style>
.ais-Hits-item, .ais-InfiniteHits-item, .ais-InfiniteResults-item, .ais-Results-item {
  width: calc(33% - 1rem);
  border-radius: 4px;
  padding: none;
}
</style>
