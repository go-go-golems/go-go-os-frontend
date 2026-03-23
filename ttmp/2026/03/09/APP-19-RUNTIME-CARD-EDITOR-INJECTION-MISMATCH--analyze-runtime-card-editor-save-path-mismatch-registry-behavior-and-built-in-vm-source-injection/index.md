---
Title: Analyze runtime card editor save-path mismatch, registry behavior, and built-in VM source injection
Ticket: APP-19-RUNTIME-CARD-EDITOR-INJECTION-MISMATCH
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.ts
      Note: Runtime registry implementation and current injection assumptions
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/CodeEditorWindow.tsx
      Note: Current save-and-inject path that always re-registers edited code as a runtime card
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/editorLaunch.ts
      Note: Editor launch stash that currently preserves only a raw code string
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
      Note: Session host that injects pending runtime cards into loaded plugin sessions
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: QuickJS runtime API that currently distinguishes defineCard from full bundle eval
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: VM bootstrap helpers and defineCard contract inside the QuickJS runtime
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/stack.ts
      Note: Built-in os-launcher stack cards now carry generated source metadata
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vmmeta.ts
      Note: Generated Kanban VM metadata projection used by the debugger
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/pluginBundle.ts
      Note: Raw bundle assembly path for built-in stack-authored VM cards
ExternalSources: []
Summary: Detailed bug-analysis ticket for the mismatch between the runtime card editor save path and the two different code-loading models in HyperCard: runtime-registered card snippets versus built-in VM source modules.
LastUpdated: 2026-03-10T23:58:00-04:00
WhatFor: Use this ticket to understand why editing built-in VM card source currently fails with `SyntaxError: expecting ')'`, how runtime cards are loaded today, and what implementation shape should fix the mismatch cleanly.
WhenToUse: Use when implementing the runtime-card editor bug fix, onboarding an intern to the runtime registry and editor flow, or reviewing how built-in VM card source differs from injected runtime card snippets.
---

# Analyze runtime card editor save-path mismatch, registry behavior, and built-in VM source injection

## Overview

This ticket captures a concrete regression discovered after `Stacks & Cards` started exposing editable source for built-in `kanban.v1` cards from `os-launcher`. The editor window can now open full authored VM source for cards such as `kanbanPersonalPlanner`, but its save path still assumes every edited document is a runtime-card snippet suitable for `registerRuntimeCard(...)` and later `service.defineCard(...)`. That assumption is only valid for artifact/runtime-injected cards, not for full VM source files that already contain `defineCard(...)`, `__card__`, and `__doc__` statements.

The result is a reproducible injection failure:

- user opens built-in card source from `Stacks & Cards`
- editor saves that full source via `registerRuntimeCard(cardId, code)`
- `PluginCardSessionHost` injects it through `runtimeCardRegistry`
- `QuickJSCardRuntimeService.defineCard(...)` wraps the whole source in `globalThis.__stackHost.defineCard(cardId, (code), packId)`
- QuickJS throws `SyntaxError: expecting ')'`

The goal of APP-19 is not to fix the bug yet. It is to document the full loading model clearly enough that the implementation can be done without more confusion or more one-off editor hacks.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

Current scope:

- map every path that loads card code into a runtime session
- explain what the runtime card registry does and does not represent
- explain why built-in stack card source is fundamentally different from runtime registry snippets
- define the clean bug-fix direction for the editor/save path

## Topics

- architecture
- frontend
- hypercard
- wesen-os

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
