---
title: TypeSense Operator Dashboard - Behavior & Logic
connie-publish: true
---

# TypeSense Operator Dashboard - Behavior & Logic

> ⚠️ **Generated from Git (MARKETPLACE-DOCS). Do not edit in Confluence. Propose changes via PR.**

## Overview

A custom operator dashboard for the Dransay healthcare marketplace, extending the [typesense-dashboard](https://github.com/bfritscher/typesense-dashboard) open-source project (Vue 3, Quasar, Pinia, Monaco Editor). The dashboard connects directly to TypeSense — no backend dependency. It serves merchandising teams (product positioning, promotions, search tuning) and engineering teams (cluster ops, schema management, search debugging).

The existing dashboard provides: cluster operations, alias management, API key management, collection schema viewer/editor, document import/export, login/connection management, server history, dark mode, and feature detection. This spec covers **new and enhanced** capabilities only.

### Architecture Constraints

- **TypeSense-only**: all data reads/writes go through the TypeSense API directly. No backend dependency.
- **Client-side rank recalculation**: when merchandising fields change, `default_rank` and `default_rank_with_pin` are recalculated in the browser before writing back.
- **Sync pipeline coexistence**: a `merchandising_source` field (`"dashboard"` or `null`) prevents the existing PostgreSQL → TypeSense sync pipeline from overwriting dashboard-managed merchandising fields. The sync pipeline must be modified separately (out of scope for the dashboard itself).
- **CORS**: requires `--enable-cors` on the TypeSense server.
- **Analytics prerequisite**: analytics features require `--enable-search-analytics=true` on the TypeSense server.

### Existing Codebase Structure (Key Files)

| Area | File | Purpose |
|------|------|---------|
| Router | `src/router/routes.ts` | Route definitions — new pages added here |
| Store | `src/stores/node.ts` | Pinia store — `useNodeStore` with 100+ actions |
| API | `src/shared/api.ts` | TypeSense client wrapper (`Api` class) |
| Layout | `src/layouts/MainLayout.vue` | App shell — header, drawer, page container |
| Nav | `src/components/NavMenu.vue` | Feature-gated navigation menu |
| Search | `src/components/search/SearchInstantSearch.vue` | InstantSearch integration |
| Pages | `src/pages/*.vue` | One component per page |

### Navigation Structure (Target)

```
Marketplace Dashboard
├── Home (Server Status)               [existing, keep]
├── Cluster Status                      [existing, keep]
├── Merchandising                       [NEW section]
│   ├── Product Positioning             [NEW page]
│   └── Vendor Controls                 [NEW page]
├── Search                              [ENHANCED section]
│   ├── Preview (Customer Eye)          [NEW page]
│   ├── Query Debugger                  [NEW page]
│   └── Autocomplete Preview            [NEW page]
├── Relevance                           [NEW section]
│   ├── Ranking Formula                 [NEW page]
│   └── Search Weights                  [NEW page]
├── Curations                           [ENHANCED section]
│   ├── Overrides (Visual Editor)       [ENHANCED page]
│   ├── Synonyms                        [ENHANCED page]
│   └── Stopwords                       [existing, minor changes]
├── Analytics                           [NEW section]
│   ├── Popular Queries                 [NEW page]
│   ├── No-Results Queries              [NEW page]
│   ├── Search Health KPIs              [NEW page]
│   └── Analytics Rules                 [existing, keep]
├── Collections                         [existing, keep]
├── Documents                           [existing, keep]
├── Presets                             [existing, keep]
├── Aliases                             [existing, keep]
├── API Keys                            [existing, keep]
└── Settings                            [existing, keep]
```

### Key Entities

- **Product Document**: A TypeSense document in the `products` collection. Key merchandising fields: `is_featured` (bool), `featured_rank` (int32), `is_promoted` (bool), `is_exclusive` (bool), `pin_priority` (int32: 0/1/2), `default_rank` (int64), `default_rank_with_pin` (int64), `popularity` (int32), `merchandising_source` (string, optional).
- **Override/Curation**: A TypeSense override rule that pins, hides, or injects filters/sorts for a specific query. Supports `effective_from_ts` / `effective_to_ts` for scheduling.
- **Synonym**: A TypeSense synonym entry — multi-way or one-way — mapping terms for a collection.
- **Analytics Rule**: A TypeSense analytics rule that aggregates search queries into destination collections (`popular_queries`, `nohits_queries`).
- **Preset**: A named, saved set of search parameters (e.g., `query_by`, `query_by_weights`).

---

## User Journeys & Testing

### User Journey 1: Merchandising — Product Positioning

**Description**: A merchandising operator views products ranked by their current sort order, then features, promotes, pins, or repositions products using inline controls and batch operations — all without touching the database. Changes are batched client-side and applied in a single bulk update to TypeSense.

**Independent Test**: Can be fully tested by connecting to a TypeSense instance with a `products` collection, selecting a category, toggling product flags, and verifying the updated documents via the TypeSense API.

#### Scenario: View Products by Category
- **WHEN** the operator navigates to Merchandising > Product Positioning
- **THEN** a category selector is displayed at the top of the page
- **AND** a search bar is available to find specific products within the selected scope
- **AND** products are displayed as a ranked list with position numbers
- **AND** each product card shows: name, image thumbnail, current rank, badges (Featured / Promoted / Exclusive / Pinned #1 / Pinned #2), vendor count, min price, availability status

#### Scenario: Filter by Category
- **WHEN** the operator selects a category from the category dropdown
- **THEN** the product list is filtered by `category_id` matching the selected category
- **AND** position numbers reflect the sort order within that category scope
- **AND** selecting "All Products" removes the category filter

#### Scenario: Inline Toggle Merchandising Flags
- **WHEN** the operator toggles `is_featured`, `is_promoted`, or `is_exclusive` on a product
- **THEN** the toggle reflects the new state immediately in the UI
- **AND** a visual indicator (dirty state badge) appears on the product card
- **AND** the change is NOT yet written to TypeSense (batched client-side)

#### Scenario: Set Pin Priority
- **WHEN** the operator selects a pin priority (None / Pin #2 / Pin #1) from the dropdown on a product
- **THEN** the pin badge updates immediately on the product card
- **AND** the change is batched client-side with other pending edits

#### Scenario: Drag-and-Drop Pinned Product Reorder
- **WHEN** the operator drags a product via its drag handle to a new position
- **THEN** the product's `pin_priority` and/or `featured_rank` are updated to reflect the new position
- **AND** the reorder is reflected in the ranked list immediately
- **AND** the change is batched client-side

#### Scenario: Batch Operations
- **WHEN** the operator selects multiple products via checkboxes
- **AND** chooses a bulk action (Set Featured / Remove Featured / Set Promoted / Remove Promoted / Set Exclusive / Remove Exclusive / Set Pin Priority)
- **THEN** a confirmation dialog shows the affected product count and the changes to be applied
- **AND** upon confirmation, all selected products are updated in the batched client-side state

#### Scenario: Apply Changes (Success)
- **WHEN** the operator clicks "Apply Changes" with pending edits
- **THEN** the dashboard reads each modified product's current `popularity` value from TypeSense
- **AND** recalculates derived fields client-side:
  - `default_rank = (is_featured ? 1_000_000_000 : 0) + popularity`
  - `default_rank_with_pin = (pin_priority * 10_000_000_000) + default_rank`
- **AND** sets `merchandising_source: "dashboard"` on each modified document
- **AND** writes via `POST /collections/products/documents/import?action=update` with JSONL payload
- **AND** shows per-document success/error results
- **AND** clears the dirty state for successfully updated products

#### Scenario: Apply Changes (Partial Failure)
- **WHEN** some documents fail during the batch update
- **THEN** the dashboard shows which documents succeeded and which failed with error details
- **AND** successfully updated documents are NOT reverted
- **AND** a "Retry Failed" button is shown for just the failed documents

#### Scenario: Discard Changes
- **WHEN** the operator clicks "Discard Changes"
- **THEN** all pending (uncommitted) edits are reverted to the last-known TypeSense state
- **AND** dirty state indicators are cleared

#### Scenario: Dashboard-Managed Product Badge
- **WHEN** a product has `merchandising_source: "dashboard"`
- **THEN** it displays a "Dashboard-managed" badge
- **AND** a "Reset to DB values" button is available per product

#### Scenario: Reset to DB Values
- **WHEN** the operator clicks "Reset to DB values" on a dashboard-managed product
- **THEN** `merchandising_source` is cleared (set to `null`) on that document
- **AND** the next sync pipeline run will overwrite merchandising fields from PostgreSQL
- **AND** the "Dashboard-managed" badge is removed

#### Scenario: Pin Priority Feature Flag Note
- **WHEN** the `enablePinnedProducts` feature flag is off (inferred or configured)
- **THEN** pin controls are still shown and functional (dashboard writes to TypeSense regardless)
- **AND** a note is displayed: "Pin priority is being written but the storefront is not currently using pinned sorting."

---

### User Journey 2: Ranking & Relevance — Formula Editor

**Description**: An operator or engineer adjusts the ranking formula weights (pin multiplier, featured multiplier) that determine product sort order, previews the impact on the top products, and applies the recalculated ranks globally across all products.

**Independent Test**: Can be tested by adjusting weight sliders, verifying the preview reorders correctly, and after applying, checking that `default_rank` and `default_rank_with_pin` are updated for all documents via the TypeSense API.

#### Scenario: View Ranking Formula Breakdown
- **WHEN** the operator navigates to Relevance > Ranking Formula
- **THEN** the current default sort formula is displayed:
  ```
  is_available:desc → default_rank_with_pin:desc → kind_sort:asc
  ```
- **AND** the composition of `default_rank_with_pin` is shown:
  - Pin bonus: `pin_priority × 10,000,000,000`
  - Featured bonus: `is_featured × 1,000,000,000`
  - Popularity: raw popularity score
  - `kind_sort`: read-only tie-breaker (HEX-encoded kind + zero-padded ID)

#### Scenario: Adjust Weight Multipliers
- **WHEN** the operator adjusts the Pin multiplier slider (default: 10B) or Featured multiplier slider (default: 1B)
- **THEN** the preview panel updates to show the top 20 products reordered with the new weights
- **AND** the preview recalculates using the formula with adjusted multipliers

#### Scenario: Apply Global Ranking Update
- **WHEN** the operator clicks "Apply" on the ranking formula editor
- **THEN** a warning is shown: this is a global operation affecting all products and will set `merchandising_source: "dashboard"` on all updated documents
- **AND** upon confirmation, the dashboard recalculates `default_rank` and `default_rank_with_pin` for every product
- **AND** writes in batches (100 docs per import call) to avoid rate limits
- **AND** shows a progress indicator during the bulk update

---

### User Journey 3: Ranking & Relevance — Search Weights Tuner

**Description**: An operator adjusts the `query_by` field weights and priorities that control text search relevance, previews live search results as weights change, and saves the configuration as a TypeSense Preset.

**Independent Test**: Can be tested by reordering fields, adjusting weight sliders, typing a query in the live preview, verifying results change in real time, and confirming the saved Preset contains the correct `query_by` and `query_by_weights` values.

#### Scenario: View Current Search Weights
- **WHEN** the operator navigates to Relevance > Search Weights
- **THEN** a table shows the current `query_by` fields with their weights and priorities:
  | Field | Weight | Priority |
  |-------|--------|----------|
  | name | 4 | 1 (highest) |
  | cultivar | 3 | 2 |
  | kind | 2 | 3 |
  | effects | 2 | 4 |
  | flavors | 2 | 5 |
  | terpenes | 2 | 6 |
  | description | 1 | 7 (lowest) |

#### Scenario: Reorder and Adjust Weights
- **WHEN** the operator drags a field to reorder priority or adjusts a weight slider (range 0–127)
- **THEN** the live search preview panel updates results in real-time reflecting the new weights
- **AND** the search preview requires a query to be typed in the sidebar input

#### Scenario: Save as Preset
- **WHEN** the operator clicks "Save" on the search weights configuration
- **THEN** the dashboard creates or updates a TypeSense Preset named `default_product_search` containing the configured `query_by` and `query_by_weights`
- **AND** a note explains: "The storefront must use `preset: 'default_product_search'` for these changes to take effect."

---

### User Journey 4: Search Preview — Customer-Eye View

**Description**: An operator previews the storefront search experience using the same search parameters, with controls for sort mode, pin visibility, filter context, and faceted search.

**Independent Test**: Can be tested by entering search queries, switching sort modes, toggling pins on/off, and verifying the result order and facets match what the storefront would display.

#### Scenario: Search with Sort Modes
- **WHEN** the operator navigates to Search > Preview
- **AND** enters a search query
- **THEN** results are displayed with position numbers, badges, and availability status
- **AND** a sort mode selector allows switching between: Default / Price / Rating / THC / Popularity / Distance

#### Scenario: Toggle Pin Visibility
- **WHEN** the operator toggles "With pins" vs "Without pins"
- **THEN** results are re-sorted to include or exclude the `pin_priority` component of the sort order
- **AND** the difference in product positions is visible

#### Scenario: Filter Context
- **WHEN** the operator selects a filter context (All vendors / Featured vendors / Specific vendor / Delivery method)
- **THEN** the search results are filtered accordingly
- **AND** results show the same visual cues as the storefront (position numbers, badges, availability)

#### Scenario: Faceted Search
- **WHEN** the operator uses the facet panel on the left (category, rating, price range, etc.)
- **THEN** results are filtered by the selected facets
- **AND** facet counts update to reflect the current filter state

---

### User Journey 5: Search Preview — Query Debugger

**Description**: An engineer investigates why a specific product appears (or doesn't appear) at a given position for a search query — useful for support tickets and search quality debugging.

**Independent Test**: Can be tested by entering a product name/ID and a search query, then verifying the output explains the `text_match` score, rank position, active overrides, and contributing factors.

#### Scenario: Debug Product Position
- **WHEN** the engineer enters a product name or ID and a search query in the Query Debugger
- **THEN** the debugger shows:
  - `text_match` score and which `query_by` field(s) matched
  - Rank position in results
  - All active overrides/curations that affected this query
  - Pin priority, featured status, popularity contributing to final position
  - A "Why is this product at position X?" narrative explanation

#### Scenario: Product Not Found
- **WHEN** the search query does not return the specified product in the results
- **THEN** the debugger shows: the product's field values relevant to the query, which fields were searched, why no match occurred (e.g., no text match, filtered out by availability, excluded by an override)

---

### User Journey 6: Search Preview — Autocomplete Preview

**Description**: An operator previews the autocomplete/suggestion behavior character-by-character to understand what users see as they type.

**Independent Test**: Can be tested by typing characters one at a time and verifying the suggestions list and result counts update at each keystroke.

#### Scenario: Character-by-Character Suggestions
- **WHEN** the operator types characters in the Autocomplete Preview input
- **THEN** at each keystroke, the suggestions list updates showing:
  - Matching suggestions (from `popular_queries` collection if configured, or prefix search on product names)
  - Result count per suggestion

---

### User Journey 7: Curations — Visual Override Editor

**Description**: An operator creates or edits search overrides (curations) through a visual, search-first workflow — pin products to positions, hide products, inject filters or sorts, schedule overrides, and tag by campaign.

**Independent Test**: Can be tested by entering a query, pinning/hiding products, saving the override, then searching with and without the override to verify the split-view preview matches.

#### Scenario: Search-First Override Creation
- **WHEN** the operator navigates to Curations > Overrides
- **AND** enters a query in the search bar
- **THEN** search results are displayed with inline action buttons per product:
  - **Pin** to a specific position (click + position number input)
  - **Hide** from this query's results
- **AND** additional override options are available:
  - **Filter injection**: auto-apply a filter when this query matches (e.g., "organic" query adds `is_irradiated:=false`)
  - **Sort injection**: change sort order when this query matches

#### Scenario: Schedule Override
- **WHEN** the operator sets `effective_from_ts` and `effective_to_ts` via date pickers on an override
- **THEN** the override is saved with time-based scheduling
- **AND** the override only takes effect within the specified date range

#### Scenario: Tag Override by Campaign
- **WHEN** the operator adds tags to an override (e.g., "spring_sale", "holiday_2026")
- **THEN** overrides can be filtered and organized by tag in the list view

#### Scenario: Preview Split View
- **WHEN** the operator clicks "Preview" on an override
- **THEN** a split-view shows: results with the curation applied (left) vs. results without (right)
- **AND** differences in product positions are highlighted

#### Scenario: Advanced JSON Editing
- **WHEN** the operator clicks "Edit JSON" on an override
- **THEN** the Monaco JSON editor opens with the full override configuration
- **AND** changes saved in the JSON editor are reflected in the visual editor and vice versa

---

### User Journey 8: Synonyms — Enhanced Management

**Description**: An operator manages synonyms with a structured form, bulk import/export, and analytics-driven actions (one-click synonym creation from no-results queries).

**Independent Test**: Can be tested by creating a synonym via the form, bulk-importing a JSON file of synonyms, and verifying all synonyms appear in the table with correct types and terms.

#### Scenario: Create Synonym via Structured Form
- **WHEN** the operator navigates to Curations > Synonyms
- **AND** clicks "Create Synonym"
- **THEN** a form is displayed with: type toggle (multi-way / one-way), term chips input, locale selector
- **AND** upon submission, the synonym is created in TypeSense

#### Scenario: Bulk Import/Export
- **WHEN** the operator clicks "Import" and uploads a JSON file of synonyms
- **THEN** all synonyms in the file are created in TypeSense
- **AND** import results show success/failure counts
- **WHEN** the operator clicks "Export"
- **THEN** a JSON file containing all current synonyms is downloaded

#### Scenario: Analytics-Driven Synonym Creation
- **WHEN** the operator is viewing No-Results Queries (Analytics section) and clicks "Create Synonym" on a query
- **THEN** the synonym form opens pre-filled with the no-result query as the input term

---

### User Journey 9: Vendor Controls

**Description**: An operator browses vendors, views their products, and manages vendor-level search boosting/suppression via TypeSense overrides.

**Independent Test**: Can be tested by selecting a vendor, viewing their products, creating a boost override, and verifying the override exists in TypeSense with the correct `filter_by` configuration.

#### Scenario: Browse Vendor List
- **WHEN** the operator navigates to Merchandising > Vendor Controls
- **THEN** a searchable/sortable table is displayed showing: vendor name, product count, featured product count, delivery methods, availability
- **AND** data is sourced from TypeSense by faceting on `vendor_ids` and `featured_vendor_ids`

#### Scenario: Vendor Product View
- **WHEN** the operator selects a vendor from the list
- **THEN** all products for that vendor are displayed (filtered by `vendor_ids:=<vendor_id>`)
- **AND** per-product details shown: price, stock, availability, featured status, delivery methods
- **AND** quick actions are available: feature/unfeature, pin/unpin

#### Scenario: Vendor Boost
- **WHEN** the operator clicks "Boost" on a vendor
- **THEN** a TypeSense override is created that boosts products from this vendor (sort_by injection via `filter_by: "vendor_ids:=<id>"`)

#### Scenario: Vendor Suppress
- **WHEN** the operator clicks "Suppress" on a vendor for specific queries
- **THEN** a TypeSense override is created that filters out this vendor's products for the specified queries

---

### User Journey 10: Analytics — Setup & Dashboards

**Description**: An operator sets up analytics rules (one-click wizard), then monitors popular queries, no-results queries, search health KPIs, and index freshness — all from TypeSense data.

**Independent Test**: Can be tested by running the analytics setup wizard, performing searches to generate analytics data, then verifying the dashboards show query counts, health metrics, and freshness indicators.

#### Scenario: Analytics Rule Setup Wizard
- **WHEN** the operator navigates to Analytics > Analytics Rules and no analytics rules are configured
- **THEN** a setup wizard is displayed offering one-click configuration:
  1. Creates `popular_queries` destination collection
  2. Creates `nohits_queries` destination collection
  3. Creates analytics rules pointing `products` collection to destinations
- **AND** the wizard checks if rules already exist and shows current state

#### Scenario: Popular Queries Dashboard
- **WHEN** the operator navigates to Analytics > Popular Queries
- **THEN** a table displays: query text, search count (sorted by count desc)
- **AND** a bar chart shows the top 20 queries by volume
- **AND** clicking a query opens it in the Search Preview tool

#### Scenario: No-Results Queries Dashboard
- **WHEN** the operator navigates to Analytics > No-Results Queries
- **THEN** a table displays: query text, attempt count (sorted by count desc)
- **AND** per-query action buttons are available:
  - "Create Synonym" → pre-fills synonym form
  - "Create Override" → opens curation editor with query pre-filled
  - "Dismiss" → marks as reviewed (client-side state, localStorage)

#### Scenario: Search Health KPIs
- **WHEN** the operator navigates to Analytics > Search Health KPIs
- **THEN** the dashboard displays:
  - Request rate (requests/sec from `GET /stats.json`)
  - Search latency (average latency from `GET /stats.json`)
  - Node health (status from `GET /health`, resource errors)
  - Index size (document count from collection metadata)
- **AND** data auto-refreshes every 5 seconds (configurable)

#### Scenario: Index Freshness Monitor
- **WHEN** the dashboard loads or refreshes the Search Health KPIs page
- **THEN** it displays:
  - Document count in TypeSense (from `GET /collections/products`)
  - Most recently indexed product timestamp (sort `created_at:desc`, read top result)
  - Visual indicator: green (<5 min), yellow (<30 min), red (>30 min stale)

---

## Functional Requirements

### Navigation & Layout

- **FR-001**: System MUST add a grouped navigation structure to `NavMenu.vue` with sections: Merchandising, Search, Relevance, Curations, Analytics — in addition to existing items.
- **FR-002**: System MUST support section headers in the nav menu with collapsible groups.
- **FR-003**: New pages MUST be added to `src/router/routes.ts` as children of the MainLayout route.
- **FR-004**: New pages MUST be feature-gated in the nav menu based on server capabilities (e.g., analytics pages only visible when analytics rules endpoint is available).

### Merchandising Console

- **FR-010**: System MUST display products from the `products` collection as a ranked list with position numbers.
- **FR-011**: System MUST provide a category selector that filters products by `category_id`.
- **FR-012**: System MUST provide inline toggle switches for `is_featured`, `is_promoted`, `is_exclusive` per product.
- **FR-013**: System MUST provide a pin priority dropdown (None / Pin #2 / Pin #1) per product.
- **FR-014**: System MUST provide a `featured_rank` inline number input per product.
- **FR-015**: System MUST support drag-and-drop reordering of pinned products.
- **FR-016**: System MUST batch all merchandising edits client-side until "Apply Changes" is clicked.
- **FR-017**: System MUST recalculate `default_rank` and `default_rank_with_pin` client-side using the formulas:
  - `default_rank = (is_featured ? 1_000_000_000 : 0) + popularity`
  - `default_rank_with_pin = (pin_priority * 10_000_000_000) + default_rank`
- **FR-018**: System MUST read the existing `popularity` value from TypeSense before recalculating (must not default to 0).
- **FR-019**: System MUST set `merchandising_source: "dashboard"` on all documents updated via the merchandising console.
- **FR-020**: System MUST write batched changes via `POST /collections/products/documents/import?action=update` with JSONL payload.
- **FR-021**: System MUST show per-document success/error results after applying changes.
- **FR-022**: System MUST provide a "Retry Failed" button for partially failed batch updates.
- **FR-023**: System MUST provide a "Discard Changes" button to revert uncommitted edits.
- **FR-024**: System MUST display a "Dashboard-managed" badge on products with `merchandising_source: "dashboard"`.
- **FR-025**: System MUST provide a "Reset to DB values" button that clears `merchandising_source` to `null`.
- **FR-026**: System MUST support multi-select checkboxes and bulk actions (Set/Remove Featured, Set/Remove Promoted, Set/Remove Exclusive, Set Pin Priority).
- **FR-027**: System MUST show a confirmation dialog for bulk actions showing affected count and changes.

### Ranking & Relevance

- **FR-030**: System MUST display the current sort formula and `default_rank_with_pin` composition.
- **FR-031**: System MUST provide weight sliders for Pin multiplier (default: 10B) and Featured multiplier (default: 1B).
- **FR-032**: System MUST show a preview panel with top 20 products reordered by adjusted weights.
- **FR-033**: System MUST warn before applying global ranking updates (affects all products, sets `merchandising_source: "dashboard"`).
- **FR-034**: System MUST batch global ranking recalculations (100 docs per import call).
- **FR-035**: System MUST display `query_by` fields with weights and priorities in a table.
- **FR-036**: System MUST support drag-to-reorder field priority and weight sliders (range 0–127).
- **FR-037**: System MUST provide a live search preview that updates in real-time as weights are adjusted.
- **FR-038**: System MUST save search weight configurations as a TypeSense Preset named `default_product_search`.

### Search Preview & Debugging

- **FR-040**: System MUST replicate the storefront search experience with: keyword search, sort mode selector, pin toggle, filter context, and faceted search.
- **FR-041**: System MUST support sort modes: Default, Price, Rating, THC, Popularity, Distance.
- **FR-042**: System MUST provide a "With pins" / "Without pins" toggle.
- **FR-043**: System MUST provide filter contexts: All vendors, Featured vendors, Specific vendor, Delivery method.
- **FR-044**: System MUST provide a Query Debugger that accepts a product name/ID + search query and outputs: `text_match` score, matching fields, rank position, active overrides, and a narrative explanation.
- **FR-045**: System MUST provide an Autocomplete Preview showing character-by-character suggestions with result counts.

### Curations & Synonyms

- **FR-050**: System MUST provide a visual, search-first override editor with inline pin/hide actions per product.
- **FR-051**: System MUST support filter injection and sort injection on overrides.
- **FR-052**: System MUST support time-based scheduling via `effective_from_ts` / `effective_to_ts` date pickers.
- **FR-053**: System MUST support tagging overrides by campaign/season.
- **FR-054**: System MUST provide a split-view preview (with override vs. without).
- **FR-055**: System MUST fall back to Monaco JSON editor for advanced override configuration.
- **FR-056**: System MUST provide synonym bulk import/export (JSON format).
- **FR-057**: System MUST support analytics-driven synonym creation (pre-fill from no-results queries).

### Vendor Controls

- **FR-060**: System MUST display a searchable/sortable vendor table with: name, product count, featured product count, delivery methods, availability.
- **FR-061**: System MUST source vendor data by faceting on `vendor_ids` and `featured_vendor_ids`.
- **FR-062**: System MUST provide a vendor product view filtered by `vendor_ids:=<vendor_id>`.
- **FR-063**: System MUST support vendor boost (create override with sort_by injection).
- **FR-064**: System MUST support vendor suppress (create override filtering out vendor products for specific queries).
- **FR-065**: System MUST provide quick actions (feature/unfeature, pin/unpin) from the vendor product view.

### Analytics & Search Health

- **FR-070**: System MUST provide a one-click analytics rule setup wizard that creates `popular_queries` collection, `nohits_queries` collection, and corresponding analytics rules.
- **FR-071**: System MUST display popular queries in a table sorted by count with a top-20 bar chart.
- **FR-072**: System MUST display no-results queries with per-query actions (Create Synonym, Create Override, Dismiss).
- **FR-073**: System MUST display search health KPIs: request rate, search latency, node health, index size.
- **FR-074**: System MUST auto-refresh KPI data at a configurable interval (default: 5 seconds).
- **FR-075**: System MUST display an index freshness indicator: green (<5 min), yellow (<30 min), red (>30 min).
- **FR-076**: System MUST persist "Dismiss" state for no-results queries in localStorage.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Merchandising operator can feature, promote, pin, and reposition products without any backend/database access — entirely through the dashboard.
- **SC-002**: Product ranking formula changes (weight adjustments) can be previewed and applied globally in under 5 minutes for catalogs up to 50,000 products.
- **SC-003**: Search relevance weight changes take effect immediately after saving the Preset (no code deploy required).
- **SC-004**: Query Debugger provides a clear explanation for any product's position for any search query in a single view.
- **SC-005**: Analytics setup wizard requires no technical knowledge — one-click configuration of analytics rules and destination collections.
- **SC-006**: No-results queries dashboard enables actionable responses (synonym or override creation) with one-click pre-filled forms.
- **SC-007**: All new pages follow existing Quasar component patterns and are feature-gated in the nav menu.

---

## Edge Cases

- What happens when `popularity` is `null` or missing on a product? → Treat as 0, but display a warning on the product card: "Missing popularity score — ranking may be inaccurate."
- What happens when the `products` collection doesn't exist? → Show an informational message guiding the operator to create/select a collection. Merchandising pages should not crash.
- What happens when the operator applies changes but the TypeSense API is unreachable? → Show a connection error with retry option. Do not clear the batched edits.
- What happens when two operators make conflicting merchandising changes simultaneously? → Last-write-wins (TypeSense behavior). No optimistic locking in v1. The dashboard shows the TypeSense state after each refresh.
- What happens when the sync pipeline overwrites a dashboard-managed product? → This should not happen if the pipeline checks `merchandising_source`. If it does happen (bug), the "Dashboard-managed" badge disappears and the operator must re-apply changes. The dashboard should show a warning if `merchandising_source` was expected but is now missing.
- What happens when the analytics rules endpoint returns 404 (server doesn't support analytics)? → Analytics nav items are hidden. Analytics pages show: "Search analytics is not enabled on this server. Start the server with `--enable-search-analytics=true`."
- What happens when the `popular_queries` or `nohits_queries` collections exist but are empty? → Show the dashboard with "No data yet. Analytics data will appear after search activity."
- What happens during a global ranking recalculation if the connection drops mid-batch? → Show progress (X of Y batches complete), allow resuming from where it left off. Partially updated products are valid — they just have the new weights while remaining products still have old weights.
- What happens when the operator tries to feature a product that is unavailable (`is_available: false`)? → Allow it (merchandising is forward-looking), but show a warning: "This product is currently unavailable. It will not appear in default search results."

---

## Open Questions

- **OQ-001**: Should the Ranking Formula Editor store weight multiplier configuration somewhere (e.g., a TypeSense Preset or localStorage) so it persists across sessions? Currently the spec implies they're only used for recalculation.
- **OQ-002**: Should the dashboard support connecting to multiple TypeSense collections for merchandising (e.g., `products_staging` vs `products`), or is it always the `products` collection?
- **OQ-003**: What is the exact `query_by` field list and weights for the storefront? The spec lists 7 fields — should these be dynamically read from an existing Preset, or are they hardcoded as defaults?
- **OQ-004**: For the Autocomplete Preview, should it use the `popular_queries` collection for suggestions, or always fall back to prefix search? What if `popular_queries` doesn't exist?
- **OQ-005**: The feature flag `enablePinnedProducts` (`marketplaceEnablePinnedProducts-web`) — how should the dashboard detect this? Is it a configuration setting in the dashboard, or should it be inferred from the TypeSense schema?

---

## Out of Scope (v1)

- Campaign scheduling with auto-expire
- A/B testing for search configurations
- Per-category pin fields (requires schema changes)
- Direct PostgreSQL sync queue monitoring
- User authentication / RBAC within the dashboard
- Featured vendor toggling (requires updating 15+ derived fields per product)
- Trend indicators in analytics (TypeSense analytics doesn't provide time-series natively)
- Change audit trail / undo history
- Sync pipeline modifications (separate codebase)
