---
Title: Runtime pack implementation playbook
Ticket: APP-15-HYPERCARD-KANBAN-PACK-IMPLEMENTATION
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts
      Note: Artifact parser seam for runtime.pack
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: VM bootstrap seam where pack-specific helper injection is selected
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
      Note: Runtime host seam where pack-specific validation and rendering are selected
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoard.tsx
      Note: Kanban widget seam being split into VM-usable host-rendered pieces
ExternalSources: []
Summary: Living implementation playbook for adding explicit runtime packs to HyperCard VM runtimes, with `kanban.v1` as the first concrete pack and a direct, no-wrapper cutover strategy.
LastUpdated: 2026-03-10T20:58:00-04:00
WhatFor: Use this playbook when implementing, reviewing, or extending runtime packs so the discriminator, VM helper injection, host rendering, and widget extraction stay coherent across slices and future packs.
WhenToUse: Use when adding a new runtime pack, reviewing the kanban.v1 pack path, or onboarding someone to the runtime-pack architecture and implementation sequence.
---

# Runtime pack implementation playbook

## Goal

This playbook captures the concrete implementation rules for runtime packs in the HyperCard VM path. It is intentionally procedural. The point is not to restate APP-14 at a high level. The point is to explain how to actually land a pack in this codebase without falling back into implicit contracts, wrappers, or cross-layer ambiguity.

The first concrete target is `kanban.v1`. That choice matters. We are not building a generic “rich widget pack” abstraction first and hoping the Kanban case fits later. We are building the minimal explicit runtime-pack system that is strong enough to support one real non-`ui.*` DSL now, while still being clean to extend later.

## Core Terms

- `runtime.pack`
  - Artifact metadata field on `hypercard.card.v2`.
  - Selects which VM DSL/helpers and host renderer/validator apply to the card.
- `packId`
  - Frontend/runtime name for the parsed `runtime.pack` discriminator.
- `ui.card.v1`
  - The baseline pack for the existing structured `ui.*` node DSL.
- `kanban.v1`
  - The first concrete non-`ui.*` pack.
  - Produces a Kanban-specific render tree and is rendered by host-side Kanban UI components.
- `runtime pack registry`
  - Frontend registry that knows:
    - which pack IDs exist
    - how to validate each pack’s render tree
    - how to render each pack’s validated tree in React
- `VM helper injection`
  - The per-pack API passed into card factories inside `stack-bootstrap.vm.js`.
  - Example:
    - `ui.card.v1` injects `ui`
    - `kanban.v1` injects `widgets.kanban`
- `semantic state`
  - The APP-11 rule that VM state exposes product/domain concepts like `draft`, `filters`, and domain slices, not raw storage topology.

## Non-Negotiable Rules

- Do not add wrapper APIs that preserve the old implicit single-pack model.
- Do not bury pack choice in host heuristics. Use `runtime.pack`.
- Do not expose raw React components or DOM objects to the VM.
- Do not make the host depend on Redux action creator shapes as the long-term Kanban contract.
- Do not let `kanban.v1` silently fall back to `ui.card.v1` rendering.
- Do not treat pack metadata, VM helpers, and host rendering as separate optional concerns. They are one contract.

## Runtime Pack Contract

A runtime pack is one explicit contract bundle. In this codebase, that bundle has these parts:

1. Artifact discriminator
   - `runtime.pack` on the artifact envelope.
2. Registry entry
   - a pack ID and a validator/renderer pair in the frontend registry.
3. VM helper surface
   - the helper object injected into `defineCard(...)` factories for that pack.
4. Render tree schema
   - the tree shape the VM may return for that pack.
5. Host renderer
   - the React implementation that turns that tree into UI.
6. Event bridge
   - the mapping from host interactions back to VM handler calls and then runtime actions.
7. Prompt policy
   - the authoring instructions that tell the model which envelope metadata and DSL to emit.

## Current Implementation Sequence

### Slice 1: Artifact discriminator and projection

Goal: make `runtime.pack` real metadata in the frontend state and runtime card registry before touching rendering.

Files:
- `packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts`
- `packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.ts`
- `packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts`
- `packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.ts`

Output:
- artifact parser reads `runtime.pack`
- artifact state stores `packId`
- runtime card registry stores `packId`

### Slice 2: Runtime-pack registry and host selection

Goal: make pack choice affect both VM helper injection and host render validation.

Files:
- `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
- `packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
- `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
- `packages/hypercard-runtime/src/runtime-packs/*`

Output:
- `defineCard(...)` receives per-pack helper injection
- host render path validates tree shape by pack
- host render path chooses renderer by pack

### Slice 3: Kanban widget split

Goal: replace the temporary “host adapts to existing Kanban internals” path with explicit, reusable view components.

Files:
- `packages/rich-widgets/src/kanban/KanbanBoard.tsx`
- new extracted view-part files in `packages/rich-widgets/src/kanban/`
- Storybook stories for every new extracted piece

Output:
- thin `KanbanBoard.tsx` assembly wrapper
- reusable host-rendered Kanban parts for `kanban.v1`
- event surface based on Kanban semantics, not Redux action internals

### Slice 4: Prompt and authoring cutover

Goal: make generated artifacts emit the explicit pack contract.

Files:
- inventory prompt policy files
- any authoring fixtures/examples that should target `kanban.v1`

Output:
- Kanban-targeting artifacts emit `runtime.pack: kanban.v1`
- VM code for the card uses the `kanban.v1` helper surface

Implementation rule:

- pack metadata lives in the structured card payload as `data.runtime.pack`
- backend extractors, timeline entities, and frontend artifact parsers must all preserve that exact nesting
- do not invent a second top-level `runtime` shape for the same card envelope

## End-To-End Data Flow

```text
artifact event
  -> artifactRuntime.ts parses runtime.pack
  -> artifactsSlice stores packId
  -> artifactProjectionMiddleware registers runtime card with packId
  -> runtimeCardRegistry retains { cardId, code, packId }
  -> PluginCardSessionHost injects card into VM with packId
  -> stack-bootstrap.vm.js chooses helper injection from packId
  -> card render() returns pack-specific tree
  -> host resolves pack from current card
  -> runtime pack registry validates tree
  -> runtime pack registry renders host UI
  -> host UI interactions call VM handlers
  -> handlers dispatch semantic runtime actions
```

Important nesting detail:

- the emitted `hypercard.card.v2` payload shape is:
  - `title`
  - `name`
  - `data.artifact`
  - `data.runtime.pack`
  - `data.card`
- if one layer reads `runtime.pack` from the wrong level, the discriminator silently disappears even though the artifact still renders

## VM Bootstrap Responsibilities

`stack-bootstrap.vm.js` is where pack-specific helper injection becomes real. That file is the runtime seam that decides what a card factory sees.

Current rule:

- `ui.card.v1`
  - inject `{ ui }`
- `kanban.v1`
  - inject `{ widgets }`, where `widgets.kanban.board(...)` builds the Kanban render node

Recommended implementation pattern:

```js
function normalizePackId(packId) {
  return typeof packId === 'string' && packId.trim() ? packId.trim() : 'ui.card.v1';
}

function createPackHelpers(packId) {
  switch (normalizePackId(packId)) {
    case 'ui.card.v1':
      return { ui: __ui };
    case 'kanban.v1':
      return { widgets: __widgets };
    default:
      throw new Error(`Unknown runtime pack: ${packId}`);
  }
}

function defineCard(cardId, definitionOrFactory, packId) {
  const helpers = createPackHelpers(packId);
  const definition =
    typeof definitionOrFactory === 'function'
      ? definitionOrFactory(helpers)
      : definitionOrFactory;
  // validate definition shape
}
```

Important consequence:
- The pack selection is not just metadata.
- It controls the VM DSL surface for the card.

## Host Registry Responsibilities

The host-side runtime pack registry should be small and explicit.

Recommended interface:

```ts
interface RuntimePackDefinition<TTree> {
  packId: string;
  validateTree(value: unknown): TTree;
  render(props: {
    tree: TTree;
    onEvent: (handler: string, args?: unknown) => void;
  }): ReactNode;
}
```

The registry must own these decisions:

- normalize the selected pack ID
- fail hard on unknown pack IDs
- validate the render tree before rendering
- render through the pack-specific host component

## Cross-Package Import Rule

`hypercard-runtime` should not import the `@hypercard/rich-widgets` root barrel just to get at Kanban runtime pieces.

Why:

- the barrel pulls unrelated widget exports into the runtime package build
- that turns one focused runtime-pack slice into a compile dependency on unrelated rich-widget debt
- it also makes the runtime-pack seam harder to review because the dependency is too broad

Current rule:

- add a narrow subpath export for pack-specific runtime surfaces
- use that subpath from `hypercard-runtime`

Current concrete example:

```text
@hypercard/rich-widgets/kanban-runtime
```

That subpath should only export the Kanban pieces required by the runtime pack:

- `KanbanBoardView`
- `KanbanBoardViewProps`
- `KanbanState`
- `Task`, `Column`, `TagId`, `Priority`

## Why `kanban.v1` Is Host-Rendered

The Kanban board is exactly the kind of UI that should not be reproduced as a giant VM-native `ui.row/ui.column/ui.button/...` tree.

Reasons:

- the widget already has rich behavior
  - filtering
  - modal editing
  - drag/drop
  - collapse state
- the host already owns the actual React/DOM event machinery
- the VM should choose structure and data, not manage DOM-level drag mechanics

So `kanban.v1` should work like this:

- VM returns a Kanban-specific declarative tree
- host renders the real Kanban widget/view parts
- host interactions route back to VM handlers
- VM handlers dispatch semantic actions

## Kanban Pack Tree Shape

Current target shape:

```ts
type KanbanBoardNode = {
  kind: 'kanban.board';
  props: {
    tasks: Task[];
    columns: Column[];
    editingTask: Partial<Task> | null;
    filterTag: TagId | null;
    filterPriority: Priority | null;
    searchQuery: string;
    collapsedCols: Record<string, boolean>;
    onOpenTaskEditor?: UIEventRef;
    onCloseTaskEditor?: UIEventRef;
    onSaveTask?: UIEventRef;
    onDeleteTask?: UIEventRef;
    onMoveTask?: UIEventRef;
    onSearchChange?: UIEventRef;
    onSetFilterTag?: UIEventRef;
    onSetFilterPriority?: UIEventRef;
    onClearFilters?: UIEventRef;
    onToggleCollapsed?: UIEventRef;
  };
};
```

This is intentionally Kanban-specific. It is not a half-generic widget container.

## Kanban Refactor Guidance

The Kanban refactor now gives us the split we actually need:

- render/view concerns
  - board layout
  - task card
  - modal
  - status bar
  - drag/drop affordances
- state/controller concerns
  - Redux vs standalone state
  - mapping from user gestures to Kanban semantic actions

The extracted view surface is:

- `KanbanTaskCard`
- `KanbanTaskModal`
- `KanbanBoardView`
- thin `KanbanBoard.tsx` wrapper that wires Redux/local state to `KanbanBoardView`

The important contract detail is that `KanbanBoardView` takes semantic callbacks, not Redux action objects. Current callback names are:

- `onOpenTaskEditor`
- `onCloseTaskEditor`
- `onSaveTask`
- `onDeleteTask`
- `onMoveTask`
- `onSearchChange`
- `onSetFilterTag`
- `onSetFilterPriority`
- `onClearFilters`
- `onToggleCollapsed`

The host pack renderer should consume the extracted view surface, not the old top-level widget wrapper.

## Storybook Requirements

Every extracted Kanban view piece must get a Storybook story before the slice is considered complete.

Minimum coverage:

- `KanbanTaskCard`
  - default
  - high-priority / tagged
- `KanbanTaskModal`
  - new task
  - edit existing task
- `KanbanBoardView`
  - default board
  - filtered board
  - collapsed lanes
  - editing modal open

Keep the existing `KanbanBoard.stories.tsx` for full-widget coverage, but do not stop there.

Story taxonomy rule:

- keep the extracted stories grouped under `RichWidgets/Kanban/*`
- use one folder per extracted piece, for example:
  - `RichWidgets/Kanban/Board`
  - `RichWidgets/Kanban/BoardView`
  - `RichWidgets/Kanban/TaskCard`
  - `RichWidgets/Kanban/TaskModal`

Verification rule:

- run `npm run storybook:check`
- open the grouped stories in Storybook
- if Storybook is already running, confirm it is not serving a stale module graph before trusting failures
- for inventory/backend authoring work, also verify that a projected artifact record actually carries `packId`

Storybook/Vite alias rule:

- if a runtime pack imports a narrow package subpath such as `@hypercard/rich-widgets/kanban-runtime`, Storybook must explicitly alias that same subpath in `.storybook/main.ts`
- aliasing only the package root is not enough for custom subpath exports

## Prompt Policy Rules

When the authoring surface targets the Kanban pack, the prompt policy must require:

- `type: hypercard.card.v2`
- `runtime.pack: kanban.v1`
- card code written for the `kanban.v1` helper surface

Conceptual example:

```yaml
type: hypercard.card.v2
runtime:
  pack: kanban.v1
card:
  id: sprint-board
  code: |
    ({ widgets }) => ({
      render({ state }) {
        const board = state.app_kanban;
        return widgets.kanban.board({
          columns: board.columns,
          tasks: board.tasks,
          searchQuery: board.searchQuery,
          collapsedCols: board.collapsedCols,
          onMoveTask: { handler: 'moveTask' },
        });
      },
      handlers: {
        moveTask({ dispatch }, args) {
          dispatch({ type: 'kanban/move-task', payload: args });
        },
      },
    })
```

## Review Checklist

- Does artifact parsing persist `runtime.pack` as `packId`?
- Does runtime card injection pass `packId` into VM definition?
- Does bootstrap helper injection change based on `packId`?
- Does host validation/rendering fail on unknown packs instead of silently coercing?
- Does `kanban.v1` use a Kanban-specific render tree rather than faking the generic `ui.*` tree?
- Does the Kanban host renderer reuse extracted widget/view code rather than duplicating UI logic?
- Do Storybook stories exist for each extracted Kanban piece?
- Does prompt policy explicitly require `runtime.pack: kanban.v1` for Kanban artifacts?

## Host-App Shortcut Rule

If the goal is to open a concrete runtime-pack demo card inside the running shell without creating a package cycle, put the shortcut in the host app layer, not in `rich-widgets`.

Short-term rule proven by Slice 5:

- concrete demo cards may live as built-in plugin cards in the host app stack
- the host app may expose a launcher window that opens those cards through `PluginCardSessionHost`
- `hypercard-runtime` must preserve built-in card pack metadata, not only runtime card registry metadata

This is a tactical demo path, not the final APP-16 architecture. The final architecture still moves concrete packs into external packages and moves pack registration to app bootstrap.

## Revision Notes

- Initial version created while Slice 2 was in progress.
- Revised after Slice 2 proved that `hypercard-runtime` needs a narrow rich-widget subpath export rather than importing the rich-widget root barrel.
- Revised after Slice 3 extracted `KanbanBoardView`, `KanbanTaskCard`, and `KanbanTaskModal`, replaced the temporary `KanbanBoardFrame` renderer seam, and exposed the Storybook alias requirement for narrow runtime-pack subpaths.
- Revised after Slice 4 proved that `runtime.pack` must stay nested under `data.runtime.pack` from authored YAML through backend extraction, timeline projection, frontend artifact parsing, and inventory-store projection.
- Revised after Slice 5 proved that built-in stack cards also need pack metadata surfaced back to the host, and that app-layer launcher shortcuts are the right temporary place to open concrete pack demos without creating package cycles.
- Update this playbook whenever:
  - the Kanban render tree contract changes
  - the helper injection API changes
  - the host-side pack registry responsibilities change
  - the recommended implementation order proves wrong in real code
