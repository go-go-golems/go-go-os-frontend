---
Title: Fix kanban.v1 runtime render error on tab re-entry
Ticket: GEPA-55-KANBAN-RUNTIME-SURFACE-REMOUNT-PACK-RESOLUTION
Status: active
Topics:
    - frontend
    - runtime
    - kanban
    - bugfix
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx
      Note: Regression tests for remount behavior
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Main fix target
    - Path: workspace-links/go-go-os-frontend/packages/kanban-runtime/src/runtime-packs/kanbanV1Pack.tsx
      Note: Kanban schema contract for root.kind
ExternalSources: []
Summary: Ticket workspace for root-cause analysis and implementation guidance for the kanban.v1 remount pack-resolution bug in RuntimeSurfaceSessionHost.
LastUpdated: 2026-03-12T17:30:00-04:00
WhatFor: Track analysis, implementation planning, and delivery of the runtime-surface remount bug fix documentation.
WhenToUse: Use when implementing or reviewing the fix for runtime pack mismatch on tab re-entry/remount.
---


# Fix kanban.v1 runtime render error on tab re-entry

## Overview

This ticket captures the detailed analysis and implementation guide for a runtime rendering bug where Kanban surfaces can be validated against the wrong surface type after remount.

Primary symptom:

- `Runtime render error: root.kind 'kanban.page' is not supported`

Primary deliverables:

- detailed design doc with architecture + root cause + fix plan
- APP-28 style implementation guide for RuntimeSurfaceSessionHost lifecycle ownership and strict pack resolution
- chronological investigation diary with command-level evidence
- task checklist for implementation and validation

## Key Links

- Design doc: `design-doc/01-kanban-runtimesurface-remount-render-error-analysis-and-fix-guide.md`
- Implementation guide: `design-doc/02-runtimesurfacesessionhost-app-28-style-lifecycle-ownership-and-strict-pack-resolution-implementation-guide.md`
- Diary: `reference/01-investigation-diary.md`
- Time sequence: `reference/02-kanban-personal-planner-runtime-error-time-sequence.md`
- Tasks: `tasks.md`
- Changelog: `changelog.md`

## Status

Current status: **active**

## Topics

- frontend
- runtime
- kanban
- bugfix

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design-doc/ - primary architecture and implementation guide
- reference/ - investigation diary
- playbooks/ - reserved for follow-up runbooks
- scripts/ - reserved for repro/automation scripts
- various/ - scratch artifacts and notes
- archive/ - deprecated artifacts
