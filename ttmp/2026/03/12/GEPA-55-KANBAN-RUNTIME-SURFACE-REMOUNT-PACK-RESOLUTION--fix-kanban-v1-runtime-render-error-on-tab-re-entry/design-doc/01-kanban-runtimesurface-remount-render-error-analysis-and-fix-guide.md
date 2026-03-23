---
Title: 'Kanban RuntimeSurface Remount Render Error: Analysis and Fix Guide'
Ticket: GEPA-55-KANBAN-RUNTIME-SURFACE-REMOUNT-PACK-RESOLUTION
Status: active
Topics:
    - frontend
    - runtime
    - kanban
    - bugfix
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/os-launcher/src/domain/vm/00-runtimePrelude.vm.js
      Note: Kanban page root generation via widgets.kanban.page
    - Path: apps/os-launcher/src/domain/vm/cards/kanbanSprintBoard.vm.js
      Note: Kanban surface authoring with explicit packId
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Runtime surface definition normalization and surfaceTypes metadata emission
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx
      Note: Current remount regression coverage and extension point
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Host lifecycle and pack resolution bug locus
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx
      Note: Default runtime surface type fallback behavior
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-session-manager/runtimeSessionManager.ts
      Note: Session reuse semantics during remount
    - Path: workspace-links/go-go-os-frontend/packages/kanban-runtime/src/runtime-packs/kanbanV1Pack.tsx
      Note: Kanban root kind contract and validation
    - Path: workspace-links/go-go-os-frontend/packages/kanban-runtime/src/runtimeRegistration.tsx
      Note: Registration of kanban.v1 runtime surface type
    - Path: workspace-links/go-go-os-frontend/packages/ui-runtime/src/runtime-packs/uiSchema.ts
      Note: Unsupported root.kind validator throw path
ExternalSources: []
Summary: Evidence-backed root cause analysis and implementation guide for the remount-time pack resolution bug that causes `root.kind 'kanban.page' is not supported` in RuntimeSurfaceSessionHost.
LastUpdated: 2026-03-12T17:30:00-04:00
WhatFor: Onboard engineers to HyperCard runtime-surface architecture and provide a concrete fix plan with tests.
WhenToUse: Use when debugging runtime-surface type mismatch errors, remount/session recovery behavior, or adding non-default runtime surface types like kanban.v1.
---


# Kanban RuntimeSurface Remount Render Error: Analysis and Fix Guide

## Executive Summary

A recurring runtime error appears when returning focus to a Kanban runtime window:

`Runtime render error: root.kind 'kanban.page' is not supported`

Observed behavior indicates that the VM still returns a valid Kanban tree (`kind: 'kanban.page'`), but the host validates that tree using the default UI schema (`ui.card.v1`) instead of `kanban.v1`. The failure is not a Kanban tree integrity issue; it is a surface-type resolution issue during host remount/recovery.

The core bug is in `RuntimeSurfaceSessionHost`: pack resolution depends on `loadedBundleRef.current`, which can be `null` after remount even when a ready runtime session already exists in `DEFAULT_RUNTIME_SESSION_MANAGER`. In that state, pack resolution silently falls back to `ui.card.v1`, producing the exact error above.

This document provides:

- A full architecture walkthrough for intern onboarding.
- A line-anchored root cause narrative.
- A concrete implementation plan with pseudocode.
- A test strategy including a regression harness for non-default pack remounts.
- Risks, alternatives, and rollout guidance.

## Problem Statement And Scope

### User-facing failure

When tabbing away from and back into a `kanban.v1` RuntimeSurface window, runtime rendering can fail with:

`Runtime render error: root.kind 'kanban.page' is not supported`

### Scope

In scope:

- Runtime host pack/type resolution during render and rerender.
- Session remount/recovery paths in `RuntimeSurfaceSessionHost`.
- Validation path in runtime surface type registry.
- Regression tests for non-default surface packs.

Out of scope:

- Kanban DSL/schema redesign.
- UI runtime schema changes beyond diagnostics.
- VM authoring contract changes (`defineRuntimeSurface(..., packId)`).

## System Primer For A New Engineer

### Core concepts

- Runtime package: VM/host capability bundle (e.g., `kanban`, `ui`).
- Surface type ID (pack ID): tree contract identity (e.g., `ui.card.v1`, `kanban.v1`).
- Runtime tree: serialized semantic UI returned by VM render function.
- Host validator/renderer: type-specific implementation selected by surface type ID.

### Data flow: VM definition to host render

```text
VM source (defineRuntimeSurface(..., 'kanban.v1'))
    -> stack-bootstrap stores surface.packId
    -> runtime bundle meta exposes surfaceTypes[surfaceId] = 'kanban.v1'
    -> RuntimeSurfaceSessionHost chooses currentSurfaceId
    -> Host resolves packId for currentSurfaceId
    -> validateRuntimeSurfaceTree(packId, rawTree)
    -> renderRuntimeSurfaceTree(packId, tree, onEvent)
```

### Important files and responsibilities

1. VM bootstrap normalizes surface definitions and default pack IDs.
- File: `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
- Evidence:
  - `normalizeRuntimeSurfaceDefinition` defaults missing `packId` to `ui.card.v1` (`:77-101`).
  - Runtime meta exports `surfaceTypes` map from surfaces (`:168-173`).

2. Runtime host renders a surface and chooses a surface type.
- File: `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`
- Evidence:
  - `loadedBundleRef` + `localRuntimeReady` logic (`:135-139`).
  - load/recover effect that hydrates `loadedBundleRef` via `getBundleMeta()` (`:160-197`).
  - render path resolves `packId` using `runtimeSurface?.packId ?? loadedBundleRef.current?.surfaceTypes?.[currentSurfaceId]` (`:382-385`, `:481-484`).

3. Runtime surface type registry applies default fallback.
- File: `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx`
- Evidence:
  - `normalizeRuntimeSurfaceTypeId` falls back to `ui.card.v1` when `packId` is absent (`:29-36`).

4. UI schema rejects unknown root kinds (including `kanban.page`).
- File: `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/ui-runtime/src/runtime-packs/uiSchema.ts`
- Evidence:
  - Unsupported-kind throw shape: ``${path}.kind '${kind}' is not supported`` (`:229`).

5. Kanban runtime requires `root.kind === 'kanban.page'`.
- File: `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/kanban-runtime/src/runtime-packs/kanbanV1Pack.tsx`
- Evidence:
  - `validateKanbanV1Node` asserts root kind `kanban.page` (`:489-490`).

6. Runtime registration for Kanban pack/type.
- File: `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/kanban-runtime/src/runtimeRegistration.tsx`
- Evidence:
  - package surfaceTypes includes `kanban.v1` (`:15`).
  - runtime surface type definition for `kanban.v1` (`:19-23`).

7. Kanban cards explicitly declare `packId: 'kanban.v1'` and render `widgets.kanban.page(...)`.
- Files:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/cards/kanbanSprintBoard.vm.js` (`:4`, `:26-42`)
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/00-runtimePrelude.vm.js` (`:427`)

## Current-State Behavior (Evidence-Backed)

### Observed invariant

- Kanban VM surfaces are correctly authored with `packId: 'kanban.v1'`.
- Raw render output for Kanban has root kind `kanban.page`.
- Error string references generic root kind support, matching UI schema validator format.

Inference: host selected wrong validator (`ui.card.v1`) for a Kanban tree.

### Why it can happen on remount/tab re-entry

`RuntimeSurfaceSessionHost` can run in a state where:

- Runtime session in store is `ready`.
- Manager still has a live session handle.
- `loadedBundleRef.current` is `null` (component-local ref lost/reset across mount cycle).

Because `localRuntimeReady` checks manager session presence (`getSession(sessionId)`), the host can consider itself ready even without `loadedBundleRef` metadata.

Then this line resolves no explicit pack and falls into default normalization:

```ts
const packId = normalizeRuntimeSurfaceTypeId(
  runtimeSurface?.packId ?? loadedBundleRef.current?.surfaceTypes?.[currentSurfaceId]
);
```

Absent pack metadata, normalization returns `ui.card.v1`, and UI schema throws on `kanban.page`.

## Root Cause

Primary root cause:

- Pack selection path in render relies on `loadedBundleRef.current` but does not reliably hydrate from the live runtime handle when the host remounts into an already-ready session.

Contributing factors:

- Default normalization to `ui.card.v1` masks missing metadata as a plausible value rather than surfacing "missing pack for surface".
- Existing remount tests focus on default `ui.card.v1`, so non-default pack regressions are not exercised.

## Proposed Solution

### Design goals

1. Resolve pack ID from authoritative runtime metadata even after host remount.
2. Keep precedence deterministic and stable.
3. Avoid duplicate resolution logic between validation and final render.
4. Preserve existing dynamic injection behavior (`runtimeSurfaceRegistry` overrides).

### Pack resolution precedence

For a given `surfaceId`, resolve pack in this order:

1. Runtime surface registry override (`getPendingRuntimeSurfaces().packId`), when present.
2. `loadedBundleRef.current.surfaceTypes[surfaceId]`, when present.
3. `DEFAULT_RUNTIME_SESSION_MANAGER.getSession(sessionId)?.getBundleMeta().surfaceTypes[surfaceId]`, when present.
4. Fallback to `ui.card.v1` only if all above are absent.

### Host changes

1. Add a helper in `RuntimeSurfaceSessionHost`:

```ts
function resolveSurfacePackId(surfaceId: string): string {
  const injected = getPendingRuntimeSurfaces().find((s) => s.surfaceId === surfaceId)?.packId;
  if (injected) return normalizeRuntimeSurfaceTypeId(injected);

  const fromRef = loadedBundleRef.current?.surfaceTypes?.[surfaceId];
  if (fromRef) return normalizeRuntimeSurfaceTypeId(fromRef);

  const live = DEFAULT_RUNTIME_SESSION_MANAGER.getSession(sessionId);
  const fromLive = live?.getBundleMeta().surfaceTypes?.[surfaceId];
  if (fromLive) {
    // Keep ref hydrated to avoid repeated lookups.
    if (!loadedBundleRef.current) loadedBundleRef.current = live.getBundleMeta();
    return normalizeRuntimeSurfaceTypeId(fromLive);
  }

  return normalizeRuntimeSurfaceTypeId(undefined);
}
```

2. Use this helper in both locations currently duplicating pack resolution:
- render-time validation path (`validateRuntimeSurfaceTree`)
- final render path (`renderRuntimeSurfaceTree`)

3. Optional hardening: if runtime tree root kind suggests non-default pack but pack resolution fell back, emit diagnostics log once per surface.

### Why this design

- Uses runtime-manager bundle metadata as authoritative source when component-local ref is stale/lost.
- Keeps current behavior for injected surfaces and default surfaces.
- Fixes remount/tab-reentry without requiring VM or registry contract changes.

## Architecture Diagram

```text
+---------------------------+           +----------------------------------+
| RuntimeSurfaceSessionHost |           | Runtime Session Manager          |
| (React component)         |           | (singleton service)              |
+-------------+-------------+           +----------------+-----------------+
              |                                          |
              | getSession(sessionId)                    |
              +----------------------------------------->|
              |                                          |
              |<-------------------- handle (ready) -----+
              |
              | getBundleMeta().surfaceTypes[surfaceId]
              |
              v
  resolveSurfacePackId(surfaceId)
              |
              +-> validateRuntimeSurfaceTree(packId, rawTree)
              +-> renderRuntimeSurfaceTree(packId, tree)
```

## Implementation Plan (Phased)

### Phase 1: Refactor pack resolution in host

Target file:
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`

Steps:

1. Introduce `resolveSurfacePackId` helper in component scope.
2. Replace inline pack resolution in `renderOutcome` and final JSX render with helper call.
3. Hydrate `loadedBundleRef.current` from live handle bundle meta when missing.
4. Keep current behavior of registry-injected pack override precedence.

### Phase 2: Add regression tests for non-default remount

Target file:
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx`

Steps:

1. Extend mocked runtime service to return a `kanban.v1` surface for a dedicated session ID.
2. Register a minimal test surface type (e.g., `kanban.v1`) with a validator requiring `kind: 'kanban.page'`.
3. Add StrictMode/remount test ensuring host renders successfully after remount and does not produce runtime render error.

### Phase 3: Diagnostic quality improvements (optional but recommended)

1. Add one-time warning when pack resolution falls back to default while bundle has unknown/missing `surfaceTypes` for current surface.
2. Include session/surface IDs in warning metadata for easier incident triage.

## Test Strategy

### Unit/regression tests

1. `RuntimeSurfaceSessionHost.rerender.test.tsx`
- Add case: ready session + remount + non-default pack (`kanban.v1`) + tree root `kanban.page`.
- Assert no render error fallback UI appears.
- Assert content from custom renderer remains visible after remount.

2. Existing tests should remain green:
- strict mode stability for `ui.card.v1`
- session attach lifecycle
- equivalent bundle rerender behavior

### Manual validation flow

1. Start `os-launcher` runtime path.
2. Open a Kanban runtime card (`kanban.v1`).
3. Switch focus to another tab/window, then return.
4. Confirm no toast or inline error containing:
- `Runtime render error`
- `root.kind 'kanban.page' is not supported`
5. Interact with board actions to confirm event handling still wired.

## API And Contract Reference

### VM API

```js
defineRuntimeSurface(surfaceId, definitionOrFactory, packId)
```

- Declares runtime surface and optional/explicit pack.
- In bootstrap, missing pack defaults to `ui.card.v1`.

### Host API

```ts
validateRuntimeSurfaceTree(packId, value)
renderRuntimeSurfaceTree(packId, value, onEvent)
```

- Both are selected by pack ID.
- Incorrect pack ID means incorrect validator/renderer pipeline.

### Runtime metadata

```ts
RuntimeBundleMeta.surfaceTypes: Record<surfaceId, packId>
```

- Canonical map for host pack lookup.
- Must be available during steady-state render, including remount.

## Alternatives Considered

1. Infer pack from tree root kind (e.g., `kanban.page` => `kanban.v1`)
- Rejected: heuristic, brittle, and couples schema internals to host dispatch logic.

2. Persist `loadedBundleRef` outside component in global registry
- Rejected: duplicates state already available in runtime session manager.

3. Remove default fallback entirely
- Deferred: likely safer long-term, but could break existing callers expecting implicit `ui.card.v1` behavior.

## Risks And Mitigations

1. Risk: extra `getBundleMeta()` call cost on hot render paths.
- Mitigation: hydrate `loadedBundleRef.current` once when missing; subsequent reads are ref-only.

2. Risk: stale surface metadata if session mutates after initial hydration.
- Mitigation: helper should prefer live runtime surface registry override and can refresh from live bundle meta if needed.

3. Risk: test flakiness around StrictMode remount timing.
- Mitigation: use existing `waitForText` helper and deterministic session IDs in test mock.

## Open Questions

1. Should default fallback to `ui.card.v1` be retained, or should missing pack become a hard error for non-legacy paths?
2. Should `RuntimeSurfaceSessionHost` store resolved `packId` per surface in memoized state for observability/debug UIs?
3. Should we add telemetry counters for pack mismatch incidents?

## References

Primary evidence files:

1. `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`
2. `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx`
3. `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
4. `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/ui-runtime/src/runtime-packs/uiSchema.ts`
5. `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/kanban-runtime/src/runtime-packs/kanbanV1Pack.tsx`
6. `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/kanban-runtime/src/runtimeRegistration.tsx`
7. `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/cards/kanbanSprintBoard.vm.js`
8. `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/00-runtimePrelude.vm.js`
9. `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx`
