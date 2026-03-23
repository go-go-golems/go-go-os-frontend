---
Title: APP-25 Runtime Session Task Manager
Ticket: APP-25-RUNTIME-SESSION-TASK-MANAGER
Status: active
Topics:
  - frontend
  - repl
  - architecture
  - tooling
  - hypercard
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx
    Note: Current shared debug window that now mixes runtime-surface views with a lightweight JS sessions section.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/jsSessionDebugRegistry.ts
    Note: Current external registry for broker-owned JS session debug sources.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/runtimeSessions/runtimeSessionsSlice.ts
    Note: Existing runtime-surface session state that a future task manager must read without collapsing models.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts
    Note: Plain JS session broker that should become a first-class task/session source.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/docs/repl-and-runtime-debug-guide.md
    Note: Current repo guide that explains why JS sessions and runtime surfaces are distinct models.
Summary: Design and plan a shared task-manager style window that can aggregate runtime-surface sessions, plain JS REPL sessions, and future broker-owned tasks without forcing them into one fake common reducer model.
LastUpdated: 2026-03-11T16:30:00-04:00
WhatFor: Track the design and implementation plan for a general session/task manager that sits above existing runtime and REPL brokers.
WhenToUse: Use when designing or implementing a unified operator view for runtime sessions, JS sessions, and future long-running task sources.
---

# APP-25 Runtime Session Task Manager

## Goal

Design and implement a shared task-manager style window that can list and operate on:

- runtime-surface sessions
- plain JS REPL sessions
- future broker-owned language sessions
- future long-running tool tasks

without forcing all of them into the `runtimeSessions` Redux slice or into `Stacks & Cards`.

## Documents

- [Design guide](./design/01-intern-guide-to-a-shared-runtime-session-and-task-manager.md)
- [Tasks](./tasks.md)
- [Changelog](./changelog.md)
- [Investigation diary](./reference/01-investigation-diary.md)

## Scope

This ticket is about:

- a new generic operator-facing session/task manager
- external session-source registries
- serializable summary projection for UI
- action semantics such as open, focus, inspect, reset, dispose, and terminate
- how that new view relates to `Stacks & Cards`

This ticket is not about:

- attach-mode REPL work itself
- changing the semantics of runtime-surface state
- collapsing all session models into Redux
- replacing `Stacks & Cards`

## Current decision

The likely end state is:

- `Stacks & Cards` remains focused on bundles, surfaces, source editing, artifacts, and runtime authoring
- a separate `Task Manager` or `Sessions` window becomes the generic cross-broker operator view

That split should stay explicit in implementation.
