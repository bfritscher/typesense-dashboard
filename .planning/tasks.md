# Implementation Tasks: Unified Search Page

Source spec: .planning/specs/behavior.md
Test strategy: no test plan
Generated at: 2026-03-19T16:15:00Z

## Context Management
- Clear AI context between task groups (after each `## Group` section).
- Each task group is designed to be self-contained — include the spec section and relevant file paths when starting a new context.

## Group 1: Preview Mode Component

> Spec ref: User Journey 2 in behavior.md
> Parallelizable-with: Group 3
> Context-include:
>   - specs/behavior.md ## Field Detection Heuristics
>   - specs/behavior.md ## User Journey 2: Business Collection Search (with Preview Mode)
>   - specs/behavior.md ## Functional Requirements → FR-005, FR-006, FR-007, FR-008, FR-009, FR-010
>   - specs/behavior.md ## Edge Cases

- [x] **T-001**: Create `SearchPreviewMode.vue` component with the two-column layout (left facet panel, right search/controls/results). Migrate the template from `SearchPreview.vue` but remove the `ensureCollection()` logic — this component assumes `store.currentCollection` is already set by the parent page. Remove the page title header (`<div class="text-h5">`). Keep the `<q-page padding>` wrapper or adapt to work within a tab panel.
  - Files: `src/components/search/SearchPreviewMode.vue` (create), reference `src/pages/SearchPreview.vue` (read-only)
  - Files-write: `src/components/search/SearchPreviewMode.vue`
  - Spec ref: UJ2 Scenario "Preview Mode layout"
  - Done when: Component file exists with the two-column template structure, search input, and results list

- [x] **T-002**: Implement field detection computed properties in `SearchPreviewMode.vue`. Inspect `store.currentCollection.fields` to determine which controls to show. Implement: `hasVendorIds`, `hasFeaturedVendorIds`, `hasDeliveryMethods`, `hasMinPrice`, `hasAvgRating`, `hasPopularity`, `hasDefaultRankWithPin`, `hasDefaultRank`, `hasIsAvailable`, `hasPinPriority`.
  - Files: `src/components/search/SearchPreviewMode.vue` (modify)
  - Files-write: `src/components/search/SearchPreviewMode.vue`
  - Spec ref: Field Detection Heuristics table, FR-001
  - Done when: Computed properties exist and derive from `store.currentCollection.fields`

- [x] **T-003**: Make the sort mode dropdown dynamic — only show presets whose backing fields exist. "Default" always shown; "Price" if `hasMinPrice`; "Rating" if `hasAvgRating`; "Popularity" if `hasPopularity`. Update `getSortBy()` to handle the pin toggle: when "Default" + "With pins" → `is_available:desc,default_rank_with_pin:desc`; "Without pins" → `is_available:desc,default_rank:desc`; if neither rank field exists, fall back to no explicit sort. Conditionally show/hide the pin toggle based on `hasDefaultRankWithPin`.
  - Files: `src/components/search/SearchPreviewMode.vue` (modify)
  - Files-write: `src/components/search/SearchPreviewMode.vue`
  - Spec ref: UJ2 Scenarios "Sort mode dropdown", "Pin-aware ranking toggle", "Pin toggle hidden"; FR-005, FR-006; Edge case (pin without default_rank)
  - Done when: Sort options are computed from field presence; pin toggle conditionally renders; `getSortBy()` handles all combinations

- [x] **T-004**: Make the filter context dropdown dynamic — show "All vendors"/"Specific vendor" only if `hasVendorIds`; "Featured vendors" only if `hasFeaturedVendorIds`; "Delivery method" only if `hasDeliveryMethods`. Hide the entire dropdown if no filter fields exist. Keep the conditional vendor ID and delivery method text inputs.
  - Files: `src/components/search/SearchPreviewMode.vue` (modify)
  - Files-write: `src/components/search/SearchPreviewMode.vue`
  - Spec ref: UJ2 Scenarios "Filter context — *", "Filter context options are dynamic"; FR-007
  - Done when: Filter context dropdown options are computed from field presence; dropdown hidden when no filter fields exist

- [x] **T-005**: Make result item badges conditional — show availability badge only if `hasIsAvailable`; price only if `hasMinPrice`; rating only if `hasAvgRating`; popularity only if `hasPopularity`; pin priority only if `hasPinPriority`.
  - Files: `src/components/search/SearchPreviewMode.vue` (modify)
  - Files-write: `src/components/search/SearchPreviewMode.vue`
  - Spec ref: UJ2 Scenario "Preview Mode result items"; FR-009
  - Done when: Each result badge is wrapped in a `v-if` checking the corresponding field detection computed

## Group 2: Unified Search Page (Third Tab)

> Spec ref: User Journey 1, User Journey 2 (tab visibility), User Journey 3 in behavior.md
> Parallelizable-with: —
> Context-include:
>   - specs/behavior.md ## Field Detection Heuristics → Composite rule
>   - specs/behavior.md ## User Journey 1: Standard Collection Search
>   - specs/behavior.md ## User Journey 3: Switching Between Tabs
>   - specs/behavior.md ## Functional Requirements → FR-001, FR-002, FR-003, FR-004, FR-014
>   - specs/behavior.md ## Edge Cases

- [x] **T-006**: Update `Search.vue` to import `SearchPreviewMode` and add a third tab. Add a computed property `showPreviewMode` that checks if the current collection has at least one of: `vendor_ids`, `featured_vendor_ids`, `delivery_methods`, `default_rank_with_pin`, `default_rank`. Conditionally render the "Preview Mode" tab based on this computed. Ensure `keep-alive` is used on tab panels (the existing `q-tab-panels` already supports this via the `keep-alive` prop — verify it is set).
  - Files: `src/pages/Search.vue` (modify)
  - Files-write: `src/pages/Search.vue`
  - Spec ref: UJ1 Scenario "Page loads for generic collection"; UJ2 Scenario "Page loads with business fields detected"; FR-001, FR-002, FR-014
  - Done when: Third tab appears when collection has business fields; hidden when it doesn't; `keep-alive` is active on tab panels

- [x] **T-007**: Handle the edge case where the user is on Preview Mode tab and switches to a collection without business fields. Watch the collection change and if `showPreviewMode` becomes false while `tab === 'preview'`, reset `tab` to `'form'` (InstantSearch).
  - Files: `src/pages/Search.vue` (modify)
  - Files-write: `src/pages/Search.vue`
  - Spec ref: UJ3 Scenario "Collection change resets all tabs"; Edge case (collection switch hides Preview tab)
  - Done when: Switching to a non-business collection while on Preview tab auto-switches to InstantSearch tab

## Group 3: Cleanup (Route & Nav Removal)

> Spec ref: User Journey 4 in behavior.md
> Parallelizable-with: Group 1
> Context-include:
>   - specs/behavior.md ## User Journey 4: Search Preview Route Removal
>   - specs/behavior.md ## Functional Requirements → FR-011, FR-012, FR-013

- [x] **T-008**: Remove the `/search/preview` route from `src/router/routes.ts`. Delete the line: `{ path: 'search/preview', name: 'SearchPreview', component: () => import('pages/SearchPreview.vue') }`.
  - Files: `src/router/routes.ts` (modify)
  - Files-write: `src/router/routes.ts`
  - Spec ref: UJ4 Scenario "Route removed"; FR-011
  - Done when: No route definition for `search/preview` exists in routes.ts

- [x] **T-009**: Remove the "Preview" navigation link from `NavMenu.vue`. Delete the `<q-item>` block that links to `/search/preview` (around lines 51-56). Keep "Query Debugger" and "Autocomplete Preview" links intact.
  - Files: `src/components/NavMenu.vue` (modify)
  - Files-write: `src/components/NavMenu.vue`
  - Spec ref: UJ4 Scenario "Navigation updated"; FR-013
  - Done when: No `q-item` linking to `/search/preview` in NavMenu.vue; debugger and autocomplete links remain

- [x] **T-010**: Delete `src/pages/SearchPreview.vue`.
  - Files: `src/pages/SearchPreview.vue` (delete)
  - Files-write: `src/pages/SearchPreview.vue`
  - Spec ref: FR-012
  - Done when: File no longer exists on disk

## Summary

- Total tasks: 10
- Foundation tasks: 0
- Journey groups: 3
- Estimated context sessions: 3 (one per group)

## Parallelism Analysis

| Group | Files-write (unique) | Can run with |
|-------|---------------------|--------------|
| Group 1 | `src/components/search/SearchPreviewMode.vue` | Group 3 |
| Group 2 | `src/pages/Search.vue` | — (depends on Group 1 component) |
| Group 3 | `src/router/routes.ts`, `src/components/NavMenu.vue`, `src/pages/SearchPreview.vue` | Group 1 |

Dispatch waves:
1. Group 1 + Group 3 (parallel)
2. Group 2
