<template>
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
      :style="createMode? 'height: 60vh' : ''"
      class="bg-surface"
    >
      <q-tab-panel name="form">
        <q-card-section>
          <div class="row q-gutter-md">
            <q-input
              class="col"
              filled
              dense
              v-model="schema.name"
              label="Collection Name"
              placeholder="books"
              :disable="!createMode"
              :rules="[(val) => !!val || 'Field is required']"
            />
            <q-select
              filled
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
            class="q-mb-md"
          >
            <q-card-section class="row q-col-gutter-md">
              <q-input
                class="col-12 col-sm-6"
                dense
                outlined
                v-model="field.name"
                label="Field Name"
                placeholder="title"
                :rules="[(val) => !!val || 'Field is required']"
              />

              <q-select
                class="col-12 col-sm-4"
                dense
                outlined
                v-model="field.type"
                label="type"
                :options="types"
                :rules="[(val) => !!val || 'Field is required']"
              />
              <q-input
                v-if="field.type === 'float[]'"
                class="col-12 col-sm-2"
                dense
                outlined
                type="number"
                v-model.number="field.num_dim"
                label="num_dim"
                placeholder=""
              />
              <q-input
                v-if="field.type.startsWith('string')"
                class="col-12 col-sm-2"
                dense
                outlined
                v-model="field.locale"
                label="locale"
                placeholder=""
              />
            </q-card-section>
            <q-separator></q-separator>
            <q-card-actions align="between">
              <div>
                <q-checkbox v-model="field.optional" label="optional" />
                <q-checkbox v-model="field.facet" label="facet" />
                <q-checkbox v-model="field.index" label="index" />
                <q-checkbox v-model="field.sort" label="sort" />
                <q-checkbox v-model="field.infix" label="infix" />
                <q-checkbox v-model="field.stem" label="stem" />
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
        @click="$emit('submit', schema)"
        >{{ primaryActionLabel }}</q-btn
      >
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { CollectionFieldSchema, CollectionSchema, CollectionUpdateSchema } from 'typesense/lib/Typesense/Collection';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import { defineComponent } from 'vue';
import MonacoEditor from '../MonacoEditor.vue';

export default defineComponent({
  components: { MonacoEditor },
  name: 'CollectionUi',
  emits: ['submit'],
  props: {
    initialSchema: {
      type: Object as () => CollectionCreateSchema | CollectionSchema | CollectionUpdateSchema,
      default: () =>
        ({
          name: '',
          fields: [
            {
              name: '',
              type: 'string',
              facet: false,
              optional: false,
              index: true,
              sort: false,
              infix: false,
              stem: false,
              locale: '',
              num_dim: undefined,
            } as CollectionFieldSchema,
          ],
          default_sorting_field: '',
          token_separators: [],
          symbols_to_index: [],
          enable_nested_fields: false,
        } as CollectionCreateSchema),
    },
    primaryActionLabel: {
      type: String,
      required: true,
    },
    createMode: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      tab: 'form',
      schema: {
        name: '',
        fields: [],
        default_sorting_field: '',
        token_separators: [],
        symbols_to_index: [],
        enable_nested_fields: false,
      } as CollectionCreateSchema,
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
        'object',
        'object[]',
        'string*',
        'auto',
      ],
      jsonError: null as string | null,
    };
  },
  computed: {
    availableSortFields(): string[] {
      const compatibleFields = (this.schema.fields || []).filter(
        (field) =>
          ['int32', 'float'].includes(field.type) ||
          (field.type === 'string' && field.sort)
      );
      // empty option + compatible field names
      return [''].concat(compatibleFields.map((field) => field.name));
    },
    schemaJson: {
      get(): string {
        return JSON.stringify(this.schema, null, 2);
      },
      set(json: string) {
        try {
          this.schema = JSON.parse(json);
          this.jsonError = null;
        } catch (e) {
          this.jsonError = (e as Error).message;
        }
      },
    },
  },
  watch: {
    initialSchema: {
      immediate: true,
      handler(schema: CollectionCreateSchema) {
        this.schema = JSON.parse(JSON.stringify(schema));
      },
    },
  },
  methods: {
    addField() {
      if (this.schema.fields) {
        this.schema.fields.push({
          name: '',
          type: 'string',
          facet: false,
          optional: false,
          index: true,
          sort: false,
          infix: false,
          stem: false,
          locale: '',
          num_dim: undefined,
        });
      }
    },
    removeField(field: CollectionFieldSchema) {
      if (this.schema.fields) {
        const index = this.schema.fields.indexOf(field);
        if (index > -1) {
          this.schema.fields.splice(index, 1);
        }
      }
    },
  },
});
</script>
