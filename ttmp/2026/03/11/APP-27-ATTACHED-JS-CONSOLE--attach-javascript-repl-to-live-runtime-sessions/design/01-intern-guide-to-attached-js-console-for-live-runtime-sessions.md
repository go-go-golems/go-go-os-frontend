---
Title: Intern guide to attached JS console for live runtime sessions
Ticket: APP-27-ATTACHED-JS-CONSOLE
Status: active
DocType: design-doc
Topics:
  - frontend
  - repl
  - hypercard
  - architecture
Summary: Detailed implementation guide for attaching the JavaScript REPL to live runtime sessions without pretending those sessions are blank JS sessions or runtime-surface sessions.
---

# Intern guide to attached JS console for live runtime sessions

## What problem we are solving

Today there are two separate console worlds:

- the `HyperCard REPL`, which speaks in `RuntimeBundle` / `RuntimeSurface` terms
- the `JavaScript REPL`, which speaks in plain JS session terms

The missing capability is:

- take an already-running runtime session
- attach a plain JS console to its underlying QuickJS VM
- evaluate JavaScript in that live VM
- inspect globals without pretending that the session is a spawned blank JS session

That is the purpose of APP-27.

## Current architecture

### Spawned blank JS sessions

Spawned blank JS sessions flow through:

- [jsSessionService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/jsSessionService.ts)
- [jsSessionBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts)
- [jsReplDriver.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsReplDriver.ts)

These sessions are broker-owned and can be:

- spawned
- reset
- disposed
- inspected

### Live runtime sessions

Live runtime sessions flow through:

- [runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts)
- [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx)

These sessions already support:

- bundle loading
- surface render/event
- runtime-surface attach metadata

But they do not yet expose:

- plain JS eval
- global inspection for a JS console

## Architectural rule

Do **not** fake an attached runtime session as a spawned blank JS session.

The correct model is:

```text
spawned JS session
  broker-owned
  resettable/disposable
  blank prelude + plain eval

attached JS session
  host-owned
  not resettable/disposable from JS REPL
  evaluates against a live runtime VM
```

That means the JS REPL should grow a second source of sessions, not collapse both into one ownership model.

## First implementation slice

### Runtime-service seam

Add live-session JS helpers to `QuickJSRuntimeService`:

- `evaluateSessionJs(sessionId, code): JsEvalResult`
- `getSessionGlobalNames(sessionId): string[]`

These should reuse the lower-level QuickJS helpers already extracted for APP-24 instead of duplicating evaluation logic.

### Attached JS registry

Add an external attached-JS registry similar in spirit to the attached runtime-session registry:

- list attached JS-capable live sessions
- get one by session id
- subscribe to changes

Each entry should expose a handle with:

- `sessionId`
- `stackId`
- `title`
- `origin: 'attached-runtime'`
- `evaluate(code)`
- `inspectGlobals()`

But not:

- `reset()`
- `dispose()`

because those belong to the owning runtime host.

### Host registration

`RuntimeSurfaceSessionHost` should register attached JS handles when:

- the runtime session is ready
- the host is interactive
- the session is not preview-only

### JS REPL changes

Extend `JsReplDriver` so it can:

- list both spawned blank JS sessions and attached runtime JS sessions
- `:attach <session-id>` for an attached runtime session
- `:use <session-id>` for either source
- run plain eval lines against the active session regardless of source
- label attached sessions clearly in `:sessions`

Suggested output:

```text
js-1 * — JavaScript js-1 [spawned]
session-1 — os-launcher [attached-runtime]
```

## Important constraints

- Do not allow `:reset` on attached runtime sessions
- Do not allow `:dispose` on attached runtime sessions
- Keep the first slice focused on eval + globals only
- Defer extra helpers such as host-side object inspection or source syncing

## Validation

### Focused tests

- runtime-service tests for JS eval/global inspection against live runtime sessions
- attached-JS registry tests
- JS REPL driver tests for mixed spawned/attached sessions
- launcher/module tests if UI wiring changes

### Browser smoke

1. Open a live runtime surface window.
2. Open `JavaScript REPL`.
3. Run `:sessions`.
4. Attach to the live runtime session.
5. Evaluate a harmless expression like:

```js
Object.keys(globalThis).slice(0, 5)
```

6. Run `:globals`.

The smoke should prove the console is evaluating inside the live runtime VM rather than a separate blank JS session.
