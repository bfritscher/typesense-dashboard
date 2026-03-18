<template>
  <q-page padding>
    <!-- Formula Breakdown Section (T-020) -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h5">Default Sort Formula</div>
        <div class="text-subtitle2 text-grey-7 q-mt-sm">
          The default product sort order is determined by the following chain:
        </div>

        <div class="q-mt-md q-pa-md bg-grey-2 rounded-borders" style="font-family: monospace; font-size: 0.95rem;">
          is_available:desc &rarr; default_rank_with_pin:desc &rarr; kind_sort:asc
        </div>

        <q-list class="q-mt-md" bordered separator>
          <q-item>
            <q-item-section avatar>
              <q-icon name="push_pin" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Pin Bonus</q-item-label>
              <q-item-label caption>
                pin_priority &times; pinMultiplier (default {{ formatNumber(DEFAULT_PIN_MULTIPLIER) }})
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon name="star" color="amber" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Featured Bonus</q-item-label>
              <q-item-label caption>
                is_featured &times; featuredMultiplier (default {{ formatNumber(DEFAULT_FEATURED_MULTIPLIER) }})
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon name="trending_up" color="green" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Popularity</q-item-label>
              <q-item-label caption>
                Raw popularity score &mdash; added directly to default_rank
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon name="sort" color="grey" />
            </q-item-section>
            <q-item-section>
              <q-item-label>kind_sort (tie-breaker)</q-item-label>
              <q-item-label caption>
                Read-only HEX-encoded kind + zero-padded ID. Used as a stable
                tie-breaker when default_rank_with_pin values are equal.
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <div class="q-mt-md text-body2">
          <strong>default_rank</strong> = (is_featured &times; featuredMultiplier) + popularity
          <br />
          <strong>default_rank_with_pin</strong> = (pin_priority &times; pinMultiplier) + default_rank
        </div>
      </q-card-section>
    </q-card>

    <!-- Weight Sliders & Preview (T-021) -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h5">Adjust Weights</div>

        <div class="q-mt-md">
          <div class="text-subtitle2">Collection</div>
          <q-select
            v-model="selectedCollection"
            :options="collectionOptions"
            label="Select product collection"
            dense
            outlined
            class="q-mb-md"
            style="max-width: 400px;"
          />
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="text-subtitle2 q-mb-xs">Pin Multiplier</div>
            <q-slider
              v-model="pinMultiplier"
              :min="0"
              :max="100_000_000_000"
              :step="1_000_000_000"
              label
              :label-value="formatNumber(pinMultiplier)"
              color="primary"
            />
            <q-input
              v-model.number="pinMultiplier"
              type="number"
              dense
              outlined
              :hint="`Default: ${formatNumber(DEFAULT_PIN_MULTIPLIER)}`"
              class="q-mt-xs"
              style="max-width: 250px;"
            />
          </div>

          <div class="col-12 col-md-6">
            <div class="text-subtitle2 q-mb-xs">Featured Multiplier</div>
            <q-slider
              v-model="featuredMultiplier"
              :min="0"
              :max="10_000_000_000"
              :step="100_000_000"
              label
              :label-value="formatNumber(featuredMultiplier)"
              color="amber-8"
            />
            <q-input
              v-model.number="featuredMultiplier"
              type="number"
              dense
              outlined
              :hint="`Default: ${formatNumber(DEFAULT_FEATURED_MULTIPLIER)}`"
              class="q-mt-xs"
              style="max-width: 250px;"
            />
          </div>
        </div>

        <q-btn
          label="Preview Top 20"
          color="primary"
          class="q-mt-md"
          :loading="previewLoading"
          :disable="!selectedCollection"
          @click="fetchPreview"
        />
      </q-card-section>
    </q-card>

    <!-- Preview Panel -->
    <q-card v-if="previewProducts.length > 0" flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Preview &mdash; Reordered Top 20</div>
        <div class="text-caption text-grey-7 q-mb-sm">
          Products are re-ranked locally using the adjusted multipliers.
        </div>

        <q-table
          flat
          bordered
          dense
          :rows="previewProducts"
          :columns="previewColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 20 }"
          hide-pagination
        />
      </q-card-section>
    </q-card>

    <!-- Batch Update Section (T-022) -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h5">Apply Globally</div>
        <div class="text-body2 text-grey-7 q-mt-sm">
          Recalculate <code>default_rank</code> and
          <code>default_rank_with_pin</code> for <strong>all</strong> products
          in the selected collection using the current multipliers.
        </div>

        <q-banner v-if="batchError" class="bg-negative text-white q-mt-md" rounded>
          {{ batchError }}
        </q-banner>

        <div v-if="batchRunning" class="q-mt-md">
          <div class="text-body2 q-mb-xs">
            Batch {{ batchCurrent }} of {{ batchTotal }}
          </div>
          <q-linear-progress
            :value="batchTotal > 0 ? batchCurrent / batchTotal : 0"
            size="20px"
            color="primary"
          >
            <div class="absolute-full flex flex-center">
              <q-badge
                color="white"
                text-color="primary"
                :label="`${batchCurrent} / ${batchTotal}`"
              />
            </div>
          </q-linear-progress>
          <q-btn
            flat
            label="Cancel"
            color="negative"
            class="q-mt-sm"
            @click="cancelBatch"
          />
        </div>

        <div v-if="batchDone && !batchRunning" class="q-mt-md">
          <q-banner class="bg-positive text-white" rounded>
            Completed: {{ batchCurrent }} of {{ batchTotal }} batches processed.
            {{ batchFailures > 0 ? `${batchFailures} document(s) failed.` : '' }}
          </q-banner>
        </div>

        <q-btn
          v-if="!batchRunning"
          label="Apply"
          color="negative"
          class="q-mt-md"
          :disable="!selectedCollection"
          @click="confirmApply"
        />
      </q-card-section>
    </q-card>

    <!-- Confirmation Dialog -->
    <q-dialog v-model="showConfirmDialog" persistent>
      <q-card style="min-width: 400px;">
        <q-card-section>
          <div class="text-h6">Warning: Global Operation</div>
        </q-card-section>
        <q-card-section>
          <p>
            This will recalculate ranking fields for <strong>every product</strong>
            in the <strong>{{ selectedCollection }}</strong> collection.
          </p>
          <p>
            <strong>Pin Multiplier:</strong> {{ formatNumber(pinMultiplier) }}<br />
            <strong>Featured Multiplier:</strong> {{ formatNumber(featuredMultiplier) }}
          </p>
          <p class="text-negative">
            This operation cannot be undone automatically. Proceed with caution.
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            flat
            label="Confirm &amp; Apply"
            color="negative"
            @click="runBatchUpdate"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useNodeStore } from 'src/stores/node';
import { Api } from 'src/shared/api';
import {
  calculateDefaultRank,
  calculateDefaultRankWithPin,
  DEFAULT_PIN_MULTIPLIER,
  DEFAULT_FEATURED_MULTIPLIER,
} from 'src/shared/types';
import type { QTableColumn } from 'quasar';

const store = useNodeStore();

// ---------------------------------------------------------------------------
// Collection selector
// ---------------------------------------------------------------------------
const selectedCollection = ref<string | null>(null);
const collectionOptions = computed(() =>
  store.data.collections.map((c) => c.name),
);

// ---------------------------------------------------------------------------
// Weight sliders (T-021)
// ---------------------------------------------------------------------------
const pinMultiplier = ref<number>(DEFAULT_PIN_MULTIPLIER);
const featuredMultiplier = ref<number>(DEFAULT_FEATURED_MULTIPLIER);

function formatNumber(n: number): string {
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Preview (T-021)
// ---------------------------------------------------------------------------
interface PreviewRow {
  id: string;
  rank: number;
  title: string;
  pin_priority: number;
  is_featured: boolean;
  popularity: number;
  original_rank_with_pin: number;
  new_default_rank: number;
  new_default_rank_with_pin: number;
}

const previewLoading = ref(false);
const previewProducts = ref<PreviewRow[]>([]);

const previewColumns: QTableColumn[] = [
  { name: 'rank', label: '#', field: 'rank', align: 'left', sortable: false },
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: false },
  { name: 'title', label: 'Title', field: 'title', align: 'left', sortable: false },
  { name: 'pin_priority', label: 'Pin Priority', field: 'pin_priority', align: 'right', sortable: false },
  {
    name: 'is_featured',
    label: 'Featured',
    field: 'is_featured',
    align: 'center',
    format: (val: boolean) => (val ? 'Yes' : 'No'),
    sortable: false,
  },
  { name: 'popularity', label: 'Popularity', field: 'popularity', align: 'right', sortable: false },
  {
    name: 'original_rank_with_pin',
    label: 'Current Rank w/ Pin',
    field: 'original_rank_with_pin',
    align: 'right',
    format: (val: number) => formatNumber(val),
    sortable: false,
  },
  {
    name: 'new_default_rank_with_pin',
    label: 'New Rank w/ Pin',
    field: 'new_default_rank_with_pin',
    align: 'right',
    format: (val: number) => formatNumber(val),
    sortable: false,
  },
];

async function fetchPreview() {
  if (!selectedCollection.value) return;
  previewLoading.value = true;
  previewProducts.value = [];

  try {
    const api = store.api as Api;
    const result = await api.search(selectedCollection.value, {
      q: '*',
      query_by: 'title',
      sort_by: 'is_available:desc,default_rank_with_pin:desc,kind_sort:asc',
      per_page: 20,
      page: 1,
    });

    if (!result?.hits) {
      previewProducts.value = [];
      return;
    }

    const rows: PreviewRow[] = result.hits.map((hit: any) => {
      const doc = hit.document;
      const pinPriority = Number(doc.pin_priority ?? 0);
      const isFeatured = Boolean(doc.is_featured);
      const popularity = Number(doc.popularity ?? 0);

      const newDefaultRank = calculateDefaultRank(
        isFeatured,
        popularity,
        featuredMultiplier.value,
      );
      const newDefaultRankWithPin = calculateDefaultRankWithPin(
        pinPriority,
        newDefaultRank,
        pinMultiplier.value,
      );

      return {
        id: String(doc.id),
        rank: 0,
        title: String(doc.title ?? doc.name ?? doc.id),
        pin_priority: pinPriority,
        is_featured: isFeatured,
        popularity,
        original_rank_with_pin: Number(doc.default_rank_with_pin ?? 0),
        new_default_rank: newDefaultRank,
        new_default_rank_with_pin: newDefaultRankWithPin,
      };
    });

    // Re-sort by the recalculated ranking (descending)
    rows.sort((a, b) => b.new_default_rank_with_pin - a.new_default_rank_with_pin);
    rows.forEach((r, i) => (r.rank = i + 1));

    previewProducts.value = rows;
  } catch (err: any) {
    console.error('Preview fetch failed:', err);
  } finally {
    previewLoading.value = false;
  }
}

// ---------------------------------------------------------------------------
// Batch update (T-022)
// ---------------------------------------------------------------------------
const showConfirmDialog = ref(false);
const batchRunning = ref(false);
const batchDone = ref(false);
const batchCurrent = ref(0);
const batchTotal = ref(0);
const batchFailures = ref(0);
const batchError = ref<string | null>(null);
let batchCancelled = false;

function confirmApply() {
  batchError.value = null;
  batchDone.value = false;
  showConfirmDialog.value = true;
}

function cancelBatch() {
  batchCancelled = true;
}

async function runBatchUpdate() {
  if (!selectedCollection.value) return;

  const collectionName = selectedCollection.value;
  const api = store.api as Api;
  const BATCH_SIZE = 100;

  batchRunning.value = true;
  batchDone.value = false;
  batchCurrent.value = 0;
  batchTotal.value = 0;
  batchFailures.value = 0;
  batchError.value = null;
  batchCancelled = false;

  try {
    // First, determine total documents
    const countResult = await api.search(collectionName, {
      q: '*',
      query_by: 'title',
      per_page: 0,
      page: 1,
    });

    const totalDocs = countResult?.found ?? 0;
    if (totalDocs === 0) {
      batchRunning.value = false;
      batchDone.value = true;
      return;
    }

    batchTotal.value = Math.ceil(totalDocs / BATCH_SIZE);
    let page = 1;
    let processedSoFar = 0;

    while (processedSoFar < totalDocs) {
      if (batchCancelled) {
        batchError.value = `Cancelled after batch ${batchCurrent.value} of ${batchTotal.value}.`;
        break;
      }

      let searchResult: any;
      try {
        searchResult = await api.search(collectionName, {
          q: '*',
          query_by: 'title',
          sort_by: 'id:asc',
          per_page: BATCH_SIZE,
          page,
          include_fields: 'id,is_featured,popularity,pin_priority',
        });
      } catch (err: any) {
        batchError.value = `Failed to fetch batch at page ${page}: ${err.message ?? err}. You can retry safely.`;
        break;
      }

      const hits = searchResult?.hits;
      if (!hits || hits.length === 0) break;

      const updates = hits.map((hit: any) => {
        const doc = hit.document;
        const isFeatured = Boolean(doc.is_featured);
        const popularity = Number(doc.popularity ?? 0);
        const pinPriority = Number(doc.pin_priority ?? 0);

        const newDefaultRank = calculateDefaultRank(
          isFeatured,
          popularity,
          featuredMultiplier.value,
        );
        const newDefaultRankWithPin = calculateDefaultRankWithPin(
          pinPriority,
          newDefaultRank,
          pinMultiplier.value,
        );

        return {
          id: String(doc.id),
          default_rank: newDefaultRank,
          default_rank_with_pin: newDefaultRankWithPin,
          merchandising_source: 'dashboard',
        };
      });

      try {
        const importResult = await api.importDocuments(collectionName, updates, 'update');

        if (Array.isArray(importResult)) {
          const failures = importResult.filter(
            (r: any) => r && r.success === false,
          );
          batchFailures.value += failures.length;
        }
      } catch (err: any) {
        batchError.value = `Batch ${batchCurrent.value + 1} import failed: ${err.message ?? err}. Previous batches were applied. You can retry safely.`;
        break;
      }

      processedSoFar += hits.length;
      batchCurrent.value += 1;
      page += 1;
    }
  } catch (err: any) {
    batchError.value = `Unexpected error: ${err.message ?? err}`;
  } finally {
    batchRunning.value = false;
    batchDone.value = true;
  }
}
</script>
