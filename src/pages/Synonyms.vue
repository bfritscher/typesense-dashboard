<template>
  <q-page padding>
    <q-banner v-if="!route.params.name && !store.data.features.synonymSets" inline-actions class="bg-warning">
      Global synonym sets are not available with this server or API key. Use a collection-scoped
      synonym page when available.
    </q-banner>
    <template v-else>
    <q-expansion-item
      v-model="state.expanded"
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      :label="`${isUpdate ? 'Update' : 'Add'} Synonym`"
      header-class="bg-primary text-white"
    >
      <q-card class="bg-surface column">
        <q-card-section>
          <q-select
            v-if="store.data.features.synonymSets"
            v-model="state.setName"
            :options="filteredSetOptions"
            filled
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            new-value-mode="add-unique"
            label="Synonym set"
            :hint="setHint"
            :disable="state.editing"
            class="q-mb-md"
            @filter="filterSets"
            @input-value="onSetInput"
          ></q-select>
          <q-input
            v-model="state.id"
            label="Item ID"
            filled
            :hint="idHint"
            :disable="state.editing"
            class="q-mb-md"
          ></q-input>
          <q-option-group
            v-model="state.type"
            filled
            :options="typeOptions"
            color="primary"
            inline
            class="q-mb-md"
          />

          <q-input
            v-if="state.type === types.ONE_WAY"
            v-model="state.synonym.root"
            filled
            stack-label
            label="Root"
            class="q-mb-md"
          ></q-input>

          <q-select
            v-model="state.synonym.synonyms"
            filled
            multiple
            use-chips
            use-input
            new-value-mode="add"
            stack-label
            hide-dropdown-icon
            label="Synonyms"
            hint="Enter a synonym and press enter"
          >
          </q-select>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="text-overline">Optional</div>
          <q-select
            v-model="state.synonym.symbols_to_index"
            filled
            multiple
            use-chips
            use-input
            new-value-mode="add"
            stack-label
            hide-dropdown-icon
            label="Symbols to Index"
            hint="Enter a symbol (eg: +, - ) and press enter"
          >
          </q-select>

          <q-input
            v-model="state.synonym.locale"
            filled
            stack-label
            label="Locale"
            class="q-mb-md"
            hint="Leave blank to auto-detect"
          ></q-input>
        </q-card-section>

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
            @click="createSynonym()"
            >{{ submitLabel }}</q-btn
          >
        </q-card-actions>
      </q-card>
    </q-expansion-item>

    <set-manager
      v-if="store.data.features.synonymSets && !route.params.name"
      kind="synonym"
      :sets="allSets"
      @changed="refreshPageData"
      @add-item="startAddToSet"
    />

    <q-table
      class="q-mt-md"
      title="Synonyms"
      flat
      bordered
      :filter="state.filter"
      :rows="store.data.synonyms"
      :columns="state.columns"
      :visible-columns="visibleColumns"
      :row-key="rowKey"
      :pagination="{ rowsPerPage: 50, sortBy: 'name' }"
    >
      <template #top-left>
        <div class="text-h6"><q-icon size="md" name="sym_s_dataset_linked" /> Synonyms</div>
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
          <q-btn flat icon="sym_s_edit" title="Edit" @click="editSynonym(props.row)"></q-btn>
          <q-btn
            v-if="store.data.features.synonymSets && !route.params.name && props.row._setName"
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
            @click="deleteSynonym(props.row)"
          ></q-btn>
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

    <q-card v-if="store.data.features.synonymSets && route.params.name" class="q-mt-md" flat bordered>
      <q-card-section class="row items-center q-gutter-md">
        <div class="text-subtitle2">Link existing global set to this collection</div>
        <q-select
          v-model="selectedSetToLink"
          :options="unlinkedSets"
          dense
          outlined
          clearable
          label="Global synonym set"
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
import { useNodeStore } from '@/stores/node';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { nanoid } from 'nanoid';
import SetManager from '@/components/SetManager.vue';
import type { SynonymCreateSchema } from 'typesense/lib/Typesense/Synonyms';
import type { SynonymSchema } from 'typesense/lib/Typesense/Synonym';
import type { QTableProps } from 'quasar';
import type { SynonymRow } from '@/stores/node';
import type { SynonymSetSchema } from 'typesense/lib/Typesense/SynonymSets';

const $q = useQuasar();
const store = useNodeStore();
const route = useRoute();

enum RootTypes {
  ONE_WAY = 'one-way',
  MULTI_WAY = 'multi-way',
}

const types = RootTypes;

const typeOptions = [
  {
    label: 'Multi-way synonyms',
    value: RootTypes.MULTI_WAY,
  },
  {
    label: 'One-way synonym',
    value: RootTypes.ONE_WAY,
  },
];

function initialSynonymData(): SynonymCreateSchema {
  return {
    root: '',
    synonyms: [],
    locale: '',
    symbols_to_index: [],
  };
}

const state = reactive({
  expanded: store.data.synonyms.length === 0,
  filter: '',
  type: RootTypes.MULTI_WAY,
  synonym: initialSynonymData(),
  id: nanoid(),
  setName: null as string | null,
  editing: false,
  columns: [
    {
      label: 'Set',
      name: 'set',
      field: '_setName',
      align: 'left',
      sortable: true,
    },
    {
      label: 'ID',
      name: 'id',
      field: 'id',
      align: 'left',
    },
    {
      label: 'Type',
      name: 'type',
      align: 'left',
      field: (row: SynonymRow) => (row.root ? RootTypes.ONE_WAY : RootTypes.MULTI_WAY),
      sortable: true,
    },
    {
      label: 'Root',
      name: 'root',
      field: 'root',
      align: 'left',
      sortable: true,
    },
    {
      label: 'Synonyms',
      name: 'synonyms',
      field: (row: SynonymRow) => row.synonyms.join(', '),
      align: 'left',
      sortable: true,
    },
    {
      label: 'Symbols to Index',
      name: 'symbols_to_index',
      field: (row: SynonymSchema) => row.symbols_to_index?.join(', '),
      align: 'left',
      sortable: true,
    },
    {
      label: 'Locale',
      name: 'locale',
      field: 'locale',
      align: 'left',
      sortable: true,
    },
    {
      label: 'Actions',
      name: 'actions',
      align: 'right',
    },
  ] as QTableProps['columns'],
});

const allSets = ref<SynonymSetSchema[]>([]);
const setNames = computed(() => allSets.value.map((s) => s.name));
const filteredSetOptions = ref<string[]>([]);
const collectionName = computed(() => (route.params.name as string) || '');

function rowKey(row: SynonymRow) {
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
  if (setExists.value) return 'The synonym will be added to this set';
  return collectionName.value
    ? `A new set will be created and linked to ${collectionName.value}`
    : 'A new set will be created. Link it to collections from the sets table';
});

const idHint = computed(() =>
  itemExistsInSet.value && !state.editing
    ? 'A synonym with this ID already exists in the set and will be replaced'
    : 'Unique within the set',
);

const visibleColumns = computed(() =>
  (state.columns ?? [])
    .map((c) => c.name)
    .filter((name) => name !== 'set' || store.data.features.synonymSets),
);

const isValid = computed(
  () =>
    state.synonym.synonyms.length > 0 &&
    state.id.length > 0 &&
    (!store.data.features.synonymSets || !!state.setName),
);
const isUpdate = computed(() =>
  store.data.features.synonymSets
    ? itemExistsInSet.value
    : store.data.synonyms.map((s) => s.id).includes(state.id),
);
const submitLabel = computed(() => {
  if (state.editing) return 'Save changes';
  if (isUpdate.value) return 'Replace synonym';
  return store.data.features.synonymSets && !setExists.value ? 'Create set' : 'Add synonym';
});

function defaultSetName(): string | null {
  const linked = store.currentCollection?.synonym_sets ?? [];
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
  state.synonym = initialSynonymData();
  state.type = RootTypes.MULTI_WAY;
  state.setName = defaultSetName();
  state.editing = false;
}

async function createSynonym() {
  const synonym: SynonymCreateSchema = {
    synonyms: JSON.parse(JSON.stringify(state.synonym.synonyms)),
  };

  if (state.type === types.ONE_WAY) {
    synonym.root = state.synonym.root || '';
  }
  if (state.synonym.locale) {
    synonym.locale = state.synonym.locale;
  }
  if (state.synonym.symbols_to_index && state.synonym.symbols_to_index.length > 0) {
    synonym.symbols_to_index = state.synonym.symbols_to_index;
  }

  await store.createSynonym({
    id: state.id,
    synonym,
    ...(state.setName ? { setName: state.setName } : {}),
    ...(collectionName.value ? { collectionName: collectionName.value } : {}),
  });

  resetForm();
  state.expanded = false;
  await refreshSets();
}

function editSynonym(synonym: SynonymRow) {
  const copy = JSON.parse(JSON.stringify(synonym));
  const id = copy.id;
  state.setName = copy._setName ?? null;
  delete copy.id;
  delete copy._setName;
  state.id = id || nanoid();
  state.synonym = copy;
  state.type = state.synonym.root ? RootTypes.ONE_WAY : RootTypes.MULTI_WAY;
  state.synonym.locale = state.synonym.locale || '';
  state.synonym.symbols_to_index = state.synonym.symbols_to_index || [];
  state.editing = true;
  state.expanded = true;
}

function deleteSynonym(row: SynonymRow) {
  const set = allSets.value.find((s) => s.name === row._setName);
  const isLast = !!set && set.items.length <= 1;
  const message = isLast
    ? `${row.id} is the last item in ${row._setName}, so the set will be deleted and unlinked from all collections. Continue?`
    : `Delete synonym ${row.id}${row._setName ? ` from ${row._setName}` : ''}?`;
  $q.dialog({
    title: 'Confirm',
    message,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      await store.deleteSynonym({
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
  const linked = store.currentCollection?.synonym_sets ?? [];
  return allGlobalSets.value.filter((s) => !linked.includes(s));
});

async function linkSet() {
  if (!selectedSetToLink.value) return;
  await store.linkSynonymSetToCollection(selectedSetToLink.value);
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
  return store.data.collections.filter((c) => !(c.synonym_sets ?? []).includes(setName));
}

async function confirmLink() {
  await store.linkSynonymSetToCollection(linkDialog.setName, linkDialog.selectedCollection);
  linkDialog.open = false;
}

async function refreshSets() {
  allSets.value = store.data.features.synonymSets ? await store.fetchAllSynonymSets() : [];
}

async function refreshPageData() {
  if (store.data.features.synonymSets || collectionName.value) {
    void store.getSynonyms(collectionName.value);
  }
  await refreshSets();
  if (!state.editing && !state.setName) state.setName = defaultSetName();
}

onMounted(() => {
  void refreshPageData();
});

watch(
  () => [route.params.name, store.data.features.synonymSets],
  () => {
    void refreshPageData();
  },
);
</script>
