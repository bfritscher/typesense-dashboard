<template>
  <q-page padding class="column">
    <div class="row justify-between q-mb-md">
      <div class="text-h5">
        <q-icon size="md" name="sym_s_data_object" /> Schema for {{ $store.state.node.currentCollection?.name }}
      </div>
      <q-btn
        unelevated
        color="negative"
        @click="drop($store.state.node.currentCollection?.name || '')"
        >Drop Collection</q-btn
      >
    </div>
    <monaco-editor
      :model-value="schema"
      :options="{ readOnly: true }"
    ></monaco-editor>
  </q-page>
</template>

<script lang="ts">
import MonacoEditor from 'src/components/MonacoEditor.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Schema',
  components: {
    MonacoEditor,
  },
  computed: {
    schema(): string {
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

        return JSON.stringify(schema, null, 2);
      }
      return '';
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
  },
});
</script>
