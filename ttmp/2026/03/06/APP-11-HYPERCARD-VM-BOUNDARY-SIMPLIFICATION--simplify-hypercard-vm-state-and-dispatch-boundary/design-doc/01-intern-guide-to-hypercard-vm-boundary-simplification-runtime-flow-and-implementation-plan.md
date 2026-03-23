---
Title: Intern guide to HyperCard VM boundary simplification, runtime flow, and implementation plan
Ticket: APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md
      Note: Prompt-side authoring contract that must migrate with the runtime boundary
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts
      Note: Current runtime intent and request contract definitions
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: Owns QuickJS evaluation and render-event calls
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Defines the VM-visible render and event helpers
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
      Note: Main host lifecycle and current projection boundary
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/pluginIntentRouting.ts
      Note: Host-side routing for VM-emitted intents
    - Path: ttmp/2026/03/06/APP-07-HYPERCARD-VM-RUNTIME-PLATFORM--analyze-hypercard-vm-runtime-inventory-prompt-path-and-extensible-dsl-platform/design-doc/01-hypercard-vm-inventory-prompt-path-and-extensible-dsl-runtime-platform-guide.md
      Note: Background platform analysis that APP-11 builds on
ExternalSources: []
Summary: Detailed intern-facing guide to the current generated-card runtime pipeline, the existing split VM boundary, the problems it creates, and the direct refactor plan for moving the whole stack to one projected state and one dispatch(action) contract without legacy compatibility.
LastUpdated: 2026-03-09T17:54:34-04:00
WhatFor: Explain the full system needed to understand and implement HyperCard VM boundary simplification, including prompt injection, timeline projection, runtime card registration, QuickJS execution, host routing, and the direct cutover plan across runtime, prompts, inventory cards, and tests.
WhenToUse: Use when onboarding a new engineer to the HyperCard runtime, when reviewing the APP-11 plan, when implementing the boundary refactor, or when updating prompt and authoring contracts to match the new runtime model.
---


# Intern guide to HyperCard VM boundary simplification, runtime flow, and implementation plan

## Executive Summary

This ticket is about simplifying the interface between generated JavaScript cards and the host application that executes them. Today the QuickJS VM boundary is too revealing: a generated card can see `cardState`, `sessionState`, and `globalState`, and a handler can emit `dispatchCardAction`, `dispatchSessionAction`, `dispatchDomainAction`, and `dispatchSystemCommand`. That means the generated code is not just expressing UI intent; it is learning the host application's storage layout and effect plumbing.

That design was acceptable for the first inventory-only version because it let the system ship quickly and kept the initial runtime small. The downside is that the current contract is brittle, prompt-heavy, hard for smaller models to use consistently, and difficult to extend cleanly. Every future runtime feature such as alternate DSL packs, richer widgets, query runners, and effect bridges will become harder if the VM continues to depend on the host's internal topology.

APP-11 proposes the cleaner model:

- the host computes one projected VM-facing `state`
- the VM renders from that one object
- the VM emits `dispatch({ type, payload })`
- the host interprets those actions and decides whether they become local runtime state changes, Redux actions, navigation actions, notifications, or future async effects

Because we control the runtime package, the inventory sample cards, the prompt pack, and the test fixtures, the implementation plan should be a direct cutover rather than a compatibility migration. Do not add wrapper APIs that preserve `cardState` / `sessionState` / `globalState`, and do not keep the four legacy dispatch helpers alive in parallel. Updating the authored cards and prompts is cheaper than carrying two contracts through the runtime.

The important implementation insight is that this is not a standalone frontend cleanup. The runtime boundary sits in the middle of a larger pipeline. An intern needs to understand where the generated code comes from, how it becomes a runtime artifact, how it is injected into QuickJS, and how its events escape back into the app. This document therefore starts upstream, walks through the whole system, and only then narrows into the boundary itself.

## Reading Order For A New Intern

If you are brand new to this part of the codebase, read in this order:

1. The background analysis in `APP-07-HYPERCARD-VM-RUNTIME-PLATFORM`.
2. The current inventory authoring surface in `apps/inventory/src/domain/pluginBundle.vm.js`.
3. The current VM bootstrap in `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`.
4. The host lifecycle in `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`.
5. The intent routing and runtime state reducers in:
   - `packages/hypercard-runtime/src/runtime-host/pluginIntentRouting.ts`
   - `packages/hypercard-runtime/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts`
6. This document's target contract and implementation plan.

## Problem Statement

The runtime card platform already works, but the contract exposed to generated card code is too close to the implementation details of the host.

In the current model, a generated card is implicitly expected to know:

- which data lives in `cardState`
- which data lives in `sessionState`
- where global application slices appear under `globalState.domains`
- when a write should be considered local, session-scoped, domain-scoped, or a system command
- how navigation is encoded and which "system" command string implements it

That leaks internal structure into the generated program. The VM no longer acts like a small UI brain; it acts like a partial frontend engineer that knows Redux topology, navigation conventions, and capability policy seams.

This becomes a real platform problem, not just a code-style issue, because the current contract sits in all of these places:

- prompt docs that teach the model how to author `card.code`
- authoring `.d.ts` files used by hand-written or guided runtime card code
- QuickJS bootstrap helpers
- runtime service request shapes
- runtime host projection logic
- runtime reducer logic
- intent routing and effect seams

If we add multiple DSL packs or async host bridges before simplifying this boundary, we will multiply the leakage into every prompt, example, test fixture, and generated artifact.

## System Overview

Before you can change the boundary, you need to understand where the generated code comes from and how it gets into the VM.

### Big Picture

```text
User prompt
  -> chat transport
  -> runtime/profile resolution
  -> inventory prompt middleware injects runtime-card DSL instructions
  -> model emits <hypercard:card:v2> artifact
  -> backend event sink extracts structured payload
  -> timeline entity is projected to frontend
  -> frontend artifact middleware extracts card.id + card.code
  -> runtime card registry stores generated definition
  -> PluginCardSessionHost injects generated card into QuickJS session
  -> QuickJS renders UI tree
  -> user event fires handler
  -> VM emits runtime intent
  -> host routes intent back into local state / Redux / nav / notifications
```

### Why This Matters For APP-11

The boundary change is not only a frontend refactor. The prompt docs, authoring types, and samples that teach the model and human authors how to write cards also need to change. If you only update the host code, the model will keep generating code against the old contract.

## Ticket Lineage And Scope

This ticket is easiest to understand in relation to the nearby APP tickets:

- `APP-05-GENERIC-APP-CHAT-BOOTSTRAP`
  - original "Chat With App" feature ticket
  - important for shared-shell and bootstrap separation principles
  - not the place where the QuickJS VM boundary lives
- `APP-07-HYPERCARD-VM-RUNTIME-PLATFORM`
  - the main analysis ticket for how runtime cards are generated and executed
  - established that this is already a general platform, not just an inventory-specific one
- `APP-08-PROFILE-RUNTIME-CONTRACT-ALIGNMENT`
  - simplified the external contract between frontend profile selection and backend runtime identity
  - conceptually related because it removed ambiguity at another system boundary
- `APP-09-BOOTSTRAPPED-CHAT-SESSIONS`
  - chat shell, startup policy, profile-selection, and wrapper-extension architecture
  - adjacent but different subsystem
- `APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION`
  - the internal generated-card runtime contract cleanup

The simplest framing is:

```text
APP-07 = analysis of the whole generated-card platform
APP-08 = simplify the outer chat/runtime naming contract
APP-11 = simplify the inner QuickJS runtime contract
APP-09 = parallel chat shell/startup architecture work
```

## File Map

These are the primary files to read for APP-11, grouped by responsibility.

### Backend prompt and artifact pipeline

- `workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md`
  - teaches the model the current `cardState` / `sessionState` / `globalState` contract
- `workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go`
  - defines the semantic event types for hypercard artifacts
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts`
  - turns timeline entities into runtime-card registrations on the frontend
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts`
  - extracts `artifact.id`, `card.id`, and `card.code` from timeline entities

### Frontend runtime lifecycle

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.ts`
  - stores generated runtime cards for later injection into sessions
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
  - owns QuickJS session load, projection, render, and event dispatch
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
  - manages the actual QuickJS runtimes, limits, eval paths, and validation
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - defines the VM-visible JS API

### Frontend runtime state and intent routing

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts`
  - current runtime intent union and request contracts
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/pluginIntentRouting.ts`
  - translates runtime intents into host actions
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts`
  - stores local runtime session state and timeline records
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/pluginCardRuntime/selectors.ts`
  - exposes split local state and projected global domains

### Authoring examples

- `workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.vm.js`
  - current example bundle that visibly depends on `globalState.domains.*` and split state
- `workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.authoring.d.ts`
  - current authoring contract that exposes four dispatch helpers
- `workspace-links/go-go-app-inventory/pkg/pinoweb/docs/02-vm-state-dispatch-boundary-simplification.md`
  - seed note for the one-state, one-dispatch direction

## Current Runtime Pipeline, Step By Step

### 1. Prompt policy teaches the model how to write a card

The prompt pack is where the runtime contract first becomes real. `runtime-card-policy.md` currently tells the model to emit a `<hypercard:card:v2>` block whose `card.code` is a JavaScript expression. It also provides a strong default example where `render({ cardState, sessionState, globalState })` and handler helpers such as `ctx.dispatchSystemCommand("window.close")` are part of the taught contract.

This matters because the prompt is not merely descriptive documentation. It is the canonical authoring surface the model is actively being trained against at inference time. If APP-11 changes the runtime boundary but the prompt doc still teaches the old one, the model will continue generating stale code.

Current prompt highlights from `runtime-card-policy.md`:

- `render({ cardState, sessionState, globalState })`
- handler context with:
  - `dispatchCardAction`
  - `dispatchSessionAction`
  - `dispatchDomainAction`
  - `dispatchSystemCommand`
- guidance that `ui.input` values usually belong in `cardState`

### 2. Structured output becomes timeline artifacts

The inventory backend registers hypercard event factories and SEM mappings in `hypercard_events.go`. Those mappings convert the extracted structured result into named semantic frames such as `hypercard.card.v2`, which eventually become timeline entities visible to the frontend.

You do not need to change this artifact format for APP-11. The ticket is about the JavaScript contract inside `card.code`, not the outer YAML artifact envelope. Keeping the outer artifact stable makes migration safer because the backend extraction and frontend timeline projection layers can stay mostly unchanged while the inner runtime contract evolves.

### 3. Timeline projection registers runtime cards on the frontend

`artifactProjectionMiddleware.ts` listens to timeline changes and calls `extractArtifactUpsertFromTimelineEntity(...)`. If the incoming entity is `hypercard.card.v2`, the middleware upserts the artifact metadata and, when present, calls `registerRuntimeCard(upsert.runtimeCardId, upsert.runtimeCardCode)`.

That means there are two separate pieces of data flowing together:

- the visible artifact or window metadata
- the generated card code that will later be injected into QuickJS

`runtimeCardRegistry.ts` then acts as a global staging area. Cards are registered as soon as they are seen in the timeline, even if the target QuickJS session is not ready yet. Later, when a session loads, the host injects the pending cards into that session.

### 4. The host loads the static stack and then injects generated cards

`PluginCardSessionHost.tsx` is the main React boundary between the host application and the VM runtime.

Its responsibilities are:

- register runtime session state in Redux
- create a `QuickJSCardRuntimeService`
- load the base stack bundle into a per-session VM
- inject pending runtime cards from the registry
- seed initial session state and initial card state into local runtime storage
- compute the state objects passed into the VM on render and event
- dispatch emitted intents back to the host

The host currently selects three different inputs for the VM:

- `sessionState`
- `cardState`
- `projectedDomains`, which are transformed by `projectGlobalState(...)` into `globalState`

That is the boundary APP-11 intends to collapse.

### 5. QuickJS executes the generated card inside a narrow bootstrap

`runtimeService.ts` creates a QuickJS runtime per session, enforces memory and stack limits, and sets interrupt deadlines for load, render, and event evaluation. The service loads the source of `stack-bootstrap.vm.js` into the runtime and then later evaluates generated bundle code or dynamically injected card definitions.

Important safety properties:

- the VM is a QuickJS WASM runtime, not the browser global environment
- the host serializes values into JS source via JSON
- rendered output is validated through `validateUINode(...)`
- emitted intents are validated through `validateRuntimeIntents(...)`
- timeouts are enforced with an interrupt handler

APP-11 should preserve these safety properties. The boundary simplification is about the shape of the API exposed to the VM, not about weakening the sandbox.

### 6. The VM emits intents and the host interprets them

`stack-bootstrap.vm.js` currently exposes four helper functions in handler context. Those helpers append structured records to `__runtimeIntents`, and `event(...)` returns the collected intent list to the host.

`pluginIntentRouting.ts` then interprets those intents:

- `domain` intents become Redux-style domain actions
- `system` intents become navigation actions, notifications, or window close actions
- `card` and `session` intents are first ingested into local runtime state and applied by reducers in `pluginCardRuntimeSlice.ts`

This split model works, but it is precisely what leaks host topology into the VM. The card author has to choose the dispatch channel up front instead of expressing a higher-level semantic action and letting the host decide how to handle it.

## Current Boundary API Reference

This section is deliberately explicit. When you start refactoring APP-11, you will keep coming back to these signatures.

### VM bootstrap surface

Current render boundary in `stack-bootstrap.vm.js`:

```js
render(cardId, cardState, sessionState, globalState) {
  const card = __stackBundle?.cards?.[cardId];
  return card.render({ cardState, sessionState, globalState });
}
```

Current event boundary in `stack-bootstrap.vm.js`:

```js
event(cardId, handlerName, args, cardState, sessionState, globalState) {
  const handler = card.handlers?.[handlerName];

  const dispatchCardAction = (actionType, payload) => { ... };
  const dispatchSessionAction = (actionType, payload) => { ... };
  const dispatchDomainAction = (domain, actionType, payload) => { ... };
  const dispatchSystemCommand = (command, payload) => { ... };

  handler(
    {
      cardState,
      sessionState,
      globalState,
      dispatchCardAction,
      dispatchSessionAction,
      dispatchDomainAction,
      dispatchSystemCommand,
    },
    args
  );

  return __runtimeIntents.slice();
}
```

### TypeScript request contracts

`contracts.ts` currently defines render and event requests like this:

```ts
interface RenderCardRequest {
  type: 'renderCard';
  sessionId: SessionId;
  cardId: CardId;
  cardState: unknown;
  sessionState: unknown;
  globalState: unknown;
}

interface EventCardRequest {
  type: 'eventCard';
  sessionId: SessionId;
  cardId: CardId;
  handler: string;
  args?: unknown;
  cardState: unknown;
  sessionState: unknown;
  globalState: unknown;
}
```

### Runtime intent union

The current emitted intent model is:

```ts
type RuntimeIntent =
  | { scope: 'card'; actionType: string; payload?: unknown }
  | { scope: 'session'; actionType: string; payload?: unknown }
  | { scope: 'domain'; domain: string; actionType: string; payload?: unknown }
  | { scope: 'system'; command: string; payload?: unknown };
```

### Current host projection code

`PluginCardSessionHost.tsx` currently builds `globalState` like this:

```ts
function projectGlobalState(domains, opts) {
  return {
    self: { stackId, sessionId, cardId, windowId },
    domains,
    nav: {
      current: cardId,
      param: currentNavParam,
      depth: navDepth,
      canBack: navDepth > 1,
    },
    system: {
      focusedWindowId,
      runtimeHealth: { status: runtimeStatus },
    },
  };
}
```

The VM therefore has host knowledge of:

- `domains.inventory.items`
- `domains.sales.log`
- `nav.current`, `nav.param`, `nav.depth`, `nav.canBack`
- `system.runtimeHealth.status`

## Concrete Example Of The Problem

The inventory sample bundle in `pluginBundle.vm.js` makes the leakage easy to see.

It defines helper functions like:

- `inventory(globalState)` -> reads `globalState.domains.inventory`
- `sales(globalState)` -> reads `globalState.domains.sales`
- `navParam(globalState)` -> reads `globalState.nav.param`
- `threshold(sessionState)` -> reads `sessionState.lowStockThreshold`

Handlers then choose among different dispatch channels:

- `dispatchSystemCommand('nav.go', ...)`
- `dispatchSystemCommand('notify', ...)`
- other cards in the bundle use `dispatchCardAction`, `dispatchSessionAction`, or `dispatchDomainAction`

From the host's point of view, some of that data is local runtime state, some is selected Redux state, and some is navigation metadata. From the VM's point of view, however, all of it should really just be "the state required to render the current card."

## Proposed Solution

The APP-11 target is conceptually simple:

- replace three incoming state objects with one projected `state`
- replace four outgoing helper functions with one `dispatch(action)`

That gives the VM a small, explicit contract:

```js
({ ui }) => ({
  render({ state }) {
    return ui.panel([
      ui.text("Low stock report"),
      ui.badge("Threshold: " + String(state.filters.lowStockThreshold ?? 3)),
      ui.table(state.rows ?? [], { headers: ["SKU", "Name", "Qty"] })
    ]);
  },
  handlers: {
    changeThreshold({ state, dispatch }, args) {
      dispatch({
        type: "state.patch",
        payload: {
          filters: {
            ...state.filters,
            lowStockThreshold: Number(args?.value ?? 3)
          }
        }
      });
    },
    openItem({ dispatch }, args) {
      dispatch({
        type: "nav.go",
        payload: {
          cardId: "itemDetail",
          param: String(args?.sku ?? "")
        }
      });
    }
  }
})
```

### Key Principle

Hide store topology and expose app semantics.

The VM should know:

- what state fields matter to the UI
- which semantic actions it can emit

The VM should not know:

- whether a field came from Redux, nav state, card-local state, or a future query cache
- whether an action becomes a local patch, a domain reducer action, a navigation command, or an effect-host task

### Target mental model

```text
Host computes view model
  -> VM renders UI from state
  -> user interacts
  -> VM dispatches semantic action
  -> host interprets action
  -> host updates real state or runs effect
  -> host recomputes view model
  -> VM rerenders
```

## Proposed API Reference

### Render context

```ts
interface RuntimeRenderContext {
  state: Record<string, unknown>;
}
```

### Handler context

```ts
interface RuntimeHandlerContext extends RuntimeRenderContext {
  dispatch(action: RuntimeAction): void;
}
```

### Action envelope

```ts
interface RuntimeAction {
  type: string;
  payload?: unknown;
  meta?: Record<string, unknown>;
}
```

### Suggested action families

These namespaces are not a hard wire protocol yet, but they are the right direction:

- `state.patch`
- `state.set`
- `state.reset`
- `nav.go`
- `nav.back`
- `notify.show`
- `inventory.saveItemRequested`
- `inventory.receiveShipmentRequested`
- `query.run`
- `effect.http`

The important pattern is not the exact string. The important pattern is that the VM emits semantic actions without knowing which host subsystem receives them.

## Design Decisions

### 1. Keep the outer artifact envelope stable

APP-11 should not begin by changing the `<hypercard:card:v2>` transport or backend extraction format. The outer artifact format already flows through backend semantic events, timeline projection, artifact storage, and runtime-card registration. The problem sits inside `card.code`, not in the artifact transport.

### 2. Move projection to the host boundary

The host should own the transformation from real app state to VM-facing state.

That means:

- no direct `globalState.domains.*` traversal inside authored cards
- no ad hoc `nav` or `system` traversal unless those fields are deliberately projected into `state`
- no expectation that the card author knows which fields are card-local or session-local internally

### 3. Keep the VM ignorant of capabilities and routing

Capability enforcement should remain host-side. The VM can emit `dispatch({ type: "nav.go", ... })`, but the host decides whether that is allowed and how it becomes a concrete action.

### 4. Preserve the sandboxing model

APP-11 is not a reason to add raw browser APIs or general async APIs into QuickJS. The future extension model should stay host-owned:

- runtime packs for authoring and rendering
- effect hosts for async operations
- host-owned projection and action interpretation

### 5. Prefer a flag day across the runtime stack

Prompts, authoring types, inventory cards, and test fixtures are all under our control. That means the cheapest path is to update them in the same change set as the runtime contract itself. Dual support would force duplicated validation, duplicated examples, duplicated tests, and prolonged ambiguity about which contract is real.

## Proposed Module Shape

The long-term architecture should start to look like this:

```text
backend inference pack
  - prompt docs
  - extraction rules
  - artifact kinds

frontend runtime pack
  - VM bootstrap
  - type/schema validation
  - renderer mapping
  - state projection contract
  - action interpretation contract

effect hosts
  - HTTP runner
  - DB/query runner
  - command runner
  - result reinjection into host/runtime state
```

APP-11 addresses the core seam between the middle two boxes.

## Diagrams

### Current flow

```text
Redux store
  -> selectRuntimeSessionState()
  -> selectRuntimeCardState()
  -> selectProjectedRuntimeDomains()
  -> projectGlobalState()
  -> QuickJS render(cardState, sessionState, globalState)
  -> handler emits scoped intents
  -> pluginIntentRouting routes by scope
  -> reducers or Redux/system actions run
```

### Target flow

```text
Redux store + runtime local state + nav metadata + effect results
  -> projectRuntimeState(sessionId, cardId)
  -> QuickJS render(state)
  -> handler dispatches { type, payload }
  -> interpretRuntimeAction(action, context)
  -> local state patch / Redux action / nav action / effect enqueue
  -> projectRuntimeState(sessionId, cardId)
  -> QuickJS rerender(state)
```

### Responsibility split

```text
VM
  - render UI
  - emit semantic actions

Host
  - compute projected state
  - enforce capabilities
  - route actions
  - perform side effects
  - write results back into real state
```

## Detailed Implementation Plan

This section is written as an intern-safe execution plan. Follow the phases in order. The order matters.

### Phase 0: Preserve a baseline before refactor

Goal: make sure the existing behavior is captured before changing signatures.

Tasks:

- inventory current boundary tests and fixtures
- identify all current uses of:
  - `cardState`
  - `sessionState`
  - `globalState`
  - `dispatchCardAction`
  - `dispatchSessionAction`
  - `dispatchDomainAction`
  - `dispatchSystemCommand`
- note which tests currently validate render and event behavior

Files to inspect first:

- `packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts`
- `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.rerender.test.tsx`
- `packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.test.ts`
- inventory bundle fixtures and authoring types

Acceptance criteria:

- you can explain the current behavior in tests before editing contracts
- you know which fixtures will need migration

### Phase 1: Cut the final runtime contract across the runtime package

Goal: define the final VM-visible contract in `contracts.ts`, `runtimeService.ts`, and `stack-bootstrap.vm.js`, then delete the legacy scoped intent model in the same slice.

Pseudocode:

```ts
interface RuntimeAction {
  type: string;
  payload?: unknown;
  meta?: Record<string, unknown>;
}

interface RenderCardRequest {
  type: 'renderCard';
  sessionId: SessionId;
  cardId: CardId;
  state: unknown;
}

interface EventCardRequest {
  type: 'eventCard';
  sessionId: SessionId;
  cardId: CardId;
  handler: string;
  args?: unknown;
  state: unknown;
}
```

Why this phase exists:

- it removes the hardest source of confusion first: the public contract
- it prevents the rest of the implementation from accreting adapter code
- it gives tests and authoring files one stable target to migrate to

Likely files:

- `packages/hypercard-runtime/src/plugin-runtime/contracts.ts`
- `packages/hypercard-runtime/src/plugin-runtime/intentSchema.ts`
- tests that validate runtime intent shapes

Acceptance criteria:

- no exported runtime contract mentions `cardState`, `sessionState`, `globalState`, or scoped intent unions
- render and event validation operate on one `state` object and one `RuntimeAction` envelope

### Phase 2: Refactor the host around one projected state model

Goal: make `PluginCardSessionHost` compute one semantic VM-facing state object for the active card and stop shipping host topology into QuickJS.

Pseudocode:

```ts
function projectRuntimeState(input: {
  runtimeState: RuntimeSessionState;
  projectedDomains: Record<string, unknown>;
  nav: { cardId: string; param?: string; depth: number; canBack: boolean };
  system: { focusedWindowId: string | null; runtimeStatus: string };
}) {
  return {
    self: { ... },
    nav: input.nav,
    inventory: {
      items: input.projectedDomains.inventory?.items ?? [],
      selectedSku: input.nav.param ?? null,
    },
    sales: {
      log: input.projectedDomains.sales?.log ?? [],
    },
    ui: {
      focusedWindowId: input.system.focusedWindowId,
      runtimeStatus: input.system.runtimeStatus,
    },
    draft: {
      lowStockThreshold: input.runtimeState.lowStockThreshold ?? 3,
      itemEdits: input.runtimeState.itemEdits ?? {},
    },
  };
}
```

The important constraint is not the exact field list. The important constraint is that the projected object should use semantic names that match authored card needs, not storage buckets like `local.card`, `local.session`, or `domains`.

Likely files:

- `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
- `packages/hypercard-runtime/src/features/pluginCardRuntime/selectors.ts`
- `packages/hypercard-runtime/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts`

Acceptance criteria:

- the VM render path now receives one object
- the event path now receives one object
- no VM-facing state shape contains `local.card`, `local.session`, or `domains.*` passthrough wrappers

### Phase 3: Replace VM helper API with `dispatch(action)`

Goal: expose the simplified handler surface inside `stack-bootstrap.vm.js`.

Pseudocode:

```js
event(cardId, handlerName, args, state) {
  __runtimeActions = [];

  const dispatch = (action) => {
    __runtimeActions.push(action);
  };

  handler({ state, dispatch }, args);
  return __runtimeActions.slice();
}
```

Important constraint:

- do not expose both old and new helpers
- delete `dispatchCardAction`, `dispatchSessionAction`, `dispatchDomainAction`, and `dispatchSystemCommand` outright
- make malformed action envelopes fail fast in validation and test coverage

Likely files:

- `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
- `packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`

Acceptance criteria:

- a card authored against `{ state, dispatch }` renders and emits actions successfully
- validation rejects malformed actions

### Phase 4: Introduce host-side action interpretation and simplify runtime local state

Goal: move dispatch semantics out of the VM and into host code.

This is the most important architectural phase. The VM should say what happened. The host should decide what it means.

Pseudocode:

```ts
function interpretRuntimeAction(action: RuntimeAction, ctx: HostContext) {
  switch (action.type) {
    case 'state.patch':
      return applyProjectedLocalPatch(action.payload, ctx);

    case 'nav.go':
      return ctx.dispatch(sessionNavGo(...));

    case 'nav.back':
      return ctx.dispatch(sessionNavBack(...));

    case 'notify.show':
      return ctx.dispatch(showToast(...));

    case 'inventory.receiveShipmentRequested':
      return ctx.dispatch({
        type: 'inventory/receiveShipmentRequested',
        payload: action.payload,
        meta: buildRuntimeMeta(ctx),
      });

    default:
      return recordIgnoredAction(action, ctx);
  }
}
```

Important design choice:

- if the existing `cardState` versus `sessionState` split makes host interpretation awkward, refactor the reducer/storage model too
- keep any remaining storage partitioning internal to the host and selectors, not visible in authored code
- routing decisions should happen in host code, not in VM-authored code

Likely files:

- `packages/hypercard-runtime/src/runtime-host/pluginIntentRouting.ts`
- `packages/hypercard-runtime/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts`

Acceptance criteria:

- the host can interpret generic runtime actions without VM awareness of host storage topology
- capability checks still apply

### Phase 5: Rewrite authoring surfaces, inventory cards, and prompts in the same cut

Goal: make the docs the model sees match the runtime that now exists.

Files:

- `apps/inventory/src/domain/pluginBundle.authoring.d.ts`
- `apps/inventory/src/domain/pluginBundle.vm.js`
- `pkg/pinoweb/prompts/runtime-card-policy.md`

Required changes:

- update handler context types to `{ state, dispatch }`
- rewrite inventory sample cards to read semantic projected fields from `state`
- remove examples that directly traverse `globalState.domains.*` or rely on `cardState` / `sessionState`
- replace dispatch helper examples with `dispatch({ type, payload })`
- migrate all in-repo fixtures and examples in the same branch so nothing still teaches the old API

Acceptance criteria:

- prompt docs no longer teach stale contracts
- hand-written sample bundles show the new style clearly
- no maintained inventory/runtime example in the repo still depends on the old API

### Phase 6: Replace fixtures and tests after the cutover

At minimum, add or update tests for:

- VM bootstrap render with one state object
- VM event dispatch with generic action envelope
- host action interpretation for:
  - local patch
  - navigation
  - toast/notification
  - domain action forwarding
- rerender behavior after host-side state changes
- validation failure for malformed action envelopes

Good test styles:

- QuickJS integration tests for the bootstrap and runtime service
- reducer tests for runtime local state behavior
- host component tests for rerender and routing behavior

Important constraint:

- do not keep legacy fixtures around "for compatibility"
- rewrite them to the new contract so test coverage reinforces the simplified model

### Phase 7: Only then expand to richer packs and effect hosts

Once APP-11 is stable, the platform becomes a much safer base for:

- additional UI DSL packs
- richer renderer node kinds
- dedicated effect-host registries
- async HTTP and DB query flows
- profile- or conversation-specific runtime packs

If you try to add those first, you will spread the current boundary leakage into more systems.

## Target Projected State Shape

The first implementation should already project a semantic VM-facing view model. It does not have to be perfect, but it should be good enough that authored cards stop depending on host topology immediately.

One practical inventory-oriented target shape:

```ts
interface InventoryRuntimeState {
  self: {
    stackId: string;
    sessionId: string;
    cardId: string;
    windowId: string;
  };
  nav: {
    current: string;
    param?: string;
    canBack: boolean;
  };
  inventory: {
    items: Item[];
    selectedSku?: string;
  };
  sales: {
    log: SaleEntry[];
  };
  filters: {
    lowStockThreshold: number;
  };
  draft: {
    itemEdits: Record<string, unknown>;
    newItemForm: Record<string, unknown>;
    receiveForm: Record<string, unknown>;
    priceCheckForm: Record<string, unknown>;
  };
  ui: {
    focusedWindowId: string | null;
    runtimeStatus: string;
  };
}
```

This still leaves room to improve per-card projections later, but it avoids the fake simplification of wrapping the old buckets inside one larger object. The VM should consume a view model, not a store dump.

## Alternatives Considered

### Alternative A: Keep the current split boundary and only add more helper docs

Rejected because the problem is architectural, not educational. Better docs do not stop the VM from depending on store topology.

### Alternative B: Expose more raw APIs directly in QuickJS

Rejected because it moves the platform in the wrong direction. The right architecture is host-owned effect bridges, not a broader sandbox with more ambient capabilities.

### Alternative C: Add a transitional one-object wrapper around the old topology

Rejected because it would preserve `local.card`, `local.session`, or `domains.*` under a new outer key and force a second migration later. Since we can update prompts, fixtures, and inventory cards together, this extra layer only adds churn.

### Alternative D: Keep dual support for scoped helpers and generic actions

Rejected because it would require duplicated validation, duplicated examples, duplicated tests, and more branching in the runtime host. The old helpers are exactly the API we are trying to remove.

### Alternative E: Treat APP-11 as part of APP-09

Rejected because APP-09 is the bootstrapped chat-shell/startup policy track. APP-11 changes a different subsystem: the generated-card runtime inside `packages/hypercard-runtime`.

## Design Decisions

### Prefer deleting the legacy contract over wrapping it

We control the runtime package, prompt docs, inventory sample bundle, authoring types, and fixtures. That makes a direct cutover lower risk than maintaining two public contracts. If a file still depends on the old API, migrate the file instead of adding a wrapper.

### Project semantic state, not storage topology

The projected `state` should be named after UI concepts such as `filters`, `draft`, `inventory`, `sales`, or `nav`. Avoid exposing `cardState`, `sessionState`, `domains`, or thinly renamed equivalents.

### Refactor internal runtime storage if it simplifies the host

There is no requirement to preserve the current `cardState` versus `sessionState` split internally. If collapsing or renaming internal storage makes action interpretation, selectors, and rerender behavior simpler, do that as part of APP-11.

### Keep routing data-rich but VM-simple

The host should attach metadata such as `sessionId`, `cardId`, and `windowId` when routing actions outward. That data is useful for reducers and effect hosts. The VM does not need to construct it manually.

## Review Checklist For An Intern

When reviewing APP-11 work, ask these questions:

- Does the VM-facing API now use one state object consistently?
- Does handler code emit one generic dispatch shape?
- Are local/runtime/domain/system distinctions hidden from authored cards?
- Do capability checks still happen on the host?
- Do prompt docs and authoring types match the implemented runtime?
- Do tests cover render, event, invalid actions, and rerender after state reinjection?
- Is any new host topology leaking back into authored code or prompt examples?

## Implementation Risks

- Prompt drift: host code changes but prompt policy still teaches the old contract.
- Fixture drift: tests continue asserting legacy scoped intents or keep old fixtures alive after the cutover.
- False simplification: one state object exists, but it merely wraps `cardState`, `sessionState`, or `globalState` under new names without improving authoring semantics.
- Capability bypass: action interpretation grows without consistent authorization checks.
- Silent action loss: malformed actions may be ignored without enough timeline/debug visibility.

## What To Read Immediately Before Coding

Read these exact anchors before you start the implementation:

- `PluginCardSessionHost.tsx`
  - `projectGlobalState(...)`
  - session and card selectors
  - render path
  - `emitRuntimeEvent(...)`
- `stack-bootstrap.vm.js`
  - `render(...)`
  - `event(...)`
- `runtimeService.ts`
  - `renderCard(...)`
  - `eventCard(...)`
- `contracts.ts`
  - `RuntimeIntent`
  - `RenderCardRequest`
  - `EventCardRequest`
- `pluginIntentRouting.ts`
  - `dispatchRuntimeIntent(...)`
- `pluginCardRuntimeSlice.ts`
  - `applyStateAction(...)`
  - `ingestRuntimeIntent`

## Open Questions

- What is the cleanest projected state shape for the inventory pack so the sample cards stay simple without leaking Redux topology?
- Should `state.patch` support explicit target paths, or should host-side runtime packs map it into named reducer actions instead?
- Which action families need schema validation immediately beyond `nav.*`, `notify.show`, and local state updates?

## References

- `APP-07-HYPERCARD-VM-RUNTIME-PLATFORM`
- `APP-08-PROFILE-RUNTIME-CONTRACT-ALIGNMENT`
- `APP-09-BOOTSTRAPPED-CHAT-SESSIONS`
- `workspace-links/go-go-app-inventory/pkg/pinoweb/docs/02-vm-state-dispatch-boundary-simplification.md`
