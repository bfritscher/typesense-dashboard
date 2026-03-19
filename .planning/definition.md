# Work Definition: Unify Search Pages

## Meta
- **Type:** Feature Change
- **JIRA:** None
- **Created:** 2026-03-19
- **Author:** renato-dransay

## Context
The Typesense Dashboard currently has two separate search interfaces that serve overlapping purposes:

1. **Collection Search** (`/collection/:name/search`) — A developer-oriented search page with two modes: InstantSearch (full UI with facets, sorting, pagination, document actions) and JSON mode (raw parameter editing with Monaco editor, query history). Supports document editing/deletion, result export, stopwords, and max candidates tuning.

2. **Search Preview** (`/search/preview`) — A business-oriented search page with custom controls for vendor filtering, delivery method filtering, pin-aware ranking, and business-driven sort modes (price, rating, popularity). Features a custom facet panel with checkbox UI and occurrence counts.

Having two pages creates confusion about which to use, duplicates maintenance effort, and splits features that would be more powerful combined. The goal is to merge them into a single unified search experience that retains the strengths of both.

## Scope
### In Scope
- [ ] Merge Search Preview's business-specific features into the Collection Search page (or a new unified page)
- [ ] Retain InstantSearch mode with facets, sorting, pagination, and document actions
- [ ] Retain JSON mode with Monaco editor and query history
- [ ] Incorporate Search Preview's filter context controls (vendor, delivery method)
- [ ] Incorporate Search Preview's pin-aware ranking toggle
- [ ] Incorporate Search Preview's business-driven sort modes (price, rating, popularity)
- [ ] Incorporate Search Preview's custom facet panel with counts
- [ ] Remove the now-redundant Search Preview page and its route
- [ ] Update navigation to reflect the unified page

### Out of Scope
- Changes to the Typesense API layer or backend
- Changes to other dashboard pages (analytics, curations, etc.)
- New search features not present in either existing page

## Requirements
### Functional
1. The system MUST provide a single search page accessible from collection navigation
2. The system MUST retain the InstantSearch mode with all current capabilities (facets, sorting, pagination, hits-per-page, stopwords, max candidates, result export, document edit/delete)
3. The system MUST retain the JSON mode with Monaco editor, query history, and raw parameter control
4. The system MUST detect collection-specific fields and dynamically show relevant business controls (vendor filter, delivery method, pin toggle, business sort modes) only when the collection schema contains the corresponding fields
5. The system MUST support business filter controls when applicable: vendor context (all vendors, featured only, specific vendor), delivery method filtering
6. The system MUST support pin-aware ranking toggle (with pins / without pins) when applicable
7. The system MUST provide a unified sort dropdown that combines business presets (Default, Price, Rating, Popularity) with field-based sort options derived from the collection schema — business presets appear first when applicable fields exist, followed by generic field-based options
8. The system MUST display facets with occurrence counts and multi-select capability
9. The system MUST remove the `/search/preview` route and `SearchPreview.vue` page entirely (no redirect needed — local self-hosted app)
10. The system MUST update the sidebar/navigation to remove the Search Preview link

### Non-Functional
- Performance: Search response time should not degrade from current behavior
- Compatibility: Must work with existing Typesense connection configuration

## Acceptance Criteria
- [ ] AC-001: Given a user navigates to a collection's search page, when the collection has business-relevant fields (vendor, delivery, pins), then business controls appear alongside InstantSearch/JSON modes; when the collection lacks those fields, only the standard search modes are shown
- [ ] AC-002: Given a user is in InstantSearch mode, when they use facets, sorting, pagination, and document actions, then all features work as they do today
- [ ] AC-003: Given a user is in JSON mode, when they edit parameters and search, then query history, export, and raw results work as they do today
- [ ] AC-004: Given a user selects a vendor filter context (all, featured, specific vendor, delivery method), when they search, then results are filtered accordingly
- [ ] AC-005: Given a user toggles pin-aware ranking, when they search, then sort order reflects the pin configuration
- [ ] AC-006: Given a user selects a business sort mode (price, rating, popularity), when they search, then results are sorted by that criteria
- [ ] AC-007: Given the `/search/preview` route, it no longer exists in the router (removed entirely)
- [ ] AC-008: Given a user opens the sidebar navigation, when they look for search options, then there is a single entry point (no separate "Search Preview" link)

## Dependencies
- **Blocks:** Nothing
- **Blocked by:** Nothing
- **Related:** None

## Technical Hints
- **Collection Search page:** `src/pages/Search.vue` (container with tabs for InstantSearch/JSON)
- **Search Preview page:** `src/pages/SearchPreview.vue` (standalone, custom controls)
- **InstantSearch component:** `src/components/search/SearchInstantSearch.vue`
- **JSON mode component:** `src/components/search/SearchJson.vue`
- **Result components:** `src/components/search/SearchResultItem.vue`, `SearchResultItemNestedDisplay.vue`, `SearchResultItemAttribute.vue`
- **Debounced input:** `src/components/search/DebouncedSearchBox.vue`
- **Store:** `src/stores/node.ts` (Pinia — collections, search, API access)
- **API layer:** `src/shared/api.ts` (Typesense client wrapper)
- **Routes:** `src/router/routes.ts`
- **Layout/nav:** `src/layouts/MainLayout.vue`
- Search Preview uses `typesense-instantsearch-adapter` v2.9.0 indirectly via the store; InstantSearch mode uses it directly
- Search Preview's business sort modes map to specific fields: `min_price:asc`, `avg_rating:desc`, `popularity:desc`, `default_rank_with_pin`/`default_rank`
- Search Preview's facets are built dynamically from collection schema fields

## Source Documents
| Document | Type | Location |
|----------|------|----------|
| (none) | — | — |

## Open Questions
1. **UI layout for business controls**: Business controls (vendor, delivery, pins) should live in the product area similar to Search Preview's current layout — left sidebar for facets, top controls for filters. Exact placement within the unified page tabs to be determined during spec.
2. **Field detection heuristics**: Which exact field names trigger business controls? Need to inspect the products collection schema to define the mapping (e.g., `vendor_ids` → vendor filter, `delivery_method` → delivery filter, `pin_priority`/`default_rank_with_pin` → pin toggle).
