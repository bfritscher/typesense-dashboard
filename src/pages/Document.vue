<template>
  <q-page padding class="column">
    <div class="row justify-between q-mb-md">
      <div class="text-h5">
        Add Documents to {{ $store.state.node.currentCollection?.name }}
      </div>
      <q-btn
        unelevated
        @click="importFile()"
        :disable="!$q.platform.is.electron"
        icon="attach_file"
      >
        Import from file
        <span v-if="!$q.platform.is.electron"> (only desktop version)</span>
      </q-btn>
    </div>
    <monaco-editor
      v-model="documentsJson"
      style="min-height: 200px"
    ></monaco-editor>
    <q-banner inline-actions class="text-white bg-red" v-if="jsonError">
      Invalid Format: {{ jsonError }}
    </q-banner>
    <div class="row q-mb-md bg-primary text-white justify-between">
      <q-btn
        unelevated
        size="md"
        padding="sm lg"
        color="primary"
        @click="addEmptyDocument()"
        >Add empty Document</q-btn
      >
      <div class="row col-auto">
        <q-select
          dark
          v-model="action"
          bottom-slots
          label="Action mode"
          filled
          style="width: 300px"
          :options="actionOptions"
        >
          <template v-slot:hint>
            <div>
              {{ actionDesciptions[action] }}
            </div>
          </template>
        </q-select>
        <q-btn
          unelevated
          size="md"
          padding="sm xl"
          color="primary"
          @click="importDocuments()"
          :disable="!!jsonError"
          >Import</q-btn
        >
      </div>
    </div>

    <div>
      <div v-for="(result, index) in results" :key="index">
        {{ index }}: <span v-if="result.success"> {{ result.success }}</span
        ><span v-else>{{ result.error }}</span>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import MonacoEditor from 'src/components/MonacoEditor.vue';
import { Collection } from 'typesense';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Document',
  components: { MonacoEditor },
  data() {
    return {
      jsonError: null as string | null,
      documents: [] as unknown[],
      results: [] as unknown[] | string,
      action: 'upsert',
      actionOptions: ['create', 'upsert', 'update'],
      actionDesciptions: {
        create: 'Create a new document. Fails if id exists.',
        upsert: 'Create a new document or update an existing document.',
        update: 'Update an existing document. Partial document allowed.',
      },
    };
  },
  computed: {
    documentsJson: {
      get(): string {
        return JSON.stringify(this.documents, null, 2);
      },
      set(json: string) {
        try {
          this.documents = JSON.parse(json);
          this.jsonError = null;
        } catch (e) {
          this.jsonError = (e as Error).message;
        }
      },
    },
    currentCollection(): Collection | null {
      return this.$store.state.node.currentCollection;
    },
    //eslint-disable-next-line
    documentsToEdit(): any[] | null {
      return this.$store.state.node.documentsToEdit;
    },
  },
  methods: {
    async importFile() {
      this.results = [];
      try {
        this.$q.loading.show({
          message: 'Uploading. Please wait...',
          boxClass: 'bg-grey-2 text-grey-9',
          spinnerColor: 'primary',
        });
        this.results = await this.$store.getters['node/api'].importFile(
          this.currentCollection?.name,
          this.action
        );
      } catch (error) {
        this.results = (error as Error).message;
      }
      this.$q.loading.hide();
    },
    async importDocuments() {
      this.results = [];
      try {
        this.$q.loading.show({
          message: 'Uploading. Please wait...',
          boxClass: 'bg-grey-2 text-grey-9',
          spinnerColor: 'primary',
        });
        this.results = await this.$store.dispatch('node/importDocuments', {
          action: this.action,
          documents: JSON.parse(JSON.stringify(this.documents)),
        });
      } catch (error) {
        this.results = (error as Error).message;
      }
      this.$q.loading.hide();
    },
    addEmptyDocument() {
      const document = this.currentCollection?.fields.reduce(
        //eslint-disable-next-line
        (obj: any, field): any => {
          obj[field.name] = field.type.includes('[]')
            ? []
            : field.type.includes('string')
            ? ''
            : field.type.includes('bool') ? false : 0;
          return obj;
        },
        {}
      );
      this.documents.push(document);
    },
  },
  watch: {
    currentCollection: {
      handler() {
        this.documents = [];
        this.addEmptyDocument();
      },
      immediate: true,
    },
    documentsToEdit: {
      handler() {
        if (this.documentsToEdit && this.documentsToEdit.length > 0) {
          this.documents = this.$store.state.node.documentsToEdit || [];
          this.action = 'upsert';
          this.$store.commit('node/setDocumentsToEdit', []);
        }
      },
      immediate: true,
    },
  },
});
</script>
