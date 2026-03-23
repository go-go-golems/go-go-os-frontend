---
Title: Intern guide to object, harness, runtime, session, surface, and artifact architecture cleanup
Ticket: APP-29-OBJECT-HARNESS-RUNTIME-ARCHITECTURE--design-object-harness-runtime-reorganization-for-hypercard-frontend
Status: active
Topics:
    - frontend
    - architecture
    - runtime
    - documentation
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: workspace-links/go-go-os-frontend/apps/todo/src/launcher/module.tsx
      Note: Example launcher adapter from app entry to runtime surface window.
    - Path: workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts
      Note: Defines how surface windows initialize nav session state.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts
      Note: Shows how assistant artifacts become runtime surface launch payloads.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.ts
      Note: Defines persisted artifact state and injection bookkeeping.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx
      Note: Shows debug-window inspection and launch behavior over runtime sessions.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.ts
      Note: Shows task-manager operational harness behavior.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts
      Note: Defines current runtime worker protocol and bundle metadata.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts
      Note: Shows the global pending surface registry that currently mixes persistence and injection concerns.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Defines in-VM bundle and surface registration/bootstrap semantics.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/attachedJsSessionRegistry.ts
      Note: Shows attached JS harness adaptation over manager-owned runtime sessions.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.ts
      Note: Shows attached read-only runtime harness adaptation.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/hypercardReplDriver.ts
      Note: Defines spawn
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts
      Note: Shows the separate JS harness boundary.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts
      Note: Shows the writable runtime harness boundary and session handle API.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Shows the current mixed window host responsibilities that motivate the redesign.
ExternalSources: []
Summary: Intern-oriented analysis of the current HyperCard frontend runtime model and a proposed reorganization around explicit object, harness, and runtime boundaries.
LastUpdated: 2026-03-12T20:11:18.747636515-04:00
WhatFor: Explain the current architecture, why it is confusing, and how to migrate the codebase toward a clearer object/harness/runtime model.
WhenToUse: Use when onboarding new engineers, reviewing the current runtime host architecture, or implementing the proposed reorganization.
---


# Intern guide to object, harness, runtime, session, surface, and artifact architecture cleanup

## Executive Summary

The current HyperCard frontend architecture is functional, but its vocabulary and ownership boundaries are muddled. Terms like `bundle`, `surface`, `session`, `artifact`, and `runtime` each carry more than one meaning. That makes the system harder to teach, harder to debug, and harder to reorganize safely.

The proposed architecture in this guide separates the system into three top-level layers:

1. object
2. harness
3. runtime

In the proposed model:

- an object is the thing with identity and capabilities,
- a harness is a contract plus host-side system code that drives the object,
- a runtime is the executor used to evaluate messages for the object.

This guide explains how the current code maps onto that model, where the current abstraction leaks are, how assistant-generated artifacts fit in, and how to migrate the codebase without a big-bang rewrite.

## Problem Statement

The current system mixes at least three separate architecture axes.

### Axis 1: What The Thing Is

Examples in current code:

- runtime bundle definition
- runtime surface
- artifact record
- session metadata

### Axis 2: How The Thing Is Driven

Examples in current code:

- window surface host
- runtime REPL
- JS REPL
- task manager source
- debug window adapters

### Axis 3: Where The Thing Executes

Examples in current code:

- QuickJS session
- runtime worker request/response protocol
- in-VM bootstrap globals

These axes are currently entangled. For example, [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:105) is simultaneously:

- a window harness host,
- a runtime activation loader,
- an artifact injection coordinator,
- a pack/surface-type resolver,
- a render dispatcher,
- an event dispatcher,
- and an error boundary for runtime render failures.

That is the core design problem. The file is not bad because it is complex. It is bad because it is complex in the wrong dimensions.

## Scope

This document focuses on the HyperCard frontend runtime subsystem in `go-go-os-frontend`, especially:

- runtime worker contracts,
- bundle/bootstrap contracts,
- runtime session hosting,
- surface/window integration,
- artifact-generated runtime surfaces,
- REPL and attached-session adapters,
- task-manager and debug views.

This document does not propose a total product redesign. It proposes a clearer organizing model for the existing frontend runtime system.

## Reading Order For A New Intern

Read these sections in order:

1. Current Architecture At A Glance
2. Current User Flows
3. Current Harnesses
4. Current Runtimes
5. Why The Current Model Is Confusing
6. Proposed Architecture
7. Codebase Reorganization Plan
8. Migration Plan

## Current Architecture At A Glance

At a high level, the current architecture looks like this.

```text
launcher / assistant / task manager / debug tools / REPL
                     |
                     v
           open window or spawn session
                     |
                     v
 RuntimeSurfaceSessionHost / runtimeBroker / jsSessionBroker
                     |
                     v
           runtime session manager / runtime service
                     |
                     v
                   QuickJS
                     |
                     v
     bundle code + injected surfaces + runtime package APIs
                     |
                     v
      renderSurface / eventSurface / evaluateSessionJs
```

The important thing to notice is that current names jump between layers:

- `bundle` sounds like a static object definition,
- `session` sounds like a live container,
- `surface` sounds like an entrypoint,
- `artifact` sounds like persisted chat output,
- `runtime` sometimes means the worker protocol and sometimes means the executor itself.

That mismatch is what makes the current architecture feel slippery.

## Current Terms And Their Practical Meaning

| Current term | Practical meaning in code | Evidence |
| --- | --- | --- |
| `bundle` | Spawnable program definition plus runtime metadata about surfaces and packages | [contracts.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts:62), [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js:148) |
| `surface` | Named render/event endpoint inside a bundle; sometimes also shorthand for a window content type | [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js:177), [windowingSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts:23) |
| `surface type` / `packId` | Validator + renderer family for trees returned by `renderSurface` | [contracts.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts:72), [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:158) |
| `session` | Live execution container with runtime ownership, attached views, and mutable loaded code | [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts:28), [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:212) |
| `artifact` | Persisted assistant output that may include runtime surface source and a preferred pack | [artifactRuntime.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts:93), [artifactsSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.ts:5) |
| `runtime` | Either the worker protocol, the bootstrap layer, or the executor itself | [contracts.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts:75), [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js:142) |

## Current User Flows

### Flow 1: `spawn inventory demo-a`

This is the best current example of what a live `session` actually is.

1. The HyperCard REPL handles `spawn` in [hypercardReplDriver.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/hypercardReplDriver.ts:456).
2. `spawnBundle` constructs a `SpawnRuntimeSessionRequest` with `stackId`, `sessionId`, `packageIds`, and `bundleCode` in [hypercardReplDriver.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/hypercardReplDriver.ts:390).
3. The writable runtime harness passes that request through [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts:122).
4. The runtime service creates a live QuickJS-backed session.
5. Bundle code registers itself through `defineRuntimeBundle(...)` and surface registration helpers exposed by [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js:142).
6. The resulting live session exposes methods such as `getBundleMeta`, `renderSurface`, and `eventSurface` through the runtime handle defined in [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts:84).

Sequence:

```text
REPL command
  |
  | spawn inventory demo-a
  v
hypercardReplDriver.spawnBundle()
  |  hypercardReplDriver.ts:390-419
  v
runtimeBroker.spawnSession()
  |  runtimeBroker.ts:122-138
  v
runtime service / QuickJS
  |
  v
stack-bootstrap.vm.js
  |  defineRuntimeBundle()      : 142-145
  |  __runtimeBundleHost.getMeta: 148-175
  v
live runtime session handle
```

Why this matters:

- `inventory` is not really a current OO instance,
- `home` is not really a subclass,
- the live thing is the session,
- the addressable view-like thing inside the session is the surface.

### Flow 2: Opening An Assistant-Generated Card

This flow shows where persisted definitions and live execution are currently blended.

1. Assistant output is converted into an `ArtifactUpsert` in [artifactRuntime.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts:93).
2. Redux stores it as an `ArtifactRecord` in [artifactsSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.ts:46).
3. The artifact may carry:
   - `runtimeSurfaceId`
   - `runtimeSurfaceCode`
   - `packId`
4. Opening the artifact builds a window payload in [artifactRuntime.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts:152).
5. Desktop windowing initializes nav state for `content.kind = 'surface'` in [windowingSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts:23).
6. The window content adapter renders [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:105).
7. The host loads or reuses the session, injects pending runtime surfaces through [runtimeSurfaceRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts:81), renders the current surface, validates the tree, and dispatches events.

Sequence:

```text
assistant chat result
  |
  v
ArtifactUpsert / ArtifactRecord
  |  artifactRuntime.ts:93-125
  |  artifactsSlice.ts:46-89
  v
openWindow({ kind: 'surface' })
  |  artifactRuntime.ts:152-187
  |  windowingSlice.ts:23-73
  v
RuntimeSurfaceSessionHost
  |  ensureSession()         : 212-314
  |  inject pending surfaces : 228-246
  |  attachView()            : 348-357
  |  renderSurface()         : 394-422
  |  eventSurface()          : 443-487
  v
React renderer for resolved surface contract
```

Why this matters:

- the artifact is persisted state,
- the session is the live running container,
- the current code treats the artifact partly as persisted content and partly as a runtime injection unit,
- that is exactly the kind of mixed abstraction this redesign should clean up.

## Current Harnesses In The Codebase

The codebase already has harnesses. It just does not name them consistently.

### 1. Window Surface Harness

Main files:

- [windowingSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts:23)
- [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:105)
- [apps/todo/src/launcher/module.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/todo/src/launcher/module.tsx:36)

Messages driven:

- `renderSurface(surfaceId, state)`
- `eventSurface(surfaceId, handler, args, state)`

This is the most mature harness in the system.

### 2. Runtime REPL Harness

Main files:

- [hypercardReplDriver.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/hypercardReplDriver.ts:421)
- [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts:28)

Messages driven:

- `spawnSession`
- `renderSurface`
- `eventSurface`
- `defineSurface`
- `defineSurfaceRender`
- `defineSurfaceHandler`

### 3. Attached Runtime Harness

Main file:

- [attachedRuntimeSessionRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.ts:39)

Messages exposed:

- `getBundleMeta`
- `renderSurface`
- `eventSurface`

This is a read-only adapter over manager-owned live sessions.

### 4. JS REPL Harness

Main files:

- [jsSessionBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts:20)
- `jsReplDriver.ts`

Messages driven:

- `evaluate(code)`
- `inspectGlobals()`
- `reset()`
- `dispose()`

### 5. Attached JS Harness

Main file:

- [attachedJsSessionRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/attachedJsSessionRegistry.ts:35)

Messages exposed:

- `evaluate(code)`
- `inspectGlobals()`

### 6. Operational Harnesses

These are not full protocol harnesses, but they are still harness-like adapters because they enumerate, inspect, and launch activations.

Main files:

- [runtimeSessionSource.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.ts:81)
- [RuntimeSurfaceDebugWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx:121)

## Current Runtime Executors

Today the implementation is QuickJS-centric.

Evidence:

- worker contracts are defined in [contracts.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts:75),
- in-VM runtime globals are defined in [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js:142),
- live handles are exposed through runtime and JS brokers.

But the shape of the system already implies future support for:

- DSL runtimes,
- remote runtimes,
- mock runtimes for tests,
- per-harness runtime selection.

That is why it is worth separating harness from runtime explicitly now.

## Why The Current Model Is Confusing

### 1. The Main Window Host Owns Too Many Concerns

[RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:105) currently blends:

- runtime session registration,
- session recovery,
- runtime metadata caching,
- pack resolution,
- artifact injection,
- view attachment,
- render dispatch,
- event dispatch,
- error handling.

That makes it hard to teach and hard to refactor.

### 2. Surface-Type Defaults Hide Contract Errors

The runtime bootstrap normalizes surface definitions in [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js:77). Historically, hidden defaults around pack/surface type made contract mismatches look like runtime bugs instead of declaration bugs.

Architecturally, that is the wrong direction. A runtime executor should not silently invent the UI contract for an object that failed to declare one.

### 3. Artifacts Mix Persisted Object Definition And Runtime Injection

[runtimeSurfaceRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts:1) acts as a global pending registry. That is useful operationally, but architecturally it mixes:

- persisted artifact state,
- live session-local augmentation,
- injection bookkeeping.

Those are different concerns.

### 4. `session` Is Too Overloaded

In current code, `session` means:

- live execution context,
- runtime handle,
- owner of attached views,
- thing exposed by task-manager and debug tooling,
- thing that can be adapted into REPL handles or JS handles.

That is why `instance` never mapped cleanly in the earlier conversation. A current runtime session is more like a live activation container than a plain OO instance.

### 5. Surface Type Is Real Architecture But Not Named As Such

A surface type already behaves like a window harness contract:

- it determines how `renderSurface` output is validated,
- it determines how the resulting tree is rendered into React,
- it defines the boundary between runtime output and host rendering.

That is a harness concern, not a raw runtime concern.

## Design Goals

### Primary Goals

- Make object identity explicit.
- Make harness contracts explicit.
- Make runtime selection explicit.
- Make activation ownership explicit.
- Prefer precise failures over hidden fallbacks.
- Support current product flows during migration.

### Secondary Goals

- Fit assistant-generated artifacts into the same architecture as hand-authored modules.
- Make new harnesses possible without bending everything through window surfaces.
- Make multi-runtime support natural rather than incidental.

### Non-Goals

- Rewriting all existing runtime bundles immediately.
- Removing every existing term in one pass.
- Forcing classical inheritance semantics where they do not fit.

## Proposed Architecture

### Top-Level Model

The new architecture should have three primary nouns.

### Object

An object is the thing with identity and capabilities.

Examples:

- a reusable module object,
- a class-like object with `instantiate`,
- a persisted artifact object,
- a live instance object,
- a surface-like entrypoint object if that remains useful.

Important rule:

- objects declare capabilities,
- objects do not implicitly choose one harness,
- objects do not implicitly choose one runtime.

### Harness

A harness is a contract plus host-side system code that drives an object.

Examples:

- window harness,
- icon harness,
- folder harness,
- runtime REPL harness,
- JS REPL harness,
- automation harness,
- test harness.

Important rule:

- the harness decides which messages it needs,
- the object declares whether it supports those messages,
- the host should not invent missing capabilities.

### Runtime

A runtime is an executor used to evaluate messages sent to an object.

Examples:

- QuickJS,
- a DSL interpreter,
- a remote executor,
- a mock runtime.

Important rule:

- runtimes execute messages,
- harnesses drive behavior,
- a resolver maps harness + message family to runtime lane.

## Replacement Vocabulary

| Target term | Meaning |
| --- | --- |
| `object` | Any entity with identity and capabilities |
| `module` | Reusable package-like object namespace |
| `class` | Object that supports `instantiate` |
| `instance` | Live object identity |
| `activation` | Live execution container that binds an instance to one or more runtimes and harness attachments |
| `harness` | Protocol adapter used by the system to drive an object or activation |
| `runtime` | Executor used for message evaluation |
| `surface contract` | Window-harness render/event contract |
| `artifact object` | Persisted generated object definition plus source/docs |

### Why Introduce `activation`

`session` is overloaded. `activation` is a better internal term for the live running container because it communicates:

- this thing is live,
- this thing owns runtime resources,
- this thing may have multiple harness attachments,
- this thing is more than a plain object identity.

If the team prefers to keep `session` public, that is still fine. But internally, using `activation` would reduce ambiguity.

## Current-To-Target Translation Table

| Current concept | Target concept | Notes |
| --- | --- | --- |
| runtime bundle definition | object definition | Spawnable program definition |
| bundle surface | object entrypoint or specialized surface object | Keep `surface` if it remains useful for window entries |
| runtime surface type / `packId` | window surface contract | Validator + renderer family |
| runtime session | activation | Live execution container |
| artifact record | artifact object definition | Persisted generated object |
| runtime surface registry entry | activation-local injected capability | Stop treating it only as a global pending bag |
| `RuntimeSurfaceSessionHost` | window harness host | Split lifecycle, contract resolution, and dispatch |
| `runtimeBroker` | writable runtime harness broker | Tooling harness |
| `jsSessionBroker` | JS harness broker | Separate harness family |

## Proposed Capability Model

Instead of assuming that all live entities are "bundles with surfaces", the host should ask objects about explicit capabilities.

Suggested capability families:

- metadata:
  - `getId()`
  - `getTitle()`
  - `getDocs()`
  - `getSource()`
- lifecycle:
  - `instantiate(input)`
  - `dispose()`
- harness discovery:
  - `listHarnesses()`
  - `supportsHarness(harnessId)`
- window harness:
  - `render(state)`
  - `handleIntent(intent, state)`
  - `getWindowSurfaceContractId()`
- icon harness:
  - `icon_get_emoji()`
  - `icon_get_title()`
  - `icon_get_actions()`
  - `icon_open(actionId?)`
- automation harness:
  - `tick(context)`
  - `onEvent(event)`
- runtime discovery:
  - `listRuntimeLanes()`
  - `resolveRuntimeForHarness(harnessId, messageKind)`

This is not classical OO in the strict sense. It is capability-based object architecture.

## Proposed APIs

### Object Definition API

```ts
interface ObjectMetadata {
  id: string;
  title: string;
  description?: string;
  docs?: string[];
  sourceRefs?: string[];
}

interface ObjectDefinition {
  getMetadata(): ObjectMetadata;
  listCapabilities(): string[];
  listHarnesses(): string[];
  supportsHarness(harnessId: string): boolean;
}

interface ClassObjectDefinition extends ObjectDefinition {
  instantiate(input?: unknown): Promise<InstanceHandle>;
}
```

### Activation API

```ts
interface ActivationHandle {
  activationId: string;
  objectId: string;
  listHarnesses(): string[];
  listRuntimeLanes(): string[];
  attachHarness(harnessId: string, attachment: HarnessAttachment): void;
  detachHarness(harnessId: string, attachmentId: string): void;
}
```

### Window Harness Contract API

```ts
interface WindowSurfaceContract {
  typeId: string;
  validateTree(value: unknown): unknown;
  renderTree(input: {
    tree: unknown;
    emitIntent(intent: RuntimeAction): void;
  }): React.ReactNode;
}

interface WindowHarnessTarget {
  render(state: unknown): unknown;
  handleIntent?(intent: unknown, state: unknown): RuntimeAction[];
  getWindowSurfaceContractId(): string;
}
```

### Runtime Resolver API

```ts
interface RuntimeResolver {
  resolve(input: {
    objectId: string;
    harnessId: string;
    messageKind: string;
  }): string;
}
```

### Artifact Object API

```ts
interface ArtifactObjectDefinition extends ObjectDefinition {
  artifactId: string;
  getGeneratedSurfaceSource(): string | null;
  getPreferredHarnesses(): string[];
  materializeIntoActivation(targetActivationId: string): Promise<void>;
}
```

## Surface Type In The New Model

A surface type corresponds to a window harness contract, not to the object itself and not to the runtime itself.

Current evidence:

- `surfaceTypes` are included in runtime metadata in [contracts.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts:72),
- the host resolves pack/surface type and renders accordingly in [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:158).

Target interpretation:

- the object declares the window surface contract id,
- the window harness validates and renders that contract,
- the runtime executor must not silently choose it.

This is why strict failure instead of `ui.card.v1` fallback is architecturally correct.

## Harness And Runtime Relationship

The relationship is many-to-many.

- a harness asks for behavior,
- a runtime executes behavior,
- a resolver chooses the runtime lane.

Examples:

- window harness may use QuickJS for `render` and `handleIntent`,
- icon harness may use a tiny DSL runtime for `icon_get_emoji` and `icon_open`,
- automation harness may use a remote runtime for heavy reasoning,
- test harness may use a mock runtime.

This directly matches the user conversation about a remote lightbulb supporting both a DSL and JavaScript.

## Proposed Architecture Diagram

```text
                    +---------------------------+
                    |      Object Registry      |
                    | modules / classes /       |
                    | artifact objects          |
                    +-------------+-------------+
                                  |
                       instantiate/materialize
                                  |
                                  v
                    +---------------------------+
                    |         Activation        |
                    | live object + runtime     |
                    | ownership + attachments   |
                    +------+---------------+----+
                           |               |
                     attach|               |resolve lane
                     harness               |
                           v               v
                 +----------------+   +----------------+
                 |    Harnesses   |   |    Runtimes    |
                 | window / icon  |   | QuickJS / DSL  |
                 | repl / test    |   | remote / mock  |
                 +----------------+   +----------------+
```

This diagram is better because it cleanly answers three separate questions:

- what exists,
- how it is driven,
- where it runs.

## Codebase Reorganization Proposal

A gradual reorganization of `packages/hypercard-runtime/src` could look like this.

```text
packages/hypercard-runtime/src/
  architecture/
    glossary.ts
    capabilityContracts.ts
  objects/
    objectRegistry.ts
    objectDefinitions.ts
    artifactObjects/
    moduleObjects/
  activations/
    activationManager.ts
    activationSummary.ts
    activationOwnership.ts
  harnesses/
    window/
      windowHarnessHost.tsx
      windowHarnessContracts.ts
      windowHarnessLaunch.ts
    repl/
      objectReplHarness.ts
      attachedObjectHarnessRegistry.ts
    js/
      jsHarnessBroker.ts
      attachedJsHarnessRegistry.ts
    taskManager/
    debug/
  runtimes/
    quickjs/
      quickjsRuntimeService.ts
      quickjsBootstrap.vm.js
      quickjsContracts.ts
    dsl/
    remote/
  compatibility/
    bundleSurfaceAdapters.ts
    legacyArtifactAdapters.ts
```

### Why This Layout Helps

- `objects/` answers what exists.
- `activations/` answers what is live.
- `harnesses/` answers how live things are driven.
- `runtimes/` answers where code executes.
- `compatibility/` makes migration incremental.

## Suggested Split For `RuntimeSurfaceSessionHost`

The current host should be decomposed into at least four responsibilities.

1. activation acquisition and recovery
2. window harness attachment
3. surface contract resolution
4. render/event dispatch

Pseudocode:

```ts
function WindowHarnessHost(props) {
  const activation = useActivation(props.activationId, props.objectRef);
  const attachment = useWindowAttachment(activation, props.windowId);
  const target = useWindowTarget(activation, props.entrypointId);
  const contract = useWindowContract(target.getWindowSurfaceContractId());

  const rawTree = useWindowRender(target, attachment.projectedState);
  const tree = contract.validateTree(rawTree);

  return contract.renderTree({
    tree,
    emitIntent: (intent) => dispatchWindowIntent(target, intent),
  });
}
```

The current file already contains these responsibilities, but they are not isolated.

## Assistant-Generated Artifacts In The New Model

This is the most important conceptual bridge from the user conversation.

Recommended interpretation:

1. assistant output creates or updates an artifact object definition,
2. the artifact object definition is persisted,
3. opening the artifact through a harness either:
   - creates a fresh activation, or
   - materializes into an existing activation,
4. the artifact explicitly declares the window surface contract it emits,
5. the runtime resolver chooses the correct runtime lane.

That is better than today's arrangement where:

- artifact persistence,
- pending registry state,
- injection behavior,
- window launch,
- and surface contract resolution

are spread across several layers.

## Detailed Implementation Notes For An Intern

### To Understand The Current Window Flow

Read these files in order:

1. [apps/todo/src/launcher/module.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/todo/src/launcher/module.tsx:36)
2. [windowingSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts:23)
3. [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:105)
4. `runtime-session-manager/*`
5. [contracts.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts:75)
6. [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js:148)

Look for:

- how a surface window payload carries `bundleId`, `surfaceId`, and `surfaceSessionId`,
- where nav state is initialized,
- where the host chooses the active surface,
- where the session is loaded and attached,
- where surface contract resolution happens,
- where render and event dispatch occur.

### To Understand Artifacts

Read these files in order:

1. [artifactRuntime.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts:93)
2. [artifactsSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.ts:46)
3. [runtimeSurfaceRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts:31)
4. [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:228)

Look for:

- how assistant output becomes persisted artifact state,
- how artifact code becomes pending runtime surface state,
- how the host injects those definitions into live sessions,
- how injection results are recorded back into Redux.

### To Understand Harness Diversity

Read these files:

- [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts:28)
- [jsSessionBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts:20)
- [attachedRuntimeSessionRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.ts:39)
- [attachedJsSessionRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/attachedJsSessionRegistry.ts:35)
- [runtimeSessionSource.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.ts:81)
- [RuntimeSurfaceDebugWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx:121)

The important lesson is that the same live session is already exposed through multiple adapters. That is strong evidence that harnesses are real architecture in this codebase, not just a thought experiment.

## Recommended Migration Strategy

Do not do a big-bang rewrite.

### Phase 1: Clarify Terms And Contracts

Actions:

- document the glossary,
- add internal type aliases where helpful,
- document that surface type is a window harness contract,
- keep strict contract failures instead of fallback defaults.

### Phase 2: Split `RuntimeSurfaceSessionHost`

Actions:

- extract activation acquisition/recovery,
- extract window attachment,
- extract surface contract resolution,
- extract render dispatch,
- extract event dispatch.

Success criteria:

- top-level host becomes orchestration only,
- pack/type errors localize cleanly,
- remount behavior becomes easier to reason about.

### Phase 3: Introduce Activation Layer

Actions:

- wrap current runtime session manager with activation terminology internally,
- move attached-view ownership to explicit activation attachments,
- expose activation summaries for tooling.

### Phase 4: Promote Artifacts To First-Class Objects

Actions:

- define artifact object metadata and capabilities,
- separate persisted artifact identity from injected activation-local definitions,
- keep a compatibility adapter for legacy surface injection.

### Phase 5: Add Another Harness Family

Candidates:

- icon harness,
- folder harness,
- automation harness,
- test harness.

This is important because a redesign that only works for window surfaces is still too narrow.

### Phase 6: Introduce Runtime Lane Resolution

Actions:

- define runtime resolver abstraction,
- route harness message families to runtime lanes explicitly,
- add mock runtimes for testing.

## Risks And Tradeoffs

### Risks

- Renaming without structural changes will make things worse.
- Artifact compatibility may regress if activation-local injection is not handled carefully.
- A new activation layer may add temporary complexity if compatibility wrappers are weak.
- Leaving harness contracts implicit would recreate the same confusion under new names.

### Tradeoffs

- Keeping `surface` as a specialized domain term is still useful.
- Introducing `activation` adds a term, but removes ambiguity.
- Compatibility layers increase short-term code volume but reduce migration risk.

## Alternatives Considered

### Alternative 1: Keep Current Terms And Only Improve Docs

Rejected because the confusion is structural, not just documentary.

### Alternative 2: Rename Everything To Classical OO Terms

Rejected because the codebase is closer to capability-based objects than strict inheritance-driven classes.

### Alternative 3: Treat Everything As A Session

Rejected because persisted objects, harness contracts, and runtime executors are not the same thing.

## Testing And Validation Strategy

Test at three levels during migration.

### Contract Tests

- explicit surface contract declaration,
- strict pack/type resolution,
- capability discovery,
- runtime lane selection.

### Harness Tests

- window harness remount and unmount,
- REPL harness visibility,
- attached registry updates,
- task-manager and debug adapters.

### Integration Tests

- `spawn inventory demo-a`,
- open predefined app surface,
- open assistant-generated artifact card,
- remount non-default surface types,
- attach JS console to a live activation.

## Recommended First Implementation Tickets

1. document glossary and add architecture comments/types
2. split `RuntimeSurfaceSessionHost` into window harness modules
3. wrap session management in activation terminology internally
4. model artifact objects separately from pending registry entries
5. add an icon harness proof of concept
6. add runtime resolver abstraction and mock runtime tests

## Design Decisions

### Decision: Object, Harness, And Runtime Are The Primary Axes

Rationale:

- these are the three questions engineers repeatedly ask,
- they match the intended future model,
- they align better with the actual code seams than the current vocabulary.

### Decision: Surface Type Is A Harness Contract

Rationale:

- it already behaves like validator + renderer family,
- it belongs on the host/harness boundary,
- it should not be invented by the runtime executor.

### Decision: Migration Must Be Incremental

Rationale:

- this subsystem already powers real flows,
- assistant-generated artifacts and runtime windows must keep working,
- a compatibility layer is cheaper than a broken rewrite.

## Implementation Plan

1. Add glossary and contract comments.
2. Split the current window host into submodules.
3. Make activation ownership explicit.
4. Separate artifact object definition from activation-local injection.
5. Add one non-window harness.
6. Add explicit runtime lane resolution.
7. Remove obsolete compatibility paths only after tests pass and usage stabilizes.

## Open Questions

- Should `activation` be internal-only or become public terminology?
- Should `surface` remain a first-class user-facing term?
- Should opening an artifact create a fresh activation by default or materialize into a shared one?
- Should `packId` remain the name for surface contract ids?
- How much compatibility layering is acceptable before legacy names become the new problem?

## References

- [contracts.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts:1)
- [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js:1)
- [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:105)
- [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts:1)
- [jsSessionBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts:1)
- [artifactRuntime.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts:1)
- [artifactsSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.ts:1)
- [runtimeSurfaceRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts:1)
- [windowingSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts:23)
- [apps/todo/src/launcher/module.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/todo/src/launcher/module.tsx:36)
- [hypercardReplDriver.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/hypercardReplDriver.ts:390)
- [attachedRuntimeSessionRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.ts:1)
- [attachedJsSessionRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/attachedJsSessionRegistry.ts:1)
- [runtimeSessionSource.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.ts:1)
- [RuntimeSurfaceDebugWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx:1)
