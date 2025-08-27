<template>
  <q-page padding>
    <q-expansion-item
      v-model="state.expanded"
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      :label="`${isUpdate ? 'Update' : 'Add'} Search Preset`"
      header-class="bg-primary text-white"
    >
      <q-card style="height: 60vh" class="bg-surface column">
        <q-card-section class="q-col-gutter-md row">
          <q-input
            v-model="state.preset.name"
            class="col-12 col-sm-6"
            label="Name"
            filled
            :rules="[(val) => !!val || 'Field is required']"
          />
          <q-btn
            type="a"
            icon="sym_s_help"
            no-caps
            color="info"
            flat
            dense
            :href="`https://typesense.org/docs/${store.data.debug.version || store.data.defaultDocVersion}/api/search.html#presets`"
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
            @click="createSearchPreset()"
            >{{ isUpdate ? 'Update' : 'Add' }} Preset</q-btn
          >
        </q-card-actions>
      </q-card>
    </q-expansion-item>

    <q-table
      class="q-mt-md"
      title="Search Presets"
      flat
      bordered
      :filter="state.filter"
      :rows="store.data.searchPresets"
      :columns="state.columns"
      row-key="id"
    >
      <template #top-left>
        <div class="text-h6"><q-icon size="md" name="sym_s_manage_search" /> Search Presets</div>
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
          <q-btn flat icon="sym_s_edit" title="Edit" @click="editSearchPreset(props.row)"></q-btn>
          <q-btn
            flat
            color="negative"
            icon="sym_s_delete_forever"
            title="Delete"
            @click="deleteSearchPreset(props.row.name)"
          ></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { useNodeStore } from 'src/stores/node';
import { computed, onMounted, reactive } from 'vue';
import { useQuasar } from 'quasar';
import MonacoEditor from '../components/MonacoEditor.vue';
import type { PresetSchema } from 'typesense/lib/Typesense/Preset';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();

const state = reactive({
  jsonError: null as string | null,
  preset: {
    name: '',
    value: {
      collection: 'products',
      q: '*',
      sort_by: 'popularity',
    },
  },
  expanded: store.data.searchPresets.length === 0,
  filter: '',
  columns: [
    {
      label: 'Name',
      name: 'name',
      field: 'name',
      sortable: true,
      align: 'left',
    },
    {
      label: 'Search Parameters',
      name: 'value',
      field: (row: PresetSchema<any>) => JSON.stringify(row.value),
      sortable: true,
      align: 'left',
    },
    {
      label: 'Actions',
      name: 'actions_op',
      align: 'right',
    },
  ] as QTableProps['columns'],
});

const keyJson = computed({
  get: () => JSON.stringify(state.preset.value, null, 2),
  set: (json: string) => {
    try {
      state.preset.value = JSON.parse(json);
      state.jsonError = null;
    } catch (e) {
      state.jsonError = (e as Error).message;
    }
  },
});

const isUpdate = computed(() =>
  store.data.searchPresets.map((p: PresetSchema<any>) => p.name).includes(state.preset.name),
);

async function createSearchPreset() {
  await store.upsertSearchPreset(JSON.parse(JSON.stringify(state.preset)));
}

function editSearchPreset(preset: PresetSchema<any>) {
  state.preset = JSON.parse(JSON.stringify(preset));
  state.expanded = true;
}

function deleteSearchPreset(name: string) {
  $q.dialog({
    title: 'Confirm',
    message: `Delete preset ${name}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void store.deleteSearchPreset(name);
  });
}

onMounted(() => {
  void store.getSearchPresets();
});
</script>
