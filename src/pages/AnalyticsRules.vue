<template>
  <q-page padding>
    <q-expansion-item
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      :label="`${isUpdate ? 'Update' : 'Add'} Analytics Rule`"
      header-class="bg-primary text-white"
      v-model="expanded"
    >
      <q-card class="bg-surface column">
        <q-card-section class="row q-col-gutter-md">
          <q-input
            class="col-12 col-sm-6"
            v-model="rule.name"
            label="Rule Name"
            filled
            :rules="[(val) => !!val || 'Field is required']"
          />

          <q-input
            class="col-12 col-sm-6"
            v-model="rule.type"
            label="Rule Type"
            filled
            :rules="[(val) => !!val || 'Field is required']"
          />
        </q-card-section>
        <q-card-section class="row q-col-gutter-md">
          <q-select
            class="col-12 col-sm-6"
            v-model="rule.params.source.collections"
            label="Source Collection(s)"
            filled
            :options="collectionNames"
            multiple
            hint="Track searches sent to these collections"
          ></q-select>

          <q-select
            class="col-12 col-sm-6"
            v-model="rule.params.destination.collection"
            label="Destination Collection"
            filled
            :options="collectionNames"
          ></q-select>
        </q-card-section>
        <q-card-section class="row q-col-gutter-md">
          <q-input
            class="col-12 col-sm-6"
            v-model="rule.params.limit"
            label="Limit"
            filled
            type="number"
            min="0"
          />
        </q-card-section>

        <q-card-actions align="right" class="bg-primary">
          <q-btn
            size="md"
            padding="sm lg"
            unelevated
            color="primary"
            @click="createRule()"
            >{{ isUpdate ? 'Update' : 'Add' }} Rule</q-btn
          >
        </q-card-actions>
      </q-card>
    </q-expansion-item>

    <q-table
      class="q-mt-md"
      title="Analytics Rules"
      flat
      bordered
      :filter="filter"
      :rows="$store.state.node.data.analyticsRules"
      :columns="columns"
      row-key="name"
      :pagination="{ rowsPerPage: 50, sortBy: 'name' }"
    >
      <template v-slot:top-left>
        <div class="text-h6">
          <q-icon size="md" name="sym_s_query_stats" /> Analytics Rules
        </div>
      </template>
      <template v-slot:top-right>
        <q-input
          borderless
          dense
          debounce="300"
          v-model="filter"
          placeholder="Search"
        >
          <template v-slot:append>
            <q-icon name="sym_s_search" />
          </template>
        </q-input>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td class="text-right">
          <q-btn
            flat
            @click="editRule(props.row)"
            icon="sym_s_edit"
            title="Edit"
          ></q-btn>
          <q-btn
            flat
            color="negative"
            @click="deleteRule(props.row.name)"
            icon="sym_s_delete_forever"
            title="Delete"
          ></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { AnalyticsRuleSchema } from 'typesense/lib/Typesense/AnalyticsRule';
import { defineComponent } from 'vue';

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
      limit: 100,
    },
  };
}

export default defineComponent({
  name: 'AnalyticsRules',
  data() {
    return {
      rule: initialData(),
      expanded: this.$store.state.node.data.aliases.length === 0,
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
          field: (r: AnalyticsRuleSchema) =>
            r.params.source.collections.join(', '),
          align: 'left',
          sortable: true,
        },
        {
          label: 'Destination Collection',
          name: 'destination',
          field: (r: AnalyticsRuleSchema) => r.params.destination.collection,
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
      ],
    };
  },
  mounted() {
    void this.$store.dispatch('node/getAnalyticsRules');
  },
  computed: {
    collectionNames() {
      return this.$store.state.node.data.collections.map(
        (collection) => collection.name
      );
    },
    isUpdate(): boolean {
      return this.$store.state.node.data.analyticsRules
        .map((a) => a.name)
        .includes(this.rule.name);
    },
  },
  methods: {
    async createRule() {
      await this.$store.dispatch('node/createAnalyticsRule', this.rule);
      this.expanded = false;
      this.rule = initialData();
    },
    editRule(rule: AnalyticsRuleSchema) {
      this.rule = JSON.parse(JSON.stringify(rule));
      this.expanded = true;
    },
    deleteRule(name: string) {
      this.$q
        .dialog({
          title: 'Confirm',
          message: `Delete analytics rule ${name}?`,
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          void this.$store.dispatch('node/deleteAnalyticsRule', name);
        });
    },
  },
});
</script>
