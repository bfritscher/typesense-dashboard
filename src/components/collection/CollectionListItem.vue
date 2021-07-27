<template>
  <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3">
    <q-card>
      <q-card-section>
        <div class="text-h4">{{ collection.name }}</div>
        <q-list dense>
          <q-item  :to="`/collection/${collection.name}/search`">
            <q-item-section>
              <q-item-label caption> Nb documents </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label>{{ collection.num_documents }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item  :to="`/collection/${collection.name}/schema`">
            <q-item-section>
              <q-item-label caption> Schema fields </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label>{{ collection.fields.length }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label caption> Nb memory shards </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label>{{ collection.num_memory_shards }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label caption> Created at </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label>
                {{
                  new Date(collection.created_at * 1000).toLocaleString()
                }}</q-item-label
              >
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="bg-grey-2">
        <q-btn flat :to="`/collection/${collection.name}/schema`"
          >schema</q-btn
        >
        <q-space />
        <q-btn flat :to="`/collection/${collection.name}/document`"
          >import</q-btn
        >
        <q-btn flat @click="exportCollection()">export</q-btn>
      </q-card-actions>
    </q-card>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Collection',
  props: ['collection'],
  methods: {
    async exportCollection() {
      this.$q.loading.show({
        message: 'Downloading. Please wait...',
        boxClass: 'bg-grey-2 text-grey-9',
        spinnerColor: 'primary',
      });
      await this.$store
        .dispatch('node/exportDocuments', this.collection.name)
        .then(() => this.$q.loading.hide())
        .catch(() => {
          this.$q.loading.hide();
          this.$q.dialog({
            title: 'Export failed',
            message: 'Try desktop version of the app.',
          });
        });
    },
  },
});
</script>
