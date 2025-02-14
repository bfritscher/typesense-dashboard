<template>
  <q-page padding>
    <q-expansion-item
      v-model="state.expanded"
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      :label="`${isUpdate ? 'Update' : 'Add'} Stopwords Set`"
      header-class="bg-primary text-white"
    >
      <q-card class="bg-surface column">
        <q-card-section class="q-col-gutter-md row">
          <q-input
            v-model="state.stopwordsSet.id"
            class="col-12 col-sm-6"
            label="ID"
            filled
            :rules="[(val) => !!val || 'Field is required']"
          />
          <q-input
            v-model="state.stopwordsSet.locale"
            filled
            label="Locale"
            class="col-12 col-sm-4"
          />
          <q-btn
            type="a"
            icon="sym_s_help"
            no-caps
            color="info"
            flat
            dense
            :href="`https://typesense.org/docs/${store.data.debug.version}/api/stopwords.html`"
            target="_blank"
          >
            Documentation
          </q-btn>
          <q-select
            v-model="state.stopwordsSet.stopwords"
            class="col-12"
            filled
            multiple
            use-chips
            use-input
            new-value-mode="add"
            stack-label
            hide-dropdown-icon
            label="Stopwords"
            hint="Enter a stopword and press enter"
          />
        </q-card-section>
        <q-banner v-if="state.jsonError" inline-actions class="text-white bg-red">
          Invalid Format: {{ state.jsonError }}
        </q-banner>

        <q-card-actions align="right" class="bg-primary">
          <q-btn
            size="md"
            padding="sm lg"
            unelevated
            color="primary"
            :disable="!!state.jsonError"
            @click="createStopwordsSet()"
            >{{ isUpdate ? 'Update' : 'Add' }} Set
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-expansion-item>

    <q-table
      class="q-mt-md"
      title="Search Presets"
      flat
      bordered
      wrap-cells
      :filter="state.filter"
      :rows="store.data.stopwords"
      :columns="state.columns"
      row-key="id"
    >
      <template #top-left>
        <div class="text-h6">
          <q-icon size="md" name="sym_s_playlist_remove" />
          Stopwords Sets
        </div>
      </template>
      <template #top-right>
        <q-input v-model="state.filter" borderless dense debounce="300" placeholder="Search">
          <template #append>
            <q-icon name="sym_s_search" />
          </template>
        </q-input>
      </template>
      <template #body-cell-stopwords="props">
        <q-td>
          <q-chip v-for="stopword in props.row.stopwords" :key="stopword">
            {{ stopword }}
          </q-chip>
        </q-td>
      </template>
      <template #body-cell-actions_op="props">
        <q-td class="text-right text-no-wrap">
          <q-btn flat icon="sym_s_edit" title="Edit" @click="editStopwordsSet(props.row)"></q-btn>
          <q-btn
            flat
            color="negative"
            icon="sym_s_delete_forever"
            title="Delete"
            @click="deleteStopwordsSet(props.row.id)"
          ></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { useNodeStore } from 'src/stores/node';
import { computed, onMounted, reactive } from 'vue';
import { useQuasar } from 'quasar';
import type { StopwordSchema } from 'typesense/lib/Typesense/Stopword';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();

const state = reactive({
  jsonError: null as string | null,
  stopwordsSet: {
    id: 'stopword_set1',
    locale: 'en',
    stopwords: ['states', 'united', 'france', 'germany', 'italy'],
  },
  expanded: store.data.stopwords.length === 0,
  filter: '',
  columns: [
    {
      label: 'ID',
      name: 'id',
      field: 'id',
      sortable: true,
      align: 'left',
    },
    {
      label: 'Locale',
      name: 'locale',
      field: 'locale',
      sortable: true,
      align: 'left',
    },
    {
      label: 'Stopwords',
      name: 'stopwords',
      field: 'stopwords',
      sortable: true,
      align: 'left',
    },
    {
      label: 'Actions',
      name: 'actions_op',
      align: 'right',
    },
  ] as QTableProps['columns'],
});

const isUpdate = computed(() =>
  store.data.stopwords.map((p: any) => p.id).includes(state.stopwordsSet.id),
);

async function createStopwordsSet() {
  await store.upsertStopwords(JSON.parse(JSON.stringify(state.stopwordsSet)));
}

function editStopwordsSet(stopwordsSet: StopwordSchema) {
  state.stopwordsSet = JSON.parse(JSON.stringify(stopwordsSet));
  state.expanded = true;
}

function deleteStopwordsSet(id: string) {
  $q.dialog({
    title: 'Confirm',
    message: `Delete stopwords set ${id}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void store.deleteStopwords(id);
  });
}

onMounted(() => {
  void store.getStopwords();
});
</script>
