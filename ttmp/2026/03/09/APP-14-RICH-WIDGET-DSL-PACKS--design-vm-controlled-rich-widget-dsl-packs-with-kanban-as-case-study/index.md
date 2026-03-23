---
Title: Design VM-controlled rich widget DSL packs with Kanban as case study
Ticket: APP-14-RICH-WIDGET-DSL-PACKS
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Detailed design ticket for turning rich widgets into VM-controllable runtime packs, using Kanban Board as the concrete case study for splitting domain state, reusable view parts, and DSL-rendered host adapters.
LastUpdated: 2026-03-09T19:32:47.388500799-04:00
WhatFor: Explain how the post-APP-11 HyperCard runtime can grow from simple `ui.*` nodes into richer widget-oriented packs without exposing raw React or browser APIs to the VM.
WhenToUse: Use when designing runtime packs, prompt policy, host renderer seams, or Kanban-style widget decomposition for VM-controlled UI.
---

# Design VM-controlled rich widget DSL packs with Kanban as case study

## Overview

APP-14 is the follow-on design ticket for the question APP-07 and APP-11 deliberately left open: how do we let VM-generated cards control richer widgets without pushing raw React components, browser APIs, or app-specific state topology into the sandbox?

The concrete case study is the current `KanbanBoard` rich widget in `go-go-os-frontend`. It already has good ingredients for a VM-friendly design:

- a serializable reducer and seed shape
- reusable primitives such as `WidgetToolbar`, `Separator`, and `WidgetStatusBar`
- a connected-vs-standalone seam
- a launcher module that already treats the board as a first-class app window

What it does not yet have is the right split for VM control. Today the React component still owns too much composition logic directly. This ticket documents how to refactor Kanban into domain state, reusable presentational parts, and a runtime-pack renderer/API that QuickJS can drive declaratively.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

Current scope:

- document the architecture needed to control rich widgets from VM sandboxes
- use Kanban Board as the primary case study
- include the concrete Kanban refactor plan, not just abstract runtime-pack discussion
- keep the design aligned with APP-07 runtime-pack research and APP-11's simplified `{ state, dispatch(action) }` boundary

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
