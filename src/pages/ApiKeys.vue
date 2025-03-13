<template>
  <q-page padding>
    <q-expansion-item
      v-model="state.expanded"
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      label="Create API Key"
      header-class="bg-primary text-white"
    >
      <q-card style="height: 60vh" class="bg-surface column">
        <q-card-section class="q-gutter-md">
          <q-btn flat @click="loadAdminKey">Admin Key Example</q-btn>
          <q-btn flat @click="loadSearchKey">Search Key Example</q-btn>
          <q-btn
            type="a"
            icon="sym_s_help"
            no-caps
            color="info"
            flat
            dense
            :href="`https://typesense.org/docs/${store.data.debug.version || store.data.defaultDocVersion}/api/api-keys.html#create-an-api-key`"
            target="_blank"
            >Documentation</q-btn
          >
        </q-card-section>
        <monaco-editor v-model="keyJson"></monaco-editor>
        <q-banner v-if="state.jsonError" inline-actions class="text-white bg-red">
          Invalid Format: {{ state.jsonError }}
        </q-banner>

        <q-card-actions align="right" class="bg-primary">
          <q-btn
            size="md"
            padding="sm lg"
            unelevated
            color="primary"
            :disable="!!state.jsonError"
            @click="createApiKey"
            >Create API Key</q-btn
          >
        </q-card-actions>
      </q-card>
    </q-expansion-item>

    <q-table
      class="q-mt-md"
      title="API Keys"
      flat
      bordered
      :filter="state.filter"
      :rows="store.data.apiKeys"
      :columns="state.columns"
      row-key="id"
      :visible-columns="[
        'id',
        'value_prefix',
        'description',
        'actions',
        'collections',
        'expires_at',
        'actions_op',
      ]"
    >
      <template #top-left>
        <div class="text-h6"><q-icon size="md" name="sym_s_key" /> API Keys</div>
      </template>
      <template #top-right>
        <q-input v-model="state.filter" borderless dense debounce="300" placeholder="Search">
          <template #append>
            <q-icon name="sym_s_search" />
          </template>
        </q-input>
      </template>
      <template #body-cell-actions_op="props">
        <q-td class="text-right">
          <q-btn
            flat
            color="negative"
            icon="sym_s_delete_forever"
            title="Delete"
            @click="deleteApiKey(props.row.id)"
          ></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useNodeStore } from 'src/stores/node';
import MonacoEditor from '../components/MonacoEditor.vue';
import type { KeyCreateSchema } from 'typesense/lib/Typesense/Key';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();

const adminKeyExample: KeyCreateSchema = {
  description: 'Admin key.',
  actions: ['*'],
  collections: ['*'],
};

const searchKeyExample: KeyCreateSchema = {
  description: 'Search-only companies key.',
  actions: ['documents:search'],
  collections: ['companies'],
};

const state = reactive({
  jsonError: null as string | null,
  key: JSON.parse(JSON.stringify(adminKeyExample)) as KeyCreateSchema,
  expanded: store.data.apiKeys.length === 0,
  filter: '',
  columns: [
    {
      label: 'ID',
      name: 'id',
      field: 'id',
      sortable: true,
    },
    {
      label: 'Key prefix',
      name: 'value_prefix',
      field: 'value_prefix',
    },
    {
      label: 'Description',
      name: 'description',
      field: 'description',
      sortable: true,
      align: 'left',
    },
    {
      label: 'Key Actions',
      name: 'actions',
      field: (row: KeyCreateSchema) => JSON.stringify(row.actions),
      sortable: true,
      align: 'left',
    },
    {
      label: 'Collections',
      name: 'collections',
      field: (row: KeyCreateSchema) => JSON.stringify(row.collections),
      sortable: true,
      align: 'left',
    },
    {
      label: 'Expires at',
      name: 'expires_at',
      field: (row: KeyCreateSchema) =>
        row.expires_at
          ? row.expires_at === 64723363199
            ? 'never'
            : new Date(row.expires_at * 1000).toLocaleString()
          : '',
    },
    {
      label: 'Actions',
      name: 'actions_op',
      align: 'right',
    },
  ] as QTableProps['columns'],
});

const keyJson = computed({
  get: () => JSON.stringify(state.key, null, 2),
  set: (json: string) => {
    try {
      state.key = JSON.parse(json);
      state.jsonError = null;
    } catch (e) {
      state.jsonError = (e as Error).message;
    }
  },
});

function loadAdminKey() {
  state.key = JSON.parse(JSON.stringify(adminKeyExample));
}

function loadSearchKey() {
  state.key = JSON.parse(JSON.stringify(searchKeyExample));
}

async function createApiKey() {
  const key = await store.createApiKey(JSON.parse(JSON.stringify(state.key)));
  $q.dialog({
    title: 'Your API key',
    message: `This is your API key copy it! It will not be displayed again!\n\n${key.value || ''}`,
    cancel: false,
    persistent: true,
  });
}

function deleteApiKey(id: string) {
  $q.dialog({
    title: 'Confirm',
    message: `Delete key with id: ${id}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void store.deleteApiKey(id);
  });
}
</script>
