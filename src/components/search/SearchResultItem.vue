<template>
  <div v-if="currentCollection" class="column no-wrap search-result-item">
    <q-list dense>
      <q-item v-for="field in currentCollection.fields" :key="field.name">
        <q-item-section side class="q-mt-sm text-body2">
          <q-item-label caption>
            {{ field.name }}
            <span v-if="item && Array.isArray(item[field.name])"
              >[{{ item[field.name].length }}]</span
            ></q-item-label
          >
          <q-item-label
            class="overflow-hidden text-no-wrap text-ellipsis"
            :title="item && item[field.name]"
          >
            <div
              v-if="item && Array.isArray(item._highlightResult[field.name])"
              class="array-field"
            >
              <div
                v-for="(result, index) in item._highlightResult[field.name]"
                :key="index"
              >
                <div v-if="!result.value">
                  <div v-for="(_, propertyIndex) in item[field.name][index]" :key="propertyIndex">
                    <div v-if="Array.isArray(item[field.name][index][propertyIndex])">
                      <span
                        v-for="(__, nestedIndex) in item[field.name][index][propertyIndex]"
                        :key="nestedIndex"
                      >
                        <ais-highlight
                          :hit="item"
                          :attribute="field.name + '.' + index + '.' + propertyIndex+ '.' + nestedIndex"
                        />
                        <span v-if="nestedIndex < item[field.name][index][propertyIndex].length - 1">, </span>
                      </span>
                    </div>
                    <div v-else>
                      <ais-highlight :attribute="field.name+'.'+index+'.'+propertyIndex" :hit="item" />
                    </div>
                  </div>
                </div>
                <div v-else v-html="result.value" />
              </div>
            </div>
            <div v-else>
              <div v-if="field.name.includes('.*')">
                <div v-if="item && Array.isArray(item[field.name])">
                  <div v-for="(value, index) in item[field.name]" :key="index">
                    {{ value }}
                  </div>
                </div>
                <div v-else>{{ item && item[field.name] }}</div>
              </div>
              <ais-highlight v-else :attribute="field.name" :hit="item" />
            </div>
          </q-item-label>
          <q-item-label v-if="item && isImage(item[field.name])" caption class="img-preview">
            <q-img :src="item[field.name]" fit="contain" class="img-preview" />
          </q-item-label>
        </q-item-section>
        <q-item-section v-if="item && isUrl(item[field.name])" side top>
          <q-item-label>
            <q-btn
              flat
              :href="item[field.name]"
              target="_blank"
              size="sm"
              padding="sm"
              icon="sym_s_open_in_new"
              title="open"
            ></q-btn>
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-separator></q-separator>
      <q-item v-for="field in fieldsNotInSchema" :key="field">
        <q-item-section side class="q-mt-sm text-body2">
          <q-item-label caption> {{ field }} </q-item-label>
          <q-item-label
            class="overflow-hidden text-no-wrap text-ellipsis"
            :title="JSON.stringify(item && item[field], null, 2)"
          >
            {{ item && item[field] }}
          </q-item-label>
          <q-item-label v-if="isImage(item && item[field])" caption class="img-preview">
            <q-img :src="item && item[field]" fit="contain" class="img-preview" />
          </q-item-label>
        </q-item-section>
        <q-item-section v-if="isUrl(item && item[field])" side top>
          <q-item-label>
            <q-btn
              flat
              :href="item && item[field]"
              target="_blank"
              size="sm"
              padding="sm"
              icon="sym_s_open_in_new"
              title="open"
            ></q-btn>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
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

const props = defineProps<{
  item?: Record<string, any>;
}>();

const store = useNodeStore();
const $q = useQuasar();

const currentCollection = computed((): CollectionSchema | null => {
  return store.currentCollection;
});

const fieldsNotInSchema = computed((): string[] => {
  if (!props.item || !currentCollection.value || !currentCollection.value.fields) return [];
  const lookup = currentCollection.value.fields
    .map((f) => f.name)
    .concat(['objectID', 'text_match']);
  return Object.keys(props.item).filter((k) => !k.startsWith('_') && !lookup.includes(k));
});

const isUrl = (str: string) => {
  if (!str) return false;
  str = String(str);
  return str.startsWith('http://') || str.startsWith('https://');
};

const isImage = (filename: string) => {
  if (!filename) return false;
  filename = String(filename);
  const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  return validImageExtensions.includes(extension);
};

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
.text-ellipsis {
  text-overflow: ellipsis;
}
.search-result-item {
  flex: 1;
}
.img-preview {
  width: 100%;
  height: 150px;
}
.array-field {
  max-height: 150px;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
