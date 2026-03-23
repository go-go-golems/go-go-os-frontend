---
Title: Intern guide to expanding kanban runtime primitives beyond a single board root
Ticket: APP-20-KANBAN-PRIMITIVE-EXPANSION
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx
      Note: Current kanban.v1 validator and renderer
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoardView.tsx
      Note: Current monolithic host view composition for Kanban
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/types.ts
      Note: Current hardcoded taxonomy types
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/runtime.ts
      Note: Current Kanban runtime export seam
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/docs/kanban-pack.docs.vm.js
      Note: Current VM-facing docs describing only widgets.kanban.board
ExternalSources: []
Summary: Detailed design and implementation guide for the direct-cutover Kanban refactor that replaced the old monolithic board helper with a compositional page-style primitive family and Storybook-backed host widgets.
LastUpdated: 2026-03-10T01:17:00-04:00
WhatFor: Use this guide when reviewing or extending the shipped Kanban page DSL so headers, filters, highlights, issue taxonomies, and board shells can vary independently while staying VM-safe.
WhenToUse: Use after APP-20, when extracting new Kanban widgets, or when authoring new page-style Kanban demo cards.
---

# Intern guide to expanding kanban runtime primitives beyond a single board root

## Executive Summary

`kanban.v1` successfully proved the runtime-pack model, but its first version was too coarse. The pack originally exposed only `widgets.kanban.board({...})`, and the host renderer treated the entire Kanban experience as one board-shaped primitive. That made every example card look like the same board with different data.

APP-20 implemented the next step directly in place. Instead of adding more lookalike cards or creating a parallel `kanban.v2`, it replaced the old contract with a compositional page DSL:

- `widgets.kanban.page(...)`
- `widgets.kanban.taxonomy(...)`
- `widgets.kanban.header(...)`
- `widgets.kanban.filters(...)`
- `widgets.kanban.highlights(...)`
- `widgets.kanban.board(...)`
- `widgets.kanban.status(...)`

This means:

- extracting header/toolbar/status pieces into reusable host widgets
- allowing runtime-configured issue types and labels instead of fixed enums
- introducing richer, smaller Kanban primitives or config objects
- pairing each extracted widget with Storybook coverage so the host UI remains inspectable outside the runtime path

## Problem Statement

The user called out three concrete problems:

- the header bar should be separable into its own submodules
- custom bug types and other issue categories should be configurable
- example cards all collapse into one `kanban.board` shape because the primitive surface is too narrow

The code supports that assessment.

### 1. The pack only supports one root primitive

`kanbanV1Pack.tsx` validates one node shape:

```ts
interface KanbanV1Node {
  kind: 'kanban.board';
  props: { ... }
}
```

and explicitly rejects any other root kind.

That means the current pack has no first-class room for:

- `kanban.header`
- `kanban.toolbar`
- `kanban.status`
- `kanban.taxonomy`
- `kanban.lane`

unless those concepts are all stuffed back into the `board` prop bag.

### 2. The host view still welds board chrome together

`KanbanBoardView` currently owns:

- the top toolbar
- search field
- filter chips
- clear button
- lane headers and lane counts
- the status bar
- the editing modal

all in one component. So even if the VM wanted to vary those pieces, the host seam is still too bundled.

### 3. Taxonomy is hardcoded

`types.ts` still fixes:

- `Priority = 'high' | 'medium' | 'low'`
- `TagId = 'bug' | 'feature' | 'urgent' | 'design' | 'docs'`

That blocks boards that want:

- custom bug types
- product-specific labels
- severity versus priority as separate concepts
- per-board icons/colors/orderings

### 4. The docs teach the narrow contract

The VM docs explicitly say the Kanban pack exposes a single `kanban.board` root through `widgets.kanban.board(...)`. That is accurate today, but it also freezes the current limitation into the authoring model.

## Proposed Solution

Keep the runtime-pack idea, but split the Kanban surface into a smaller family of structured primitives and config objects.

### Implemented direction

Move from:

```ts
widgets.kanban.board({...})
```

toward a page-style family such as:

```ts
widgets.kanban.page(
  widgets.kanban.taxonomy({...}),
  widgets.kanban.header({...}),
  widgets.kanban.highlights({...}),
  widgets.kanban.board({...}),
  widgets.kanban.status({...}),
)
```

and:

```ts
widgets.kanban.taxonomy({
  issueTypes: [
    { id: 'crash', label: 'Crash', icon: '💥', color: 'red' },
    { id: 'regression', label: 'Regression', icon: '↩️', color: 'orange' },
    { id: 'ux', label: 'UX', icon: '🎯', color: 'blue' },
  ],
  priorities: [
    { id: 'p0', label: 'P0', icon: '🔥' },
    { id: 'p1', label: 'P1', icon: '⚠️' },
    { id: 'p2', label: 'P2', icon: '•' },
  ],
})
```

The point is not to expose React. The point is to expose semantic Kanban building blocks at a smaller granularity while letting authors compose them in a React-like style.

### Primitive families

#### Page primitives

- `widgets.kanban.page(...)`
- `widgets.kanban.header(...)`
- `widgets.kanban.filters(...)`
- `widgets.kanban.highlights(...)`
- `widgets.kanban.status(...)`

These let the VM decide which standard host shell pieces are present and in what order.

#### Board primitives

- `widgets.kanban.board(...)`
- `widgets.kanban.lane(...)`
- `widgets.kanban.issueList(...)`

These separate overall board structure from per-lane composition.

#### Taxonomy primitives

- `widgets.kanban.taxonomy(...)`
- `widgets.kanban.issueTypeChip(...)`
- `widgets.kanban.labelChip(...)`
- `widgets.kanban.priorityChip(...)`

These let boards configure issue systems declaratively instead of relying on fixed enums.

#### Editor/form primitives

- `widgets.kanban.issueEditor(...)`
- `widgets.kanban.fieldGroup(...)`

These preserve host-owned form rendering while allowing per-board field variation.

### Versioning outcome

The user explicitly rejected compatibility work. APP-20 therefore replaced `kanban.v1` in place instead of introducing `kanban.v2`.

Why that was acceptable here:

- the pack was still internal and demo-driven
- all first-party demo cards could be updated in the same change
- the validator, docs, stories, and generated VM metadata were all updated together

## Design Decisions

### Decision 1: split semantic Kanban primitives, not raw UI primitives

The VM should still talk in board-specific concepts such as header, lane, taxonomy, or status metrics. It should not construct raw host layout widgets directly.

### Decision 2: replace hardcoded taxonomy enums with descriptor-driven config

Custom bug types, severities, and labels are an actual product need, not a cosmetic extra. The type system and runtime-pack validator should move to descriptor arrays and maps rather than fixed unions.

### Decision 3: require Storybook for every extracted host primitive

Every extracted Kanban widget or host submodule should get Storybook coverage. That includes:

- header/toolbar widgets
- taxonomy chips
- lane header/list primitives
- status/summary widgets

Reason:

- runtime-pack work is easier to review when host pieces can be exercised directly
- it prevents “hidden” widget extraction where only the VM path proves the component
- it keeps the rich-widget layer reusable outside the runtime pack

### Decision 4: mutate `kanban.v1` in place and update all callers

The user explicitly preferred a direct cutover over compatibility layers. Because the only consumers were first-party demos and internal runtime tests, replacing the contract in place was cheaper and clearer than carrying a second pack version.

## Alternatives Considered

### Alternative A: keep one `kanban.board` root and add more optional props

Rejected because it just recreates the current monolith with a larger prop bag.

### Alternative B: add more example cards without changing the primitive family

Rejected because the examples would still all reduce to the same one-piece board contract.

### Alternative C: expose raw `ui.*` primitives and let Kanban be built manually

Rejected because it loses the value of a semantic Kanban pack and pushes too much host detail back into VM authoring.

## Implementation Plan

### Phase 1: extract host widgets from `KanbanBoardView`

Target likely files:

- `KanbanHeaderBar.tsx`
- `KanbanToolbar.tsx`
- `KanbanStatusBar.tsx`
- `KanbanLaneView.tsx`

Requirement:

- every extracted widget must get Storybook stories

### Phase 2: replace fixed taxonomy types

Target files:

- `types.ts`
- `KanbanTaskCard.tsx`
- `KanbanTaskModal.tsx`
- runtime-pack validator/types

Goal:

- make issue types, labels, and priorities configurable descriptors

### Phase 3: replace `kanban.v1` with the page DSL

Target files:

- new runtime-pack contract file
- new VM pack docs
- new example cards

Pseudocode:

```ts
type KanbanV1Node =
  | { kind: 'kanban.page'; children: KanbanPageChildNode[] }
  | { kind: 'kanban.board'; props: { lanes: KanbanLaneNode[]; taxonomy?: KanbanTaxonomy } }
  | { kind: 'kanban.header'; props: { title: string; controls: KanbanControlNode[] } }
  | { kind: 'kanban.highlights'; props: { items: KanbanHighlightNode[] } }
  | { kind: 'kanban.status'; props: { items: KanbanMetricNode[] } };
```

### Phase 4: add richer example cards

Examples should demonstrate:

- bug triage with custom incident taxonomy
- a single-lane focus inbox
- a two-lane release cutline
- a denser sprint radar with a highlight strip

### Phase 5: migrate docs and prompt guidance

Update:

- runtime-pack docs
- generated VM docs
- inventory prompt policy examples
- Storybook grouping for the new host widgets

## Open Questions

 - Should `widgets.kanban.page(...)` eventually grow smaller lane-level composition helpers, or is the current split enough?
 - Should taxonomy descriptors always live at page level, or should nested board-local overrides be allowed?
 - Should issue editor configuration stay implicit in taxonomy plus handlers, or become an explicit node later?

## References

- [kanbanV1Pack.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx)
- [KanbanBoardView.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoardView.tsx)
- [types.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/types.ts)
- [runtime.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/runtime.ts)
- [kanban-pack.docs.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/docs/kanban-pack.docs.vm.js)
