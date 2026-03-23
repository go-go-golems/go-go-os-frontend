---
Title: Investigate Frontend Timeline Widget Registration for Chat Artifacts
Ticket: APP-06-FRONTEND-TIMELINE-REGISTRATION
Status: active
Topics:
    - frontend
    - chat
    - timeline
    - hypercard
    - wesen-os
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go
      Note: Backend hypercard timeline projection
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/vite.config.ts
      Note: Vite workspace aliasing for linked frontend packages
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/app/store.ts
      Note: Current non-chat-capable apps-browser host store
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelineMapper.ts
      Note: Frontend transport-to-entity mapping and hypercard remap
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts
      Note: Artifact projection side state from timeline entities
ExternalSources: []
Summary: Investigates why backend-projected chat timeline entities such as hypercard cards and tool rows may fail to render correctly in frontend chat windows, and now includes both the concrete card-only cutover plan and a repository-setup note explaining the linked-repo Vite environment that serves those frontend packages during development.
LastUpdated: 2026-03-06T18:10:00-05:00
WhatFor: Use this ticket when auditing or implementing frontend chat timeline rendering for backend-projected entities in inventory, executing the card-only cutover that preserves hypercard.card.v2 end to end, or debugging how wesen-os resolves linked frontend packages in development.
WhenToUse: Use before wiring chat windows into new hosts, when debugging missing card rows, when fixing Vite/HMR issues across workspace-links, or when cleaning up the chat-runtime and hypercard-runtime extension architecture.
---


# Investigate Frontend Timeline Widget Registration for Chat Artifacts

## Overview

This ticket studies the frontend half of the chat timeline pipeline. The backend appears to project durable entities correctly, especially `hypercard.card.v2`, but the frontend registration and host wiring model is split across multiple packages and extension seams. The ticket now includes both the investigation and the concrete card-only cutover plan: keep `hypercard.card.v2` first-class, remove widget scope from the live path, and make inventory pass the card renderer explicitly instead of depending on global registration.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field
- **Main Guide**: [design-doc/01-frontend-timeline-widget-registration-investigation-design-and-implementation-guide.md](./design-doc/01-frontend-timeline-widget-registration-investigation-design-and-implementation-guide.md)
- **Cutover Plan**: [design-doc/02-card-cutover-fix-handoff-plan.md](./design-doc/02-card-cutover-fix-handoff-plan.md)
- **Repo Setup Note**: [design-doc/03-repository-setup-and-vite-workspace-resolution.md](./design-doc/03-repository-setup-and-vite-workspace-resolution.md)
- **Postmortem**: [design-doc/04-postmortem-card-rendering-and-malformed-structured-block-debugging.md](./design-doc/04-postmortem-card-rendering-and-malformed-structured-block-debugging.md)
- **Diary**: [reference/01-investigation-diary.md](./reference/01-investigation-diary.md)

## Status

Current status: **active**

## Topics

- frontend
- chat
- timeline
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
