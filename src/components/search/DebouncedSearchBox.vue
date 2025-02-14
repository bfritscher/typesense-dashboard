<template>
  <q-input
    v-model="query"
    dense
    autofocus
    outlined
    type="search"
    clearable
    clear-icon="close"
    placeholder="Search..."
    @clear="clear"
  >
    <template #prepend>
      <q-icon name="search" />
    </template>
  </q-input>
</template>

<script lang="ts">
import { connectSearchBox } from 'instantsearch.js/es/connectors';
import { createWidgetMixin } from 'vue-instantsearch/vue3/es';

export default {
  mixins: [createWidgetMixin({ connector: connectSearchBox })],
  props: {
    delay: {
      type: Number,
      default: 200,
      required: false,
    },
  },
  data() {
    return {
      timerId: null,
      localQuery: '',
    } as {
      timerId: any;
      localQuery: string;
    };
  },
  computed: {
    query: {
      get() {
        return this.localQuery;
      },
      set(val: string) {
        this.localQuery = val;
        if (this.timerId) {
          clearTimeout(this.timerId);
        }
        this.timerId = setTimeout(() => {
          // @ts-expect-error mixin js
          this.state.refine(this.localQuery);
        }, this.delay);
      },
    },
  },
  unmounted() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
  },
  methods: {
    clear() {
      this.query = '';
    },
  },
};
</script>
