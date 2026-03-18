# Implementation Tasks: TypeSense Operator Dashboard

Source spec: .planning/specs/behavior.md
Test strategy: no test plan
Generated at: 2026-03-18T21:26:00Z

## Context Management
- Clear AI context between task groups (after each `## Group` section).
- Each task group is designed to be self-contained — include the spec section and relevant file paths when starting a new context.

## Foundation

- [x] **T-001**: Add new API methods to `Api` class for merchandising operations
  - Files: `src/shared/api.ts` (modify)
  - Files-write: `src/shared/api.ts`
  - Spec ref: FR-017, FR-018, FR-020
  - Done when: `Api` class has `searchProducts(params)`, `batchUpdateDocuments(collectionName, jsonlPayload)`, `getDocumentById(collectionName, id)`, `getStats()`, `getHealth()` methods (some may already exist via `search()`, `importDocuments()`, `get()` — verify and add only what's missing)

- [x] **T-002**: Add merchandising-related types and interfaces
  - Files: `src/shared/types.ts` (create)
  - Files-write: `src/shared/types.ts`
  - Spec ref: Key Entities (Product Document), FR-016, FR-017
  - Done when: File exports `ProductMerchandisingFields` interface (with `is_featured`, `featured_rank`, `is_promoted`, `is_exclusive`, `pin_priority`, `default_rank`, `default_rank_with_pin`, `popularity`, `merchandising_source`), `MerchandisingEdit` type (pending edit tracking), `BatchUpdateResult` type, and rank calculation utility functions `calculateDefaultRank(isFeatured, popularity, featuredMultiplier?)` and `calculateDefaultRankWithPin(pinPriority, defaultRank, pinMultiplier?)`

- [x] **T-003**: Add new routes for all new pages
  - Files: `src/router/routes.ts` (modify)
  - Files-write: `src/router/routes.ts`
  - Spec ref: FR-003, Navigation Structure
  - Done when: Routes exist for: `/merchandising/products`, `/merchandising/vendors`, `/search/preview`, `/search/debugger`, `/search/autocomplete`, `/relevance/ranking`, `/relevance/weights`, `/curations/overrides` (enhanced), `/curations/synonyms` (enhanced), `/analytics/popular`, `/analytics/noresults`, `/analytics/health`. All routes are children of MainLayout. Each lazy-loads a corresponding page component.

- [x] **T-004**: Update NavMenu with grouped navigation sections
  - Files: `src/components/NavMenu.vue` (modify)
  - Files-write: `src/components/NavMenu.vue`
  - Spec ref: FR-001, FR-002, FR-004, Navigation Structure
  - Done when: NavMenu shows collapsible section headers for Merchandising, Search, Relevance, Curations, Analytics. Each section contains its child links. Analytics pages are gated behind `store.data.features.analyticsRules`. Collection-specific items (existing Search, Synonyms, Curations, Schema, Add Document) remain under the collection selector.

- [x] **T-005**: Add merchandising store module for client-side batch editing state
  - Files: `src/stores/merchandising.ts` (create)
  - Files-write: `src/stores/merchandising.ts`
  - Spec ref: FR-016, FR-019, FR-020, FR-021, FR-022, FR-023
  - Done when: Pinia store `useMerchandisingStore` exists with: state for `pendingEdits` (Map<docId, MerchandisingEdit>), `selectedProducts` (Set<string>), `isApplying` (boolean), `applyResults` (success/fail per doc). Actions: `addEdit(docId, field, value)`, `discardAllEdits()`, `discardEdit(docId)`, `applyChanges(collectionName)` (reads popularity, recalculates ranks, calls batch update API, sets merchandising_source), `retryFailed(collectionName)`, `selectProduct(id)`, `deselectProduct(id)`, `selectAll(ids)`, `deselectAll()`. Getters: `hasPendingEdits`, `pendingEditCount`, `failedDocIds`.

## Group 1: Product Positioning Page

> Spec ref: User Journey 1 in behavior.md
> Parallelizable-with: Group 2, Group 3, Group 5, Group 6, Group 7, Group 8
> Context-include:
>   - specs/behavior.md ## User Journey 1: Merchandising — Product Positioning
>   - specs/behavior.md ## Functional Requirements → FR-010 through FR-027
>   - specs/behavior.md ## Edge Cases → popularity null, products collection missing, API unreachable, unavailable product

- [x] **T-010**: Create ProductPositioning page scaffold
  - Files: `src/pages/ProductPositioning.vue` (create)
  - Files-write: `src/pages/ProductPositioning.vue`
  - Spec ref: UJ1 Scenario "View Products by Category"
  - Done when: Page component renders with: a category selector dropdown at top, a search bar, and a placeholder product list area. Uses Quasar components (QSelect, QInput, QList). Connects to `useNodeStore` and `useMerchandisingStore`.

- [x] **T-011**: Create ProductCard component with merchandising controls
  - Files: `src/components/merchandising/ProductCard.vue` (create)
  - Files-write: `src/components/merchandising/ProductCard.vue`
  - Spec ref: UJ1 Scenarios "View Products by Category", "Inline Toggle Merchandising Flags", "Set Pin Priority", FR-010 through FR-015
  - Done when: Component renders: product name, image thumbnail, current rank number, badges (Featured/Promoted/Exclusive/Pinned), vendor count, min price, availability status. Includes inline toggle switches for `is_featured`/`is_promoted`/`is_exclusive`, a pin priority dropdown (None/Pin #2/Pin #1), a `featured_rank` number input, a checkbox for multi-select, and a drag handle. Emits events for all edits (does not write to store directly — parent handles that).

- [x] **T-012**: Implement product search and category filtering in ProductPositioning
  - Files: `src/pages/ProductPositioning.vue` (modify)
  - Files-write: `src/pages/ProductPositioning.vue`
  - Spec ref: UJ1 Scenarios "View Products by Category", "Filter by Category", FR-010, FR-011
  - Done when: Category selector fetches distinct `category_id` values via faceted search. Selecting a category filters the product list by `filter_by: "category_id:=<value>"`. Search bar filters products by name. "All Products" option removes category filter. Products are displayed sorted by `default_rank_with_pin:desc` with position numbers.

- [x] **T-013**: Implement dirty state tracking and inline edit interactions
  - Files: `src/pages/ProductPositioning.vue` (modify)
  - Files-write: `src/pages/ProductPositioning.vue`
  - Spec ref: UJ1 Scenarios "Inline Toggle Merchandising Flags", "Set Pin Priority", FR-012, FR-013, FR-014, FR-016
  - Done when: Toggling a flag or changing pin priority on a ProductCard dispatches to `useMerchandisingStore.addEdit()`. Products with pending edits show a dirty state visual indicator. Changes are NOT sent to TypeSense until Apply is clicked.

- [x] **T-014**: Implement drag-and-drop reordering for pinned products
  - Files: `src/pages/ProductPositioning.vue` (modify)
  - Files-write: `src/pages/ProductPositioning.vue`
  - Spec ref: UJ1 Scenario "Drag-and-Drop Pinned Product Reorder", FR-015
  - Done when: Products with `pin_priority > 0` can be reordered via drag-and-drop. Reordering updates `featured_rank` (or `pin_priority`) in the merchandising store. Reorder is reflected in the ranked list immediately.

- [x] **T-015**: Implement batch operations (multi-select + bulk actions)
  - Files: `src/pages/ProductPositioning.vue` (modify), `src/components/merchandising/BulkActionsBar.vue` (create)
  - Files-write: `src/pages/ProductPositioning.vue`, `src/components/merchandising/BulkActionsBar.vue`
  - Spec ref: UJ1 Scenario "Batch Operations", FR-026, FR-027
  - Done when: A bulk actions bar appears when products are selected. Dropdown offers: Set/Remove Featured, Set/Remove Promoted, Set/Remove Exclusive, Set Pin Priority. Confirmation dialog shows affected count and changes. Confirmed actions update the merchandising store for all selected products.

- [x] **T-016**: Implement Apply Changes and Discard Changes flows
  - Files: `src/pages/ProductPositioning.vue` (modify)
  - Files-write: `src/pages/ProductPositioning.vue`
  - Spec ref: UJ1 Scenarios "Apply Changes (Success)", "Apply Changes (Partial Failure)", "Discard Changes", FR-017 through FR-023
  - Done when: "Apply Changes" button triggers `merchandisingStore.applyChanges()`. Success shows per-document results. Partial failure shows succeeded/failed breakdown with "Retry Failed" button. "Discard Changes" calls `merchandisingStore.discardAllEdits()` and clears dirty state. Edge case: if API unreachable, shows error without clearing edits.

- [x] **T-017**: Implement Dashboard-Managed badge and Reset to DB Values
  - Files: `src/components/merchandising/ProductCard.vue` (modify)
  - Files-write: `src/components/merchandising/ProductCard.vue`
  - Spec ref: UJ1 Scenarios "Dashboard-Managed Product Badge", "Reset to DB Values", FR-024, FR-025
  - Done when: Products with `merchandising_source: "dashboard"` show a "Dashboard-managed" badge. A "Reset to DB values" button clears `merchandising_source` to null via API update. Badge disappears after reset.

- [x] **T-018**: Handle edge cases in ProductPositioning
  - Files: `src/pages/ProductPositioning.vue` (modify), `src/components/merchandising/ProductCard.vue` (modify)
  - Files-write: `src/pages/ProductPositioning.vue`, `src/components/merchandising/ProductCard.vue`
  - Spec ref: Edge Cases (popularity null, products collection missing, unavailable product), UJ1 Scenario "Pin Priority Feature Flag Note"
  - Done when: Products with null/missing `popularity` show warning "Missing popularity score — ranking may be inaccurate." If `products` collection doesn't exist, page shows informational message. Featuring an unavailable product shows warning. Pin priority feature flag note is displayed when configured.

## Group 2: Ranking Formula Editor

> Spec ref: User Journey 2 in behavior.md
> Parallelizable-with: Group 1, Group 3, Group 5, Group 6, Group 7, Group 8
> Context-include:
>   - specs/behavior.md ## User Journey 2: Ranking & Relevance — Formula Editor
>   - specs/behavior.md ## Functional Requirements → FR-030 through FR-034
>   - specs/behavior.md ## Edge Cases → connection drops mid-batch

- [x] **T-020**: Create RankingFormula page with formula breakdown display
  - Files: `src/pages/RankingFormula.vue` (create)
  - Files-write: `src/pages/RankingFormula.vue`
  - Spec ref: UJ2 Scenario "View Ranking Formula Breakdown", FR-030
  - Done when: Page renders the current default sort formula (`is_available:desc → default_rank_with_pin:desc → kind_sort:asc`). Shows the composition of `default_rank_with_pin` with pin bonus, featured bonus, popularity, and kind_sort explanation.

- [x] **T-021**: Add weight sliders and preview panel
  - Files: `src/pages/RankingFormula.vue` (modify)
  - Files-write: `src/pages/RankingFormula.vue`
  - Spec ref: UJ2 Scenario "Adjust Weight Multipliers", FR-031, FR-032
  - Done when: Pin multiplier slider (default 10B) and Featured multiplier slider (default 1B) are displayed. Adjusting either slider triggers a search for top 20 products and recalculates their order using the adjusted weights. Preview panel shows the reordered product list.

- [x] **T-022**: Implement global ranking recalculation and batch update
  - Files: `src/pages/RankingFormula.vue` (modify)
  - Files-write: `src/pages/RankingFormula.vue`
  - Spec ref: UJ2 Scenario "Apply Global Ranking Update", FR-033, FR-034
  - Done when: "Apply" button shows warning about global operation. Upon confirmation, iterates all products in batches of 100, recalculates `default_rank` and `default_rank_with_pin` using adjusted multipliers, sets `merchandising_source: "dashboard"`, and writes via batch import. Progress indicator shows X of Y batches. Handles connection drop mid-batch gracefully (shows progress, allows resume).

## Group 3: Search Weights Tuner

> Spec ref: User Journey 3 in behavior.md
> Parallelizable-with: Group 1, Group 2, Group 5, Group 6, Group 7, Group 8
> Context-include:
>   - specs/behavior.md ## User Journey 3: Ranking & Relevance — Search Weights Tuner
>   - specs/behavior.md ## Functional Requirements → FR-035 through FR-038

- [x] **T-030**: Create SearchWeights page with field table and drag-to-reorder
  - Files: `src/pages/SearchWeights.vue` (create)
  - Files-write: `src/pages/SearchWeights.vue`
  - Spec ref: UJ3 Scenario "View Current Search Weights", FR-035, FR-036
  - Done when: Page displays a table of `query_by` fields with weight sliders (0–127) and priority numbers. Fields can be reordered via drag-and-drop. Default values match spec table (name:4, cultivar:3, kind:2, effects:2, flavors:2, terpenes:2, description:1). Attempts to load existing `default_product_search` Preset on mount.

- [x] **T-031**: Add live search preview panel
  - Files: `src/pages/SearchWeights.vue` (modify)
  - Files-write: `src/pages/SearchWeights.vue`
  - Spec ref: UJ3 Scenario "Reorder and Adjust Weights", FR-037
  - Done when: A sidebar input allows typing a search query. Results update in real-time as weights are adjusted, using the current field order and weights for `query_by` and `query_by_weights` parameters.

- [x] **T-032**: Implement Save as Preset
  - Files: `src/pages/SearchWeights.vue` (modify)
  - Files-write: `src/pages/SearchWeights.vue`
  - Spec ref: UJ3 Scenario "Save as Preset", FR-038
  - Done when: "Save" button creates/updates the `default_product_search` Preset via `api.upsertSearchPreset()`. Displays note about storefront needing to use the preset. Shows success/error notification.

## Group 4: Search Preview & Debugging

> Spec ref: User Journey 4, 5, 6 in behavior.md
> Parallelizable-with: Group 2, Group 3, Group 7, Group 8
> Context-include:
>   - specs/behavior.md ## User Journey 4: Search Preview — Customer-Eye View
>   - specs/behavior.md ## User Journey 5: Search Preview — Query Debugger
>   - specs/behavior.md ## User Journey 6: Search Preview — Autocomplete Preview
>   - specs/behavior.md ## Functional Requirements → FR-040 through FR-045

- [x] **T-040**: Create SearchPreview page with sort modes and facets
  - Files: `src/pages/SearchPreview.vue` (create)
  - Files-write: `src/pages/SearchPreview.vue`
  - Spec ref: UJ4 Scenarios "Search with Sort Modes", "Faceted Search", FR-040, FR-041
  - Done when: Page has a search input, results list with position numbers/badges/availability, sort mode selector (Default/Price/Rating/THC/Popularity/Distance), and a facet panel on the left (category, rating, price range). Searching performs a TypeSense search with the selected sort and facets.

- [x] **T-041**: Add pin toggle and filter context to SearchPreview
  - Files: `src/pages/SearchPreview.vue` (modify)
  - Files-write: `src/pages/SearchPreview.vue`
  - Spec ref: UJ4 Scenarios "Toggle Pin Visibility", "Filter Context", FR-042, FR-043
  - Done when: "With pins" / "Without pins" toggle switches between `sort_by: "is_available:desc,default_rank_with_pin:desc,kind_sort:asc"` and `sort_by: "is_available:desc,default_rank:desc,kind_sort:asc"`. Filter context dropdown (All vendors / Featured vendors / Specific vendor / Delivery method) applies corresponding `filter_by` clauses.

- [x] **T-042**: Create QueryDebugger page
  - Files: `src/pages/QueryDebugger.vue` (create)
  - Files-write: `src/pages/QueryDebugger.vue`
  - Spec ref: UJ5 Scenarios "Debug Product Position", "Product Not Found", FR-044
  - Done when: Page accepts product name/ID + search query inputs. Runs the search, finds the product in results (or confirms absence). Displays: `text_match` score, matching `query_by` fields (from `text_match_info`), rank position, active overrides for the query, pin_priority/featured_status/popularity breakdown. If product not found, shows explanation of why. Generates a "Why is this product at position X?" narrative.

- [x] **T-043**: Create AutocompletePreview page
  - Files: `src/pages/AutocompletePreview.vue` (create)
  - Files-write: `src/pages/AutocompletePreview.vue`
  - Spec ref: UJ6 Scenario "Character-by-Character Suggestions", FR-045
  - Done when: Page has a text input. On each keystroke, queries `popular_queries` collection (if exists) or performs prefix search on product names. Shows suggestions list with result count per suggestion. Updates at each character.

## Group 5: Visual Override Editor (Enhanced Curations)

> Spec ref: User Journey 7 in behavior.md
> Parallelizable-with: Group 1, Group 2, Group 3, Group 8
> Context-include:
>   - specs/behavior.md ## User Journey 7: Curations — Visual Override Editor
>   - specs/behavior.md ## Functional Requirements → FR-050 through FR-055

- [x] **T-050**: Create OverridesVisual page with search-first workflow
  - Files: `src/pages/OverridesVisual.vue` (create)
  - Files-write: `src/pages/OverridesVisual.vue`
  - Spec ref: UJ7 Scenario "Search-First Override Creation", FR-050
  - Done when: Page has a query search bar. Entering a query shows search results with inline "Pin" (with position number input) and "Hide" buttons per product. Pinning/hiding a product adds it to the override being built. Override can be saved to TypeSense via `api.upsertOverride()`.

- [x] **T-051**: Add filter injection, sort injection, scheduling, and tags
  - Files: `src/pages/OverridesVisual.vue` (modify)
  - Files-write: `src/pages/OverridesVisual.vue`
  - Spec ref: UJ7 Scenarios "Search-First Override Creation", "Schedule Override", "Tag Override by Campaign", FR-051, FR-052, FR-053
  - Done when: Override form includes: filter injection input (`filter_by` clause), sort injection input (`sort_by` clause), date pickers for `effective_from_ts`/`effective_to_ts`, and a tag chips input. All fields are included in the saved override. Override list view can be filtered by tag.

- [x] **T-052**: Add split-view preview and Monaco JSON fallback
  - Files: `src/pages/OverridesVisual.vue` (modify)
  - Files-write: `src/pages/OverridesVisual.vue`
  - Spec ref: UJ7 Scenarios "Preview Split View", "Advanced JSON Editing", FR-054, FR-055
  - Done when: "Preview" shows side-by-side results: with override (left) vs without (right). Differences in positions are highlighted. "Edit JSON" opens the Monaco editor (reuse existing `MonacoEditor.vue`) with the full override JSON. Changes in JSON editor sync back to the visual form.

## Group 6: Enhanced Synonyms

> Spec ref: User Journey 8 in behavior.md
> Parallelizable-with: Group 1, Group 2, Group 3, Group 5, Group 7, Group 8
> Context-include:
>   - specs/behavior.md ## User Journey 8: Synonyms — Enhanced Management
>   - specs/behavior.md ## Functional Requirements → FR-056, FR-057

- [x] **T-060**: Add bulk import/export to Synonyms page
  - Files: `src/pages/Synonyms.vue` (modify)
  - Files-write: `src/pages/Synonyms.vue`
  - Spec ref: UJ8 Scenario "Bulk Import/Export", FR-056
  - Done when: "Import" button opens a file picker for JSON. Uploaded synonyms are created in TypeSense with success/failure counts displayed. "Export" button downloads all current synonyms as a JSON file.

- [x] **T-061**: Support analytics-driven synonym creation (pre-fill from no-results queries)
  - Files: `src/pages/Synonyms.vue` (modify)
  - Files-write: `src/pages/Synonyms.vue`
  - Spec ref: UJ8 Scenario "Analytics-Driven Synonym Creation", FR-057
  - Done when: Synonyms page accepts a query parameter (`?prefill=<term>`) that pre-fills the synonym creation form with the given term. Navigation from No-Results Queries page passes this parameter.

## Group 7: Vendor Controls

> Spec ref: User Journey 9 in behavior.md
> Parallelizable-with: Group 1, Group 2, Group 3, Group 6, Group 8
> Context-include:
>   - specs/behavior.md ## User Journey 9: Vendor Controls
>   - specs/behavior.md ## Functional Requirements → FR-060 through FR-065

- [x] **T-070**: Create VendorControls page with vendor list table
  - Files: `src/pages/VendorControls.vue` (create)
  - Files-write: `src/pages/VendorControls.vue`
  - Spec ref: UJ9 Scenario "Browse Vendor List", FR-060, FR-061
  - Done when: Page displays a searchable/sortable table of vendors derived from faceting on `vendor_ids` and `featured_vendor_ids` in the `products` collection. Columns: vendor name (or ID), product count, featured product count. Table supports search and column sorting.

- [x] **T-071**: Add vendor product view with quick actions
  - Files: `src/pages/VendorControls.vue` (modify)
  - Files-write: `src/pages/VendorControls.vue`
  - Spec ref: UJ9 Scenario "Vendor Product View", FR-062, FR-065
  - Done when: Clicking a vendor shows their products (filtered by `vendor_ids:=<id>`). Each product shows: price, stock, availability, featured status, delivery methods. Quick action buttons: feature/unfeature, pin/unpin — these dispatch to `useMerchandisingStore` and follow the same batch-apply pattern.

- [x] **T-072**: Implement vendor boost and suppress overrides
  - Files: `src/pages/VendorControls.vue` (modify)
  - Files-write: `src/pages/VendorControls.vue`
  - Spec ref: UJ9 Scenarios "Vendor Boost", "Vendor Suppress", FR-063, FR-064
  - Done when: "Boost" button on a vendor creates a TypeSense override with sort_by injection for that vendor's products. "Suppress" button creates an override that filters out the vendor's products for specified queries (prompts for query input). Both use `api.upsertOverride()`.

## Group 8: Analytics & Search Health

> Spec ref: User Journey 10 in behavior.md
> Parallelizable-with: Group 1, Group 2, Group 3, Group 6, Group 7
> Context-include:
>   - specs/behavior.md ## User Journey 10: Analytics — Setup & Dashboards
>   - specs/behavior.md ## Functional Requirements → FR-070 through FR-076
>   - specs/behavior.md ## Edge Cases → analytics rules 404, empty collections

- [x] **T-080**: Create AnalyticsSetupWizard component
  - Files: `src/components/analytics/AnalyticsSetupWizard.vue` (create)
  - Files-write: `src/components/analytics/AnalyticsSetupWizard.vue`
  - Spec ref: UJ10 Scenario "Analytics Rule Setup Wizard", FR-070
  - Done when: Component checks if `popular_queries` and `nohits_queries` collections exist. If not, offers one-click setup: creates both destination collections with appropriate schemas, then creates analytics rules pointing `products` to them. Shows current state if rules already exist.

- [x] **T-081**: Create PopularQueries page with table and bar chart
  - Files: `src/pages/PopularQueries.vue` (create)
  - Files-write: `src/pages/PopularQueries.vue`
  - Spec ref: UJ10 Scenario "Popular Queries Dashboard", FR-071
  - Done when: Page searches the `popular_queries` collection and displays: a table (query text, count, sorted by count desc) and a bar chart of top 20 queries. Clicking a query navigates to `/search/preview?q=<query>`. Handles empty collection gracefully ("No data yet").

- [x] **T-082**: Create NoResultsQueries page with action buttons
  - Files: `src/pages/NoResultsQueries.vue` (create)
  - Files-write: `src/pages/NoResultsQueries.vue`
  - Spec ref: UJ10 Scenario "No-Results Queries Dashboard", FR-072, FR-076
  - Done when: Page searches the `nohits_queries` collection. Table shows query text and attempt count. Per-query action buttons: "Create Synonym" (navigates to synonyms page with `?prefill=<query>`), "Create Override" (navigates to overrides visual page with `?query=<query>`), "Dismiss" (saves to localStorage, hides the query). Dismissed queries are filtered out. Handles empty collection gracefully.

- [x] **T-083**: Create SearchHealthKPIs page with auto-refresh
  - Files: `src/pages/SearchHealthKPIs.vue` (create)
  - Files-write: `src/pages/SearchHealthKPIs.vue`
  - Spec ref: UJ10 Scenarios "Search Health KPIs", "Index Freshness Monitor", FR-073, FR-074, FR-075
  - Done when: Page displays: request rate (from `/stats.json`), search latency (from `/stats.json`), node health (from `/health`), index size (document count from `products` collection metadata). Auto-refreshes at configurable interval (default 5s). Index freshness section shows: document count, most recent `created_at` timestamp (via search sorted by `created_at:desc`), visual indicator (green/yellow/red based on staleness). Handles analytics-not-enabled edge case.

## Summary

- Total tasks: 30
- Foundation tasks: 5
- Journey groups: 8
- Estimated context sessions: 9 (Foundation + 8 groups)

## Parallelism Analysis

| Group | Files-write (unique) | Can run with |
|-------|---------------------|--------------|
| Foundation | `src/shared/api.ts`, `src/shared/types.ts`, `src/router/routes.ts`, `src/components/NavMenu.vue`, `src/stores/merchandising.ts` | — (must run first) |
| Group 1 | `src/pages/ProductPositioning.vue`, `src/components/merchandising/ProductCard.vue`, `src/components/merchandising/BulkActionsBar.vue` | Group 2, 3, 5, 6, 7, 8 |
| Group 2 | `src/pages/RankingFormula.vue` | Group 1, 3, 4, 5, 6, 7, 8 |
| Group 3 | `src/pages/SearchWeights.vue` | Group 1, 2, 4, 5, 6, 7, 8 |
| Group 4 | `src/pages/SearchPreview.vue`, `src/pages/QueryDebugger.vue`, `src/pages/AutocompletePreview.vue` | Group 2, 3, 5, 7, 8 |
| Group 5 | `src/pages/OverridesVisual.vue` | Group 1, 2, 3, 4, 6, 7, 8 |
| Group 6 | `src/pages/Synonyms.vue` | Group 1, 2, 3, 4, 5, 7, 8 |
| Group 7 | `src/pages/VendorControls.vue` | Group 1, 2, 3, 4, 5, 6, 8 |
| Group 8 | `src/components/analytics/AnalyticsSetupWizard.vue`, `src/pages/PopularQueries.vue`, `src/pages/NoResultsQueries.vue`, `src/pages/SearchHealthKPIs.vue` | Group 1, 2, 3, 5, 6, 7 |

Dispatch waves:
1. Foundation
2. Group 1 + Group 2 + Group 3 + Group 5 + Group 6 + Group 7 + Group 8 (parallel — all have non-overlapping Files-write)
3. Group 4 (runs after Group 1 due to shared merchandising patterns, though no file overlap — sequenced for consistency)
