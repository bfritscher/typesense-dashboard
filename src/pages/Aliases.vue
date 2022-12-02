<template>
  <q-page padding>
    <q-expansion-item
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      :label="`${isUpdate ? 'Update' : 'Add'} Alias`"
      header-class="bg-primary text-white"
      v-model="expanded"
    >
      <q-card class="bg-grey-3 column">
        <q-card-section>
          <q-input
            v-model="alias.name"
            label="Alias name"
            filled
            bg-color="white"
            :rules="[
              (name) =>
                !collectionNames.includes(name) ||
                'Must not be a collection name',
            ]"
          />
          <q-select
            v-model="alias.collection_name"
            label="Target Collection"
            filled
            bg-color="white"
            :options="collectionNames"
          ></q-select>
        </q-card-section>

        <q-card-actions align="right" class="bg-primary">
          <q-btn
            size="md"
            padding="sm lg"
            unelevated
            color="primary"
            @click="createAlias()"
            >{{ isUpdate ? 'Update' : 'Add' }} Alias</q-btn
          >
        </q-card-actions>
      </q-card>
    </q-expansion-item>

    <q-table
      class="q-mt-md"
      title="Aliases"
      flat
      bordered
      :filter="filter"
      :rows="$store.state.node.data.aliases"
      :columns="columns"
      row-key="name"
      :visible-columns="['name', 'collection_name', 'actions']"
      :pagination="{ rowsPerPage: 50, sortBy: 'name' }"
    >
      <template v-slot:top-left>
        <div class="text-h6"><q-icon size="md" name="sym_s_call_split" /> Aliases</div>
      </template>
      <template v-slot:top-right>
        <q-input
          borderless
          dense
          debounce="300"
          v-model="filter"
          placeholder="Search"
        >
          <template v-slot:append>
            <q-icon name="sym_s_search" />
          </template>
        </q-input>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td class="text-right">
          <q-btn
            flat
            color="primary"
            @click="editAlias(props.row)"
            icon="sym_s_edit"
            title="Edit"
          ></q-btn>
          <q-btn
            flat
            color="negative"
            @click="deleteAlias(props.row.name)"
            icon="sym_s_delete_forever"
            title="Delete"
          ></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { CollectionAliasSchema } from 'typesense/lib/Typesense/Aliases';
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'Aliases',
  data() {
    return {
      alias: { name: '', collection_name: '' },
      expanded: this.$store.state.node.data.aliases.length === 0,
      filter: '',
      columns: [
        {
          label: 'Alias Name',
          name: 'name',
          field: 'name',
          align: 'left',
          sortable: true,
        },
        {
          label: 'Collection Name',
          name: 'collection_name',
          field: 'collection_name',
          align: 'left',
          sortable: true,
        },
        {
          label: 'Actions',
          name: 'actions',
          align: 'right',
        },
      ],
    };
  },
  computed: {
    collectionNames() {
      return this.$store.state.node.data.collections.map(
        (collection) => collection.name
      );
    },
    isUpdate(): boolean {
      return this.$store.state.node.data.aliases
        .map((a) => a.name)
        .includes(this.alias.name);
    },
  },
  methods: {
    async createAlias() {
      await this.$store.dispatch('node/createAlias', {
        name: this.alias.name,
        collection_name: this.alias.collection_name,
      });
      this.alias = { name: '', collection_name: '' };
      this.expanded = false;
    },
    editAlias(alias: CollectionAliasSchema) {
      this.alias = JSON.parse(JSON.stringify(alias));
      this.expanded = true;
    },
    deleteAlias(name: string) {
      this.$q
        .dialog({
          title: 'Confirm',
          message: `Delete alias ${name}?`,
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          void this.$store.dispatch('node/deleteAlias', name);
        });
    },
  },
});
</script>
