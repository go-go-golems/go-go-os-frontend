---
Title: Investigation diary
Ticket: APP-19-RUNTIME-CARD-EDITOR-INJECTION-MISMATCH
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.ts
      Note: Investigated as the central runtime registry and injection loop
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/CodeEditorWindow.tsx
      Note: Investigated as the current save-and-inject path
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/editorLaunch.ts
      Note: Investigated as the current code-stash path that loses provenance
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
      Note: Investigated as the bundle-load and live-injection orchestrator
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: Investigated as the VM service that distinguishes defineCard from full bundle eval
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Investigated as the in-VM helper surface for defineCard and pack helpers
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/stack.ts
      Note: Investigated as the built-in stack metadata path that now stores Kanban source
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vmmeta.ts
      Note: Investigated as the generated source metadata projection
ExternalSources: []
Summary: Investigation diary for APP-19 documenting the runtime card editor injection mismatch and the current runtime registry, editor, and built-in VM source paths.
LastUpdated: 2026-03-10T23:58:00-04:00
WhatFor: Record the exact analysis steps, file evidence, and conclusions behind APP-19 so the eventual fix can be implemented without redoing the architecture audit.
WhenToUse: Use when continuing APP-19, when reviewing the runtime-card load model, or when validating the cause of the `SyntaxError: expecting ')'` editor save failure.
---

# Investigation diary

## Goal

Record the investigation behind the runtime card editor injection mismatch, especially the different ways card code enters QuickJS sessions and why built-in VM source cannot safely reuse the existing runtime card registry save path.

## Step 1: Map The Runtime Card Loading Paths And Isolate The Editor Contract Mismatch

The user paused the implementation work and asked for a dedicated bug-analysis ticket instead. That was the right move, because the editor failure is not a small syntax bug. It is a design mismatch between two different loading models that happen to meet at the same editor UI.

I traced the entire path end to end: how artifact cards enter the registry, how `PluginCardSessionHost` injects them, how built-in `os-launcher` cards enter through raw bundle evaluation, how the debugger now exposes generated built-in source, and where the save path collapses those two worlds back into one. That gave us a clean explanation for the `SyntaxError: expecting ')'` failure and a concrete implementation direction.

### Prompt Context

**User prompt (verbatim):**

> hold on, write a bug-report analysis file for this one and save it in a new ticket. Explain all the paths to load runtime cards and in general how the registry works as well.
>
> Create a detailed analysis / bug report that is very detailed for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file
>   references.
>   It should be very clear and detailed. Store in the ticket and the nupload to remarkable.

**Assistant interpretation:** Stop the implementation thread, create a new docmgr ticket, and write a detailed bug-analysis report that explains runtime card loading, registry behavior, and the built-in VM source mismatch clearly enough for a new intern to implement the later fix.

**Inferred user intent:** Separate the bug analysis from the implementation thread so the eventual fix is driven by a clean model of the system rather than by debugging piecemeal inside the code editor flow.

**Commit (code):** N/A

### What I did

- Created APP-19 as a dedicated bug-analysis ticket.
- Inspected the runtime card registry, editor launch/save path, session host injection loop, QuickJS runtime service, and stack bootstrap helpers.
- Inspected the `os-launcher` built-in VM source path from raw bundle assembly through generated metadata and stack card metadata.
- Traced the debugger path that opens built-in source from `Stacks & Cards`.
- Wrote the intern-facing bug report, task list, and changelog.

### Why

- The bug sits at a boundary between runtime snippet injection and built-in VM module evaluation.
- Without a written model of both paths, it would be too easy to “fix” the symptom with string heuristics or another editor-specific branch.

### What worked

- The file audit exposed a clean distinction between the snippet-based registry path and the full-source bundle path.
- The exact failing wrapper is now explicit: `defineCard(cardId, (code), packId)` is the wrong API for full built-in module source.
- The ticket now captures the whole architecture instead of just the user-visible syntax error.

### What didn't work

- The current implementation still has no provenance-aware save path. That is the bug itself, not a separate investigation failure.
- The error reproduced by the user is consistent with the current code:

```text
[runtimeCardRegistry] Failed to inject card kanbanPersonalPlanner into os-launcher-kanban:...: Error: SyntaxError: expecting ')'
```

### What I learned

- The runtime card registry is narrower than its name suggests. It is not a general “all card source” store. It is specifically a pending injection registry for code that matches `defineCard(...)`.
- The new built-in Kanban source view is working correctly as an inspector, but saving from that view crosses a contract boundary the current editor code does not represent.

### What was tricky to build

- The tricky part was separating “where the source came from” from “how it should be reinjected.” The debugger now surfaces both registry snippets and built-in module source in one window, so the visual similarity can hide the fact that the runtime expects different APIs for the two code kinds.
- I handled that by mapping the runtime through four concrete load paths and making the bug report compare them explicitly rather than describing the system generically.

### What warrants a second pair of eyes

- The eventual fix should be reviewed for whether built-in full-source edits should persist only for current sessions or also seed future sessions for the same stack.
- The editor-launch contract deserves review because it currently uses only `{ ownerAppId, cardId }` plus a stashed string, which is too weak for multi-mode documents.

### What should be done in the future

- Implement explicit editor document provenance and injection mode.
- Add a runtime service method for full-source evaluation inside existing sessions.
- Add tests covering snippet edits and built-in module edits separately.

### Code review instructions

- Start with [runtimeCardRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.ts) and [runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts).
- Then read [CodeEditorWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/CodeEditorWindow.tsx) and [editorLaunch.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/editorLaunch.ts).
- Then read [stack.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/stack.ts), [vmmeta.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vmmeta.ts), and [pluginBundle.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/pluginBundle.ts).

### Technical details

- Core mismatch:

```text
built-in source file with statements
  ->
CodeEditorWindow.save()
  ->
registerRuntimeCard(cardId, code)
  ->
PluginCardSessionHost.injectPendingCardsWithReport(...)
  ->
QuickJSCardRuntimeService.defineCard(sessionId, cardId, code, packId)
  ->
eval "__stackHost.defineCard(cardId, (code), packId)"
  ->
SyntaxError: expecting ')'
```

- Correct future distinction:

```text
factory snippet -> defineCard(...)
module source   -> evalCodeOrThrow(fullSource)
```

## Related

- `../index.md`
- `../tasks.md`
- `../changelog.md`
- `../design-doc/01-intern-guide-to-the-runtime-card-editor-injection-mismatch-registry-paths-and-built-in-vm-source-flow.md`
