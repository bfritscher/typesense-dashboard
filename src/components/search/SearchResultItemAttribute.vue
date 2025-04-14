<template>
  <ais-highlight attribute="a" :hit="{ _highlightResult: { a: hit } }" />
  <div v-if="isImage(hit?.value)" class="img-preview">
    <q-img :src="hit.value" fit="contain" class="img-preview" />
  </div>
  <q-btn
    v-if="isUrl(hit?.value)"
    class="absolute-top-right"
    flat
    :href="hit.value"
    target="_blank"
    size="sm"
    padding="sm"
    icon="sym_s_open_in_new"
    title="open"
  ></q-btn>
</template>
<script setup lang="ts">
defineProps<{
  hit: {
    value: string;
    matchLevel: string;
  };
}>();

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

<style>
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
