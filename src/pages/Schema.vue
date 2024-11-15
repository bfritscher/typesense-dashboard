<template>
  <q-page padding class="column">
    <div class="row justify-between q-mb-md">
      <div class="text-h5">
        <q-icon size="md" name="sym_s_data_object" /> Schema for
        {{ $store.state.node.currentCollection?.name }}
      </div>
      <q-btn
        unelevated
        color="negative"
        @click="drop($store.state.node.currentCollection?.name || '')"
        >Drop Collection</q-btn
      >
    </div>
    <collection-ui
      :initial-schema="schema"
      primary-action-label="Update Schema"
      @submit="update"
    />
  </q-page>
</template>

<script lang="ts">
import CollectionUi from 'components/collection/CollectionUi.vue';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import {
  CollectionDropFieldSchema,
  CollectionSchema,
  CollectionUpdateSchema,
} from 'typesense/lib/Typesense/Collection';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Schema',
  components: {
    CollectionUi,
  },
  computed: {
    schema(): CollectionSchema | CollectionCreateSchema {
      const collection: any = this.$store.state.node.currentCollection;
      if (collection) {
        const schema: any = {
          name: collection.name,
          fields: collection.fields.map((f: any) => {
            const knownKeys = [
              'name',
              'type',
              'facet',
              'optional',
              'index',
              'sort',
              'infix',
              'locale',
            ];
            const missingKeys = Object.keys(f).filter(
              (k) => !knownKeys.includes(k)
            );
            //eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return knownKeys.concat(missingKeys).reduce((acc, key: any) => {
              acc[key] = f[key];
              //eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return acc;
            }, {} as any);
          }),
          default_sorting_field: collection.default_sorting_field,
        };

        const otherKeys = Object.keys(collection).filter(
          (k) =>
            ![
              'name',
              'fields',
              'default_sorting_field',
              'created_at',
              'num_documents',
            ].includes(k)
        );
        otherKeys.forEach((k: any) => {
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
    },
  },
  methods: {
    drop(name: string) {
      this.$q
        .dialog({
          title: 'Confirm',
          message: `Drop ${name} and all documents?`,
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          void this.$store.dispatch('node/dropCollection', name);
        });
    },
    update(updatedSchema: CollectionUpdateSchema) {
      if (!this.schema || !this.schema.name || !this.schema.fields) {
        return;
      }
      const update = {
        fields: this.schema.fields
          .map((f: any) => {
            return {
              name: f.name,
              drop: true,
            } as CollectionDropFieldSchema;
          })
          .concat(JSON.parse(JSON.stringify(updatedSchema.fields))),
      } as CollectionUpdateSchema;

      void this.$store.dispatch('node/updateCollection', {
        collectionName: this.schema.name,
        schema: update,
      });
    },
  },
});
</script>
