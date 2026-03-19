# Work Definition: Sidebar Navigation Redesign

## Meta
- **Type:** UI Refactor
- **JIRA:** None
- **Created:** 2026-03-19
- **Author:** renato-dransay

## Context
The sidebar navigation in the Typesense Dashboard is messy: items have inconsistent sizes, there's no grouping standard, the collection selector is buried, and there are duplicate entries (Curations appears twice pointing to different pages). The dashboard serves both developer/admin users and business/operator users equally, so the sidebar needs a clean, function-based organization.

## Scope
### In Scope
- [ ] Move collection selector to the top of the sidebar with a "Collection" label
- [ ] Group all nav items into 7 logical sections: Server, Search, Merchandising, Relevance, Curations, Analytics, Configuration
- [ ] Apply uniform `dense` sizing to all items (headers and children)
- [ ] Auto-expand groups when navigating to a child route (multiple groups can be open)
- [ ] Relocate the flat "Search" item into the Search expansion group
- [ ] Consolidate Curations: drop old `Overrides.vue` page and `/collection/:name/curations` route; keep `OverridesVisual` as the single "Overrides" entry
- [ ] Rename `/analyticsrules` route to `/analytics/rules` for consistency
- [ ] Collection-dependent items show as disabled (not hidden) when no collection selected
- [ ] Feature-flag-gated items remain hidden when their flag is false
- [ ] Fix light-mode active-item text color bug (white text on white background)

### Out of Scope
- Changing page content or functionality (only navigation and routing)
- Adding new pages or features
- Responsive/mobile navigation changes
- Theming or color changes beyond fixing the active-item light mode issue

## Requirements
### Functional
1. The sidebar MUST have a prominent collection selector dropdown at the very top, labeled "Collection"
2. The sidebar MUST organize all items into 7 groups: Server, Search, Merchandising, Relevance, Curations, Analytics, Configuration — no orphan flat items
3. All items and group headers MUST use uniform `dense` sizing; group headers distinguished by bold text only
4. Groups MUST auto-expand when the user navigates to a child route, and stay expanded until manually collapsed
5. Multiple groups MUST be able to be open simultaneously (not accordion)
6. The Search item (`/collection/:name/search`) MUST appear inside the Search group
7. The old Overrides page (`/collection/:name/curations`) MUST be removed; OverridesVisual (`/curations/overrides`) becomes the single "Overrides" entry under Curations
8. The `/analyticsrules` route MUST be renamed to `/analytics/rules`
9. Collection-dependent items (Search, Synonyms, Schema, Add Document) MUST render as disabled/dimmed when no collection is selected — always visible
10. Feature-flag-gated items MUST be hidden when their flag is false

### Non-Functional
- No performance impact — sidebar is static navigation
- Must work in both light and dark mode

## Acceptance Criteria
- [ ] AC-001: All sidebar items belong to one of 7 named groups; no flat/ungrouped items exist
- [ ] AC-002: Collection selector is the first element in the sidebar with a visible "Collection" label
- [ ] AC-003: All items and group headers render at the same height (uniform dense sizing)
- [ ] AC-004: Navigating to a route auto-expands the parent group (works for both static and dynamic collection-scoped routes)
- [ ] AC-005: The old `/collection/:name/curations` route and its nav item are removed
- [ ] AC-006: `/analyticsrules` is renamed to `/analytics/rules` in both routes and nav
- [ ] AC-007: Collection-dependent items show as disabled (not hidden) when no collection is selected
- [ ] AC-008: Active item in light mode has visible text (no white-on-white)

## Dependencies
- **Blocks:** Nothing
- **Blocked by:** Nothing

## Technical Hints
- **NavMenu component:** `src/components/NavMenu.vue` — full sidebar content, uses `q-expansion-item` for groups
- **Router:** `src/router/routes.ts` — all routes under MainLayout
- **Old Overrides page:** `src/pages/Overrides.vue` — to be removed
- **New Overrides page:** `src/pages/OverridesVisual.vue` — stays as the single "Overrides"
- **Store:** `src/stores/node.ts` — `store.isConnected`, `store.data.features.*`, `store.currentClusterTag`
- Auto-expand logic: For static routes, match path prefix. For dynamic routes (`/collection/:name/*`), match on `$route.name` or path suffix
- Existing `sections` reactive object in NavMenu needs `server` and `configuration` keys added
- Feature flag names: `features.aliases`, `features.apiKeys`, `features.searchPresets`, `features.stemmingDictionaries`, `features.stopwords`, `features.analyticsRules`
- Light-mode active-item fix: add `color: var(--q-primary)` or equivalent dark text class

## Navigation Groups Reference

| Group | Items | Gating |
|---|---|---|
| **Server** | Server Status, Cluster Status | Always shown. Cluster Status visible only when `store.currentClusterTag` is set. |
| **Search** | Search, Query Debugger, Autocomplete Preview | Search requires a selected collection (disabled when none). Debugger and Autocomplete require `store.isConnected`. |
| **Merchandising** | Product Positioning, Vendor Controls | Require `store.isConnected`. |
| **Relevance** | Ranking Formula, Search Weights | Require `store.isConnected`. |
| **Curations** | Overrides, Synonyms, Stopwords | Overrides requires `store.isConnected`. Synonyms requires a selected collection (disabled when none). Stopwords requires `features.stopwords`. |
| **Analytics** | Popular Queries, No-Results Queries, Search Health KPIs, Analytics Rules | Group hidden when `features.analyticsRules` is false. Search Health KPIs additionally requires `store.isConnected`. |
| **Configuration** | Collections, Aliases, API Keys, Search Presets, Stemming, Schema, Add Document | Collections always shown. Aliases: `features.aliases`. API Keys: `features.apiKeys`. Search Presets: `features.searchPresets`. Stemming: `features.stemmingDictionaries`. Schema and Add Document require a selected collection (disabled when none). |

## Routes Cleanup

| Current Route | Action |
|---|---|
| `/collection/:name/curations` | Remove from both `routes.ts` and `NavMenu.vue`. |
| `/curations/overrides` | Keep (renamed to "Overrides" in nav) |
| `/analyticsrules` | Rename to `/analytics/rules` in `routes.ts` and NavMenu. Add `name: 'AnalyticsRules'`. |

## Open Questions
None — design was validated through brainstorming session.
