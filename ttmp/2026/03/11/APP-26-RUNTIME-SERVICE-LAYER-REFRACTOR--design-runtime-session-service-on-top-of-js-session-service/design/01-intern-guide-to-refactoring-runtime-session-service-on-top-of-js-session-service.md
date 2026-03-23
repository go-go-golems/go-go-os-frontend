---
Title: Intern Guide to Refactoring RuntimeSessionService on Top of JsSessionService
Ticket: APP-26-RUNTIME-SERVICE-LAYER-REFRACTOR
Status: active
Topics:
  - frontend
  - architecture
  - hypercard
  - repl
  - tooling
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/jsSessionService.ts
    Note: The lower-level session service that should become the formal substrate for runtime sessions.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
    Note: The current runtime-specific execution service that still needs a more explicit layer boundary.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts
    Note: Broker layer that will benefit from a clearer service boundary beneath it.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts
    Note: Plain JS broker that already matches the lower service layer.
Summary: Detailed implementation guide for making RuntimeSessionService explicitly build on top of JsSessionService rather than only sharing QuickJS helper code indirectly.
LastUpdated: 2026-03-11T16:55:00-04:00
WhatFor: Explain the current execution layering, the desired refactor, and a practical cutover plan for interns or future maintainers.
WhenToUse: Use before touching runtime execution services, brokers, or session ownership semantics.
---

# Intern Guide to Refactoring RuntimeSessionService on Top of JsSessionService

## 1. Why this ticket exists

Right now the codebase already behaves as if runtime sessions are built on top of lower-level JS
sessions, but the layering is only partial in code.

What we already have:

- shared QuickJS lifecycle helpers in `quickJsSessionCore.ts`
- a dedicated `JsSessionService`
- a dedicated `JsSessionBroker`
- a runtime-specific service that sits conceptually above those layers

What we do not yet have:

- an explicit `RuntimeSessionService` implemented as a clear composition over the JS-session layer
- a single service boundary that says:
  - JS sessions own the VM
  - runtime sessions own package installation, bundle load, and surface semantics

That mismatch matters because the architecture is now rich enough that future features depend on the
boundary being real, not just implied:

- REPL attach mode
- session manager / task manager
- future non-HyperCard language profiles
- richer debugging and diagnostics

## 2. Current conceptual model

The right mental model already looks like this:

```text
JsSessionService
  create QuickJS session
  evaluate code
  preserve globals
  reset/dispose

RuntimeSessionService
  JsSessionService
  + install RuntimePackages
  + load RuntimeBundle
  + register RuntimeSurfaces
  + render/event RuntimeSurface
```

But the current code is closer to:

```text
quickJsSessionCore
  shared helper functions

JsSessionService
  blank JS profile

QuickJSRuntimeService
  parallel service using same helpers
```

That is better than before, but still leaves the layering implicit.

## 3. What “built on top of” should mean

It should not mean inheritance.

It should mean composition:

- the runtime service owns a lower-level JS session service or handle layer
- runtime-specific operations are expressed in terms of lower-level session operations
- runtime-specific metadata lives above the lower layer

Example:

```ts
class RuntimeSessionService {
  constructor(private readonly jsSessions: JsSessionService) {}

  async loadRuntimeBundle(request) {
    await this.jsSessions.createSession(...);
    await this.jsSessions.installPrelude(...);
    await this.jsSessions.evaluate(...package installer...);
    await this.jsSessions.evaluate(...bundle code...);
  }
}
```

The important point is not the exact method names. The important point is that the runtime layer is
no longer responsible for creating and owning a parallel execution substrate.

## 4. Current files and responsibilities

### `quickJsSessionCore.ts`

This already owns:

- module bootstrapping
- runtime/context creation
- eval helpers
- disposal helpers
- timeout helpers

This file should stay low-level and engine-oriented.

### `jsSessionService.ts`

This owns:

- blank session creation
- raw JS eval
- globals inspection
- reset/dispose

This file is the correct place for persistent JS session semantics.

### `runtimeService.ts`

This currently owns:

- runtime package installation
- bundle load
- surface definition
- surface render/event
- runtime session disposal

This file should become the formal runtime-specific layer built on the JS-session layer.

## 5. Desired architecture

```text
quickJsSessionCore
  engine helpers only

JsSessionService
  create/eval/reset/dispose generic JS sessions

RuntimeSessionService
  uses JsSessionService
  installs packages
  loads bundles
  manages runtime metadata
  renders/events surfaces

brokers
  JsSessionBroker -> uses JsSessionService
  RuntimeBroker -> uses RuntimeSessionService
```

That is the architecture we want code to express directly.

## 6. What should remain shared

Shared across both layers:

- QuickJS bootstrapping
- timeouts
- VM disposal
- basic eval and error formatting helpers

Potentially shared as explicit session-level operations:

- install prelude code
- evaluate a snippet
- inspect selected globals

## 7. What should remain runtime-specific

Only the runtime-specific layer should know about:

- runtime packages
- runtime bundle metadata
- surface ids
- surface type ids
- render/event host contracts
- runtime action semantics

The JS-session layer should stay unaware of all of that.

## 8. Public API direction

The lower layer should expose generic operations such as:

```ts
createSession(...)
evaluate(sessionId, code)
installPrelude(sessionId, code)
resetSession(sessionId)
disposeSession(sessionId)
```

The runtime layer should expose runtime operations such as:

```ts
loadRuntimeBundle(bundleId, sessionId, packageIds, code)
defineRuntimeSurface(sessionId, surfaceId, code, surfaceTypeId?)
renderRuntimeSurface(sessionId, surfaceId, state)
eventRuntimeSurface(sessionId, surfaceId, handlerName, args, state)
disposeRuntimeSession(sessionId)
```

The runtime layer may still keep specialized internal helpers, but they should be implemented on top
of lower-level session operations rather than by recreating the lower layer internally.

## 9. Migration strategy

No compatibility wrappers.

That means the migration should be a cutover with tight checkpoints:

1. add explicit lower-layer operations needed by runtime service
2. refactor runtime service to use them internally
3. keep runtime service API stable for callers while internals change
4. once the layering is explicit, revisit naming if needed

The public runtime API does not need to change at the same time as the internal composition refactor.

## 10. Risks

### Risk: leaking runtime semantics into the JS-session layer

Avoid this by keeping package installation and bundle semantics out of `JsSessionService`.

### Risk: making `JsSessionService` too abstract

Do not turn it into a giant generic framework. It only needs the operations the runtime layer and
plain JS REPL actually use.

### Risk: doing the refactor while attach mode is in flight

This ticket should land before or after major attach-mode work, not halfway through it.

### Risk: duplicating bookkeeping

The runtime layer should own runtime metadata; the JS layer should own generic session metadata.
That boundary must stay clear.

## 11. Recommended implementation slices

### Slice 1: Audit and API sketch

- map every `QuickJSRuntimeService` operation to:
  - lower-layer JS session work
  - runtime-specific work
- decide what lower-layer methods are still missing

### Slice 2: Expand `JsSessionService` only where needed

- add narrowly scoped helpers required by the runtime layer
- keep tests proving the JS REPL still works

### Slice 3: Refactor runtime service internals

- rewrite runtime service internals to compose over `JsSessionService`
- preserve current public runtime behavior and tests

### Slice 4: Reconfirm brokers

- verify `JsSessionBroker` still composes cleanly
- verify `RuntimeBroker` now depends on the refactored runtime service cleanly

### Slice 5: Update docs

- runtime concepts guide
- REPL guide
- attach-mode tickets

## 12. Why this should happen after APP-25

APP-25 gives us the general session/task manager first.

That window will:

- make the current session models more visible
- expose where the real ownership boundaries are painful

After that, the service-layer refactor can be done with better operator intuition and without trying
to solve UI and execution layering in the same patch series.

So the recommended order is:

1. APP-25 task manager
2. APP-22 attach mode
3. APP-26 service-layer refactor

## 13. Validation checklist

When implemented, validation should prove:

- plain JS REPL still works
- runtime bundle load/render/event still works
- runtime broker still works
- no duplicate QuickJS lifecycle paths remain
- service boundaries are easier to describe than before
