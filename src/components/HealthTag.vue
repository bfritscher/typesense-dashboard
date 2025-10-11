<template>
  <q-chip v-if="health && health.ok" color="positive" text-color="white" dense size="sm">
    Healthy
  </q-chip>
  <q-chip v-else-if="health && !health.ok" color="negative" text-color="white" dense size="sm">
    Unhealthy
  </q-chip>
  <q-chip v-else color="grey-6" text-color="white" dense size="sm">Unknown</q-chip>
  <q-chip v-if="health && health.resource_error" color="warning" text-color="black" dense size="sm">
    {{ health.resource_error }}
  </q-chip>
</template>
<script lang="ts" setup>
import type { Health } from 'src/stores/node';
defineProps<{
  // Allow explicitly passing undefined/null under exactOptionalPropertyTypes
  health?: Health | null | undefined;
}>();
</script>
