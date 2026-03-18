<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">
      <q-icon name="sym_s_auto_awesome" size="sm" class="q-mr-sm" />
      Autocomplete Preview
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <q-input
          v-model="inputText"
          filled
          label="Start typing to see autocomplete suggestions..."
          autofocus
          clearable
          @update:model-value="onInput"
        >
          <template #prepend>
            <q-icon name="sym_s_search" />
          </template>
          <template #append>
            <q-spinner v-if="loading" color="primary" size="1.2em" />
          </template>
        </q-input>

        <div class="text-caption text-grey-6 q-mt-xs">
          Source: {{ sourceLabel }}
        </div>
      </q-card-section>
    </q-card>

    <!-- Error -->
    <q-banner v-if="error" class="bg-negative text-white rounded-borders q-mb-md">
      {{ error }}
    </q-banner>

    <!-- Suggestions -->
    <q-card v-if="suggestions.length > 0" flat bordered>
      <q-list separator>
        <q-item v-for="(suggestion, index) in suggestions" :key="index">
          <q-item-section side>
            <q-icon name="sym_s_search" color="grey-5" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ suggestion.text }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge
              v-if="suggestion.count !== undefined"
              color="primary"
              :label="`${suggestion.count} results`"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <div v-if="inputText && !loading && suggestions.length === 0 && hasSearched" class="text-grey-6 q-mt-md">
      No suggestions found for "{{ inputText }}".
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useNodeStore } from 'src/stores/node';
import type { Api } from 'src/shared/api';

const store = useNodeStore();

const inputText = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const hasSearched = ref(false);

interface Suggestion {
  text: string;
  count?: number;
}

const suggestions = ref<Suggestion[]>([]);
const sourceLabel = ref('Waiting for input...');

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function onInput() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  const text = inputText.value?.trim();
  if (!text) {
    suggestions.value = [];
    hasSearched.value = false;
    sourceLabel.value = 'Waiting for input...';
    return;
  }

  debounceTimer = setTimeout(() => {
    void fetchSuggestions(text);
  }, 150);
}

async function fetchSuggestions(prefix: string) {
  loading.value = true;
  error.value = null;
  hasSearched.value = true;

  try {
    const api = store.api as Api;
    if (!api) {
      error.value = 'Not connected to Typesense server';
      return;
    }

    // Try popular_queries collection first
    const collectionNames = store.data.collections.map((c) => c.name);
    const hasPopularQueries = collectionNames.includes('popular_queries');

    if (hasPopularQueries) {
      try {
        const result = await api.search('popular_queries', {
          q: prefix,
          query_by: 'q',
          per_page: 10,
          sort_by: 'count:desc',
        });

        if (result?.hits && result.hits.length > 0) {
          sourceLabel.value = 'popular_queries collection';
          suggestions.value = result.hits.map((hit: any) => ({
            text: hit.document.q as string,
            count: hit.document.count as number,
          }));
          return;
        }
      } catch {
        // Fall through to prefix search
      }
    }

    // Fallback: prefix search on product names in current collection
    const collectionName = store.currentCollection?.name;
    if (!collectionName) {
      sourceLabel.value = 'No collection selected';
      suggestions.value = [];
      return;
    }

    sourceLabel.value = `Prefix search on "${collectionName}" (name field)`;

    const result = await api.search(collectionName, {
      q: prefix,
      query_by: 'name',
      prefix: 'true' as any,
      per_page: 10,
    });

    if (result?.hits) {
      suggestions.value = result.hits.map((hit: any) => ({
        text: (hit.document.name || hit.document.title || hit.document.id) as string,
        count: undefined,
      }));
    } else {
      suggestions.value = [];
    }
  } catch (err) {
    error.value = (err as Error).message || 'Autocomplete search failed';
    suggestions.value = [];
  } finally {
    loading.value = false;
  }
}
</script>
