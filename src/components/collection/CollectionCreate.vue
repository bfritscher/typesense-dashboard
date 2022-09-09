<template>
  <q-list bordered class="rounded-borders">
    <q-expansion-item
      expand-separator
      icon="post_add"
      label="Add Collection"
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
          <q-tab name="form" label="Form Mode" />
          <q-tab name="json" label="JSON Mode" />
        </q-tabs>

        <q-separator />

        <q-tab-panels
          v-model="tab"
          animated
          style="height: 60vh"
          class="bg-grey-3"
        >
          <q-tab-panel name="form">
            <q-card-section>
              <div class="row q-gutter-md">
                <q-input
                  class="col"
                  filled
                  bg-color="white"
                  dense
                  v-model="schema.name"
                  label="Collection Name"
                  placeholder="books"
                  :rules="[(val) => !!val || 'Field is required']"
                />
                <q-select
                  filled
                  bg-color="white"
                  class="col"
                  dense
                  v-model="schema.default_sorting_field"
                  :options="availableSortFields"
                  label="Default sort field optional, but must be int32 or float"
                >
                </q-select>
              </div>
              <div class="text-subtitle1 q-pt-md">Fields</div>
              <q-card
                flat
                bordered
                v-for="(field, index) in schema.fields"
                :key="index"
                class="bg-grey-1 q-mb-md"
              >
                <q-card-section class="row q-gutter-md">
                  <q-input
                    class="col"
                    dense
                    filled
                    bg-color="white"
                    v-model="field.name"
                    label="Field Name"
                    placeholder="title"
                    :rules="[(val) => !!val || 'Field is required']"
                  />

                  <q-select
                    class="col"
                    dense
                    filled
                    bg-color="white"
                    v-model="field.type"
                    label="type"
                    :options="types"
                    :rules="[(val) => !!val || 'Field is required']"
                  />
                </q-card-section>
                <q-separator></q-separator>
                <q-card-actions align="between">
                  <div>
                    <q-checkbox v-model="field.optional" label="optional" />
                    <q-checkbox v-model="field.facet" label="facet" />
                    <q-checkbox v-model="field.index" label="index" />
                    <q-checkbox v-model="field.sort" label="sort" />
                  </div>

                  <q-btn
                    size="md"
                    padding="sm lg"
                    unelevated
                    @click="removeField(field)"
                    >Remove Field</q-btn
                  >
                </q-card-actions>
              </q-card>
            </q-card-section>
          </q-tab-panel>

          <q-tab-panel name="json" class="q-pa-none">
            <monaco-editor
              v-model="schemaJson"
              style="height: 60vh"
            ></monaco-editor>
            <q-banner inline-actions class="text-white bg-red" v-if="jsonError">
              Invalid Format: {{ jsonError }}
            </q-banner>
          </q-tab-panel>
        </q-tab-panels>
        <q-separator />
        <q-card-actions align="between" class="bg-primary">
          <q-btn
            size="md"
            padding="sm lg"
            unelevated
            color="primary"
            @click="addField()"
            >Add field</q-btn
          >
          <q-btn
            size="md"
            padding="sm lg"
            unelevated
            color="primary"
            @click="createCollection()"
            >Create Collection</q-btn
          >
        </q-card-actions>
      </q-card>
    </q-expansion-item>
  </q-list>
</template>

<script lang="ts">
import * as Typesense from 'typesense';
import { defineComponent } from 'vue';
import MonacoEditor from '../MonacoEditor.vue';

export default defineComponent({
  components: { MonacoEditor },
  name: 'CollectionCreate',
  data() {
    return {
      tab: 'form',
      schema: {
        name: '',
        fields: [],
        default_sorting_field: '',
        token_separators: [],
        symbols_to_index: []
      } as Typesense.Collection,
      types: [
        'string',
        'string[]',
        'int32',
        'int32[]',
        'int64',
        'int64[]',
        'float',
        'float[]',
        'bool',
        'bool[]',
        'geopoint',
        'geopoint[]',
        'string*',
        'auto',
      ],
      jsonError: null as string | null,
    };
  },
  mounted() {
    this.addField();
  },
  computed: {
    availableSortFields(): string[] {
      const compatibleFields = this.schema.fields.filter((field) =>
        ['int32', 'float'].includes(field.type) || (field.type === 'string' && field.sort)
      );
      // emtpy option + compatible field names
      return [''].concat(compatibleFields.map((field) => field.name));
    },
    schemaJson: {
      get(): string {
        return JSON.stringify(this.schema, null, 2);
      },
      set(json) {
        try {
          this.schema = JSON.parse(json);
          this.jsonError = null;
        } catch (e) {
          this.jsonError = (e as Error).message;
        }
      },
    },
  },
  methods: {
    addField() {
      this.schema.fields.push({
        name: '',
        type: 'string',
        optional: false,
        facet: false,
        index: true,
      });
    },
    removeField(field: Typesense.CollectionField) {
      this.schema.fields.splice(this.schema.fields.indexOf(field), 1);
    },
    createCollection() {
      void this.$store.dispatch('node/createCollection', this.schema);
    },
  },
});
</script>
