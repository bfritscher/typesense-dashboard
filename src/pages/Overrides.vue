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
        <q-card-section>
          <q-input v-model="state.id" dense filled label="ID"></q-input>
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
            size="md"
            padding="sm lg"
            unelevated
            color="primary"
            :disable="!isValid"
            @click="createOverride()"
            >{{ isUpdate ? 'Update' : 'Add' }} Curation</q-btn
          >
        </q-card-actions>
      </q-card>
    </q-expansion-item>

    <q-table
      class="q-mt-md"
      title="Curations"
      flat
      bordered
      :filter="state.filter"
      :rows="store.data.overrides"
      :columns="state.columns"
      row-key="id"
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
import MonacoEditor from 'src/components/MonacoEditor.vue';
import { useNodeStore } from 'src/stores/node';
import type { OverrideSchema } from 'typesense/lib/Typesense/Override';
import type { OverrideCreateSchema } from 'typesense/lib/Typesense/Overrides';
import type { CurationObjectSchema } from 'typesense/lib/Typesense/CurationSets';
import type { QTableProps } from 'quasar';
import type { OverrideRow } from 'src/stores/node';

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
  override: initialData as OverrideSchema | OverrideCreateSchema | Omit<CurationObjectSchema, 'id'>,
  setName: null as string | null,
  jsonError: null as string | null,
  expanded: store.data.overrides.length === 0,
  filter: '',
  columns: [
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

const isValid = computed(() => state.id.length > 0 && !state.jsonError);
const isUpdate = computed(() => store.data.overrides.map((o) => o.id).includes(state.id));
const visibleColumns = computed(() => ['rule_type', 'trigger', 'result', 'actions']);
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
  });
  state.id = nanoid();
  state.override = JSON.parse(JSON.stringify(initialData));
  state.setName = null;
  state.expanded = false;
}

function editOverride(override: OverrideRow) {
  const copy = JSON.parse(JSON.stringify(override));
  const id = copy.id;
  state.setName = copy._setName ?? null;
  delete copy.id;
  delete copy._setName;
  state.override = copy;
  state.id = id || nanoid();
  state.expanded = true;
}

function deleteOverride(row: OverrideRow) {
  $q.dialog({
    title: 'Confirm',
    message: `Delete curation with id: ${row.id}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void store.deleteOverride({
      id: row.id,
      ...(row._setName ? { setName: row._setName } : {}),
    });
  });
}

const allGlobalSets = ref<string[]>([]);
const selectedSetToLink = ref<string | null>(null);

const unlinkedSets = computed(() => {
  const linked = store.currentCollection?.curation_sets ?? [];
  return allGlobalSets.value.filter((s) => !linked.includes(s));
});

async function linkSet() {
  if (!selectedSetToLink.value) return;
  await store.linkCurationSetToCollection(selectedSetToLink.value);
  selectedSetToLink.value = null;
  const sets = await store.fetchAllCurationSets();
  allGlobalSets.value = sets.map((s) => s.name);
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

async function refreshPageData() {
  const collectionName = (route.params.name as string) || '';
  if (store.data.features.curationSets) {
    void store.getOverrides(collectionName);
    if (collectionName) {
      const sets = await store.fetchAllCurationSets();
      allGlobalSets.value = sets.map((s) => s.name);
    } else {
      allGlobalSets.value = [];
    }
  } else if (collectionName) {
    void store.getOverrides(collectionName);
  } else {
    allGlobalSets.value = [];
  }
}

onMounted(() => {
  void refreshPageData();
});

watch(
  () => route.params.name,
  () => {
    void refreshPageData();
  },
);
</script>
