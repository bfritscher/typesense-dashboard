<template>
  <q-page padding>
    <q-expansion-item
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      :label="`${isUpdate ? 'Update' : 'Add'} Synonym`"
      header-class="bg-primary text-white"
      v-model="expanded"
    >
      <q-card class="bg-surface column">
        <q-card-section>
          <q-input
            label="ID"
            v-model="id"
            filled
            class="q-mb-md"
          ></q-input>
          <q-option-group
            filled
            v-model="type"
            :options="typeOptions"
            color="primary"
            inline
            class="q-mb-md"
          />

          <q-input
            filled
            stack-label
            label="Root"
            v-model="synonym.root"
            v-if="type === types.ONE_WAY"
            class="q-mb-md"
          ></q-input>

          <q-select
            filled
            v-model="synonym.synonyms"
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
            filled
            v-model="synonym.symbols_to_index"
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
            filled
            stack-label
            label="Locale"
            v-model="synonym.locale"
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
      :filter="filter"
      :rows="$store.state.node.data.synonyms"
      :columns="columns"
      row-key="id"
      :pagination="{ rowsPerPage: 50, sortBy: 'name' }"
    >
      <template v-slot:top-left>
        <div class="text-h6"><q-icon size="md" name="sym_s_dataset_linked" /> Synonyms</div>
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
            @click="editSynonym(props.row)"
            icon="sym_s_edit"
            title="Edit"
          ></q-btn>
          <q-btn
            flat
            color="negative"
            @click="deleteSynonym(props.row.id)"
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
        locale: '',
        symbols_to_index: []
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
      if (this.synonym.locale) {
        synonym.locale = this.synonym.locale;
      }
      if (this.synonym.symbols_to_index && this.synonym.symbols_to_index.length > 0) {
        synonym.symbols_to_index = this.synonym.symbols_to_index;
      }
      await this.$store.dispatch('node/createSynonym', {
        id: this.id,
        synonym: synonym,
      });
      this.id = nanoid();
      this.synonym = {
        root: '',
        synonyms: [],
        locale: '',
        symbols_to_index: []
      };
      this.expanded = false;
    },
    editSynonym(synonym: SynonymSchema) {
      this.id = synonym.id || nanoid();
      this.synonym = JSON.parse(JSON.stringify(synonym));
      this.type = this.synonym.root ? RootTypes.ONE_WAY : RootTypes.MULTI_WAY;
      this.synonym.locale = this.synonym.locale || '';
      this.synonym.symbols_to_index = this.synonym.symbols_to_index || [];
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
