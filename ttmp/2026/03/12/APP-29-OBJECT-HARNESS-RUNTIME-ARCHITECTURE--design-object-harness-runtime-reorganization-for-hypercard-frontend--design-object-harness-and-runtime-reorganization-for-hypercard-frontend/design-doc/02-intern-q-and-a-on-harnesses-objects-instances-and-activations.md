---
Title: Intern Q and A on harnesses objects instances and activations
Ticket: APP-29-OBJECT-HARNESS-RUNTIME-ARCHITECTURE--design-object-harness-runtime-reorganization-for-hypercard-frontend
Status: active
Topics:
    - frontend
    - architecture
    - runtime
    - documentation
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts
      Note: Shows the current first-class window harness lifecycle and persisted window session state shape.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.ts
      Note: Shows current artifact persistence shape and where long-term artifact storage concerns start.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts
      Note: Shows why runtime surface definitions are currently global pending entries awaiting later injection.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts
      Note: Defines the JS tooling broker and its session mediation pattern.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts
      Note: Defines the writable runtime tooling broker and session handles.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Shows the current window-surface-centric host path that new harnesses should not be forced through.
ExternalSources: []
Summary: Detailed follow-up answers for an intern on harness design, live object identity, instances, activations, persistence, runtime brokers, and registry semantics in the HyperCard frontend architecture.
LastUpdated: 2026-03-12T23:11:00-04:00
WhatFor: Answer follow-up architecture questions from APP-29 with concrete examples and implementation guidance.
WhenToUse: Use when clarifying how new harnesses should work, how instance and activation differ, where persistence should live, and how current runtime brokers and registries map to the proposed model.
---


# Intern Q and A on harnesses objects instances and activations

## Executive Summary

This document answers follow-up questions that naturally come up after reading the main APP-29 architecture guide. The short version is this:

- we need harnesses to become first-class so that non-window behaviors are not forced through runtime surfaces,
- we should separate object identity from execution activation,
- we should persist durable definitions and durable harness state, but not blindly persist raw live runtime state,
- the current runtime surface registry is global and pending because it stores loose definitions for later injection rather than owning them under a specific object or activation,
- `runtimeBroker` and `jsSessionBroker` are called brokers because they mediate between tooling clients and multiple live sessions.

The rest of the document explains those points carefully and with concrete examples.

## Problem Statement

The intern questions point at the same core issue: the current codebase still expresses most live behavior through the window surface path, and it still uses names like `session`, `surface`, and `runtime` across multiple architecture layers.

That creates confusion around at least five distinctions:

- object vs instance
- instance vs activation
- live identity vs execution container
- harness vs runtime
- persisted definition vs transient live state

Those are not academic distinctions. They determine where code should live, how reload should work, and how new features such as timer-based automation should be implemented.

## Proposed Solution

The proposed answer is to make the architecture more explicit.

### Recommendation 1: Make Harnesses First-Class

A harness should be represented as:

- a contract,
- a host-side driver,
- an attachment record,
- optional persisted harness state.

That means a timer harness should be able to exist without pretending to be a window surface.

### Recommendation 2: Split Identity From Execution

Use these layers:

- `object`: durable thing with metadata and capabilities
- `instance`: live object identity created from an instantiable object
- `activation`: one running execution container for an instance

This is the cleanest way to explain why an instance is not the same thing as a currently running QuickJS session.

### Recommendation 3: Persist Definitions And Harness State, Not Raw Runtime Memory Dumps

On reload, reconstruct live activations from:

- persisted objects,
- persisted instance records,
- persisted harness attachments and layout state,
- persisted domain state or checkpoints where appropriate.

Do not treat a QuickJS heap snapshot or an in-memory activation record as the primary durable storage format unless you explicitly choose a checkpoint/restore architecture.

## Question 1: What Would Be Needed To Have New Harnesses Be Possible Without Bending Everything Through Window Surfaces?

### What That Means

Right now, the window surface path is the main first-class host path.

Evidence:

- surface windows are created through desktop windowing in [windowingSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts:23)
- the main host is [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:105)
- runtime rendering is shaped around `renderSurface(surfaceId, state)` and `eventSurface(...)`

So when I say “without bending everything through window surfaces,” I mean:

- do not model a non-window behavior as a fake surface just because that is the only mature host path,
- do not create hidden windows merely to get lifecycle or scheduling,
- do not overload `renderSurface` to mean “run this periodic background behavior.”

### Concrete Example: The Wrong Way To Do A Timer Tick Harness

Bad idea:

- define a hidden surface called `timer`
- open a hidden window for it
- use the window host lifecycle to keep the object alive
- periodically call its event handler through the same path used for button clicks

Why this is bad:

- the object does not conceptually have a window,
- you are forcing timer semantics through a window harness,
- you are tying background behavior to a UI host that should not own it.

### Concrete Example: The Right Way To Do A Timer Tick Harness

A timer harness should have its own contract and its own host driver.

Contract example:

```ts
interface TimerHarnessTarget {
  tick(input: {
    now: number;
    tickCount: number;
    periodMs: number;
  }): Promise<void> | void;
}

interface TimerHarnessSpec {
  harnessId: 'timer.v1';
  periodMs: number;
  startPolicy: 'immediate' | 'lazy';
}
```

Host-side driver example:

```ts
class TimerHarnessHost {
  attach(activationId: string, spec: TimerHarnessSpec) {
    const handle = activationRegistry.get(activationId);
    let tickCount = 0;
    const timerId = setInterval(() => {
      tickCount += 1;
      handle.invokeHarnessMessage('timer.v1', 'tick', {
        now: Date.now(),
        tickCount,
        periodMs: spec.periodMs,
      });
    }, spec.periodMs);

    return () => clearInterval(timerId);
  }
}
```

Object example:

```ts
const stockPollerObject = {
  id: 'inventory.stockPoller',
  listHarnesses() {
    return ['timer.v1'];
  },
  tick({ now, tickCount }) {
    if (tickCount % 30 === 0) {
      dispatch({ type: 'inventory/refresh-requested', payload: { now } });
    }
  },
};
```

### What Is Needed In The Architecture

To support new harnesses properly, we need at least these pieces.

#### 1. Harness Registry

A place that defines:

- known harness ids,
- their message contracts,
- their host drivers,
- attachment and detachment semantics.

#### 2. Capability Discovery

Objects or instances must be able to say:

- “I support `window.v1`”
- “I support `timer.v1`”
- “I support `icon.v1`”

#### 3. Activation Attachment Model

An activation needs attachment records like:

- `window:main-desktop:window-17`
- `timer:inventory.stockPoller:2s`
- `icon:desktop:inventory.home`

#### 4. Runtime Resolver

The timer harness should not assume the same runtime as the window harness. The resolver should choose based on:

- object or instance type,
- harness id,
- message kind.

#### 5. Persistence For Harness State

If a timer harness is durable across reloads, its configuration must be persisted somewhere other than the transient activation object.

### Minimal Implementation Plan For A `tick()` Harness

1. Define `timer.v1` contract.
2. Add `TimerHarnessHost` that owns `setInterval` lifecycle.
3. Add activation attachments for timer harnesses.
4. Add runtime resolver call for `tick` messages.
5. Persist `periodMs`, enabled/disabled status, and target object reference.
6. On reload, recreate the activation if needed and reattach the timer harness.

## Question 2: What Is The Difference Between A Live Object Identity And An Activation?

A live object identity answers:

- which object instance is this?
- how do I refer to it consistently across harnesses?

An activation answers:

- which running execution of that instance is this?
- which runtime resources does it currently hold?
- which harnesses are attached right now?

### Example

Imagine a `CalendarAssistant` class.

- object definition: `calendar-assistant`
- live instance identity: `calendar-assistant#user-123`
- activation A: running in QuickJS for the main desktop session
- activation B: running in a background worker for periodic summaries

Same instance identity, two different activations.

That is why the concepts should be separate.

### In Current Code

Current code mostly compresses both into `sessionId`.

Evidence:

- runtime session summaries use `sessionId` plus ownership and attached views in [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts:15)
- manager summaries also track `attachedViewIds` and `ownership` in `runtime-session-manager`

That is workable, but overloaded.

## Question 3: What Is The Difference Between An Object And A Live Object Identity?

An object is the general thing with definition and capabilities.

A live object identity is one specific instantiated object that currently exists in memory or in the process model.

### Example

Think of a text editor app.

- object: `text-editor`
  - has docs
  - has source
  - supports `instantiate`
- live object identity: `text-editor#doc-42`
  - this is one specific editor instance for document 42

The object is like the reusable type/capability container.
The live object identity is one particular object that has been brought into existence.

### Another Example: Inventory Home

Under the proposed model:

- object: `inventory`
- class-like entry/capability: `home`
- live object identity: `inventory.home#main-user` or similar

Whether `home` is modeled as a sub-object, entrypoint, or instantiable class-like capability is a design choice. But the important thing is that the live identity is the specific instantiated thing, not the reusable definition.

## Question 4: Where Should We Persist For Long-Term Storage Across Reload?

This is the most practically important question.

### A. Live Objects

Recommendation:

- do not persist raw live objects as your primary long-term storage format,
- persist an instance record plus enough durable state to reconstruct it.

Persist:

- object id
- instance id
- constructor or instantiation arguments
- durable domain state
- optional activation policy

Do not persist blindly:

- raw runtime heap objects
- transient handles
- `setInterval` ids
- attached DOM refs

Why:

- live objects are process-local runtime constructs,
- they often contain transient references that cannot be meaningfully restored,
- reconstructing them is safer and clearer than serializing entire runtime heaps.

### B. Artifact Objects

Recommendation:

- persist artifact objects as first-class durable records in a long-term artifact store.

Persist:

- artifact id
- owner chat/thread/context ids
- source code
- docs/metadata
- declared supported harnesses
- declared runtime needs
- version history if available

In current code, the nearest equivalent is the artifact state in [artifactsSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.ts:5), but for long-term reload you probably want something stronger than an in-memory Redux slice.

### C. Instantiated Harnesses And Harness Status

Recommendation:

- persist harness attachments in a harness/workspace persistence store.

Examples of harness-specific persisted state:

- window harness:
  - window positions
  - bounds
  - z-order
  - nav stack
  - focused window
- icon harness:
  - desktop placement
  - selection state if durable
- timer harness:
  - enabled/disabled
  - period
  - next-run policy
- automation harness:
  - schedule
  - last-success timestamp
  - failure backoff policy

### Recommended Persistence Split

Use separate storage responsibilities.

#### Object Store

Stores:

- modules
- classes
- artifact objects
- docs and source references

#### Instance Store

Stores:

- durable instance identities
- constructor args
- durable domain state
- restart/reload policy

#### Harness Attachment Store

Stores:

- which harnesses are attached to which instance/activation
- per-harness persisted state
- workspace UI layout state

#### Activation Store

Stores either:

- nothing durable, if activations are reconstructed on boot, or
- minimal restart metadata, if you want session restoration.

### Recommended Policy For Reload

On reload:

1. load object definitions
2. load durable instance records
3. decide which instances should be reactivated
4. create activations
5. reattach persisted harnesses
6. rehydrate harness state such as windows and timers

## Question 5: What Is The Difference Between Instance And Activation?

This is the tightest distinction.

### Instance

An instance is the object-level identity.

It answers:

- which instantiated object is this?
- what durable state belongs to it?

### Activation

An activation is one running execution of the instance.

It answers:

- which runtime is currently executing it?
- which harnesses are attached now?
- what transient execution resources exist?

### Example

Suppose you instantiate a lightbulb controller object.

- instance: `lightbulb#kitchen`
- activation 1: background automation activation using DSL runtime
- activation 2: debug activation in JS runtime for developer testing

Same instance, multiple activations.

### Why This Distinction Helps

Without it, you tend to put all of these onto one record:

- durable domain identity
- runtime attachment
- windows
- timers
- background jobs

That is exactly the kind of muddy architecture we are trying to avoid.

## Question 6: Why Do You Say The Runtime Surface Registry Entry Is “A Global Pending Bag”?

Because that is how it behaves today.

Evidence:

- there is one module-level `Map` called `registry` in [runtimeSurfaceRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts:28)
- `registerRuntimeSurface(...)` just drops entries into that map in [runtimeSurfaceRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts:32)
- later, `injectPendingRuntimeSurfacesWithReport(...)` iterates that global map and injects every entry into a session in [runtimeSurfaceRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts:81)

### Why “Global”

Because the registry is process-global module state.
It is not scoped to:

- one artifact object,
- one bundle object,
- one activation,
- one workspace.

### Why “Pending”

Because entries are stored there for later injection. They are not immediately part of one specific live activation.

### Why “Bag”

Because conceptually it is just a holding collection of loose definitions waiting to be consumed. It does not model:

- ownership,
- lifecycle,
- intended target activation,
- persistence policy,
- capability identity.

`Bag` is not a formal data-structure critique. It is architecture shorthand for “unscoped holding area.”

## Question 7: What Does Activation-Local Injected Capability Mean?

It means a capability that is added to one specific activation at runtime rather than being part of the base object definition globally.

### Example

Suppose assistant chat generates a temporary card called `chat123.artifact1`.

You might choose to inject it into only one running inventory activation:

- activation: `inventory#main-user@desktop`
- injected capability: `render surface chat123.artifact1`

That means:

- the base inventory object definition has not been globally rewritten,
- other activations of inventory do not automatically get that surface,
- the capability exists only on that one activation unless promoted to a durable object definition.

### Why This Matters

It is the clean alternative to saying “all pending runtime surfaces are globally available to every future session unless manually removed.”

Activation-local injection gives you:

- clear scope,
- clear ownership,
- predictable cleanup on activation dispose,
- room for later promotion into a durable object definition if desired.

## Question 8: What Is A Writable Runtime Harness Broker And Why Is It Called That?

This refers to [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts:42).

### Why “Runtime Harness”

Because it is one harness family that talks to live runtime sessions using messages like:

- `renderSurface`
- `eventSurface`
- `defineSurface`
- `defineSurfaceRender`
- `defineSurfaceHandler`

Those are not window messages. They are direct runtime-facing tooling messages.

### Why “Writable”

Because the handles it returns can mutate the live session.

Evidence:

- `defineSurface(...)` in [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts:104)
- `defineSurfaceRender(...)` in [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts:108)
- `defineSurfaceHandler(...)` in [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts:112)
- `dispose()` in [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts:116)

So this is not just an observer. It is a mutating tooling interface.

### Why “Broker”

Because it mediates between clients and many sessions.

It does all of these:

- spawn session
- get session by id
- list sessions
- dispose session
- subscribe to changes
- return per-session handles

That is broker behavior. It is more than one handle and less than the low-level runtime service.

### Why “Tooling Harness”

Because it primarily exists for developer and system tooling flows:

- REPL commands
- live inspection
- surface authoring
- dynamic patching

It is not the normal end-user window interaction path.

## Question 9: What Is `jsSessionBroker` Here? Why Is It Also A Harness Broker? Why Are They Called Broker?

This refers to [jsSessionBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts:20).

### What It Is

It is the broker for the JavaScript-console harness family.

Its message family is different from `runtimeBroker`.

It exposes:

- `eval(code)`
- `inspectGlobals()`
- `installPrelude(code)`
- `reset()`
- `dispose()`

So conceptually:

- `runtimeBroker` talks in runtime surface messages,
- `jsSessionBroker` talks in JS REPL/eval messages.

### Why It Is Also A Harness Broker

Because it does the same mediation pattern for a different harness contract.

It:

- spawns sessions,
- tracks them,
- hands out per-session handles,
- lets clients list/get/reset/dispose them,
- broadcasts changes to subscribers.

That is again broker behavior.

### Simple Comparison

| Broker | Harness contract | Typical use |
| --- | --- | --- |
| `runtimeBroker` | runtime surface tooling contract | render/event/define surface from REPL and debug tooling |
| `jsSessionBroker` | JS console tooling contract | eval JS, inspect globals, reset console state |

### Concrete Example

If an intern asks “which one would I use to send `renderSurface('home', state)`?”

Answer:

- `runtimeBroker`

If they ask “which one would I use to run `Object.keys(globalThis)` or patch code interactively?”

Answer:

- `jsSessionBroker`

## Design Decisions

### Decision: New Harnesses Should Not Piggyback On Window Surfaces By Default

Rationale:

- timer, automation, icon, and test flows are not conceptually windows,
- forcing them through the window path leaks UI assumptions into non-UI architecture.

### Decision: Instance And Activation Should Be Separate Concepts

Rationale:

- it explains multi-runtime and multi-harness scenarios cleanly,
- it separates durable identity from transient execution state.

### Decision: Persist Durable Definitions And Harness State, Not Raw Live Runtime Memory

Rationale:

- reconstruction is more robust than trying to persist opaque runtime heaps,
- it produces cleaner ownership boundaries and better portability across runtimes.

## Alternatives Considered

### Alternative 1: Keep Using `session` For Everything

Rejected because it stays too overloaded and keeps identity, execution, and harness state mixed together.

### Alternative 2: Treat New Harnesses As Hidden Windows

Rejected because it preserves the current architectural bend instead of removing it.

### Alternative 3: Persist Entire Runtime Heaps As The Main Reload Mechanism

Rejected for now because the codebase is not structured around checkpoint/restore semantics, and that would add a much larger runtime architecture commitment.

## Implementation Plan

1. Add a harness registry and explicit harness contracts.
2. Introduce instance and activation terminology internally.
3. Move attachment state into activation attachment records.
4. Add per-harness persistence model.
5. Prototype a timer harness with a `tick()` contract.
6. Decide whether artifact-generated capabilities are activation-local by default or immediately promoted into durable object definitions.

## Open Questions

- Should a single instance be allowed to have multiple simultaneous activations by default?
- Should timer harnesses target instances or activations directly?
- Which activation metadata should be durable enough to restore on reload?
- When should an activation-local capability be promoted into a durable object definition?

## References

- [runtimeSurfaceRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts:1)
- [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts:1)
- [jsSessionBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts:1)
- [windowingSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts:23)
- [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:105)
- [artifactsSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.ts:5)
