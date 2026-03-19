<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">
      <q-icon name="sym_s_bug_report" size="sm" class="q-mr-sm" />
      Query Debugger
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">Inputs</div>
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-4">
            <q-input
              v-model="productNameOrId"
              filled
              dense
              label="Product name or ID"
              hint="The product you want to find in results"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="searchQuery"
              filled
              dense
              label="Search query"
              hint="The query a user would type"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-input
              v-model.number="perPage"
              filled
              dense
              label="Max results"
              type="number"
              hint="How many results to scan"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-btn
              color="primary"
              label="Debug"
              unelevated
              class="full-width"
              style="height: 40px"
              :loading="loading"
              @click="runDebug"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Error -->
    <q-banner v-if="error" class="bg-negative text-white rounded-borders q-mb-md">
      {{ error }}
    </q-banner>

    <!-- Results -->
    <template v-if="debugResult">
      <!-- Product found -->
      <q-card v-if="debugResult.found" flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle1 text-positive q-mb-sm">
            <q-icon name="sym_s_check_circle" class="q-mr-xs" />
            Product Found at Position {{ debugResult.position }}
          </div>

          <!-- Narrative -->
          <q-banner class="bg-blue-1 rounded-borders q-mb-md">
            <div class="text-body2">{{ debugResult.narrative }}</div>
          </q-banner>

          <!-- Score breakdown -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle2 q-mb-sm">Text Match Info</div>
                  <q-list dense separator>
                    <q-item>
                      <q-item-section>
                        <q-item-label>text_match score</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-item-label>{{ debugResult.textMatch }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="debugResult.textMatchInfo">
                      <q-item-section>
                        <q-item-label>Best field match</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-item-label>score: {{ debugResult.textMatchInfo.score }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-for="(field, idx) in debugResult.matchedFields" :key="idx">
                      <q-item-section>
                        <q-item-label>Matched on: {{ field.name }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-badge color="primary" :label="field.matched_tokens?.join(', ') || '-'" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle2 q-mb-sm">Ranking Factors</div>
                  <q-list dense separator>
                    <q-item v-if="debugResult.document.pin_priority !== undefined">
                      <q-item-section>
                        <q-item-label>pin_priority</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-item-label>{{ debugResult.document.pin_priority }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="debugResult.document.is_featured !== undefined">
                      <q-item-section>
                        <q-item-label>is_featured</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-badge
                          :color="debugResult.document.is_featured ? 'positive' : 'grey'"
                          :label="String(debugResult.document.is_featured)"
                        />
                      </q-item-section>
                    </q-item>
                    <q-item v-if="debugResult.document.popularity !== undefined">
                      <q-item-section>
                        <q-item-label>popularity</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-item-label>{{ debugResult.document.popularity }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="debugResult.document.is_available !== undefined">
                      <q-item-section>
                        <q-item-label>is_available</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-badge
                          :color="debugResult.document.is_available ? 'positive' : 'grey'"
                          :label="String(debugResult.document.is_available)"
                        />
                      </q-item-section>
                    </q-item>
                    <q-item v-if="debugResult.document.default_rank !== undefined">
                      <q-item-section>
                        <q-item-label>default_rank</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-item-label>{{ debugResult.document.default_rank }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="debugResult.document.default_rank_with_pin !== undefined">
                      <q-item-section>
                        <q-item-label>default_rank_with_pin</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-item-label>{{ debugResult.document.default_rank_with_pin }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Product not found -->
      <q-card v-else flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle1 text-negative q-mb-sm">
            <q-icon name="sym_s_cancel" class="q-mr-xs" />
            Product Not Found in Top {{ perPage }} Results
          </div>

          <q-banner class="bg-orange-1 rounded-borders q-mb-md">
            <div class="text-body2">{{ debugResult.narrative }}</div>
          </q-banner>

          <div class="text-body2 q-mt-sm">
            <strong>Possible reasons:</strong>
            <ul>
              <li>The product name/ID does not match any document in the collection.</li>
              <li>The product exists but does not match the search query (low text_match score).</li>
              <li>The product is filtered out by active filter_by clauses.</li>
              <li>The product is excluded by an active curation/override rule.</li>
              <li>The product appears beyond position {{ perPage }} -- try increasing "Max results".</li>
            </ul>
          </div>
        </q-card-section>
      </q-card>

      <!-- Active overrides for this query -->
      <q-card v-if="matchingOverrides.length > 0" flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">
            <q-icon name="sym_s_low_priority" class="q-mr-xs" />
            Active Overrides for "{{ searchQuery }}"
          </div>
          <q-list dense separator bordered class="rounded-borders">
            <q-item v-for="ovr in matchingOverrides" :key="ovr.id">
              <q-item-section>
                <q-item-label>
                  <strong>{{ ovr.id }}</strong>
                  -- rule: "{{ ovr.rule.query }}" ({{ ovr.rule.match }})
                </q-item-label>
                <q-item-label caption>
                  <span v-if="ovr.includes && ovr.includes.length">
                    Includes: {{ ovr.includes.length }} pinned
                  </span>
                  <span v-if="ovr.excludes && ovr.excludes.length">
                    &middot; Excludes: {{ ovr.excludes.length }} hidden
                  </span>
                  <span v-if="ovr.filter_by">
                    &middot; filter_by: {{ ovr.filter_by }}
                  </span>
                  <span v-if="ovr.sort_by">
                    &middot; sort_by: {{ ovr.sort_by }}
                  </span>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Raw hit data -->
      <q-expansion-item
        v-if="debugResult.found && debugResult.rawHit"
        label="Raw hit data"
        icon="sym_s_data_object"
        header-class="text-grey-8"
        class="q-mb-md"
      >
        <q-card flat bordered>
          <q-card-section>
            <pre style="overflow-x: auto; font-size: 12px">{{ JSON.stringify(debugResult.rawHit, null, 2) }}</pre>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useNodeStore } from 'src/stores/node';
import type { Api } from 'src/shared/api';
import type { OverrideSchema } from 'typesense/lib/Typesense/Override';

const store = useNodeStore();

const productNameOrId = ref('');
const searchQuery = ref('');
const perPage = ref(100);
const loading = ref(false);
const error = ref<string | null>(null);

interface MatchedField {
  name: string;
  matched_tokens?: string[];
}

interface DebugResultData {
  found: boolean;
  position: number;
  textMatch: string;
  textMatchInfo: any;
  matchedFields: MatchedField[];
  document: Record<string, any>;
  narrative: string;
  rawHit: any;
}

const debugResult = ref<DebugResultData | null>(null);
const matchingOverrides = ref<OverrideSchema[]>([]);

function overrideMatchesQuery(override: OverrideSchema, query: string): boolean {
  if (!override.rule || !override.rule.query) return false;
  const ruleQuery = override.rule.query.toLowerCase();
  const q = query.toLowerCase().trim();

  if (override.rule.match === 'exact') {
    return ruleQuery === q;
  }
  if (override.rule.match === 'contains') {
    return q.includes(ruleQuery);
  }
  return false;
}

async function fetchMatchingOverrides() {
  const collectionName = store.currentCollection?.name;
  if (!collectionName) return;

  try {
    const api = store.api as Api;
    if (!api) return;

    const response = await api.getOverrides(collectionName);
    const overrides: OverrideSchema[] = response?.overrides || [];

    matchingOverrides.value = overrides.filter((ovr) =>
      overrideMatchesQuery(ovr, searchQuery.value),
    );
  } catch {
    matchingOverrides.value = [];
  }
}

function buildNarrative(hit: any, position: number): string {
  const doc = hit.document || {};
  const name = doc.name || doc.title || doc.id || 'Unknown';
  const parts: string[] = [];

  parts.push(`Product "${name}" is at position ${position}`);

  if (hit.text_match !== undefined) {
    parts.push(`text_match score is ${hit.text_match}`);
  }

  // Matched fields from highlights
  if (hit.highlights && hit.highlights.length > 0) {
    const fieldNames = hit.highlights.map((h: any) => `'${h.field}'`).join(', ');
    parts.push(`matched on ${fieldNames}`);
  }

  if (doc.pin_priority !== undefined && doc.pin_priority > 0) {
    const pinBoost = doc.pin_priority * 10_000_000_000;
    parts.push(`it has pin_priority ${doc.pin_priority} (adding ~${pinBoost.toLocaleString()} to rank)`);
  }

  if (doc.is_featured === true) {
    parts.push('is_featured (adding 1B to rank)');
  }

  if (doc.popularity !== undefined) {
    parts.push(`popularity is ${doc.popularity}`);
  }

  if (doc.is_available === false) {
    parts.push('NOTE: product is marked as unavailable (deprioritized in default sort)');
  }

  return parts.join(' because: ').replace('because: because:', 'because:') + '.';
}

function buildNotFoundNarrative(): string {
  const query = searchQuery.value.trim();
  const target = productNameOrId.value.trim();
  return (
    `Product "${target}" was not found in the top ${perPage.value} results for query "${query}". ` +
    'This may be because the product does not match the query terms, is filtered out, ' +
    'is excluded by an override rule, or ranks below position ' +
    perPage.value +
    '.'
  );
}

async function runDebug() {
  const collectionName = store.currentCollection?.name;
  if (!collectionName) {
    error.value = 'No collection selected. Please select a collection first.';
    return;
  }
  if (!productNameOrId.value.trim() || !searchQuery.value.trim()) {
    error.value = 'Please enter both a product name/ID and a search query.';
    return;
  }

  loading.value = true;
  error.value = null;
  debugResult.value = null;
  matchingOverrides.value = [];

  try {
    const api = store.api as Api;
    if (!api) {
      error.value = 'Not connected to Typesense server';
      return;
    }

    const result = await api.search(collectionName, {
      q: searchQuery.value.trim(),
      query_by: 'name',
      per_page: perPage.value,
      sort_by: 'is_available:desc,default_rank_with_pin:desc',
    });

    const hits = result?.hits || [];
    const target = productNameOrId.value.trim().toLowerCase();

    // Find the product by ID or name match
    let foundIndex = -1;
    let foundHit: any = null;

    for (let i = 0; i < hits.length; i++) {
      const doc = (hits[i] as any)?.document || {};
      const docId = String(doc.id || '').toLowerCase();
      const docName = String(doc.name || '').toLowerCase();

      if (docId === target || docName.includes(target)) {
        foundIndex = i;
        foundHit = hits[i];
        break;
      }
    }

    if (foundHit) {
      const matchedFields: MatchedField[] = [];

      // Extract from highlights
      if (foundHit.highlights) {
        for (const h of foundHit.highlights) {
          matchedFields.push({
            name: h.field,
            matched_tokens: h.matched_tokens,
          });
        }
      }

      // Extract from text_match_info if available
      if (Array.isArray(foundHit.text_match_info?.fields_matched)) {
        for (const fm of foundHit.text_match_info.fields_matched) {
          if (!matchedFields.find((mf) => mf.name === fm.field_name)) {
            matchedFields.push({
              name: fm.field_name,
              matched_tokens: fm.matched_tokens,
            });
          }
        }
      }

      debugResult.value = {
        found: true,
        position: foundIndex + 1,
        textMatch: String(foundHit.text_match ?? 'N/A'),
        textMatchInfo: foundHit.text_match_info || null,
        matchedFields,
        document: foundHit.document || {},
        narrative: buildNarrative(foundHit, foundIndex + 1),
        rawHit: foundHit,
      };
    } else {
      debugResult.value = {
        found: false,
        position: -1,
        textMatch: 'N/A',
        textMatchInfo: null,
        matchedFields: [],
        document: {},
        narrative: buildNotFoundNarrative(),
        rawHit: null,
      };
    }

    // Also fetch matching overrides
    await fetchMatchingOverrides();
  } catch (err) {
    error.value = (err as Error).message || 'Debug search failed';
  } finally {
    loading.value = false;
  }
}
</script>
