# Implementation Tasks: Sidebar Navigation Redesign

Source spec: .planning/specs/behavior.md
Test strategy: no test plan
Generated at: 2026-03-19T19:47:00Z

## Context Management
- Clear AI context between task groups (after each `## Group` section).
- Each task group is designed to be self-contained — include the spec section and relevant file paths when starting a new context.

## Foundation

- [x] **T-001**: Remove the old Overrides route and page
  - Files: `src/router/routes.ts` (modify), `src/pages/Overrides.vue` (delete)
  - Files-write: `src/router/routes.ts`, `src/pages/Overrides.vue`
  - Spec ref: FR-008, UJ4
  - Done when: `/collection/:name/curations` route no longer exists in routes.ts and `src/pages/Overrides.vue` is deleted

- [x] **T-002**: Rename `/analyticsrules` route to `/analytics/rules`
  - Files: `src/router/routes.ts` (modify)
  - Files-write: `src/router/routes.ts`
  - Spec ref: FR-009
  - Done when: Route path is `analytics/rules` with `name: 'AnalyticsRules'` and old `analyticsrules` path no longer exists

## Group 1: Sidebar Structure Redesign

> Spec ref: User Journey 1 in behavior.md
> Parallelizable-with: — (depends on Foundation)
> Context-include:
>   - specs/behavior.md ## User Journey 1: Browsing the Sidebar
>   - specs/behavior.md ## Functional Requirements → FR-001, FR-002, FR-003, FR-006, FR-007, FR-011
>   - specs/behavior.md ## Navigation Groups Reference
>   - specs/behavior.md ## Edge Cases

- [x] **T-003**: Move collection selector to the top of the sidebar
  - Files: `src/components/NavMenu.vue` (modify)
  - Files-write: `src/components/NavMenu.vue`
  - Spec ref: FR-001, UJ1 Scenario "Initial sidebar load"
  - Done when: The `q-select` for collection selection is the first element inside `q-list`, wrapped with a "Collection" label, with distinct styling (padding/background)

- [x] **T-004**: Create Server expansion group with Server Status and Cluster Status
  - Files: `src/components/NavMenu.vue` (modify)
  - Files-write: `src/components/NavMenu.vue`
  - Spec ref: FR-002, Navigation Groups Reference (Server)
  - Done when: Server Status and Cluster Status are inside a `q-expansion-item` labeled "Server" with `dense` and bold header. Cluster Status retains `v-if="!!store.currentClusterTag"` gating. `sections` reactive object has a `server` key.

- [x] **T-005**: Relocate Search item into the Search expansion group
  - Files: `src/components/NavMenu.vue` (modify)
  - Files-write: `src/components/NavMenu.vue`
  - Spec ref: FR-011, FR-006, Navigation Groups Reference (Search)
  - Done when: The Search item (linking to `/collection/:name/search`) is inside the Search expansion group as the first child, with `:disable="!currentCollection"` and `dense`. The old flat Search item below the collection selector is removed.

- [x] **T-006**: Create Configuration expansion group
  - Files: `src/components/NavMenu.vue` (modify)
  - Files-write: `src/components/NavMenu.vue`
  - Spec ref: FR-002, Navigation Groups Reference (Configuration)
  - Done when: Collections, Aliases, API Keys, Search Presets, Stemming, Schema, and Add Document are inside a `q-expansion-item` labeled "Configuration" with `dense` and bold header. Each item retains its existing gating. Schema and Add Document use `:disable="!currentCollection"`. `sections` reactive object has a `configuration` key. The old flat items and separators are removed.

- [x] **T-007**: Remove old flat Curations item and apply uniform `dense` sizing
  - Files: `src/components/NavMenu.vue` (modify)
  - Files-write: `src/components/NavMenu.vue`
  - Spec ref: FR-002, FR-003, FR-008
  - Done when: The old flat "Curations" item (linking to `/collection/:name/curations`) is removed. All `q-expansion-item` headers and all `q-item` children use `dense`. No non-dense items remain. Both `q-separator` elements are removed.

- [x] **T-008**: Update Analytics Rules NavMenu link to `/analytics/rules`
  - Files: `src/components/NavMenu.vue` (modify)
  - Files-write: `src/components/NavMenu.vue`
  - Spec ref: FR-009
  - Done when: The Analytics Rules `q-item` `to` attribute points to `/analytics/rules` instead of `/analyticsrules`

## Group 2: Auto-expand and Active Item Styling

> Spec ref: User Journey 3, User Journey 5 in behavior.md
> Parallelizable-with: — (depends on Group 1)
> Context-include:
>   - specs/behavior.md ## User Journey 3: Navigating to a Grouped Item
>   - specs/behavior.md ## User Journey 5: Active Item Visibility
>   - specs/behavior.md ## Functional Requirements → FR-004, FR-005, FR-010
>   - specs/behavior.md ## Edge Cases

- [x] **T-009**: Implement route-watching auto-expand logic
  - Files: `src/components/NavMenu.vue` (modify)
  - Files-write: `src/components/NavMenu.vue`
  - Spec ref: FR-004, FR-005, UJ3
  - Done when: A `watch` on `$route` (or `route.path`/`route.name`) expands the correct parent group when navigating. Static routes match by path prefix (e.g., `/curations/` → curations). Dynamic routes match by path suffix (`/search` → search, `/synonyms` → curations, `/schema` and `/document` → configuration). Multiple groups can be open simultaneously. Manually collapsed groups re-expand on child navigation.

- [x] **T-010**: Fix light-mode active-item text color
  - Files: `src/components/NavMenu.vue` (modify)
  - Files-write: `src/components/NavMenu.vue`
  - Spec ref: FR-010, UJ5
  - Done when: The scoped CSS for `.q-item.q-router-link--active` in light mode includes a dark text color (e.g., `color: var(--q-primary)`) so active items are readable against the white background

## Summary

- Total tasks: 10
- Foundation tasks: 2
- Journey groups: 2
- Estimated context sessions: 3 (Foundation + Group 1 + Group 2)

## Parallelism Analysis

| Group | Files-write (unique) | Can run with |
|-------|---------------------|--------------|
| Foundation | `src/router/routes.ts`, `src/pages/Overrides.vue` | — (must run first) |
| Group 1 | `src/components/NavMenu.vue` | — (depends on Foundation) |
| Group 2 | `src/components/NavMenu.vue` | — (depends on Group 1) |

Dispatch waves:
1. Foundation
2. Group 1
3. Group 2
