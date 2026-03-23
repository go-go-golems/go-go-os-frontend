# Tasks

## Done

- [x] Create ticket workspace `GEPA-55-KANBAN-RUNTIME-SURFACE-REMOUNT-PACK-RESOLUTION`
- [x] Produce detailed design/analysis/implementation guide for intern onboarding
- [x] Add APP-28 style RuntimeSurfaceSessionHost lifecycle ownership + strict pack resolution implementation guide (`design-doc/02-...`)
- [x] Produce chronological investigation diary with command/evidence trail
- [x] Relate key code files to ticket docs
- [x] Validate ticket docs with `docmgr doctor`
- [x] Upload ticket bundle to reMarkable and verify remote listing
- [x] Implement `resolveSurfacePackId` helper in `RuntimeSurfaceSessionHost.tsx`
- [x] Replace duplicate inline pack resolution calls with helper usage and reuse resolved `packId` in final render
- [x] Add non-default pack remount regression test in `RuntimeSurfaceSessionHost.rerender.test.tsx`
- [x] Remove implicit `ui.card.v1` fallback in `normalizeRuntimeSurfaceTypeId` and fail explicitly on missing IDs
- [x] Run package tests and confirm no `kanban.page` unsupported render failures on remount

## Next

- [x] Upload refreshed GEPA-55 bundle (including design-doc/02 and latest diary steps) to reMarkable
- [x] Commit runtime host + test changes in `workspace-links/go-go-os-frontend`
