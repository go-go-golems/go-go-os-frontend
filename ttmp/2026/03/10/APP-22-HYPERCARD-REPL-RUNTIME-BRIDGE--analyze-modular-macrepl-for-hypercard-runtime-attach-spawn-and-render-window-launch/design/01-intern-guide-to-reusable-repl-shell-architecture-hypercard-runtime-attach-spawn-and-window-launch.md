---
Title: Intern guide to reusable REPL shell architecture, HyperCard runtime attach/spawn, and window-launch workflows
Ticket: APP-22-HYPERCARD-REPL-RUNTIME-BRIDGE
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - widgets
    - repl
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl/src/MacRepl.tsx
      Note: Current reusable REPL shell source of truth after extraction from rich-widgets.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl/src/replCommands.ts
      Note: Current built-in demo driver used to prove the shell and protocol independently of HyperCard.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl/src/replState.ts
      Note: Current reusable terminal reducer/state model owned by the extracted REPL package.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: Current runtime session service that can already load bundles, define runtime surfaces dynamically, render, and dispatch events.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: VM bootstrap defining the runtime contract exposed inside QuickJS.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Current owner of live runtime sessions for desktop runtime-surface windows.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.ts
      Note: Current runtime package registry used to install package APIs into runtime sessions.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx
      Note: Current runtime surface-type registry used to validate and render runtime trees.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/kanbanVmModule.tsx
      Note: Example of launching runtime-backed windows through the normal desktop shell path.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/runtimeDebugModule.tsx
      Note: Example of how host apps expose tooling windows that operate on runtime bundles and surfaces.
Summary: Detailed design guide for turning the current MacRepl widget into a reusable REPL shell platform, then connecting one concrete REPL driver to HyperCard runtime sessions, runtime packages, docs/help providers, and render-window launch workflows.
LastUpdated: 2026-03-11T12:15:00-04:00
WhatFor: Use this guide to understand the current state, the desired future architecture, and the phased implementation plan for a reusable REPL shell and a HyperCard runtime bridge.
WhenToUse: Use when implementing APP-22, modularizing MacRepl, designing attach/spawn tooling, or planning autocomplete/help/introspection systems for runtime-aware developer consoles.
---

# Intern guide to reusable REPL shell architecture, HyperCard runtime attach/spawn, and window-launch workflows

## Executive Summary

The current `MacRepl` widget is a strong visual proof of concept and a weak systems design. It already proves that a retro desktop REPL can feel good inside this workspace. It does not yet prove that the architecture is reusable.

That distinction matters because the user goal is broader than “add a JavaScript console.” The real goal is to create a reusable REPL shell that can support:

- HyperCard runtime tooling now
- autocomplete and context-aware help
- pack-aware docs and inspection
- launching render windows from REPL results
- future languages or tool domains without rebuilding the shell

So the design should not be:

```text
MacRepl -> HyperCard runtime
```

The design should be:

```text
Reusable REPL shell
  -> generic REPL protocol
  -> pluggable driver/profile
  -> optional help/completion/introspection providers
  -> host effect executor

One concrete driver:
  HyperCard runtime driver
    -> spawn RuntimeSession
    -> attach to RuntimeSession
    -> query RuntimePackages / RuntimeSurfaceTypes
    -> open runtime-backed windows
```

This guide explains that architecture in detail.

## Problem Statement

We need to solve two related but distinct problems.

### Problem 1: `MacRepl` is not reusable enough

Current `MacRepl`:

- owns its own text-entry UI
- owns its own history behavior
- owns its own command-execution model
- owns its own reducer shape
- assumes synchronous toy command execution
- assumes one fixed command namespace

That makes it hard to reuse for:

- another language
- another execution backend
- another tool domain
- asynchronous execution
- richer completion/help flows

### Problem 2: HyperCard runtime tooling has no proper external control seam

Current HyperCard runtime:

- already has the low-level primitives a REPL would want
- does not expose live runtime handles through a deliberate tool-facing broker
- keeps `RuntimeSession` ownership inside `RuntimeSurfaceSessionHost`

That means:

- spawn mode is possible with some new tooling seams
- attach mode is not cleanly possible today

We need a design that fixes both problems without collapsing them into one package or one widget.

## Current System Audit

### The current REPL shell package

Main file:

- [MacRepl.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl/src/MacRepl.tsx)

Current structure:

- `MacRepl`
- `ConnectedMacRepl`
- `StandaloneMacRepl`
- `MacReplFrame`

Current supporting files:

- [replCommands.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl/src/replCommands.ts)
- [replState.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl/src/replState.ts)
- `ReplInputLine.tsx`

Current behavior:

- local or Redux-backed transcript
- command history
- simple completion list
- built-in toy commands:
  - `help`
  - `clear`
  - `history`
  - `env`
  - `calc`
  - `js`
  - `fortune`
  - `grep`
  - `alias`
  - `unalias`

Current problem:

```text
MacReplFrame
  -> executeReplCommand(...)
  -> returns text lines + env + aliases
  -> directly mutates terminal state
```

That is good enough for a demo. It is not a reusable runtime console architecture.

### The current runtime core

Main files:

- [runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts)
- [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js)
- [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx)

Current runtime capabilities that matter to a REPL:

- `loadRuntimeBundle(...)`
- `defineRuntimeSurface(...)`
- `renderRuntimeSurface(...)`
- `eventRuntimeSurface(...)`
- `disposeRuntimeSession(...)`
- runtime package registration
- runtime surface-type registration

So the runtime already has the low-level mechanics a REPL wants.

### The current ownership blocker

The blocker is not capability. It is ownership.

Today:

```text
RuntimeSurfaceSessionHost
  owns the live QuickJS service instance
  owns the session lifecycle
  does not expose a stable tool-facing runtime handle
```

So no tool can currently say:

- “attach to this live runtime session”
- “show me the installed packages in this session”
- “render this surface manually”
- “define a new surface on the fly”

without reaching into React-owned internals.

That is the main architectural seam APP-22 must define.

## Updated Runtime Context After APP-16 and APP-23

APP-22 must now assume the current runtime vocabulary and extracted package architecture.

The important concepts are:

- `RuntimeSession`
- `RuntimeBundle`
- `RuntimePackage`
- `RuntimeSurface`
- `RuntimeSurfaceType`

And the important package facts are:

- `ui` is now owned by `@hypercard/ui-runtime`
- `kanban` is now owned by `@hypercard/kanban-runtime`
- host apps register packages explicitly
- runtime core owns generic lifecycle and registries only

This matters because the REPL should be package-aware. A useful HyperCard REPL should understand:

- which packages a session has installed
- which surface types are available
- how to ask for help on a package or symbol
- how to autocomplete package APIs based on installed packages

So the REPL design needs to treat package metadata and docs as first-class data, not just rendering concerns.

## Core Design Decision

The correct architecture is:

- generic reusable REPL shell outside HyperCard-specific ownership
- generic REPL protocol outside HyperCard-specific ownership
- HyperCard runtime driver inside or adjacent to `hypercard-runtime`
- host effect integration in the app layer

That means the shell should not know about:

- QuickJS
- `RuntimeSurfaceSessionHost`
- `ui` or `kanban`
- desktop `openWindow(...)`

Those belong one layer down or one layer up.

## Proposed Layered Architecture

### Layer 1: Reusable REPL shell UI

Preferred ownership:

- keep the presentational shell in `@hypercard/repl`

This layer owns:

- transcript rendering
- prompt line
- selection/highlight
- completion popup UI
- help popup UI
- status bar
- optional split panes

This layer does not own:

- command semantics
- runtime handles
- language/tool-specific docs
- window launch behavior

Recommended pieces:

- `MacReplChrome`
- `ReplTranscriptView`
- `ReplPromptInput`
- `ReplCompletionList`
- `ReplHelpPane`
- `ReplStatusBar`

Key design rule:

- this layer must be reusable for JavaScript, HyperCard runtime sessions, Lua later, SQL consoles, agent consoles, or non-language command palettes

### Layer 2: Generic REPL protocol and controller

This is the part the current `MacRepl` does not have yet.

This layer owns:

- driver lifecycle
- pending execution state
- transcript append/update policy
- history navigation
- completion request lifecycle
- help lookup lifecycle
- effect emission
- session/profile identity

This layer should be generic, not HyperCard-specific.

Recommended interfaces:

```ts
interface ReplDriverContext {
  profileId: string;
  cwd?: string;
  env?: Record<string, string>;
  capabilities: string[];
}

interface ReplDriver {
  getPrompt(context: ReplDriverContext): string | Promise<string>;
  getBanner?(context: ReplDriverContext): Promise<ReplLine[]>;
  execute(input: string, context: ReplDriverContext): Promise<ReplExecution>;
  complete(request: ReplCompletionRequest, context: ReplDriverContext): Promise<ReplCompletionResult>;
  getHelp?(request: ReplHelpRequest, context: ReplDriverContext): Promise<ReplHelpResult | null>;
  inspect?(request: ReplInspectRequest, context: ReplDriverContext): Promise<ReplInspectResult | null>;
  dispose?(): Promise<void>;
}
```

Suggested result types:

```ts
interface ReplExecution {
  lines: ReplLine[];
  effects?: ReplEffect[];
  promptOverride?: string;
  statusItems?: Array<{ label: string; value: string }>;
}

interface ReplCompletionRequest {
  input: string;
  cursor: number;
}

interface ReplCompletionResult {
  items: ReplCompletionItem[];
  replacementRange?: { start: number; end: number };
}

interface ReplHelpRequest {
  topic: string;
  mode?: 'inline' | 'full';
}
```

### Layer 3: Optional provider system for completion, help, and inspection

This is the key new APP-22 addition.

The shell should not bake help and autocomplete into one monolithic driver implementation. It should allow a profile or driver to plug in:

- completion providers
- help providers
- inspection providers
- docs providers

Recommended interfaces:

```ts
interface ReplCompletionProvider {
  id: string;
  complete(request: ReplCompletionRequest, context: ReplDriverContext): Promise<ReplCompletionItem[]>;
}

interface ReplHelpProvider {
  id: string;
  resolveHelp(request: ReplHelpRequest, context: ReplDriverContext): Promise<ReplHelpResult | null>;
}

interface ReplInspectProvider {
  id: string;
  inspect(request: ReplInspectRequest, context: ReplDriverContext): Promise<ReplInspectResult | null>;
}
```

Why this matters:

- HyperCard runtime help should be able to come from mounted docs metadata
- JavaScript language help might come from a different provider later
- completion might need to combine command names, installed package APIs, and session-local symbols

This is a better long-term design than forcing every profile to re-implement one giant `getHelp()` or `complete()` monolith.

### Layer 4: Profile or language binding

For reuse, we should distinguish between:

- the shell
- the generic REPL protocol
- the profile/language binding

Recommended term:

- `ReplProfile`

Possible future profiles:

- `hypercard-runtime-js`
- `hypercard-runtime-eval`
- `lua-runtime`
- `sql-console`
- `agent-ops`
- `doc-browser-query`

Suggested shape:

```ts
interface ReplProfileDefinition {
  id: string;
  title: string;
  language?: string;
  driverFactory: (ctx: ReplProfileInitContext) => Promise<ReplDriver>;
  completionProviders?: ReplCompletionProvider[];
  helpProviders?: ReplHelpProvider[];
  inspectProviders?: ReplInspectProvider[];
}
```

The HyperCard runtime binding should be one profile, not the definition of the shell itself.

### Layer 5: HyperCard runtime broker

This is the HyperCard-specific seam.

Preferred ownership:

- `@hypercard/hypercard-runtime`

This broker should own:

- spawned runtime sessions for tooling
- attached references to live runtime sessions
- session lookup
- package metadata lookup
- surface metadata lookup
- safe lifecycle management

Suggested interfaces:

```ts
interface HypercardRuntimeHandle {
  runtimeSessionId: string;
  bundleId: string;
  packageIds: string[];
  listSurfaceIds(): Promise<string[]>;
  renderSurface(surfaceId: string, state: unknown): Promise<unknown>;
  eventSurface(surfaceId: string, handler: string, args: unknown, state: unknown): Promise<unknown[]>;
  defineSurface(surfaceId: string, code: string, packId?: string): Promise<void>;
  evalExpression?(code: string): Promise<unknown>;
  dispose(): Promise<void>;
}

interface HypercardRuntimeBroker {
  spawnRuntime(options: HypercardSpawnRequest): Promise<HypercardRuntimeHandle>;
  attachRuntime(runtimeSessionId: string): Promise<HypercardRuntimeHandle | null>;
  listLiveRuntimeSessions(): Promise<HypercardRuntimeSessionSummary[]>;
}
```

Important rule:

- live QuickJS handles stay out of Redux
- broker objects stay in an external registry/store
- serializable summaries may still be projected for UI

## Spawn Mode vs Attach Mode

### Spawn mode

Spawn mode means:

- the REPL creates its own new `RuntimeSession`
- the REPL decides which packages are installed
- the REPL decides what bundle code is loaded
- the REPL can mutate the session freely

This is the correct first implementation target.

Why:

- it is safer
- it is easier to reason about
- it does not depend on live app session ownership refactors
- it already fits the current runtime service model

Example spawn flows:

- spawn empty `ui` session and define surfaces interactively
- spawn `ui + kanban` session and prototype a board
- spawn bundle from selected profile template

### Attach mode

Attach mode means:

- the REPL connects to an already running `RuntimeSession`
- that session is probably already owned by a `RuntimeSurfaceSessionHost`
- the REPL becomes an observer/operator on a live runtime

This is useful, but it is the harder mode.

Why it is harder:

- current session host owns the runtime privately
- attach mode needs a safe registration/unregistration story
- attach mode raises concurrency and safety questions

Examples of questions attach mode needs to answer:

- Is the REPL read-only or read-write by default?
- Can it define new surfaces in a live bundle?
- Can it patch handlers?
- How does it coordinate with the live window that already owns the session?

Recommendation:

- implement spawn mode first
- add attach mode only after a runtime-broker seam exists and session registration is explicit

## On-Demand Help Design

The user explicitly asked for “on demand” help that can be plugged in. The right model is provider-driven help, not a hardcoded `help` command buried inside one driver.

For HyperCard, help should ideally be able to resolve from:

- installed runtime package docs metadata
- mounted docs-browser entries
- bundle-local surface docs
- generated `vmmeta`

Suggested flow:

```text
user types: help widgets.kanban.board
  -> REPL driver parses help request
  -> help provider resolves topic
    -> package docs metadata
    -> docs registry mount
    -> vmmeta fallback
  -> shell displays inline summary or full help pane
```

Suggested help result:

```ts
interface ReplHelpResult {
  topic: string;
  title: string;
  summary?: string;
  content: string;
  related?: string[];
  sourcePath?: string;
}
```

Important design rule:

- the shell should not care whether help came from jsdocex, vmmeta, docs mounts, or a language server later

## Autocomplete Design

Autocomplete should also be layered, not hardcoded.

The current completion model only looks at command names and aliases. A useful runtime-aware REPL needs several different completion domains:

- command names
- profile-level verbs
- installed package API symbols
- surface ids
- handler names
- docs topics
- maybe object/member access later

Suggested provider aggregation model:

```text
completion request
  -> shell/controller sends request
  -> driver chooses providers
  -> providers return completion items
  -> controller merges, ranks, and shows them
```

Suggested completion item:

```ts
interface ReplCompletionItem {
  id: string;
  label: string;
  insertText?: string;
  kind?: 'command' | 'symbol' | 'surface' | 'handler' | 'doc' | 'keyword';
  detail?: string;
  documentation?: string;
}
```

For HyperCard, a first useful set would be:

- commands like `spawn`, `attach`, `list-surfaces`, `render`, `event`, `help`
- installed package APIs like `ui.panel`, `ui.table`, `widgets.kanban.page`, `widgets.kanban.board`
- live surface ids from the current attached/spawned runtime

## Window Launch From REPL

The user also wants REPL-driven render windows.

This should not introduce a second windowing system. The REPL should emit semantic effects, and the host should execute them via normal desktop actions such as `openWindow(...)`.

Suggested effect:

```ts
type ReplEffect =
  | { kind: 'open-window'; payload: OpenWindowPayload }
  | { kind: 'show-help'; help: ReplHelpResult }
  | { kind: 'copy-text'; text: string }
  | { kind: 'focus-runtime-session'; runtimeSessionId: string };
```

For HyperCard specifically:

- a spawn-profile command might return an `open-window` effect for a newly defined surface
- a render-preview command might open a runtime-backed window for a specific surface id

This fits the current host architecture cleanly because launchers already create `OpenWindowPayload` values.

## Reusing the REPL Window For Other Languages or Tool Domains

This is one of the most important APP-22 refresh points.

The REPL window should be reusable for:

- JavaScript/HyperCard runtime work
- future Lua/Python experiments if those arrive
- SQL or schema consoles
- agent/tooling consoles
- docs or search consoles

That means:

- the shell must not say “HyperCard” everywhere
- the transcript model must not assume one kind of output
- the help/completion plumbing must be provider-based
- the profile layer must be explicit

Suggested profile model:

```text
ReplShell
  mounts profile "hypercard-runtime-js"

later
ReplShell
  mounts profile "sql-console"
  or "lua-runtime"
  or "agent-ops"
```

That is a much better long-term design than making `MacRepl` permanently “the HyperCard console widget.”

## Recommended Ownership Split

### `rich-widgets`

Own:

- shell presentation
- transcript rendering
- completion/help panes
- generic controller hooks if they stay UI-facing

Do not own:

- HyperCard runtime logic
- QuickJS handles
- runtime package knowledge
- docs registry knowledge

### `hypercard-runtime`

Own:

- HyperCard runtime broker
- HyperCard profile driver
- attach/spawn registry
- pack-aware helpers
- runtime-specific help/completion/inspection providers

### host app (`wesen-os`)

Own:

- launcher module
- app/window registration
- host effect executor
- startup profile registration

This mirrors the rest of the current architecture well.

## Proposed Implementation Plan

### Slice 1: Split the shell from the toy command engine

Goal:

- keep the UI
- remove direct dependence on `executeReplCommand(...)`

Tasks:

- extract presentational shell pieces from `MacRepl.tsx`
- define a generic driver/controller contract
- convert current toy commands into one `builtin-demo` profile or driver

### Slice 2: Introduce generic completion/help/effect protocols

Goal:

- make the shell protocol-rich enough for real tooling

Tasks:

- define `ReplDriver`
- define `ReplExecution`
- define `ReplEffect`
- define completion/help provider interfaces
- add UI for completion detail and help pane

### Slice 3: Introduce HyperCard runtime broker

Goal:

- provide a real tool seam for runtime spawn/attach

Tasks:

- create external runtime-handle registry in `hypercard-runtime`
- implement spawn flow first
- define live-session summaries
- define attach registration hooks for later

### Slice 4: Build the HyperCard REPL profile

Goal:

- make one concrete profile that proves the architecture

Tasks:

- add `spawn-runtime` command
- add `list-packages`, `list-surfaces`, `render`, `event`, `help` commands
- wire package-aware completion
- wire docs-aware on-demand help

### Slice 5: Add REPL-driven window launch

Goal:

- let the REPL open useful runtime-backed windows

Tasks:

- add `open-window` REPL effect
- add HyperCard commands that produce `OpenWindowPayload`
- verify launch path through normal desktop shell actions

### Slice 6: Add attach mode

Goal:

- allow tool-assisted interaction with live runtime sessions

Tasks:

- register live runtime handles from `RuntimeSurfaceSessionHost`
- add read-only attach first
- later consider write operations and patching semantics

## Risks

### Risk 1: Making the shell HyperCard-specific again

If the shell imports runtime APIs directly, the whole reuse goal collapses.

### Risk 2: Overfitting to JavaScript-only assumptions

If completion/help/result models assume one language or one syntax, the shell becomes harder to reuse later.

### Risk 3: Putting live runtime handles into Redux

Do not do this. Keep handles in an external registry.

### Risk 4: Implementing attach mode before spawn mode

That would couple the first implementation to the hardest safety and ownership problems.

## Validation Guidance

When implementation starts, validate in layers.

### Shell layer

- Storybook for shell-only interaction
- history behavior
- completion popup behavior
- help-pane behavior

### Protocol layer

- driver tests
- provider aggregation tests
- effect routing tests

### HyperCard layer

- spawn-runtime tests
- package-aware completion/help tests
- runtime session disposal tests

### Host integration layer

- launcher module tests
- `openWindow(...)` effect tests
- browser smoke tests

## Review Checklist for a New Intern

When reviewing an APP-22 implementation, ask:

- Is the shell still reusable without HyperCard?
- Are completion/help/introspection providers pluggable?
- Does HyperCard-specific logic live in `hypercard-runtime`, not `rich-widgets`?
- Are live runtime handles kept out of Redux?
- Does spawn mode work before attach mode?
- Are REPL window launches using normal host window actions?

If the answer to any of those is no, the architecture is probably drifting.

## Closing Summary

The right APP-22 target is not a “HyperCard-flavored terminal widget.” It is:

- a reusable REPL shell platform
- a generic protocol for execution, completion, help, inspection, and effects
- one HyperCard runtime bridge on top of that platform

That is the design that matches the cleaned runtime/package architecture and gives us room to add:

- better HyperCard developer tooling now
- other languages and tool domains later

without rebuilding the shell every time.
