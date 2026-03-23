---
Title: Kanban Personal Planner Runtime Error Time Sequence
Ticket: GEPA-55-KANBAN-RUNTIME-SURFACE-REMOUNT-PACK-RESOLUTION
Status: active
Topics:
    - frontend
    - runtime
    - kanban
    - bugfix
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/os-launcher/src/app/kanbanVmModule.tsx
      Note: Personal Planner button click and window payload
    - Path: workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Focus behavior vs remount considerations
    - Path: workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts
      Note: Window open and session nav bootstrap
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Surface type metadata source
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Main mount/unmount/render error flow
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx
      Note: Default pack normalization behavior
    - Path: workspace-links/go-go-os-frontend/packages/ui-runtime/src/runtime-packs/uiSchema.ts
      Note: Unsupported root.kind throw
ExternalSources: []
Summary: Time-sequence diagram from clicking Personal Planner to the runtime render error, including mount/unmount/remount branches with line-level code references.
LastUpdated: 2026-03-12T19:10:00-04:00
WhatFor: Fast debugging map for the kanban.v1 remount type-resolution failure.
WhenToUse: 'Use when reproducing or fixing `Runtime render error: root.kind ''kanban.page'' is not supported` in RuntimeSurfaceSessionHost.'
---


# Kanban Personal Planner Runtime Error Time Sequence

## Goal

Show the exact click-to-error sequence for `Personal Planner`, with explicit mount/unmount/remount behavior and file+line anchors.

## Context

This sequence starts at the button click in `kanbanVmModule.tsx`, follows runtime session creation and first successful render, then branches into:

1. Focus switch only (no unmount, usually no error)
2. Host remount with surviving runtime session (error path)

## Quick Reference

```mermaid
sequenceDiagram
autonumber
participant U as User
participant B as KanbanVmBrowserWindow
participant WS as windowingSlice
participant WL as WindowLayer+Controller
participant H as RuntimeSurfaceSessionHost
participant M as RuntimeSessionManager
participant Q as QuickJSRuntimeService/VM
participant R as RuntimeSurfaceTypeRegistry
participant UI as uiSchema

U->>B: Click "Personal Planner" [R1]
B->>WS: openWindow(surfaceSessionId=os-launcher-kanban:...) [R2]
WS-->>WS: Bootstrap session nav for surface window [R3]
WL->>H: Adapter renders RuntimeSurfaceSessionHost [R4]

H->>WS: registerRuntimeSession(status=loading) [R5]
H->>M: ensureSession(bundle+session) [R6]
M->>Q: loadRuntimeBundle [R7]
Q-->>Q: defineRuntimeSurface(...,'kanban.v1') [R8]
Q-->>M: getMeta().surfaceTypes[surfaceId]=kanban.v1 [R9]
M-->>H: handle.getBundleMeta()
H-->>H: loadedBundleRef = runtimeBundle [R10]
H->>WS: setRuntimeSessionStatus(ready) [R11]
H->>Q: renderSurface(state) [R12]
Q-->>H: rawTree.kind='kanban.page' [R13]
H->>R: validateRuntimeSurfaceTree('kanban.v1', rawTree) [R14]
R-->>H: OK [R15]
H-->>U: Kanban renders

alt Focus/tab change only
  WL->>WS: focusWindow(id) only [R16]
  Note over WL,H: No window removal -> host instance stays mounted [R17]
else Host unmount/remount while runtime session survives
  H-->>H: unmount cleanup: loadedBundleRef=null [R18]
  H-->>M: release attachView(windowId) [R19]

  WL->>H: Host remounts same sessionId
  H-->>H: localRuntimeReady=true via manager.getSession!=null [R20]
  H-->>H: load/recover effect skips (already ready) [R21]
  H->>Q: renderSurface => still kanban.page [R12][R13]
  H->>R: packId resolves undefined -> normalize => ui.card.v1 [R22]
  R->>UI: validate UI tree (root.kind='kanban.page')
  UI-->>H: throw "root.kind 'kanban.page' is not supported" [R23]
  H-->>H: catch -> renderError + toast [R24]
  H-->>U: Runtime render error UI [R25]
end
```

## File + Line References

- `[R1]` `Personal Planner` button render/click
  - [kanbanVmModule.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/kanbanVmModule.tsx:124)
- `[R2]` Button dispatch to `openWindow` with generated `surfaceSessionId`
  - [kanbanVmModule.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/kanbanVmModule.tsx:74)
  - [kanbanVmModule.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/kanbanVmModule.tsx:129)
- `[R3]` Window state creates surface nav session on open
  - [windowingSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts:65)
- `[R4]` Surface window adapter renders `RuntimeSurfaceSessionHost`
  - [kanbanVmModule.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/kanbanVmModule.tsx:92)
  - [kanbanVmModule.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/kanbanVmModule.tsx:107)
  - [WindowLayer.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/WindowLayer.tsx:96)
- `[R5]` Host registers runtime session in Redux
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:150)
- `[R6]` Host requests runtime session handle
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:186)
  - [runtimeSessionManager.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-session-manager/runtimeSessionManager.ts:193)
- `[R7]` Runtime service loads VM session/bundle
  - [runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts:162)
- `[R8]` VM surface authored as `kanban.v1`
  - [kanbanPersonalPlanner.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/cards/kanbanPersonalPlanner.vm.js:26)
  - [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js:118)
- `[R9]` VM meta exposes `surfaceTypes`
  - [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js:168)
- `[R10]` Host stores bundle meta in `loadedBundleRef`
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:195)
- `[R11]` Host marks session ready
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:198)
- `[R12]` Host requests runtime render
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:384)
  - [runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts:282)
- `[R13]` Kanban VM returns `widgets.kanban.page` root
  - [00-runtimePrelude.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/00-runtimePrelude.vm.js:427)
- `[R14]` Host validates tree against selected pack
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:383)
  - [runtimeSurfaceTypeRegistry.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx:51)
- `[R15]` Kanban validator expects `kanban.page`
  - [kanbanV1Pack.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/kanban-runtime/src/runtime-packs/kanbanV1Pack.tsx:489)
- `[R16]` Focus change is `focusWindow` (not close)
  - [useDesktopShellController.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:616)
- `[R17]` Window body cache signature excludes focus state
  - [useDesktopShellController.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:111)
  - [useDesktopShellController.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:1143)
- `[R18]` Host unmount cleanup zeros `loadedBundleRef`
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:333)
- `[R19]` `attachView` release path
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:330)
  - [runtimeSessionManager.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-session-manager/runtimeSessionManager.ts:129)
- `[R20]` Host treats manager session presence as local readiness
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:137)
- `[R21]` Load/recover effect short-circuit condition
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:165)
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:168)
- `[R22]` Missing pack resolves to default `ui.card.v1`
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:383)
  - [runtimeSurfaceTypeRegistry.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx:29)
- `[R23]` UI schema unsupported root-kind throw
  - [uiSchema.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/ui-runtime/src/runtime-packs/uiSchema.ts:229)
- `[R24]` Host catches and stores `renderError`; emits toast
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:389)
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:401)
- `[R25]` Error UI text rendered
  - [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx:476)

## Usage Examples

- Debugging remount crashes: follow the `else` branch and verify whether `loadedBundleRef` is null while manager session exists.
- Validating a fix: ensure pack resolution at `[R22]` no longer falls back to `ui.card.v1` for `kanbanPersonalPlanner` after remount.
- Explaining behavior to new engineers: use this sequence alongside the design doc in `design-doc/01-...`.
