<template>
  <q-page padding>
    <!-- Vendor List View -->
    <template v-if="!selectedVendor">
      <q-table
        flat
        bordered
        title="Vendor Controls"
        :rows="filteredVendors"
        :columns="vendorColumns"
        row-key="vendorId"
        :filter="state.vendorFilter"
        :loading="state.loadingVendors"
        :pagination="{ rowsPerPage: 25, sortBy: 'productCount', descending: true }"
      >
        <template #top-left>
          <div class="text-h6">
            <q-icon size="md" name="sym_s_storefront" /> Vendor Controls
          </div>
        </template>
        <template #top-right>
          <q-input
            v-model="state.vendorFilter"
            borderless
            dense
            debounce="300"
            placeholder="Search vendors"
          >
            <template #append>
              <q-icon name="sym_s_search" />
            </template>
          </q-input>
          <q-btn
            flat
            round
            icon="sym_s_refresh"
            class="q-ml-sm"
            title="Refresh"
            @click="loadVendors"
          />
        </template>
        <template #body-cell-vendorId="props">
          <q-td :props="props">
            <q-btn
              flat
              no-caps
              dense
              color="primary"
              :label="props.row.vendorId"
              @click="selectVendor(props.row)"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <q-btn
              flat
              dense
              icon="sym_s_arrow_upward"
              color="positive"
              title="Boost vendor"
              @click.stop="boostVendor(props.row.vendorId)"
            />
            <q-btn
              flat
              dense
              icon="sym_s_arrow_downward"
              color="negative"
              title="Suppress vendor"
              @click.stop="suppressVendor(props.row.vendorId)"
            />
          </q-td>
        </template>
      </q-table>
    </template>

    <!-- Vendor Product View -->
    <template v-else>
      <div class="row items-center q-mb-md">
        <q-btn
          flat
          icon="sym_s_arrow_back"
          label="Back to Vendors"
          @click="selectedVendor = null"
        />
        <q-separator vertical class="q-mx-sm" />
        <div class="text-h6">
          <q-icon size="md" name="sym_s_storefront" />
          Vendor: {{ selectedVendor.vendorId }}
        </div>
        <q-space />
        <q-btn
          flat
          dense
          icon="sym_s_arrow_upward"
          color="positive"
          label="Boost"
          class="q-mr-sm"
          @click="boostVendor(selectedVendor.vendorId)"
        />
        <q-btn
          flat
          dense
          icon="sym_s_arrow_downward"
          color="negative"
          label="Suppress"
          @click="suppressVendor(selectedVendor.vendorId)"
        />
      </div>

      <q-banner v-if="merchStore.hasPendingEdits" class="bg-warning text-dark q-mb-md" rounded>
        <template #avatar>
          <q-icon name="sym_s_warning" />
        </template>
        {{ merchStore.pendingEditCount }} pending edit(s).
        <template #action>
          <q-btn
            flat
            label="Apply Changes"
            :loading="merchStore.isApplying"
            @click="merchStore.applyChanges(COLLECTION_NAME)"
          />
          <q-btn flat label="Discard All" @click="merchStore.discardAllEdits()" />
        </template>
      </q-banner>

      <q-table
        flat
        bordered
        :rows="state.vendorProducts"
        :columns="productColumns"
        row-key="id"
        :filter="state.productFilter"
        :loading="state.loadingProducts"
        :pagination="{ rowsPerPage: 25 }"
      >
        <template #top-left>
          <div class="text-subtitle1">
            Products ({{ state.vendorProducts.length }})
          </div>
        </template>
        <template #top-right>
          <q-input
            v-model="state.productFilter"
            borderless
            dense
            debounce="300"
            placeholder="Search products"
          >
            <template #append>
              <q-icon name="sym_s_search" />
            </template>
          </q-input>
        </template>
        <template #body-cell-is_featured="props">
          <q-td :props="props">
            <q-icon
              :name="props.row.is_featured ? 'sym_s_star' : 'sym_s_star_border'"
              :color="props.row.is_featured ? 'amber' : 'grey'"
              size="sm"
            />
          </q-td>
        </template>
        <template #body-cell-delivery_methods="props">
          <q-td :props="props">
            <span v-if="Array.isArray(props.row.delivery_methods)">
              {{ props.row.delivery_methods.join(', ') }}
            </span>
            <span v-else>{{ props.row.delivery_methods ?? '-' }}</span>
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <q-btn
              flat
              dense
              :icon="props.row.is_featured ? 'sym_s_star' : 'sym_s_star_border'"
              :color="props.row.is_featured ? 'amber' : 'grey'"
              :title="props.row.is_featured ? 'Unfeature' : 'Feature'"
              @click="toggleFeature(props.row)"
            />
            <q-btn
              flat
              dense
              :icon="props.row.pin_priority > 0 ? 'sym_s_push_pin' : 'sym_s_push_pin'"
              :color="props.row.pin_priority > 0 ? 'primary' : 'grey'"
              :title="props.row.pin_priority > 0 ? 'Unpin' : 'Pin'"
              @click="togglePin(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableProps } from 'quasar';
import { useNodeStore } from 'src/stores/node';
import { useMerchandisingStore } from 'src/stores/merchandising';
import type { Api } from 'src/shared/api';

const COLLECTION_NAME = 'products';

const $q = useQuasar();
const store = useNodeStore();
const merchStore = useMerchandisingStore();

interface VendorRow {
  vendorId: string;
  productCount: number;
  featuredProductCount: number;
}

const state = reactive({
  vendorFilter: '',
  productFilter: '',
  vendors: [] as VendorRow[],
  vendorProducts: [] as any[],
  loadingVendors: false,
  loadingProducts: false,
});

const selectedVendor = ref<VendorRow | null>(null);

const vendorColumns: QTableProps['columns'] = [
  {
    name: 'vendorId',
    label: 'Vendor ID',
    field: 'vendorId',
    sortable: true,
    align: 'left',
  },
  {
    name: 'productCount',
    label: 'Product Count',
    field: 'productCount',
    sortable: true,
    align: 'center',
  },
  {
    name: 'featuredProductCount',
    label: 'Featured Product Count',
    field: 'featuredProductCount',
    sortable: true,
    align: 'center',
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'right',
    sortable: false,
  },
];

const productColumns: QTableProps['columns'] = [
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left' },
  { name: 'name', label: 'Name', field: 'name', sortable: true, align: 'left' },
  { name: 'price', label: 'Price', field: 'price', sortable: true, align: 'center' },
  { name: 'stock', label: 'Stock', field: 'stock', sortable: true, align: 'center' },
  { name: 'availability', label: 'Availability', field: 'availability', sortable: true, align: 'center' },
  {
    name: 'is_featured',
    label: 'Featured',
    field: 'is_featured',
    sortable: true,
    align: 'center',
  },
  {
    name: 'delivery_methods',
    label: 'Delivery Methods',
    field: 'delivery_methods',
    sortable: false,
    align: 'left',
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'right',
    sortable: false,
  },
];

const filteredVendors = computed(() => state.vendors);

async function loadVendors() {
  const api = store.api as Api | undefined;
  if (!api) return;

  state.loadingVendors = true;
  try {
    const result = await api.search(COLLECTION_NAME, {
      q: '*',
      query_by: 'name',
      facet_by: 'vendor_ids,featured_vendor_ids',
      max_facet_values: 1000,
      per_page: 0,
    });

    const vendorMap = new Map<string, VendorRow>();

    if (result?.facet_counts) {
      for (const facet of result.facet_counts) {
        const isVendorIds = facet.field_name === 'vendor_ids';
        const isFeaturedVendorIds = facet.field_name === 'featured_vendor_ids';

        if (!isVendorIds && !isFeaturedVendorIds) continue;

        for (const val of facet.counts) {
          const vendorId = String(val.value);
          const existing = vendorMap.get(vendorId) || {
            vendorId,
            productCount: 0,
            featuredProductCount: 0,
          };

          if (isVendorIds) {
            existing.productCount = val.count;
          }
          if (isFeaturedVendorIds) {
            existing.featuredProductCount = val.count;
          }

          vendorMap.set(vendorId, existing);
        }
      }
    }

    state.vendors = Array.from(vendorMap.values());
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: `Failed to load vendors: ${(err as Error).message}`,
    });
  } finally {
    state.loadingVendors = false;
  }
}

async function selectVendor(vendor: VendorRow) {
  selectedVendor.value = vendor;
  await loadVendorProducts(vendor.vendorId);
}

async function loadVendorProducts(vendorId: string) {
  const api = store.api as Api | undefined;
  if (!api) return;

  state.loadingProducts = true;
  state.vendorProducts = [];
  try {
    const result = await api.search(COLLECTION_NAME, {
      q: '*',
      query_by: 'name',
      filter_by: `vendor_ids:=[${vendorId}]`,
      per_page: 250,
    });

    state.vendorProducts = (result?.hits ?? []).map((hit: any) => hit.document);
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: `Failed to load vendor products: ${(err as Error).message}`,
    });
  } finally {
    state.loadingProducts = false;
  }
}

function toggleFeature(product: any) {
  const newValue = !product.is_featured;
  merchStore.addEdit(
    product.id,
    'is_featured',
    newValue,
    {
      is_featured: product.is_featured,
      pin_priority: product.pin_priority ?? 0,
      popularity: product.popularity ?? 0,
    },
  );
  // Update the local row immediately for visual feedback
  product.is_featured = newValue;
}

function togglePin(product: any) {
  const currentPin = product.pin_priority ?? 0;
  const newPin = currentPin > 0 ? 0 : 1;
  merchStore.addEdit(
    product.id,
    'pin_priority',
    newPin,
    {
      is_featured: product.is_featured ?? false,
      pin_priority: currentPin,
      popularity: product.popularity ?? 0,
    },
  );
  // Update the local row immediately for visual feedback
  product.pin_priority = newPin;
}

function boostVendor(vendorId: string) {
  $q.dialog({
    title: 'Boost Vendor',
    message: `This will create an override that boosts products from vendor "${vendorId}" by injecting a sort_by rule. Enter the query to apply this boost to (use * for all queries):`,
    prompt: {
      model: '*',
      type: 'text',
    },
    cancel: true,
    persistent: true,
  }).onOk((query: string) => {
    void (async () => {
      const api = store.api as Api | undefined;
      if (!api) {
        $q.notify({ type: 'negative', message: 'Not connected to TypeSense' });
        return;
      }

      const overrideId = `vendor-boost-${vendorId}`;
      const override: any = {
        rule: {
          query: query || '*',
          match: query === '*' ? 'exact' : 'contains',
        },
        sort_by: `_eval(vendor_ids:${vendorId}):desc,_text_match:desc`,
      };

      try {
        await api.upsertOverride(COLLECTION_NAME, overrideId, override);
        $q.notify({
          type: 'positive',
          message: `Vendor "${vendorId}" boosted for query "${query}"`,
        });
      } catch (err) {
        $q.notify({
          type: 'negative',
          message: `Failed to boost vendor: ${(err as Error).message}`,
        });
      }
    })();
  });
}

function suppressVendor(vendorId: string) {
  $q.dialog({
    title: 'Suppress Vendor',
    message: `This will create an override that filters out products from vendor "${vendorId}". Enter the query to suppress this vendor for:`,
    prompt: {
      model: '',
      type: 'text',
    },
    cancel: true,
    persistent: true,
  }).onOk((query: string) => {
    void (async () => {
      if (!query) {
        $q.notify({ type: 'warning', message: 'Query is required for suppression' });
        return;
      }

      const api = store.api as Api | undefined;
      if (!api) {
        $q.notify({ type: 'negative', message: 'Not connected to TypeSense' });
        return;
      }

      const overrideId = `vendor-suppress-${vendorId}-${Date.now()}`;
      const override: any = {
        rule: {
          query,
          match: 'contains',
        },
        filter_by: `vendor_ids:!=[${vendorId}]`,
      };

      try {
        await api.upsertOverride(COLLECTION_NAME, overrideId, override);
        $q.notify({
          type: 'positive',
          message: `Vendor "${vendorId}" suppressed for query "${query}"`,
        });
      } catch (err) {
        $q.notify({
          type: 'negative',
          message: `Failed to suppress vendor: ${(err as Error).message}`,
        });
      }
    })();
  });
}

onMounted(() => {
  void loadVendors();
});
</script>
