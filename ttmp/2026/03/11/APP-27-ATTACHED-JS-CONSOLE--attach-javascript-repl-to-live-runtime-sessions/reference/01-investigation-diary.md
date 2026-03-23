---
Title: Investigation diary
Ticket: APP-27-ATTACHED-JS-CONSOLE
Status: active
DocType: reference
Topics:
  - frontend
  - repl
  - hypercard
Summary: Working diary for attached JS console research and implementation.
---

# Investigation diary

## 2026-03-11

Started APP-27 because APP-24 deliberately stopped at spawned blank JS sessions. The immediate architectural question was whether an attached JS console should be modeled as:

- a spawned JS session with special metadata, or
- a second source of sessions in the JS REPL

The current design direction is the second one. Spawned JS sessions and attached runtime-backed JS sessions have different ownership semantics, so the first slice should keep them distinct and let `JsReplDriver` attach/use both rather than pretending they are the same thing.

The first implementation slice now works. I extracted the plain JS eval/log plumbing out of `JsSessionService` into a shared `jsEvalSupport.ts` helper so the runtime service could reuse the same bridge instead of growing a second incompatible eval path. That let `QuickJSRuntimeService` add `evaluateSessionJs(...)` and `getSessionGlobalNames(...)` directly against live runtime VMs.

On the host side, I added an attached-session registry that stores runtime-backed JS handles separately from the spawned `JsSessionBroker`. `RuntimeSurfaceSessionHost` now registers a runtime-backed handle whenever an interactive runtime session becomes ready. The handle deliberately exposes only:

- `evaluate(code)`
- `inspectGlobals()`

There is no reset/dispose path for attached sessions, because the owning window still owns lifecycle.

The `JavaScript REPL` driver now treats session sources as a union:

- spawned blank JS sessions from `JsSessionBroker`
- attached runtime-backed JS sessions from `attachedJsSessionRegistry`

That allowed the driver to add:

- `:attach <session-id>`
- mixed `:sessions`
- mixed `:use`
- prompt states like `js[runtime:<session-id>]>`
- safe blocking of `:reset` / `:dispose` when the active session is attached

Focused tests passed for:

- `jsSessionService`
- `runtimeService.integration`
- `attachedJsSessionRegistry`
- `jsReplDriver`
- `RuntimeSurfaceSessionHost.rerender`

I also ran a live browser smoke on `http://localhost:5173`:

1. opened the Inventory folder
2. opened the `Low Stock` runtime surface
3. opened `JavaScript REPL`
4. ran `:sessions`
5. attached to the live inventory runtime session
6. ran `:globals`
7. evaluated `typeof ui`

The prompt changed to `js[runtime:<session-id>]>`, globals included runtime APIs like `ui`, and `typeof ui` returned `object`, which confirmed the REPL was evaluating inside the already-running runtime VM rather than inside a separate spawned JS session.

The next small ergonomics problem was obvious after that smoke: operators still had to open `JavaScript REPL`, run `:sessions`, and then `:attach <session-id>`. That made the feature technically correct but clumsy. I decided the right next step was not more attach-mode mutation work; it was a direct operator affordance from `Task Manager`.

That led to a second slice:

- add a `JS Console` action to runtime-session rows in `Task Manager`
- let the `js-repl` app open a targeted console window for a specific runtime session
- start that window with the attached session already selected

To do that cleanly, I did **not** add imperative command execution into `MacRepl`. Instead, I let the `js-repl` module construct a driver with:

- `initialSessionId`
- `initialOrigin: 'attached-runtime'`

and I let the window payload encode the target session id in the app instance id. That kept the REPL shell generic and pushed the behavior into the driver/module boundary where it belongs.

The live smoke for that second slice also worked:

1. opened `Task Manager`
2. found the live runtime row for `session-1`
3. clicked `JS Console`
4. verified a new window titled `JavaScript REPL · session-1`
5. verified the prompt started at `js[runtime:session-1]>`
6. ran `:globals` successfully without first typing `:attach`

That is the better operator flow. The JavaScript console is still attached and read-write in the sense that it evaluates code in the live VM, but the path to get there is now a single click from the session-manager UI instead of a manual attach sequence.
