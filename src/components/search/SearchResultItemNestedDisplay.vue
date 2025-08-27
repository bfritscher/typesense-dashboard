<template>
  <q-list dense>
    <q-item v-for="key in sortedKeys" :key="key">
      <q-item-section side class="q-mt-sm text-body2">
        <q-item-label
          caption
          :class="props.includeFields.includes(key) ? 'schema-field' : 'text-warning unknown-field'"
        >
          {{ key }}
          <span v-if="Array.isArray(item[key]) && item[key].length > 1"
            >[{{ item[key].length }}]</span
          >
        </q-item-label>
        <q-item-label
          v-if="!props.embedFields.includes(key)"
          class="overflow-hidden text-no-wrap text-ellipsis"
          :title="JSON.stringify(extractValue(item[key]), null, 2)"
        >
          <div
            v-if="Array.isArray(item[key])"
            :class="isArrayField(item[key]) ? 'array-field' : 'nested-field'"
          >
            <template v-for="(subitem, index) in item[key]" :key="index">
              <div v-if="subitem.value && subitem.matchLevel">
                <search-result-item-attribute :hit="subitem" />
              </div>
              <search-result-item-nested-display
                v-else
                :item="subitem"
                :include-fields="nestedFieldsFor(props.includeFields, key)"
                :embed-fields="nestedFieldsFor(props.embedFields, key)"
              />
            </template>
          </div>
          <div v-else>
            <search-result-item-attribute :hit="item[key]" />
          </div>
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import SearchResultItemAttribute from './SearchResultItemAttribute.vue';
const props = withDefaults(
  defineProps<{
    item: Record<string, any>;
    includeFields?: string[];
    embedFields?: string[];
  }>(),
  {
    includeFields: () => [],
    embedFields: () => [],
  },
);

function isArrayField(obj: any) {
  return obj.some((subitem: any) => subitem.value && subitem.matchLevel);
}

function nestedFieldsFor(fields: string[], key: string) {
  return fields
    .filter((field) => {
      return field.startsWith(key) && field !== key;
    })
    .map((field) => field.replace(`${key}.`, ''));
}

const sortedKeys = computed(() => {
  const keys = Object.keys(props.item);
  return props.includeFields
    .filter((key) => keys.includes(key))
    .concat(keys.filter((key) => !props.includeFields.includes(key)));
});

function extractValue(item: any): any {
  // Handle primitive values
  if (item === null || item === undefined || typeof item !== 'object') {
    return item;
  }

  if (Array.isArray(item)) {
    return item.map((subitem: any) => extractValue(subitem));
  }

  if (
    Object.prototype.hasOwnProperty.call(item, 'value') &&
    Object.prototype.hasOwnProperty.call(item, 'matchLevel')
  ) {
    return item.value;
  }

  const values: Record<string, any> = {};
  for (const key in item) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      values[key] = extractValue(item[key]);
    }
  }
  return values;
}
</script>
<style>
.text-ellipsis {
  text-overflow: ellipsis;
}

.array-field {
  max-height: 150px;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
