---
Title: Add runtime pack discriminator and kanban.v1 runtime pack
Ticket: APP-15-HYPERCARD-KANBAN-PACK-IMPLEMENTATION
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
    - Path: ttmp/2026/03/09/APP-14-RICH-WIDGET-DSL-PACKS--design-vm-controlled-rich-widget-dsl-packs-with-kanban-as-case-study/design-doc/01-intern-guide-to-vm-controlled-rich-widget-dsl-packs-and-kanban-widget-migration.md
      Note: Design prerequisite defining runtime.pack and kanban.v1 direction
ExternalSources: []
Summary: Implement the APP-14 design by adding explicit `runtime.pack` discrimination to runtime card artifacts, wiring a runtime-pack registry in the frontend, and landing the first concrete `kanban.v1` pack with supporting rich-widget refactors and Storybook coverage.
LastUpdated: 2026-03-10T10:35:00-04:00
WhatFor: Use this ticket to carry the design into code across artifact projection, runtime host/renderer selection, prompt policy, Kanban widget extraction, Storybook coverage, and test validation without introducing compatibility wrappers.
WhenToUse: Use when implementing or reviewing the explicit runtime-pack cutover, the `kanban.v1` pack contract, or the first Kanban-rich-widget pack integration in `go-go-os-frontend` and related repos.
---



# Add runtime pack discriminator and kanban.v1 runtime pack

## Overview

APP-15 is the implementation follow-through for APP-14. The goal is to keep the existing `hypercard.card.v2` envelope, add `runtime.pack` as an explicit discriminator, and wire the frontend so artifacts, runtime sessions, bootstrap helpers, validation, and rendering can select the first real pack: `kanban.v1`.

This is a direct cutover ticket. Do not add wrapper APIs or legacy fallback pack behavior. Update prompt policy, artifact projection, runtime registries, renderer seams, widget code, Storybook stories, and tests so the explicit pack contract is the only supported path for the new Kanban runtime flow.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field
- **Design Prerequisite**: APP-14 rich widget DSL pack design doc
- **Implementation Playbook**: `playbooks/01-runtime-pack-implementation-playbook.md`

## Status

Current status: **active**

Current implementation slices:

- runtime artifact metadata and projection
- runtime-pack registry and host selection
- Kanban widget extraction for pack rendering
- Storybook coverage for extracted widget pieces
- prompt/test cutover

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
