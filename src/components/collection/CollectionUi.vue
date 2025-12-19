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
      :style="createMode ? 'height: 60vh' : ''"
      class="bg-surface"
    >
      <q-tab-panel name="form">
        <q-card-section>
          <div class="row q-gutter-md">
            <q-input
              v-model="schema.name"
              class="col"
              filled
              dense
              label="Collection Name"
              placeholder="books"
              :disable="!createMode"
              :rules="[(val) => !!val || 'Field is required']"
            />
            <q-select
              v-model="schema.default_sorting_field"
              filled
              class="col"
              dense
              :options="availableSortFields"
              label="Default sort field optional, but must be int32 or float"
            >
            </q-select>
          </div>
          <div class="text-subtitle1 q-pt-md">Fields</div>
          <q-card
            v-for="(field, index) in schema.fields"
            :key="index"
            flat
            bordered
            class="q-mb-md"
          >
            <q-card-section class="row q-col-gutter-md">
              <q-input
                v-model="field.name"
                class="col-12 col-sm-6"
                dense
                outlined
                label="Field Name"
                placeholder="title"
                :rules="[(val) => !!val || 'Field is required']"
              />

              <q-select
                v-model="field.type"
                class="col-12 col-sm-4"
                dense
                outlined
                label="type"
                :options="types"
                :rules="[(val) => !!val || 'Field is required']"
              />
              <q-input
                v-if="field.type === 'float[]'"
                v-model.number="field.num_dim"
                class="col-12 col-sm-2"
                dense
                outlined
                type="number"
                label="num_dim"
                placeholder=""
              />
              <q-input
                v-if="field.type.startsWith('string')"
                v-model="field.locale"
                class="col-12 col-sm-2"
                dense
                outlined
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
                <q-select
                  v-if="field.stem"
                  :model-value="getStemDictionaryValue(field)"
                  :options="stemmingDictionaryOptions"
                  dense
                  outlined
                  label="Stemming Dictionary"
                  class="q-mt-sm"
                  style="min-width: 200px"
                  @update:model-value="setStemDictionaryValue(field, $event)"
                />
              </div>

              <q-btn size="md" padding="sm lg" unelevated @click="removeField(field)"
                >Remove Field</q-btn
              >
            </q-card-actions>
          </q-card>
        </q-card-section>
      </q-tab-panel>

      <q-tab-panel name="json" class="q-pa-none">
        <monaco-editor v-model="schemaJson" style="height: 60vh"></monaco-editor>
        <q-banner v-if="jsonError" inline-actions class="text-white bg-red">
          Invalid Format: {{ jsonError }}
        </q-banner>
      </q-tab-panel>
    </q-tab-panels>
    <q-separator />
    <q-card-actions align="between" class="bg-primary">
      <q-btn size="md" padding="sm lg" unelevated color="primary" @click="addField()"
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
import type {
  CollectionFieldSchema,
  CollectionSchema,
  CollectionUpdateSchema,
} from 'typesense/lib/Typesense/Collection';
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import { defineComponent } from 'vue';
import { mapState } from 'pinia';
import { useNodeStore } from 'src/stores/node';
import MonacoEditor from '../MonacoEditor.vue';

export default defineComponent({
  name: 'CollectionUi',
  components: { MonacoEditor },
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
              stem_dictionary: '',
            } as unknown,
          ],
          default_sorting_field: '',
          token_separators: [],
          symbols_to_index: [],
          enable_nested_fields: false,
        }) as CollectionCreateSchema,
    },
    primaryActionLabel: {
      type: String,
      required: true,
    },
    createMode: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['submit'],
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
        'geopolygon',
        'object',
        'object[]',
        'string*',
        'image',
        'auto',
      ],
      jsonError: null as string | null,
    };
  },
  computed: {
    ...mapState(useNodeStore, {
      stemmingDictionaries: (store) => store.data.stemmingDictionaries,
    }),
    availableSortFields(): string[] {
      const compatibleFields = (this.schema.fields || []).filter(
        (field) =>
          ['int32', 'int64', 'float'].includes(field.type) ||
          (field.type === 'string' && field.sort),
      );
      // empty option + compatible field names
      return [''].concat(compatibleFields.map((field) => field.name));
    },
    stemmingDictionaryOptions(): string[] {
      return ['default'].concat(this.stemmingDictionaries || []);
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
        // @ts-expect-error custom field
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
          stem_dictionary: '',
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
    getStemDictionaryValue(field: any) {
      return field.stem_dictionary || 'default';
    },
    setStemDictionaryValue(field: any, value: string) {
      if (value === 'default') {
        field.stem_dictionary = '';
      } else {
        field.stem_dictionary = value;
      }
    },
  },
});
</script>
