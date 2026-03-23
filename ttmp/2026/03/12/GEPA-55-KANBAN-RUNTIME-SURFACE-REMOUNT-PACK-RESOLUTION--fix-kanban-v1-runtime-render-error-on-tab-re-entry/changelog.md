# Changelog

## 2026-03-12

- Implemented APP-28-style `RuntimeSurfaceSessionHost` pack resolution ownership: manager session metadata is now rehydrated on-demand after remount instead of depending on mount-local `loadedBundleRef`.
- Removed implicit default fallback in `normalizeRuntimeSurfaceTypeId`; missing/blank IDs now fail explicitly.
- Added non-default-pack remount regression coverage (`kanban.v1` + `kanban.page`) to prevent recurrence.
- Added new design document `design-doc/02-runtimesurfacesessionhost-app-28-style-lifecycle-ownership-and-strict-pack-resolution-implementation-guide.md`.
- Updated ticket `index.md`, `tasks.md`, and `reference/01-investigation-diary.md` with implementation details and next delivery steps.

### Related Files

- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx — Host ownership and pack-resolution fix implementation
- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx — Non-default pack remount regression test
- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx — Strict pack ID normalization behavior
- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.test.tsx — Missing pack ID test assertions

## 2026-03-12

- Initial workspace created
- Added design doc: intern-level architecture, root cause, and phased implementation plan for the `kanban.v1` remount render error
- Added investigation diary with command-level debugging evidence and environment-specific permission notes
- Updated ticket index/tasks to reflect deliverables and next implementation steps
- Prepared docs for validation and reMarkable bundle delivery

## 2026-03-12

Completed intern-level root-cause analysis and implementation guide for kanban.v1 remount pack-resolution bug; added diary and related-file evidence links.

### Related Files

- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx — Regression test planning target
- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx — Bug analysis and fix target


## 2026-03-12

Added reference doc with full click-to-error time-sequence diagram (including unmount/remount branch) and line-level code anchors.

### Related Files

- /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/12/GEPA-55-KANBAN-RUNTIME-SURFACE-REMOUNT-PACK-RESOLUTION--fix-kanban-v1-runtime-render-error-on-tab-re-entry/reference/02-kanban-personal-planner-runtime-error-time-sequence.md — New sequence diagram reference

## 2026-03-12

Implemented RuntimeSurfaceSessionHost APP-28 style manager-owned metadata rehydration, strict normalizeRuntimeSurfaceTypeId failure semantics, and kanban.v1 remount regression coverage.

### Related Files

- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx — Non-default pack remount test
- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx — Manager-backed pack resolution and render outcome refactor
- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx — No implicit ui.card.v1 normalization fallback


## 2026-03-12

Uploaded refreshed GEPA-55 bundle to reMarkable and committed runtime host fix (b2f45bb) in go-go-os-frontend.

### Related Files

- /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/12/GEPA-55-KANBAN-RUNTIME-SURFACE-REMOUNT-PACK-RESOLUTION--fix-kanban-v1-runtime-render-error-on-tab-re-entry/design-doc/02-runtimesurfacesessionhost-app-28-style-lifecycle-ownership-and-strict-pack-resolution-implementation-guide.md — Included in reMarkable bundle upload
- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx — Committed in b2f45bb

