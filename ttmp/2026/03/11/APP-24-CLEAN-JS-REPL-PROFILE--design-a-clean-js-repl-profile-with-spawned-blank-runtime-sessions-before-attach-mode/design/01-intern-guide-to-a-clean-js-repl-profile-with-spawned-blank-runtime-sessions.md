---
Title: Intern guide to a clean JS REPL profile with spawned blank runtime sessions
Ticket: APP-24-CLEAN-JS-REPL-PROFILE
Status: active
Topics:
    - architecture
    - frontend
    - repl
    - tooling
    - hypercard
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl/src/MacRepl.tsx
      Note: Generic REPL shell that should host the future clean JS profile without becoming HyperCard-specific.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl/src/types.ts
      Note: Current generic driver/effect/help/completion contracts that the JS profile should reuse.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts
      Note: Existing broker is bundle/surface-oriented and is the comparison point for a lower-level JS session broker.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: Holds the actual QuickJS VM lifecycle and shows why the current public seam is too high-level for a blank JS REPL.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/hypercardReplModule.tsx
      Note: Current HyperCard REPL launcher integration, useful as the host-module template for a future plain JS REPL module.
Summary: Detailed design guide for adding a true blank JavaScript REPL profile with its own spawned QuickJS sessions before attempting attach mode for existing HyperCard runtime sessions.
LastUpdated: 2026-03-11T14:15:00-04:00
WhatFor: Use this guide to understand why a clean JS REPL should come before attach mode, where the current runtime seams are too bundle-specific, and how to design a reusable blank-JS session broker plus driver/profile without adding accidental HyperCard coupling.
WhenToUse: Use when implementing a plain JavaScript REPL window, designing lower-level QuickJS session APIs, or deciding how much of the HyperCard runtime stack should be reused for non-HyperCard REPL tooling.
---

# Intern guide to a clean JS REPL profile with spawned blank runtime sessions

## Why this ticket exists

APP-22 proved that the new REPL shell platform is real:

- `@hypercard/repl` now exists as its own package
- the HyperCard REPL can spawn broker-owned runtime sessions
- the REPL can list packages, surfaces, and sessions
- the REPL can open runtime-backed windows
- the REPL can even define and patch runtime surfaces inside spawned sessions

That is useful, but it is not the same as a clean JavaScript REPL.

Today, the `HyperCard REPL` is still a REPL for `RuntimeBundle`s and `RuntimeSurface`s. Every spawned session must load:

- a bundle id
- bundle code
- explicit runtime packages
- the bundle bootstrap contract in `stack-bootstrap.vm.js`

That means the current tool is a runtime authoring console for HyperCard-style bundles, not a general JS console.

The user asked the right sequencing question:

- should we do a clean JS REPL first?
- or should we do attach mode first?

The answer is: **do the clean JS REPL first**.

The clean JS REPL is the simpler and more foundational feature. It gives us:

- a true non-HyperCard proof that `@hypercard/repl` is reusable
- a lower-level QuickJS session seam that is not bundle/surface-shaped
- a simpler place to solve eval/history/inspection/completion semantics
- a safer place to decide what “session ownership” means before attach mode adds multi-owner complexity

Attach mode is still valuable, but it should happen after the clean JS REPL, not before it.

## Short version

The design direction in one paragraph:

- keep using `@hypercard/repl` for the shell
- add a new **plain JS session broker** below the current HyperCard runtime broker
- let a new **JS REPL driver/profile** talk to that broker
- spawn blank QuickJS sessions with a very small initial prelude
- evaluate plain JS expressions/statements directly
- add host-side niceties like formatting, help, completions, and optional window effects incrementally
- do not try to force blank JS through `RuntimeBundle` / `RuntimeSurface` just to reuse the current HyperCard APIs

## Current system and why it does not fit yet

### What already exists

The shell layer is already reusable.

Relevant files:

- [MacRepl.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl/src/MacRepl.tsx)
- [types.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl/src/types.ts)

The current generic shell already supports:

- driver-based execution
- completion items
- help entries
- async execution
- emitted host effects
- a reusable terminal look-and-feel

That is good. We do not need a new shell.

### What the current HyperCard bridge assumes

The current runtime tooling in `hypercard-runtime` starts too high in the stack.

Relevant file:

- [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts)

That broker assumes all of the following are true:

- every session belongs to a `stackId`
- every session loads a `bundleCode`
- every session has `packageIds`
- every session has `surfaces`
- every session reports `surfaceTypes`
- every session is useful through `renderSurface(...)` and `eventSurface(...)`

That is perfect for HyperCard runtime tooling.

It is wrong for a blank JS REPL.

### Why a blank JS REPL should not fake being a bundle

It would be tempting to create a fake “empty bundle” and run plain JS inside it. That would be a mistake.

If we do that, we immediately inherit the wrong mental model:

- the session must pretend to be a bundle
- evaluation must pretend to be render/event traffic
- session summaries must pretend to be surface-based
- docs/help must pretend blank JS is just another surface package

This would add complexity instead of removing it.

The correct design is to recognize that there are two layers:

```text
Layer 1: raw JS VM sessions
  - create VM
  - load tiny prelude
  - evaluate code
  - inspect globals/values
  - dispose VM

Layer 2: HyperCard runtime sessions
  - create VM
  - install runtime packages
  - load runtime bundle
  - render/event runtime surfaces
  - mutate surfaces
```

HyperCard runtime sessions are built on top of the raw JS VM layer. The blank JS REPL wants Layer 1, not Layer 2.

## Conceptual model

### The important separation

We should explicitly separate:

1. `JS VM session`
2. `HyperCard runtime session`

The first is generic:

- evaluate JS
- maintain globals
- maybe expose tiny helper APIs

The second is application-framework-specific:

- runtime packages
- runtime bundles
- runtime surfaces
- render/event semantics

The clean JS REPL should operate on **JS VM sessions**, not on `RuntimeBundle`s.

### Proposed core terminology for this ticket

For APP-24, use these nouns:

- `JsSessionBroker`
- `JsSessionHandle`
- `JsSessionSummary`
- `JsEvalResult`
- `JsReplDriver`
- `JsReplProfile`

This avoids dragging the `RuntimeBundle` / `RuntimeSurface` vocabulary into something more primitive.

## Current architecture map

### Existing HyperCard REPL path

Today’s path looks like this:

```text
MacRepl
  -> ReplDriver.execute()
  -> HyperCard REPL driver
  -> RuntimeBroker.spawnSession()
  -> QuickJSRuntimeService.loadRuntimeBundle()
  -> stack-bootstrap.vm.js
  -> renderSurface / eventSurface / defineSurface
```

Relevant files:

- [hypercardReplDriver.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/hypercardReplDriver.ts)
- [runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts)
- [runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts)
- [hypercardReplModule.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/hypercardReplModule.tsx)

### Desired plain JS REPL path

The new path should look like this:

```text
MacRepl
  -> ReplDriver.execute()
  -> JS REPL driver
  -> JsSessionBroker.spawnSession()
  -> low-level QuickJS session service
  -> eval(code)
  -> return value / printed output / errors / help / completions
```

That path is simpler and should stay simpler.

## What code needs to exist

## 1. A lower-level QuickJS session service

The existing [QuickJSRuntimeService](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts) already knows how to:

- boot a QuickJS module
- create a runtime
- create a context
- install memory/stack limits
- evaluate code with timeouts
- dispose the runtime

The problem is that the public API begins at `loadRuntimeBundle(...)`.

That is too late for a plain JS REPL.

### Recommended refactor

Extract a smaller internal or public layer, for example:

```ts
interface QuickJsSessionService {
  createSession(sessionId: string, options?: JsSessionOptions): Promise<JsSessionMeta>;
  eval(sessionId: string, code: string): JsEvalResult;
  getGlobals(sessionId: string): string[];
  setGlobal?(sessionId: string, name: string, value: unknown): void;
  dispose(sessionId: string): boolean;
}
```

This layer should be responsible for:

- creating a bare VM
- loading a tiny JS REPL prelude
- evaluating raw JavaScript
- converting QuickJS values/errors into serializable results

It should **not** know anything about:

- runtime packages
- bundles
- surfaces
- render/event

### Why extract instead of duplicating

If APP-24 creates a second completely separate QuickJS lifecycle implementation, we will get:

- duplicate timeout logic
- duplicate error formatting
- duplicate memory settings
- duplicate session disposal bugs

That would be a bad outcome.

The right move is to pull the shared QuickJS lifecycle down, then let:

- `QuickJSRuntimeService` build the HyperCard runtime layer on top
- `QuickJsSessionService` build blank JS REPL sessions on top

## 2. A JS session broker

The current [RuntimeBroker](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts) is too HyperCard-specific.

APP-24 should add a sibling broker, not overload the existing one.

Recommended interface:

```ts
interface SpawnJsSessionRequest {
  sessionId: string;
  title?: string;
  preludeCode?: string;
}

interface JsSessionSummary {
  sessionId: string;
  title: string;
  globalNames: string[];
  createdAt: string;
}

interface JsSessionHandle {
  readonly sessionId: string;
  eval(code: string): Promise<JsEvalResult>;
  inspectGlobals(): Promise<string[]>;
  reset?(): Promise<void>;
  dispose(): boolean;
}

interface JsSessionBroker {
  spawnSession(request: SpawnJsSessionRequest): Promise<JsSessionHandle>;
  getSession(sessionId: string): JsSessionHandle | null;
  listSessions(): JsSessionSummary[];
  disposeSession(sessionId: string): boolean;
  subscribe(listener: () => void): () => void;
}
```

This is structurally similar to `RuntimeBroker`, but not shape-compatible with it, and that is okay.

## 3. A JS REPL driver/profile

The shell already expects a [ReplDriver](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl/src/types.ts).

The plain JS profile should implement that interface, but the semantics should feel like a normal JS console rather than a command router.

### Recommended interaction style

Support two layers of input:

1. `:` commands for session management
2. plain JavaScript for evaluation

Example:

```text
:spawn js-1
1 + 2
const x = 41
x + 1
:globals
:reset
```

Why do this:

- session management commands remain explicit
- JS code does not need extra wrappers
- it avoids colliding with JavaScript syntax
- it feels familiar to terminal REPLs

### Suggested initial command set

Required:

- `:spawn [session-id]`
- `:sessions`
- `:use <session-id>`
- `:globals`
- `:reset`
- `:dispose <session-id>`
- `:help [topic]`

Optional later:

- `:load <file>`
- `:inspect <symbol>`
- `:clear`
- `:open-window`

Everything else should be treated as JavaScript and passed directly to `JsSessionHandle.eval(...)`.

## 4. A minimal JS prelude

Even a “blank” JS REPL usually wants a tiny prelude.

This should be intentionally tiny.

Recommended initial prelude:

- safe `console.log` capture hook
- optional `help()` helper
- optional lightweight pretty-printer helper

Do **not** preload:

- `ui`
- `widgets`
- `kanban`
- HyperCard bundle bootstrap
- runtime package registration helpers

This keeps the feature honest: it is a blank JS console first.

Pseudocode:

```js
globalThis.__jsRepl = {
  logs: [],
  print(value) {
    this.logs.push(String(value));
  }
};

globalThis.console = {
  log: (...args) => __jsRepl.logs.push(args.map(String).join(' ')),
};
```

The host can then:

- run eval
- collect captured logs
- clear them after each evaluation result

## 5. A formatter for JS eval results

One of the biggest usability decisions is how to present results.

Plain `JSON.stringify(...)` is not enough because:

- functions disappear
- cyclic objects break
- errors lose structure
- `undefined` is awkward

APP-24 should define a first-pass formatter shape, for example:

```ts
interface JsEvalResult {
  valueText?: string;
  logs: string[];
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  meta?: {
    valueType: string;
    elapsedMs: number;
  };
}
```

The first version does not need a full object explorer. Text formatting is enough.

## 6. Autocomplete and on-demand help

APP-22 already established that help/completion should be provider-driven. APP-24 should keep that rule.

### Completion sources for the JS profile

Phase 1:

- JS REPL commands (`:spawn`, `:sessions`, ...)
- JavaScript keywords
- global names from the current session

Phase 2:

- built-in object members
- prelude helpers
- optional pluggable docs providers

### Help sources for the JS profile

Phase 1:

- REPL command help
- JS profile help topics
- prelude helper docs

Phase 2:

- MDN-like docs mapping if we ever decide to add it
- mounted docs providers in the docs browser system

Important: APP-24 should **not** promise internet-backed JS docs. Keep it local and deterministic.

## 7. Host integration

APP-24 needs its own launcher module, but it should follow the same pattern as the HyperCard REPL:

- console window for the REPL itself
- later optional extra windows for object inspectors or render previews

Likely location:

- `wesen-os/apps/os-launcher/src/app/jsReplModule.tsx`

This module should be simpler than [hypercardReplModule.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/hypercardReplModule.tsx) because it does not need runtime-surface rendering.

### Likely first UI

Just one window:

- app id: `js-repl`
- title: `JavaScript REPL`
- icon: maybe `λ` or `JS`

That is enough for phase 1.

## 8. Why this should come before attach mode

Attach mode still has the same hard problems:

- session discovery
- ownership
- read/write safety
- lifecycle conflicts with the owning window
- concurrency with `RuntimeSurfaceSessionHost`

The blank JS REPL has none of that.

It is therefore the right next architectural step because it gives us:

- proof the REPL shell is reusable outside HyperCard
- proof a lower-level session broker is worth having
- proof we can present good eval/help/completion UX before multi-owner complexity enters

This is the sequencing rule for the intern:

1. first: plain JS REPL with spawned blank sessions
2. second: maybe add richer JS helpers and inspectors
3. third: only then revisit attach mode for existing HyperCard sessions

## Recommended implementation plan

## Phase 0: Design and extraction prep

Goal:

- identify the shared QuickJS lifecycle code to extract from `QuickJSRuntimeService`

Concrete tasks:

- audit which methods in [runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts) are generic vs HyperCard-specific
- design `QuickJsSessionService`
- design `JsSessionBroker`
- write unit-test plan first

Deliverable:

- clean API sketch, no code duplication

## Phase 1: Lower-level JS session service

Goal:

- create bare QuickJS sessions and evaluate code safely

Concrete tasks:

- extract shared VM boot/disposal/error code
- add `createSession(...)`
- add `eval(...)`
- add `dispose(...)`
- add test coverage for:
  - arithmetic
  - variable persistence
  - thrown error formatting
  - timeout handling

Deliverable:

- no REPL UI yet required
- just a tested programmatic broker/service

## Phase 2: JS broker

Goal:

- expose blank JS sessions through a broker similar to the runtime broker

Concrete tasks:

- implement `JsSessionBroker`
- implement `JsSessionHandle`
- support session summaries and subscriptions
- support reset/dispose semantics

Deliverable:

- testable session lifecycle outside UI

## Phase 3: JS REPL driver/profile

Goal:

- make the shell usable as a real JS console

Concrete tasks:

- add `:spawn`, `:use`, `:sessions`, `:globals`, `:reset`
- treat non-`:` lines as JS eval
- format outputs and errors
- add command help
- add keyword/global completions

Deliverable:

- a real plain JS REPL in tests and Storybook

## Phase 4: `wesen-os` launcher module

Goal:

- make the JS REPL visible in the desktop shell

Concrete tasks:

- add `jsReplModule.tsx`
- add launcher host tests
- add basic live smoke validation

Deliverable:

- real app window in `http://localhost:5173`

## Phase 5: Niceties

Goal:

- improve usability without turning it into a second HyperCard system

Optional additions:

- multiline input
- transcript export
- better object preview
- optional helper prelude
- optional inspector window

## Architecture diagram

```text
@hypercard/repl
  MacRepl
    |
    v
JsReplDriver
    |
    v
JsSessionBroker
    |
    v
QuickJsSessionService
    |
    v
QuickJS VM
```

Compared to the HyperCard path:

```text
@hypercard/repl
  MacRepl
    |
    v
HypercardReplDriver
    |
    v
RuntimeBroker
    |
    v
QuickJSRuntimeService
    |
    v
Runtime packages + bundle + surfaces
```

The second path should stay richer. The first path should stay simpler.

## Pseudocode sketch

### Driver behavior

```ts
async function execute(line: string): Promise<ReplExecutionResult> {
  if (line.startsWith(':')) {
    return executeMetaCommand(line);
  }

  const session = requireActiveSession();
  const result = await session.eval(line);
  return formatEvalResult(result);
}
```

### Session creation

```ts
async function spawnSession(sessionId: string) {
  const service = getQuickJsSessionService();
  const handle = await service.createSession(sessionId, {
    preludeCode: JS_REPL_PRELUDE,
  });
  sessions.set(sessionId, handle);
  return handle;
}
```

### Eval result formatting

```ts
function formatEvalResult(result: JsEvalResult): ReplExecutionResult {
  if (result.error) {
    return {
      lines: [
        ...result.logs.map((text) => ({ type: 'system', text })),
        { type: 'error', text: `${result.error.name}: ${result.error.message}` },
      ],
    };
  }

  return {
    lines: [
      ...result.logs.map((text) => ({ type: 'system', text })),
      { type: 'output', text: result.valueText ?? 'undefined' },
    ],
  };
}
```

## Risks and traps

### 1. Reusing too much HyperCard machinery

Do not force:

- runtime packages
- bundles
- surfaces
- render/event

into the JS REPL just to reuse existing APIs.

### 2. Duplicating QuickJS management

Do not create a totally separate VM lifecycle implementation if the shared parts can be extracted cleanly.

### 3. Promising too much introspection too early

The first version should focus on:

- correct session lifecycle
- correct eval semantics
- readable output

It does not need a full inspector UI immediately.

### 4. Letting attach-mode concerns leak in

Attach mode is a separate problem. APP-24 should stay focused on spawned blank sessions.

## Validation guidance

Minimum automated validation:

- JS session service unit tests
- broker lifecycle tests
- REPL driver tests
- launcher module tests

Minimum manual validation:

1. open `JavaScript REPL`
2. run `:spawn js-1`
3. evaluate `1 + 2`
4. evaluate `const x = 41`
5. evaluate `x + 1`
6. evaluate `console.log("hello")`
7. evaluate `throw new Error("boom")`
8. run `:globals`
9. run `:reset`
10. confirm `x` is gone

## Final recommendation

Do not implement attach mode next.

Implement the clean JS REPL first, because it is:

- simpler
- more foundational
- less coupled to HyperCard ownership rules
- a better test of the new reusable REPL platform

Once that exists, attach mode will have a cleaner architectural home and better-defined lower-level session primitives to build on.
