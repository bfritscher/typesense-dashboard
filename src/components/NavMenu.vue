<template>
  <q-list>
    <q-item clickable v-ripple to="/" exact>
      <q-item-section avatar>
        <q-icon name="dns" />
      </q-item-section>

      <q-item-section> Server Status </q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/collections" exact>
      <q-item-section avatar>
        <q-icon name="library_books" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Collections</q-item-label>
      </q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/aliases" exact>
      <q-item-section avatar>
        <q-icon name="link" />
      </q-item-section>

      <q-item-section> Aliases </q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/apikeys" exact>
      <q-item-section avatar>
        <q-icon name="vpn_key" />
      </q-item-section>

      <q-item-section> Api Keys </q-item-section>
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
      :to="`/collection/${currentCollection?.name}/document`"
      exact
      :disable="!currentCollection"
    >
      <q-item-section avatar>
        <q-icon name="description" />
      </q-item-section>

      <q-item-section> Document </q-item-section>
    </q-item>

    <q-item
      clickable
      v-ripple
      :to="`/collection/${currentCollection?.name}/search`"
      exact
      :disable="!currentCollection"
    >
      <q-item-section avatar>
        <q-icon name="search" />
      </q-item-section>

      <q-item-section> Search </q-item-section>
    </q-item>

    <q-item
      clickable
      v-ripple
      :to="`/collection/${currentCollection?.name}/schema`"
      exact
      :disable="!currentCollection"
    >
      <q-item-section avatar>
        <q-icon name="rule" />
      </q-item-section>

      <q-item-section> Schema </q-item-section>
    </q-item>

    <q-item
      clickable
      v-ripple
      :to="`/collection/${currentCollection?.name}/synonyms`"
      exact
      :disable="!currentCollection"
    >
      <q-item-section avatar>
        <q-icon name="sync_alt" />
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
        <q-icon name="low_priority" />
      </q-item-section>

      <q-item-section> Curations </q-item-section>
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
</style>
