# Runtime Broker and Session Source Guide

Last verified against source: 2026-03-11

This guide explains the broker and session-source patterns now used in the frontend runtime system.

It is for a new intern who needs to answer questions like:

- What is a runtime broker?
- What is the difference between a broker and a service?
- Why do some things live in Redux and others live in external registries?
- How should a new session source or task source be added?
- How should debug or task-manager UIs consume broker-backed systems?

Related guides:

- [runtime-concepts-guide.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/docs/runtime-concepts-guide.md)
- [repl-and-runtime-debug-guide.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/docs/repl-and-runtime-debug-guide.md)
- [js-api-user-guide-reference.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/docs/js-api-user-guide-reference.md)

## 1. The short version

There are three different layers that are easy to confuse:

```text
service
  low-level lifecycle and execution

broker
  operator/tool-facing handle and summary layer

session source
  adapter that exposes broker or store-backed data to debug/task-manager UI
```

Examples:

- `JsSessionService`
  - low-level QuickJS session lifecycle
- `JsSessionBroker`
  - tool-facing blank JS session manager
- `jsSessionDebugRegistry`
  - UI registration layer for broker-backed JS session visibility

The rule of thumb is:

- services own execution
- brokers own operator-facing lifecycle
- session sources bridge into debug/task-manager UI

## 2. Why this split exists

If you collapse all three layers into one object, one of two bad things happens:

1. the UI starts depending directly on low-level runtime methods and live handles
2. Redux starts trying to own behaviorful objects that are not serializable or reducer-shaped

This codebase now avoids that by keeping the layers separate.

## 3. The existing runtime-side example

### Runtime-surface system

Main files:

- [runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts)
- [runtimeSessionsSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/runtimeSessions/runtimeSessionsSlice.ts)

In this older system:

- the low-level execution service is `QuickJSRuntimeService`
- the live operator-facing session record is projected into Redux
- the UI reads that Redux state directly

This path predates the newer broker/source pattern, so it is slightly more store-centric.

### Plain JS system

Main files:

- [jsSessionService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/jsSessionService.ts)
- [jsSessionBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts)
- [jsSessionDebugRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/jsSessionDebugRegistry.ts)

This newer path is cleaner:

- `JsSessionService` owns blank QuickJS sessions
- `JsSessionBroker` exposes spawn/list/reset/dispose
- the debug registry exposes broker-backed sources to UI

That is the pattern future systems should copy.

## 4. Services

A service is the low-level execution layer.

Characteristics:

- owns engine/runtime lifecycle
- owns create/eval/reset/dispose semantics
- exposes raw-ish execution methods
- should stay close to the actual runtime engine

### Example: `JsSessionService`

Responsibilities:

- create a blank QuickJS session
- evaluate JS
- preserve globals
- inspect global names
- reset/dispose sessions

It should not know about:

- desktop windows
- debug panels
- task-manager rows
- search/filter UI

## 5. Brokers

A broker is the tool-facing manager built on top of a service.

Characteristics:

- owns live handles
- owns subscription semantics
- exposes serializable summaries
- stays usable by drivers, host modules, and operator tools

### Example: `JsSessionBroker`

Responsibilities:

- spawn sessions
- return handles for direct use
- expose `listSessions()` summaries
- notify subscribers when session summaries change
- support reset/dispose at the higher lifecycle level

This is the right place for:

- REPL driver session operations
- host module wiring
- debug/task-manager integration

## 6. Session sources

A session source is an adapter layer for operator UI.

It should answer:

- what rows/items exist?
- what actions are available?
- how do I subscribe to updates?

It should not become:

- the execution engine
- the broker itself
- the single source of truth for all runtime semantics

### Current examples

Current code has two partial versions of this idea:

- `runtimeDebugRegistry.ts`
  - bundle/source metadata registry
- `jsSessionDebugRegistry.ts`
  - external registry for `JsSessionBroker` sources

APP-25 exists because these should likely grow into a more formal shared session/task-source system.

## 7. Why external registries are correct here

For broker-backed systems, external registries are usually a better fit than Redux.

Reasons:

- broker objects are behaviorful
- they have methods and subscriptions
- they may hold live handles or engine references
- they should not be serialized into store state

So the right pattern is:

```text
live source object
  -> external registry
  -> subscription
  -> serializable snapshot in UI
```

This is the same broad pattern already used in the docs-provider system.

## 8. Recommended design for future sources

If you add a new session-like or task-like source, prefer this shape:

```ts
interface SessionSource<Row> {
  sourceId(): string;
  title(): string;
  listRows(): Row[];
  subscribe(listener: () => void): () => void;
  invoke?(actionId: string, rowId: string): Promise<void> | void;
}
```

The important thing is not the exact type name. The important thing is the separation:

- source objects stay behaviorful
- rows stay serializable
- the UI consumes rows and invokes narrow action entry points

## 9. Anti-patterns

### Anti-pattern: putting broker objects in Redux

Don’t.

### Anti-pattern: making the debug window the source of truth

The window is a consumer, not the owner.

### Anti-pattern: letting the service grow UI concerns

If a service starts caring about window titles, filters, or debug panels, the layer boundary is wrong.

### Anti-pattern: collapsing all session kinds into one fake universal runtime model

Use summary rows and source-specific actions instead.

## 10. File-by-file map

If you are onboarding, read these in order:

1. [jsSessionService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/jsSessionService.ts)
2. [jsSessionBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts)
3. [jsSessionDebugRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/jsSessionDebugRegistry.ts)
4. [RuntimeSurfaceDebugWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx)
5. [repl-and-runtime-debug-guide.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/docs/repl-and-runtime-debug-guide.md)
