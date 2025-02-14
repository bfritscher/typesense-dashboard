<template>
  <q-page padding>
    <q-expansion-item
      v-model="state.expanded"
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      :label="`${isUpdate ? 'Update' : 'Add'} Alias`"
      header-class="bg-primary text-white"
    >
      <q-card class="bg-surface column">
        <q-card-section>
          <q-input
            v-model="state.alias.name"
            label="Alias name"
            filled
            :rules="[(name) => !collectionNames.includes(name) || 'Must not be a collection name']"
          />
          <q-select
            v-model="state.alias.collection_name"
            label="Target Collection"
            filled
            :options="collectionNames"
          ></q-select>
        </q-card-section>

        <q-card-actions align="right" class="bg-primary">
          <q-btn size="md" padding="sm lg" unelevated color="primary" @click="createAlias()"
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
      :filter="state.filter"
      :rows="store.data.aliases"
      :columns="state.columns"
      row-key="name"
      :visible-columns="['name', 'collection_name', 'actions']"
      :pagination="{ rowsPerPage: 50, sortBy: 'name' }"
    >
      <template #top-left>
        <div class="text-h6"><q-icon size="md" name="sym_s_call_split" /> Aliases</div>
      </template>
      <template #top-right>
        <q-input v-model="state.filter" borderless dense debounce="300" placeholder="Search">
          <template #append>
            <q-icon name="sym_s_search" />
          </template>
        </q-input>
      </template>
      <template #body-cell-actions="props">
        <q-td class="text-right">
          <q-btn flat icon="sym_s_edit" title="Edit" @click="editAlias(props.row)"></q-btn>
          <q-btn
            flat
            color="negative"
            icon="sym_s_delete_forever"
            title="Delete"
            @click="deleteAlias(props.row.name)"
          ></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useNodeStore } from 'src/stores/node';
import { useQuasar } from 'quasar';
import type { CollectionAliasSchema } from 'typesense/lib/Typesense/Aliases';
import type { QTableProps } from 'quasar';

const $q = useQuasar();

const store = useNodeStore();

const state = reactive({
  alias: { name: '', collection_name: '' },
  expanded: store.data.aliases.length === 0,
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
  ] as QTableProps['columns'],
});

const collectionNames = computed(() => store.data.collections.map((collection) => collection.name));
const isUpdate = computed(() => store.data.aliases.map((a) => a.name).includes(state.alias.name));
async function createAlias() {
  await store.createAlias({
    name: state.alias.name,
    collection_name: state.alias.collection_name,
  });
  state.alias = { name: '', collection_name: '' };
  state.expanded = false;
}

function editAlias(alias: CollectionAliasSchema) {
  state.alias = JSON.parse(JSON.stringify(alias));
  state.expanded = true;
}

function deleteAlias(name: string) {
  $q.dialog({
    title: 'Confirm',
    message: `Delete alias ${name}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void store.deleteAlias(name);
  });
}
</script>
