---
Title: Fix runtime surface stream injection timing and missing type id render errors
Ticket: APP-32-RUNTIME-SURFACE-STREAM-INJECTION-AND-TYPE-ID
Status: active
Topics:
    - bugfix
    - frontend
    - hypercard
    - runtime
    - wesen-os
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go
      Note: Maps streaming and final hypercard card events into timeline entity status
    - Path: ../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts
      Note: Registers runtime surfaces too early during artifact projection
    - Path: ../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts
      Note: Injects all registered runtime surfaces into live sessions
    - Path: ../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Resolves pack ids and renders injected runtime surfaces
    - Path: ../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx
      Note: Defines default ui.card.v1 but throws on missing pack ids
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-23T14:06:51.91052927-04:00
WhatFor: 'Track and fix two adjacent frontend runtime-surface bugs in inventory chat: early injection of partially streamed card code, and missing runtime surface type ids when opening injected card artifacts.'
WhenToUse: Use when changing hypercard card streaming, runtime surface registration/injection, artifact opening, or runtime-surface render/type resolution in inventory chat.
---


# Fix runtime surface stream injection timing and missing type id render errors

## Overview

This ticket tracks two small but related frontend/runtime bugs in the inventory chat experience, plus the runtime contract cleanup needed to fix them correctly:

- streamed hypercard card code is currently registered and injected into the live runtime session before the stream is finished, which produces QuickJS syntax errors when the card body is still incomplete,
- opening a projected artifact can fail with `Runtime render error: Runtime surface type id is required` because the runtime-surface path still tolerates missing `packId` in some places and then crashes later during render,
- the runtime layer still has an implicit "default surface type" fallback for missing pack ids, which hides bad data instead of forcing the emitter to declare the surface type explicitly.

The current goal is to make the runtime-surface pipeline robust for streamed cards without adding compatibility wrappers or restoring older abstractions. The expected end state is:

- `hypercard.card.update` can continue to project streaming preview state into the chat timeline,
- runtime-surface registration/injection happens only once the card is final enough to execute,
- emitted and injected runtime surfaces carry an explicit `packId` end to end,
- the runtime no longer invents a hidden default surface type for missing pack ids,
- focused tests prove both the timing and type-id paths.

## Key Links

- Primary design note:
  `design-doc/01-runtime-surface-stream-injection-and-type-id-fixes.md`
- Diary:
  `reference/01-investigation-diary.md`

## Status

Current status: **active**

## Topics

- bugfix
- frontend
- hypercard
- runtime
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

## Deliverables

This ticket is expected to produce:

- a focused bug-analysis and implementation guide,
- a diary documenting the investigation and exact evidence,
- phased tasks for implementation and validation,
- code references covering the hypercard timeline projector, runtime surface registry, runtime host, and inventory chat integration points.
