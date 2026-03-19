<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">
      <q-icon name="sym_s_tune" size="md" /> Product Positioning
    </div>

    <!-- Collection not found message -->
    <q-banner v-if="!productsCollectionExists && !loading" class="bg-info text-white q-mb-md" rounded>
      <template #avatar>
        <q-icon name="sym_s_info" />
      </template>
      The "products" collection does not exist. Please create it first or verify the collection name.
    </q-banner>

    <template v-if="productsCollectionExists">
      <!-- Pin priority feature note -->
      <q-banner v-if="hasPinnedProducts" class="bg-blue-1 text-blue-9 q-mb-sm" rounded dense>
        <template #avatar>
          <q-icon name="sym_s_push_pin" color="blue-9" />
        </template>
        Pinned products appear at the top. Drag to reorder pinned products. Pin priority multiplier: 10,000,000,000.
      </q-banner>

      <!-- Filters row -->
      <div class="row q-gutter-md q-mb-md items-end">
        <!-- Category selector -->
        <q-select
          v-model="selectedCategory"
          :options="categoryOptions"
          label="Category"
          emit-value
          map-options
          outlined
          dense
          clearable
          style="min-width: 220px;"
          @update:model-value="onCategoryChange"
        >
          <template #prepend>
            <q-icon name="sym_s_category" />
          </template>
        </q-select>

        <!-- Search bar -->
        <q-input
          v-model="searchQuery"
          label="Search products by name"
          outlined
          dense
          debounce="400"
          clearable
          style="min-width: 280px;"
          @update:model-value="fetchProducts"
        >
          <template #prepend>
            <q-icon name="sym_s_search" />
          </template>
        </q-input>

        <q-space />

        <!-- Apply / Discard buttons -->
        <q-btn
          :disable="!merchandisingStore.hasPendingEdits || merchandisingStore.isApplying"
          :loading="merchandisingStore.isApplying"
          color="positive"
          icon="sym_s_check_circle"
          label="Apply Changes"
          no-caps
          unelevated
          @click="applyChanges"
        >
          <q-badge v-if="merchandisingStore.pendingEditCount > 0" floating color="red">
            {{ merchandisingStore.pendingEditCount }}
          </q-badge>
        </q-btn>

        <q-btn
          :disable="!merchandisingStore.hasPendingEdits"
          color="negative"
          icon="sym_s_cancel"
          label="Discard Changes"
          no-caps
          outline
          @click="discardChanges"
        />

        <!-- Retry Failed button -->
        <q-btn
          v-if="merchandisingStore.failedDocIds.length > 0"
          color="warning"
          icon="sym_s_refresh"
          label="Retry Failed"
          no-caps
          outline
          @click="retryFailed"
        />
      </div>

      <!-- Apply results banner -->
      <q-banner
        v-if="showApplyResults"
        class="q-mb-md"
        :class="applyResultsFailed > 0 ? 'bg-warning text-dark' : 'bg-positive text-white'"
        rounded
      >
        <template #avatar>
          <q-icon :name="applyResultsFailed > 0 ? 'sym_s_warning' : 'sym_s_check_circle'" />
        </template>
        {{ applyResultsSucceeded }} succeeded, {{ applyResultsFailed }} failed.
        <template #action>
          <q-btn flat label="Dismiss" @click="showApplyResults = false" />
        </template>
      </q-banner>

      <!-- Bulk actions bar -->
      <bulk-actions-bar
        :selected-count="merchandisingStore.selectedProducts.size"
        @bulk-action="onBulkAction"
        @deselect-all="merchandisingStore.deselectAll()"
      />

      <!-- Select all checkbox -->
      <div v-if="products.length > 0" class="row items-center q-mb-sm q-ml-sm">
        <q-checkbox
          :model-value="allSelected"
          :indeterminate="someSelected && !allSelected"
          label="Select all visible"
          dense
          @update:model-value="toggleSelectAll"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
      </div>

      <!-- Product list -->
      <div
        v-else
        class="product-list"
        @dragover.prevent
        @drop="onDrop"
      >
        <template v-if="products.length > 0">
          <product-card
            v-for="(product, index) in products"
            :key="product.id"
            :product="product"
            :position="index + 1"
            :is-selected="merchandisingStore.selectedProducts.has(product.id)"
            :is-dirty="merchandisingStore.pendingEdits.has(product.id)"
            :pending-changes="merchandisingStore.pendingEdits.get(product.id)?.changes || {}"
            @field-change="onFieldChange"
            @toggle-select="onToggleSelect"
            @reset-to-db="onResetToDb"
            @dragstart="onDragStart(index, $event)"
            @dragend="onDragEnd"
          />
        </template>
        <div v-else class="text-center text-grey-6 q-pa-xl">
          <q-icon name="sym_s_inventory_2" size="64px" class="q-mb-md" />
          <div class="text-h6">No products found</div>
          <div class="text-body2">Try adjusting the category or search filter.</div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex flex-center q-mt-md">
        <q-pagination
          v-model="currentPage"
          :max="totalPages"
          direction-links
          boundary-links
          @update:model-value="fetchProducts"
        />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar, Notify } from 'quasar';
import { useNodeStore } from 'src/stores/node';
import { useMerchandisingStore } from 'src/stores/merchandising';
import type { Api } from 'src/shared/api';
import type { ProductMerchandisingFields } from 'src/shared/types';
import ProductCard from 'src/components/merchandising/ProductCard.vue';
import type { ProductDoc } from 'src/components/merchandising/ProductCard.vue';
import BulkActionsBar from 'src/components/merchandising/BulkActionsBar.vue';

const COLLECTION_NAME = 'products';
const PER_PAGE = 20;

const $q = useQuasar();
const nodeStore = useNodeStore();
const merchandisingStore = useMerchandisingStore();

// State
const products = ref<ProductDoc[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);
const categoryOptions = ref<{ label: string; value: string | null }[]>([]);
const currentPage = ref(1);
const totalHits = ref(0);
const showApplyResults = ref(false);
const dragIndex = ref<number | null>(null);

// Computed
const productsCollectionExists = computed(() => {
  return nodeStore.data.collections.some((c) => c.name === COLLECTION_NAME);
});

const totalPages = computed(() => Math.ceil(totalHits.value / PER_PAGE));

const hasPinnedProducts = computed(() => {
  return products.value.some((p) => {
    const pending = merchandisingStore.pendingEdits.get(p.id);
    const pin = pending?.changes?.pin_priority ?? p.pin_priority ?? 0;
    return pin > 0;
  });
});

const allSelected = computed(() => {
  if (products.value.length === 0) return false;
  return products.value.every((p) => merchandisingStore.selectedProducts.has(p.id));
});

const someSelected = computed(() => {
  return products.value.some((p) => merchandisingStore.selectedProducts.has(p.id));
});

const applyResultsSucceeded = computed(() =>
  merchandisingStore.applyResults.filter((r) => r.success).length,
);

const applyResultsFailed = computed(() =>
  merchandisingStore.applyResults.filter((r) => !r.success).length,
);

// Methods
async function fetchCategories() {
  const api = nodeStore.api as Api | undefined;
  if (!api || !productsCollectionExists.value) return;

  try {
    const result = await api.search(COLLECTION_NAME, {
      q: '*',
      query_by: 'name',
      facet_by: 'category_id',
      per_page: 0,
    });

    const facetCounts = (result as any)?.facet_counts;
    if (facetCounts && Array.isArray(facetCounts)) {
      const categoryFacet = facetCounts.find(
        (f: any) => f.field_name === 'category_id',
      );
      if (categoryFacet && categoryFacet.counts) {
        categoryOptions.value = [
          { label: 'All Products', value: null },
          ...categoryFacet.counts.map((c: any) => ({
            label: `${c.value} (${c.count})`,
            value: String(c.value),
          })),
        ];
      }
    }
  } catch (err) {
    console.error('Failed to fetch categories:', err);
  }
}

async function fetchProducts() {
  const api = nodeStore.api as Api | undefined;
  if (!api || !productsCollectionExists.value) return;

  loading.value = true;
  try {
    const searchParams: Record<string, any> = {
      q: searchQuery.value || '*',
      query_by: 'name',
      sort_by: 'default_rank_with_pin:desc',
      per_page: PER_PAGE,
      page: currentPage.value,
    };

    if (selectedCategory.value) {
      searchParams.filter_by = `category_id:=${selectedCategory.value}`;
    }

    const result = await api.search(COLLECTION_NAME, searchParams);

    if (result && (result as any).hits) {
      products.value = (result as any).hits.map((hit: any) => ({
        ...hit.document,
      }));
      totalHits.value = (result as any).found || 0;
    } else {
      products.value = [];
      totalHits.value = 0;
    }
  } catch (err) {
    console.error('Failed to fetch products:', err);
    Notify.create({
      type: 'negative',
      message: `Failed to fetch products: ${(err as Error).message}`,
    });
    products.value = [];
    totalHits.value = 0;
  } finally {
    loading.value = false;
  }
}

function onCategoryChange() {
  currentPage.value = 1;
  void fetchProducts();
}

function onFieldChange(docId: string, field: keyof ProductMerchandisingFields, value: any) {
  const product = products.value.find((p) => p.id === docId);
  const original: Partial<ProductMerchandisingFields> = product
    ? {
        is_featured: product.is_featured ?? false,
        is_promoted: product.is_promoted ?? false,
        is_exclusive: product.is_exclusive ?? false,
        pin_priority: product.pin_priority ?? 0,
        featured_rank: product.featured_rank ?? 0,
        merchandising_source: product.merchandising_source ?? null,
      }
    : {};
  merchandisingStore.addEdit(docId, field, value, original);
}

function onToggleSelect(docId: string) {
  if (merchandisingStore.selectedProducts.has(docId)) {
    merchandisingStore.deselectProduct(docId);
  } else {
    merchandisingStore.selectProduct(docId);
  }
}

function toggleSelectAll(val: boolean) {
  if (val) {
    merchandisingStore.selectAll(products.value.map((p) => p.id));
  } else {
    merchandisingStore.deselectAll();
  }
}

function onBulkAction(field: keyof ProductMerchandisingFields, value: any) {
  for (const docId of merchandisingStore.selectedProducts) {
    const product = products.value.find((p) => p.id === docId);
    const original: Partial<ProductMerchandisingFields> = product
      ? {
          is_featured: product.is_featured ?? false,
          is_promoted: product.is_promoted ?? false,
          is_exclusive: product.is_exclusive ?? false,
          pin_priority: product.pin_priority ?? 0,
          featured_rank: product.featured_rank ?? 0,
          merchandising_source: product.merchandising_source ?? null,
        }
      : {};
    merchandisingStore.addEdit(docId, field, value, original);
  }
}

async function applyChanges() {
  await merchandisingStore.applyChanges(COLLECTION_NAME);
  showApplyResults.value = true;
  // Refresh products to reflect changes
  await fetchProducts();
}

function discardChanges() {
  $q.dialog({
    title: 'Discard Changes',
    message: `Discard all ${merchandisingStore.pendingEditCount} pending edit(s)?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    merchandisingStore.discardAllEdits();
    showApplyResults.value = false;
  });
}

async function retryFailed() {
  await merchandisingStore.retryFailed(COLLECTION_NAME);
  showApplyResults.value = true;
  await fetchProducts();
}

function onResetToDb(docId: string) {
  $q.dialog({
    title: 'Reset to DB Values',
    message: 'This will clear the "Dashboard-managed" flag. Continue?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      await merchandisingStore.resetToDbValues(COLLECTION_NAME, docId);
      await fetchProducts();
    })();
  });
}

// Drag-and-drop for pinned products
function onDragStart(index: number, event: DragEvent) {
  dragIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }
}

function onDragEnd() {
  dragIndex.value = null;
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  const fromIndexStr = event.dataTransfer?.getData('text/plain');
  if (fromIndexStr == null || dragIndex.value == null) return;

  const fromIndex = parseInt(fromIndexStr, 10);

  // Find the drop target by determining which card the drop landed on
  const target = (event.target as HTMLElement).closest('.product-card');
  if (!target) return;

  const cards = Array.from(document.querySelectorAll('.product-list .product-card'));
  const toIndex = cards.indexOf(target);
  if (toIndex < 0 || fromIndex === toIndex) return;

  const fromProduct = products.value[fromIndex];
  const toProduct = products.value[toIndex];
  if (!fromProduct || !toProduct) return;

  // Only allow dragging pinned products
  const fromPin = merchandisingStore.pendingEdits.get(fromProduct.id)?.changes?.pin_priority
    ?? fromProduct.pin_priority ?? 0;
  if (fromPin <= 0) return;

  // Swap featured_rank values to reorder
  const fromRank = merchandisingStore.pendingEdits.get(fromProduct.id)?.changes?.featured_rank
    ?? fromProduct.featured_rank ?? 0;
  const toRank = merchandisingStore.pendingEdits.get(toProduct.id)?.changes?.featured_rank
    ?? toProduct.featured_rank ?? 0;

  // Swap ranks
  onFieldChange(fromProduct.id, 'featured_rank', toRank);
  onFieldChange(toProduct.id, 'featured_rank', fromRank);

  // Reorder in the local array for immediate visual feedback
  const [moved] = products.value.splice(fromIndex, 1);
  if (moved) products.value.splice(toIndex, 0, moved);

  dragIndex.value = null;
}

// Lifecycle
onMounted(async () => {
  if (productsCollectionExists.value) {
    await fetchCategories();
    await fetchProducts();
  }
});

// Watch for collection list updates
watch(
  () => nodeStore.data.collections,
  () => {
    if (productsCollectionExists.value && products.value.length === 0) {
      void fetchCategories();
      void fetchProducts();
    }
  },
);
</script>

<style scoped>
.product-list {
  min-height: 200px;
}
</style>
