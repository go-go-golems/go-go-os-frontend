---
Title: Intern guide to VM-controlled rich widget DSL packs and Kanban widget migration
Ticket: APP-14-RICH-WIDGET-DSL-PACKS
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
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Current QuickJS bootstrap boundary that constrains helper injection
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
      Note: Host projection and render boundary for post-APP-11 runtime packs
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoard.tsx
      Note: Current monolithic Kanban implementation analyzed and proposed for decomposition
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/kanbanState.ts
      Note: Reducer-backed domain state that anchors the proposed VM-friendly split
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/types.ts
      Note: Task and column domain types referenced by the refactor plan
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/primitives/WidgetToolbar.tsx
      Note: Reusable rich-widget primitive intended for extracted Kanban toolbar views
    - Path: ttmp/2026/03/06/APP-07-HYPERCARD-VM-RUNTIME-PLATFORM--analyze-hypercard-vm-runtime-inventory-prompt-path-and-extensible-dsl-platform/design-doc/01-hypercard-vm-inventory-prompt-path-and-extensible-dsl-runtime-platform-guide.md
      Note: Prior runtime-pack research that APP-14 concretizes for rich widgets
    - Path: ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/design-doc/01-intern-guide-to-hypercard-vm-boundary-simplification-runtime-flow-and-implementation-plan.md
      Note: State and dispatch boundary simplification that APP-14 builds on
ExternalSources: []
Summary: Detailed intern-facing guide for extending the post-APP-11 HyperCard runtime with an explicit `runtime.pack` discriminator and a first concrete `kanban.v1` pack, using Kanban Board as the case study for splitting domain logic, reusable view parts, and host renderers.
LastUpdated: 2026-03-10T10:15:00-04:00
WhatFor: Explain how to evolve the current QuickJS-generated card runtime into an explicit pack-based system that can drive complex widgets without exposing raw React or browser APIs to the VM, starting with a `kanban.v1` pack.
WhenToUse: Use when onboarding engineers to the runtime-pack design, when planning the Kanban refactor, or when implementing `runtime.pack`-aware VM-visible packs after APP-11.
---


# Intern guide to VM-controlled rich widget DSL packs and Kanban widget migration

## Executive Summary

The current HyperCard runtime is finally in the right shape to support richer UI generation. APP-11 removed the old split-state and split-dispatch API, so generated code now sees one semantic `state` object and emits one generic `dispatch(action)` stream. APP-07 already documented the next architectural step: runtime packs that choose prompt policy, bootstrap helpers, renderers, validators, and capabilities together.

What is still missing is a concrete path from "simple generated cards" to "generated code can control a rich widget." This document fills that gap by using the current `KanbanBoard` rich widget as the case study. The recommendation is not to expose React components directly to QuickJS. The recommendation is to refactor the Kanban implementation into three layers:

1. a serializable domain layer with reducer/actions/selectors
2. reusable presentational React view parts built from `@hypercard/rich-widgets` primitives and engine widgets
3. a runtime-pack renderer and DSL helper layer that maps VM-emitted structured nodes to those React parts

That design preserves the current safety boundary, lets the host retain responsibility for DOM-heavy behaviors like drag-and-drop and overlays, and still gives the VM meaningful control over composition, state transitions, and user workflows.

In short: do not make the VM render React. Make the VM describe structured widget intent, and make the host render that intent through split rich-widget components.

## Problem Statement

Today the system can do two useful things, but they are still separated:

- the HyperCard runtime can safely execute generated code in QuickJS and render a validated `ui.*` tree
- the `rich-widgets` package contains sophisticated React widgets such as Kanban, MacSlides, MermaidEditor, and MacBrowser

The gap is that the runtime only knows how to render a small, generic node set, while the rich widgets are still authored as ordinary React components that own too much composition and event behavior directly.

That causes four concrete problems.

### 1. The VM cannot reuse the rich widget library directly

The QuickJS sandbox cannot and should not receive raw React components, DOM handles, browser APIs, or a generic host callback bridge. The current bootstrap in `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js` only exposes `ui` helpers and expects the host to validate returned structured nodes. That is deliberate.

### 2. Rich widgets still bundle multiple concerns into one component

The current `KanbanBoard.tsx` mixes:

- domain state mutation through reducer actions
- filtering and board-level derived view logic
- React composition of toolbar, cards, columns, modal, and status bar
- DOM-specific drag-and-drop behavior
- standalone-vs-connected store wiring

That makes the widget easy to launch as an app window, but harder to drive through a VM-friendly DSL because there is no intermediate, reusable presentation layer.

### 3. A naive "just expose more APIs" answer would recreate the old boundary leak

APP-11 already documented why the runtime should not learn host topology. If we now solve rich widgets by handing the VM raw React-ish APIs, local component state semantics, or direct `fetch()`/DOM hooks, we will recreate the same problem at a more complex level.

### 4. Prompt policy and runtime policy still need one shared contract

APP-07 already established that changing a runtime DSL is not only a frontend change. It is also a prompt-pack change. If the rich widget story is going to work, the model must be taught the right widget-oriented DSL, and the runtime host must validate and render the same contract.

## Proposed Solution

The proposed solution is a pack-based runtime architecture with an explicit artifact discriminator.

### Core idea

Introduce a runtime-pack registry that sits on top of the APP-11 runtime contract. The first concrete pack should be `kanban.v1`, not a vague catch-all widget pack:

```text
generated prompt policy
  -> chooses runtime pack and helper vocabulary
  -> emits artifact with runtime.pack metadata and module code
  -> frontend artifact projection registers code and pack id
  -> QuickJS session loads pack-aware bootstrap helpers
  -> generated card returns structured rich-widget nodes
  -> host renderer maps those nodes to split rich-widget React parts
  -> user events emit semantic actions
  -> host reducers update semantic state
  -> runtime rerenders from projected state
```

### Key architectural rule

The VM should control:

- semantic state
- structured composition
- high-level interactions
- action dispatch

The host should control:

- React component implementation
- DOM-specific mechanics such as drag-and-drop
- overlays, focus, accessibility, layout edge cases
- async effects, retries, auth, logging, cancellation

### Recommended runtime pack model

This extends the APP-07 runtime-pack idea and makes it concrete for Kanban first.

```ts
interface RuntimePackDefinition {
  id: string;
  promptPolicy: string;
  artifactKind: string;
  artifactDiscriminator: {
    field: 'runtime.pack';
    value: string;
  };
  bootstrapModules: string[];
  validateView(value: unknown): unknown;
  renderView(value: unknown, ctx: RenderContext): ReactNode;
  defaultCapabilities: CapabilityPolicy;
}
```

Recommended first implementation:

```ts
const kanbanPack: RuntimePackDefinition = {
  id: 'kanban.v1',
  promptPolicy: 'prompt text for Kanban DSL',
  artifactKind: 'hypercard.card.v2',
  artifactDiscriminator: {
    field: 'runtime.pack',
    value: 'kanban.v1',
  },
  bootstrapModules: ['ui', 'widgets', 'format'],
  validateView: validateKanbanNodeTree,
  renderView: renderKanbanPackTree,
  defaultCapabilities: {
    domain: ['kanban'],
    system: ['nav.go', 'nav.back', 'notify.show'],
  },
};
```

The important design choice is that `artifactKind` does not need to fork immediately. The current `hypercard.card.v2` envelope can stay in place, and the pack can be selected through explicit metadata:

```yaml
runtime:
  pack: kanban.v1
```

That gives the frontend a clean discriminator without forcing a second artifact pipeline before it is justified.

### Recommended Kanban split

The current Kanban implementation should be split into three layers.

#### Layer A: Shared domain layer

Files that are already close to this target:

- `packages/rich-widgets/src/kanban/kanbanState.ts`
- `packages/rich-widgets/src/kanban/types.ts`
- `packages/rich-widgets/src/kanban/sampleData.ts`

This layer should own:

- task and column types
- reducer and actions
- seed creation
- selectors / derived data helpers
- serialization-safe state

This layer must remain independent of QuickJS and independent of launcher-specific wiring.

#### Layer B: Reusable React view parts

This is the missing middle layer. The current `KanbanBoard.tsx` should be decomposed into view parts such as:

- `KanbanToolbarView.tsx`
- `KanbanColumnLane.tsx`
- `KanbanTaskCardView.tsx`
- `KanbanTaskEditorModal.tsx`
- `KanbanStatusSummary.tsx`
- `kanbanSelectors.ts` or `kanbanViewModel.ts`

These parts should accept plain props and callbacks, and should reuse base rich-widget primitives such as:

- `WidgetToolbar`
- `WidgetStatusBar`
- `Separator`
- `ModalOverlay`
- engine `Btn`

This layer is still React, but it is no longer tied to one monolithic screen component.

#### Layer C: Runtime-pack renderer and DSL helpers

This layer is the VM-facing part.

It should define:

- rich-widget node kinds such as `kanban.toolbar`, `kanban.columnLane`, `kanban.taskCard`, `kanban.editorModal`
- `widgets.kanban.*` bootstrap helpers exposed to QuickJS
- a `kanban.v1` pack renderer that converts validated nodes into the Layer B React components

The VM never sees React. It sees structured helper calls and structured events.

## Design Decisions

### Decision 1: Do not inject raw React components into QuickJS

Rationale:

- QuickJS is not a React runtime
- React components are not serializable or schema-validatable
- exposing them would make prompt policy vague and runtime validation weak

Consequence:

- the runtime must continue to validate data structures, not component instances

### Decision 2: Do not inject raw async APIs such as `fetch()` into the VM

This follows APP-07 and APP-11 directly.

Rationale:

- the runtime service remains synchronous at the event boundary
- async work belongs in host effect bridges
- centralized auth, retries, cancellation, and logging should stay host-owned

Consequence:

- future rich-widget packs may expose declarative `effects.*` helpers, but those helpers must still emit actions or intents rather than performing raw side effects in-VM

### Decision 3: Start with `kanban.v1`, then generalize only if reuse appears

Rationale:

- Kanban is complex enough to stress the design
- Kanban already has reducer-backed state and visible extraction seams
- trying to generalize every widget first would produce a vague platform plan with no hard proof points
- the first discriminator and pack selection path should be proven against one widget-specific contract

Consequence:

- APP-14 should start with Kanban-specific decomposition and a real `kanban.v1` discriminator
- later widgets can follow once the pattern is proven and shared abstractions actually emerge

### Decision 4: Keep the pack explicit even if future packs share infrastructure

The future DSL should not be only one giant board primitive, and the runtime should not hide the fact that a specific pack is active.

Rationale:

- a single giant helper is easy to expose, but hard to extend
- too much detail in the VM would be equally bad

Recommended compromise:

- keep a small Kanban-specific node family
- optionally provide one high-level `widgets.kanban.board(...)` convenience helper that expands to those nodes
- keep the renderer free to reuse the extracted React parts underneath
- keep `runtime.pack = kanban.v1` explicit so prompt policy, validation, and rendering all agree on which contract is active

### Decision 5: Add a discriminator before adding a second artifact kind

Rationale:

- the current frontend already knows how to project `hypercard.card.v2` artifacts
- the current runtime registry already stores `runtimeCardId` and `runtimeCardCode`
- adding one explicit pack discriminator is cheaper than cloning the entire artifact pipeline immediately

Consequence:

- add `runtime.pack` metadata to generated artifacts
- extend artifact projection to persist `packId` alongside code
- let the runtime host choose bootstrap helpers and renderer from that discriminator
- revisit separate artifact kinds only if future packs genuinely need incompatible envelopes

## Current System Anatomy

### 1. What the runtime looks like today

The current runtime pipeline is spread across these key files:

- `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
- `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
- APP-07 design doc for pack-level direction
- APP-11 design doc for the simplified VM contract

Important current facts:

- generated bundles call `defineStackBundle(({ ui }) => ...)`
- render receives `{ state }`
- handlers receive `{ state, dispatch }`
- the host validates returned nodes and routes actions through capability checks

That is the correct base for richer packs.

### 2. What the Kanban widget looks like today

The current case-study files are:

- `packages/rich-widgets/src/kanban/KanbanBoard.tsx`
- `packages/rich-widgets/src/kanban/kanbanState.ts`
- `packages/rich-widgets/src/kanban/types.ts`
- `packages/rich-widgets/src/kanban/sampleData.ts`
- `packages/rich-widgets/src/launcher/modules.tsx`

Current responsibilities by file:

| File | Current responsibility | Keep? |
| --- | --- | --- |
| `kanbanState.ts` | reducer, actions, seed, selector | yes |
| `types.ts` | task and column types | yes |
| `sampleData.ts` | example tasks/columns | yes |
| `KanbanBoard.tsx` | composition, filtering, drag/drop, modal, standalone/connected wiring | split |
| `launcher/modules.tsx` | app/window registration | yes, but launcher-only |

### 3. Where the current Kanban code is already VM-friendly

Good existing traits:

- state is serializable
- actions are semantic (`upsertTask`, `moveTask`, `setFilterTag`, `clearFilters`, etc.)
- there is already a distinction between connected and standalone execution
- reusable primitives already exist in the package

### 4. Where the current Kanban code is not yet VM-friendly

Current blockers:

- filtering and derived grouping logic lives inside the monolithic component
- modal and toolbar composition are embedded directly in `KanbanBoard.tsx`
- drag/drop behavior is mixed into column rendering
- the VM would have no stable intermediate node contract to target

## Kanban Case Study: Target Decomposition

### Recommended file split

The Kanban package should move toward something like:

```text
packages/rich-widgets/src/kanban/
  types.ts
  sampleData.ts
  kanbanState.ts
  kanbanSelectors.ts
  kanbanViewModel.ts
  KanbanBoard.tsx
  KanbanToolbarView.tsx
  KanbanColumnLane.tsx
  KanbanTaskCardView.tsx
  KanbanTaskEditorModal.tsx
  KanbanStatusSummary.tsx
  kanbanPackNodes.ts
  kanbanPackRenderer.tsx
  kanbanPackHelpers.ts
```

### Recommended responsibility split

#### Domain layer

Owns:

- reducer
- action creators
- selectors
- serialization
- seed shapes

Must not own:

- JSX composition
- drag/drop DOM event handling
- overlay rendering

#### View-parts layer

Owns:

- rendering cards, columns, toolbar, modal, status summary
- base primitive reuse
- prop-driven rendering

Must not own:

- pack metadata
- VM helper definitions
- runtime host registration

#### Pack layer

Owns:

- DSL node definitions
- VM helper names
- renderer mapping
- node validation
- prompt-pack contract

Must not own:

- business logic implementation hidden from the host
- async effects in-VM

### Example view-part split

Pseudocode:

```tsx
function KanbanToolbarView(props: {
  searchQuery: string;
  filterTag: TagId | null;
  filterPriority: Priority | null;
  onCreate(): void;
  onSearchChange(value: string): void;
  onToggleTag(tag: TagId): void;
  onTogglePriority(priority: Priority): void;
  onClear(): void;
}) {
  return (
    <WidgetToolbar>
      ...
    </WidgetToolbar>
  );
}
```

```tsx
function KanbanColumnLane(props: {
  column: Column;
  visibleTasks: Task[];
  totalCount: number;
  collapsed: boolean;
  dragState: 'idle' | 'over';
  onToggleCollapse(): void;
  onCreate(): void;
  onDrop(taskId: string): void;
  onEdit(task: Task): void;
}) {
  return (...);
}
```

```tsx
function KanbanTaskEditorModal(props: {
  draft: Partial<Task>;
  columns: Column[];
  onSave(task: Task): void;
  onDelete(id: string): void;
  onClose(): void;
}) {
  return (
    <ModalOverlay onClose={props.onClose}>
      ...
    </ModalOverlay>
  );
}
```

This is the split that makes a pack renderer possible.

## VM-Facing DSL Design

### Bootstrap shape

The current bootstrap only gives `{ ui }`. For rich widgets, the pack should eventually expose something like:

```js
defineStackBundle(({ ui, widgets, format }) => ({
  cards: {
    board: {
      render({ state }) {
        const kanban = state.kanban;
        return ui.panel([
          widgets.kanban.toolbar({
            searchQuery: state.filters.searchQuery,
            filterTag: state.filters.filterTag,
            filterPriority: state.filters.filterPriority,
            onCreate: { handler: 'newTask' },
            onSearchChange: { handler: 'setSearch' },
          }),
          widgets.kanban.board({
            columns: kanban.columns,
            tasks: kanban.visibleTasks,
            collapsedCols: state.filters.collapsedCols,
            onDropTask: { handler: 'moveTask' },
            onEditTask: { handler: 'editTask' },
          }),
          widgets.kanban.statusSummary({
            total: kanban.totalCount,
            done: kanban.doneCount,
            high: kanban.highCount,
          }),
        ]);
      },
      handlers: {
        setSearch(ctx, args) {
          ctx.dispatch({ type: 'filters.set', payload: { path: 'searchQuery', value: args.value } });
        },
        moveTask(ctx, args) {
          ctx.dispatch({ type: 'kanban/moveTask', payload: args });
        },
      },
    },
  },
}));
```

### Recommended node family

Recommended Kanban node kinds:

- `kanban.toolbar`
- `kanban.board`
- `kanban.columnLane`
- `kanban.taskCard`
- `kanban.editorModal`
- `kanban.statusSummary`

This is intentionally more structured than generic `ui.row` / `ui.column`, but less opaque than one giant monolith.

### Event model

Events emitted by the host renderer should stay semantic:

- `newTask`
- `editTask`
- `saveTask`
- `deleteTask`
- `moveTask`
- `setSearch`
- `toggleTag`
- `togglePriority`
- `toggleCollapsed`
- `clearFilters`

The VM should not see DOM events like `dragenter`, `drop`, `mousedown`, or `textarea focus`.

## State And Action Contract

### Recommended projected state shape

For a Kanban runtime card, the projected state should follow the APP-11 model:

```ts
state = {
  self,
  nav,
  ui,
  filters: {
    searchQuery: string;
    filterTag: TagId | null;
    filterPriority: Priority | null;
    collapsedCols: Record<string, boolean>;
  },
  draft: {
    editingTask: Partial<Task> | null;
  },
  kanban: {
    tasks: Task[];
    columns: Column[];
    visibleTasksByColumn: Record<string, Task[]>;
    totalCount: number;
    doneCount: number;
    highCount: number;
  },
};
```

### Recommended action contract

Host-side reducers should still receive semantic actions:

```ts
dispatch({ type: 'filters.set', payload: { path: 'searchQuery', value: 'oauth' } });
dispatch({ type: 'filters.set', payload: { path: 'filterTag', value: 'bug' } });
dispatch({ type: 'draft.set', payload: { path: 'editingTask', value: { col: 'todo' } } });
dispatch({ type: 'kanban/upsertTask', payload: task });
dispatch({ type: 'kanban/deleteTask', payload: id });
dispatch({ type: 'kanban/moveTask', payload: { id, col } });
dispatch({ type: 'notify.show', payload: { message: 'Task saved' } });
```

This matches the post-APP-11 philosophy exactly: semantic state, semantic actions, no host topology leakage.

## Diagrams

### End-to-end runtime pack flow

```text
LLM prompt
  -> prompt middleware injects Kanban pack policy
  -> model emits hypercard.card.v2 artifact with runtime.pack = kanban.v1
  -> timeline stores artifact payload and generated module code
  -> artifact projection registers module + pack metadata
  -> PluginCardSessionHost loads QuickJS session
  -> pack-aware bootstrap exposes { ui, widgets, format }
  -> generated code returns structured rich-widget nodes
  -> host renderer validates and renders extracted React view parts
  -> user event becomes semantic runtime action
  -> host reducers update state
  -> VM rerenders from projected state
```

### Kanban-specific split

```text
Kanban domain layer
  types.ts
  kanbanState.ts
  selectors/view-model
        |
        v
Kanban view parts
  Toolbar
  Column lane
  Task card
  Editor modal
  Status summary
        |
        v
Kanban runtime pack
  node schema
  VM helper API
  host renderer
        |
        v
QuickJS generated card
  composes nodes
  dispatches semantic actions
```

## Implementation Plan

### Phase 0: Lock the design and file ownership

- confirm APP-14 as the design ticket
- treat APP-07 and APP-11 as prerequisites, not the implementation home
- decide that Kanban is the first migration target

### Phase 1: Refactor Kanban into split layers

Goals:

- leave `kanbanState.ts` as the canonical domain reducer
- extract presentational subcomponents from `KanbanBoard.tsx`
- add selectors/view-model helpers for derived board state

Concrete work:

1. extract `TaskCard` into `KanbanTaskCardView.tsx`
2. extract `TaskModal` into `KanbanTaskEditorModal.tsx`
3. extract toolbar into `KanbanToolbarView.tsx`
4. extract lane rendering into `KanbanColumnLane.tsx`
5. extract footer into `KanbanStatusSummary.tsx`
6. move derived grouping/filter logic into selectors or a `kanbanViewModel.ts`
7. reduce `KanbanBoard.tsx` to a thin assembly wrapper

Success criteria:

- `KanbanBoard.tsx` becomes orchestration, not implementation bulk
- extracted view parts can be reused by a future pack renderer

### Phase 2: Define the discriminator and `kanban.v1` pack contract

Goals:

- define node kinds and schemas
- define VM-visible helper surface
- define renderer entry points

Concrete work:

1. add `kanban.v1` pack definition and registry entry
2. keep `hypercard.card.v2` as the base artifact kind
3. add `runtime.pack` as an explicit artifact discriminator
4. add `widgets.*` helper namespace to bootstrap
5. add validation for widget node trees
6. add renderer mapping from node kinds to React view parts

### Phase 3: Define a Kanban-specific pack

Goals:

- prove the approach against one real widget

Concrete work:

1. add `kanban.v1` pack definition to the runtime pack registry
2. define `widgets.kanban.*` helpers
3. implement host renderer for the Kanban node family
4. map host DOM behavior like drag/drop and modal overlays into semantic actions/events
5. expose a projection shape that feeds the pack cleanly

### Phase 4: Prompt and artifact integration

Goals:

- make the model able to target the pack intentionally

Concrete work:

1. add pack-aware prompt policy describing the Kanban widget DSL and requiring `runtime.pack = kanban.v1`
2. add runtime artifact metadata carrying `runtime.pack`
3. extend artifact projection to persist `packId` beside `runtimeCardId` and `runtimeCardCode`
4. make runtime host/bootstrap/renderer selection depend on the discriminator

### Phase 5: Validation

Required tests:

- reducer tests for domain state
- Storybook stories for extracted view parts
- runtime service tests for helper injection and schema validation
- integration test:
  - generated artifact registered
  - `runtime.pack = kanban.v1` stored and chosen
  - card rendered
  - move/edit/create actions dispatched
  - rerender reflects new projected state

## Design Decisions With File References

- VM boundary: `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
- runtime host projection: `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
- runtime pack direction: APP-07 design doc
- simplified action/state contract: APP-11 design doc
- current rich-widget launcher registration: `packages/rich-widgets/src/launcher/modules.tsx`
- current Kanban monolith: `packages/rich-widgets/src/kanban/KanbanBoard.tsx`
- current Kanban domain reducer: `packages/rich-widgets/src/kanban/kanbanState.ts`
- current base primitives: `packages/rich-widgets/src/primitives/WidgetToolbar.tsx`, `ButtonGroup.tsx`, `SearchBar.tsx`

## Alternatives Considered

### Alternative A: Expose the full React widget directly to the VM

Rejected because:

- not schema-friendly
- not prompt-friendly
- breaks the safety boundary
- makes validation and portability poor

### Alternative B: Keep one giant `ui.*` DSL and keep adding generic node types forever

Rejected as the long-term answer because:

- it creates an increasingly vague mega-DSL
- it loses semantic structure for widget-specific behaviors
- it makes richer widgets harder to teach and validate

### Alternative C: Expose one opaque `widgets.kanban.board(...)` helper and stop there

Rejected as the final form because:

- it is too coarse-grained
- it would be hard to extend or mix with other widget families
- it hides useful reusable seams inside one black box

### Alternative D: Put async workflows directly in the widget VM API

Rejected for the same reason APP-07 rejected raw `fetch()`:

- async continuation does not belong inside the current QuickJS boundary
- centralized host effect infrastructure is safer and easier to reason about

## Implementation Guide For An Intern

### What to understand first

Read in this order:

1. APP-07 runtime-pack sections
2. APP-11 runtime-boundary sections
3. `stack-bootstrap.vm.js`
4. `PluginCardSessionHost.tsx`
5. `kanbanState.ts`
6. `KanbanBoard.tsx`
7. base rich-widget primitives used by Kanban

### What to avoid

- do not inject raw React, DOM, or browser APIs into QuickJS
- do not put drag/drop DOM event semantics into the VM contract
- do not add legacy compatibility wrappers around the APP-11 runtime API
- do not make the pack depend on launcher-only state shapes

### What to build first

- split Kanban view parts
- keep reducer semantics stable
- define node schema and renderer
- only then teach the model the new pack

### How to think about ownership

- VM owns: composition intent
- host owns: rendering implementation
- reducer owns: durable state transitions
- prompt pack owns: authoring guidance

## Open Questions

Open questions that should be resolved before coding:

- Should `kanban.editorModal` be a first-class node or a host-side overlay helper invoked by a board node?
- Should the first pack expose only Kanban-specific helpers, or also shared helpers like `widgets.modal`, `widgets.toolbar`, and `widgets.statusBar`?
- Should drag/drop emit a single semantic `moveTask` event only, or should the renderer expose richer hover feedback state back into projected UI state?
- Should the generic runtime artifact envelope replace `hypercard.card.v2`, or should rich widgets remain one family under a broader runtime envelope?

## References

- APP-07: `ttmp/2026/03/06/APP-07-HYPERCARD-VM-RUNTIME-PLATFORM--analyze-hypercard-vm-runtime-inventory-prompt-path-and-extensible-dsl-platform`
- APP-11: `ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary`
- `workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoard.tsx`
- `workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/kanbanState.ts`
- `workspace-links/go-go-os-frontend/packages/rich-widgets/src/primitives/WidgetToolbar.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
