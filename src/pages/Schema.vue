<template>
  <q-page padding class="column">
    <div class="row justify-between q-mb-md">
      <div class="text-h5">
        <q-icon size="md" name="sym_s_data_object" /> Schema for
        {{ store.currentCollection?.name }}
      </div>
      <q-btn unelevated color="negative" @click="drop(store.currentCollection?.name || '')"
        >Drop Collection</q-btn
      >
    </div>
    <collection-ui :initial-schema="schema" primary-action-label="Update Schema" @submit="update" />
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useNodeStore } from 'src/stores/node';
import CollectionUi from 'components/collection/CollectionUi.vue';
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import type {
  CollectionDropFieldSchema,
  CollectionSchema,
  CollectionUpdateSchema,
} from 'typesense/lib/Typesense/Collection';

const $q = useQuasar();
const store = useNodeStore();

const schema = computed<CollectionSchema | CollectionCreateSchema>(() => {
  const collection = store.currentCollection;
  if (collection) {
    const schema: any = {
      name: collection.name,
      fields: collection.fields?.map((f: any) => {
        const knownKeys = ['name', 'type', 'facet', 'optional', 'index', 'sort', 'infix', 'locale'];
        const missingKeys = Object.keys(f).filter((k) => !knownKeys.includes(k));

        return knownKeys.concat(missingKeys).reduce((acc, key: any) => {
          acc[key] = f[key];
          return acc;
        }, {} as any);
      }),
      default_sorting_field: collection.default_sorting_field,
    };

    const otherKeys = Object.keys(collection).filter(
      (k) =>
        !['name', 'fields', 'default_sorting_field', 'created_at', 'num_documents'].includes(k),
    );
    otherKeys.forEach((k: any) => {
      // @ts-expect-error any
      schema[k] = collection[k];
    });

    return schema;
  }
  return {
    name: '',
    fields: [],
    default_sorting_field: '',
    token_separators: [],
    symbols_to_index: [],
    enable_nested_fields: false,
  };
});

function drop(name: string) {
  $q.dialog({
    title: 'Confirm',
    message: `Drop ${name} and all documents?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void store.dropCollection(name);
  });
}

function update(updatedSchema: CollectionUpdateSchema) {
  if (!schema.value || !schema.value.name || !schema.value.fields) {
    return;
  }
  const update = {
    fields: schema.value.fields
      .map((f: any) => {
        return {
          name: f.name,
          drop: true,
        } as CollectionDropFieldSchema;
      })
      .concat(JSON.parse(JSON.stringify(updatedSchema.fields))),
  } as CollectionUpdateSchema;

  void store.updateCollection({
    collectionName: schema.value.name,
    schema: update,
  });
}
</script>
