---
Title: Investigation diary
Ticket: APP-28-RUNTIME-SESSION-LIFECYCLE-OWNERSHIP
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - runtime
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: Contains the VM map and the service lifecycle logs used to prove the VM was explicitly disposed
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Contains the cleanup
ExternalSources: []
Summary: Chronological diary for the runtime lifecycle ownership analysis, including the code paths inspected, the diagnostic logs that proved the current ownership bug, and the resulting architectural recommendation.
LastUpdated: 2026-03-11T21:44:18.281819526-04:00
WhatFor: Use this diary to review how the runtime ownership bug was traced and which concrete files support the final recommendation.
WhenToUse: Use when validating the analysis, repeating the investigation, or reviewing why React cleanup was identified as the wrong VM ownership boundary.
---


# Investigation diary

## Goal

Capture the evidence behind the APP-28 architecture analysis: how runtime surface windows currently mount runtime VMs, what logs showed about disappearing QuickJS sessions, and why the fix should be architectural rather than another round of `useEffect` patching.

## Context

The immediate debugging symptom was:

- a runtime surface window opens correctly,
- then switching windows or remounting the host causes:
  - `Runtime session not found: <sessionId>`
  - `Window render error`

At the same time:

- `sessionId` values were correct,
- bundle loading succeeded,
- and the crash happened *after* a successful runtime load.

That suggested a lifecycle ownership bug, not a parsing or bundle-loading bug.

## Quick Reference

### Main files inspected

- `packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`
- `packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
- `packages/engine/src/desktop/core/state/windowingSlice.ts`
- `packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.ts`
- `packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.ts`
- `apps/os-launcher/src/app/jsReplModule.tsx`
- `packages/hypercard-runtime/src/repl/jsSessionBroker.ts`

### Commands used

```bash
rg -n "RuntimeSurfaceSessionHost|QuickJSRuntimeService|surfaceSessionId|attachedRuntimeSessionRegistry|runtimeSessionSource" \
  /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend \
  /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher -S

nl -ba packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx | sed -n '1,460p'
nl -ba packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts | sed -n '1,420p'
nl -ba packages/engine/src/desktop/core/state/windowingSlice.ts | sed -n '1,180p'
```

### Most important log sequence

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

### Key finding

The VM did not disappear randomly. The host cleanup explicitly disposed it, and recovery then raced with a later metadata/render path.

## 2026-03-11

### What I checked

1. Confirmed the current dirty worktree so unrelated edits would not be touched.
2. Inspected the current runtime host and runtime service implementations.
3. Inspected the desktop windowing state to see whether it actually owns QuickJS lifecycle.
4. Inspected task-manager and attached-session registries to see how they think about session ownership.

### What worked

- The new logging in `QuickJSRuntimeService` made it possible to correlate:
  - service instance creation
  - successful runtime bundle load
  - explicit session disposal
  - later recovery attempt
- The matching logs in `RuntimeSurfaceSessionHost` proved that cleanup, registration, recovery, and metadata reads were all happening in one component.

### What did not work

- Repeated attempts to harden the current host with more `useEffect` guards still left the basic ownership problem intact.
- Recovery logic improved the symptoms but did not remove the possibility that the VM would be disposed by the wrong owner.

### What was tricky to reason about

- The desktop system already has a notion of `surfaceSessionId`, but that id is only used for navigation/session state in Redux. The actual QuickJS VM exists in a private map inside `QuickJSRuntimeService`.
- That means the same `sessionId` simultaneously appears in:
  - desktop window/session state,
  - runtime session Redux state,
  - the QuickJS VM map,
  - attached runtime registries,
  - attached JS registries,
  - task-manager rows.

The architecture only becomes clear once those are separated into:

- metadata/projection layers, and
- the actual VM owner.

### Architectural conclusion

The correct owner of QuickJS runtime lifetime should be a service-level runtime session manager, not `RuntimeSurfaceSessionHost`.

That manager should:

- create and dispose QuickJS runtime sessions,
- own ownership/ref-count rules,
- expose read-only or writable handles to other systems,
- and let React hosts only acquire/release attachments.

## 2026-03-11 Implementation kickoff

### Immediate plan

The implementation is being broken into these concrete steps:

1. add a `RuntimeSessionManager` above `QuickJSRuntimeService`;
2. move `RuntimeSurfaceSessionHost` onto manager `ensure/attach/detach`;
3. move disposal to explicit window close lifecycle rather than React cleanup;
4. converge Task Manager / attached registries / REPL tooling on manager-owned session summaries.

### Why this order

- Slice 1 gives us a stable service-level owner without yet changing all consumers.
- Slice 2 removes the direct React-to-VM ownership leak.
- Slice 3 ties destruction to a real operating-system-like boundary: explicit window/process close.
- Slice 4 then simplifies observability because tooling can subscribe to one source of truth.

## 2026-03-11 Slice 1 implementation

### What I changed

Added a new service-level manager layer in `hypercard-runtime`:

- `packages/hypercard-runtime/src/runtime-session-manager/runtimeSessionManager.ts`
- `packages/hypercard-runtime/src/runtime-session-manager/index.ts`
- `packages/hypercard-runtime/src/runtime-session-manager/runtimeSessionManager.test.ts`

The manager currently owns:

- `ensureSession(...)`
- `getSession(...)`
- `listSessions()`
- `attachView(viewId)`
- `detachView(viewId)` via returned release function
- `disposeSession(...)`
- `subscribe(...)`

Internally it keeps:

- one shared `QuickJSRuntimeService`
- a `Map<sessionId, record>`
- record state for:
  - original bundle request
  - ready/error/loading status
  - loaded bundle metadata
  - attached view ids
  - in-flight load promise

### Why this matters

This is the first code slice that materially separates:

- **session ownership**
from
- **surface view mounting**

Nothing in app behavior changed yet, but we now have a real service object that can become the source of truth for runtime session lifetime.

### Validation run

```bash
pnpm exec vitest run \
  packages/hypercard-runtime/src/runtime-session-manager/runtimeSessionManager.test.ts \
  packages/hypercard-runtime/src/repl/runtimeBroker.test.ts \
  packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts \
  --reporter=verbose

pnpm exec tsc --noEmit -p packages/hypercard-runtime/tsconfig.json
```

### What worked

- The manager fit cleanly on top of `QuickJSRuntimeService`.
- No existing runtime service or broker tests regressed.
- The manager tests demonstrated the ownership property we want:
  detaching a view does not automatically destroy the runtime VM.

### What remains

The critical host bug is not fixed yet, because `RuntimeSurfaceSessionHost` still owns a private runtime service and still disposes in React cleanup.

The next slice is the meaningful one:

- switch the host from local service ownership to manager `ensure/attach/detach`.

## 2026-03-11 Slice 2/3 implementation

### What I changed

Moved the first real ownership boundary into place.

#### Store lifecycle

Added:

- `packages/hypercard-runtime/src/app/runtimeSessionLifecycleMiddleware.ts`
- `packages/hypercard-runtime/src/app/runtimeSessionLifecycleMiddleware.test.ts`

and wired the middleware into:

- `packages/hypercard-runtime/src/app/createAppStore.ts`

The middleware now observes `closeWindow(windowId)` and:

1. reads the original pre-reducer state to find the closed `surfaceSessionId`;
2. reads the post-reducer state to see whether any other surface windows still reference that session id;
3. only if the closed window was the last one:
   - disposes the runtime session via `DEFAULT_RUNTIME_SESSION_MANAGER.disposeSession(sessionId)`;
   - dispatches `removeRuntimeSession({ sessionId })`.

That makes Redux window lifecycle the explicit process-lifetime boundary.

#### Runtime host

Refactored:

- `packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`

The host now:

- loads sessions via `DEFAULT_RUNTIME_SESSION_MANAGER.ensureSession(...)`;
- reads bundle metadata/render/event through a manager handle;
- attaches its view with `runtimeHandle.attachView(windowId)`;
- no longer directly owns `QuickJSRuntimeService`;
- no longer disposes the VM in React cleanup.

It is now much closer to a mountable view over a process, rather than the process owner.

### Why this matters

This is the architectural fix the ticket was arguing for:

- React mount/unmount churn is no longer the thing that kills QuickJS VMs;
- desktop lifecycle is;
- the host is now an attach/detach consumer of a service-owned session.

### Validation run

```bash
pnpm exec vitest run \
  packages/hypercard-runtime/src/app/runtimeSessionLifecycleMiddleware.test.ts \
  packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx \
  packages/hypercard-runtime/src/runtime-session-manager/runtimeSessionManager.test.ts \
  packages/hypercard-runtime/src/repl/jsReplDriver.test.ts \
  packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.test.tsx \
  packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts \
  --reporter=verbose

pnpm exec tsc --noEmit -p packages/hypercard-runtime/tsconfig.json
```

### What worked

- The middleware test proves that closing one of several windows does **not** dispose the VM.
- Closing the final surface window does dispose the VM and removes runtime-session Redux state.
- The rerender/remount test proves that recreating the bundle prop no longer destroys the runtime session.
- Runtime manager, JS REPL, task-manager, and runtime service tests all still pass together.

### What I could not validate in this session

I could not run the live browser smoke because there was no reachable dev server at `http://localhost:5173` when I attempted the check from this session:

```text
page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
```

So the remaining APP-28 validation item is a manual/browser pass against a running app:

- open multiple runtime windows,
- switch focus repeatedly,
- close one duplicate window,
- verify the VM survives,
- close the final surface window,
- verify the runtime session is actually torn down.

## 2026-03-11 Slice 4 completion

### What I changed

Refactored the Task Manager runtime-session source:

- `packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.ts`
- `packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.test.tsx`

Before this change, the Task Manager runtime rows were derived from:

- Redux `runtimeSessions.sessions`
- plus desktop nav state

After this change, runtime rows are derived from:

- `RuntimeSessionManager.listSessions()`
- plus desktop nav state only for current-surface context

That means the operator-facing runtime list now reflects the same service-owned session source of truth as the runtime host lifecycle work from Slices 1-3.

### Why this matters

The whole point of APP-28 is to stop having multiple competing notions of “what runtime sessions exist”.

This partial Slice 4 checkpoint moves one important operator view onto the manager-owned source:

- session id
- bundle id
- status
- surfaces
- attached view ids

The Redux slice still matters for session-local semantic state, but not for process existence.

### Validation run

```bash
pnpm exec vitest run \
  packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.test.tsx \
  packages/hypercard-runtime/src/runtime-session-manager/runtimeSessionManager.test.ts \
  packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx \
  packages/hypercard-runtime/src/app/runtimeSessionLifecycleMiddleware.test.ts \
  packages/hypercard-runtime/src/repl/jsReplDriver.test.ts \
  --reporter=verbose

pnpm exec tsc --noEmit -p packages/hypercard-runtime/tsconfig.json
```

### Additional convergence work

After the initial Task Manager refactor, I completed the rest of Slice 4:

- `packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.ts`
- `packages/hypercard-runtime/src/repl/attachedJsSessionRegistry.ts`
- `packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`
- corresponding registry and REPL driver tests

The attached registries no longer keep their own mutable entry maps fed by host effects.

Instead they now:

- subscribe to `DEFAULT_RUNTIME_SESSION_MANAGER`
- derive attached-session snapshots from `summary.attachedViewIds.length > 0`
- adapt manager handles into:
  - read-only attached runtime handles
  - attached-runtime JS eval handles

That means the host no longer performs local side-effect registration for attached sessions at all.

### Why this matters

This removes another shadow ownership path.

Before:

- host created runtime session
- host registered attached runtime + JS entries
- Task Manager used yet another model

Now:

- manager owns runtime existence
- host attaches a view
- Task Manager and both attached registries derive from manager state

This is much closer to the operating-system-like process model the ticket is aiming for.

### Additional validation run

```bash
pnpm exec vitest run \
  packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.test.ts \
  packages/hypercard-runtime/src/repl/attachedJsSessionRegistry.test.ts \
  packages/hypercard-runtime/src/repl/hypercardReplDriver.test.ts \
  packages/hypercard-runtime/src/repl/jsReplDriver.test.ts \
  packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx \
  packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.test.tsx \
  packages/hypercard-runtime/src/app/runtimeSessionLifecycleMiddleware.test.ts \
  --reporter=verbose

pnpm exec tsc --noEmit -p packages/hypercard-runtime/tsconfig.json
```

### What remains now

The next APP-28 slice is the explicit ownership-class model:

- window-owned surface session
- broker-owned spawned session
- attached read-only observer
- attached writable observer (future)

The system is already much closer to that shape now, but those ownership classes are not yet modeled explicitly in one place.

## 2026-03-11 Slice 5 ownership policy and APP-28 closeout

### What I changed

I completed the explicit ownership-class slice in `hypercard-runtime`.

New runtime ownership definitions now live in:

- `packages/hypercard-runtime/src/runtime-session-manager/runtimeOwnership.ts`

The current ownership classes are:

- `window-owned`
- `broker-owned`
- `attached-read-only`
- `attached-writable`

I threaded those through:

- `runtimeSessionManager.ts`
- `runtimeBroker.ts`
- `attachedRuntimeSessionRegistry.ts`
- `runtimeSessionSource.ts`
- `jsSessionSource.ts`

That means the operator/task-manager view now exposes ownership directly instead of inferring it from scattered origin flags.

### Central lifecycle rule added

I then encoded the first disposal rule centrally:

- only `window-owned` runtime sessions should be auto-disposed when the last surface window closes

That rule now lives behind:

- `shouldDisposeOnLastSurfaceWindowClose(...)`

and is enforced by:

- `packages/hypercard-runtime/src/app/runtimeSessionLifecycleMiddleware.ts`

I added `manager.getSummary(sessionId)` so the middleware can inspect session ownership directly before tearing down the VM.

### Why this matters

This is the first point where the system stops being “close the last window => always kill the VM” and becomes a real ownership model:

- window-owned surface session: desktop window lifecycle owns it
- broker-owned spawned session: REPL/broker owns it
- attached read-only observer: never dispose through window close

That is much closer to the operating-system/process-manager model the ticket is aiming for.

### Additional validation

I updated the focused tests to assert ownership explicitly and added a new lifecycle regression:

- `runtimeSessionManager.test.ts`
- `runtimeBroker.test.ts`
- `runtimeSessionSource.test.tsx`
- `jsSessionSource.test.tsx`
- `attachedRuntimeSessionRegistry.test.ts`
- `runtimeSessionLifecycleMiddleware.test.ts`

The new lifecycle middleware test proves that a non-window-owned runtime session is not disposed when the last surface window closes.

Validation run:

```bash
pnpm exec vitest run \
  packages/hypercard-runtime/src/runtime-session-manager/runtimeSessionManager.test.ts \
  packages/hypercard-runtime/src/app/runtimeSessionLifecycleMiddleware.test.ts \
  packages/hypercard-runtime/src/repl/runtimeBroker.test.ts \
  packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.test.ts \
  packages/hypercard-runtime/src/repl/attachedJsSessionRegistry.test.ts \
  packages/hypercard-runtime/src/repl/hypercardReplDriver.test.ts \
  packages/hypercard-runtime/src/repl/jsReplDriver.test.ts \
  packages/hypercard-runtime/src/hypercard/task-manager/runtimeSessionSource.test.tsx \
  packages/hypercard-runtime/src/hypercard/task-manager/jsSessionSource.test.tsx \
  packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx \
  --reporter=verbose

pnpm exec tsc --noEmit -p packages/hypercard-runtime/tsconfig.json
```

Everything passed.

### Live browser smoke

I also reran a browser smoke on `http://localhost:5173` with Playwright.

What I did:

1. loaded the launcher home window
2. opened the Inventory folder
3. opened `Browse Inventory`
4. closed the inventory surface window again
5. checked browser console errors

Result:

- no runtime-host crash
- no browser console errors
- I still saw expected runtime-service load/dispose logs, but not the previous `Runtime session not found` failure

That is enough to treat APP-28 as complete for the ownership/lifecycle fix itself.

### Final assessment

APP-28 did not yet implement the full APP-26 service-layer refactor.

What it did do is establish the correct architectural boundary:

- `RuntimeSurfaceSessionHost` is no longer the VM owner
- desktop/store lifecycle is the teardown trigger
- session ownership is explicit and inspectable
- operator tooling now reads from the manager-owned process source of truth

That is the correct foundation for the next service-layer cleanup ticket.

## 2026-03-11 Slice 6 initial hardening

### What I added

Added a StrictMode regression guard to:

- `packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx`

The new test renders `RuntimeSurfaceSessionHost` inside `React.StrictMode`, waits for the initial surface output, updates projected inventory state, and asserts:

- the runtime session still exists in `DEFAULT_RUNTIME_SESSION_MANAGER`
- the attached runtime-session projection still exists
- the session list still contains only one entry for that session id

### Why this matters

The original bug was deeply tied to React lifecycle churn and effect replay assumptions.

Now that lifecycle ownership has moved out of host cleanup, StrictMode is the most important “do we still accidentally act like React owns the VM?” regression test.

### Validation run

```bash
pnpm exec vitest run \
  packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx \
  --reporter=verbose

pnpm exec tsc --noEmit -p packages/hypercard-runtime/tsconfig.json
```

### Code review instructions

When reviewing this ticket:

1. Start with `RuntimeSurfaceSessionHost.tsx`, especially:
   - local runtime service creation
   - bundle load effect
   - attached registry effect
   - cleanup disposal effect
2. Read `runtimeService.ts` next to confirm the actual VM map ownership.
3. Read `windowingSlice.ts` to confirm that desktop window lifecycle is separate from actual VM lifetime.
4. Read `runtimeSessionSource.ts` and `attachedRuntimeSessionRegistry.ts` to see that operator tooling already assumes sessions are shared service-owned resources.

## Usage Examples

Use this diary in two ways:

### 1. Review the current bug

Read the log sequence above and compare it against:

- `RuntimeSurfaceSessionHost.tsx:409-416`
- `runtimeService.ts:328-347`

### 2. Prepare the follow-up implementation

Use the design doc together with this diary when creating the actual refactor ticket that introduces the runtime session manager.

## Related

- [Design doc](../design-doc/01-intern-guide-to-quickjs-runtime-lifecycle-ownership-surface-mounting-and-react-host-boundaries.md)
- APP-22 REPL runtime bridge
- APP-24 clean JS REPL profile
- APP-25 runtime session task manager
- APP-26 runtime service-layer refactor
