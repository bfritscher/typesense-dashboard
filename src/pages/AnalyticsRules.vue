<template>
  <q-page padding>
    <q-list bordered class="rounded-borders">
      <q-expansion-item
        v-model="state.expanded"
        expand-separator
        icon="sym_s_add_circle"
        expand-icon="sym_s_unfold_more"
        expanded-icon="sym_s_unfold_less"
        :label="`${isUpdate ? 'Update' : 'Add'} Analytics Rule`"
        header-class="bg-primary text-white"
      >
        <q-card>
          <q-tabs
            v-model="tab"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            narrow-indicator
          >
            <q-tab name="form" label="Form Mode" />
            <q-tab name="json" label="JSON Mode" />
          </q-tabs>
          <q-separator />
          <q-tab-panels v-model="tab" animated class="bg-surface">
            <q-tab-panel name="form">
              <q-card-section class="row q-col-gutter-md">
                <q-input
                  v-model="state.rule.name"
                  class="col-12 col-sm-6"
                  label="Rule Name"
                  filled
                  :rules="[(val) => !!val || 'Field is required']"
                />
                <q-select
                  v-model="state.rule.type"
                  :options="typeOptions"
                  class="col-12 col-sm-6"
                  label="Rule Type"
                  filled
                  :rules="[(val) => !!val || 'Field is required']"
                />
              </q-card-section>
              <q-card-section class="row q-col-gutter-md">
                <q-select
                  v-model="state.rule.params.source.collections"
                  class="col-12 col-sm-6"
                  label="Source Collection(s)"
                  filled
                  :options="sourceOptions"
                  multiple
                  hint="Track searches sent to these collections or aliases"
                ></q-select>
                <q-select
                  v-model="state.rule.params.destination!.collection"
                  class="col-12 col-sm-6"
                  label="Destination Collection"
                  filled
                  :options="sourceOptions"
                ></q-select>
              </q-card-section>
              <q-card-section class="row q-col-gutter-md">
                <q-input
                  v-model="state.rule.params.limit"
                  class="col-12 col-sm-6"
                  label="Limit"
                  filled
                  type="number"
                  min="0"
                />
                <q-checkbox
                  v-model="state.rule.params.expand_query"
                  class="col-12 col-sm-6"
                  label="Expand Query"
                  filled
                />
              </q-card-section>
            </q-tab-panel>
            <q-tab-panel name="json" class="q-pa-none">
              <monaco-editor v-model="ruleJson" style="height: 60vh"></monaco-editor>
              <q-banner v-if="jsonError" inline-actions class="text-white bg-red">
                Invalid Format: {{ jsonError }}
              </q-banner>
            </q-tab-panel>
          </q-tab-panels>
          <q-separator />
          <q-card-actions align="right" class="bg-primary">
            <q-btn size="md" padding="sm lg" unelevated color="primary" @click="createRule()">
              {{ isUpdate ? 'Update' : 'Add' }} Rule
            </q-btn>
          </q-card-actions>
        </q-card>
      </q-expansion-item>
    </q-list>

    <q-table
      class="q-mt-md"
      title="Analytics Rules"
      flat
      bordered
      :filter="state.filter"
      :rows="store.data.analyticsRules"
      :columns="state.columns"
      row-key="name"
      :pagination="{ rowsPerPage: 50, sortBy: 'name' }"
    >
      <template #top-left>
        <div class="text-h6"><q-icon size="md" name="sym_s_query_stats" /> Analytics Rules</div>
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
          <q-btn flat icon="sym_s_edit" title="Edit" @click="editRule(props.row)"></q-btn>
          <q-btn
            flat
            color="negative"
            icon="sym_s_delete_forever"
            title="Delete"
            @click="deleteRule(props.row.name)"
          ></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { useNodeStore } from 'src/stores/node';
import type { AnalyticsRuleSchema } from 'typesense/lib/Typesense/AnalyticsRule';
import { computed, onMounted, reactive, ref } from 'vue';
import type { QTableProps } from 'quasar';
import { useQuasar } from 'quasar';
import MonacoEditor from 'src/components/MonacoEditor.vue';

const $q = useQuasar();
const store = useNodeStore();

function initialData(): AnalyticsRuleSchema {
  return {
    name: '',
    type: 'popular_queries',
    params: {
      source: {
        collections: [],
      },
      destination: {
        collection: '',
      },
      expand_query: false,
      limit: 100,
    },
  };
}

const state = reactive({
  rule: initialData(),
  expanded: store.data.analyticsRules.length === 0,
  filter: '',
  columns: [
    {
      label: 'Rule Name',
      name: 'name',
      field: 'name',
      align: 'left',
      sortable: true,
    },
    {
      label: 'Rule Type',
      name: 'type',
      field: 'type',
      align: 'left',
      sortable: true,
    },
    {
      label: 'Source Collection(s)',
      name: 'source',
      field: (r: AnalyticsRuleSchema) => r.params.source.collections.join(', '),
      align: 'left',
      sortable: true,
    },
    {
      label: 'Destination Collection',
      name: 'destination',
      field: (r: AnalyticsRuleSchema) => r.params.destination?.collection || '',
      align: 'left',
      sortable: true,
    },
    {
      label: 'Limit',
      name: 'limit',
      field: (r: AnalyticsRuleSchema) => r.params.limit,
      align: 'right',
      sortable: true,
    },
    {
      label: 'Actions',
      name: 'actions',
      align: 'right',
    },
  ] as QTableProps['columns'],
});

const collectionNames = computed(() => store.data.collections.map((collection) => collection.name));
const aliasNames = computed(() => store.data.aliases.map((alias) => alias.name));
// Combine and sort collections and aliases for dropdowns
const sourceOptions = computed(() => {
  const options = [...collectionNames.value, ...aliasNames.value];
  return options.sort();
});

const typeOptions = ref(['popular_queries', 'nohits_queries', 'counter']);

const isUpdate = computed(() =>
  store.data.analyticsRules.map((a) => a.name).includes(state.rule.name),
);

const tab = ref('form');
const ruleJson = computed({
  get() {
    return JSON.stringify(state.rule, null, 2);
  },
  set(json: string) {
    try {
      state.rule = JSON.parse(json);
      jsonError.value = null;
    } catch (e) {
      jsonError.value = (e as Error).message;
    }
  },
});
const jsonError = ref<string | null>(null);

async function createRule() {
  await store.createAnalyticsRule(state.rule);
  state.expanded = false;
  state.rule = initialData();
}

function editRule(rule: AnalyticsRuleSchema) {
  state.rule = JSON.parse(JSON.stringify(rule));
  state.expanded = true;
}

function deleteRule(name: string) {
  $q.dialog({
    title: 'Confirm',
    message: `Delete analytics rule ${name}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void store.deleteAnalyticsRule(name);
  });
}

onMounted(() => {
  void store.getAnalyticsRules();
});
</script>
