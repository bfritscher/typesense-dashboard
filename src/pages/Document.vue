<template>
  <q-page padding class="column">
    <div class="row justify-between q-mb-md">
      <div class="text-h5">
        <q-icon size="md" name="sym_s_library_add" /> Add Documents to
        {{ store.currentCollection?.name }}
      </div>
      <q-btn
        unelevated
        :disable="!$q.platform.is.electron"
        icon="sym_s_attach_file"
        @click="importFile()"
      >
        Import from file
        <span v-if="!$q.platform.is.electron"> (only desktop version)</span>
      </q-btn>
    </div>
    <monaco-editor v-model="documentsJson" style="min-height: 200px"></monaco-editor>
    <q-banner v-if="state.jsonError" inline-actions class="text-white bg-red">
      Invalid Format: {{ state.jsonError }}
    </q-banner>
    <div class="row q-mb-md bg-primary text-white justify-between">
      <q-btn unelevated size="md" padding="sm lg" color="primary" @click="addEmptyDocument()"
        >Add empty Document</q-btn
      >
      <div class="row col-auto">
        <q-select
          v-model="state.action"
          dark
          bottom-slots
          label="Action mode"
          filled
          style="width: 300px"
          :options="actionOptions"
        >
          <template #hint>
            <div>
              {{ actionDescriptions[state.action] }}
            </div>
          </template>
        </q-select>
        <q-btn
          unelevated
          size="md"
          padding="sm xl"
          color="primary"
          :disable="!!state.jsonError"
          @click="importDocuments()"
          >Import</q-btn
        >
      </div>
    </div>

    <div>
      <q-banner
        v-for="(result, index) in state.results"
        :key="index"
        class="text-white"
        :class="{ 'bg-green': result.success, 'bg-red': result.error }"
      >
        {{ index }}: <span v-if="result.success"> {{ result.success }}</span
        ><span v-else>{{ result.error }}</span>
      </q-banner>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useNodeStore } from 'src/stores/node';
import MonacoEditor from 'src/components/MonacoEditor.vue';
import { computed, reactive, watch } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();

const state = reactive({
  jsonError: null as string | null,
  documents: [] as any[],
  results: [] as any[],
  action: 'upsert' as 'create' | 'upsert' | 'update',
});

const actionOptions = ['create', 'upsert', 'update'];
const actionDescriptions = {
  create: 'Create a new document. Fails if id exists.',
  upsert: 'Create a new document or update an existing document.',
  update: 'Update an existing document. Partial document allowed.',
};

const documentsJson = computed({
  get: () => JSON.stringify(state.documents, null, 2),
  set: (json: string) => {
    try {
      state.documents = JSON.parse(json);
      state.jsonError = null;
    } catch (e) {
      state.jsonError = (e as Error).message;
    }
  },
});

watch(
  () => store.currentCollection,
  () => {
    state.documents = [];
    addEmptyDocument();
  },
  { immediate: true },
);

watch(
  () => store.documentsToEdit,
  () => {
    if (store.documentsToEdit && store.documentsToEdit.length > 0) {
      state.documents = store.documentsToEdit || [];
      state.action = 'upsert';
      store.setDocumentsToEdit([]);
    }
  },
  { immediate: true },
);

async function importFile() {
  state.results = [];
  try {
    $q.loading.show({
      message: 'Uploading. Please wait...',
      boxClass: 'bg-grey-2 text-grey-9',
      spinnerColor: 'primary',
    });
    // @ts-expect-error electron only
    let results = await store.api?.importFile(store.currentCollection?.name, state.action);
    if (!Array.isArray(results)) {
      results = [{ error: results }];
    }
    state.results = results;
  } catch (error) {
    state.results = [{ error: (error as Error).message }];
  }
  $q.loading.hide();
}

async function importDocuments() {
  state.results = [];
  try {
    $q.loading.show({
      message: 'Uploading. Please wait...',
      boxClass: 'bg-grey-2 text-grey-9',
      spinnerColor: 'primary',
    });
    state.results = await store.importDocuments({
      action: state.action,
      documents: JSON.parse(JSON.stringify(state.documents)),
    });
  } catch (error) {
    state.results = [{ error: (error as Error).message }];
  }
  $q.loading.hide();
}

function addEmptyDocument() {
  let document = {};
  if (store.currentCollection && store.currentCollection.fields) {
    document = store.currentCollection.fields.reduce((obj: any, field): any => {
      obj[field.name] = field.type.includes('[]')
        ? []
        : field.type.includes('string')
          ? ''
          : field.type.includes('bool')
            ? false
            : 0;
      return obj;
    }, {});
  }
  state.documents.push(document);
}
</script>
