---
Title: Intern guide to QuickJS runtime lifecycle ownership, surface mounting, and React host boundaries
Ticket: APP-28-RUNTIME-SESSION-LIFECYCLE-OWNERSHIP
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - runtime
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/app/jsReplModule.tsx
      Note: Plain JS REPL module showing the cleaner broker-owned session model used outside runtime surface hosts
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts
      Note: Desktop window/session state showing that surface windows own nav metadata rather than QuickJS VMs
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.ts
      Note: Task Manager source that already treats runtime sessions as shared operator-visible resources
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: QuickJS runtime service that owns the actual SessionId-to-VM map
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.ts
      Note: External registry showing current attach-mode expectations around shared runtime session handles
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts
      Note: Broker pattern that informs the recommended service-owned runtime session manager direction
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Primary runtime host that currently mixes surface mounting with VM ownership
ExternalSources: []
Summary: A detailed architecture guide that explains how runtime surface windows currently mount QuickJS runtime sessions, why React cleanup is the wrong VM ownership boundary, how session registries and task-manager sources observe those sessions, and what target architecture should replace the current model.
LastUpdated: 2026-03-11T21:44:18.280369608-04:00
WhatFor: Use this guide to understand the current QuickJS runtime/session/surface lifecycle and to design a safer runtime ownership model.
WhenToUse: Use when debugging runtime VM disappearance, designing a runtime session manager, or onboarding onto the HyperCard runtime/session architecture.
---


# Intern guide to QuickJS runtime lifecycle ownership, surface mounting, and React host boundaries

## Executive Summary

The current runtime stack mixes two distinct responsibilities in one React component:

1. `RuntimeSurfaceSessionHost` mounts a runtime-authored surface into the host React tree.
2. The same component also creates, loads, recovers, and disposes the underlying QuickJS runtime session through a local `QuickJSRuntimeService`.

That coupling is fragile. The practical failure mode we just saw is that a perfectly valid runtime session id can still crash with `Runtime session not found: <sessionId>` because the React host cleanup has already disposed the VM or because a remount/recovery race is still in flight.

The system already has the beginnings of a better architecture:

- `QuickJSRuntimeService` is a service that knows how to load runtime bundles into QuickJS VMs.
- `JsSessionBroker`, `RuntimeSessionHandle` registries, and Task Manager sources already point toward service-owned session lifetimes that live outside React.
- The desktop/windowing model already treats a surface window as metadata plus a `surfaceSessionId`, not as a React-owned VM.

The design recommendation from this ticket is straightforward:

- do not let ordinary React effect cleanup own QuickJS VM disposal;
- introduce a service-owned runtime session manager as the authority for runtime VM lifetime;
- make `RuntimeSurfaceSessionHost` an attachment/view component that acquires an existing runtime session and renders a surface from it;
- let window lifecycle, task-manager sources, REPL attachment, and debug tooling all talk to the same service-owned runtime-session registry.

## Problem Statement

The current implementation makes React host mount/unmount behavior part of runtime VM ownership. That creates several classes of bugs:

### 1. React cleanup is too eager a boundary for VM disposal

`RuntimeSurfaceSessionHost` currently disposes the runtime session in an effect cleanup:

- `packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:409-416`

That means a React unmount, effect replay, remount, or host reconfiguration can destroy the underlying QuickJS VM even when the desktop/window model still considers the runtime session alive.

### 2. Surface mounting and VM ownership are conceptually different

The desktop/windowing layer models surface windows as window content metadata:

- `packages/engine/src/desktop/core/state/windowingSlice.ts:23-27`
- `packages/engine/src/desktop/core/state/windowingSlice.ts:65-72`

Opening a surface window initializes surface navigation state, not a VM object. The VM is a runtime concern layered underneath that window content. Conflating those layers makes it hard to decide who really owns the session lifetime.

### 3. Recovery is compensating for the wrong ownership model

`RuntimeSurfaceSessionHost` now has recovery logic:

- `packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:177-205`

That logic exists only because the local `QuickJSRuntimeService` can lose its VM while Redux still says the runtime session is `ready`. Recovery is useful as a safety net, but it should not be the normal path for healthy window switching.

### 4. Observers and operators already treat sessions as shared runtime resources

Task Manager, attached runtime registries, and the attached JS console all expect runtime sessions to be shared objects that can be listed, inspected, or attached to:

- `packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.ts:80-168`
- `packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.ts:10-74`
- `apps/os-launcher/src/app/jsReplModule.tsx:14-20`

That is already a service-oriented model. The React host is the outlier.

## Terms And Mental Model

Before looking at code, use these terms consistently:

- **Runtime session**: one live QuickJS VM loaded with runtime packages and one runtime bundle.
- **Runtime bundle**: the authored JS bundle plus metadata that defines runtime surfaces and handlers.
- **Runtime surface**: one renderable/eventable UI unit inside a runtime bundle.
- **Surface window**: a desktop window whose `content.kind === 'surface'`, pointing at a `surfaceSessionId` and `surfaceId`.
- **Runtime host**: the React component that projects Redux state, renders the runtime surface tree, and dispatches runtime events.
- **Runtime session manager**: the service that should own runtime VM lifetime, creation, lookup, acquisition, release, and disposal.

The current bug exists because the runtime host is doing runtime session manager work.

## Current-State Architecture

### A. Desktop/window state owns surface navigation, not QuickJS VMs

When a surface window is opened, the windowing slice initializes per-surface-session navigation:

- `packages/engine/src/desktop/core/state/windowingSlice.ts:28-72`

Important detail:

- the store creates `windowing.sessions[sessionId].nav`
- it does **not** create or dispose a QuickJS VM there

That means the desktop core already thinks in terms of:

```text
window
  -> content.kind = 'surface'
  -> surfaceSessionId
  -> nav stack
```

not:

```text
React mount owns VM
```

### B. App launchers route surface windows into RuntimeSurfaceSessionHost

App launcher modules pattern-match `content.kind === 'surface'` and render:

```tsx
<RuntimeSurfaceSessionHost windowId={window.id} sessionId={surfaceSessionId} bundle={STACK} />
```

Examples:

- `apps/os-launcher/src/app/kanbanVmModule.tsx:96-107`
- `workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.tsx:449-457`
- `workspace-links/go-go-os-frontend/apps/hypercard-tools/src/launcher/module.tsx:99-104`

So a desktop surface window currently implies a React host mount, and that host mount then creates its own local runtime service instance.

### C. RuntimeSurfaceSessionHost currently owns both rendering and VM lifecycle

The current host does all of this:

- creates a `QuickJSRuntimeService` instance in a ref:
  - `RuntimeSurfaceSessionHost.tsx:138-143`
- registers Redux runtime-session status:
  - `RuntimeSurfaceSessionHost.tsx:148-165`
- loads the runtime bundle when status is `loading`:
  - `RuntimeSurfaceSessionHost.tsx:167-298`
- injects pending runtime surfaces:
  - `RuntimeSurfaceSessionHost.tsx:214-231`
  - `RuntimeSurfaceSessionHost.tsx:300-326`
- registers attached runtime and JS session handles:
  - `RuntimeSurfaceSessionHost.tsx:328-407`
- disposes the runtime session on cleanup:
  - `RuntimeSurfaceSessionHost.tsx:409-416`
- renders and events the runtime surface:
  - `RuntimeSurfaceSessionHost.tsx:447-460`

This is the central architectural smell. The same component is acting as:

- loader
- local runtime owner
- recovery manager
- registry publisher
- render bridge
- event bridge
- disposer

That is too much responsibility for one React host.

### D. QuickJSRuntimeService is a real service with its own VM map

`QuickJSRuntimeService` already has the core service shape:

- `packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts:115-355`

Important internals:

- `vms = new Map<SessionId, SessionVm>()`
  - `runtimeService.ts:118`
- `loadRuntimeBundle(...)`
  - creates VM
  - installs runtime packages
  - evaluates bundle code
  - reads runtime bundle metadata
  - `vms.set(sessionId, vm)`
  - `runtimeService.ts:175-229`
- `disposeSession(sessionId)`
  - deletes from `vms`
  - disposes QuickJS VM
  - `runtimeService.ts:328-347`

The service is already the natural place for runtime-session ownership. What is missing is a higher-level owner that decides *when* the service should create/dispose sessions.

### E. Task Manager and attached registries already assume shared session ownership

Task Manager runtime source reads Redux runtime sessions and exposes operator actions:

- `packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.ts:80-168`

Attached runtime registry is an external store of session handles:

- `packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.ts:10-74`

The JavaScript REPL uses a separate broker model that is much closer to the desired shape:

- `packages/hypercard-runtime/src/repl/jsSessionBroker.ts:30-109`
- `apps/os-launcher/src/app/jsReplModule.tsx:14-20`

That broker is outside React. The React REPL window attaches to it. That is the right direction.

## Current Lifecycle, Step By Step

The current runtime-surface flow is:

```text
openWindow({ kind: 'surface', surfaceSessionId, surfaceId })
  ->
windowingSlice creates nav session for surfaceSessionId
  ->
launcher module renders RuntimeSurfaceSessionHost(windowId, sessionId, bundle)
  ->
RuntimeSurfaceSessionHost creates QuickJSRuntimeService in a ref
  ->
host dispatches registerRuntimeSession(status='loading')
  ->
host calls runtimeService.loadRuntimeBundle(...)
  ->
QuickJS VM is created, runtime packages installed, bundle loaded
  ->
host renders current surface through runtimeService.renderRuntimeSurface(...)
  ->
host cleanup later calls runtimeService.disposeSession(sessionId)
```

The critical flaw is the last line. The React host is assuming it is the authoritative owner of the VM.

## Failure Analysis: What The Logs Actually Showed

The important log sequence during the crash was:

```text
[QuickJSRuntimeService] Loaded runtime bundle
[RuntimeSurfaceSessionHost] Host cleanup disposing runtime session
[QuickJSRuntimeService] Disposed runtime session
[RuntimeSurfaceSessionHost] Recovering ready runtime session into fresh service
[QuickJSRuntimeService] Loading runtime bundle
[QuickJSRuntimeService] Runtime session not found
Error: Runtime session not found: session-1
[QuickJSRuntimeService] Loaded runtime bundle
```

This tells us three things:

1. the `sessionId` is valid;
2. the VM is not disappearing randomly;
3. the host is explicitly disposing it before recovery has completed.

That means the root issue is not:

- wrong session ids,
- broken package installation,
- invalid bundle code,
- or QuickJS corruption.

It is a lifecycle ownership bug.

## Why React Effect Cleanup Is The Wrong Owner

React effect cleanup is appropriate for:

- removing DOM listeners,
- unregistering ephemeral view subscriptions,
- aborting in-flight requests tied to a component instance.

It is **not** a good primary authority for long-lived runtime session disposal when:

- the runtime session is visible in global tooling,
- other windows or brokers may attach to it,
- desktop/window state can outlive any one specific React mount,
- development-mode mount/unmount/replay behavior is intentionally aggressive.

In our system, runtime sessions are already observable by:

- `Task Manager`
- `HyperCard REPL`
- attached JS console
- runtime debug windows

That makes the runtime session a shared resource. Shared resources need a service-owned lifetime boundary, not component-local cleanup.

## Proposed Solution

The target architecture should separate **runtime session ownership** from **surface mounting**.

### 1. Introduce a RuntimeSessionManager

This manager should sit above `QuickJSRuntimeService`.

It should own:

- creating runtime sessions
- loading runtime bundles
- keeping `sessionId -> runtime service / vm / metadata / refs`
- acquiring and releasing runtime sessions for views
- deciding when the runtime session is truly disposable
- publishing summaries to task/debug tooling

Sketch:

```ts
interface RuntimeSessionManager {
  ensureSession(request: {
    sessionId: string;
    bundleId: string;
    packageIds: string[];
    code: string;
    owner: RuntimeSessionOwner;
  }): Promise<RuntimeSessionHandle>;

  acquireView(sessionId: string, viewId: string): RuntimeSessionHandle;
  releaseView(sessionId: string, viewId: string): void;

  getSession(sessionId: string): RuntimeSessionHandle | null;
  listSessions(): RuntimeSessionSummary[];

  disposeSession(sessionId: string, reason?: string): boolean;
}
```

### 2. Make RuntimeSurfaceSessionHost a view attachment component

The host should:

- acquire a runtime session from the manager
- render a chosen surface
- dispatch events into that session
- register attached debug handles if useful
- release its view attachment on cleanup

It should **not**:

- create a brand-new runtime service instance as its own primary source of truth
- call `disposeSession(...)` directly as normal cleanup

Pseudo-flow:

```tsx
useEffect(() => {
  const viewId = windowId;
  let release = () => {};

  manager.ensureSession({ sessionId, bundleId, packageIds, code, owner: { kind: 'window', windowId } })
    .then(() => {
      release = manager.acquireView(sessionId, viewId);
      setReady(true);
    });

  return () => {
    release();
  };
}, [manager, sessionId, windowId, bundleId]);
```

### 3. Move disposal decisions to explicit ownership rules

The manager should decide disposal based on ownership/reference rules such as:

- window-owned session with zero live views and no attachments -> disposable
- broker-owned spawned session with zero views but open broker handle -> keep alive
- attached read-only session -> never dispose from attach host cleanup
- explicitly closed window -> maybe release ownership, maybe not, depending on policy

### 4. Keep registries as observers, not owners

These should observe the manager, not recreate lifetime rules ad hoc:

- attached runtime registry
- attached JS session registry
- task-manager sources
- runtime debug window
- REPL session listings

## Proposed Architecture Diagram

```text
Desktop window state
  -> surface window metadata
  -> surfaceSessionId
  -> nav stack

RuntimeSessionManager
  -> owns runtime session records
  -> owns ownership/ref counts
  -> uses QuickJSRuntimeService internally
  -> publishes summaries/handles

QuickJSRuntimeService
  -> owns SessionId -> VM map
  -> load bundle
  -> render surface
  -> event surface
  -> eval JS
  -> dispose VM

RuntimeSurfaceSessionHost
  -> acquire manager session for windowId
  -> render current surface
  -> dispatch events
  -> release view on cleanup

Task Manager / REPL / Debug windows
  -> subscribe to manager-owned summaries and handles
```

## Design Decisions

### Decision 1: runtime VM lifetime must be service-owned, not React-owned

Rationale:

- React mount/unmount is a view concern.
- VM lifetime is a shared runtime concern.
- The current crash is direct evidence that those concerns are mis-layered.

### Decision 2: surface windows should own view attachments, not disposal

Rationale:

- windows clearly correspond to view instances
- they do not necessarily correspond one-to-one with runtime VM lifetime
- duplicate windows, preview windows, REPL attachment, and task-manager inspection all need this distinction

### Decision 3: recovery should become a last-resort path, not a normal control flow

Rationale:

- once a manager owns the session, the host should not need to reconstruct VMs due to ordinary React churn
- recovery remains useful for exceptional faults, but it should not be compensating for routine cleanup misfires

## Alternatives Considered

### Alternative A: keep the current host-owned model and patch more `useEffect` guards

Rejected because:

- it treats the symptom instead of the ownership problem
- every new feature adds more shared session observers
- more guards will still leave React cleanup as the disposer

### Alternative B: make recovery fully robust and accept VM recreation as normal

Rejected because:

- it hides the wrong ownership boundary
- it can lose in-VM transient state
- it makes task/debug attachment semantics harder to reason about

### Alternative C: put runtime sessions directly in Redux

Rejected because:

- the VM/service objects are behaviorful and non-serializable
- Redux should hold projections and summaries, not QuickJS VM instances

## Implementation Plan

### Phase 1: introduce a runtime session manager service

- build a `RuntimeSessionManager` in `hypercard-runtime`
- let it internally own one or more `QuickJSRuntimeService` instances
- move session summaries/handles there

### Phase 2: change RuntimeSurfaceSessionHost to attach, not own

- replace local `QuickJSRuntimeService` creation with manager lookup/acquisition
- remove direct `disposeSession(...)` from host cleanup
- cleanup becomes `releaseView(windowId)`

### Phase 3: unify observer tooling on the manager

- task-manager runtime rows read from manager-owned summaries
- attached runtime registry derives from manager handles
- attached JS console for runtime sessions derives from the same manager handle

### Phase 4: add explicit ownership policies

- decide when a session is:
  - window-owned
  - broker-owned
  - attached-only
  - shared
- encode disposal rules centrally

### Phase 5: test remount and churn paths explicitly

- React rerender
- React remount
- focus/window switch
- duplicate window opening
- task-manager inspection
- HyperCard REPL attach
- attached JS console attach

## Testing Strategy

Add tests that assert:

- opening a surface window does not lose the runtime VM during rerender
- multiple view mounts against one runtime session do not dispose the VM until the last owner releases it
- attached runtime/JS session registries survive host rerenders
- closing a view releases its attachment without necessarily destroying the VM
- explicit dispose removes the VM once and updates observers consistently

Relevant existing tests to extend:

- `packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx`
- `packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts`
- `packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.test.tsx`
- `packages/hypercard-runtime/src/repl/attachedJsSessionRegistry.test.ts`

## Open Questions

1. Should a bundle home window and a duplicated surface window share one runtime session by default, or should some apps opt into per-window sessions?
2. Should runtime sessions be ref-counted only by mounted views, or also by explicit broker handles and REPL attachments?
3. Should the manager own one `QuickJSRuntimeService` instance globally, or shard by bundle/app/source?
4. How should writable attach mode interact with manager ownership once APP-22 allows mutation?

## References

Core lifecycle files:

- `packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`
- `packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
- `packages/engine/src/desktop/core/state/windowingSlice.ts`
- `packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.ts`
- `packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.ts`
- `apps/os-launcher/src/app/jsReplModule.tsx`
- `packages/hypercard-runtime/src/repl/jsSessionBroker.ts`

Related tickets:

- `APP-22` REPL runtime bridge
- `APP-24` clean JS REPL profile
- `APP-25` runtime session task manager
- `APP-26` runtime service-layer refactor

## Proposed Solution

<!-- Describe the proposed solution in detail -->

## Design Decisions

<!-- Document key design decisions and rationale -->

## Alternatives Considered

<!-- List alternative approaches that were considered and why they were rejected -->

## Implementation Plan

<!-- Outline the steps to implement this design -->

## Open Questions

<!-- List any unresolved questions or concerns -->

## References

<!-- Link to related documents, RFCs, or external resources -->
