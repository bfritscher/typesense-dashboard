<template>
  <div v-if="currentCollection">
    <q-list dense>
      <q-item v-for="field in currentCollection.fields" :key="field.name">
        <q-item-section>
          <q-item-label caption> {{ field.name }} </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label
            class="overflow-hidden text-no-wrap text-ellipsis"
            :title="item[field.name]"
          >
            <div
              v-if="item && Array.isArray(item._highlightResult[field.name])"
            >
              <div
                v-for="(result, index) in item._highlightResult[field.name]"
                v-html="result.value"
                :key="index"
              ></div>
            </div>
            <ais-highlight v-else :attribute="field.name" :hit="item" />
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-separator></q-separator>
      <q-item v-for="field in fieldsNotInSchema" :key="field">
        <q-item-section>
          <q-item-label caption> {{ field }} </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label
            class="overflow-hidden text-no-wrap text-ellipsis"
            :title="item[field]"
          >
            {{ item[field] }}
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label>
            <q-btn
              flat
              size="sm"
              padding="sm"
              color="primary"
              @click="editDocument()"
              icon="edit"
              title="Edit"
            ></q-btn>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label>
            <q-btn
              flat
              size="sm"
              padding="sm"
              @click="deleteDocumentById(item.id)"
              icon="delete_forever"
              title="Delete"
            ></q-btn>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Collection } from 'typesense';

export default defineComponent({
  name: 'SearchResultItem',
  props: {
    item: {
      type: Object,
    },
  },
  computed: {
    currentCollection(): Collection | null {
      return this.$store.state.node.currentCollection;
    },
    fieldsNotInSchema(): string[] {
      if (!this.item || !this.currentCollection) return [];
      return Object.keys(this.item).filter(
        (k) =>
          !k.startsWith('_') &&
          !this.currentCollection?.fields
            .map((f) => f.name)
            .concat(['objectID', 'text_match'])
            .includes(k)
      );
    },
  },
  methods: {
    editDocument() {
      const copyItem: any = {};
      if (!this.item) return;
      Object.keys(this.item).forEach((key) => {
        if (!key.startsWith('_') && !['objectID', 'text_match'].includes(key)) {
          if (!this.item) return;
          copyItem[key] = this.item[key];
        }
      });
      void this.$store.dispatch('node/editDocuments', [
        JSON.parse(JSON.stringify(copyItem)),
      ]);
    },
    deleteDocumentById(id: string) {
      this.$q
        .dialog({
          title: 'Confirm',
          message: `Delete document with id: ${id}?`,
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          void this.$store.dispatch('node/deleteDocumentById', id);
        });
    },
  },
});
</script>
<style>
.text-ellipsis {
  text-overflow: ellipsis;
}
</style>
