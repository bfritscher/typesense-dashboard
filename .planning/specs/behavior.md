---
title: Sidebar Navigation Redesign - Behavior & Logic
---

# Sidebar Navigation Redesign - Behavior & Logic

## Overview

Restructure the Typesense Dashboard sidebar navigation to establish a consistent, grouped layout. The sidebar serves both developer/admin and business/operator users equally, organized by function. All items are grouped into 7 logical sections with uniform sizing, a prominent collection selector at the top, and auto-expanding groups on route navigation. Duplicate entries are consolidated and stale pages removed.

## User Journeys & Testing

### User Journey 1: Browsing the Sidebar

**Description**: A user opens the dashboard and sees a clean, consistently structured sidebar where every item belongs to a named group, all items are the same height, and the collection selector is the first interactive element.

**Independent Test**: Open the dashboard, verify the collection selector is at the top, all items are grouped, and no orphan flat items exist outside groups.

#### Scenario: Initial sidebar load
- **WHEN** the user opens the dashboard
- **THEN** the collection selector appears at the top of the sidebar with a "Collection" label
- **AND** all navigation items are organized into 7 groups: Server, Search, Merchandising, Relevance, Curations, Analytics, Configuration
- **AND** all items and group headers render at the same height (uniform dense sizing)
- **AND** group headers are visually distinguished by bold text only (not by size)

#### Scenario: No collection selected
- **WHEN** the user has not selected a collection
- **THEN** collection-dependent items (Search, Synonyms, Schema, Add Document) appear visually disabled (dimmed text, not clickable)
- **AND** disabled items remain visible so the user understands what is available

#### Scenario: Feature flags off
- **WHEN** a feature flag is false (e.g., `features.analyticsRules` is false)
- **THEN** the corresponding group or item is hidden entirely (not shown in the sidebar)

---

### User Journey 2: Selecting a Collection

**Description**: A user selects a collection from the top-of-sidebar dropdown, which enables all collection-dependent navigation items.

**Independent Test**: Select a collection from the dropdown, verify that Search, Synonyms, Schema, and Add Document items become active/clickable.

#### Scenario: Collection selected
- **WHEN** the user selects a collection from the collection selector
- **THEN** all collection-dependent items (Search, Synonyms, Schema, Add Document) become enabled and clickable
- **AND** clicking Search navigates to `/collection/:name/search`
- **AND** clicking Synonyms navigates to `/collection/:name/synonyms`
- **AND** clicking Schema navigates to `/collection/:name/schema`
- **AND** clicking Add Document navigates to `/collection/:name/document`

#### Scenario: Collection changed
- **WHEN** the user changes the selected collection
- **THEN** collection-dependent routes update to reflect the new collection name

---

### User Journey 3: Navigating to a Grouped Item

**Description**: A user clicks a navigation item or navigates via URL. The parent group auto-expands to show the active item in context.

**Independent Test**: Navigate to `/curations/overrides` via URL, verify the Curations group auto-expands and the Overrides item is highlighted as active.

#### Scenario: Navigate to a static route
- **WHEN** the user navigates to a static route (e.g., `/curations/overrides`)
- **THEN** the parent group (Curations) auto-expands
- **AND** the Overrides item is highlighted as active
- **AND** other groups remain in their current expanded/collapsed state

#### Scenario: Navigate to a dynamic collection-scoped route
- **WHEN** the user navigates to a dynamic route (e.g., `/collection/products/search`)
- **THEN** the parent group (Search) auto-expands
- **AND** the Search item is highlighted as active

#### Scenario: Manually collapse a group
- **WHEN** the user manually collapses a group
- **THEN** the group stays collapsed
- **AND** navigating to a child route of that group re-expands it

#### Scenario: Multiple groups open
- **WHEN** the user expands multiple groups
- **THEN** all expanded groups remain open simultaneously (no accordion behavior)

---

### User Journey 4: Accessing Overrides (Consolidated)

**Description**: The old collection-scoped Overrides page is removed. The single "Overrides" entry under Curations points to the operator OverridesVisual page.

**Independent Test**: Verify `/collection/:name/curations` returns a 404 / no match, and clicking Overrides in the sidebar navigates to `/curations/overrides`.

#### Scenario: Overrides navigation
- **WHEN** the user clicks "Overrides" under the Curations group
- **THEN** the user is navigated to `/curations/overrides` (OverridesVisual page)

#### Scenario: Old route removed
- **WHEN** a user or link attempts to navigate to `/collection/:name/curations`
- **THEN** the route does not match (old Overrides page no longer exists)

---

### User Journey 5: Active Item Visibility

**Description**: The active navigation item is clearly visible in both light and dark mode.

**Independent Test**: Navigate to any item, switch between light and dark mode, verify the active item has visible text contrast against its background.

#### Scenario: Light mode active item
- **WHEN** a navigation item is active in light mode
- **THEN** the item has a white background with dark text (e.g., primary color text)
- **AND** the text is clearly readable (no white-on-white)

#### Scenario: Dark mode active item
- **WHEN** a navigation item is active in dark mode
- **THEN** the item has a dark background (`#111827`) with white text

---

## Functional Requirements

- **FR-001**: System MUST display a collection selector dropdown at the top of the sidebar, labeled "Collection", always visible regardless of connection state.
- **FR-002**: System MUST organize all navigation items into exactly 7 groups: Server, Search, Merchandising, Relevance, Curations, Analytics, Configuration. No items may exist outside a group.
- **FR-003**: System MUST apply uniform `dense` sizing to all items and group headers. Group headers are distinguished by bold text weight only.
- **FR-004**: System MUST auto-expand a group when the user navigates to any of its child routes. For static routes, match by path prefix. For dynamic collection-scoped routes (`/collection/:name/*`), match by `$route.name` or path suffix (e.g., `/search` maps to Search group, `/synonyms` maps to Curations, `/schema` and `/document` map to Configuration).
- **FR-005**: System MUST allow multiple groups to be open simultaneously (not accordion). Groups stay expanded until manually collapsed.
- **FR-006**: System MUST render collection-dependent items (Search, Synonyms, Schema, Add Document) as visually disabled (dimmed, not clickable) when no collection is selected. Items remain visible.
- **FR-007**: System MUST hide feature-flag-gated items when their flag is false: Analytics group (`features.analyticsRules`), Aliases (`features.aliases`), API Keys (`features.apiKeys`), Search Presets (`features.searchPresets`), Stemming (`features.stemmingDictionaries`), Stopwords (`features.stopwords`), Cluster Status (`store.currentClusterTag`).
- **FR-008**: System MUST remove the old Overrides page (`src/pages/Overrides.vue`) and its route (`/collection/:name/curations`). The OverridesVisual page at `/curations/overrides` becomes the single "Overrides" entry.
- **FR-009**: System MUST rename the `/analyticsrules` route to `/analytics/rules` in both `routes.ts` and the NavMenu link. Add `name: 'AnalyticsRules'` to the route definition.
- **FR-010**: System MUST fix the light-mode active-item styling: add a dark text color (e.g., `color: var(--q-primary)`) so active items are readable against the white background.
- **FR-011**: System MUST relocate the "Search" item from its current flat position (below the collection selector) into the Search expansion group.

## Navigation Groups Reference

| Group | Items | Gating |
|---|---|---|
| **Server** | Server Status, Cluster Status | Always shown. Cluster Status: `store.currentClusterTag`. |
| **Search** | Search, Query Debugger, Autocomplete Preview | Search: selected collection (disabled if none). Debugger/Autocomplete: `store.isConnected`. |
| **Merchandising** | Product Positioning, Vendor Controls | `store.isConnected`. |
| **Relevance** | Ranking Formula, Search Weights | `store.isConnected`. |
| **Curations** | Overrides, Synonyms, Stopwords | Overrides: `store.isConnected`. Synonyms: selected collection (disabled if none). Stopwords: `features.stopwords`. |
| **Analytics** | Popular Queries, No-Results Queries, Search Health KPIs, Analytics Rules | Group hidden when `features.analyticsRules` is false. Search Health KPIs: `store.isConnected`. |
| **Configuration** | Collections, Aliases, API Keys, Search Presets, Stemming, Schema, Add Document | Collections: always. Aliases: `features.aliases`. API Keys: `features.apiKeys`. Search Presets: `features.searchPresets`. Stemming: `features.stemmingDictionaries`. Schema/Add Document: selected collection (disabled if none). |

## Success Criteria

### Measurable Outcomes

- **SC-001**: All sidebar items belong to one of 7 named groups — zero orphan flat items.
- **SC-002**: Collection selector is the first interactive element in the sidebar.
- **SC-003**: All items render at the same height (verified by visual inspection in both expanded and collapsed states).
- **SC-004**: Navigating to any route auto-expands the correct parent group within the same render cycle.
- **SC-005**: Active item text is readable in both light and dark mode (sufficient contrast ratio).

## Edge Cases

- What happens when the Typesense server is disconnected? Only Server Status and Collections are accessible; all `store.isConnected`-gated items are hidden or disabled per their group rules.
- What happens when all feature flags are off? Only Server and Configuration (Collections only) groups have visible items. Other groups are entirely hidden.
- What happens when the user manually collapses a group, then navigates to a child of that group via URL? The group re-expands to show the active item.
- What happens when the selected collection is deleted while viewing a collection-scoped page? Collection-dependent items revert to disabled state. The current page may show an error (out of scope for this initiative — page-level handling).

## Open Questions

None.
