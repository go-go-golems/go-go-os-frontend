---
Title: Move Stacks and Cards into hypercard-runtime and register it from wesen-os startup
Ticket: APP-17-HYPERCARD-RUNTIME-DEBUG-BOOTSTRAP
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
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.tsx
      Note: Inventory now consumes the shared runtime debug app instead of owning its own route glue
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx
      Note: Shared debug window now accepts explicit ownerAppId and stack inputs
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/index.ts
      Note: Public export surface that now re-exports the runtime debug helpers
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/runtimeDebugApp.tsx
      Note: Package-owned window payload and runtime debug app wrapper introduced by APP-17
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/runtimeDebugRegistry.ts
      Note: Package-owned stack registration seam used by host apps
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/modules.tsx
      Note: wesen-os launcher composition now includes the shared runtime debug app
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/runtimeDebugModule.tsx
      Note: Thin wesen-os launcher wrapper that registers stacks and renders the shared runtime debug app
ExternalSources: []
Summary: Implementation ticket for extracting the remaining Stacks and Cards launcher and routing ownership out of inventory, turning it into a package-owned runtime debug surface, and registering that surface from wesen-os startup.
LastUpdated: 2026-03-11T00:45:00-04:00
WhatFor: Use this ticket to review the completed move of Stacks and Cards into shared runtime tooling and to understand the remaining follow-up for generated built-in card source display.
WhenToUse: Use when reviewing the completed APP-17 implementation, onboarding an intern to the runtime-debug architecture, or preparing the next follow-up that will show built-in VM source in the debugger.
---

# Move Stacks and Cards into hypercard-runtime and register it from wesen-os startup

## Overview

The `Stacks & Cards` debugger is no longer inventory-owned. APP-17 completed the remaining extraction so the shared runtime-debug surface now lives operationally with `hypercard-runtime`, while `wesen-os` registers the user-facing launcher entry at startup.

The implemented state is:

- `hypercard-runtime` owns the reusable Stacks and Cards debug surface, window payload helper, and stack registry hooks
- the shared window accepts explicit host inputs such as `ownerAppId`, `stacks`, and initial stack selection
- `wesen-os` registers the runtime debug app during startup by importing a thin launcher wrapper that binds the host stacks
- inventory no longer owns the launcher command or window route glue for this surface
- the shared debugger can now launch predefined stack cards and reopen built-in `os-launcher` Kanban source from the running plugin-session list

The main deferred follow-up is source display for built-in VM cards. That work now has a clean place to land because the runtime debug surface is no longer trapped inside inventory.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **completed**

Current scope:

- make `RuntimeCardDebugWindow` app-agnostic via explicit `ownerAppId` and stack selection inputs
- add package-owned runtime debug registry and window payload helpers in `hypercard-runtime`
- register the shared runtime debug app from `wesen-os` startup
- switch inventory to launch the shared app instead of owning a bespoke route
- defer built-in VM source display to the next follow-up

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
