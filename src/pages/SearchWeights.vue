<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <!-- Left panel: Field weights table -->
      <div class="col-12 col-md-7">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">
              <q-icon size="md" name="sym_s_tune" /> Search Weights Tuner
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">
              Adjust <code>query_by</code> field weights and priorities for text search relevance.
              Drag rows to reorder field priority.
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-none">
            <q-table
              flat
              :rows="fields"
              :columns="columns"
              row-key="name"
              hide-bottom
              :pagination="{ rowsPerPage: 0 }"
            >
              <template #body="props">
                <q-tr
                  :props="props"
                  draggable="true"
                  class="cursor-move"
                  :class="{ 'bg-blue-1': dragIndex === props.rowIndex }"
                  @dragstart="onDragStart(props.rowIndex, $event)"
                  @dragover.prevent="onDragOver(props.rowIndex)"
                  @dragend="onDragEnd"
                  @drop.prevent="onDrop(props.rowIndex)"
                >
                  <q-td key="priority" :props="props">
                    <q-icon name="sym_s_drag_indicator" size="xs" class="q-mr-xs text-grey-6" />
                    {{ props.rowIndex + 1 }}
                  </q-td>
                  <q-td key="name" :props="props">
                    <span class="text-weight-medium">{{ props.row.name }}</span>
                  </q-td>
                  <q-td key="weight" :props="props">
                    <div class="row items-center no-wrap q-gutter-sm" style="min-width: 220px">
                      <q-slider
                        v-model="props.row.weight"
                        :min="0"
                        :max="127"
                        :step="1"
                        label
                        label-always
                        class="col"
                        color="primary"
                      />
                      <q-input
                        v-model.number="props.row.weight"
                        type="number"
                        dense
                        outlined
                        style="width: 70px"
                        :min="0"
                        :max="127"
                      />
                    </div>
                  </q-td>
                  <q-td key="actions" :props="props">
                    <q-btn
                      flat
                      dense
                      icon="sym_s_delete"
                      color="negative"
                      title="Remove field"
                      @click="removeField(props.rowIndex)"
                    />
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-input
                v-model="newFieldName"
                dense
                outlined
                label="Add field"
                class="col"
                @keyup.enter="addField"
              />
              <q-btn
                dense
                unelevated
                color="primary"
                label="Add"
                :disable="!newFieldName.trim()"
                @click="addField"
              />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Reset to Defaults" color="grey-7" @click="resetToDefaults" />
            <q-btn
              unelevated
              label="Save as Preset"
              color="primary"
              icon="sym_s_save"
              :loading="saving"
              @click="savePreset"
            />
          </q-card-actions>

          <q-banner v-if="presetNote" class="bg-blue-1 text-blue-9 q-mx-md q-mb-md" rounded>
            <template #avatar>
              <q-icon name="sym_s_info" color="blue" />
            </template>
            {{ presetNote }}
          </q-banner>
        </q-card>

        <!-- Generated query_by parameters display -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Generated Parameters</div>
            <div class="q-mt-sm">
              <code class="text-body2">query_by: {{ queryBy }}</code>
            </div>
            <div class="q-mt-xs">
              <code class="text-body2">query_by_weights: {{ queryByWeights }}</code>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right panel: Live search preview -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="sticky-preview">
          <q-card-section>
            <div class="text-h6">
              <q-icon size="md" name="sym_s_search" /> Live Preview
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-input
              v-model="searchQuery"
              dense
              outlined
              label="Search query"
              debounce="300"
              clearable
            >
              <template #prepend>
                <q-icon name="sym_s_search" />
              </template>
            </q-input>
          </q-card-section>

          <q-separator />

          <q-card-section v-if="searchLoading" class="text-center q-pa-lg">
            <q-spinner color="primary" size="2em" />
            <div class="text-grey-6 q-mt-sm">Searching...</div>
          </q-card-section>

          <q-card-section v-else-if="searchError" class="text-negative">
            {{ searchError }}
          </q-card-section>

          <template v-else-if="searchResults">
            <q-card-section class="q-pb-none">
              <div class="text-caption text-grey-7">
                {{ searchResults.found }} results found in {{ searchResults.search_time_ms }}ms
              </div>
            </q-card-section>

            <q-list separator>
              <q-item v-for="hit in (searchResults.hits as any[])" :key="(hit as any).document?.id" class="q-py-sm">
                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ getDocTitle((hit as any).document) }}
                  </q-item-label>
                  <q-item-label caption class="text-grey-7">
                    Score: {{ (hit as any).text_match_info?.score ?? (hit as any).text_match ?? 'N/A' }}
                  </q-item-label>
                  <q-item-label caption>
                    <div
                      v-for="(highlight, hIdx) in ((hit as any).highlights || []).slice(0, 3)"
                      :key="hIdx"
                      class="q-mt-xs"
                    >
                      <strong>{{ highlight.field }}:</strong>
                      <span v-html="highlight.snippet || highlight.value"></span>
                    </div>
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="searchResults.hits?.length === 0">
                <q-item-section class="text-grey-6 text-center">
                  No results found
                </q-item-section>
              </q-item>
            </q-list>
          </template>

          <q-card-section v-else class="text-grey-6 text-center q-pa-lg">
            Type a search query to see live results with your current weight settings.
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { Notify } from 'quasar';
import { useNodeStore } from 'src/stores/node';

interface FieldWeight {
  name: string;
  weight: number;
}

const PRESET_NAME = 'default_product_search';

const DEFAULT_FIELDS: FieldWeight[] = [
  { name: 'name', weight: 4 },
  { name: 'cultivar', weight: 3 },
  { name: 'kind', weight: 2 },
  { name: 'effects', weight: 2 },
  { name: 'flavors', weight: 2 },
  { name: 'terpenes', weight: 2 },
  { name: 'description', weight: 1 },
];

const store = useNodeStore();

const fields = reactive<FieldWeight[]>([...DEFAULT_FIELDS.map((f) => ({ ...f }))]);
const newFieldName = ref('');
const saving = ref(false);
const presetNote = ref('');
const searchQuery = ref('');
const searchLoading = ref(false);
const searchError = ref('');
const searchResults = ref<any>(null);
const dragIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

const columns = [
  {
    name: 'priority',
    label: '#',
    field: 'priority',
    align: 'left' as const,
    style: 'width: 60px',
  },
  {
    name: 'name',
    label: 'Field',
    field: 'name',
    align: 'left' as const,
  },
  {
    name: 'weight',
    label: 'Weight (0-127)',
    field: 'weight',
    align: 'left' as const,
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'right' as const,
    style: 'width: 50px',
  },
];

const queryBy = computed(() => fields.map((f) => f.name).join(','));

const queryByWeights = computed(() => fields.map((f) => f.weight).join(','));

// Drag and drop handlers
function onDragStart(index: number, event: DragEvent) {
  dragIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }
}

function onDragOver(index: number) {
  dragOverIndex.value = index;
}

function onDrop(targetIndex: number) {
  if (dragIndex.value === null || dragIndex.value === targetIndex) return;
  const item = fields.splice(dragIndex.value, 1)[0];
  fields.splice(targetIndex, 0, item);
  dragIndex.value = null;
  dragOverIndex.value = null;
}

function onDragEnd() {
  dragIndex.value = null;
  dragOverIndex.value = null;
}

function addField() {
  const name = newFieldName.value.trim();
  if (!name) return;
  if (fields.some((f) => f.name === name)) {
    Notify.create({
      position: 'top',
      color: 'warning',
      message: `Field "${name}" already exists`,
      timeout: 2000,
    });
    return;
  }
  fields.push({ name, weight: 1 });
  newFieldName.value = '';
}

function removeField(index: number) {
  fields.splice(index, 1);
}

function resetToDefaults() {
  fields.splice(0, fields.length, ...DEFAULT_FIELDS.map((f) => ({ ...f })));
  presetNote.value = '';
}

function getDocTitle(doc: any): string {
  if (!doc) return 'Untitled';
  return doc.name || doc.title || doc.id || 'Untitled';
}

// Load existing preset on mount
async function loadExistingPreset() {
  try {
    await store.getSearchPresets();
    const existing = store.data.searchPresets.find(
      (p: any) => p.name === PRESET_NAME,
    );
    if (existing?.value) {
      const val = existing.value;
      if (val.query_by && val.query_by_weights) {
        const names = val.query_by.split(',').map((s: string) => s.trim());
        const weights = val.query_by_weights
          .split(',')
          .map((s: string) => parseInt(s.trim(), 10));
        if (names.length === weights.length) {
          const loaded: FieldWeight[] = names.map(
            (name: string, i: number) => ({
              name,
              weight: isNaN(weights[i]) ? 1 : weights[i],
            }),
          );
          fields.splice(0, fields.length, ...loaded);
          presetNote.value =
            'Loaded existing preset "' + PRESET_NAME + '". Changes will update this preset.';
        }
      }
    }
  } catch {
    // Preset doesn't exist yet, use defaults
  }
}

// Save as preset
async function savePreset() {
  saving.value = true;
  try {
    const presetValue = {
      query_by: queryBy.value,
      query_by_weights: queryByWeights.value,
    };
    await store.api?.upsertSearchPreset(PRESET_NAME, { value: presetValue });
    await store.getSearchPresets();
    presetNote.value =
      'Preset "' +
      PRESET_NAME +
      '" saved successfully. Make sure your storefront is configured to use this preset.';
    Notify.create({
      position: 'top',
      progress: true,
      group: false,
      timeout: 3000,
      color: 'positive',
      message: 'Search weights preset saved successfully',
    });
  } catch (error) {
    Notify.create({
      position: 'top',
      progress: true,
      group: false,
      timeout: 5000,
      color: 'negative',
      message: 'Failed to save preset: ' + (error as Error).message,
    });
  } finally {
    saving.value = false;
  }
}

// Live search preview
async function performSearch() {
  const q = searchQuery.value?.trim();
  if (!q) {
    searchResults.value = null;
    searchError.value = '';
    return;
  }

  searchLoading.value = true;
  searchError.value = '';

  try {
    const collectionName = store.currentCollection?.name || 'products';
    const result = await store.api?.search(collectionName, {
      q,
      query_by: queryBy.value,
      query_by_weights: queryByWeights.value,
      per_page: 10,
      highlight_full_fields: queryBy.value,
    } as any);
    searchResults.value = result;
  } catch (error) {
    searchError.value = (error as Error).message || 'Search failed';
    searchResults.value = null;
  } finally {
    searchLoading.value = false;
  }
}

// Watch for search query changes and weight/order changes to trigger search
watch(searchQuery, () => {
  void performSearch();
});

watch(
  () => fields.map((f) => `${f.name}:${f.weight}`).join(','),
  () => {
    if (searchQuery.value?.trim()) {
      void performSearch();
    }
  },
);

onMounted(() => {
  void loadExistingPreset();
});
</script>

<style scoped>
.sticky-preview {
  position: sticky;
  top: 60px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}

.cursor-move {
  cursor: move;
}

code {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.85em;
}
</style>
