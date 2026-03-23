---
Title: Design RuntimeSession, RuntimeBundle, RuntimePackage, RuntimeSurface, and RuntimeSurfaceType split from legacy card terminology
Ticket: APP-23-HYPERCARD-RUNTIME-LANGUAGE-BOUNDARY
Status: completed
Topics:
    - architecture
    - frontend
    - hypercard
    - tooling
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/cards/types.ts
      Note: Engine type definitions reviewed and migrated from stack/card to bundle/surface terminology
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts
      Note: Runtime transport contract now centered on RuntimeBundle and RuntimeSurface nouns
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: VM bootstrap API now exposes defineRuntimeBundle and defineRuntimeSurface globals
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Runtime host component reviewed and renamed around RuntimeSurface execution
    - Path: /home/manuel/code/wesen/corporate-headquarters/vm-system/README.md
      Note: Precedent system showing cleaner runtime/session terminology separated from UI metaphors
ExternalSources: []
Summary: Design ticket for separating the current overloaded card terminology into a clearer model centered on RuntimeSession, RuntimeBundle, RuntimePackage, RuntimeSurface, and RuntimeSurfaceType.
LastUpdated: 2026-03-11T12:35:00-04:00
WhatFor: Use this ticket to understand the completed rename from the legacy card-centric runtime APIs to the current package/bundle/surface model, and to see the remaining intentional protocol carve-outs.
WhenToUse: Use when reviewing why the runtime now uses RuntimeSession, RuntimeBundle, RuntimePackage, RuntimeSurface, and RuntimeSurfaceType, or when planning follow-up work such as external package extraction.
---

# Design RuntimeSession, RuntimeBundle, RuntimePackage, RuntimeSurface, and RuntimeSurfaceType split from legacy card terminology

## Overview

The current HyperCard runtime stack uses `card` as the main noun from desktop shell all the way down to runtime transport and VM authoring. That no longer matches what the system is turning into. The more accurate model has five separate concepts:

- `RuntimeSession`
- `RuntimeBundle`
- `RuntimePackage`
- `RuntimeSurface`
- `RuntimeSurfaceType`

APP-23 now treats `ui` and `kanban` as installable packages, treats `ui.card.v1` and `kanban.v1` as surface types rather than whole packages, treats authored “cards” as runtime surfaces, and treats the live QuickJS instance as a runtime session. The guide also explicitly defers multi-language naming concerns; the immediate goal is getting the package/bundle/surface split right.

The guide in this ticket explains how the current code already maps onto this model, why the current API is too card-entangled, and how to carry out a direct-cutover rename across runtime transport, bootstrap authoring, package registries, host components, prompt docs, and desktop/windowing types.

Implementation stance for APP-23 is now explicit: this transition is an in-place cutover only. The implementation branch should delete old runtime-core names as each slice lands and must not add compatibility aliases, dual exports, or wrapper layers just to ease the rename.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **completed**

Completed scope:

- mapped where `card` was overloaded
- renamed runtime-core transport, bootstrap, host, desktop, docs, and tooling to package/bundle/surface nouns
- introduced explicit runtime package and runtime surface-type concepts in the live architecture
- documented the remaining intentional artifact/protocol carve-outs where `card` still remains correct

## Topics

- architecture
- frontend
- hypercard
- tooling

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Main Guide

- [Intern guide to RuntimeSession, RuntimeBundle, RuntimePackage, RuntimeSurface, and RuntimeSurfaceType boundaries](./design/01-intern-guide-to-runtime-session-bundle-package-surface-and-surface-type-boundaries.md)

## Diary

- [Investigation diary](./reference/01-investigation-diary.md)

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
