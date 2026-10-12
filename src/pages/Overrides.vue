<template>
  <q-page padding>
    <q-banner v-if="!route.params.name && !store.data.features.curationSets" inline-actions class="bg-warning">
      Global curation sets are not available with this server or API key. Use a collection-scoped
      curation page when available.
    </q-banner>
    <template v-else>
    <q-expansion-item
      v-model="state.expanded"
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      :label="`${isUpdate ? 'Update' : 'Add'} Curation`"
      header-class="bg-primary text-white"
    >
      <q-card style="height: 60vh" class="bg-surface column">
        <q-card-section class="q-gutter-sm">
          <q-select
            v-if="store.data.features.curationSets"
            v-model="state.setName"
            :options="filteredSetOptions"
            dense
            filled
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            new-value-mode="add-unique"
            label="Curation set"
            :hint="setHint"
            :disable="state.editing"
            @filter="filterSets"
            @input-value="onSetInput"
          ></q-select>
          <q-input
            v-model="state.id"
            dense
            filled
            label="Item ID"
            :hint="idHint"
            :disable="state.editing"
          ></q-input>
        </q-card-section>
        <q-card-section v-if="store.supportsCurationRuleTags" class="q-pt-none">
          <q-select
            v-model="ruleTags"
            filled
            multiple
            use-chips
            use-input
            new-value-mode="add"
            stack-label
            hide-dropdown-icon
            label="Rule Tags"
            hint="Available in Typesense 26+ and matched via curation_tags at search time"
          />
        </q-card-section>
        <monaco-editor v-model="overrideJson"></monaco-editor>
        <q-banner v-if="state.jsonError" inline-actions class="text-white bg-red">
          Invalid Format: {{ state.jsonError }}
        </q-banner>

        <q-card-actions align="right" class="bg-primary">
          <q-btn
            v-if="state.editing"
            size="md"
            padding="sm lg"
            flat
            color="white"
            @click="resetForm()"
            >Cancel edit</q-btn
          >
          <q-btn
            size="md"
            padding="sm lg"
            unelevated
            color="primary"
            :disable="!isValid"
            @click="createOverride()"
            >{{ submitLabel }}</q-btn
          >
        </q-card-actions>
      </q-card>
    </q-expansion-item>

    <set-manager
      v-if="store.data.features.curationSets && !route.params.name"
      kind="curation"
      :sets="allSets"
      @changed="refreshPageData"
      @add-item="startAddToSet"
    />

    <q-table
      class="q-mt-md"
      title="Curations"
      flat
      bordered
      :filter="state.filter"
      :rows="store.data.overrides"
      :columns="state.columns"
      :row-key="rowKey"
      :visible-columns="visibleColumns"
    >
      <template #top-left>
        <div class="text-h6"><q-icon size="md" name="sym_s_low_priority" /> Curations</div>
      </template>
      <template #top-right>
        <q-input v-model="state.filter" borderless dense debounce="300" placeholder="Search">
          <template #append>
            <q-icon name="sym_s_search" />
          </template>
        </q-input>
      </template>
      <template #body-cell-actions="props">
        <q-td class="text-right">
          <q-btn flat icon="sym_s_edit" title="Edit" @click="editOverride(props.row)"></q-btn>
          <q-btn
            v-if="store.data.features.curationSets && !route.params.name && props.row._setName"
            flat
            icon="sym_s_add_link"
            title="Link to collection"
            @click="openLinkDialog(props.row._setName)"
          ></q-btn>
          <q-btn
            flat
            color="negative"
            icon="sym_s_delete_forever"
            title="Delete"
            @click="deleteOverride(props.row)"
          ></q-btn>
        </q-td>
      </template>
      <template #body-cell-trigger="props">
        <q-td :props="props" class="text-left">
          <div class="text-body2 ellipsis" :title="formatRuleSummary(props.row)">
            {{ formatRuleSummary(props.row) }}
          </div>
          <div v-if="formatRuleDetails(props.row)" class="text-caption text-grey-7">
            {{ formatRuleDetails(props.row) }}
          </div>
        </q-td>
      </template>
      <template #body-cell-result="props">
        <q-td :props="props" class="text-left">
          <div class="text-body2">{{ formatActionSummary(props.row) }}</div>
          <div v-if="formatActionDetails(props.row)" class="text-caption text-grey-7">
            {{ formatActionDetails(props.row) }}
          </div>
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="linkDialog.open">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Link to collection</div>
          <div class="text-caption q-mt-xs">Set: {{ linkDialog.setName }}</div>
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="linkDialog.selectedCollection"
            :options="availableCollectionsForSet(linkDialog.setName)"
            option-label="name"
            option-value="name"
            emit-value
            map-options
            outlined
            label="Collection"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancel" />
          <q-btn
            unelevated
            color="primary"
            label="Link"
            :disable="!linkDialog.selectedCollection"
            @click="confirmLink"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-card v-if="store.data.features.curationSets && route.params.name" class="q-mt-md" flat bordered>
      <q-card-section class="row items-center q-gutter-md">
        <div class="text-subtitle2">Link existing global set to this collection</div>
        <q-select
          v-model="selectedSetToLink"
          :options="unlinkedSets"
          dense
          outlined
          clearable
          label="Global curation set"
          style="min-width: 250px"
        />
        <q-btn
          unelevated
          color="primary"
          :disable="!selectedSetToLink"
          @click="linkSet"
          >Link to collection</q-btn
        >
      </q-card-section>
    </q-card>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { nanoid } from 'nanoid';
import MonacoEditor from '@/components/MonacoEditor.vue';
import SetManager from '@/components/SetManager.vue';
import { useNodeStore } from '@/stores/node';
import type { OverrideCreateSchema } from 'typesense/lib/Typesense/Overrides';
import type {
  CurationObjectSchema,
  CurationSetsListEntrySchema,
} from 'typesense/lib/Typesense/CurationSets';
import type { QTableProps } from 'quasar';
import type { OverrideRow } from '@/stores/node';

const $q = useQuasar();
const store = useNodeStore();
const route = useRoute();

const initialData: OverrideCreateSchema | Omit<CurationObjectSchema, 'id'> = {
  rule: {
    query: 'apple',
    match: 'exact',
  },
  includes: [
    { id: '422', position: 1 },
    { id: '54', position: 2 },
  ],
  excludes: [{ id: '287' }],
};

function ruleType(row: OverrideRow): string {
  const hasQuery = 'query' in row.rule && !!row.rule.query;
  const hasFilter = 'filter_by' in row.rule && !!row.rule.filter_by;
  const hasTags = (row.rule.tags?.length ?? 0) > 0;

  if (hasQuery && hasFilter && hasTags) return 'query + filter + tags';
  if (hasQuery && hasFilter) return 'query + filter';
  if (hasQuery && hasTags) return 'query + tags';
  if (hasFilter && hasTags) return 'filter + tags';
  if (hasQuery) return 'query';
  if (hasFilter) return 'filter';
  if (hasTags) return 'tags';
  return 'custom';
}

function formatRuleSummary(row: OverrideRow): string {
  const parts: string[] = [];
  if ('query' in row.rule && row.rule.query) {
    const match = 'match' in row.rule && row.rule.match ? ` (${row.rule.match})` : '';
    parts.push(`Query: ${row.rule.query}${match}`);
  }
  if ('filter_by' in row.rule && row.rule.filter_by) {
    parts.push(`Filter: ${row.rule.filter_by}`);
  }
  if ((row.rule.tags?.length ?? 0) > 0 && parts.length === 0) {
    parts.push('Triggered by curation tags');
  }
  return parts.join(' • ') || 'No explicit trigger';
}

function formatRuleTags(row: OverrideRow): string {
  return row.rule.tags?.join(', ') || '';
}

function formatRuleDetails(row: OverrideRow): string {
  const parts: string[] = [];
  if ((row.rule.tags?.length ?? 0) > 0) {
    parts.push(`Tags: ${formatRuleTags(row)}`);
  }
  if ('synonyms' in row.rule && row.rule.synonyms) {
    parts.push('synonyms enabled');
  }
  if ('stem' in row.rule && row.rule.stem) {
    parts.push('stemming enabled');
  }
  return parts.join(' • ');
}

function formatActionSummary(row: OverrideRow): string {
  const parts: string[] = [];
  if ((row.includes?.length ?? 0) > 0) parts.push(`${row.includes?.length} include(s)`);
  if ((row.excludes?.length ?? 0) > 0) parts.push(`${row.excludes?.length} exclude(s)`);
  if (row.filter_by) parts.push('result filter');
  if (row.sort_by) parts.push('custom sort');
  if (row.replace_query) parts.push('query replacement');
  return parts.join(' • ') || 'No direct result action';
}

function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleDateString();
}

function formatActionDetails(row: OverrideRow): string {
  const parts: string[] = [];
  if (row.remove_matched_tokens === false) {
    parts.push('keeps matched tokens');
  }
  if (row.filter_curated_hits) {
    parts.push('filters curated hits');
  }
  if (row.stop_processing === false) {
    parts.push('continues to next rule');
  }
  if (row.effective_from_ts || row.effective_to_ts) {
    const from = formatTimestamp(row.effective_from_ts);
    const to = formatTimestamp(row.effective_to_ts);
    parts.push(`active ${from || 'now'} -> ${to || 'open'}`);
  }
  if (row.metadata && Object.keys(row.metadata).length > 0) {
    parts.push('metadata');
  }
  return parts.join(' • ');
}

const state = reactive({
  id: nanoid(),
  override: initialData,
  setName: null as string | null,
  editing: false,
  jsonError: null as string | null,
  expanded: store.data.overrides.length === 0,
  filter: '',
  columns: [
    {
      label: 'Set',
      name: 'set',
      field: '_setName',
      sortable: true,
      align: 'left',
    },
    {
      label: 'ID',
      name: 'id',
      field: 'id',
    },
    {
      label: 'Rule Type',
      name: 'rule_type',
      field: (row: OverrideRow) => ruleType(row),
      sortable: true,
      align: 'left',
    },
    {
      label: 'Trigger',
      name: 'trigger',
      field: (row: OverrideRow) => formatRuleSummary(row),
      sortable: true,
      align: 'left',
    },
    {
      label: 'Result',
      name: 'result',
      field: (row: OverrideRow) => formatActionSummary(row),
      sortable: true,
      align: 'left',
      style: 'min-width: 180px',
    },
    {
      label: 'Actions',
      name: 'actions',
      align: 'right',
    },
  ] as QTableProps['columns'],
});

const allSets = ref<CurationSetsListEntrySchema[]>([]);
const setNames = computed(() => allSets.value.map((s) => s.name));
const filteredSetOptions = ref<string[]>([]);
const collectionName = computed(() => (route.params.name as string) || '');

function rowKey(row: OverrideRow) {
  return `${row._setName ?? ''}/${row.id}`;
}

function filterSets(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase();
    filteredSetOptions.value = setNames.value.filter((n) => n.toLowerCase().includes(needle));
  });
}

// Keep the typed text as the set name so users don't have to press enter.
function onSetInput(val: string) {
  state.setName = val || null;
}

const setExists = computed(() => !!state.setName && setNames.value.includes(state.setName));
const itemExistsInSet = computed(() => {
  if (!state.setName) return false;
  const set = allSets.value.find((s) => s.name === state.setName);
  return !!set?.items.some((i) => i.id === state.id);
});

const setHint = computed(() => {
  if (!state.setName) return 'Pick an existing set or type a name for a new one';
  if (state.editing) return 'Editing an item in this set';
  if (setExists.value) return 'The curation will be added to this set';
  return collectionName.value
    ? `A new set will be created and linked to ${collectionName.value}`
    : 'A new set will be created. Link it to collections from the sets table';
});

const idHint = computed(() =>
  itemExistsInSet.value && !state.editing
    ? 'A curation with this ID already exists in the set and will be replaced'
    : 'Unique within the set',
);

const isValid = computed(
  () =>
    state.id.length > 0 &&
    !state.jsonError &&
    (!store.data.features.curationSets || !!state.setName),
);
const isUpdate = computed(() =>
  store.data.features.curationSets
    ? itemExistsInSet.value
    : store.data.overrides.map((o) => o.id).includes(state.id),
);
const submitLabel = computed(() => {
  if (state.editing) return 'Save changes';
  if (isUpdate.value) return 'Replace curation';
  return store.data.features.curationSets && !setExists.value ? 'Create set' : 'Add curation';
});
const visibleColumns = computed(() =>
  store.data.features.curationSets
    ? ['set', 'id', 'rule_type', 'trigger', 'result', 'actions']
    : ['rule_type', 'trigger', 'result', 'actions'],
);

function defaultSetName(): string | null {
  const linked = store.currentCollection?.curation_sets ?? [];
  return collectionName.value && linked.length === 1 ? (linked[0] ?? null) : null;
}

// Open the form pre-filled with an existing set, from the sets table.
function startAddToSet(setName: string) {
  resetForm();
  state.setName = setName;
  state.expanded = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  state.id = nanoid();
  state.override = JSON.parse(JSON.stringify(initialData));
  state.setName = defaultSetName();
  state.editing = false;
  state.jsonError = null;
}
const ruleTags = computed({
  get: () => state.override.rule.tags || [],
  set: (tags: string[]) => {
    if (tags.length > 0) {
      state.override.rule.tags = tags;
    } else {
      delete state.override.rule.tags;
    }
  },
});

const overrideJson = computed({
  get: () => JSON.stringify(state.override, null, 2),
  set: (json: string) => {
    try {
      state.override = JSON.parse(json);
      state.jsonError = null;
    } catch (e) {
      state.jsonError = (e as Error).message;
    }
  },
});

async function createOverride() {
  await store.createOverride({
    id: state.id,
    override: JSON.parse(JSON.stringify(state.override)),
    ...(state.setName ? { setName: state.setName } : {}),
    ...(collectionName.value ? { collectionName: collectionName.value } : {}),
  });
  resetForm();
  state.expanded = false;
  await refreshSets();
}

function editOverride(override: OverrideRow) {
  const copy = JSON.parse(JSON.stringify(override));
  const id = copy.id;
  state.setName = copy._setName ?? null;
  delete copy.id;
  delete copy._setName;
  state.override = copy;
  state.id = id || nanoid();
  state.editing = true;
  state.expanded = true;
}

function deleteOverride(row: OverrideRow) {
  const set = allSets.value.find((s) => s.name === row._setName);
  const isLast = !!set && set.items.length <= 1;
  const message = isLast
    ? `${row.id} is the last item in ${row._setName}, so the set will be deleted and unlinked from all collections. Continue?`
    : `Delete curation ${row.id}${row._setName ? ` from ${row._setName}` : ''}?`;
  $q.dialog({
    title: 'Confirm',
    message,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      await store.deleteOverride({
        id: row.id,
        ...(row._setName ? { setName: row._setName } : {}),
        ...(collectionName.value ? { collectionName: collectionName.value } : {}),
      });
      await refreshSets();
    })();
  });
}

const allGlobalSets = computed(() => setNames.value);
const selectedSetToLink = ref<string | null>(null);

const unlinkedSets = computed(() => {
  const linked = store.currentCollection?.curation_sets ?? [];
  return allGlobalSets.value.filter((s) => !linked.includes(s));
});

async function linkSet() {
  if (!selectedSetToLink.value) return;
  await store.linkCurationSetToCollection(selectedSetToLink.value);
  selectedSetToLink.value = null;
  await refreshSets();
}

const linkDialog = reactive({ open: false, setName: '', selectedCollection: '' });

function openLinkDialog(setName: string) {
  linkDialog.setName = setName;
  linkDialog.selectedCollection = '';
  linkDialog.open = true;
}

function availableCollectionsForSet(setName: string) {
  return store.data.collections.filter((c) => !(c.curation_sets ?? []).includes(setName));
}

async function confirmLink() {
  await store.linkCurationSetToCollection(linkDialog.setName, linkDialog.selectedCollection);
  linkDialog.open = false;
}

async function refreshSets() {
  allSets.value = store.data.features.curationSets ? await store.fetchAllCurationSets() : [];
}

async function refreshPageData() {
  if (store.data.features.curationSets || collectionName.value) {
    void store.getOverrides(collectionName.value);
  }
  await refreshSets();
  if (!state.editing && !state.setName) state.setName = defaultSetName();
}

onMounted(() => {
  void refreshPageData();
});

watch(
  () => [route.params.name, store.data.features.curationSets],
  () => {
    void refreshPageData();
  },
);
</script>
