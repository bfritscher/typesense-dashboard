<template>
  <ais-highlight attribute="a" :hit="{ _highlightResult: { a: hitForHighlight } }" />
  <div v-if="isImage(hitValue)" class="img-preview">
    <q-img :src="hitValue" fit="contain" class="img-preview" />
  </div>
  <q-btn
    v-if="isUrl(hitValue)"
    class="absolute-top-right"
    flat
    :href="hitValue"
    target="_blank"
    size="sm"
    padding="sm"
    icon="sym_s_open_in_new"
    title="open"
  ></q-btn>
</template>
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  hit: {
    value: unknown;
    matchLevel: unknown;
  };
}>();

function unknownToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return '';
}

const hitValue = computed(() => {
  return unknownToString(props.hit?.value);
});

const hitForHighlight = computed(() => {
  const matchLevel = unknownToString(props.hit?.matchLevel);
  return { value: hitValue.value, matchLevel };
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
</script>

<style scoped>
.ais-Highlight {
  display: block;
  text-overflow: ellipsis;
  overflow: hidden;
}

.img-preview {
  width: 100%;
  height: 150px;
}
</style>
