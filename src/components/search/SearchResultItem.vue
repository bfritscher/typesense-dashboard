<template>
  <div v-if="currentCollection" class="column no-wrap search-result-item">
    <div class="row no-wrap items-start">
      <search-result-item-nested-display
        v-if="item"
        class="col result-fields"
        :item="item._highlightResult"
        :include-fields="collectionFields"
        :embed-fields="embedFields"
      />
      <!-- the first image sits top-right, the fields wrap beside it -->
      <div v-if="images.length" class="result-thumbnail q-pa-sm">
        <q-img :src="images[0]" fit="contain" ratio="1" class="rounded-borders" />
        <q-badge v-if="images.length > 1" color="grey-8" floating>+{{ images.length - 1 }}</q-badge>
      </div>
    </div>
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
import { useNodeStore } from '@/stores/node';
import SearchResultItemNestedDisplay from './SearchResultItemNestedDisplay.vue';
import { collectImageUrls } from '@/shared/image';

const props = defineProps<{
  item?: Record<string, any>;
}>();
const emit = defineEmits<(e: 'deleted', id: string) => void>();

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
  return currentCollection.value.fields.filter((f) => f.embed).map((f) => f.name);
});

const images = computed((): string[] => {
  if (!props.item) return [];
  const document: Record<string, unknown> = {};
  Object.entries(props.item).forEach(([key, value]) => {
    if (!key.startsWith('_') && key !== 'objectID') document[key] = value;
  });
  return collectImageUrls(document);
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
    store
      .deleteDocumentById(id)
      ?.then(() => {
        emit('deleted', id);
      })
      .catch((error: Error) => {
        $q.notify({
          type: 'negative',
          message: `Error deleting document: ${error.message}`,
        });
      });
  });
};
</script>

<style>
.search-result-item {
  flex: 1;
}

.result-fields {
  min-width: 0;
}

.result-thumbnail {
  position: relative;
  flex: 0 0 120px;
  width: 120px;
}
</style>
