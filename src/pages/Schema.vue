<template>
  <q-page padding class="column">
    <div class="row justify-between q-mb-md">
      <div class="text-h5">
        Schema for {{ $store.state.node.currentCollection?.name }}
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
      const collection = this.$store.state.node.currentCollection;
      if (collection) {
        return JSON.stringify(
          {
            name: collection.name,
            fields: collection.fields.map((f) => ({
              name: f.name,
              type: f.type,
              facet: f.facet,
              optional: f.optional,
              index: f.index,
            })),
            default_sorting_field: collection.default_sorting_field,
          },
          null,
          2
        );
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
