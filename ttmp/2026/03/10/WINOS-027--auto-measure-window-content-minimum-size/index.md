---
Title: Auto-Measure Window Content Minimum Size
Ticket: WINOS-027
Status: active
Topics:
    - frontend
    - wesen-os
    - architecture
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: workspace-links/go-go-os-frontend/packages/engine/src/__tests__/windowing.test.ts
      Note: Add tests for updateWindowMinSize
    - Path: workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/WindowLayer.tsx
      Note: Thread onContentMinSize callback through
    - Path: workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/WindowSurface.tsx
      Note: Add onContentMinSize prop
    - Path: workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Wire getMinSizeForWindow and handleContentMinSize
    - Path: workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/useWindowInteractionController.ts
      Note: Add getMinSizeForWindow per-window constraint lookup
    - Path: workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/types.ts
      Note: WindowInstance already has minW/minH fields
    - Path: workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts
      Note: Add updateWindowMinSize reducer action
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-10T09:06:16.825715316-04:00
WhatFor: ""
WhenToUse: ""
---


# Auto-Measure Window Content Minimum Size

## Overview

<!-- Provide a brief overview of the ticket, its goals, and current status -->

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- frontend
- wesen-os
- architecture

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
