<template>
  <q-page padding>
    <q-expansion-item
      expand-separator
      icon="sync_alt"
      :label="`${isUpdate ? 'Update' : 'Add'} Synonym`"
      header-class="bg-primary text-white"
      v-model="expanded"
    >
      <q-card class="bg-grey-3 column">
        <q-card-section>
          <q-input
            label="ID"
            v-model="id"
            filled
            bg-color="white"
            class="q-mb-md"
          ></q-input>
          <q-option-group
            filled
            bg-color="white"
            v-model="type"
            :options="typeOptions"
            color="primary"
            inline
            class="q-mb-md"
          />

          <q-input
            filled
            bg-color="white"
            label="Root"
            v-model="synonym.root"
            v-if="type === types.ONE_WAY"
            class="q-mb-md"
          ></q-input>

          <q-select
            filled
            bg-color="white"
            v-model="synonym.synonyms"
            multiple
            use-chips
            use-input
            new-value-mode="add"
            stack-label
            hide-dropdown-icon
            label="Synonyms"
          >
          </q-select>
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
      :filter="filter"
      :rows="$store.state.node.data.synonyms"
      :columns="columns"
      row-key="id"
      :visible-columns="['id', 'type', 'root', 'synonyms', 'actions']"
      :pagination="{ rowsPerPage: 50, sortBy: 'name' }"
    >
      <template v-slot:top-right>
        <q-input
          borderless
          dense
          debounce="300"
          v-model="filter"
          placeholder="Search"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td class="text-right">
          <q-btn
            flat
            color="primary"
            @click="editSynonym(props.row)"
            icon="edit"
            title="Edit"
          ></q-btn>
          <q-btn
            flat
            color="negative"
            @click="deleteSynonym(props.row.id)"
            icon="delete_forever"
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
import { SynonymCreateSchema } from 'typesense/lib/Typesense/Synonyms';
import { SynonymSchema } from 'typesense/lib/Typesense/Synonym';

enum RootTypes {
  ONE_WAY = 'one-way',
  MULTI_WAY = 'multi-way',
}

export default defineComponent({
  name: 'Synonyms',
  data() {
    return {
      expanded: this.$store.state.node.data.synonyms.length === 0,
      filter: '',
      type: RootTypes.MULTI_WAY,
      types: RootTypes,
      typeOptions: [
        {
          label: 'Multi-way synonyms',
          value: RootTypes.MULTI_WAY,
        },
        {
          label: 'One-way synonym',
          value: RootTypes.ONE_WAY,
        },
      ],
      synonym: {
        root: '',
        synonyms: [],
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
          field: (row: SynonymSchema) =>
            row.root ? RootTypes.ONE_WAY : RootTypes.MULTI_WAY,
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
          field: (row: SynonymSchema) => JSON.stringify(row.synonyms),
          align: 'left',
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
  computed: {
    isValid(): boolean {
      return this.synonym.synonyms.length > 0 && this.id.length > 0;
    },
    isUpdate(): boolean {
      return this.$store.state.node.data.synonyms
        .map((s) => s.id)
        .includes(this.id);
    },
  },
  methods: {
    async createSynonym() {
      const synonym: SynonymCreateSchema = {
        synonyms: JSON.parse(JSON.stringify(this.synonym.synonyms)),
      };
      if (this.type === this.types.ONE_WAY) {
        synonym.root = this.synonym.root;
      }
      await this.$store.dispatch('node/createSynonym', {
        id: this.id,
        synonym: synonym,
      });
      this.id = nanoid();
      this.synonym = {
        root: '',
        synonyms: [],
      };
      this.expanded = false;
    },
    editSynonym(synonym: SynonymSchema) {
      this.id = synonym.id || nanoid();
      this.synonym = JSON.parse(JSON.stringify(synonym));
      this.type = this.synonym.root ? RootTypes.ONE_WAY : RootTypes.MULTI_WAY;
      this.expanded = true;
    },
    deleteSynonym(id: string) {
      this.$q
        .dialog({
          title: 'Confirm',
          message: `Delete synonym with id: ${id}?`,
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          void this.$store.dispatch('node/deleteSynonym', id);
        });
    },
  },
});
</script>
