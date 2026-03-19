# Ranking Normalization & UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize ranking scores to [0, 1000], redesign boost rules as priority tiers (1–10), and update all labels for Product/Marketing users.

**Architecture:** All changes are in `src/pages/RankingFormula.vue`. The normalization engine (field stats fetching, auto-detection of log vs linear, normalized score computation) is added to the script section. The template gets updated labels, a redesigned promotion rules slider, and a new preview layout with tier badges and score bars. No new files needed.

**Tech Stack:** Vue 3 + Quasar, TypeScript, Typesense API

**Spec:** `docs/superpowers/specs/2026-03-19-ranking-normalization-redesign.md`

---

### Task 1: Add field stats fetching and normalization functions

**Files:**
- Modify: `src/pages/RankingFormula.vue:458-505` (types and constants area)
- Modify: `src/pages/RankingFormula.vue:766-817` (score computation section)

This task adds the normalization engine: a `FieldStats` type, `fetchFieldStats()` to get min/max per field via two fast Typesense queries, `shouldUseLog()` for auto-detection, and `normalizeValue()` that applies the correct formula. Also updates `computeScore()` to use normalization.

- [ ] **Step 1: Add FieldStats type and reactive state**

After the `SelectOption` interface (~line 500), add:

```typescript
interface FieldStats {
  min: number;
  max: number;
  useLog: boolean;
}

const fieldStats = ref<Record<string, FieldStats>>({});
```

- [ ] **Step 2: Add the fetchFieldStats function**

After the `formatCompact` function (~line 817), add:

```typescript
async function fetchFieldStats(collectionName: string, fields: string[]) {
  const api = store.api as Api;
  const stats: Record<string, FieldStats> = {};

  for (const fieldName of fields) {
    try {
      const [minRes, maxRes] = await Promise.all([
        api.search(collectionName, {
          q: '*', query_by: 'name',
          sort_by: `${fieldName}:asc`, per_page: 1, page: 1,
          include_fields: fieldName,
        } as any),
        api.search(collectionName, {
          q: '*', query_by: 'name',
          sort_by: `${fieldName}:desc`, per_page: 1, page: 1,
          include_fields: fieldName,
        } as any),
      ]);

      const minVal = Number(minRes?.hits?.[0]?.document?.[fieldName] ?? 0);
      const maxVal = Number(maxRes?.hits?.[0]?.document?.[fieldName] ?? 0);
      const useLog = maxVal / (minVal + 1) > 100;

      stats[fieldName] = { min: minVal, max: maxVal, useLog };
    } catch {
      stats[fieldName] = { min: 0, max: 0, useLog: false };
    }
  }

  fieldStats.value = { ...fieldStats.value, ...stats };
}
```

- [ ] **Step 3: Add normalizeValue function**

Directly after `fetchFieldStats`:

```typescript
function normalizeValue(value: number, stats: FieldStats): number {
  if (stats.min === stats.max) return 0;
  if (stats.useLog) {
    return Math.log(1 + value - stats.min) / Math.log(1 + stats.max - stats.min);
  }
  return (value - stats.min) / (stats.max - stats.min);
}
```

- [ ] **Step 4: Update computeScore to use normalization**

Replace the existing `computeScore` function (lines 768-778) with:

```typescript
function computeScore(doc: Record<string, unknown>): { score: number; breakdown: string[] } {
  let score = 0;
  const breakdown: string[] = [];
  for (const f of activeFactors.value) {
    const raw = Number(doc[f.field] ?? 0);
    const stats = fieldStats.value[f.field];
    const normalized = stats ? normalizeValue(raw, stats) : 0;
    const contribution = Math.round(normalized * f.weight);
    score += contribution;
    breakdown.push(`${friendlyFactorLabel(f.field)} ${contribution}/${f.weight}`);
  }
  return { score: Math.round(score * 10), breakdown };
}
```

Note: `score * 10` maps to [0, 1000] range when weights sum to 100.

- [ ] **Step 5: Verify lint and type-check pass**

Run: `cd /Users/renatobeltrao/Projects/typesense-dashboard && npx quasar lint && npx vue-tsc --build`

- [ ] **Step 6: Commit**

```bash
git add src/pages/RankingFormula.vue
git commit -m "feat(ranking): add field stats fetching and normalized score computation

Normalize each ranking factor to [0,1] using auto-detected log or linear
min-max normalization, producing weighted_score in [0,1000] range."
```

---

### Task 2: Wire stats fetching into collection change and ranking factor add/remove

**Files:**
- Modify: `src/pages/RankingFormula.vue:833-884` (onCollectionChange function)
- Modify: `src/pages/RankingFormula.vue:722-735` (addRankingFactor / removeRankingFactor)

Stats must be fetched when a collection is selected and when ranking factors change.

- [ ] **Step 1: Add stats fetching to onCollectionChange**

In `onCollectionChange`, after the line `void fetchPreview();` (line 883), add stats fetching. Replace:

```typescript
  void fetchPreview();
```

with:

```typescript
  const factorFields = rankingFactors.map((f) => f.field);
  if (factorFields.length > 0) {
    await fetchFieldStats(name, factorFields);
  }
  void fetchPreview();
```

- [ ] **Step 2: Re-fetch stats when a ranking factor is added**

Update `addRankingFactor` to fetch stats for the new field. Replace the existing function:

```typescript
function addRankingFactor() {
  if (!factorToAdd.value) return;
  rankingFactors.push({
    id: `f${++factorIdSeq}`,
    field: factorToAdd.value.value,
    label: factorToAdd.value.label,
    weight: 50,
  });
  const newField = factorToAdd.value.value;
  factorToAdd.value = null;
  if (selectedCollection.value) {
    void fetchFieldStats(selectedCollection.value, [newField]).then(() => recomputePreview());
  }
}
```

Note: `fetchFieldStats` already merges into existing stats (uses spread operator), so adding a single new field preserves previously fetched stats.

- [ ] **Step 3: Clean up stats when a ranking factor is removed**

Update `removeRankingFactor`:

```typescript
function removeRankingFactor(idx: number) {
  const removed = rankingFactors[idx];
  rankingFactors.splice(idx, 1);
  if (removed) {
    const { [removed.field]: _, ...rest } = fieldStats.value;
    fieldStats.value = rest;
  }
}
```

- [ ] **Step 4: Clear fieldStats on collection change reset**

In `onCollectionChange`, after `schemaFields.value = [];` (line 837), add:

```typescript
  fieldStats.value = {};
```

- [ ] **Step 5: Verify lint and type-check pass**

Run: `cd /Users/renatobeltrao/Projects/typesense-dashboard && npx quasar lint && npx vue-tsc --build`

- [ ] **Step 6: Commit**

```bash
git add src/pages/RankingFormula.vue
git commit -m "feat(ranking): wire field stats into collection load and factor changes

Fetch min/max stats on collection change and when adding new ranking
factors. Clean up stats when factors are removed."
```

---

### Task 3: Update batch process to use 2-pass normalization

**Files:**
- Modify: `src/pages/RankingFormula.vue:1066-1152` (runBatchUpdate function)

The batch update must first scan min/max (Pass 1), then compute normalized scores (Pass 2).

- [ ] **Step 1: Add stats scan pass to runBatchUpdate**

In `runBatchUpdate`, after the `weighted_score` field creation block (after line 1099, before the count query), add Pass 1:

```typescript
    // Pass 1: Fetch min/max stats for all ranking factor fields
    const factorFields = activeFactors.value.map((f) => f.field);
    await fetchFieldStats(collectionName, factorFields);
```

- [ ] **Step 2: Update the score computation in the batch loop**

The `computeScore` function (updated in Task 1) already uses `fieldStats.value`, so the batch loop's existing call to `computeScore(doc)` at line 1128 will now automatically use normalized values. No change needed to the loop itself.

- [ ] **Step 3: Store recalculation metadata in savePreset**

Update the `savePreset` function's `presetValue` object to include staleness tracking. In `savePreset`, add to the `presetValue` object:

```typescript
    const presetValue = {
      sort_by: generatedSortBy.value,
      sort_entries: sortEntries.map((e) => ({ name: e.name, label: e.label, direction: e.direction })),
      boost_rules: boostRules.map((r) => ({ field: r.field, condition: r.condition, value: r.value, boost: r.boost })),
      ranking_factors: rankingFactors.map((f) => ({ field: f.field, label: f.label, weight: f.weight })),
      last_recalc_at: Date.now(),
      last_recalc_num_docs: lastRecalcNumDocs.value,
    };
```

Add the state variable near the other preset state (after `presetNote`):

```typescript
const lastRecalcNumDocs = ref(0);
```

At the end of `runBatchUpdate`, before the `finally` block, add:

```typescript
    lastRecalcNumDocs.value = totalDocs;
```

- [ ] **Step 4: Verify lint and type-check pass**

Run: `cd /Users/renatobeltrao/Projects/typesense-dashboard && npx quasar lint && npx vue-tsc --build`

- [ ] **Step 5: Commit**

```bash
git add src/pages/RankingFormula.vue
git commit -m "feat(ranking): 2-pass batch with stats scan before score computation

Pass 1 fetches min/max per field, Pass 2 computes normalized scores.
Store recalculation metadata for staleness detection."
```

---

### Task 4: Redesign promotion rules (boost → priority tiers)

**Files:**
- Modify: `src/pages/RankingFormula.vue:94-180` (boost rules template)
- Modify: `src/pages/RankingFormula.vue:560-693` (boost rules script)

Change slider from 0–10,000 to 1–10, update labels, update rule descriptions, migrate old presets.

- [ ] **Step 1: Update boost slider in template**

Replace the boost slider + input section (lines 145-166):

```html
                  <div class="row items-center q-gutter-sm">
                    <span class="text-grey-7 text-weight-medium">Priority level</span>
                    <q-slider
                      v-model="rule.boost"
                      :min="1"
                      :max="10"
                      :step="1"
                      label
                      :label-value="rule.boost"
                      style="min-width: 160px; max-width: 200px"
                      class="col-auto"
                      color="amber-8"
                    />
                    <q-input
                      v-model.number="rule.boost"
                      type="number"
                      dense
                      outlined
                      style="width: 60px"
                      class="col-auto"
                      :rules="[(v: number) => (v >= 1 && v <= 10) || '1-10']"
                    />
                  </div>
```

- [ ] **Step 2: Update section header labels in template**

Replace "Boost Rules" header (lines 96-102):

```html
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold">Promotion Rules</div>
              <div class="text-caption text-grey-7">
                Automatically promote products that match these conditions.
                Higher priority = shown first.
              </div>
            </q-card-section>
```

- [ ] **Step 3: Update ruleDescription function**

Replace the `ruleDescription` function:

```typescript
function ruleDescription(rule: BoostRule): string {
  const fieldLabel = friendlyFactorLabel(rule.field);
  switch (rule.condition) {
    case 'is_true': return `${fieldLabel} products get priority level ${rule.boost}`;
    case 'is_false': return `Non-${fieldLabel.toLowerCase()} products get priority level ${rule.boost}`;
    case 'newer_than_days': return `Products added in the last ${rule.value} days get priority level ${rule.boost}`;
    case 'older_than_days': return `Products older than ${rule.value} days get priority level ${rule.boost}`;
    case 'above': return `Products where ${fieldLabel} > ${rule.value} get priority level ${rule.boost}`;
    case 'below': return `Products where ${fieldLabel} < ${rule.value} get priority level ${rule.boost}`;
    case 'equals': return `Products where ${fieldLabel} = ${rule.value} get priority level ${rule.boost}`;
    default: return '';
  }
}
```

- [ ] **Step 4: Update addBoostRule default boost from 1000 to 5**

Replace in `addBoostRule`:

```typescript
    boost: 1000,
```

with:

```typescript
    boost: 5,
```

- [ ] **Step 5: Update default boost values for preset defaults**

In `onCollectionChange`, replace the default boost rule values:

```typescript
      boostRules.push({ id: `r${++ruleIdSeq}`, field: 'is_featured', condition: 'is_true', value: '', boost: 5000 });
```
becomes:
```typescript
      boostRules.push({ id: `r${++ruleIdSeq}`, field: 'is_featured', condition: 'is_true', value: '', boost: 7 });
```

```typescript
      boostRules.push({ id: `r${++ruleIdSeq}`, field: 'created_at', condition: 'newer_than_days', value: '30', boost: 2000 });
```
becomes:
```typescript
      boostRules.push({ id: `r${++ruleIdSeq}`, field: 'created_at', condition: 'newer_than_days', value: '30', boost: 3 });
```

- [ ] **Step 6: Add preset migration for old boost values**

In `loadExistingPreset`, update the boost loading to migrate old values. Replace:

```typescript
          boost: Number(r.boost ?? 1000),
```

with:

```typescript
          boost: migrateBoostValue(Number(r.boost ?? 5)),
```

Add the migration function near `loadExistingPreset`:

```typescript
function migrateBoostValue(boost: number): number {
  if (boost <= 10) return boost; // already new format
  return Math.min(10, Math.max(1, Math.round(boost / 1000)));
}
```

- [ ] **Step 7: Verify lint and type-check pass**

Run: `cd /Users/renatobeltrao/Projects/typesense-dashboard && npx quasar lint && npx vue-tsc --build`

- [ ] **Step 8: Commit**

```bash
git add src/pages/RankingFormula.vue
git commit -m "feat(ranking): redesign boost rules as priority tiers 1-10

Replace 0-10,000 slider with 1-10 priority levels. Update labels from
'boost by' to 'priority level'. Migrate old preset values automatically."
```

---

### Task 5: Update preview panel with tier badges, score bars, and normalized display

**Files:**
- Modify: `src/pages/RankingFormula.vue:384-415` (preview list template)
- Modify: `src/pages/RankingFormula.vue:486-494` (PreviewProduct interface)
- Modify: `src/pages/RankingFormula.vue:1002-1030` (recomputePreview function)

- [ ] **Step 1: Update PreviewProduct interface**

Replace:

```typescript
interface PreviewProduct {
  id: string;
  title: string;
  score: number;
  boostScore: number;
  breakdown: string[];
}
```

with:

```typescript
interface PreviewProduct {
  id: string;
  title: string;
  score: number;
  tierLevel: number;
  tierLabel: string;
  breakdown: string[];
}
```

- [ ] **Step 2: Update computeBoostScore to return tier info**

Replace `computeBoostScore`:

```typescript
function computeBoostTier(doc: Record<string, unknown>): { level: number; label: string } {
  for (const rule of activeBoostRules.value) {
    if (ruleMatches(rule, doc)) {
      return { level: rule.boost, label: friendlyFactorLabel(rule.field) };
    }
  }
  return { level: 0, label: '' };
}
```

This matches Typesense's first-match-wins behavior.

- [ ] **Step 3: Update recomputePreview to use tier-based sorting**

Replace `recomputePreview`:

```typescript
function recomputePreview() {
  if (rawDocs.length === 0) { previewProducts.value = []; return; }

  const maxScore = activeFactors.value.reduce((sum, f) => sum + f.weight, 0) * 10;

  const scored = rawDocs.map((doc) => {
    const { score, breakdown } = computeScore(doc);
    const tier = computeBoostTier(doc);
    return {
      id: typeof doc.id === 'string' ? doc.id : JSON.stringify(doc.id ?? ''),
      title: typeof doc.name === 'string' ? doc.name : typeof doc.title === 'string' ? doc.title : JSON.stringify(doc.id ?? 'Untitled'),
      score: Math.min(score, maxScore),
      tierLevel: tier.level,
      tierLabel: tier.label,
      breakdown,
      doc,
    };
  });

  // Sort: Layer 1 (bool tiers), Layer 2 (promotion tier), Layer 3 (score)
  const sortKeys = sortEntries.map((e) => e.name);
  scored.sort((a, b) => {
    for (const key of sortKeys) {
      const av = a.doc[key] ? 1 : 0;
      const bv = b.doc[key] ? 1 : 0;
      const dir = sortEntries.find((e) => e.name === key)?.direction === 'asc' ? 1 : -1;
      if (av !== bv) return (bv - av) * dir;
    }
    if (a.tierLevel !== b.tierLevel) return b.tierLevel - a.tierLevel;
    return b.score - a.score;
  });

  previewProducts.value = scored.slice(0, 20);
}
```

- [ ] **Step 4: Update preview template**

Replace the preview list item template (lines 386-413):

```html
              <q-item v-for="(p, idx) in previewProducts" :key="p.id" dense class="q-py-sm">
                <q-item-section side class="q-pr-sm">
                  <q-avatar
                    :color="idx < 3 ? 'amber' : 'grey-4'"
                    :text-color="idx < 3 ? 'white' : 'grey-8'"
                    size="28px"
                    font-size="0.7rem"
                  >
                    {{ idx + 1 }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium ellipsis" style="font-size: 0.85rem">
                    {{ p.title }}
                  </q-item-label>
                  <q-item-label v-if="p.tierLevel > 0" caption>
                    <q-badge color="amber-8" text-color="white" class="q-mr-xs">
                      ★ {{ p.tierLabel }} (priority {{ p.tierLevel }})
                    </q-badge>
                  </q-item-label>
                  <q-item-label caption>
                    <span class="text-primary text-weight-bold">Score: {{ p.score }} / {{ maxPossibleScore }}</span>
                  </q-item-label>
                  <q-linear-progress
                    :value="maxPossibleScore > 0 ? p.score / maxPossibleScore : 0"
                    size="6px"
                    color="primary"
                    track-color="grey-3"
                    rounded
                    class="q-my-xs"
                    style="max-width: 200px"
                  />
                  <q-item-label caption>
                    <span class="text-grey-6" style="font-size: 0.7rem">
                      <template v-for="(part, i) in p.breakdown" :key="i">
                        <span v-if="i > 0"> · </span>{{ part }}
                      </template>
                    </span>
                  </q-item-label>
                </q-item-section>
              </q-item>
```

- [ ] **Step 5: Add maxPossibleScore computed**

Add after `activeFactors`:

```typescript
const maxPossibleScore = computed(() => activeFactors.value.reduce((sum, f) => sum + f.weight, 0) * 10);
```

- [ ] **Step 6: Verify lint and type-check pass**

Run: `cd /Users/renatobeltrao/Projects/typesense-dashboard && npx quasar lint && npx vue-tsc --build`

- [ ] **Step 7: Commit**

```bash
git add src/pages/RankingFormula.vue
git commit -m "feat(ranking): redesign preview with tier badges, score bars, normalized display

Show priority tier badges (amber), score out of max with progress bar,
and per-factor breakdown as 'Popularity 56/60 · Rating 34/40'."
```

---

### Task 6: Update all section labels and formula display

**Files:**
- Modify: `src/pages/RankingFormula.vue:1-450` (template section)

- [ ] **Step 1: Update page title**

Replace line 9:
```html
            <div class="text-h6">Ranking</div>
```
with:
```html
            <div class="text-h6">Product Ranking</div>
```

Replace line 10-12:
```html
            <div class="text-caption text-grey-7 q-mt-xs">
              Define how products are ordered. Drag to reorder priority.
            </div>
```
with:
```html
            <div class="text-caption text-grey-7 q-mt-xs">
              Configure how products are ranked in search results.
            </div>
```

- [ ] **Step 2: Update Sort Order → Priority Tiers**

Replace lines 32-35:
```html
              <div class="text-subtitle1 text-weight-bold">Sort Order</div>
              <div class="text-caption text-grey-7">
                Primary sort field. Products matching this are always ranked first.
              </div>
```
with:
```html
              <div class="text-subtitle1 text-weight-bold">Priority Tiers</div>
              <div class="text-caption text-grey-7">
                Products matching these conditions are always shown first, regardless of score.
              </div>
```

- [ ] **Step 3: Update Custom Ranking → What Matters Most**

Replace lines 185-191:
```html
              <div class="text-subtitle1 text-weight-bold">Custom Ranking</div>
              <div class="text-caption text-grey-7">
                Numeric fields that influence product ranking. Higher weight
                means stronger influence on the final score.
                Requires "Apply" to take effect.
              </div>
```
with:
```html
              <div class="text-subtitle1 text-weight-bold">What Matters Most</div>
              <div class="text-caption text-grey-7">
                Choose which product attributes influence ranking and how much each one matters.
                Requires "Recalculate" to take effect.
              </div>
```

- [ ] **Step 4: Update Score Formula display**

Replace lines 277-286:
```html
              <div class="text-subtitle2 text-grey-8 q-mb-sm">Score Formula</div>
              <div class="q-pa-sm bg-grey-2 rounded-borders formula-box">
                <span class="text-weight-bold">weighted_score</span> =
                <template v-for="(factor, idx) in activeFactors" :key="factor.id">
                  <span v-if="idx > 0" class="text-grey-6"> + </span>
                  <span>{{ factor.field }}</span>
                  <span class="text-grey-6"> &times; </span>
                  <span class="text-weight-bold text-primary">{{ factor.weight }}</span>
                </template>
              </div>
```
with:
```html
              <div class="text-subtitle2 text-grey-8 q-mb-sm">How your score is calculated</div>
              <div class="q-pa-sm bg-grey-2 rounded-borders formula-box">
                <span class="text-weight-bold">Score</span> =
                <template v-for="(factor, idx) in activeFactors" :key="factor.id">
                  <span v-if="idx > 0" class="text-grey-6"> + </span>
                  <span class="text-weight-bold text-primary">{{ factorPercent(factor) }}%</span>
                  <span class="q-ml-xs">{{ factor.label }}</span>
                </template>
              </div>
```

Add the helper in script:

```typescript
function factorPercent(factor: RankingFactor): number {
  const total = activeFactors.value.reduce((sum, f) => sum + f.weight, 0);
  return total > 0 ? Math.round((factor.weight / total) * 100) : 0;
}
```

- [ ] **Step 5: Update "Apply to All Products" button label**

Replace line 306:
```html
                  label="Apply to All Products"
```
with:
```html
                  label="Recalculate All Scores"
```

- [ ] **Step 6: Update confirm dialog text**

Replace lines 428-429:
```html
          <div class="text-h6">Apply Ranking Formula</div>
```
with:
```html
          <div class="text-h6">Recalculate All Scores</div>
```

Replace lines 431-432:
```html
          This will recalculate <strong>weighted_score</strong> for every product
          in <strong>{{ selectedCollection }}</strong>.
```
with:
```html
          This will recalculate the ranking score for every product
          in <strong>{{ selectedCollection }}</strong>.
```

Replace the formula box in the dialog (lines 433-438):
```html
          <div class="q-mt-sm formula-box q-pa-sm bg-grey-2 rounded-borders">
            <template v-for="(factor, idx) in activeFactors" :key="factor.id">
              <span v-if="idx > 0"> + </span>
              {{ factor.field }} &times; {{ factor.weight }}
            </template>
          </div>
```
with:
```html
          <div class="q-mt-sm formula-box q-pa-sm bg-grey-2 rounded-borders">
            <template v-for="(factor, idx) in activeFactors" :key="factor.id">
              <span v-if="idx > 0"> + </span>
              {{ factorPercent(factor) }}% {{ factor.label }}
            </template>
          </div>
```

Replace the boost rules note (lines 439-441):
```html
          <p v-if="activeBoostRules.length > 0" class="q-mt-sm q-mb-none">
            Boost rules ({{ activeBoostRules.length }}) are applied at search time and don't need batch processing.
          </p>
```
with:
```html
          <p v-if="activeBoostRules.length > 0" class="q-mt-sm q-mb-none">
            Promotion rules ({{ activeBoostRules.length }}) are applied at search time and don't need recalculation.
          </p>
```

- [ ] **Step 7: Update preview header**

Replace lines 364-367:
```html
            <div class="text-h6">Preview</div>
            <div class="text-caption text-grey-7">
              Simulated ranking with current settings.
            </div>
```
with:
```html
            <div class="text-h6">Preview</div>
            <div class="text-caption text-grey-7">
              Live ranking simulation with your current settings.
            </div>
```

- [ ] **Step 8: Verify lint and type-check pass**

Run: `cd /Users/renatobeltrao/Projects/typesense-dashboard && npx quasar lint && npx vue-tsc --build`

- [ ] **Step 9: Commit**

```bash
git add src/pages/RankingFormula.vue
git commit -m "feat(ranking): update all labels for Product/Marketing users

Rename sections: Sort Order → Priority Tiers, Boost Rules → Promotion Rules,
Custom Ranking → What Matters Most. Show formula as percentages.
Apply to All Products → Recalculate All Scores."
```

---

### Task 7: Add stale score indicator

**Files:**
- Modify: `src/pages/RankingFormula.vue` (template + script)

- [ ] **Step 1: Load staleness metadata from preset**

In `loadExistingPreset`, after loading ranking factors, add:

```typescript
    if (val.last_recalc_num_docs != null) {
      lastRecalcNumDocs.value = Number(val.last_recalc_num_docs);
    }
```

- [ ] **Step 2: Add stale score detection**

Add after `lastRecalcNumDocs`:

```typescript
const staleScoreCount = ref(0);

async function checkStaleScores() {
  if (!selectedCollection.value || lastRecalcNumDocs.value === 0) {
    staleScoreCount.value = 0;
    return;
  }
  try {
    const api = store.api as Api;
    const result = await api.search(selectedCollection.value, {
      q: '*', query_by: 'name', per_page: 0, page: 1,
    } as any);
    const currentCount = result?.found ?? 0;
    const diff = currentCount - lastRecalcNumDocs.value;
    staleScoreCount.value = diff > 0 ? diff : 0;
  } catch {
    staleScoreCount.value = 0;
  }
}
```

- [ ] **Step 3: Call checkStaleScores on collection load**

In `onCollectionChange`, after `await loadExistingPreset();`, add:

```typescript
  await checkStaleScores();
```

- [ ] **Step 4: Reset stale count after batch completes**

At the end of `runBatchUpdate`, in the `finally` block, add:

```typescript
    staleScoreCount.value = 0;
```

- [ ] **Step 5: Add stale banner to template**

After the `presetNote` banner (line 317), add:

```html
            <q-banner v-if="staleScoreCount > 0" class="bg-amber-1 text-amber-9 q-mx-md q-mb-md" rounded>
              <template #avatar><q-icon name="sym_s_warning" color="amber-8" /></template>
              {{ staleScoreCount }} products added since last calculation — scores may be outdated.
              <template #action>
                <q-btn flat color="amber-9" label="Recalculate" @click="confirmApply" />
              </template>
            </q-banner>
```

- [ ] **Step 6: Verify lint and type-check pass**

Run: `cd /Users/renatobeltrao/Projects/typesense-dashboard && npx quasar lint && npx vue-tsc --build`

- [ ] **Step 7: Commit**

```bash
git add src/pages/RankingFormula.vue
git commit -m "feat(ranking): add stale score indicator when new products detected

Show amber banner when num_documents increased since last recalculation,
with shortcut to trigger recalculation."
```

---

### Task 8: Final verification and cleanup

**Files:**
- Modify: `src/pages/RankingFormula.vue` (if needed)

- [ ] **Step 1: Run full lint and type-check**

Run: `cd /Users/renatobeltrao/Projects/typesense-dashboard && npm run lint && npm run type-check`

Fix any issues found.

- [ ] **Step 2: Run dev server and visually verify**

Run: `cd /Users/renatobeltrao/Projects/typesense-dashboard && npx quasar dev`

Check:
- Page title says "Product Ranking"
- Sections labeled "Priority Tiers", "Promotion Rules", "What Matters Most"
- Promotion rule slider goes 1–10
- Preview shows "Score: X / 1000" with progress bar
- Tier badges appear for products matching promotion rules
- Formula shows percentages: "Score = 60% Popularity + 40% Rating"
- "Recalculate All Scores" button works

- [ ] **Step 3: Commit any final fixes**

```bash
git add src/pages/RankingFormula.vue
git commit -m "fix(ranking): address lint/type-check issues from redesign"
```
