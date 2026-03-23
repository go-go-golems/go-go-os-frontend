---
Title: SystemModeler Widget DSL Port Analysis
Ticket: SYSTEM-MODELER-PORT
Status: active
Topics:
    - frontend
    - runtime
    - widget-dsl
    - hypercard
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: docs/widget-dsl-porting-playbook.md
      Note: Reference porting playbook
    - Path: workspace-links/go-go-os-frontend/packages/rich-widgets/src/system-modeler/SystemModeler.tsx
      Note: Main widget to decompose
    - Path: workspace-links/go-go-os-frontend/packages/rich-widgets/src/system-modeler/SystemModelerDialogs.tsx
      Note: Parameter dialogs (need schema refactor)
    - Path: workspace-links/go-go-os-frontend/packages/rich-widgets/src/system-modeler/SystemModelerSvg.tsx
      Note: SVG canvas components (already extracted)
    - Path: workspace-links/go-go-os-frontend/packages/rich-widgets/src/system-modeler/systemModelerState.ts
      Note: Redux state slice
    - Path: workspace-links/go-go-os-frontend/packages/rich-widgets/src/system-modeler/types.ts
      Note: Block types and wire types
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-10T10:07:16.556653755-04:00
WhatFor: ""
WhenToUse: ""
---


# SystemModeler Widget DSL Port Analysis

## Overview

<!-- Provide a brief overview of the ticket, its goals, and current status -->

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- frontend
- runtime
- widget-dsl
- hypercard

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
