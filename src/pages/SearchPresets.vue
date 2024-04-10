<template>
  <q-page padding>
    <q-expansion-item
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      :label="`${isUpdate ? 'Update' : 'Add'} Search Preset`"
      header-class="bg-primary text-white"
      v-model="expanded"
    >
      <q-card style="height: 60vh" class="bg-surface column">
        <q-card-section class="q-col-gutter-md row">
          <q-input
            class="col-12 col-sm-6"
            v-model="preset.name"
            label="Name"
            filled
            :rules="[(val) => !!val || 'Field is required']" />
          <q-btn
            type="a"
            icon="sym_s_help"
            no-caps
            color="info"
            flat
            dense
            :href="`https://typesense.org/docs/${$store.state.node.data.debug.version}/api/search.html#presets`"
            target="_blank"
            >Documentation</q-btn
          >
        </q-card-section>
        <monaco-editor v-model="keyJson"></monaco-editor>
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
            @click="createSearchPreset()"
            >{{ isUpdate ? 'Update' : 'Add' }} Preset</q-btn
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
      :rows="$store.state.node.data.searchPresets"
      :columns="columns"
      row-key="id"
    >
      <template v-slot:top-left>
        <div class="text-h6"><q-icon size="md" name="sym_s_manage_search" /> Search Presets</div>
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
            @click="editSearchPreset(props.row)"
            icon="sym_s_edit"
            title="Edit"
          ></q-btn>
          <q-btn
            flat
            color="negative"
            @click="deleteSearchPreset(props.row.name)"
            icon="sym_s_delete_forever"
            title="Delete"
          ></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { PresetSchema } from 'typesense/lib/Typesense/Preset';
import MonacoEditor from '../components/MonacoEditor.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SearchPresets',
  components: { MonacoEditor },
  data() {
    return {
      jsonError: null as string | null,
      preset: {
        name: '',
        value: {
          'collection': 'products',
          'q': '*',
          'sort_by': 'popularity',
        },
      },
      expanded: this.$store.state.node.data.searchPresets.length === 0,
      filter: '',
      columns: [
        {
          label: 'Name',
          name: 'name',
          field: 'name',
          sortable: true,
          align: 'left',
        },
        {
          label: 'Search Parameters',
          name: 'value',
          field: (row: PresetSchema) => JSON.stringify(row.value),
          sortable: true,
          align: 'left',
        },
        {
          label: 'Actions',
          name: 'actions_op',
          align: 'right',
        },
      ],
    };
  },
  computed: {
    keyJson: {
      get(): string {
        return JSON.stringify(this.preset.value, null, 2);
      },
      set(json: string) {
        try {
          this.preset.value = JSON.parse(json);
          this.jsonError = null;
        } catch (e) {
          this.jsonError = (e as Error).message;
        }
      },
    },
    isUpdate(): boolean {
      return this.$store.state.node.data.searchPresets
        .map((p:any) => p.name)
        .includes(this.preset.name);
    },
  },
  mounted() {
    void this.$store.dispatch('node/getSearchPresets');
  },
  methods: {
    async createSearchPreset() {
      await this.$store.dispatch(
        'node/upsertSearchPreset',
        JSON.parse(JSON.stringify(this.preset))
      );
    },
    editSearchPreset(preset: PresetSchema) {
      this.preset = JSON.parse(JSON.stringify(preset));
      this.expanded = true;
    },
    deleteSearchPreset(name: string) {
      this.$q
        .dialog({
          title: 'Confirm',
          message: `Delete preset ${name}?`,
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          void this.$store.dispatch('node/deleteSearchPreset', name);
        });
    },
  },
});
</script>
