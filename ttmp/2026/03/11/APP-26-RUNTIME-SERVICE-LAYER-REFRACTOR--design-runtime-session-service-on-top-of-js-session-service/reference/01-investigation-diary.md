---
Title: Investigation diary
Ticket: APP-26-RUNTIME-SERVICE-LAYER-REFRACTOR
Status: active
Topics:
  - frontend
  - architecture
  - hypercard
  - repl
  - tooling
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
    Note: Current runtime-specific service that should become the explicit upper layer.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/jsSessionService.ts
    Note: Lower-level session service that already represents the right substrate.
Summary: Investigation diary for the future service-layer refactor that will make the RuntimeSession-over-JsSession architecture explicit in code.
LastUpdated: 2026-03-11T16:55:00-04:00
WhatFor: Record the reasoning behind creating APP-26 before starting APP-25 implementation or APP-22 attach-mode work.
WhenToUse: Use when beginning the service-layer refactor or when explaining where the current architecture still stops short of the conceptual model.
---

# Investigation diary

## Goal

Create a dedicated ticket for the service-layer refactor so the architecture does not remain only
half documented while other REPL and session-manager work continues.

## Step 1: Record the current truth

The current architecture is already good enough to explain:

- plain JS sessions exist
- runtime sessions exist
- shared QuickJS lifecycle exists

But it is still only partially expressed in code as a strict layered service stack.

That is the gap this ticket exists to close later.

## Step 2: Preserve sequencing

This ticket should not steal priority from APP-25 or attach mode. It exists first so we do not lose
the architectural thread while shipping operator tooling.

The intended order remains:

1. APP-25 task manager
2. attach-mode work
3. APP-26 service-layer refactor

## Step 3: Re-audit the actual lower-layer seam

The first implementation pass was not code changes. It was re-reading the current service split to
make sure the refactor target was still real after APP-24, APP-25, and APP-28.

The important finding was that the architecture had improved, but the runtime layer was still only
conceptually built on top of the JS-session layer. `QuickJSRuntimeService` still kept its own VM map
and directly called the low-level QuickJS helpers instead of composing over `JsSessionService`.

### What I checked

- `packages/hypercard-runtime/src/plugin-runtime/quickJsSessionCore.ts`
- `packages/hypercard-runtime/src/plugin-runtime/jsSessionService.ts`
- `packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
- `packages/hypercard-runtime/src/repl/jsSessionBroker.ts`
- `packages/hypercard-runtime/src/repl/runtimeBroker.ts`

### What I learned

The correct cut line was:

- `JsSessionService`
  - generic QuickJS session ownership
  - bootstrap/prelude installation
  - plain eval
  - generic native eval / run-code helpers
- `QuickJSRuntimeService`
  - runtime package installation
  - runtime bundle metadata
  - runtime surface render/event semantics

That meant the runtime layer did not need a new abstraction hierarchy. It just needed the existing
JS-session layer expanded slightly and then used directly.

## Step 4: Add the minimal lower-layer helpers

I updated `JsSessionService` first before touching the runtime service internals.

### What changed

`JsSessionService` now supports:

- `scopeId` on session creation
- `bootstrapSources` on session creation
- `evaluateToNative(...)`
- `runCode(...)`

It also preserves those bootstrap sources and scope values across `resetSession(...)`.

### Why this was the right move

This kept the lower layer generic:

- no runtime-package semantics
- no bundle metadata
- no surface semantics

But it gave the runtime layer the exact generic building blocks it needed so it no longer had to
touch `quickJsSessionCore.ts` directly.

### Validation

I expanded `jsSessionService.test.ts` with a new case covering:

- bootstrap source install
- generic native eval
- generic run-code helper
- reset preserving the bootstrap

## Step 5: Collapse `QuickJSRuntimeService` onto `JsSessionService`

After the lower layer was ready, I rewrote the runtime service internals.

### What changed

`QuickJSRuntimeService` now:

- owns a `JsSessionService` instance
- keeps runtime bundle metadata in its own `bundles` map
- uses `JsSessionService.createSession(...)` with the runtime bootstrap source
- installs runtime packages via `JsSessionService.installPrelude(...)`
- evaluates bundle code via `JsSessionService.runCode(...)`
- reads bundle metadata via `JsSessionService.evaluateToNative(...)`
- uses `JsSessionService.evaluate(...)` and `getGlobalNames(...)` for runtime-session JS console support

What disappeared from `runtimeService.ts`:

- its own direct VM map
- direct session creation with `createQuickJsSessionVm(...)`
- direct disposal with `disposeQuickJsSessionVm(...)`
- direct `evalQuickJsCodeOrThrow(...)` / `evalQuickJsToNative(...)` calls
- direct JS eval bridge management inside the runtime service

### Why this matters

This is the core APP-26 outcome.

The runtime layer is now explicit:

- `JsSessionService` owns generic QuickJS session lifecycle
- `QuickJSRuntimeService` owns runtime-specific semantics above that layer

That means the service layering is finally true in code, not just in design docs.

### What stayed intentionally stable

I kept the public runtime-service API stable:

- `loadRuntimeBundle(...)`
- `renderRuntimeSurface(...)`
- `eventRuntimeSurface(...)`
- `defineRuntimeSurface(...)`
- `evaluateSessionJs(...)`
- `getSessionGlobalNames(...)`

That let the manager, brokers, REPLs, and runtime host keep their current call sites while the
internals changed underneath them.

## Step 6: Revalidate brokers, managers, and live operator tooling

Once the runtime service was refactored, I reran the service-layer, broker, manager, and operator tests together.

### Validation commands

```bash
pnpm exec vitest run \
  packages/hypercard-runtime/src/plugin-runtime/jsSessionService.test.ts \
  packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts \
  packages/hypercard-runtime/src/repl/jsSessionBroker.test.ts \
  packages/hypercard-runtime/src/repl/runtimeBroker.test.ts \
  packages/hypercard-runtime/src/repl/jsReplDriver.test.ts \
  packages/hypercard-runtime/src/repl/hypercardReplDriver.test.ts \
  packages/hypercard-runtime/src/runtime-session-manager/runtimeSessionManager.test.ts \
  packages/hypercard-runtime/src/app/runtimeSessionLifecycleMiddleware.test.ts \
  packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx \
  --reporter=verbose

pnpm exec tsc --noEmit -p packages/hypercard-runtime/tsconfig.json
```

Everything passed.

### Live browser smoke

I then smoke-tested the live app on `http://localhost:5173` with Playwright.

I confirmed:

- launcher loads cleanly
- `JavaScript REPL` window can be opened
- `HyperCard REPL` window can be opened
- `Stacks & Cards` window can be opened
- browser console error level remained empty

That was the last important check for this ticket because APP-26 should not regress the operator
surfaces that depend on the runtime service.

## Step 7: Documentation alignment

After the code landed, I updated the repo docs so they teach the implemented layering:

- `docs/runtime-concepts-guide.md`
- `docs/js-api-user-guide-reference.md`
- `docs/runtime-broker-and-session-source-guide.md`

The key documentation correction is now explicit:

- `QuickJSRuntimeService` is still the public runtime-specific service
- but it now composes over `JsSessionService`
- and `JsSessionService` is the generic QuickJS session substrate

That closes the gap that originally caused this ticket to exist.
