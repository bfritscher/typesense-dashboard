<template>
  <q-list>
    <q-item clickable v-ripple to="/" exact>
      <q-item-section avatar>
        <q-icon name="sym_s_dns"  />
      </q-item-section>

      <q-item-section> Server Status </q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/collections" exact>
      <q-item-section avatar>
        <q-icon name="sym_s_grid_view" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Collections</q-item-label>
      </q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/aliases" exact>
      <q-item-section avatar>
        <q-icon name="sym_s_call_split" />
      </q-item-section>

      <q-item-section> Aliases </q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/apikeys" exact>
      <q-item-section avatar>
        <q-icon name="sym_s_key" />
      </q-item-section>

      <q-item-section> API Keys </q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/analyticsrules" exact>
      <q-item-section avatar>
        <q-icon name="sym_s_query_stats" />
      </q-item-section>

      <q-item-section> Analytics Rules </q-item-section>
    </q-item>


    <q-separator spaced />

    <q-item>
      <q-item-section>
        <q-select
          borderless
          v-model="currentCollection"
          :options="$store.state.node.data.collections"
          label="Collection"
          option-label="name"
          color="white"
          label-color="white"
          dark
        />
      </q-item-section>
    </q-item>

    <q-item
      clickable
      v-ripple
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
      clickable
      v-ripple
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
      clickable
      v-ripple
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
      clickable
      v-ripple
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
      clickable
      v-ripple
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
</template>

<script lang="ts">
import { CollectionSchema } from 'typesense/lib/Typesense/Collection';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'NavMenu',
  data() {
    return {
      model: '',
      options: ['abc', 'def'],
    };
  },
  computed: {
    currentCollection: {
      get(){
        return this.$store.state.node.currentCollection;
      },
      set(value: CollectionSchema | null) {
        void this.$store.dispatch('node/loadCurrentCollection', value);
      },
    },
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
