<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <div class="text-h6">
        <q-icon name="sym_s_query_stats" size="sm" class="q-mr-sm" />
        Analytics Setup
      </div>
    </q-card-section>

    <q-card-section v-if="!store.data.features.analyticsRules">
      <q-banner class="bg-warning text-white rounded-borders">
        <template #avatar>
          <q-icon name="sym_s_warning" color="white" />
        </template>
        Analytics rules are not available. Ensure your Typesense server is started with
        <code>--enable-search-analytics=true</code>.
      </q-banner>
    </q-card-section>

    <q-card-section v-else-if="loading">
      <q-spinner color="primary" size="2em" class="q-mr-sm" />
      Checking analytics setup...
    </q-card-section>

    <q-card-section v-else-if="setupComplete">
      <q-banner class="bg-positive text-white rounded-borders">
        <template #avatar>
          <q-icon name="sym_s_check_circle" color="white" />
        </template>
        Analytics is configured. Both <strong>popular_queries</strong> and
        <strong>nohits_queries</strong> collections exist with active analytics rules.
      </q-banner>

      <div class="q-mt-md">
        <div class="text-subtitle2 q-mb-xs">Existing Analytics Rules:</div>
        <q-list dense bordered separator class="rounded-borders">
          <q-item v-for="rule in existingRules" :key="rule.name">
            <q-item-section>
              <q-item-label>{{ rule.name }}</q-item-label>
              <q-item-label caption>
                Type: {{ rule.type }} | Source: {{ rule.params.source.collections.join(', ') }} |
                Destination: {{ rule.params.destination?.collection }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-card-section>

    <q-card-section v-else>
      <q-banner class="bg-info text-white rounded-borders q-mb-md">
        <template #avatar>
          <q-icon name="sym_s_info" color="white" />
        </template>
        Analytics collections are not fully set up.
        <span v-if="!hasPopularQueries">Missing: <strong>popular_queries</strong> collection. </span>
        <span v-if="!hasNohitsQueries">Missing: <strong>nohits_queries</strong> collection. </span>
        <span v-if="!hasPopularQueriesRule">Missing: popular_queries analytics rule. </span>
        <span v-if="!hasNohitsQueriesRule">Missing: nohits_queries analytics rule. </span>
      </q-banner>

      <div class="q-mb-md">
        <q-select
          v-model="sourceCollection"
          :options="collectionOptions"
          label="Source Collection (searches to track)"
          filled
          hint="Select the collection whose searches should be tracked"
        />
      </div>

      <q-btn
        color="primary"
        unelevated
        label="Set Up Analytics"
        icon="sym_s_rocket_launch"
        :loading="setting"
        :disable="!sourceCollection"
        @click="setupAnalytics"
      />

      <div v-if="setupError" class="q-mt-md">
        <q-banner class="bg-negative text-white rounded-borders">
          {{ setupError }}
        </q-banner>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useNodeStore } from 'src/stores/node';
import { Notify } from 'quasar';
import type { Api } from 'src/shared/api';

const store = useNodeStore();

const loading = ref(true);
const setting = ref(false);
const setupError = ref<string | null>(null);
const sourceCollection = ref<string | null>(null);

const hasPopularQueries = ref(false);
const hasNohitsQueries = ref(false);
const hasPopularQueriesRule = ref(false);
const hasNohitsQueriesRule = ref(false);

const existingRules = computed(() =>
  store.data.analyticsRules.filter(
    (r) => r.type === 'popular_queries' || r.type === 'nohits_queries',
  ),
);

const setupComplete = computed(
  () =>
    hasPopularQueries.value &&
    hasNohitsQueries.value &&
    hasPopularQueriesRule.value &&
    hasNohitsQueriesRule.value,
);

const collectionOptions = computed(() =>
  store.data.collections
    .map((c) => c.name)
    .filter((n) => n !== 'popular_queries' && n !== 'nohits_queries')
    .sort(),
);

async function checkSetup() {
  loading.value = true;
  try {
    const collectionNames = store.data.collections.map((c) => c.name);
    hasPopularQueries.value = collectionNames.includes('popular_queries');
    hasNohitsQueries.value = collectionNames.includes('nohits_queries');

    const rules = store.data.analyticsRules;
    hasPopularQueriesRule.value = rules.some((r) => r.type === 'popular_queries');
    hasNohitsQueriesRule.value = rules.some((r) => r.type === 'nohits_queries');

    // Default source collection
    if (!sourceCollection.value && collectionOptions.value.length > 0) {
      sourceCollection.value = collectionOptions.value[0] ?? null;
    }
  } finally {
    loading.value = false;
  }
}

async function setupAnalytics() {
  if (!sourceCollection.value) return;

  setting.value = true;
  setupError.value = null;
  const api = store.api as Api;

  try {
    // Create popular_queries collection if missing
    if (!hasPopularQueries.value) {
      await api.createCollection({
        name: 'popular_queries',
        fields: [
          { name: 'q', type: 'string' },
          { name: 'count', type: 'int32' },
        ],
      });
    }

    // Create nohits_queries collection if missing
    if (!hasNohitsQueries.value) {
      await api.createCollection({
        name: 'nohits_queries',
        fields: [
          { name: 'q', type: 'string' },
          { name: 'count', type: 'int32' },
        ],
      });
    }

    // Create popular_queries analytics rule if missing
    if (!hasPopularQueriesRule.value) {
      await api.upsertAnalyticsRule('popular_queries_rule', {
        name: 'popular_queries_rule',
        type: 'popular_queries',
        params: {
          source: { collections: [sourceCollection.value] },
          destination: { collection: 'popular_queries' },
          limit: 100,
        },
      });
    }

    // Create nohits_queries analytics rule if missing
    if (!hasNohitsQueriesRule.value) {
      await api.upsertAnalyticsRule('nohits_queries_rule', {
        name: 'nohits_queries_rule',
        type: 'nohits_queries',
        params: {
          source: { collections: [sourceCollection.value] },
          destination: { collection: 'nohits_queries' },
          limit: 100,
        },
      });
    }

    // Refresh store data
    await store.getCollections();
    await store.getAnalyticsRules();
    await checkSetup();

    Notify.create({
      position: 'top',
      progress: true,
      group: false,
      timeout: 2000,
      color: 'positive',
      message: 'Analytics setup completed successfully!',
    });
  } catch (error) {
    setupError.value = (error as Error).message || 'Failed to set up analytics';
  } finally {
    setting.value = false;
  }
}

onMounted(() => {
  void checkSetup();
});
</script>
