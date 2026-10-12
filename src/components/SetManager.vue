<template>
  <q-table
    class="q-mt-md"
    flat
    bordered
    :rows="sets"
    :columns="columns"
    row-key="name"
    :filter="filter"
    :pagination="{ rowsPerPage: 25, sortBy: 'name' }"
    no-data-label="No sets yet. Create one to group related items."
  >
    <template #top-left>
      <div class="text-h6"><q-icon size="md" :name="icon" /> {{ title }}</div>
    </template>
    <template #top-right>
      <q-input
        v-model="filter"
        borderless
        dense
        debounce="300"
        placeholder="Search sets"
        class="q-mr-md"
      >
        <template #append>
          <q-icon name="sym_s_search" />
        </template>
      </q-input>
      <q-btn
        unelevated
        color="primary"
        icon="sym_s_data_object"
        label="Import JSON"
        title="Create a set with several items at once by pasting JSON"
        @click="openNew"
      />
    </template>
    <template #body-cell-collections="scope">
      <q-td :props="scope">
        <q-chip
          v-for="c in store.collectionsUsingSet(kind, scope.row.name)"
          :key="c"
          dense
          removable
          :title="`Unlink from ${c}`"
          @remove="confirmUnlink(scope.row.name, c)"
        >
          {{ c }}
        </q-chip>
        <span
          v-if="store.collectionsUsingSet(kind, scope.row.name).length === 0"
          class="text-grey-7"
        >
          Not linked
        </span>
      </q-td>
    </template>
    <template #body-cell-actions="scope">
      <q-td class="text-right">
        <q-btn
          flat
          icon="sym_s_add"
          :title="addItemTitle"
          @click="emit('add-item', scope.row.name)"
        ></q-btn>
        <q-btn
          flat
          icon="sym_s_data_object"
          title="Edit set as JSON"
          @click="openEdit(scope.row)"
        ></q-btn>
        <q-btn
          flat
          icon="sym_s_add_link"
          title="Link to collection"
          @click="openLink(scope.row.name)"
        ></q-btn>
        <q-btn
          flat
          color="negative"
          icon="sym_s_delete_forever"
          title="Delete set"
          @click="confirmDelete(scope.row.name)"
        ></q-btn>
      </q-td>
    </template>
  </q-table>

  <q-dialog v-model="editor.open" persistent transition-show="none" transition-hide="none">
    <q-card class="column" style="width: 900px; max-width: 95vw; height: 80vh">
      <q-card-section class="q-pb-sm">
        <div class="text-h6">
          {{ editor.isNew ? 'Import set from JSON' : `Edit set ${editor.name} as JSON` }}
        </div>
        <div class="text-caption text-grey-7">
          {{
            editor.isNew
              ? 'Creates a new set containing every item in the JSON below. To add a single item, use the form above instead.'
              : 'Saving replaces every item in the set with the JSON below.'
          }}
        </div>
      </q-card-section>
      <q-card-section v-if="editor.isNew" class="q-pt-none">
        <q-input
          v-model="editor.name"
          dense
          filled
          label="Set name"
          :error="nameTaken"
          error-message="A set with this name already exists. Edit it from the table instead."
          autofocus
        />
      </q-card-section>
      <monaco-editor v-model="editor.json"></monaco-editor>
      <q-banner v-if="validationError" dense class="text-white bg-red">
        {{ validationError }}
      </q-banner>
      <q-card-actions align="right">
        <q-btn v-close-popup flat label="Cancel" />
        <q-btn
          unelevated
          color="primary"
          :label="editor.isNew ? 'Create set' : 'Save set'"
          :disable="!canSave"
          :loading="editor.saving"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="link.open">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Link to collection</div>
        <div class="text-caption q-mt-xs">Set: {{ link.setName }}</div>
      </q-card-section>
      <q-card-section>
        <q-select
          v-model="link.collections"
          :options="unlinkedCollections"
          multiple
          use-chips
          outlined
          label="Collections"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-close-popup flat label="Cancel" />
        <q-btn
          unelevated
          color="primary"
          label="Link"
          :disable="link.collections.length === 0"
          @click="confirmLink"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableProps } from 'quasar';
import MonacoEditor from '@/components/MonacoEditor.vue';
import { useNodeStore } from '@/stores/node';
import type { SynonymItemSchema } from 'typesense/lib/Typesense/SynonymSets';
import type { CurationObjectSchema } from 'typesense/lib/Typesense/CurationSets';

type SetItem = SynonymItemSchema | CurationObjectSchema;
interface SetEntry {
  name: string;
  items: SetItem[];
}

const props = defineProps<{
  kind: 'synonym' | 'curation';
  sets: SetEntry[];
}>();

const emit = defineEmits<{ changed: []; 'add-item': [setName: string] }>();

const $q = useQuasar();
const store = useNodeStore();

const filter = ref('');
const addItemTitle = computed(() =>
  props.kind === 'synonym' ? 'Add a synonym to this set' : 'Add a curation to this set',
);
const title = computed(() => (props.kind === 'synonym' ? 'Synonym sets' : 'Curation sets'));
const icon = computed(() =>
  props.kind === 'synonym' ? 'sym_s_dataset_linked' : 'sym_s_low_priority',
);

const columns: QTableProps['columns'] = [
  { label: 'Set', name: 'name', field: 'name', align: 'left', sortable: true },
  {
    label: 'Items',
    name: 'items',
    field: (row: SetEntry) => row.items?.length ?? 0,
    align: 'left',
    sortable: true,
  },
  {
    label: 'Linked collections',
    name: 'collections',
    field: (row: SetEntry) => store.collectionsUsingSet(props.kind, row.name).join(', '),
    align: 'left',
  },
  { label: 'Actions', name: 'actions', field: 'name', align: 'right' },
];

const synonymTemplate: SynonymItemSchema[] = [
  { id: 'nyc', synonyms: ['nyc', 'new york', 'new york city'] },
  { id: 'beach', root: 'beach hotel', synonyms: ['oceanfront', 'beachfront'] },
];

const curationTemplate: CurationObjectSchema[] = [
  {
    id: 'pin-featured',
    rule: { query: 'paris hotels', match: 'exact' },
    includes: [{ id: '422', position: 1 }],
    excludes: [{ id: '287' }],
  },
];

const editor = reactive({
  open: false,
  isNew: true,
  name: '',
  json: '',
  saving: false,
});

function openNew() {
  editor.isNew = true;
  editor.name = '';
  editor.json = JSON.stringify(
    props.kind === 'synonym' ? synonymTemplate : curationTemplate,
    null,
    2,
  );
  editor.open = true;
}

function openEdit(row: SetEntry) {
  editor.isNew = false;
  editor.name = row.name;
  editor.json = JSON.stringify(row.items ?? [], null, 2);
  editor.open = true;
}

const nameTaken = computed(
  () => editor.isNew && props.sets.some((s) => s.name === editor.name.trim()),
);

const parsed = computed<{ items?: SetItem[]; error?: string }>(() => {
  let value: unknown;
  try {
    value = JSON.parse(editor.json);
  } catch (e) {
    return { error: `Invalid JSON: ${(e as Error).message}` };
  }
  if (!Array.isArray(value)) {
    return { error: 'The set must be a JSON array of items.' };
  }
  if (value.length === 0) {
    return { error: 'Add at least one item. To remove a set, delete it from the table.' };
  }
  const ids = new Set<string>();
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id) {
      return { error: `Item ${index + 1} needs a non-empty string "id".` };
    }
    if (ids.has(item.id)) {
      return { error: `Item id "${item.id}" is used more than once.` };
    }
    ids.add(item.id);
    if (props.kind === 'synonym') {
      if (!Array.isArray(item.synonyms) || item.synonyms.length === 0) {
        return { error: `Item "${item.id}" needs a non-empty "synonyms" array.` };
      }
    } else if (!item.rule || typeof item.rule !== 'object') {
      return { error: `Item "${item.id}" needs a "rule" object.` };
    }
  }
  return { items: value as SetItem[] };
});

const validationError = computed(() => parsed.value.error ?? null);
const canSave = computed(
  () => !!editor.name.trim() && !nameTaken.value && !!parsed.value.items && !editor.saving,
);

async function save() {
  if (!parsed.value.items) return;
  editor.saving = true;
  const setName = editor.name.trim();
  const ok =
    props.kind === 'synonym'
      ? await store.saveSynonymSet({
          setName,
          items: parsed.value.items as SynonymItemSchema[],
        })
      : await store.saveCurationSet({
          setName,
          items: parsed.value.items as CurationObjectSchema[],
        });
  editor.saving = false;
  if (ok) {
    editor.open = false;
    $q.notify({ type: 'positive', message: `Saved set ${setName}` });
    emit('changed');
  }
}

const link = reactive({ open: false, setName: '', collections: [] as string[] });

const unlinkedCollections = computed(() => {
  const linked = store.collectionsUsingSet(props.kind, link.setName);
  return store.data.collections.map((c) => c.name).filter((n) => !linked.includes(n));
});

function openLink(setName: string) {
  link.setName = setName;
  link.collections = [];
  link.open = true;
}

async function confirmLink() {
  for (const collectionName of link.collections) {
    if (props.kind === 'synonym') {
      await store.linkSynonymSetToCollection(link.setName, collectionName);
    } else {
      await store.linkCurationSetToCollection(link.setName, collectionName);
    }
  }
  link.open = false;
  emit('changed');
}

function confirmUnlink(setName: string, collectionName: string) {
  $q.dialog({
    title: 'Unlink set',
    message: `Stop applying ${setName} to searches on ${collectionName}? The set itself is kept.`,
    cancel: true,
    persistent: true,
    ok: { label: 'Unlink', color: 'negative', flat: true },
  }).onOk(() => {
    void (async () => {
      if (props.kind === 'synonym') {
        await store.unlinkSynonymSetFromCollection(setName, collectionName);
      } else {
        await store.unlinkCurationSetFromCollection(setName, collectionName);
      }
      emit('changed');
    })();
  });
}

function confirmDelete(setName: string) {
  const linked = store.collectionsUsingSet(props.kind, setName);
  const unlinkNote = linked.length ? ` It will also be unlinked from ${linked.join(', ')}.` : '';
  $q.dialog({
    title: 'Delete set',
    message: `Delete ${setName} and all its items?${unlinkNote}`,
    cancel: true,
    persistent: true,
    ok: { label: 'Delete set', color: 'negative', flat: true },
  }).onOk(() => {
    void (async () => {
      const ok =
        props.kind === 'synonym'
          ? await store.removeSynonymSet(setName)
          : await store.removeCurationSet(setName);
      if (ok) emit('changed');
    })();
  });
}
</script>
