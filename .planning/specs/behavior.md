---
title: Unified Search Page - Behavior & Logic
connie-publish: true
---

# Unified Search Page - Behavior & Logic

> ⚠️ **Generated from Git (MARKETPLACE-DOCS). Do not edit in Confluence. Propose changes via PR.**

## Overview

The Typesense Dashboard currently has two search interfaces: a **Collection Search** page (`/collection/:name/search`) with InstantSearch and JSON modes, and a **Search Preview** page (`/search/preview`) with business-specific controls (vendor filtering, pin-aware ranking, business sort presets, and a custom facet panel). This spec defines how to merge them into a single unified search page that dynamically adapts its controls based on the collection schema.

The unified page retains the existing two-tab structure (InstantSearch Mode / JSON Mode) and adds a **third tab — Preview Mode** — that provides the business-oriented search experience currently offered by Search Preview. Business controls in Preview Mode appear only when the active collection's schema contains the relevant fields.

## Field Detection Heuristics

The system determines which business controls to show by inspecting the active collection's `fields` array. A field is considered **present** if a field with that exact name exists in the schema (regardless of type).

| Field Name | Enables |
|---|---|
| `vendor_ids` | Specific vendor filter |
| `featured_vendor_ids` | Featured vendors filter |
| `delivery_methods` | Delivery method filter |
| `min_price` | Price sort preset |
| `avg_rating` | Rating sort preset |
| `popularity` | Popularity sort preset |
| `default_rank_with_pin` | Pin-aware ranking toggle + Default (with pins) sort |
| `default_rank` | Default (without pins) sort |
| `is_available` | Availability-first sorting (prepended to default sort) |
| `pin_priority` | Pin priority badge in result items |

**Composite rule — Preview Mode tab visibility**: The Preview Mode tab is shown when **at least one** of these fields exists: `vendor_ids`, `featured_vendor_ids`, `delivery_methods`, `default_rank_with_pin`, `default_rank`. If none exist, the tab is hidden and the page behaves exactly as today (two tabs: InstantSearch + JSON).

## User Journeys & Testing *(mandatory)*

### User Journey 1: Standard Collection Search (no business fields)

**Description**: A user searches a collection that does not have business-specific fields (e.g., a generic collection with only basic text fields). The experience is identical to the current Collection Search page — two tabs, no business controls.

**Independent Test**: Can be tested by connecting to any Typesense instance and selecting a collection without vendor/pin/price fields. The page should show only InstantSearch and JSON tabs.

#### Scenario: Page loads for a generic collection
- **WHEN** the user navigates to `/collection/:name/search`
- **AND** the collection schema does NOT contain any of: `vendor_ids`, `featured_vendor_ids`, `delivery_methods`, `default_rank_with_pin`, `default_rank`
- **THEN** the page shows two tabs: "InstantSearch Mode" and "JSON Mode"
- **AND** no "Preview Mode" tab is visible

#### Scenario: InstantSearch mode works as before
- **WHEN** the user is on the InstantSearch tab
- **THEN** they can search, use facets (string, numeric range, boolean), sort by field, paginate, configure hits-per-page, set stopwords, tune max candidates, export results, edit documents, and delete documents
- **AND** all behavior matches the current `SearchInstantSearch.vue` implementation

#### Scenario: JSON mode works as before
- **WHEN** the user is on the JSON tab
- **THEN** they can edit search parameters in the Monaco editor, view query history, execute searches, and export results
- **AND** all behavior matches the current `SearchJson.vue` implementation

---

### User Journey 2: Business Collection Search (with Preview Mode)

**Description**: A user searches a collection that has business-specific fields (e.g., a "products" collection with vendor IDs, pricing, ratings, and pin ranking). The Preview Mode tab appears, providing the same business-oriented search experience currently offered by the Search Preview page.

**Independent Test**: Can be tested by connecting to a Typesense instance with a products collection containing `vendor_ids`, `min_price`, `avg_rating`, `popularity`, `default_rank_with_pin`, and `default_rank` fields. The Preview Mode tab should appear and all business controls should work.

#### Scenario: Page loads with business fields detected
- **WHEN** the user navigates to `/collection/:name/search`
- **AND** the collection schema contains at least one of: `vendor_ids`, `featured_vendor_ids`, `delivery_methods`, `default_rank_with_pin`, `default_rank`
- **THEN** the page shows three tabs: "InstantSearch Mode", "JSON Mode", and "Preview Mode"

#### Scenario: Preview Mode layout
- **WHEN** the user selects the "Preview Mode" tab
- **THEN** a two-column layout appears:
  - **Left column (3/12)**: Facet panel with dynamic facets from the collection schema, displayed as checkbox groups with occurrence counts
  - **Right column (9/12)**: Search input (debounced 300ms), controls row (sort mode, pin toggle, filter context), and results list

#### Scenario: Sort mode dropdown (dynamic presets)
- **WHEN** the user views the sort mode dropdown in Preview Mode
- **THEN** only sort options whose backing fields exist in the schema are shown:
  - "Default" — always shown (uses `is_available:desc,default_rank_with_pin:desc` or `is_available:desc,default_rank:desc` depending on pin toggle; falls back to relevance if neither field exists)
  - "Price" — shown only if `min_price` field exists → sorts by `min_price:asc`
  - "Rating" — shown only if `avg_rating` field exists → sorts by `avg_rating:desc`
  - "Popularity" — shown only if `popularity` field exists → sorts by `popularity:desc`

#### Scenario: Pin-aware ranking toggle
- **WHEN** the collection schema contains `default_rank_with_pin`
- **THEN** a "With pins / Without pins" toggle is visible in the controls row
- **AND** when "With pins" is selected and sort mode is "Default", sort_by uses `is_available:desc,default_rank_with_pin:desc`
- **AND** when "Without pins" is selected and sort mode is "Default", sort_by uses `is_available:desc,default_rank:desc`

#### Scenario: Pin toggle hidden when not applicable
- **WHEN** the collection schema does NOT contain `default_rank_with_pin`
- **THEN** the pin toggle is not visible

#### Scenario: Filter context — All vendors
- **WHEN** the user selects "All vendors" in the filter context dropdown
- **THEN** no vendor-related filter is applied to the search

#### Scenario: Filter context — Featured vendors
- **WHEN** the user selects "Featured vendors"
- **AND** the collection schema contains `featured_vendor_ids`
- **THEN** filter_by includes `featured_vendor_ids:!=[]`

#### Scenario: Filter context — Specific vendor
- **WHEN** the user selects "Specific vendor"
- **AND** enters a vendor ID
- **THEN** filter_by includes `vendor_ids:=[<entered_id>]`

#### Scenario: Filter context — Delivery method
- **WHEN** the user selects "Delivery method"
- **AND** enters a delivery method value
- **THEN** filter_by includes `delivery_methods:=[<entered_value>]`

#### Scenario: Filter context options are dynamic
- **WHEN** the collection schema does NOT contain `vendor_ids` and `featured_vendor_ids`
- **THEN** vendor-related filter context options ("All vendors", "Featured vendors", "Specific vendor") are hidden
- **AND** if `delivery_methods` is also absent, the filter context dropdown is hidden entirely

#### Scenario: Facet panel with counts
- **WHEN** a search is executed in Preview Mode
- **AND** the collection has facet-enabled fields
- **THEN** the left panel displays each facet field as a checkbox group
- **AND** each option shows the value and occurrence count (e.g., "Electronics (42)")
- **AND** selecting/deselecting facet values triggers a new search with `filter_by` updated accordingly

#### Scenario: Preview Mode result items
- **WHEN** search results are displayed in Preview Mode
- **THEN** each result shows: numbered badge, name/title/id, and conditionally:
  - Availability badge (if `is_available` field exists)
  - Price (if `min_price` field exists)
  - Rating (if `avg_rating` field exists)
  - Popularity (if `popularity` field exists)
  - Pin priority (if `pin_priority` field exists)
  - Text match score and details

#### Scenario: Empty query defaults to wildcard
- **WHEN** the search input is empty or cleared in Preview Mode
- **THEN** the query sent to Typesense is `*` (wildcard, matches all documents)

---

### User Journey 3: Switching Between Tabs

**Description**: A user switches between InstantSearch, JSON, and Preview modes within the same collection. Each tab maintains its own state independently.

**Independent Test**: Can be tested by searching in one tab, switching to another, performing a different search, then switching back — the first tab's state should be preserved.

#### Scenario: Tab state independence
- **WHEN** the user searches in Preview Mode with specific filters
- **AND** switches to InstantSearch Mode
- **THEN** InstantSearch Mode shows its own independent search state
- **AND** switching back to Preview Mode restores the previous filters and results

#### Scenario: Collection change resets all tabs
- **WHEN** the user changes the active collection via the sidebar selector
- **THEN** all three tabs reset their search state
- **AND** Preview Mode re-evaluates field detection for the new collection (showing/hiding controls and the tab itself as appropriate)

---

### User Journey 4: Search Preview Route Removal

**Description**: The standalone Search Preview page and its route are removed entirely. The sidebar navigation no longer shows a separate "Preview" link under the Search section.

**Independent Test**: Verify that `/search/preview` returns a 404 and the NavMenu no longer renders the Preview link.

#### Scenario: Route removed
- **WHEN** a user navigates to `/search/preview`
- **THEN** the 404 page is displayed (existing catch-all route)

#### Scenario: Navigation updated
- **WHEN** the user views the sidebar navigation under the "Search" expansion section
- **THEN** there is no "Preview" link
- **AND** "Query Debugger" and "Autocomplete Preview" remain unchanged

---

## Functional Requirements *(mandatory)*

- **FR-001**: System MUST render a third tab ("Preview Mode") on the collection search page when the active collection's schema contains at least one of: `vendor_ids`, `featured_vendor_ids`, `delivery_methods`, `default_rank_with_pin`, `default_rank`.
- **FR-002**: System MUST hide the Preview Mode tab entirely when none of the triggering fields exist in the collection schema.
- **FR-003**: System MUST retain the InstantSearch Mode tab with all current capabilities: faceted search (string, numeric range, boolean), field-based sorting, pagination, hits-per-page, stopwords sets, max candidates tuning, current-page export, document editing, and document deletion.
- **FR-004**: System MUST retain the JSON Mode tab with all current capabilities: Monaco editor, query history (localStorage, max 20 per collection), raw parameter control, JSON validation, and result export.
- **FR-005**: System MUST display a sort mode dropdown in Preview Mode containing only presets whose backing fields exist in the schema (Default always shown; Price if `min_price`; Rating if `avg_rating`; Popularity if `popularity`).
- **FR-006**: System MUST display a pin-aware ranking toggle ("With pins" / "Without pins") in Preview Mode when `default_rank_with_pin` exists in the schema.
- **FR-007**: System MUST display a filter context dropdown in Preview Mode with options dynamically determined by field presence: "All vendors" and "Specific vendor" if `vendor_ids` exists; "Featured vendors" if `featured_vendor_ids` exists; "Delivery method" if `delivery_methods` exists. Hide the dropdown entirely if no filter fields exist.
- **FR-008**: System MUST display a facet panel in Preview Mode's left column showing checkbox groups with occurrence counts for all facet-enabled fields, re-searching on selection change.
- **FR-009**: System MUST display result items in Preview Mode with conditional field badges based on schema field presence (availability, price, rating, popularity, pin priority, text match score).
- **FR-010**: System MUST use `query_by: 'name'` and `per_page: 50` as default search parameters in Preview Mode (matching current SearchPreview behavior).
- **FR-011**: System MUST remove the `/search/preview` route from `src/router/routes.ts`.
- **FR-012**: System MUST remove the `SearchPreview.vue` page component.
- **FR-013**: System MUST remove the "Preview" navigation link from the Search section in `NavMenu.vue`.
- **FR-014**: System MUST use `keep-alive` on tab panels so that switching tabs preserves each tab's state.

## Key Entities *(mandatory if feature involves data)*

- **Collection Schema Fields**: The `fields` array from a Typesense collection schema. Each field has `name`, `type`, `facet`, `index`, `sort`, and other attributes. Used for field detection heuristics and dynamic control rendering.
- **Search Parameters**: The `SearchParams` object sent to Typesense: `q`, `query_by`, `sort_by`, `filter_by`, `facet_by`, `per_page`, `page`. Preview Mode constructs these from its UI controls.
- **Facet Results**: The `facet_counts` array returned by Typesense search responses. Each entry has `field_name` and `counts` (array of `{value, count}`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After unification, there is exactly one search page route per collection (`/collection/:name/search`) — no `/search/preview` route exists.
- **SC-002**: All InstantSearch Mode features (facets, sorting, pagination, export, edit, delete, stopwords, max candidates) work identically to the current implementation.
- **SC-003**: All JSON Mode features (Monaco editor, history, export, raw parameters) work identically to the current implementation.
- **SC-004**: Preview Mode business controls (sort presets, pin toggle, vendor/delivery filters, facet panel) produce the same search API calls as the current SearchPreview page for equivalent user actions.
- **SC-005**: For collections without business fields, the page looks and behaves identically to the current Collection Search page (no visible changes).

## Edge Cases

- What happens when a collection has `default_rank_with_pin` but NOT `default_rank`? → Pin toggle shows, but "Without pins" falls back to relevance-only sorting (no `default_rank` in sort_by).
- What happens when a collection has `min_price` but not `vendor_ids`? → Price sort preset appears in Preview Mode, but filter context dropdown hides vendor options. Preview Mode tab still shows because the field detection composite rule only requires one field.
- What happens when the user is on Preview Mode tab and switches to a collection that doesn't have business fields? → The Preview Mode tab disappears and the active tab falls back to "InstantSearch Mode".
- What happens when facet fields return empty results? → The facet panel shows "No facet data available. Run a search to see facets." (matching current SearchPreview behavior).
- What happens when the Typesense connection is lost during a Preview Mode search? → An error banner appears below the controls row with the error message (matching current SearchPreview behavior).

## Open Questions

1. **Preview Mode as default tab**: Should the page default to Preview Mode when business fields are detected, or always default to InstantSearch Mode? Current spec defaults to InstantSearch Mode (preserving existing behavior).
