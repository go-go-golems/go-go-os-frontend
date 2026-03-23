---
Title: Research registering loaded card documentation in the doc browser and module browser
Ticket: APP-21-HYPERCARD-CARD-DOC-BROWSER-INTEGRATION
Status: completed
Topics:
    - architecture
    - frontend
    - hypercard
    - documentation
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/ModuleBrowserWindow.tsx
      Note: Module Browser launcher surface and docs-entry callbacks
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocBrowserWindow.tsx
      Note: Shared doc browser router and current screen contract
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/api/appsApi.ts
      Note: Existing network-backed docs API layer consumed by the doc browser
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts
      Note: Existing frontend-only card-doc and pack-doc metadata for built-in VM cards
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/cmd/wesen-os-launcher/docs_endpoint.go
      Note: Aggregate backend docs endpoint used by the current doc browser
Summary: Research ticket for integrating loaded HyperCard/runtime-card documentation into the existing doc browser and Module Browser, with a unified object-path model rooted at /docs/objects/x/y/z.
LastUpdated: 2026-03-10T09:14:00-04:00
WhatFor: Use this ticket to understand how the current module-docs system and frontend-generated card-doc metadata differ, and how to unify them under a docs-object registry and route model.
WhenToUse: Use when planning card-doc discoverability in the doc browser, when extending Module Browser to surface runtime-card docs, or when designing a unified /docs object namespace.
---

# Research registering loaded card documentation in the doc browser and module browser

## Overview

The current documentation system in `wesen-os` is split across two different worlds:

- backend module docs, exposed through `/api/apps/{appId}/docs`, `/api/apps/{appId}/docs/{slug}`, and `/api/os/docs`
- frontend-generated runtime-card and runtime-pack docs, currently emitted into `vmmeta.generated.ts` and never registered with the doc browser

That split is why built-in Kanban cards can now carry useful docs metadata, but the docs browser and Module Browser still cannot discover or open them. APP-21 is the research ticket for closing that gap.

The main architectural decision captured here is to use a unified docs object path model rooted at:

- `/docs/objects/{kind}/{owner}/{slug}`

Examples:

- `/docs/objects/module/inventory/overview`
- `/docs/objects/help/wesen-os/backend-documentation-system`
- `/docs/objects/pack/kanban.v1/widgets.kanban.page`
- `/docs/objects/card/os-launcher/kanbanIncidentCommand`

This does not force an immediate backend rewrite. It gives the system one canonical identity model for docs objects, and then allows different providers to back those objects:

- current backend module-doc endpoints
- launcher help docs
- frontend runtime-pack metadata
- later, live artifact/runtime-injected card docs

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **completed**

Current scope:

- map the current doc browser and Module Browser code paths
- map the current backend docs-store contract
- map the current runtime-card docs metadata path
- design a unified docs-object identity model
- recommend an implementation path that can surface loaded card docs through the doc browser and, where appropriate, Module Browser entry points

## Topics

- architecture
- frontend
- hypercard
- documentation

## Tasks

See [tasks.md](./tasks.md) for the detailed research and follow-up checklist.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
