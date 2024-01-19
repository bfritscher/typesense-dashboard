<template>
  <q-page padding>
    <collection-create></collection-create>
    <q-table

      :filter="filter"
      :columns="columns"
      :rows="$store.state.node.data.collections"
      row-key="name"
      :pagination="{ rowsPerPage: 0, sortBy: 'name' }"
    >
     <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="name" :props="props">
            <q-btn no-caps flat :to="`/collection/${props.row.name}/search`" size="1.2em" class="text-bold">{{ props.row.name }}</q-btn>
          </q-td>
          <q-td key="actions" :props="props">
            <q-btn flat round icon="sym_s_more_vert">
              <q-menu>
                <q-item dense clickable :to="`/collection/${props.row.name}/document`">
                  <q-item-section>Import</q-item-section>
                  <q-item-section avatar>
                    <q-avatar icon="sym_s_file_upload" />
                  </q-item-section>
                </q-item>
                <q-item dense clickable @click="exportCollection(props.row.name)">
                  <q-item-section>Export</q-item-section>
                  <q-item-section avatar>
                    <q-avatar icon="sym_s_file_download" />
                  </q-item-section>
                </q-item>
                <q-item dense clickable :to="`/collection/${props.row.name}/schema`">
                  <q-item-section>Edit</q-item-section>
                  <q-item-section avatar>
                    <q-avatar icon="sym_s_data_object" />
                  </q-item-section>
                </q-item>
                <q-item dense clickable flat style="color: #DE3B39" @click="drop(props.row.name)">
                  <q-item-section>Delete</q-item-section>
                  <q-item-section avatar>
                    <q-avatar icon="sym_s_delete" />
                  </q-item-section>
                </q-item>
              </q-menu>
            </q-btn>
          </q-td>
          <q-td key="num_documents" :props="props">
            <q-btn no-caps flat :to="`/collection/${props.row.name}/search`">{{ props.row.num_documents }} <q-icon name="sym_s_search"  size="1em" right /></q-btn>
          </q-td>
          <q-td key="schema_fields" :props="props">
            <q-btn no-caps flat :to="`/collection/${props.row.name}/schema`" >{{ props.row.fields.length || 0 }} <q-icon  name="sym_s_data_object" size="1em" right /></q-btn>
          </q-td>
          <q-td key="created_at" :props="props">
            {{
              new Date(props.row.created_at * 1000).toLocaleString()
            }}
          </q-td>
        </q-tr>
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
    </q-table>
  </q-page>
</template>

<script lang="ts">
import CollectionCreate from 'src/components/collection/CollectionCreate.vue';
import { defineComponent } from 'vue';;
export default defineComponent({
  components: { CollectionCreate },
  name: 'Collections',
  data() {
    return {
      filter: '',
      columns: [
        {
          name: 'name',
          required: true,
          label: 'Name',
          field: 'name',
          sortable: true,
        },
        {
          name: 'actions',
          required: false,
          label: 'Actions',
          field: 'actions',
          sortable: false,
        },
        {
          name: 'num_documents',
          required: true,
          label: 'Nb documents',
          field: 'num_documents',
          sortable: true,
        },
        {
          name: 'schema_fields',
          required: true,
          label: 'Schema fields',
          field: 'fields',
          sortable: true,
        },
        {
          name: 'created_at',
          required: true,
          label: 'Created at',
          field: 'created_at',
          sortable: true,
        },
      ],
    };
  },
  mounted() {
    void this.$store.dispatch('node/getCollections');
  },
  methods: {
    async exportCollection(collectionName: string) {
      this.$q.loading.show({
        message: 'Downloading. Please wait...',
        boxClass: 'bg-grey-2 text-grey-9',
        spinnerColor: 'primary',
      });
      await this.$store
        .dispatch('node/exportDocuments', collectionName)
        .then(() => this.$q.loading.hide())
        .catch(() => {
          this.$q.loading.hide();
          this.$q.dialog({
            title: 'Export failed',
            message: 'Try desktop version of the app.',
          });
        });
    },
    drop(name: string) {
      this.$q
        .dialog({
          title: 'Confirm',
          message: `Drop ${name} and all documents?`,
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          void this.$store.dispatch('node/dropCollection', name);
        });
    },
  }
});
</script>
