---
Title: Extract concrete runtime packages into external packages and app-level registration
Ticket: APP-16-HYPERCARD-EXTERNAL-RUNTIME-PACK-REGISTRATION
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
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.ts
      Note: Current logical runtime-package registry that still owns built-in package definitions and needs extraction hooks
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx
      Note: Current surface-type registry that still statically imports concrete surface renderers
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: Runtime session loader that currently installs package preludes from runtime-core-owned definitions
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Generic VM bootstrap that should stay in runtime core while consuming externally registered package APIs
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx
      Note: Concrete kanban surface-type implementation that should leave hypercard-runtime
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/runtime.ts
      Note: Current kanban host widget seam that still lives outside a dedicated runtime package
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/App.tsx
      Note: Host bootstrap seam where external runtime packages should ultimately be registered
ExternalSources: []
Summary: Detailed architecture ticket for moving from runtime-core-owned `ui` and `kanban` package implementations to external runtime packages registered by the host app, using the current RuntimeBundle and RuntimeSurface model.
LastUpdated: 2026-03-11T12:20:00-04:00
WhatFor: Use this ticket to plan and later implement the physical extraction of concrete runtime packages from hypercard-runtime into external packages with explicit app-level registration, without adding compatibility wrappers.
WhenToUse: Use when designing or implementing package extraction for `kanban`, when deciding what belongs in runtime core versus a concrete runtime package, or when onboarding an intern to the final package-registration architecture after APP-23.
---

# Extract concrete runtime packages into external packages and app-level registration

## Overview

APP-16 is no longer just a speculative follow-up to the first Kanban runtime work. APP-23 has since clarified the runtime model and landed the core rename:

- `RuntimeSession`
- `RuntimeBundle`
- `RuntimePackage`
- `RuntimeSurface`
- `RuntimeSurfaceType`

That changes what APP-16 needs to say. The problem is no longer “invent package registration.” A basic `RuntimePackageRegistry` now exists in runtime core. The real remaining problem is physical ownership:

- concrete runtime packages such as `ui` and `kanban` are still defined inside `hypercard-runtime`
- concrete surface-type renderers such as `kanban.v1` are still statically registered inside `hypercard-runtime`
- host widget code for Kanban still lives in `rich-widgets`
- `wesen-os` still consumes a runtime where concrete package implementations are bundled into runtime core instead of being composed at app startup

So APP-16 is now the extraction ticket. Its goal is to move from:

```text
hypercard-runtime
  owns generic runtime infrastructure
  owns ui package definition
  owns kanban package definition
  owns kanban.v1 surface renderer
```

to:

```text
hypercard-runtime
  owns generic RuntimeSession / RuntimeBundle infrastructure
  owns generic RuntimePackage and RuntimeSurfaceType registries

external package(s)
  own concrete package preludes, docs, validators, renderers, and host widgets

host app
  chooses which runtime packages and surface types to register
```

This ticket is still design-only. It refreshes the architecture and task plan so future implementation work starts from the current runtime model rather than the pre-APP-23 one.

## Current Status

What already exists today:

- `RuntimePackageRegistry` in runtime core
- bundle-declared `packageIds`
- dependency-ordered package installation before bundle load
- `RuntimeSurfaceType` registry in runtime core
- renamed `RuntimeSurfaceSessionHost`
- package docs and surface docs via `vmmeta`

What APP-16 still needs to change:

- move concrete package manifests out of runtime core
- move concrete surface-type validators/renderers out of runtime core
- stop static registration-by-import in runtime core
- define app-level registration for packages and surface types
- co-locate Kanban runtime pieces into a dedicated external package instead of scattering them across `hypercard-runtime` and `rich-widgets`

## Scope

APP-16 covers:

- current-state architecture analysis after APP-23
- final target ownership for runtime core, concrete packages, and host apps
- a detailed extraction plan for the `kanban` package as the first migration
- a direct-cutover task list with no compatibility layers

APP-16 does not cover:

- multi-language runtime engines
- artifact-protocol renaming beyond the runtime-core work already handled in APP-23
- adding new Kanban primitives beyond what APP-20 already designed

## Key Links

- [Tasks](./tasks.md)
- [Changelog](./changelog.md)
- [Implementation Diary](./reference/01-implementation-diary.md)
- [Main Design Guide](./design-doc/01-intern-guide-to-fully-decoupled-runtime-pack-packages-and-app-level-registration.md)

## Structure

- `design-doc/` detailed design and implementation guide
- `reference/` diary and supporting notes
- `playbooks/` future command/runbook material
- `scripts/` temporary extraction helpers if later needed
