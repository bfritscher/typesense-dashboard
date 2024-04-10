<template>
  <q-page padding>
    <q-expansion-item
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      :label="`${isUpdate ? 'Update' : 'Add'} Stopwords Set`"
      header-class="bg-primary text-white"
      v-model="expanded"
    >
      <q-card class="bg-surface column">
        <q-card-section class="q-col-gutter-md row">
          <q-input
            class="col-12 col-sm-6"
            v-model="stopwordsSet.id"
            label="ID"
            filled
            :rules="[(val) => !!val || 'Field is required']"
          />
          <q-input
            filled
            label="Locale"
            v-model="stopwordsSet.locale"
            class="col-12 col-sm-4"
          />
          <q-btn
            type="a"
            icon="sym_s_help"
            no-caps
            color="info"
            flat
            dense
            :href="`https://typesense.org/docs/${$store.state.node.data.debug.version}/api/stopwords.html`"
            target="_blank"
          >
            Documentation
          </q-btn>
          <q-select
            class="col-12"
            filled
            v-model="stopwordsSet.stopwords"
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
        <q-banner inline-actions class="text-white bg-red" v-if="jsonError">
          Invalid Format: {{ jsonError }}
        </q-banner>

        <q-card-actions align="right" class="bg-primary">
          <q-btn
            size="md"
            padding="sm lg"
            unelevated
            color="primary"
            :disable="!!jsonError"
            @click="createStopwordsSet()"
          >{{ isUpdate ? 'Update' : 'Add' }} Set
          </q-btn
          >
        </q-card-actions>
      </q-card>
    </q-expansion-item>

    <q-table
      class="q-mt-md"
      title="Search Presets"
      flat
      bordered
      :filter="filter"
      :rows="$store.state.node.data.stopwords"
      :columns="columns"
      row-key="id"
    >
      <template v-slot:top-left>
        <div class="text-h6">
          <q-icon size="md" name="sym_s_playlist_remove" />
          Stopwords Sets
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
      <template v-slot:body-cell-actions_op="props">
        <q-td class="text-right">
          <q-btn
            flat
            color="primary"
            @click="editStopwordsSet(props.row)"
            icon="sym_s_edit"
            title="Edit"
          ></q-btn>
          <q-btn
            flat
            color="negative"
            @click="deleteStopwordsSet(props.row.id)"
            icon="sym_s_delete_forever"
            title="Delete"
          ></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { StopwordSchema } from 'typesense/lib/Typesense/Stopword';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Stopwords',
  data() {
    return {
      jsonError: null as string | null,
      stopwordsSet: {
        id: 'stopword_set1',
        locale: 'en',
        stopwords: [
          'states', 'united', 'france', 'germany', 'italy'
        ]
      },
      expanded: this.$store.state.node.data.stopwords.length === 0,
      filter: '',
      columns: [
        {
          label: 'ID',
          name: 'id',
          field: 'id',
          sortable: true,
          align: 'left'
        },
        {
          label: 'Locale',
          name: 'locale',
          field: 'locale',
          sortable: true,
          align: 'left'
        },
        {
          label: 'Stopwords',
          name: 'stopwords',
          field: (row: StopwordSchema) => JSON.stringify(row.stopwords),
          sortable: true,
          align: 'left'
        },
        {
          label: 'Actions',
          name: 'actions_op',
          align: 'right'
        }
      ]
    };
  },
  computed: {
    isUpdate(): boolean {
      return this.$store.state.node.data.stopwords
        .map((p: any) => p.id)
        .includes(this.stopwordsSet.id);
    }
  },
  mounted() {
    void this.$store.dispatch('node/getStopwords');
  },
  methods: {
    async createStopwordsSet() {
      await this.$store.dispatch(
        'node/upsertStopwords',
        JSON.parse(JSON.stringify(this.stopwordsSet))
      );
    },
    editStopwordsSet(stopwordsSet: StopwordSchema) {
      this.stopwordsSet = JSON.parse(JSON.stringify(stopwordsSet));
      this.expanded = true;
    },
    deleteStopwordsSet(id: string) {
      this.$q
        .dialog({
          title: 'Confirm',
          message: `Delete stopwords set ${id}?`,
          cancel: true,
          persistent: true
        })
        .onOk(() => {
          void this.$store.dispatch('node/deleteStopwords', id);
        });
    }
  }
});
</script>
