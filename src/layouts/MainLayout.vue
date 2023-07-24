<template>
  <q-layout view="hHh Lpr lFf">
    <q-header bordered>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          :icon="leftDrawerOpen ? 'sym_s_menu_open' : 'sym_s_menu'"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Typesense Dashboard
        </q-toolbar-title>

        <q-btn
          padding="xs md"
          flat
          dense
          no-caps
        >
          {{ $store.state.node.loginData?.node.host }}
          <q-icon right name="sym_s_switch_account" />
          <q-menu>
            <server-history v-bind:show-logout="true"></server-history>
          </q-menu>
        </q-btn>
        <q-separator dark vertical spaced inset />
        <q-btn
          @click="$q.dark.toggle()"
          flat
          dense
          :icon="$q.dark.isActive ? 'sym_s_light_mode' : 'sym_s_dark_mode'"
          title="Toggle Dark Mode"
        />
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
import ServerHistory from 'components/ServerHistory.vue';

export default defineComponent({
  name: 'MainLayout',

  components: {
    NavMenu,
    ServerHistory,
  },

  data() {
    return {
      leftDrawerOpen: false,
    };
  },

  computed: {
    loginHistory(): any[] {
      return this.$store.state.node.loginHistory.map(
        (j): any => JSON.parse(j)
      );
    },
    error() {
      return this.$store.state.node.error;
    },
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
    loginWithHistory(h: any): any {
      void this.$store.dispatch('node/login', h);
    },
  },
});
</script>
