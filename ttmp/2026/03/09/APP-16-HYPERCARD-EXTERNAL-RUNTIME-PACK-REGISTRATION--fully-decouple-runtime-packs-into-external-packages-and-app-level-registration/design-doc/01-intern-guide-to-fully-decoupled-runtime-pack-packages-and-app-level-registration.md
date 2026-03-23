---
Title: Intern guide to extracting concrete runtime packages from runtime core and registering them from the host app
Ticket: APP-16-HYPERCARD-EXTERNAL-RUNTIME-PACK-REGISTRATION
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.ts
      Note: Current logical package registry to evolve from built-in definitions to externally registered packages
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx
      Note: Current surface-type registry that still statically imports concrete surface renderers
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: Runtime session service that currently installs package preludes from runtime-core-owned manifests
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Generic VM bootstrap that should remain in runtime core and consume package APIs from registration
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx
      Note: Current concrete kanban surface-type implementation that should move out of runtime core
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/runtime.ts
      Note: Current kanban host widget seam that informs the external package split
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/App.tsx
      Note: App bootstrap seam where runtime package registration should happen
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/domain/pluginBundle.ts
      Note: Example bundle that already declares packageIds and can validate the external-registration model
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.ts
      Note: Second first-party bundle proving the final design must support multiple host apps and multiple bundle owners
ExternalSources: []
Summary: Detailed intern guide for extracting concrete runtime packages such as `kanban` from hypercard-runtime, leaving runtime core generic, and making host applications explicitly register packages and surface types.
LastUpdated: 2026-03-11T11:58:00-04:00
WhatFor: Use this guide to understand the current post-APP-23 architecture, identify exactly what is still too coupled, and implement the external runtime package extraction without wrappers or backward-compatibility layers.
WhenToUse: Use when implementing APP-16, when reviewing whether a file belongs in runtime core or in a concrete package, or when onboarding an intern to the package extraction work.
---

# Intern guide to extracting concrete runtime packages from runtime core and registering them from the host app

## Executive Summary

APP-23 cleaned up the vocabulary. We now have a coherent runtime model:

- `RuntimeSession`
- `RuntimeBundle`
- `RuntimePackage`
- `RuntimeSurface`
- `RuntimeSurfaceType`

That rename matters because it makes the current architecture legible. Once you can name the pieces correctly, the remaining design problem becomes obvious:

- runtime core now has generic package and surface-type registries
- but runtime core still physically owns the concrete `ui` and `kanban` packages
- runtime core still physically owns concrete surface-type validators and renderers
- host widgets and pack-specific view logic are still split across `hypercard-runtime` and `rich-widgets`

So APP-16 is not inventing a package system from scratch. It is finishing the architecture by moving concrete runtime packages out of runtime core and into external packages that the host application registers explicitly.

The first target is `kanban`, because it is already the clearest example of a package that spans:

- VM-side DSL API
- docs and prompting metadata
- host validation
- host rendering
- reusable widgets
- examples and runtime docs

The next target after `kanban` is explicitly `ui`. APP-16 no longer treats `ui` as a permanent or temporary runtime-core exception. The intended end state is that runtime core owns no concrete packages at all.

This guide explains:

- what the current post-APP-23 system actually looks like
- what still belongs in runtime core
- what should move into a dedicated concrete package
- what the host app should register
- how to implement that extraction in reviewable slices

## Why This Ticket Exists

Before APP-23, APP-16 was easy to describe but fuzzy in detail. The code still used a mixed stack/card/pack vocabulary, so “decouple runtime packs” was directionally right but not precise.

After APP-23, the problem is sharper:

1. Runtime core now correctly models package installation and surface typing.
2. Concrete package logic is still compiled into runtime core.
3. Therefore runtime core still owns things it should only host.

The architectural goal is:

```text
runtime core hosts packages
runtime core does not define concrete packages
runtime core hosts surface types
runtime core does not hardcode concrete surface-type implementations
host app chooses which packages and surface types exist in the running shell
```

That is the design principle APP-16 makes executable.

## The Conceptual Model

This is the most important section for a new intern. Learn this model first.

### RuntimeSession

A `RuntimeSession` is one running QuickJS-backed VM session plus host-side bookkeeping.

Today the main implementation lives in:

- [runtimeService.ts](../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts)

Responsibilities:

- create QuickJS runtime/context
- install package preludes before bundle evaluation
- load a runtime bundle
- call render/event entrypoints
- return JSON-like trees and validated actions

### RuntimeBundle

A `RuntimeBundle` is app-authored source code plus metadata describing:

- bundle id
- title/description
- required `packageIds`
- initial state
- surfaces
- surface types

Current VM-side declaration:

- [stack-bootstrap.vm.js](../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js)
  - `defineRuntimeBundle(...)`

Current bundle examples:

- [os-launcher pluginBundle.ts](../../../../../../../wesen-os/apps/os-launcher/src/domain/pluginBundle.ts)
- [inventory pluginBundle.ts](../../../../../../../wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.ts)

### RuntimeSurface

A `RuntimeSurface` is the app-defined renderable and eventable unit inside a bundle.

Today the VM-side authoring entrypoint is:

- `defineRuntimeSurface(...)`

Examples:

- `kanbanSprintBoard`
- `home`
- `report`

### RuntimeSurfaceType

A `RuntimeSurfaceType` is the host/runtime contract for a returned tree.

Examples:

- `ui.card.v1`
- `kanban.v1`

Current registry:

- [runtimeSurfaceTypeRegistry.tsx](../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx)

Responsibilities:

- validate a returned tree
- render a validated tree with host React components

### RuntimePackage

A `RuntimePackage` is the installable capability bundle.

That is the critical concept APP-16 cares about.

A runtime package can contribute:

- VM-side API namespaces
- package docs metadata
- dependencies on other packages
- one or more `RuntimeSurfaceType`s
- host validators and renderers
- example docs and fixtures

Current registry:

- [runtimePackageRegistry.ts](../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.ts)

Current first-party packages:

- `ui`
- `kanban`

## Current State: What Exists Today

The current system already has the skeleton of the final architecture.

### Current runtime-core registries

```text
hypercard-runtime
  runtimePackageRegistry.ts
    owns generic package registration APIs only

  runtimeSurfaceTypeRegistry.tsx
    owns generic surface-type registration APIs only
```

### Current runtime load flow

```text
host chooses bundle source
  -> QuickJSRuntimeService.loadRuntimeBundle(stackId, sessionId, packageIds, code)
  -> resolveRuntimePackageInstallOrder(packageIds)
  -> install each package prelude into QuickJS
  -> eval bundle code
  -> bundle exposes surfaces and surfaceTypes
  -> host render path validates/render via runtimeSurfaceTypeRegistry
```

### Current physical ownership state

Today:
- `@hypercard/ui-runtime` owns:
  - `ui.package.vm.js`
  - `ui.card.v1` validation and rendering
  - UI surface-type docs metadata
- `@hypercard/kanban-runtime` owns:
  - `kanban.package.vm.js`
  - `kanban.v1` validation and rendering
  - Kanban host widgets and stories
  - Kanban surface-type docs metadata
- runtime core now owns only the generic registries and runtime lifecycle
- host apps register `ui` and `kanban` explicitly at startup

So the concrete dependency chain now looks like:

```text
wesen-os / inventory host app
  -> @hypercard/hypercard-runtime (generic registries + runtime lifecycle)
  -> @hypercard/ui-runtime
  -> @hypercard/kanban-runtime
```

That is the intended APP-16 direction. The remaining work is not “extract Kanban and UI” anymore. The remaining work is validating follow-on ownership seams, deciding whether more first-party packages should move out next, and cleaning up any docs/tests that still describe the old built-in model.

## What Belongs In Runtime Core

Runtime core should remain small and generic.

It should own:

- `RuntimeSession` lifecycle
- QuickJS bootstrapping and shutdown
- generic bundle loading
- generic package installation mechanism
- generic package registry interfaces
- generic surface-type registry interfaces
- generic artifact projection and host session plumbing
- generic debug/editor hooks

It should not own:

- package-specific VM API preludes
- package-specific host widgets
- package-specific surface-type validation
- package-specific surface-type rendering
- package-specific docs metadata

That is the key extraction rule.

## What Belongs In A Concrete Runtime Package

Using `kanban` as the concrete example, the external package should own:

- `packageId: 'kanban'`
- VM-side API prelude that exports `widgets.kanban.*`
- package docs metadata
- `kanban.v1` surface-type registration
- host-side tree validator
- host-side renderer
- pack-specific React widgets and host types
- Storybook stories for pack-specific host widgets
- example package docs and maybe example bundle helpers

It should not own:

- generic QuickJS lifecycle
- generic bundle loader
- generic runtime debug infrastructure
- app-specific launcher decisions

## What Belongs In The Host App

The host app should own composition.

For `wesen-os`, that means:

- which concrete packages to register
- which surface types to register
- whether `kanban` is available in this shell at all
- demo launchers and runtime debug shortcuts
- startup registration order

The host app is the composition boundary because it is allowed to depend on:

- runtime core
- concrete package packages
- app-local demo bundles

without creating a package cycle.

## Diagram: Current Versus Target

### Previous state

```text
hypercard-runtime
  ├─ runtimePackageRegistry
  │   ├─ ui.package.vm.js
  │   └─ kanban.package.vm.js
  ├─ runtimeSurfaceTypeRegistry
  │   ├─ ui.card.v1 renderer
  │   └─ kanban.v1 renderer
  └─ runtimeService
       installs built-in packages

rich-widgets
  └─ kanban runtime/view code

wesen-os
  └─ consumes runtime already preloaded with concrete packages
```

### Current state

```text
hypercard-runtime
  ├─ RuntimePackageRegistry API
  ├─ RuntimeSurfaceTypeRegistry API
  └─ RuntimeSession / RuntimeBundle runtime core

@hypercard/ui-runtime
  ├─ ui package prelude
  ├─ ui docs metadata
  └─ ui.card.v1 validator/renderer

@hypercard/kanban-runtime
  ├─ kanban package prelude
  ├─ kanban docs metadata
  ├─ kanban.v1 validator/renderer
  └─ kanban host widgets

wesen-os
  ├─ registerRuntimePackage(ui)
  ├─ registerRuntimePackage(kanban)
  ├─ registerRuntimeSurfaceType(ui.card.v1)
  ├─ registerRuntimeSurfaceType(kanban.v1)
  └─ launch bundles that declare packageIds
```

The implementation order that actually landed was:

1. make runtime-core registration explicit
2. extract `kanban`
3. extract `ui`

The remaining APP-16 work is now validation and cleanup around the extracted package model.

## Why Package And Surface-Type Registration Must Be Separate

This is easy to get wrong.

`RuntimePackage` and `RuntimeSurfaceType` are related, but they are not the same thing.

A package contributes capabilities:

- VM APIs
- docs
- dependencies
- perhaps multiple surface types

A surface type contributes a host contract:

- validation
- rendering

One package may contribute more than one surface type later.
One surface type should still have exactly one validator/renderer pair.

So the registries should remain separate, even when a package registers its own surface types.

Pseudo-shape:

```ts
interface RuntimePackageDefinition {
  packageId: string;
  version: string;
  summary?: string;
  docsMetadata?: Record<string, unknown>;
  installPrelude: string;
  surfaceTypes: string[];
  dependencies?: string[];
}

interface RuntimeSurfaceTypeDefinition<TTree> {
  packId: string;
  validateTree(value: unknown): TTree;
  render(props: { tree: TTree; onEvent: (handler: string, args?: unknown) => void }): ReactNode;
}
```

The concrete package can export both definitions, but runtime core should store them in separate registries.

## Proposed Final Package Shape

The first extraction target should be a dedicated Kanban package.

Tentative physical package:

```text
packages/runtime-package-kanban/
  src/
    index.ts
    packageDefinition.ts
    surfaceTypes/
      kanbanV1SurfaceType.tsx
    vm/
      kanban.package.vm.js
    docs/
      kanban-package.docs.ts
    widgets/
      KanbanBoardView.tsx
      KanbanHighlights.tsx
      ...
    stories/
      ...
```

Potential exports:

```ts
export { kanbanRuntimePackageDefinition } from './packageDefinition';
export { kanbanV1SurfaceTypeDefinition } from './surfaceTypes/kanbanV1SurfaceType';
```

Then runtime core would stop importing Kanban directly.

## Proposed Host Bootstrap API

Runtime core should expose registration, not ownership.

Pseudo-API:

```ts
const runtimePackages = createRuntimePackageRegistry();
const runtimeSurfaceTypes = createRuntimeSurfaceTypeRegistry();

registerRuntimePackage(runtimePackages, uiRuntimePackageDefinition);
registerRuntimePackage(runtimePackages, kanbanRuntimePackageDefinition);

registerRuntimeSurfaceType(runtimeSurfaceTypes, uiCardV1SurfaceTypeDefinition);
registerRuntimeSurfaceType(runtimeSurfaceTypes, kanbanV1SurfaceTypeDefinition);

bootWesenOs({
  runtimePackages,
  runtimeSurfaceTypes,
});
```

Or, if runtime core keeps module-level registries:

```ts
registerRuntimePackage(uiRuntimePackageDefinition);
registerRuntimePackage(kanbanRuntimePackageDefinition);

registerRuntimeSurfaceType(uiCardV1SurfaceTypeDefinition);
registerRuntimeSurfaceType(kanbanV1SurfaceTypeDefinition);
```

The important property is not whether the registry is instance-based or module-global. The important property is that runtime core no longer imports the concrete package modules by itself.

### Phase 1 implementation decision

The first implementation checkpoint for APP-16 chose:

- module-global registries
- explicit `register*` calls
- no import-time self-registration inside the registries themselves

That means the live runtime core now has a clearer intermediate shape:

- the registries can be empty
- built-in runtime defaults are registered through an explicit helper
- host/runtime entrypoints call that helper intentionally

That intermediate step is now complete. The current runtime no longer relies on import-time built-in registration and the live host apps register the extracted first-party packages explicitly.

## Detailed Implementation Plan

### Phase 1: Refresh Runtime Core To Be Extraction-Ready

Goal:

- make runtime core registration seams explicit
- keep behavior unchanged

Tasks:

- verify `runtimePackageRegistry.ts` and `runtimeSurfaceTypeRegistry.tsx` can accept external registrations cleanly
- make sure any remaining built-in registration side effects are easy to delete
- document exactly what runtime core expects from package definitions and surface-type definitions

Review checkpoint:

- after this phase, runtime core should still work exactly as today
- the only difference should be that it is obvious how built-in definitions would move out

### Phase 2: Create The Concrete Kanban Package

Goal:

- physically move Kanban-owned files together

Move candidates:

- `kanban.package.vm.js`
- `kanbanV1Pack.tsx`
- Kanban host widget files from `rich-widgets/src/kanban/*`
- Kanban-specific docs metadata

Rules:

- no compatibility re-export maze
- if runtime core imports break, fix imports to the new package directly
- use one direct path after the extraction

Review checkpoint:

- Kanban code should no longer be split across runtime core and rich-widgets in a way that hides ownership

### Phase 3: Stop Runtime Core From Owning Built-In Kanban

Goal:

- runtime core stops statically registering Kanban

Tasks:

- remove Kanban definition imports from runtime core
- move registration into `wesen-os` bootstrap
- keep bundles explicitly declaring `packageIds`

Review checkpoint:

- `kanban` works only because `wesen-os` registered it
- if registration is removed, Kanban bundle load fails with the correct unknown-package or unknown-surface-type error

### Phase 4: Extract `ui`

This phase is no longer hypothetical. APP-16 now explicitly took the cleaner path:

- `ui` is extracted into `@hypercard/ui-runtime`
- runtime core owns no concrete first-party packages
- host apps register both `ui` and `kanban`

That keeps the final architecture cleaner:

```text
runtime core owns no concrete packages
```

### Phase 5: Final Validation And Cleanup

Required validation:

- runtime unit tests
- bundle tests for `os-launcher`
- bundle tests for inventory
- runtime debug / editor flows
- docs mounts for package and surface docs
- failure-path tests:
  - unknown package
  - missing registration
  - dependency ordering

## Risks

### Risk 1: Accidental compatibility layering

It will be tempting to keep both:

- old runtime-core imports
- new app-level registration

Do not do that. It creates a half-extracted architecture that is harder to reason about than the current one.

### Risk 2: Over-extracting app-local helpers

Bundle-local helpers like `renderKanbanPage(...)` are not automatically public package API.

Rule:

- if a helper is app-specific composition, keep it bundle-local
- if it defines public DSL/installable behavior, move it into the package

### Risk 3: Confusing package docs with prompt policy

Package docs and prompt policy are related but distinct.

- prompt policy tells a coding model what to emit
- package docs describe the runtime APIs and symbols

Both should remain aligned, but do not collapse them into one file format by accident during extraction.

## File-by-File Checklist

### Runtime Core

- [runtimePackageRegistry.ts](../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.ts)
- [runtimeSurfaceTypeRegistry.tsx](../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx)
- [runtimeService.ts](../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts)
- [stack-bootstrap.vm.js](../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js)

### Current Kanban-owned files

- [kanbanV1Pack.tsx](../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx)
- [runtime.ts](../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/runtime.ts)
- [KanbanBoardView.tsx](../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoardView.tsx)
- [KanbanBoard.tsx](../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoard.tsx)

### Host Composition

- [App.tsx](../../../../../../../wesen-os/apps/os-launcher/src/App.tsx)
- [modules.tsx](../../../../../../../wesen-os/apps/os-launcher/src/app/modules.tsx)

## Recommended Review Order

1. Read `runtimePackageRegistry.ts` and `runtimeSurfaceTypeRegistry.tsx`
2. Read `runtimeService.ts` package installation flow
3. Read `stack-bootstrap.vm.js` package API registration flow
4. Read `kanbanV1Pack.tsx`
5. Read the Kanban widget runtime files in `rich-widgets`
6. Read `os-launcher` startup/bootstrap files
7. Return to this ticket and compare the target extraction plan against the current code

## Final Recommendation

APP-16 should now be understood as:

- not a runtime naming ticket
- not a package-registry invention ticket
- not a shortcut launcher ticket

It is the concrete extraction ticket that finishes the architecture after APP-23.

The right implementation order is:

1. make runtime core purely generic
2. move Kanban into a concrete external package
3. register that package from the host app
4. then decide whether `ui` remains a special case or gets extracted too

That path gives you the clean end state without compatibility layers and without leaving runtime core half-owned by concrete packages.
