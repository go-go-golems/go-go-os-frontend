# Tasks

## Ticket Refresh

- [x] Re-audit APP-16 after APP-23 landed the RuntimeSession / RuntimeBundle / RuntimePackage / RuntimeSurface / RuntimeSurfaceType model
- [x] Refresh the index and main design guide to describe the current architecture rather than the pre-APP-23 one
- [x] Replace the old “invent package registration” framing with the current “extract concrete packages from runtime core” framing
- [x] Update the diary and changelog to record the APP-23-aware refresh
- [x] Re-upload the revised ticket bundle to reMarkable as a v2 deliverable

## Current-State Analysis

- [x] Document that runtime package registration now exists in runtime core
- [x] Document that runtime surface-type registration now exists in runtime core
- [x] Document that `ui` and `kanban` are still physically owned by `hypercard-runtime`
- [x] Document that Kanban host widgets and runtime-specific renderer logic are still split across `hypercard-runtime` and `rich-widgets`
- [x] Document why `wesen-os` is the correct final composition boundary for external package registration

## Design Decisions

- [x] Decide that APP-16 is now an extraction ticket, not a naming ticket
- [x] Decide that runtime core should own generic registries and session/bundle infrastructure only
- [x] Decide that concrete runtime packages should own VM preludes, package docs, host validators/renderers, and concrete widgets
- [x] Decide that host apps should register concrete packages and surface types explicitly
- [x] Decide that the migration should be a direct cutover with no compatibility wrappers or shadow registration paths

## Package Extraction Plan

- [x] Define the target ownership split for:
  - runtime core
  - concrete package packages
  - host apps
- [x] Define the first extraction target as the Kanban package family
- [x] Define the target physical package shape for the future Kanban package
- [x] Define the role of `rich-widgets` after extraction
- [x] Define the role of `ui` after Kanban extraction:
  - no built-in exception
  - next concrete package to extract after `kanban`

## Detailed Future Implementation Slices

### Slice 1: Make runtime core extraction-ready

- [x] Review `runtimePackageRegistry.ts` and `runtimeSurfaceTypeRegistry.tsx` for any remaining assumptions that concrete packages are built in
- [x] Audit current built-in registrations in:
  - `packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.ts`
  - `packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx`
  - `packages/hypercard-runtime/src/index.ts`
- [x] Introduce or confirm explicit registration seams that can be called from app bootstrap instead of relying on import side effects
- [x] Decide whether the final registration seam is:
  - module-global registries with explicit `register*` calls
  - or instance-based registries passed through app bootstrap
- [x] Document the exact public API that runtime core will keep after extraction:
  - `registerRuntimePackage(...)`
  - `registerRuntimeSurfaceType(...)`
  - `getRuntimePackageOrThrow(...)`
  - `getRuntimeSurfaceTypeOrThrow(...)`
- [x] Remove any remaining runtime-core comments/docs that imply concrete packages belong in runtime core permanently
- [x] Add a focused test proving `QuickJSRuntimeService.loadRuntimeBundle(...)` fails cleanly when required packages were not registered
- [x] Add focused tests proving the registries can be empty until external registration happens

### Slice 2: Create the external Kanban package

- [x] Create a dedicated Kanban runtime package workspace
- [x] Choose the final package path/name and record it in the ticket before moving files:
  `packages/kanban-runtime` / `@hypercard/kanban-runtime`
- [x] Move the Kanban VM prelude out of `hypercard-runtime`
- [x] Move `packages/hypercard-runtime/src/runtime-packages/kanban.package.vm.js` into the new package
- [x] Move the `kanban.v1` surface-type validator/renderer out of `hypercard-runtime`
- [x] Move `packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx` into the new package
- [x] Move the Kanban host widget/runtime files out of `rich-widgets` into the concrete package
- [x] Move the current Kanban runtime/widget files now living under `packages/rich-widgets/src/kanban/*`
- [x] Update imports so the new package owns:
  - runtime types
  - host widgets
  - stories
  - theme/css assets if any remain Kanban-specific
- [x] Move or re-home Kanban package docs metadata with the concrete package
- [x] Re-home package docs, symbol docs, and any Kanban-specific generated metadata helpers that conceptually belong to the package
- [x] Add Storybook coverage in the new package for all extracted host widgets
- [x] Ensure the stories cover both:
  - individual host widgets/subwidgets
  - at least one end-to-end `kanban.v1` host render surface

### Slice 3: Stop runtime core from owning Kanban

- [x] Remove static Kanban registration from runtime core
- [x] Remove direct Kanban imports from `runtimePackageRegistry.ts` and `runtimeSurfaceTypeRegistry.tsx`
- [x] Remove the Kanban-specific exports from runtime-core barrels that should now come from the new package instead
- [x] Update runtime core exports to expose only generic registration APIs
- [x] Keep runtime core behavior generic when no Kanban package is registered
- [x] Add regression coverage proving `listRuntimePackages()` and `listRuntimeSurfaceTypes()` no longer imply Kanban is built in

### Slice 4: Register concrete packages from the host app

- [x] Register the external Kanban package from `wesen-os` startup
- [x] Register Kanban surface types from `wesen-os` startup
- [x] Choose the exact bootstrap seam in `wesen-os`:
  - `apps/os-launcher/src/App.tsx`
  - or a dedicated runtime registration module called from startup
- [x] Keep registration code outside the launcher/demo modules so app boot and demo windows stay separate concerns
- [x] Keep app startup order explicit and testable
- [x] Verify `os-launcher` bundle tests still declare `packageIds: ['ui', 'kanban']` and now rely on host registration instead of runtime-core ownership
- [x] Add startup tests covering missing registration and successful registration

### Slice 5: Validate bundle loading and failure modes

- [x] Verify that bundles declaring `packageIds: ['kanban']` fail cleanly when Kanban is not registered
- [x] Verify that bundles declaring `packageIds: ['ui', 'kanban']` work when both packages are registered
- [x] Verify dependency ordering still works after extraction
- [x] Verify the dependency edge `kanban -> ui` still behaves correctly after package extraction
- [x] Verify runtime debug/editor flows still work with externally registered packages
- [x] Verify built-in source editing still works for Kanban surfaces after external package registration
- [x] Verify docs mounts still register package and surface docs correctly after extraction
- [x] Verify docs browser entries for:
  - `/docs/objects/surface-type/kanban.v1/...`
  - `/docs/objects/surface/os-launcher/...`
  still resolve after extraction

### Slice 6: Decide and execute the `ui` package follow-up

- [x] Decide whether `ui` remains temporarily built in or is extracted in the same branch
- [x] Record the decision explicitly in APP-16 before implementation proceeds past the Kanban extraction:
  `ui` becomes the next extracted concrete package after `kanban`
- [x] If `ui` is extracted, create the concrete UI package and move the `ui.card.v1` surface-type implementation out of runtime core
- [x] If `ui` is extracted, move:
  - `ui.package.vm.js`
  - `uiSchema.ts` ownership if appropriate
  - `PluginCardRenderer` or its replacement seam if it still conceptually belongs to the UI package

## Validation

- [x] Run targeted `hypercard-runtime` tests after extraction-ready changes
- [x] Run `os-launcher` bundle tests against externally registered Kanban
- [x] Run inventory bundle tests to verify shared runtime core behavior still works
- [x] Run Storybook checks for the extracted Kanban package widgets
- [x] Run docs-browser mount tests for package and surface docs after the external-package move
- [x] Run runtime debug/editor tests after the package extraction so source editing and session launch still work
- [x] Run app-startup tests in `wesen-os` that prove registration occurs before bundle use
- [x] Run `docmgr doctor --ticket APP-16-HYPERCARD-EXTERNAL-RUNTIME-PACK-REGISTRATION --stale-after 30`
