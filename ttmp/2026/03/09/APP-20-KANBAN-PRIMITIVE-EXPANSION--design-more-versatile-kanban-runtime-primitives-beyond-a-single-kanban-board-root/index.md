---
Title: Design more versatile kanban runtime primitives beyond a single kanban.board root
Ticket: APP-20-KANBAN-PRIMITIVE-EXPANSION
Status: completed
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx
      Note: Current runtime-pack contract only accepts a single kanban.board root
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoardView.tsx
      Note: Current host board view hardcodes toolbar/header/footer composition
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/types.ts
      Note: Current hardcoded taxonomy constraints for tags and priorities
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/docs/kanban-pack.docs.vm.js
      Note: Current VM-facing docs explicitly teach only widgets.kanban.board(...)
ExternalSources: []
Summary: Implemented ticket for evolving the Kanban runtime-pack surface into a more versatile primitive family with extracted host widgets, descriptor-driven issue taxonomy, and a structured shell DSL.
LastUpdated: 2026-03-10T01:17:00-04:00
WhatFor: Use this ticket to understand the direct-cutover implementation that replaced the old monolithic Kanban VM contract with a compositional page DSL and richer host widget surface.
WhenToUse: Use when reviewing the implemented Kanban refactor, extending the page-style DSL, or understanding how richer Kanban runtime cards are now authored.
---

# Design more versatile kanban runtime primitives beyond a single kanban.board root

## Overview

The original `kanban.v1` runtime pack was too monolithic. VM cards could only emit `widgets.kanban.board({...})`, and the host renderer treated the board shell, toolbar/header controls, footer/status bar, and issue taxonomy as a single welded surface. APP-20 replaced that with a compositional page DSL so cards can assemble smaller Kanban primitives while the host still owns rendering and behavior.

APP-20 is the design ticket for making the Kanban runtime primitives more versatile. The intended direction is:

- split the header/toolbar/status pieces into reusable host primitives
- make issue taxonomies such as bug types or labels configurable rather than hardcoded enums
- expose a richer Kanban primitive family than just `kanban.board`
- require Storybook coverage for every extracted widget or host submodule so the new primitive surface is reviewable outside the VM path

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **completed**

Current scope:

- extract reusable Kanban host widgets for header, filters, lanes, and status
- replace fixed Kanban enums with descriptor-driven taxonomy
- replace the monolithic runtime contract with a structured `kanban.v1` page DSL
- rewrite the `os-launcher` demo cards, docs, and generated VM metadata to the new authoring style

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
