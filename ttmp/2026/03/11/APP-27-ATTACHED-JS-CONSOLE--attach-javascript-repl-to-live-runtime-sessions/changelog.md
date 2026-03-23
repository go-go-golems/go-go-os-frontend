# Changelog

## 2026-03-11

- Created APP-27 as the dedicated follow-up ticket for attaching the plain JavaScript REPL to live runtime sessions
- Documented the architectural split between:
  - spawned blank JS sessions
  - attached host-owned runtime JS sessions
- Wrote the first implementation plan for runtime-service helpers, an attached-JS registry, and JS REPL attach flows
- Added shared QuickJS eval/log plumbing so both `JsSessionService` and `QuickJSRuntimeService` can evaluate plain JS and inspect globals through the same bridge
- Added an attached-JS-session registry for live runtime sessions and registered handles from `RuntimeSurfaceSessionHost`
- Extended `JsReplDriver` so the `JavaScript REPL` can:
  - list attached runtime-backed sessions
  - `:attach` / `:use` them
  - show runtime-attached prompts like `js[runtime:<session-id>]>`
  - evaluate plain JS inside the live runtime VM
  - inspect globals while blocking `:reset` and `:dispose`
- Verified the end-to-end browser flow on `http://localhost:5173`:
  - opened Inventory `Low Stock`
  - opened `JavaScript REPL`
  - listed attached runtime sessions with `:sessions`
  - attached to the live inventory session with `:attach <session-id>`
  - inspected globals with `:globals`
  - evaluated `typeof ui` inside the attached runtime VM
- Added a `JS Console` action to runtime rows in `Task Manager`
- Added session-targeted `JavaScript REPL` windows that start already attached to a live runtime-backed JS session
- Verified the Task Manager flow on `http://localhost:5173`:
  - opened `Task Manager`
  - clicked `JS Console` on a live runtime row
  - confirmed a `JavaScript REPL · <session-id>` window opened with prompt `js[runtime:<session-id>]>`
  - ran `:globals` successfully without a manual `:attach`
