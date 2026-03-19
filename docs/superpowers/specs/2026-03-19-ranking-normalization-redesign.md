# Product Ranking: Normalization & UX Redesign

## Problem

The current Ranking Formula page produces meaningless scores (e.g., 578,188) because raw field values are multiplied by weights without normalization. A popularity of 9,300 × weight 60 = 558,000 dominates avg_rating of 4.7 × weight 40 = 188 — making weights, boosts, and the entire preview useless for tuning.

## Solution

Normalize ranking factor fields to [0, 1] before applying weights, producing scores on a predictable [0, 1000] scale. Redesign boost rules as priority tiers (1–10) instead of arbitrary point values (0–10,000). Update all labels for Product/Marketing users.

## Architecture

Typesense's `sort_by` is a strict cascade (not additive), max 3 fields:

```
sort_by = primary_sort:dir, _eval([...]):desc, weighted_score:desc
```

- **Layer 1 — Priority Tiers** (boolean): `is_available:desc` → available products always first
- **Layer 2 — Promotion Rules** (`_eval`): creates priority lanes; level 7 always outranks level 3 regardless of score
- **Layer 3 — Weighted Score** (pre-computed `int64`): normalized composite score orders products within each tier

All normalization happens at index time in the stored `weighted_score` field.

## Normalization Engine

### Auto-detection per field

| Condition | Method | Formula | Example |
|-----------|--------|---------|---------|
| `max / (min + 1) > 100` | Log-compressed min-max | `log(1 + val - min) / log(1 + max - min)` | popularity [0, 50000] |
| Otherwise | Linear min-max | `(val - min) / (max - min)` | avg_rating [1.0, 5.0] |
| `min == max` | Zero | `0` | All values identical |

### Weighted score formula

```
weighted_score = round(10 × Σ(normalized_field_i × weight_i))
```

- Weights: user-set per field, 0–100 slider (unchanged)
- Range: [0, 1000] when weights sum to 100
- Stored as `int64` in Typesense
- The `× 10` multiplier spreads the score for integer granularity

### Batch process (2-pass)

1. **Pass 1 — Stats scan**: For each ranking factor field, fetch min and max using `sort_by=field:asc, per_page=1` and `sort_by=field:desc, per_page=1`. Two fast queries per field.
2. **Pass 2 — Score computation**: For each document batch, normalize fields using the stats from Pass 1, compute `weighted_score`, write back via `importDocuments`.

### Preview recomputation

- On collection load (and when a new ranking factor field is added), fetch min/max stats (same 2 queries per field)
- Client-side normalization uses the same formulas
- Recomputes instantly when weights change — no API calls needed
- Preview sorts by: highest matching tier first, then score within tier

## Promotion Rules (formerly Boost Rules)

| Aspect | Before | After |
|--------|--------|-------|
| Slider range | 0–10,000 | 1–10 |
| Slider label | "then boost by" | "Priority level" |
| Step size | 100 | 1 |
| Default for new rule | 1,000 | 5 |
| Mental model | "Add points to score" | "Create priority lanes" |
| Rule description | "Products where Featured is true get +5,000" | "Featured products get priority level 5" |

Promotion rules still generate `_eval` expressions in `sort_by`. The UI change makes the mental model match Typesense's actual cascade behavior.

## Language & Labeling

| Current | Proposed |
|---------|----------|
| "Ranking" (page title) | "Product Ranking" |
| "Sort Order" section | "Priority Tiers" |
| "Primary sort field..." | "Products matching these conditions are always shown first, regardless of score." |
| "Boost Rules" section | "Promotion Rules" |
| "Conditional boosts applied at search time..." | "Automatically promote products that match these conditions. Higher priority = shown first." |
| "then boost by" | "Priority level" |
| "Custom Ranking" section | "What Matters Most" |
| "Numeric fields that influence..." | "Choose which product attributes influence ranking and how much each one matters." |
| "Score Formula" box | "How your score is calculated" |
| `weighted_score = popularity × 60 + avg_rating × 40` | `Score = 60% Popularity + 40% Rating` |
| "Apply to All Products" button | "Recalculate All Scores" |
| "Generated Parameters" expandable | Unchanged (developer escape hatch) |

## Preview Panel

### Layout per product

```
#1  Gelato Flower
    ★ Featured (priority 5)              ← tier badge (amber, only if matched a rule)
    Score: 782 / 1000                    ← normalized weighted_score
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    ← score bar (visual, blue)
    Popularity 56/60 · Rating 34/40      ← contribution per factor
```

### Changes from current preview

| Element | Before | After |
|---------|--------|-------|
| Score display | `578,188` | `782 / 1000` |
| Boost display | `+20,000 boost` (green text) | Tier badge: `★ Featured (priority 5)` (amber) |
| Breakdown | `popularity(9,300×60) + avg_rating(4.7×40)` | `Popularity 56/60 · Rating 34/40` |
| Score bar | None | Horizontal progress bar, blue |
| Sorting | Additive (score + boost) | Group by tier first, then sort by score within tier |

### Breakdown format

`56/60` means: normalized value 0.93 × weight 60 = 56 points out of 60 maximum. Makes each factor's contribution immediately clear.

### Tier badge

- Only shown if the product matched at least one promotion rule
- At most one badge per product (Typesense `_eval` is first-match-wins — only the first matching rule fires)
- Shows rule name + priority level
- Amber colored (consistent with promotion rules section)
- Products with no matching rule: no badge, just score

## Edge Cases & Migration

### Preset migration

Old boost values (0–10,000) → new priority levels (1–10):
```
new_level = Math.min(10, Math.max(1, Math.round(old_boost / 1000)))
```
- 5000 → 5, 2000 → 2, 10000 → 10, 500 → 1
- Converted on load, saved in new format on next "Save Preset"

### Existing weighted_score values

Old scores (hundreds of thousands) are overwritten on next "Recalculate All Scores". No migration needed.

### Normalization edge cases

| Case | Handling |
|------|----------|
| All documents same value for a field | normalized = 0, field contributes nothing |
| Field missing from a document | Treat as 0, normalize normally |
| Only 1 document in collection | All fields normalize to 0 |
| New documents added after scoring | weighted_score = 0 until next recalculation |
| All weight sliders at 0 | weighted_score = 0 for all; disable "Recalculate" button |

### Stale score indicator

Store recalculation timestamp + `num_documents` in the preset. On page load, compare against current `num_documents`. If changed, show info chip (note: document updates without count changes won't trigger this — intentional simplification to avoid full-collection scanning):

> "12 products added since last calculation — scores may be outdated" [Recalculate]

## Files to modify

- `src/pages/RankingFormula.vue` — all changes (normalization engine, UI labels, preview, promotion rules slider)
- No new files needed; no changes to API layer or store

## Research basis

Design informed by analysis of:
- **Algolia**: cascade tie-breaking, precision reduction (log, bucketing) before ingestion
- **Elasticsearch**: `log1p` compression, saturation functions, `factor = (e-1)/max` normalization, decay curves
- **Academic**: log-transform for power-law signals, weighted linear combination of normalized scores on [0,1], percentile ranking
- **Typesense**: sort_by is pure cascade (not additive), _eval is first-match-wins, normalization must live in the data
