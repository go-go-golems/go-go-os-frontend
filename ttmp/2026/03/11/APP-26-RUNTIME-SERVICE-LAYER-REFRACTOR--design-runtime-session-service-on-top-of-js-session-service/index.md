---
Title: APP-26 Runtime Service Layer Refactor
Ticket: APP-26-RUNTIME-SERVICE-LAYER-REFRACTOR
Status: active
Topics:
  - frontend
  - architecture
  - hypercard
  - repl
  - tooling
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/jsSessionService.ts
    Note: Current lower-level blank JS session service that should become the explicit substrate for runtime sessions.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
    Note: Current runtime-specific execution service that still exposes the runtime/bundle/surface contract directly.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/quickJsSessionCore.ts
    Note: Shared QuickJS lifecycle seam already extracted and available as the service-layer foundation.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/docs/runtime-concepts-guide.md
    Note: Repo guide that already teaches the conceptual layering this ticket aims to make explicit in code.
Summary: Design the next service-layer refactor so RuntimeSessionService becomes an explicit layer built on top of JsSessionService rather than only conceptually sharing lower-level QuickJS lifecycle helpers.
LastUpdated: 2026-03-11T16:55:00-04:00
WhatFor: Track the detailed plan for turning the current conceptual JsSession to RuntimeSession layering into a first-class service architecture in code.
WhenToUse: Use before refactoring runtime execution services or changing how runtime brokers and session owners are built.
---

# APP-26 Runtime Service Layer Refactor

## Goal

Design the service-layer refactor that makes the current conceptual layering explicit:

- `JsSessionService` is the lower-level persistent QuickJS session layer
- `RuntimeSessionService` becomes the runtime-specific layer built on top of it

## Documents

- [Design guide](./design/01-intern-guide-to-refactoring-runtime-session-service-on-top-of-js-session-service.md)
- [Tasks](./tasks.md)
- [Changelog](./changelog.md)
- [Investigation diary](./reference/01-investigation-diary.md)

## Scope

This ticket is about:

- service-layer boundaries
- composition between JS sessions and runtime sessions
- public service APIs
- broker/service ownership
- migration strategy without adding compatibility wrappers

This ticket is not about:

- implementing attach mode directly
- changing runtime package semantics
- changing task-manager UI
- changing bundle/surface authoring contracts

## Current direction

The codebase already shares a lower-level QuickJS core and already has a separate `JsSessionService`.
What is still missing is an explicit service composition where the runtime layer clearly builds on the
JS-session layer instead of only sharing some lower-level helper code.
