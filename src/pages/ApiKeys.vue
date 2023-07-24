<template>
  <q-page padding>
    <q-expansion-item
      expand-separator
      icon="sym_s_add_circle"
      expand-icon="sym_s_unfold_more"
      expanded-icon="sym_s_unfold_less"
      label="Create API Key"
      header-class="bg-primary text-white"
      v-model="expanded"
    >
      <q-card style="height: 60vh" class="bg-surface column">
        <q-card-section class="q-gutter-md">
          <q-btn flat @click="loadAdminKey()">Admin Key Example</q-btn>
          <q-btn flat @click="loadSearchKey()">Search Key Example</q-btn>
          <q-btn
            type="a"
            icon="sym_s_help"
            no-caps
            color="info"
            flat
            dense
            href="https://typesense.org/docs/0.23.1/api/api-keys.html#create-an-api-key"
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
            @click="createApiKey()"
            >Create API Key</q-btn
          >
        </q-card-actions>
      </q-card>
    </q-expansion-item>

    <q-table
      class="q-mt-md"
      title="API Keys"
      flat
      bordered
      :filter="filter"
      :rows="$store.state.node.data.apiKeys"
      :columns="columns"
      row-key="id"
      :visible-columns="[
        'id',
        'value_prefix',
        'description',
        'actions',
        'collections',
        'expires_at',
        'actions_op',
      ]"
    >
      <template v-slot:top-left>
        <div class="text-h6"><q-icon size="md" name="sym_s_key" /> API Keys</div>
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
            color="negative"
            @click="deleteApiKey(props.row.id)"
            icon="sym_s_delete_forever"
            title="Delete"
          ></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import MonacoEditor from '../components/MonacoEditor.vue';
import { defineComponent } from 'vue';
import { KeyCreateSchema } from 'typesense/lib/Typesense/Key';

const adminKeyExample: KeyCreateSchema = {
  description: 'Admin key.',
  actions: ['*'],
  collections: ['*'],
};

const searchKeyExample: KeyCreateSchema = {
  description: 'Search-only companies key.',
  actions: ['documents:search'],
  collections: ['companies'],
};

export default defineComponent({
  name: 'ApiKeys',
  components: { MonacoEditor },
  data() {
    return {
      jsonError: null as string | null,
      key: JSON.parse(JSON.stringify(adminKeyExample)) as KeyCreateSchema,
      expanded: this.$store.state.node.data.apiKeys.length === 0,
      filter: '',
      columns: [
        {
          label: 'ID',
          name: 'id',
          field: 'id',
          sortable: true,
        },
        {
          label: 'Key prefix',
          name: 'value_prefix',
          field: 'value_prefix',
        },
        {
          label: 'Description',
          name: 'description',
          field: 'description',
          sortable: true,
          align: 'left',
        },
        {
          label: 'Key Actions',
          name: 'actions',
          field: (row: KeyCreateSchema) => JSON.stringify(row.actions),
          sortable: true,
          align: 'left',
        },
        {
          label: 'Collections',
          name: 'collections',
          field: (row: KeyCreateSchema) => JSON.stringify(row.collections),
          sortable: true,
          align: 'left',
        },
        {
          label: 'Expires at',
          name: 'expires_at',
          field: (row: KeyCreateSchema) =>
            row.expires_at
              ? row.expires_at === 64723363199
                ? 'never'
                : new Date(row.expires_at * 1000).toLocaleString()
              : '',
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
        return JSON.stringify(this.key, null, 2);
      },
      set(json: string) {
        try {
          this.key = JSON.parse(json);
          this.jsonError = null;
        } catch (e) {
          this.jsonError = (e as Error).message;
        }
      },
    },
  },
  methods: {
    loadAdminKey() {
      this.key = JSON.parse(JSON.stringify(adminKeyExample));
    },
    loadSearchKey() {
      this.key = JSON.parse(JSON.stringify(searchKeyExample));
    },
    async createApiKey() {
      const key = (await this.$store.dispatch(
        'node/createApiKey',
        JSON.parse(JSON.stringify(this.key))
      )) as KeyCreateSchema;
      this.$q.dialog({
        title: 'Your API key',
        message: `This is your API key copy it! It will not be displayed again!\n\n${
          key.value || ''
        }`,
        cancel: false,
        persistent: true,
      });
    },
    deleteApiKey(id: string) {
      this.$q
        .dialog({
          title: 'Confirm',
          message: `Delete key with id: ${id}?`,
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          void this.$store.dispatch('node/deleteApiKey', id);
        });
    },
  },
});
</script>
