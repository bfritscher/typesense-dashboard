<template>
  <q-input
    v-model="query"
    dense
    autofocus
    outlined
    type="search"
    clearable
    clear-icon="close"
    placeholder="Search..."
    @clear="clear"
  >
    <template #prepend>
      <q-icon name="search" />
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    delay?: number;
  }>(),
  {
    modelValue: '',
    delay: 200,
  },
);

const emit = defineEmits<{
  refine: [value: string];
}>();

const localQuery = ref(props.modelValue);
let timerId: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.modelValue,
  (modelValue) => {
    localQuery.value = modelValue;
  },
);

const query = computed({
  get: () => localQuery.value,
  set: (value: string) => {
    localQuery.value = value;
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => emit('refine', localQuery.value), props.delay);
  },
});

function clear() {
  query.value = '';
}

onUnmounted(() => {
  if (timerId) clearTimeout(timerId);
});
</script>
