<template>
  <div v-if="currentCollection" class="column no-wrap search-result-item">
    <search-result-item-nested-display
      v-if="item"
      :item="item._highlightResult"
      :include-fields="collectionFields"
      :embed-fields="embedFields"
    />
    <q-space />
    <q-separator></q-separator>
    <q-item>
      <q-item-section>
        <q-item-label>
          <q-btn
            flat
            size="sm"
            padding="sm"
            icon="sym_s_edit"
            title="Edit"
            @click="editDocument()"
          ></q-btn>
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-item-label>
          <q-btn
            flat
            size="sm"
            padding="sm"
            icon="sym_s_delete_forever"
            title="Delete"
            @click="deleteDocumentById(item?.id)"
          ></q-btn>
        </q-item-label>
      </q-item-section>
    </q-item>
  </div>
</template>

<script setup lang="ts">
import type { CollectionSchema } from 'typesense/lib/Typesense/Collection';
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useNodeStore } from 'src/stores/node';
import SearchResultItemNestedDisplay from './SearchResultItemNestedDisplay.vue';

const props = defineProps<{
  item?: Record<string, any>;
}>();

const store = useNodeStore();
const $q = useQuasar();

const currentCollection = computed((): CollectionSchema | null => {
  return store.currentCollection;
});

const collectionFields = computed((): string[] => {
  if (!props.item || !currentCollection.value || !currentCollection.value.fields) return [];
  return currentCollection.value.fields.map((f) => f.name);
});

const embedFields = computed((): string[] => {
  if (!props.item || !currentCollection.value || !currentCollection.value.fields) return [];
  return currentCollection.value.fields
    .filter((f) => f.embed)
    .map((f) => f.name);
});

const editDocument = () => {
  const copyItem: Record<string, any> = {};
  if (!props.item) return;
  Object.keys(props.item).forEach((key) => {
    if (!key.startsWith('_') && !['objectID', 'text_match'].includes(key)) {
      copyItem[key] = props.item?.[key];
    }
  });
  void store.editDocuments([JSON.parse(JSON.stringify(copyItem))]);
};

const deleteDocumentById = (id: string) => {
  $q.dialog({
    title: 'Confirm',
    message: `Delete document with id: ${id}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void store.deleteDocumentById(id);
  });
};
</script>

<style>
.search-result-item {
  flex: 1;
}
</style>
