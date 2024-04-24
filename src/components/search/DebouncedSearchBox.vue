<template>
  <q-input
    v-model="query"
    @clear="clear"
    dense
    autofocus
    outlined
    type="search"
    clearable
    clear-icon="close"
    placeholder="Search...">
    <template v-slot:prepend>
      <q-icon name="search" />
    </template>
  </q-input>

</template>

<script>

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
    };
  },
  unmounted() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
  },
  methods: {
    clear() {
      this.query = '';
    }
  },
  computed: {
    query: {
      get() {
        return this.localQuery;
      },
      set(val) {
        this.localQuery = val;
        if (this.timerId) {
          clearTimeout(this.timerId);
        }
        this.timerId = setTimeout(() => {
          this.state.refine(this.localQuery);
        }, this.delay);
      },
    },
  },
};
</script>
