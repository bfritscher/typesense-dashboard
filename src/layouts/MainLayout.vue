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

        <q-toolbar-title> Typesense Dashboard </q-toolbar-title>

        <q-btn padding="xs md" flat dense no-caps>
          {{ store.loginData?.node.host }}
          <q-icon right name="sym_s_switch_account" />
          <q-menu>
            <server-history :show-logout="true"></server-history>
          </q-menu>
        </q-btn>
        <q-separator dark vertical spaced inset />
        <q-btn
          flat
          dense
          :icon="$q.dark.isActive ? 'sym_s_light_mode' : 'sym_s_dark_mode'"
          title="Toggle Dark Mode"
          @click="$q.dark.toggle()"
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
      <q-banner v-if="store.error" inline-actions class="text-white bg-red fixed-top z-max">
        {{ store.error }}
        <template #action>
          <q-btn flat color="white" label="Dismiss" @click="dismiss()" />
        </template>
      </q-banner>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import NavMenu from 'components/NavMenu.vue';
import ServerHistory from 'components/ServerHistory.vue';
import { useNodeStore } from 'src/stores/node';
import { ref } from 'vue';

const store = useNodeStore();
const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function dismiss() {
  store.setError(null);
}
</script>
