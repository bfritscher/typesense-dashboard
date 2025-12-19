<template>
  <q-page padding>
    <q-expansion-item
      v-model="state.expanded"
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      :label="`${isUpdate ? 'Update' : 'Add'} Curation`"
      header-class="bg-primary text-white"
    >
      <q-card style="height: 60vh" class="bg-surface column">
        <q-card-section>
          <q-input v-model="state.id" dense filled label="ID"></q-input>
        </q-card-section>
        <monaco-editor v-model="overrideJson"></monaco-editor>
        <q-banner v-if="state.jsonError" inline-actions class="text-white bg-red">
          Invalid Format: {{ state.jsonError }}
        </q-banner>

        <q-card-actions align="right" class="bg-primary">
          <q-btn
            size="md"
            padding="sm lg"
            unelevated
            color="primary"
            :disable="!isValid"
            @click="createOverride()"
            >{{ isUpdate ? 'Update' : 'Add' }} Curation</q-btn
          >
        </q-card-actions>
      </q-card>
    </q-expansion-item>

    <q-table
      class="q-mt-md"
      title="Curations"
      flat
      bordered
      :filter="state.filter"
      :rows="store.data.overrides"
      :columns="state.columns"
      row-key="id"
      :visible-columns="['query', 'match', 'includes', 'excludes', 'actions']"
    >
      <template #top-left>
        <div class="text-h6"><q-icon size="md" name="sym_s_low_priority" /> Curations</div>
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
          <q-btn flat icon="sym_s_edit" title="Edit" @click="editOverride(props.row)"></q-btn>
          <q-btn
            flat
            color="negative"
            icon="sym_s_delete_forever"
            title="Delete"
            @click="deleteOverride(props.row.id)"
          ></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { nanoid } from 'nanoid';
import MonacoEditor from 'src/components/MonacoEditor.vue';
import { useNodeStore } from 'src/stores/node';
import type { OverrideSchema } from 'typesense/lib/Typesense/Override';
import type { OverrideCreateSchema } from 'typesense/lib/Typesense/Overrides';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();

const initialData: OverrideCreateSchema = {
  rule: {
    query: 'apple',
    match: 'exact',
  },
  includes: [
    { id: '422', position: 1 },
    { id: '54', position: 2 },
  ],
  excludes: [{ id: '287' }],
};

const state = reactive({
  id: nanoid(),
  override: initialData as OverrideSchema | OverrideCreateSchema,
  jsonError: null as string | null,
  expanded: store.data.overrides.length === 0,
  filter: '',
  columns: [
    {
      label: 'ID',
      name: 'id',
      field: 'id',
    },
    {
      label: 'Query',
      name: 'query',
      field: (row: any) => row.rule.query,
      sortable: true,
      align: 'left',
    },
    {
      label: 'Match',
      name: 'match',
      field: (row: any) => row.rule.match,
      sortable: true,
      align: 'left',
    },
    {
      label: 'Includes',
      name: 'includes',
      field: (row: OverrideSchema) => row.includes?.length,
    },
    {
      label: 'Excludes',
      name: 'excludes',
      field: (row: OverrideSchema) => row.excludes?.length,
    },
    {
      label: 'Actions',
      name: 'actions',
      align: 'right',
    },
  ] as QTableProps['columns'],
});

const isValid = computed(() => state.id.length > 0 && !state.jsonError);
const isUpdate = computed(() => store.data.overrides.map((o) => o.id).includes(state.id));

const overrideJson = computed({
  get: () => JSON.stringify(state.override, null, 2),
  set: (json: string) => {
    try {
      state.override = JSON.parse(json);
      state.jsonError = null;
    } catch (e) {
      state.jsonError = (e as Error).message;
    }
  },
});

async function createOverride() {
  await store.createOverride({
    id: state.id,
    override: JSON.parse(JSON.stringify(state.override)),
  });
  state.id = nanoid();
  state.override = initialData;
  state.expanded = false;
}

function editOverride(override: OverrideSchema) {
  state.override = JSON.parse(JSON.stringify(override));
  state.id = override.id || nanoid();
  state.expanded = true;
}

function deleteOverride(id: string) {
  $q.dialog({
    title: 'Confirm',
    message: `Delete curation with id: ${id}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void store.deleteOverride(id);
  });
}

onMounted(() => {
  if (store.currentCollection) {
    void store.getOverrides(store.currentCollection.name);
  }
});
</script>
