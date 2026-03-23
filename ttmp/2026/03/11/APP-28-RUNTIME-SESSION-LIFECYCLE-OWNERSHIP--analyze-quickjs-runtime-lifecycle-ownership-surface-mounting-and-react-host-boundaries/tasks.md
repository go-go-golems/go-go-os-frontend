# Tasks

## Analysis Deliverables

- [x] Create APP-28 ticket workspace and primary design doc.
- [x] Map the current desktop surface-window lifecycle from `openWindow(...)` to `RuntimeSurfaceSessionHost`.
- [x] Map the current QuickJS runtime lifecycle inside `QuickJSRuntimeService`.
- [x] Map the current registry/broker/task-manager paths that observe runtime and JS sessions.
- [x] Capture the current failure mode with concrete logs and code references.
- [x] Write a detailed architecture guide for a new intern.
- [x] Maintain a chronological investigation diary with commands, findings, and review notes.
- [x] Upload the ticket bundle to reMarkable.

## Implementation Slices

- [x] Slice 1: Introduce a service-owned `RuntimeSessionManager` in `hypercard-runtime`.
  - Responsibilities:
    - own `sessionId -> runtime service / bundle meta / attachment state`
    - expose `ensureSession(...)`, `getSession(...)`, `attachView(...)`, `detachView(...)`, `disposeSession(...)`
    - publish serializable session summaries for tooling
  - Files:
    - `packages/hypercard-runtime/src/runtime-session-manager/*`
    - `packages/hypercard-runtime/src/index.ts`
  - Validation:
    - focused manager unit tests
    - no app behavior changes yet

- [x] Slice 2: Refactor `RuntimeSurfaceSessionHost` to attach to the manager instead of owning a private `QuickJSRuntimeService`.
  - Replace:
    - `runtimeServiceRef`
    - direct `loadRuntimeBundle(...)`
    - direct `disposeSession(...)` in host cleanup
  - With:
    - manager `ensureSession(...)`
    - manager `attachView(windowId)`
    - manager `detachView(windowId)`
  - Preserve:
    - projected state rendering
    - runtime action dispatch
    - runtime surface injection
  - Validation:
    - rerender/remount tests
    - typecheck
    - live browser smoke pending against a running dev server

- [x] Slice 3: Move explicit runtime-session disposal onto real window lifecycle instead of React cleanup.
  - Add a runtime lifecycle listener/middleware in `createAppStore(...)`
  - Observe `closeWindow(...)` and dispose runtime sessions for windows that truly close
  - Keep duplicate mounts/remounts from disposing the VM
  - Validation:
    - window close tests
    - no runtime disappearance on focus/window switching once browser smoke is rerun

- [x] Slice 4: Make Task Manager, attached runtime registry, and attached JS registry read from the manager-owned session source of truth.
  - [x] Runtime rows reflect manager summaries rather than Redux runtime-session projection
  - [x] Attached registries adapt manager handles instead of local host registration
  - Validation:
    - [x] Task Manager rows stay accurate during remounts in focused tests
    - [x] JS console / REPL attachment survives host churn in focused tests

- [x] Slice 5: Define explicit ownership classes for runtime sessions.
  - Model:
    - window-owned surface session
    - broker-owned spawned session
    - attached read-only observer
    - attached writable observer (future)
  - Encode ownership and disposal rules centrally
  - Validation:
    - process/task-manager scenarios
    - explicit manager lifecycle tests

- [x] Slice 6: Broaden lifecycle testing and docs.
  - Add tests for:
    - [x] React StrictMode remount/effect replay
    - [x] duplicate surface windows
    - [x] Task Manager inspection + JS console attach
    - [x] HyperCard REPL attach to live session
  - Update:
    - [x] runtime docs
    - [x] APP-28 diary/changelog
