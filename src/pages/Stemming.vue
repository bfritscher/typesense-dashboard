<template>
  <q-page padding>
    <q-expansion-item
      v-model="state.expanded"
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      :label="`${isUpdate ? 'Update' : 'Add'} Stemming Dictionary`"
      header-class="bg-primary text-white"
    >
      <q-card>
        <q-tabs
          v-model="tab"
          dense
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="form" label="Upload Mode" />
          <q-tab name="json" label="JSON Mode" />
        </q-tabs>
        <q-separator />
        <q-tab-panels v-model="tab" animated class="bg-surface">
          <q-tab-panel name="form">
            <q-card-section class="q-col-gutter-md row">
              <q-input
                v-model="state.stemmingDictionary.id"
                class="col-12 col-sm-6"
                label="ID"
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
                :href="`https://typesense.org/docs/${store.data.debug.version || store.data.defaultDocVersion}/api/stemming.html`"
                target="_blank"
              >
                Documentation
              </q-btn>
            </q-card-section>
            <q-card-section class="q-col-gutter-md row">
              <q-btn
                unelevated
                :disable="!$q.platform.is.electron"
                icon="sym_s_attach_file"
                @click="importFile()"
              >
                Import from file
                <span v-if="!$q.platform.is.electron"> (only desktop version)</span>
              </q-btn>
            </q-card-section>
          </q-tab-panel>
          <q-tab-panel name="json" class="q-pa-none">
            <monaco-editor v-model="ruleJson" style="height: 60vh"></monaco-editor>
            <q-banner v-if="jsonError" inline-actions class="text-white bg-red">
              Invalid Format: {{ jsonError }}
            </q-banner>
          </q-tab-panel>
        </q-tab-panels>

        <q-card-actions align="right" class="bg-primary">
          <q-btn
            size="md"
            padding="sm lg"
            unelevated
            color="primary"
            :disable="!!jsonError"
            @click="createStemmingDictionary()"
            >{{ isUpdate ? 'Append' : 'Add' }} Dictionary
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-expansion-item>

    <q-table
      class="q-mt-md"
      flat
      bordered
      wrap-cells
      :filter="state.filter"
      :rows="rows"
      :columns="state.columns"
      row-key="id"
    >
      <template #top-left>
        <div class="text-h6">
          <q-icon size="md" name="sym_s_playlist_remove" />
          Stemming Dictionaries
        </div>
      </template>
      <template #top-right>
        <q-input v-model="state.filter" borderless dense debounce="300" placeholder="Search">
          <template #append>
            <q-icon name="sym_s_search" />
          </template>
        </q-input>
      </template>
      <template #body-cell-actions_op="props">
        <q-td class="text-right text-no-wrap">
          <q-btn
            flat
            icon="sym_s_edit"
            title="Edit"
            @click="editStemmingDictionary(props.row.id)"
          ></q-btn>
          <q-btn
            flat
            color="negative"
            icon="sym_s_delete_forever"
            title="Delete"
            @click="deleteStemmingDictionary(props.row.id)"
          ></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { useNodeStore } from 'src/stores/node';
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import MonacoEditor from 'src/components/MonacoEditor.vue';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();

const rows = computed(() => store.data.stemmingDictionaries.map((id) => ({ id })));

const state = reactive({
  stemmingDictionary: {
    id: 'irregular-plurals',
    words: [
      { root: 'person', word: 'people' },
      { root: 'child', word: 'children' },
      { root: 'goose', word: 'geese' },
    ],
  },
  expanded: store.data.stemmingDictionaries.length === 0,
  filter: '',
  columns: [
    {
      label: 'ID',
      name: 'id',
      field: 'id',
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

const tab = ref('json');
const ruleJson = computed({
  get() {
    return JSON.stringify(state.stemmingDictionary, null, 2);
  },
  set(json: string) {
    try {
      state.stemmingDictionary = JSON.parse(json);
      jsonError.value = null;
    } catch (e) {
      jsonError.value = (e as Error).message;
    }
  },
});
const jsonError = ref<string | null>(null);

const isUpdate = computed(() =>
  store.data.stemmingDictionaries.includes(state.stemmingDictionary.id),
);

async function createStemmingDictionary() {
  await store.upsertStemmingDictionaries(JSON.parse(JSON.stringify(state.stemmingDictionary)));
}

async function editStemmingDictionary(id: string) {
  state.stemmingDictionary = (await store.getStemmingDictionary(id)) || state.stemmingDictionary;
  state.expanded = true;
}

function deleteStemmingDictionary(id: string) {
  $q.dialog({
    title: 'Confirm',
    message: `Delete stemming dictionary ${id}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void store.deleteStemmingDictionary(id);
  });
}

async function importFile() {
  try {
    $q.loading.show({
      message: 'Uploading. Please wait...',
      boxClass: 'bg-grey-2 text-grey-9',
      spinnerColor: 'primary',
    });
    // @ts-expect-error electron only
    await store.api?.importStemmingFile(state.stemmingDictionary.id);
    void store.getStemmingDictionaries();
  } catch (error) {
    console.error(error);
  }
  $q.loading.hide();
}

onMounted(() => {
  void store.getStemmingDictionaries();
});
</script>
