# REPL and Runtime Debug Guide

Last verified against source: 2026-03-11

This guide explains the current REPL and runtime-debug tooling in `go-go-os-frontend` and
`wesen-os`.

It is for a new intern who needs to answer questions like:

- What is the difference between the `HyperCard REPL` and the `JavaScript REPL`?
- Why do plain JS sessions not show up as runtime surfaces?
- Where do REPL commands go when you press Enter?
- How does `Stacks & Cards` know what to display?
- Where should a future task-manager style window get its data?

This document is intentionally practical. It assumes you already know the core runtime nouns from:

- [runtime-concepts-guide.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/docs/runtime-concepts-guide.md)
- [js-api-user-guide-reference.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/docs/js-api-user-guide-reference.md)

## 1. The Short Version

There are now two distinct REPL profiles:

- `HyperCard REPL`
  - profile for authoring and manipulating `RuntimeBundle` / `RuntimeSurface` code
  - backed by the HyperCard runtime broker
- `JavaScript REPL`
  - profile for spawned blank QuickJS sessions
  - backed by `JsSessionBroker`

And there are also two distinct debug surfaces:

- `Stacks & Cards`
  - bundle/surface-oriented runtime debugger
  - now keeps only a compact JS-session summary and links operators into `Task Manager`
- `Task Manager`
  - shared operator/session-manager window
  - aggregates multiple broker/session sources without forcing them into one data model

The key architectural rule is:

- plain JS sessions are not runtime surfaces
- runtime surfaces are not plain JS sessions

Those systems can be presented together in UI, but they should not be collapsed into one storage
model.

## 2. Conceptual Split

```text
@go-go-golems/os-repl
  reusable shell
  transcript
  history
  completions
  effects

REPL driver
  profile-specific command vocabulary
  result formatting
  help/completions

broker/session layer
  owns live sessions
  evaluates code
  preserves globals
  exposes summaries

debug UI
  reads broker summaries and runtime-session state
  lets operators inspect, reset, dispose, open, or edit
```

Each layer should stay independently reusable.

## 3. `@go-go-golems/os-repl`: The Shared Shell

Main files:

- [packages/os-repl/src/MacRepl.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-repl/src/MacRepl.tsx)
- [packages/os-repl/src/controller.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-repl/src/controller.ts)
- [packages/os-repl/src/types.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-repl/src/types.ts)

Responsibilities:

- render the transcript
- render the current prompt/input line
- manage history navigation
- ask the active driver for completions
- ask the active driver to execute submissions
- deliver generic `ReplEffect[]` back to the host

Responsibilities it does **not** own:

- VM lifecycle
- session persistence
- HyperCard-specific authoring commands
- plain JS evaluation semantics

### Transcript behavior

When the user presses Enter:

1. `MacRepl` trims the current input
2. the command is stored in history
3. the driver runs
4. the transcript appends:
   - an `input` line for the submitted command
   - zero or more output/error/system lines from the driver

That transcript echo now happens even if the driver only returns output lines. The shell treats the
user submission itself as a first-class line in the transcript.

Pseudo-flow:

```ts
async function handleSubmit(raw: string) {
  const result = await driver.execute(raw, context);
  const transcriptLines = prependInputLine(raw, result.lines);
  appendLines(transcriptLines);
}
```

## 4. The HyperCard REPL Profile

Main files:

- [packages/os-scripting/src/repl/hypercardReplDriver.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-scripting/src/repl/hypercardReplDriver.ts)
- [packages/os-scripting/src/repl/runtimeBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-scripting/src/repl/runtimeBroker.ts)
- [apps/os-launcher/src/app/hypercardReplModule.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/hypercardReplModule.tsx)

This profile is for:

- spawning runtime sessions for specific bundles
- defining or redefining runtime surfaces
- querying package docs
- opening runtime windows through host effects

It operates in runtime-language nouns:

- packages
- bundles
- surfaces
- surface types

It is not a blank JS console.

## 5. The Plain JavaScript REPL Profile

Main files:

- [packages/os-scripting/src/plugin-runtime/jsSessionService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-scripting/src/plugin-runtime/jsSessionService.ts)
- [packages/os-scripting/src/repl/jsSessionBroker.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-scripting/src/repl/jsSessionBroker.ts)
- [packages/os-scripting/src/repl/jsReplDriver.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-scripting/src/repl/jsReplDriver.ts)
- [apps/os-launcher/src/app/jsReplModule.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/jsReplModule.tsx)

This profile is for:

- spawning blank QuickJS sessions
- evaluating raw JavaScript
- keeping globals alive across eval calls
- listing globals
- resetting or disposing sessions

Command model:

- lines starting with `:` are REPL meta commands
- every other line is evaluated as raw JS in the active session

Examples:

```text
:spawn js-1
const x = 41
x + 1
:globals
:reset
```

### What “maintaining globals” actually means

The shell does not preserve globals.

The persistent QuickJS session does.

That means this behavior:

```text
> const x = 41
> x + 1
42
```

comes from the same live JS session being reused across evaluations.

## 6. Why JS Sessions Are Not Runtime Surfaces

A runtime surface session has:

- a `RuntimeBundle`
- installed `RuntimePackage`s
- one or more renderable `RuntimeSurface`s
- host-driven render and event calls

A plain JS session has:

- a QuickJS VM
- global JS state
- raw eval
- no surface tree
- no surface type
- no render loop

That is why the `JavaScript REPL` sessions do not belong in the runtime-surface Redux slice.

They can be visible in the same debugging UI, but the storage model should stay separate.

## 7. `Stacks & Cards` and the Task Manager Split

Main files:

- [packages/os-scripting/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-scripting/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx)
- [packages/os-scripting/src/hypercard/debug/runtimeDebugRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-scripting/src/hypercard/debug/runtimeDebugRegistry.ts)
- [packages/os-scripting/src/hypercard/debug/jsSessionDebugRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-scripting/src/hypercard/debug/jsSessionDebugRegistry.ts)
- [packages/os-scripting/src/hypercard/task-manager/TaskManagerWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-scripting/src/hypercard/task-manager/TaskManagerWindow.tsx)
- [apps/os-launcher/src/app/taskManagerModule.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/taskManagerModule.tsx)

`Stacks & Cards` still reads three data sources:

1. bundle metadata
2. runtime-surface session state from Redux
3. JS session summaries from registered `JsSessionBroker`s

The third source is intentionally an external registry, not Redux, but it is no longer rendered as a
full operator table there.

### Why the registry exists

`JsSessionBroker` owns:

- live session handles
- reset/dispose methods
- subscriptions

Those are behaviorful objects and should not be serialized into Redux. Instead:

- the registry stores broker objects
- the debug window subscribes to them
- the UI renders serializable session summaries

That is the same basic pattern used elsewhere for mounted docs providers.

### Current window responsibilities

`Stacks & Cards` is still the right tool for:

- bundle and predefined surface catalog
- runtime-surface registry inspection
- artifact/runtime-surface inspection
- source editing
- current runtime-surface session inspection

The compact `JS Sessions` section now only:

- shows the current JS-session count
- reminds the operator that JS sessions are external/broker-owned
- opens `Task Manager` for actual session operations

## 8. Task Manager vs `Stacks & Cards`

The codebase now has both windows, and they have different jobs.

Use this rule:

- if the user wants to inspect bundles, surfaces, artifacts, or built-in source:
  use `Stacks & Cards`
- if the user wants to manage live sessions across different source systems:
  use `Task Manager`

`Task Manager` is allowed to show:

- runtime-surface sessions
- plain JS sessions
- future REPL sessions for other languages
- later, maybe long-running tool tasks

Conceptually:

```text
Session Manager
  RuntimeSession sources
  JsSessionBroker sources
  future language/tool session sources
```

That separation is why APP-25 introduced:

- `TaskManagerSource`
- `TaskManagerRow`
- `TaskManagerAction`

instead of trying to keep extending `RuntimeSurfaceDebugWindow` forever.

## 9. Host Registration Pattern

When a host app creates a broker-backed session source, it should register it explicitly.

Example:

```ts
const JS_SESSION_BROKER = createJsSessionBroker();

registerJsSessionDebugSource({
  id: 'js-repl',
  title: 'JavaScript REPL',
  broker: JS_SESSION_BROKER,
});
```

That is currently done in:

- [jsReplModule.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/jsReplModule.tsx)

This keeps ownership obvious:

- the app creates the broker
- the app decides whether it should be visible in debug tooling

## 10. Common Mistakes

### Mistake: Treating REPL state and session state as the same thing

They are different layers.

- transcript/history/completion popup state lives in the shell
- globals/results/session lifecycle live in the broker/service

### Mistake: Forcing JS sessions into the runtime-surface Redux slice

That would blur the model and make the state harder to reason about.

### Mistake: Hiding broker registration in module-global imports

Host apps should still register and expose debug sources explicitly.

### Mistake: Letting the driver be the source of truth for session lifecycle

The driver should translate text commands into broker operations.

The broker should own live sessions.

## 11. Recommended Reading Order

1. Read this guide once.
2. Read [runtime-concepts-guide.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/docs/runtime-concepts-guide.md).
3. Read [js-api-user-guide-reference.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/docs/js-api-user-guide-reference.md).
4. Read the APP-22 and APP-24 ticket docs if you need the design history.
