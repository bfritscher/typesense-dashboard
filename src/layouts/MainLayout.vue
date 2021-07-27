<template>
  <q-layout view="hHh Lpr lFf">
    <q-header bordered>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> Typesense Dashboard</q-toolbar-title>
        <q-btn @click="$q.dark.toggle()" flat dense icon="dark_mode" title="Toggle Dark Mode Test Only"></q-btn>
        <q-btn @click="logout" flat dense>logout</q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      side="left"
      :width="250"
      class="bg-primary text-white"
    >
      <nav-menu></nav-menu>
    </q-drawer>

    <q-page-container>
      <q-banner
        inline-actions
        class="text-white bg-red fixed-top z-max"
        v-if="$store.state.node.error"
      >
        {{ $store.state.node.error }}
        <template v-slot:action>
          <q-btn flat color="white" label="Dismiss" @click="dismiss()" />
        </template>
      </q-banner>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import NavMenu from 'components/NavMenu.vue';

import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MainLayout',

  components: {
    NavMenu,
  },

  data() {
    return {
      leftDrawerOpen: false,
    };
  },

  methods: {
    toggleLeftDrawer() {
      this.leftDrawerOpen = !this.leftDrawerOpen;
    },
    logout() {
      void this.$store.dispatch('node/logout');
    },
    dismiss() {
      void this.$store.commit('node/setError', null);
    },
  },
});
</script>
