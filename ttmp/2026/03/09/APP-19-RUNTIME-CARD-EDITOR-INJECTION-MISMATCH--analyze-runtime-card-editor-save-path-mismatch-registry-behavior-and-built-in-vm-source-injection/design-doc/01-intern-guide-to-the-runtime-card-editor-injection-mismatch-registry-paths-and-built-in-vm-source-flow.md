---
Title: Intern guide to the runtime card editor injection mismatch, registry paths, and built-in VM source flow
Ticket: APP-19-RUNTIME-CARD-EDITOR-INJECTION-MISMATCH
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
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.ts
      Note: Runtime registry data model and injection loop
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/CodeEditorWindow.tsx
      Note: Editor save path that currently collapses all edit types into registerRuntimeCard
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/editorLaunch.ts
      Note: Editor-open stash that currently preserves only code strings
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
      Note: Session host that injects pending runtime cards when bundles load and when registry updates
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: QuickJS runtime service with defineCard and bundle-eval APIs
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: In-VM card-definition and pack helper contract
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx
      Note: Shared debugger window that now exposes built-in stack card source
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/pluginBundle.ts
      Note: Built-in os-launcher raw bundle assembly
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vmmeta.ts
      Note: Generated VM metadata projection that carries built-in source into stack card metadata
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/stack.ts
      Note: Stack card metadata surface that stores built-in source for debugger editing
ExternalSources: []
Summary: Detailed bug report and architecture guide for the mismatch between the editor save path, the runtime card registry contract, and built-in VM source module editing.
LastUpdated: 2026-03-10T23:58:00-04:00
WhatFor: Use this guide to understand the current runtime-card loading model, why the built-in Kanban source editor fails on save, and how to implement a clean fix without conflating two different code-loading paths.
WhenToUse: Use when implementing the editor bug fix, when reviewing runtime-card loading behavior, or when onboarding an intern to the HyperCard runtime/editor boundary.
---

# Intern guide to the runtime card editor injection mismatch, registry paths, and built-in VM source flow

## Executive Summary

The current HyperCard runtime has two different ways to get card code into a running QuickJS session:

1. runtime-registered card snippets, usually coming from artifact projection or ad-hoc editor/runtime card injection
2. built-in stack-authored VM source, loaded as part of the stack bundle itself

Those two paths look similar in the debugger, but they are not the same contract.

The runtime card registry stores code intended for `QuickJSCardRuntimeService.defineCard(...)`, which expects a card definition or factory expression. Built-in `os-launcher` Kanban card source, by contrast, is a full module fragment with metadata calls and a top-level `defineCard(...)` statement. When the editor opens that full source from `Stacks & Cards`, saves it, and routes it through `registerRuntimeCard(...)`, the runtime later wraps that whole file as though it were a single expression. QuickJS then throws `SyntaxError: expecting ')'`.

This ticket explains every load path clearly, defines the actual boundary of the runtime card registry, and recommends a fix based on explicit document provenance and injection mode rather than heuristics.

## Problem Statement

The immediate bug is:

- open built-in `kanban.v1` source from `Stacks & Cards`
- modify it in `CodeEditorWindow`
- click `Save & Inject`
- the runtime logs:
  - `[runtimeCardRegistry] Failed to inject card kanbanPersonalPlanner ... Error: SyntaxError: expecting ')'`

The problem is not a bad Kanban card. The problem is a contract mismatch between:

- what the editor is showing
- what `registerRuntimeCard(...)` means
- what `QuickJSCardRuntimeService.defineCard(...)` accepts

Today the system has one save path but at least two distinct code kinds:

- `factory`-style runtime card code
- `module`-style built-in VM source

The editor does not currently preserve which kind of document it opened, so it always falls back to the runtime registry path.

Scope of this bug report:

- explain all paths that load card code into sessions
- explain the runtime registry lifecycle
- explain why built-in source is different
- outline the clean implementation direction

Out of scope for this ticket:

- implementing the fix
- redesigning the entire editor UI
- adding source metadata for every other built-in stack immediately

## Proposed Solution

The fix should introduce explicit document provenance and injection mode.

At minimum, the editor/runtime contract should distinguish:

- `factory`
  - code is a card definition or factory expression
  - save path may use `registerRuntimeCard(cardId, code, packId)`
  - runtime injection should call `service.defineCard(sessionId, cardId, code, packId)`
- `module`
  - code is a full VM source file or source fragment containing statements such as `__card__`, `__doc__`, `doc`, and `defineCard(...)`
  - save path must not route through `defineCard(..., (code), ...)`
  - runtime injection should re-evaluate the full source inside the already-loaded session VM

Suggested shape:

```ts
type EditorDocumentMode = 'factory' | 'module';

interface EditorDocument {
  cardId: string;
  code: string;
  mode: EditorDocumentMode;
  packId?: string;
  sourceFile?: string;
  ownerAppId: string;
}
```

Then the save path becomes:

```ts
if (doc.mode === 'factory') {
  registerRuntimeCard(doc.cardId, doc.code, doc.packId, 'factory');
} else {
  registerRuntimeCard(doc.cardId, doc.code, undefined, 'module');
}
```

And the session host/runtime service becomes:

```ts
for (const def of registry.values()) {
  if (def.mode === 'factory') {
    service.defineCard(sessionId, def.cardId, def.code, def.packId);
  } else {
    service.evalModuleSource(sessionId, def.cardId, def.code);
  }
}
```

That is the clean boundary because it matches the actual semantics already present in the system.

## Current-State Architecture

### Runtime load path A: artifact/runtime-injected card snippets

Artifact projection listens to timeline entities and, when it finds `runtimeCardId` plus `runtimeCardCode`, it both stores the artifact and registers the runtime card in the global registry ([artifactProjectionMiddleware.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts):12-26).

That path is explicitly snippet-oriented:

- timeline entity
- artifact projection
- `registerRuntimeCard(cardId, code, packId)`
- `PluginCardSessionHost` injects pending cards into ready sessions
- `QuickJSCardRuntimeService.defineCard(...)` wraps and installs the definition

Pseudocode:

```text
timeline entity
  ->
extractArtifactUpsertFromTimelineEntity(...)
  ->
registerRuntimeCard(runtimeCardId, runtimeCardCode, packId)
  ->
injectPendingCardsWithReport(...)
  ->
service.defineCard(sessionId, cardId, code, packId)
```

### Runtime load path B: editor edits of runtime registry cards

The existing editor was originally built for the same snippet contract. `CodeEditorWindow` simply calls `registerRuntimeCard(cardId, code)` on save ([CodeEditorWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/CodeEditorWindow.tsx):87-100).

This works when the editor document started as:

- an artifact-injected runtime card
- a runtime card already stored in the registry
- a card whose code is actually valid inside `defineCard(..., (code), packId)`

### Runtime load path C: built-in stack-authored VM source

`os-launcher` assembles its stack bundle from raw `*.vm.js` files in [pluginBundle.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/pluginBundle.ts):1-15. Those files are concatenated into one raw bundle string and then loaded through `loadStackBundle(...)`, which evaluates the entire bundle inside a fresh QuickJS VM ([runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts):215-231).

Inside the VM, the bundle relies on the stack bootstrap’s global helpers:

- `defineStackBundle`
- `defineCard`
- `defineCardRender`
- `defineCardHandler`
- pack helpers such as `widgets.kanban.board`

See [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js):96-208.

This is materially different from runtime registry injection because the bundle contains statements, not just a card factory expression.

### Runtime load path D: built-in source surfaced in `Stacks & Cards`

APP-18 and APP-17 now surface generated Kanban source into stack card metadata:

- `kanbanVmmeta.generated.ts` contains full source strings ([kanbanVmmeta.generated.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts):3-66)
- `vmmeta.ts` projects that metadata into `KANBAN_VM_CARD_META` ([vmmeta.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vmmeta.ts):1-13)
- `stack.ts` stores that source under `card.meta.runtime.source` ([stack.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/stack.ts):28-48)
- `RuntimeCardDebugWindow` opens those built-in stack card sources through `openCodeEditor(...)` ([RuntimeCardDebugWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx):148-168)

This is the path that exposed the bug.

## How The Registry Actually Works

### Registry responsibilities

The runtime card registry is a process-local in-memory `Map<string, RuntimeCardDefinition>` plus a subscriber list ([runtimeCardRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.ts):28-68).

It is responsible for:

- storing pending runtime card definitions
- notifying listeners when the registry changes
- letting session hosts inject those pending definitions into live sessions

It is not responsible for:

- representing built-in stack cards
- remembering editor document provenance
- storing full VM module semantics
- persisting anything across reloads

### Registry injection assumptions

The critical design assumption is in [runtimeCardRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.ts):81-99:

```ts
service.defineCard(sessionId, def.cardId, def.code, def.packId);
```

That means every registry entry is assumed to be compatible with `defineCard(...)`.

### Session host behavior

`PluginCardSessionHost` injects pending cards twice:

- right after a bundle finishes loading ([PluginCardSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx):184-201)
- again whenever the registry changes for an already-ready session ([PluginCardSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx):256-282)

That is why saving from the editor immediately tries to inject into currently running sessions.

## Root Cause Analysis

The bug comes from three facts being true at once:

1. The debugger now opens built-in stack card source from `card.meta.runtime.source`.
2. `editorLaunch.ts` preserves only a raw code string, not where that code came from or how it should be reinjected ([editorLaunch.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/editorLaunch.ts):16-54).
3. `CodeEditorWindow` always saves by calling `registerRuntimeCard(cardId, code)` ([CodeEditorWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/CodeEditorWindow.tsx):87-100).

Then `QuickJSCardRuntimeService.defineCard(...)` constructs:

```ts
globalThis.__stackHost.defineCard(cardId, (code), packId)
```

([runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts):234-243)

That wrapper is valid only if `code` is expression-shaped. It is not valid when `code` starts with top-level statements like:

- `__card__(...)`
- `__doc__(...)`
- `doc\`...\``
- `const personalPlannerBoard = ...`
- `defineCard(...)`

So the bug is not “bad syntax in the stored Kanban source.” The bug is “wrong injection mode for that source kind.”

## Design Decisions

### Decision 1: do not use regex or string heuristics as the long-term fix

It would be tempting to detect `defineCard(` or `__card__(` in the editor buffer and switch behavior heuristically. That is fragile. The editor already knows the provenance at the moment it opens the document, so the clean fix is to preserve that metadata.

### Decision 2: keep the runtime registry, but narrow its meaning

The registry is still useful for:

- artifact-projected runtime cards
- ad-hoc snippet injection
- override-style card experimentation

But its entry type needs to state what kind of source it holds.

### Decision 3: add a full-source eval path to the runtime service

The runtime service already supports:

- full stack-bundle eval via `loadStackBundle(...)`
- card-definition injection via `defineCard(...)`
- render replacement via `defineCardRender(...)`
- handler replacement via `defineCardHandler(...)`

What is missing is the ability to re-evaluate a full source fragment inside an existing session without pretending it is a card factory expression.

### Decision 4: preserve pack id and mode through the editor path

The editor currently loses information even for runtime registry cards because `openCodeEditor(...)` stashes only code, and `CodeEditorWindow` saves only `cardId` plus code. That makes future mode-specific behavior harder and also risks dropping pack-specific context.

## Alternatives Considered

### Alternative A: strip the built-in file down to a factory before saving

Rejected because:

- it throws away authored structure and metadata
- it only works for one source style
- it would make the editor lie about what document the user is editing

### Alternative B: keep built-in source read-only

Rejected because:

- the whole point of surfacing the source is to let the user iterate on it
- read-only would dodge the bug rather than fix the model

### Alternative C: bypass the registry entirely for editor saves

Partially viable, but incomplete. The editor still needs some concept of:

- document provenance
- current session versus future session behavior
- pack id and source mode

Even if the built-in path bypasses the registry, the editor contract still needs to represent that difference explicitly.

## Implementation Plan

### Phase 1: model editor document provenance

Target files:

- `editorLaunch.ts`
- `CodeEditorWindow.tsx`
- `runtimeCardRef.ts` if the instance model needs to expand
- `apps/hypercard-tools/src/launcher/module.tsx`

Work:

- stash an `EditorDocument` object instead of just a string
- include `mode`, `packId`, and optional `sourceFile`
- update `getEditorInitialCode(...)` to return the richer object or split into `getEditorInitialDocument(...)`

### Phase 2: extend registry/runtime injection contracts

Target files:

- `runtimeCardRegistry.ts`
- `runtimeService.ts`
- related tests

Work:

- add `mode: 'factory' | 'module'` to registry entries
- preserve `packId` for `factory` entries
- add a runtime service method that evaluates full source directly inside an existing VM

Pseudocode:

```ts
evalCardSource(sessionId, cardId, source) {
  const vm = this.getVmOrThrow(sessionId);
  evalCodeOrThrow(vm, source, `${sessionId}.${cardId}.module.js`, timeout);
  return this.readBundleMeta(vm);
}
```

### Phase 3: route save behavior by document mode

Target files:

- `CodeEditorWindow.tsx`
- `RuntimeCardDebugWindow.tsx`
- artifact/debug call sites

Work:

- runtime registry cards open as `mode: 'factory'`
- built-in stack source opens as `mode: 'module'`
- save path chooses the correct reinjection path

### Phase 4: test both worlds explicitly

Add tests for:

- artifact/runtime snippet edit-save-inject
- built-in Kanban module edit-save-inject
- editor reopen fallback preserving the correct mode

## Open Questions

- Should built-in full-source edits be stored in the same global registry as snippets, or in a parallel “module override” registry?
- Should saving built-in source affect only current sessions, or also future sessions for the same stack?
- Should the debugger eventually show document mode visibly in the editor header?

## References

- [runtimeCardRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.ts)
- [CodeEditorWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/CodeEditorWindow.tsx)
- [editorLaunch.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/editorLaunch.ts)
- [PluginCardSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx)
- [runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts)
- [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js)
- [RuntimeCardDebugWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx)
- [stack.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/stack.ts)
- [vmmeta.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vmmeta.ts)
- [pluginBundle.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/pluginBundle.ts)

## Design Decisions

<!-- Document key design decisions and rationale -->

## Alternatives Considered

<!-- List alternative approaches that were considered and why they were rejected -->

## Implementation Plan

<!-- Outline the steps to implement this design -->

## Open Questions

<!-- List any unresolved questions or concerns -->

## References

<!-- Link to related documents, RFCs, or external resources -->
