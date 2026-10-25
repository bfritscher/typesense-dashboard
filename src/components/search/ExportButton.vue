<template>
  <q-btn-dropdown
    split
    unelevated
    outline
    color="primary"
    icon="download"
    :label="label"
    :disable="disable"
    @click="emit('export', format, scope)"
  >
    <q-list dense>
      <template v-for="(group, index) in groups" :key="group.scope">
        <q-separator v-if="index > 0" />
        <q-item-label v-if="allowAll" header class="q-pb-none">{{ group.label }}</q-item-label>
        <q-item
          v-for="option in formats"
          :key="option.value"
          v-close-popup
          clickable
          :active="group.scope === scope && option.value === format"
          @click="choose(option.value, group.scope)"
        >
          <q-item-section>{{ option.label }}</q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { LocalStorage } from 'quasar';

export type ExportFormat = 'json' | 'csv';
export type ExportScope = 'page' | 'all';

const props = defineProps<{
  disable?: boolean;
  /** Offer "all results" besides the current page. */
  allowAll?: boolean;
}>();
const emit = defineEmits<{ export: [format: ExportFormat, scope: ExportScope] }>();

const STORAGE_KEY_EXPORT_FORMAT = 'typesense-export-format';
const STORAGE_KEY_EXPORT_SCOPE = 'typesense-export-scope';
const formats: { value: ExportFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
];
const allGroups: { scope: ExportScope; label: string }[] = [
  { scope: 'page', label: 'Current page' },
  { scope: 'all', label: 'All results' },
];

const groups = computed(() => (props.allowAll ? allGroups : allGroups.slice(0, 1)));

// A menu pick exports right away and becomes the default for the main button.
const storedFormat = LocalStorage.getItem<ExportFormat>(STORAGE_KEY_EXPORT_FORMAT);
const storedScope = LocalStorage.getItem<ExportScope>(STORAGE_KEY_EXPORT_SCOPE);
const format = ref<ExportFormat>(storedFormat === 'csv' ? 'csv' : 'json');
const storedChoice = ref<ExportScope>(storedScope === 'all' ? 'all' : 'page');
const scope = computed<ExportScope>(() => (props.allowAll ? storedChoice.value : 'page'));

const label = computed(() =>
  props.allowAll
    ? `Export ${scope.value === 'all' ? 'all' : 'page'} ${format.value.toUpperCase()}`
    : `Export ${format.value.toUpperCase()}`,
);

const choose = (value: ExportFormat, chosenScope: ExportScope) => {
  format.value = value;
  storedChoice.value = chosenScope;
  LocalStorage.set(STORAGE_KEY_EXPORT_FORMAT, value);
  LocalStorage.set(STORAGE_KEY_EXPORT_SCOPE, chosenScope);
  emit('export', value, chosenScope);
};
</script>
