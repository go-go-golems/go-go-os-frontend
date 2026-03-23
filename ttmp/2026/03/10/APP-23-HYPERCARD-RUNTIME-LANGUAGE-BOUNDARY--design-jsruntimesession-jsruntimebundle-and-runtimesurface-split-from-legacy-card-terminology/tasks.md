# Tasks

## Ticket Setup

- [x] Create APP-23 ticket workspace
- [x] Add detailed design guide and investigation diary
- [x] Identify the current engine, runtime transport, bootstrap, and host files that still center `card`

## Current-State Analysis

- [x] Document how `card` is currently overloaded across desktop, runtime transport, authoring, and host rendering
- [x] Document how the current runtime pack system is really a surface-type registry rather than a full package registry
- [x] Compare the current HyperCard runtime nomenclature against `vm-system`
- [x] Document the split between runtime-side concepts and static package/bundle concepts

## Design Decisions

- [x] Decide that the lower runtime layer should become `RuntimeSession` and `RuntimeBundle`
- [x] Decide that `RuntimePackage` is the installable/composable capability bundle
- [x] Decide that `RuntimeSurface` is the app-defined renderable unit
- [x] Decide that `RuntimeSurfaceType` is the host/runtime render contract
- [x] Decide that a direct cutover is preferable to compatibility aliases
- [x] Decide that multi-language naming is explicitly deferred for now
- [x] Decide that user-facing HyperCard labels can be reconsidered separately from the runtime-core rename

## Proposed Solution

- [x] Specify the target terminology stack
- [x] Specify current-to-target rename mappings
- [x] Specify how RuntimePackage maps to current `ui` and `kanban`
- [x] Specify how RuntimeSurfaceType maps to current `ui.card.v1` and `kanban.v1`
- [x] Specify how the runtime transport contract should change
- [x] Specify how the bootstrap authoring API should change
- [x] Specify how host/session components should change
- [x] Specify the new package registry and surface-type registry responsibilities
- [x] Specify how the desktop/windowing layer should be handled
- [x] Specify that future non-JS engines are out of scope for this rename and can be layered later

## Implementation Plan

- [x] Write a detailed intern-facing design and implementation guide
- [x] Include prose, diagrams, pseudocode, API references, and file references
- [x] Include a phased direct-cutover implementation plan
- [x] Include the static-side versus runtime-side model explicitly
- [x] Include testing strategy and file-by-file checklist
- [x] Record the reasoning in the diary and changelog

## Direct-Cutover Transition Tasks

### Slice 0: Rename policy and transition guardrails

- [x] Freeze the final target vocabulary for implementation:
  - `RuntimeSession`
  - `RuntimeBundle`
  - `RuntimePackage`
  - `RuntimeSurface`
  - `RuntimeSurfaceType`
- [x] Add one short implementation note to APP-23 stating that the transition is in-place only and must not introduce compatibility aliases, duplicate APIs, or wrapper layers
- [x] Audit current uses of `card`, `stack`, and `RuntimePack` across `packages/hypercard-runtime`, `packages/engine`, `apps/*`, and docs so the branch starts with a finite rename map
- [x] Record the final rename table to use during implementation:
  - `RuntimePack` -> `RuntimeSurfaceType`
  - `runtimePackRegistry` -> `runtimeSurfaceTypeRegistry`
  - `renderCard` -> `renderRuntimeSurface`
  - `eventCard` -> `eventRuntimeSurface`
  - `defineCard` -> `defineRuntimeSurface`
  - `defineCardRender` -> `defineRuntimeSurfaceRender`
  - `defineCardHandler` -> `defineRuntimeSurfaceHandler`
  - `LoadedStackBundle` -> `RuntimeBundleMeta`
  - `CardStackDefinition` -> `RuntimeBundleDefinition`
  - `CardDefinition` -> `RuntimeSurfaceMeta`
  - `homeCard` -> `homeSurface`
  - `cards` -> `surfaces`

### Slice 1: Surface type registry rename

- [x] Rename `RuntimePackDefinition` to `RuntimeSurfaceTypeDefinition`
- [x] Rename `runtimePackRegistry.tsx` to `runtimeSurfaceTypeRegistry.tsx`
- [x] Rename the registry API:
  - `registerRuntimePack` -> `registerRuntimeSurfaceType`
  - `getRuntimePackOrThrow` -> `getRuntimeSurfaceTypeOrThrow`
  - `validateRuntimeTree` -> `validateRuntimeSurfaceTree`
  - `renderRuntimeTree` -> `renderRuntimeSurfaceTree`
- [x] Rename `DEFAULT_RUNTIME_PACK_ID` to `DEFAULT_RUNTIME_SURFACE_TYPE_ID`
- [x] Rename `RuntimePackId` and `RuntimePackTree` types to surface-type equivalents
- [x] Update all imports in `hypercard-runtime`, stories, tests, and apps to the new registry names
- [x] Delete all remaining `RuntimePack*` public exports once the rename lands

### Slice 2: Runtime transport and service rename

- [x] Rename the worker/runtime contract in `plugin-runtime/contracts.ts`:
  - `CardId` -> `RuntimeSurfaceId`
  - `LoadedStackBundle` -> `RuntimeBundleMeta`
  - `RenderCardRequest` -> `RenderRuntimeSurfaceRequest`
  - `EventCardRequest` -> `EventRuntimeSurfaceRequest`
  - `DefineCardRequest` -> `DefineRuntimeSurfaceRequest`
  - `DefineCardRenderRequest` -> `DefineRuntimeSurfaceRenderRequest`
  - `DefineCardHandlerRequest` -> `DefineRuntimeSurfaceHandlerRequest`
- [x] Rename transport payload fields:
  - `cardId` -> `surfaceId`
  - `cards` -> `surfaces`
  - `cardPacks` -> `surfaceTypes`
  - `initialCardState` -> `initialSurfaceState`
- [x] Rename `QuickJSCardRuntimeService` to `QuickJSRuntimeService` or `QuickJSRuntimeSessionService`
- [x] Rename service methods:
  - `loadStackBundle` -> `loadRuntimeBundle`
  - `renderCard` -> `renderRuntimeSurface`
  - `eventCard` -> `eventRuntimeSurface`
  - `defineCard` -> `defineRuntimeSurface`
  - `defineCardRender` -> `defineRuntimeSurfaceRender`
  - `defineCardHandler` -> `defineRuntimeSurfaceHandler`
- [x] Update runtime-service integration tests to use the new nouns only
- [x] Delete old method names instead of re-exporting aliases

### Slice 3: VM bootstrap and authoring API rename

- [x] Rename `defineStackBundle` to `defineRuntimeBundle` in `stack-bootstrap.vm.js`
- [x] Rename `defineCard` / `defineCardRender` / `defineCardHandler` to surface equivalents in the bootstrap
- [x] Rename `__stackHost` to `__runtimeBundleHost`
- [x] Rename bootstrap-local metadata fields:
  - `cards` -> `surfaces`
  - `cardPacks` -> `surfaceTypes`
- [x] Keep the VM-side `ui.*` and `widgets.kanban.*` namespaces as package APIs, not as bundle-local helpers
- [x] Update all built-in VM source files to use the new globals in one cut:
  - `defineRuntimeBundle(...)`
  - `defineRuntimeSurface(...)`
- [x] Update generated `vmmeta` expectations and tests to match the renamed authoring API
- [x] Remove the legacy bootstrap names from the global object after the cutover

### Slice 4: Introduce explicit RuntimePackage manifests and registry

- [x] Create a `RuntimePackageDefinition` type that can describe:
  - package id
  - version
  - package docs metadata
  - VM-side API installation/prelude source
  - contributed surface types
  - optional dependencies
- [x] Create a `RuntimePackageRegistry`
- [x] Register the current `ui` and `kanban` packages in that registry
- [x] Move the current package-level docs metadata concept under `RuntimePackage`
- [x] Define how a `RuntimeBundle` declares required packages
- [x] Make runtime-session creation install required packages before loading the bundle
- [x] Ensure package installation order is dependency-aware
- [x] Do not create a compatibility layer where bundles can still assume implicit packages; require explicit package declaration after the cutover

### Slice 5: Separate bundle-local helpers from package APIs

- [x] Audit `00-runtimePrelude.vm.js` and identify which helpers are:
  - bundle-local app helpers
  - package APIs that should move into a package definition
- [x] Keep app-local helper composition like `renderKanbanPage(...)` as bundle-local code
- [x] Move any reusable package-level helper that should be available broadly out of bundle preludes and into package installation
- [x] Document the rule:
  - `RuntimePackage` owns public DSL/API namespaces
  - `RuntimeBundle` owns app-local helper functions
- [x] Update `os-launcher` bundle assembly to reflect the new split cleanly

### Slice 6: Host session/component rename

- [x] Rename `PluginCardSessionHost` to `RuntimeSurfaceSessionHost`
- [x] Rename props and local variables:
  - `currentCardId` -> `currentSurfaceId`
  - `cardState` -> `surfaceState`
- [x] Rename Redux selectors/actions in `pluginCardRuntime` where they expose runtime-card terminology
- [x] Rename the runtime registry for injected definitions:
  - `runtimeCardRegistry` -> `runtimeSurfaceRegistry`
- [x] Rename debug/editor helpers and payloads to the new runtime nouns where they refer to runtime entities rather than HyperCard UI labels
- [x] Keep the host capable of rendering the same runtime trees after the rename; this slice is vocabulary and boundary cleanup, not behavior change

### Slice 7: Desktop/windowing type rename

- [x] Rename `CardStackDefinition` to `RuntimeBundleDefinition`
- [x] Rename `CardDefinition` to `RuntimeSurfaceMeta` or equivalent final metadata type
- [x] Rename `homeCard` to `homeSurface`
- [x] Rename `cards` to `surfaces`
- [x] Update all launcher modules, stack files, stories, and tests to the new desktop/runtime type names
- [x] Decide whether `content.kind === 'card'` becomes `content.kind === 'surface'` in the same branch
- [x] If `content.kind` changes, update all window content adapters and desktop shell tests in the same cutover
- [x] Do not preserve both `card` and `surface` content kinds

### Slice 8: Package docs, prompt policy, and generated metadata alignment

- [ ] Update prompt policy and authoring guidance so coding agents speak in terms of:
  - runtime bundles
  - runtime surfaces
  - runtime packages
  - runtime surface types
- [x] Update `runtime-card-policy.md` and related prompt docs to reflect the new package/surface vocabulary
- [x] Update jsdocex package docs and generated `vmmeta` metadata to use package/surface nouns consistently
- [x] Update package docs examples:
  - `widgets.kanban.*` belongs to package `kanban`
  - `ui.*` belongs to package `ui`
- [x] Update doc-browser mount ids and labels if they currently encode old runtime-card naming where that naming is now wrong

### Slice 9: Runtime debug, editor, and docs tooling cleanup

- [x] Rename “Stacks & Cards” internals that refer to runtime entities as surfaces/bundles where appropriate
- [x] Update source/debug metadata fields to surface-oriented names
- [x] Update editor launch provenance and payloads to use runtime surface ids and bundle ids
- [x] Update doc-mount registration so runtime surface-type docs mount under surface-type paths and runtime surface docs mount under surface paths
- [x] Verify built-in source display still works after the rename

### Slice 10: App and inventory migration sweep

- [x] Update `os-launcher` to the new runtime bundle/surface/package vocabulary
- [x] Update `inventory` built-in VM surfaces and docs generation
- [x] Update any remaining first-party HyperCard stacks/apps that use the old runtime-card names
- [x] Update storybook fixtures, runtime fixtures, and examples
- [x] Update tests that assert legacy names in error messages or payload shapes
- [x] Remove all old public exports once the sweep is complete

### Slice 11: Validation and cleanup

- [x] Run targeted runtime unit/integration tests for `hypercard-runtime`
- [x] Run bundle-generation / `vmmeta` generation flows for `os-launcher` and `inventory`
- [x] Run targeted desktop/windowing tests after any `content.kind` rename
- [x] Run prompt/authoring tests for inventory if they assert old nouns
- [x] Run doc browser / debug tool tests after metadata and mount-path changes
- [x] Search the repo for remaining legacy runtime-core terms:
  - `renderCard(`
  - `eventCard(`
  - `defineCard(`
  - `CardStackDefinition`
  - `RuntimePack`
  - `homeCard`
  - `cardPacks`
- [x] Delete any temporary migration notes or stopgap comments before closing the ticket

### Slice 12: Explicitly out of scope for this transition

- [ ] Do not add compatibility aliases or wrappers
- [ ] Do not preserve dual prompt vocabularies
- [ ] Do not add a multi-language engine abstraction layer yet
- [ ] Do not split package installation into a second transitional system; go directly to the final package registry model

## Delivery

- [x] Run `docmgr doctor --ticket APP-23-HYPERCARD-RUNTIME-LANGUAGE-BOUNDARY --stale-after 30`
- [x] Upload the APP-23 bundle to reMarkable
- [x] Commit the APP-23 ticket docs
