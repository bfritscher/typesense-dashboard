<template>
  <q-toolbar v-if="selectedCount > 0" class="bg-primary text-white q-mb-md" style="border-radius: 4px;">
    <q-toolbar-title class="text-body2">
      {{ selectedCount }} product{{ selectedCount !== 1 ? 's' : '' }} selected
    </q-toolbar-title>

    <q-btn-dropdown flat label="Bulk Actions" icon="sym_s_edit_note" no-caps>
      <q-list>
        <q-item v-close-popup clickable @click="confirmAction('Set Featured', 'is_featured', true)">
          <q-item-section>Set Featured</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="confirmAction('Remove Featured', 'is_featured', false)">
          <q-item-section>Remove Featured</q-item-section>
        </q-item>
        <q-separator />
        <q-item v-close-popup clickable @click="confirmAction('Set Promoted', 'is_promoted', true)">
          <q-item-section>Set Promoted</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="confirmAction('Remove Promoted', 'is_promoted', false)">
          <q-item-section>Remove Promoted</q-item-section>
        </q-item>
        <q-separator />
        <q-item v-close-popup clickable @click="confirmAction('Set Exclusive', 'is_exclusive', true)">
          <q-item-section>Set Exclusive</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="confirmAction('Remove Exclusive', 'is_exclusive', false)">
          <q-item-section>Remove Exclusive</q-item-section>
        </q-item>
        <q-separator />
        <q-item v-close-popup clickable @click="confirmAction('Set Pin #1', 'pin_priority', 1)">
          <q-item-section>Set Pin #1</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="confirmAction('Set Pin #2', 'pin_priority', 2)">
          <q-item-section>Set Pin #2</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="confirmAction('Remove Pin', 'pin_priority', 0)">
          <q-item-section>Remove Pin</q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>

    <q-btn flat icon="sym_s_deselect" label="Deselect All" no-caps @click="$emit('deselect-all')" />
  </q-toolbar>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import type { ProductMerchandisingFields } from 'src/shared/types';

const props = defineProps<{
  selectedCount: number;
}>();

const emit = defineEmits<{
  'bulk-action': [field: keyof ProductMerchandisingFields, value: any];
  'deselect-all': [];
}>();

const $q = useQuasar();

function confirmAction(actionLabel: string, field: keyof ProductMerchandisingFields, value: any) {
  $q.dialog({
    title: 'Confirm Bulk Action',
    message: `Apply "${actionLabel}" to ${props.selectedCount} product${props.selectedCount !== 1 ? 's' : ''}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    emit('bulk-action', field, value);
  });
}
</script>
