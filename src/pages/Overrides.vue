<template>
  <q-page padding>
    <q-expansion-item
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      :label="`${isUpdate ? 'Update' : 'Add'} Curation`"
      header-class="bg-primary text-white"
      v-model="expanded"
    >
      <q-card style="height: 60vh" class="bg-surface column">
        <q-card-section>
          <q-input
            dense
            filled
            label="ID"
            v-model="id"
          ></q-input>
        </q-card-section>
        <monaco-editor v-model="overrideJson"></monaco-editor>
        <q-banner inline-actions class="text-white bg-red" v-if="jsonError">
          Invalid Format: {{ jsonError }}
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
      :filter="filter"
      :rows="$store.state.node.data.overrides"
      :columns="columns"
      row-key="id"
      :visible-columns="['query', 'match', 'includes', 'excludes', 'actions']"
    >
      <template v-slot:top-left>
        <div class="text-h6"><q-icon size="md" name="sym_s_low_priority" /> Curations</div>
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
            @click="editOverride(props.row)"
            icon="sym_s_edit"
            title="Edit"
          ></q-btn>
          <q-btn
            flat
            color="negative"
            @click="deleteOverride(props.row.id)"
            icon="sym_s_delete_forever"
            title="Delete"
          ></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { nanoid } from 'nanoid';
import MonacoEditor from 'src/components/MonacoEditor.vue';
import { OverrideSchema } from 'typesense/lib/Typesense/Override';
import { OverrideCreateSchema } from 'typesense/lib/Typesense/Overrides';

const initialData: OverrideCreateSchema = {
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

export default defineComponent({
  components: { MonacoEditor },
  name: 'Overrides',
  data() {
    return {
      id: nanoid(),
      override: initialData as (OverrideSchema | OverrideCreateSchema ),
      jsonError: null as string | null,
      expanded: this.$store.state.node.data.overrides.length === 0,
      filter: '',
      columns: [
        {
          label: 'ID',
          name: 'id',
          field: 'id',
        },
        {
          label: 'Query',
          name: 'query',
          field: (row: any) => row.rule.query,
          sortable: true,
          align: 'left',
        },
        {
          label: 'Match',
          name: 'match',
          field: (row: any) => row.rule.match,
          sortable: true,
          align: 'left',
        },
        {
          label: 'Includes',
          name: 'includes',
          field: (row: OverrideSchema) => row.includes?.length,
        },
        {
          label: 'Excludes',
          name: 'excludes',
          field: (row: OverrideSchema) => row.excludes?.length,
        },
        {
          label: 'Actions',
          name: 'actions',
          align: 'right',
        },
      ],
    };
  },
  computed: {
    isValid(): boolean {
      return this.id.length > 0 && !this.jsonError;
    },
    isUpdate(): boolean {
      return this.$store.state.node.data.overrides
        .map((o) => o.id)
        .includes(this.id);
    },
    overrideJson: {
      get(): string {
        return JSON.stringify(this.override, null, 2);
      },
      set(json:string) {
        try {
          this.override = JSON.parse(json);
          this.jsonError = null;
        } catch (e) {
          this.jsonError = (e as Error).message;
        }
      },
    },
  },
  methods: {
    async createOverride() {
      await this.$store.dispatch('node/createOverride', {
        id: this.id,
        override: JSON.parse(JSON.stringify(this.override)),
      });
      this.id = nanoid();
      this.override = initialData;
      this.expanded = false;
    },
    editOverride(override: OverrideSchema) {
      this.override = JSON.parse(JSON.stringify(override));
      this.id = override.id || nanoid();
      this.expanded = true;
    },
    deleteOverride(id: string) {
      this.$q
        .dialog({
          title: 'Confirm',
          message: `Delete curation with id: ${id}?`,
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          void this.$store.dispatch('node/deleteOverride', id);
        });
    },
  },
});
</script>
