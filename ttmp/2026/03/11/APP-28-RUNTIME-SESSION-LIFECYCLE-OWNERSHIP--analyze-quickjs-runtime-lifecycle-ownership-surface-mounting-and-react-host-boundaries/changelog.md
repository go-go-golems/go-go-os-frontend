# Changelog

## 2026-03-11

- Initial workspace created
- Added the architecture analysis for QuickJS runtime lifecycle ownership, surface mounting, and React host boundaries.
- Recorded the key finding that `RuntimeSurfaceSessionHost` currently owns QuickJS VM disposal through React cleanup, which is the wrong lifetime boundary.
- Proposed the target direction: move VM/session ownership into a service-owned runtime session manager and treat React hosts as attach/detach views only.
- Implemented Slice 1: added a service-owned `RuntimeSessionManager` in `hypercard-runtime` with explicit `ensureSession`, `attachView`, `detachView`, `disposeSession`, and summary publication APIs.
- Added focused manager tests proving:
  - session ensure is shared and idempotent
  - view attachment does not dispose the VM
  - disposal remains explicit
  - conflicting session reconfiguration is rejected
- Implemented Slice 2: refactored `RuntimeSurfaceSessionHost` to load and access runtime sessions through `DEFAULT_RUNTIME_SESSION_MANAGER` rather than owning a private `QuickJSRuntimeService`.
- Implemented Slice 3: moved runtime-session disposal onto explicit desktop window lifecycle with `runtimeSessionLifecycleMiddleware`, so `closeWindow(...)` is now the VM teardown boundary instead of React effect cleanup.
- Added focused validation proving:
  - rerender/remount no longer disposes the runtime session
  - the last surface window closing disposes the VM and removes runtime-session Redux state
  - runtime host, manager, and JS REPL/task-manager integration tests still pass together
- Browser smoke is still pending against a running `localhost:5173` dev server from this session.
- Completed Slice 4: Task Manager runtime rows, attached runtime sessions, and attached JS sessions now derive from `RuntimeSessionManager` instead of host-local registration or Redux runtime-session existence projection.
- Removed the host-side `registerAttachedRuntimeSession(...)` / `registerAttachedJsSession(...)` effect from `RuntimeSurfaceSessionHost`; attached registries are now read-only manager projections.
- Added focused validation proving:
  - Task Manager rows reflect manager-owned session summaries and attached view counts
  - HyperCard REPL attach mode still works against derived attached runtime sessions
  - JavaScript REPL attach mode still works against derived attached JS sessions
- Started Slice 6 test hardening with a new `RuntimeSurfaceSessionHost` StrictMode remount/effect replay regression test, proving the managed runtime session survives React dev-mode replay.
- Completed Slice 5: added explicit runtime-session ownership classes and threaded them through manager summaries, spawned broker sessions, attached runtime projections, and Task Manager rows.
- Encoded the first central disposal rule in `runtimeSessionLifecycleMiddleware`: only `window-owned` runtime sessions are eligible for automatic teardown on last surface-window close.
- Added focused validation proving non-window-owned sessions survive the last-window-close lifecycle path without being disposed implicitly.
- Completed the APP-28 smoke pass against `http://localhost:5173` with no browser console errors after opening launcher and inventory runtime windows; the previous runtime-host crash is no longer reproducing in that path.
