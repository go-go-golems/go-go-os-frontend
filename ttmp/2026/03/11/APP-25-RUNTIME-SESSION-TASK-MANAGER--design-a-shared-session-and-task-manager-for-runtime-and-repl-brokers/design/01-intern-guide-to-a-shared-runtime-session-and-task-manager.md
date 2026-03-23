---
Title: Intern Guide to a Shared Runtime Session and Task Manager
Ticket: APP-25-RUNTIME-SESSION-TASK-MANAGER
Status: active
Topics:
  - frontend
  - repl
  - architecture
  - tooling
  - hypercard
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx
    Note: Current debug window that proves the immediate need for a more general manager.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/runtimeDebugRegistry.ts
    Note: Existing registry for bundle metadata.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/jsSessionDebugRegistry.ts
    Note: Existing registry for plain JS session debug sources.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts
    Note: First non-surface session source that should be represented in the new task manager.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/runtimeSessions/runtimeSessionsSlice.ts
    Note: Existing runtime-surface session state that must remain valid and separate.
Summary: Detailed design for a generic session and task manager window that can aggregate runtime sessions, JS sessions, and future broker/task sources while preserving their distinct runtime models.
LastUpdated: 2026-03-11T16:30:00-04:00
WhatFor: Give an intern enough context to implement the session/task manager without accidentally flattening incompatible session models or overloading existing runtime debug windows.
WhenToUse: Use before implementing a shared task manager, new broker-backed session sources, or generalized operator/debug tooling.
---

# Intern Guide to a Shared Runtime Session and Task Manager

## 1. Why this ticket exists

The current system has already outgrown a single debug model.

We now have at least two distinct live execution systems:

- runtime-surface sessions backed by `RuntimeBundle` / `RuntimeSurface` concepts
- plain JavaScript sessions backed by `JsSessionBroker`

They can both be shown to an operator, but they are not the same thing. The current `Stacks & Cards`
window proves both sides of the problem:

- it is excellent for bundle/surface/source inspection
- it is not the right long-term home for general session/task management

That is why this ticket exists. We need a new shared operator view that is broad enough to handle
multiple session and task families without muddying the runtime architecture.

## 2. The current landscape

### Runtime-surface side

Main files:

- [RuntimeSurfaceDebugWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx)
- [runtimeSessionsSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/runtimeSessions/runtimeSessionsSlice.ts)

This side of the system has:

- runtime session ids
- bundle ids
- current surface ids
- runtime action timelines
- surface-local state
- source editing paths

These sessions exist because a host is running a `RuntimeBundle` and rendering one or more
`RuntimeSurface`s.

### Plain JS side

Main files:

- [jsSessionBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts)
- [jsSessionService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/jsSessionService.ts)
- [jsSessionDebugRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/jsSessionDebugRegistry.ts)

This side has:

- blank QuickJS sessions
- global variables
- raw eval
- reset/dispose lifecycle
- no surface tree
- no bundle metadata requirement

### Existing UI consequence

`Stacks & Cards` now has a separate `JS Sessions` section. That was the right immediate fix, but it is
still a compromise. The longer the system grows, the more awkward that mixed window will become.

## 3. The concept we actually need

We need a generic concept above both systems.

The most useful neutral noun is:

- `SessionSource`

and for non-session work:

- `TaskSource`

The operator window can then talk in generic rows like:

- item id
- kind
- owner/source
- status
- started/updated
- summary fields
- supported actions

without pretending that the underlying systems share the same storage or lifecycle.

## 4. Architecture in one diagram

```text
runtimeSessions Redux slice
  -> RuntimeSessionSource adapter

JsSessionBroker
  -> JsSessionSource adapter

future tool/task broker
  -> TaskSource adapter

SessionTaskRegistry
  stores source objects
  subscribes to source changes
  exposes snapshots

TaskManagerWindow
  reads registry snapshots
  groups/filter/searches rows
  executes source-supported actions
```

This is the key architectural move:

- do not make the task manager the source of truth
- do not make Redux the source of truth for every possible task type
- make adapters the bridge from heterogeneous systems to one operator-facing summary model

## 5. Why not just use Redux for everything?

Because the moment you include broker-owned live handles or behaviorful objects, the model becomes
wrong.

Redux is still fine for:

- runtime-surface session state that is already store-shaped
- selected filters in the task manager UI
- sort/group preferences

Redux is not the right home for:

- `JsSessionBroker`
- future tool brokers
- behaviorful external source objects
- arbitrary per-source methods

So the correct split is:

- external registry for source objects
- serializable snapshots for the task-manager UI
- Redux only for task-manager UI preferences if needed

## 6. Proposed core interfaces

### Session/task summary row

```ts
interface TaskManagerRow {
  id: string;
  kind: 'runtime-session' | 'js-session' | 'tool-task' | string;
  sourceId: string;
  sourceTitle: string;
  title: string;
  status: string;
  startedAt?: string;
  updatedAt?: string;
  tags?: string[];
  details?: Record<string, string>;
  actions: TaskManagerAction[];
}
```

### Action model

```ts
interface TaskManagerAction {
  id: string;
  label: string;
  intent: 'open' | 'focus' | 'inspect' | 'reset' | 'dispose' | 'terminate' | 'custom';
}
```

### Source interface

```ts
interface TaskManagerSource {
  sourceId(): string;
  title(): string;
  listRows(): TaskManagerRow[];
  invoke(actionId: string, rowId: string): Promise<void> | void;
  subscribe(listener: () => void): () => void;
}
```

The shape is intentionally similar to the docs mount/provider design:

- behavior stays outside Redux
- the UI only sees snapshots and calls well-defined methods

## 7. Source adapters we should build first

### Adapter 1: RuntimeSessionSource

This adapter wraps the existing runtime-surface state.

Responsibilities:

- read current runtime sessions
- derive bundle/surface labels
- expose actions like:
  - `open`
  - `inspect`
  - maybe `close-window` or `focus-window`

Data origin:

- Redux `runtimeSessions`
- Redux/windowing state
- runtime debug bundle registry for metadata lookup

### Adapter 2: JsSessionSource

This adapter wraps `JsSessionBroker`.

Responsibilities:

- list broker sessions
- expose globals count or preview
- expose actions like:
  - `reset`
  - `dispose`
  - maybe `focus-repl`

Data origin:

- `JsSessionBroker.listSessions()`
- `JsSessionBroker.subscribe(...)`

### Adapter 3: Future tool-task source

This is not needed for the first implementation, but the design should make it easy.

Examples:

- async background imports
- long-running codegen jobs
- model/tool execution pipelines

That is why the window should be named something like `Task Manager` or `Sessions`, not
`Runtime Sessions`.

## 8. UI design

The first window should be intentionally boring and legible.

Recommended sections:

- summary row:
  - total active items
  - runtime sessions count
  - JS sessions count
- filter bar:
  - text search
  - kind filter
  - status filter
- main table:
  - kind
  - title
  - source
  - status
  - started
  - details
  - actions
- optional side inspector:
  - selected row metadata

Important rule:

- do not re-implement `Stacks & Cards` inside this window

The task manager should link or delegate to richer specialized tools when needed.

For example:

- `inspect runtime session` could open `Stacks & Cards`
- `open bundle surface` could open the runtime window directly

## 9. Relationship to existing windows

### `Stacks & Cards`

Keep it.

It still owns:

- bundle inspection
- surface inspection
- runtime source editing
- artifact/runtime surface registration views

### New `Task Manager`

It should own:

- cross-source session visibility
- cross-source filtering
- lifecycle operations
- future long-running task visibility

This is the right separation of concerns.

## 10. Implementation order

### Slice 1: Define the generic source interfaces

Create a new home for:

- `TaskManagerSource`
- `TaskManagerRow`
- `TaskManagerAction`
- registry helpers

This should live in `hypercard-runtime` or another shared host-debug package, not in `wesen-os`.

### Slice 2: Implement source adapters

Build:

- runtime-session source adapter
- JS-session source adapter

Do not build extra kinds until the first window is stable.

### Slice 3: Build the window

Add:

- a shared `TaskManagerWindow`
- a small app wrapper module in `wesen-os`
- focused tests

### Slice 4: Decide how it integrates with `Stacks & Cards`

Likely:

- keep both launcher entries
- add convenient navigation between them

### Slice 5: Revisit `RuntimeSurfaceDebugWindow`

Once the task manager exists:

- remove or shrink the `JS Sessions` section there
- keep a small cross-link instead of duplicating full manager behavior

## 11. Pseudocode sketch

```ts
const registry = createTaskManagerRegistry();

registry.registerSource(createRuntimeSessionSource({ store, bundles }));
registry.registerSource(createJsSessionSource({ broker }));

function TaskManagerWindow() {
  const rows = useTaskManagerRows();
  const [query, setQuery] = useState('');
  const filtered = filterRows(rows, query);

  return (
    <TaskTable
      rows={filtered}
      onAction={(row, action) => registry.invoke(row.sourceId, row.id, action.id)}
    />
  );
}
```

## 12. Risks

### Risk: rebuilding business logic in the task manager

Avoid this.

Use source adapters and action callbacks, not duplicated reducers.

### Risk: turning task manager rows into a fake universal session schema

The row format should be a summary model only.

Do not try to encode every source’s full semantics into one mega-type.

### Risk: overloading Redux again

Keep behaviorful sources outside Redux.

### Risk: overlapping too much with `Stacks & Cards`

The task manager should be the operator index, not the authoring/debugging source editor.

## 13. Validation checklist

When implemented, validation should prove:

- JS sessions can appear without entering runtime-surface Redux state
- runtime sessions can appear without losing current debug behavior
- row actions dispatch correctly back to their owning source
- the window remains stable if one source has zero rows
- adding a third fake source in tests is easy

## 14. Recommended next docs

After implementation, the repo docs should gain:

- a `session-manager-guide.md`
- a short cross-link from `repl-and-runtime-debug-guide.md`
- a small update in `runtime-concepts-guide.md` clarifying that task-manager UI is above both runtime and JS session models
