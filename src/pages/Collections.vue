<template>
  <q-page padding>
    <collection-create></collection-create>
    <q-table
      grid
      grid-header
      :filter="filter"
      :columns="columns"
      :rows="$store.state.node.data.collections"
      row-key="name"
      :pagination="{ rowsPerPage: 0, sortBy: 'name' }"
    >
      <template v-slot:top-right>
        <q-input
          borderless
          dense
          debounce="300"
          v-model="filter"
          placeholder="Search"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:item="props">
        <collection-list-item :collection="props.row"></collection-list-item>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import CollectionListItem from 'src/components/collection/CollectionListItem.vue';
import CollectionCreate from 'src/components/collection/CollectionCreate.vue';
import { defineComponent } from 'vue';
import { Collection } from 'typesense';
export default defineComponent({
  components: { CollectionListItem, CollectionCreate },
  name: 'Collections',
  data() {
    return {
      filter: '',
      columns: [
        {
          name: 'name',
          required: true,
          label: 'Name',
          field: 'name',
          sortable: true,
        },
        {
          name: 'num_documents',
          required: true,
          label: 'Nb documents',
          field: 'num_documents',
          sortable: true,
        },
        {
          name: 'schema_fields',
          required: true,
          label: 'Schema fields',
          field: (row: Collection) => row.fields.length || 0,
          sortable: true,
        },
        {
          name: 'num_memory_shards',
          required: true,
          label: 'Nb memory shards',
          field: 'num_memory_shards',
          sortable: true,
        },
        {
          name: 'created_at',
          required: true,
          label: 'Created at',
          field: 'created_at',
          sortable: true,
        },
      ],
    };
  },
  mounted() {
    void this.$store.dispatch('node/getCollections');
  },
});
</script>
