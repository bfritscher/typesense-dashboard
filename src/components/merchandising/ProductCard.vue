<template>
  <q-card
    :class="[
      'product-card q-mb-sm',
      isDirty ? 'product-card--dirty' : '',
      isSelected ? 'product-card--selected' : '',
    ]"
    flat
    bordered
  >
    <q-card-section horizontal class="items-center">
      <!-- Drag handle -->
      <div
        v-if="(product.pin_priority ?? 0) > 0"
        class="product-card__drag-handle cursor-move q-pa-sm"
        draggable="true"
        @dragstart="$emit('dragstart', $event)"
        @dragend="$emit('dragend', $event)"
      >
        <q-icon name="sym_s_drag_indicator" size="sm" color="grey-6" />
      </div>
      <div v-else class="product-card__drag-handle q-pa-sm" style="width: 32px;"></div>

      <!-- Checkbox for multi-select -->
      <q-checkbox
        :model-value="isSelected"
        dense
        class="q-mr-sm"
        @update:model-value="$emit('toggle-select', product.id)"
      />

      <!-- Rank number -->
      <div class="product-card__rank text-bold text-grey-8 q-mr-md" style="min-width: 36px; text-align: center;">
        #{{ position }}
      </div>

      <!-- Image thumbnail -->
      <q-avatar square size="48px" class="q-mr-md">
        <img
          v-if="product.image_url"
          :src="product.image_url"
          :alt="product.name"
          style="object-fit: cover;"
        />
        <q-icon v-else name="sym_s_image" size="md" color="grey-5" />
      </q-avatar>

      <!-- Product info -->
      <div class="col">
        <div class="row items-center q-gutter-x-sm">
          <span class="text-subtitle2 text-weight-medium">{{ product.name || product.id }}</span>

          <!-- Badges -->
          <q-badge v-if="effectiveValues.is_featured" color="amber-8" text-color="white" label="Featured" />
          <q-badge v-if="effectiveValues.is_promoted" color="deep-purple" text-color="white" label="Promoted" />
          <q-badge v-if="effectiveValues.is_exclusive" color="teal" text-color="white" label="Exclusive" />
          <q-badge
            v-if="effectiveValues.pin_priority > 0"
            color="red-8"
            text-color="white"
            :label="`Pin #${effectiveValues.pin_priority}`"
          />
          <q-badge
            v-if="product.merchandising_source === 'dashboard'"
            color="blue-grey-6"
            text-color="white"
            label="Dashboard-managed"
          />

          <!-- Popularity warning -->
          <q-icon
            v-if="product.popularity == null"
            name="sym_s_warning"
            color="warning"
            size="xs"
          >
            <q-tooltip>Popularity is null/missing</q-tooltip>
          </q-icon>

          <!-- Availability warning when featuring unavailable -->
          <q-icon
            v-if="effectiveValues.is_featured && product.availability === false"
            name="sym_s_error"
            color="negative"
            size="xs"
          >
            <q-tooltip>Warning: featuring an unavailable product</q-tooltip>
          </q-icon>
        </div>

        <div class="row items-center q-gutter-x-md text-caption text-grey-7 q-mt-xs">
          <span v-if="product.vendor_count != null">Vendors: {{ product.vendor_count }}</span>
          <span v-if="product.min_price != null">Min price: {{ product.min_price }}</span>
          <span v-if="product.availability != null">
            {{ product.availability ? 'Available' : 'Unavailable' }}
          </span>
          <span>Rank: {{ product.default_rank_with_pin ?? 'N/A' }}</span>
        </div>
      </div>

      <!-- Inline controls -->
      <div class="row items-center q-gutter-x-md q-mr-md no-wrap">
        <!-- Featured toggle -->
        <q-toggle
          :model-value="effectiveValues.is_featured"
          label="Featured"
          dense
          size="sm"
          @update:model-value="onFieldChange('is_featured', $event)"
        />

        <!-- Promoted toggle -->
        <q-toggle
          :model-value="effectiveValues.is_promoted"
          label="Promoted"
          dense
          size="sm"
          @update:model-value="onFieldChange('is_promoted', $event)"
        />

        <!-- Exclusive toggle -->
        <q-toggle
          :model-value="effectiveValues.is_exclusive"
          label="Exclusive"
          dense
          size="sm"
          @update:model-value="onFieldChange('is_exclusive', $event)"
        />

        <!-- Pin priority dropdown -->
        <q-select
          :model-value="effectiveValues.pin_priority"
          :options="pinOptions"
          emit-value
          map-options
          dense
          outlined
          label="Pin"
          style="min-width: 110px;"
          @update:model-value="onFieldChange('pin_priority', $event)"
        />

        <!-- Featured rank input -->
        <q-input
          :model-value="effectiveValues.featured_rank"
          type="number"
          dense
          outlined
          label="Rank"
          style="max-width: 80px;"
          @update:model-value="onFieldChange('featured_rank', Number($event))"
        />

        <!-- Reset to DB values button -->
        <q-btn
          v-if="product.merchandising_source === 'dashboard'"
          flat
          dense
          icon="sym_s_restart_alt"
          color="grey-7"
          size="sm"
          title="Reset to DB values"
          @click="$emit('reset-to-db', product.id)"
        >
          <q-tooltip>Reset to DB values</q-tooltip>
        </q-btn>
      </div>
    </q-card-section>

    <!-- Dirty state indicator -->
    <div v-if="isDirty" class="product-card__dirty-bar"></div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProductMerchandisingFields } from 'src/shared/types';

export interface ProductDoc extends Partial<ProductMerchandisingFields> {
  id: string;
  name?: string;
  image_url?: string;
  category_id?: string | number;
  vendor_count?: number;
  min_price?: number;
  availability?: boolean;
  [key: string]: any;
}

const props = defineProps<{
  product: ProductDoc;
  position: number;
  isSelected: boolean;
  isDirty: boolean;
  pendingChanges: Partial<ProductMerchandisingFields>;
}>();

const emit = defineEmits<{
  'field-change': [docId: string, field: keyof ProductMerchandisingFields, value: any];
  'toggle-select': [docId: string];
  'reset-to-db': [docId: string];
  'dragstart': [event: DragEvent];
  'dragend': [event: DragEvent];
}>();

const pinOptions = [
  { label: 'None', value: 0 },
  { label: 'Pin #1', value: 1 },
  { label: 'Pin #2', value: 2 },
];

const effectiveValues = computed(() => ({
  is_featured: props.pendingChanges.is_featured ?? props.product.is_featured ?? false,
  is_promoted: props.pendingChanges.is_promoted ?? props.product.is_promoted ?? false,
  is_exclusive: props.pendingChanges.is_exclusive ?? props.product.is_exclusive ?? false,
  pin_priority: props.pendingChanges.pin_priority ?? props.product.pin_priority ?? 0,
  featured_rank: props.pendingChanges.featured_rank ?? props.product.featured_rank ?? 0,
}));

function onFieldChange(field: keyof ProductMerchandisingFields, value: any) {
  emit('field-change', props.product.id, field, value);
}
</script>

<style scoped>
.product-card--dirty {
  border-left: 3px solid var(--q-warning, #f2c037);
}

.product-card--selected {
  background-color: rgba(25, 118, 210, 0.06);
}

.product-card__dirty-bar {
  height: 2px;
  background: var(--q-warning, #f2c037);
}

.product-card__drag-handle:hover {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}
</style>
