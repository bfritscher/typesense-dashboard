<template>
  <q-page padding>
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
          <q-input v-model="state.id" label="ID" filled class="q-mb-md"></q-input>
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
            size="md"
            padding="sm lg"
            unelevated
            color="primary"
            :disable="!isValid"
            @click="createSynonym()"
            >{{ isUpdate ? 'Update' : 'Add' }} Synonym</q-btn
          >
        </q-card-actions>
      </q-card>
    </q-expansion-item>

    <q-table
      class="q-mt-md"
      title="Synonyms"
      flat
      bordered
      :filter="state.filter"
      :rows="store.data.synonyms"
      :columns="state.columns"
      row-key="id"
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
            v-if="store.isV30Plus && !route.params.name"
            flat
            icon="sym_s_add_link"
            title="Link to collection"
            @click="openLinkDialog(props.row._setName || props.row.id)"
          ></q-btn>
          <q-btn
            flat
            color="negative"
            icon="sym_s_delete_forever"
            title="Delete"
            @click="deleteSynonym(props.row.id)"
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

    <q-card v-if="store.isV30Plus && route.params.name" class="q-mt-md" flat bordered>
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
  </q-page>
</template>

<script setup lang="ts">
import { useNodeStore } from 'src/stores/node';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { nanoid } from 'nanoid';
import type { SynonymCreateSchema } from 'typesense/lib/Typesense/Synonyms';
import type { SynonymSchema } from 'typesense/lib/Typesense/Synonym';
import type { QTableProps } from 'quasar';

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

const state = reactive({
  expanded: store.data.synonyms.length === 0,
  filter: '',
  type: RootTypes.MULTI_WAY,
  synonym: {
    root: '',
    synonyms: [],
    locale: '',
    symbols_to_index: [],
  } as SynonymCreateSchema,
  id: nanoid(),
  columns: [
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
      field: (row: SynonymSchema) => (row.root ? RootTypes.ONE_WAY : RootTypes.MULTI_WAY),
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
      field: (row: SynonymSchema) => row.synonyms.join(', '),
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

const isValid = computed(() => state.synonym.synonyms.length > 0 && state.id.length > 0);
const isUpdate = computed(() => store.data.synonyms.map((s) => s.id).includes(state.id));

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
    synonym: synonym,
  });

  state.id = nanoid();
  state.synonym = {
    root: '',
    synonyms: [],
    locale: '',
    symbols_to_index: [],
  };
  state.expanded = false;
}

function editSynonym(synonym: SynonymSchema) {
  const copy = JSON.parse(JSON.stringify(synonym));
  const id = copy.id;
  delete copy.id;
  delete copy._setName;
  state.id = id || nanoid();
  state.synonym = copy;
  state.type = state.synonym.root ? RootTypes.ONE_WAY : RootTypes.MULTI_WAY;
  state.synonym.locale = state.synonym.locale || '';
  state.synonym.symbols_to_index = state.synonym.symbols_to_index || [];
  state.expanded = true;
}

function deleteSynonym(id: string) {
  $q.dialog({
    title: 'Confirm',
    message: `Delete synonym with id: ${id}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void store.deleteSynonym(id);
  });
}

const allGlobalSets = ref<string[]>([]);
const selectedSetToLink = ref<string | null>(null);

const unlinkedSets = computed(() => {
  const linked = store.currentCollection?.synonym_sets ?? [];
  return allGlobalSets.value.filter((s) => !linked.includes(s));
});

async function linkSet() {
  if (!selectedSetToLink.value) return;
  await store.linkSynonymSetToCollection(selectedSetToLink.value);
  selectedSetToLink.value = null;
  const sets = await store.fetchAllSynonymSets();
  allGlobalSets.value = sets.map((s) => s.name);
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

onMounted(async () => {
  const collectionName = (route.params.name as string) || '';
  if (store.isV30Plus) {
    void store.getSynonyms(collectionName);
    if (collectionName) {
      const sets = await store.fetchAllSynonymSets();
      allGlobalSets.value = sets.map((s) => s.name);
    }
  } else if (collectionName) {
    void store.getSynonyms(collectionName);
  }
});
</script>
