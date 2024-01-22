<template>
  <q-list bordered class="rounded-borders">
    <q-expansion-item
      expand-separator
      icon="sym_s_library_add"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      label="Add Collection"
      header-class="bg-primary text-white"
    >
      <collection-ui
        primary-action-label="Create Collection"
        create-mode
        @submit="createCollection"
      />
    </q-expansion-item>
  </q-list>
</template>

<script lang="ts">
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import { defineComponent } from 'vue';
import CollectionUi from './CollectionUi.vue';

export default defineComponent({
  components: { CollectionUi },
  name: 'CollectionCreate',
  methods: {
    createCollection(schemaToCreate: CollectionCreateSchema) {
      const schema = JSON.parse(JSON.stringify(schemaToCreate));
      for (const field of schema.fields) {
        if (field.type !== 'float[]' || !field.num_dim) {
          delete field.num_dim;
        }
        if (field.type.startsWith('object')) {
          schema.enable_nested_fields = true;
        }
      }
      void this.$store.dispatch('node/createCollection', schema);
    },
  },
});
</script>
