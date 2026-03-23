---
Title: Intern guide to RuntimeSession, RuntimeBundle, RuntimePackage, RuntimeSurface, and RuntimeSurfaceType boundaries
Ticket: APP-23-HYPERCARD-RUNTIME-LANGUAGE-BOUNDARY
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - tooling
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/cards/types.ts
      Note: Current desktop and stack-level type model where card is still the primary noun
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/desktopShellTypes.ts
      Note: Current desktop shell props still expose a card stack and homeCard metaphor
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts
      Note: Current runtime worker contract where renderCard eventCard defineCard and cardId are the core transport nouns
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Current in-VM bootstrap API where ui and widgets helper objects are injected and defineCard style authoring globals are exposed
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx
      Note: Current registry rename target for host-side surface-type validation and rendering contracts
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx
      Note: Current host-side validator and renderer for the kanban.v1 surface type
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/uiSchema.ts
      Note: Current validator for the default ui.card.v1 surface type
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md
      Note: Current prompt policy that documents the authoring DSL/API for coding agents
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/00-runtimePrelude.vm.js
      Note: Current bundle-local VM helper library used by built-in kanban demo surfaces
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/docs/kanban-pack.docs.vm.js
      Note: Current jsdocex-style package docs for the kanban runtime package
Summary: Detailed design guide for replacing the overloaded card-centric runtime vocabulary with RuntimeSession, RuntimeBundle, RuntimePackage, RuntimeSurface, and RuntimeSurfaceType, while explicitly modeling packages as installable DSL/API bundles.
LastUpdated: 2026-03-10T19:02:00-04:00
WhatFor: Use this guide to understand the real layers in the current runtime system, especially the difference between installable packages, bundle-local app code, VM helper injection, host-side surface validation/rendering, and running runtime sessions.
WhenToUse: Use when planning runtime core refactors, package registries, pack/DSL evolution, or terminology cleanup across HyperCard runtime, desktop/windowing, prompt policy, docs, and tooling.
---

# Intern guide to RuntimeSession, RuntimeBundle, RuntimePackage, RuntimeSurface, and RuntimeSurfaceType boundaries

## Overview

The previous APP-23 framing was directionally correct about one thing: the current system overloads the word `card`. But it was still too narrow because it mostly tried to replace `card` with new runtime nouns. That is not enough. The deeper problem is that the system currently mixes together:

- runtime engine/session management
- loaded app/bundle code
- installable DSL/API bundles like `ui` and `kanban`
- app-defined renderable units
- host-side validation and rendering contracts
- prompt/docs metadata used by coding agents and internal tooling

Those are not all the same thing, and naming them more clearly matters because they are starting to evolve independently.

This updated guide uses the following terminology:

- `RuntimeSession`
- `RuntimeBundle`
- `RuntimePackage`
- `RuntimeSurface`
- `RuntimeSurfaceType`

This ticket intentionally does **not** optimize for future multi-language support yet. The team explicitly chose to keep the lower layer generic for now:

- `RuntimeSession`, not `JSRuntimeSession`
- `RuntimeBundle`, not `JSRuntimeBundle`

If a future multi-language runtime platform arrives, that can introduce a second-stage split later. Right now the bigger win is separating package/bundle/surface concerns from the overloaded `card` terminology.

## The key design shift

The core idea is this:

- a **RuntimePackage** is an installable/composable bundle of DSL/API behavior
- a **RuntimeBundle** is app-specific code loaded into a session
- a **RuntimeSurface** is an app-defined renderable/eventable unit inside a bundle
- a **RuntimeSurfaceType** is the host-side render contract a surface returns against
- a **RuntimeSession** is the live VM that runs a bundle with some set of packages available

That is a more faithful model of the current code than “a card is some code in QuickJS.”

## The current system, translated into the new model

### What is currently called a “card”

In the current runtime, a “card” is really:

- one named unit inside a loaded bundle
- with `render(...)`
- optional `handlers`
- and a pack/type id such as `ui.card.v1` or `kanban.v1`

That is exactly what `RuntimeSurface` should mean.

### What is currently called a “pack”

The current `RuntimePack` concept is too narrow to be your installable “package”.

Today it mostly covers:

- validation of returned trees
- host-side rendering of those trees

That is really a `RuntimeSurfaceType` definition, not the full installable thing.

For example:

- `kanban.v1` currently acts like a surface type id
- [kanbanV1Pack.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx) is the host validator/renderer for that type

But the **kanban package**, in the broader sense you want, is larger than that. It also includes:

- VM-side `widgets.kanban.*` helper API injection
- docs and prompt metadata
- jsdocex package docs
- maybe examples/scaffolds
- maybe bundle-local utility helpers or shared authoring helpers

So current `RuntimePack` should not become the system’s main noun. It should become `RuntimeSurfaceType` or `RuntimeSurfaceTypeDefinition`.

I recommend:

- `RuntimeSurfaceType` as the conceptual name
- `RuntimeSurfaceTypeDefinition` as the host registry type name

## The five real layers in the system

### 1. RuntimeSession

This is the live QuickJS runtime instance plus its session lifecycle.

Current implementation anchor:

- [runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts)

What it does:

- create a QuickJS runtime and context
- load the bootstrap harness
- load a runtime bundle
- call render and event entrypoints
- hot-define new surfaces
- dispose the session

This is the closest thing to the actual engine-management layer.

### 2. RuntimeBundle

This is the loaded app-specific code plus its bundle metadata.

Current implementation anchors:

- [pluginBundle.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/pluginBundle.ts)
- [contracts.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts)
- [00-runtimePrelude.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/00-runtimePrelude.vm.js)

What it currently contains:

- built-in helper code
- app-specific surface definitions
- docs/source metadata in separate generated paths
- bundle metadata like title, initial state, and surface ids

The important distinction is:

- `RuntimeBundle` is app code
- `RuntimePackage` is reusable capability

### 3. RuntimePackage

This is the installable/composable thing such as `ui` or `kanban`.

A package should be understood as the whole cross-boundary authoring/runtime contract bundle.

A `RuntimePackage` may contribute:

- VM-side DSL helper namespaces
- prompt-facing API docs/examples
- jsdocex package docs and symbol docs
- one or more `RuntimeSurfaceType` definitions
- host-side validators
- host-side renderers
- optional examples/scaffolds
- optional dependencies on other packages

This is the concept the user was reaching for when saying “I have a concept of `kanban` and `ui` as units”.

### 4. RuntimeSurface

This is the app-defined renderable/eventable unit inside a bundle.

It is what is currently called a “card”.

A `RuntimeSurface` has:

- an id
- a `RuntimeSurfaceType`
- a render function
- zero or more handlers
- optional metadata/source/docs

Examples today:

- `home`
- `kanbanSprintBoard`
- `lowStock`

### 5. RuntimeSurfaceType

This is the host/runtime render contract.

It tells the host:

- what kind of tree the VM may return
- how to validate that tree
- how to render that tree into real host widgets/components

Examples today:

- `ui.card.v1`
- `kanban.v1`

These ids can remain as-is initially if necessary, but conceptually they are surface type ids, not package ids.

## Static side vs runtime side

The user’s distinction here is good and should become part of the model.

### Runtime side

This is the live machinery:

- a running `RuntimeSession`
- bootstrap harness loaded into the VM
- a `RuntimeBundle` loaded into that session
- host calls to `render(...)` and `event(...)`
- host interpretation of returned trees/actions

In the current code:

```text
QuickJSCardRuntimeService
  -> create VM
  -> load stack-bootstrap.vm.js
  -> eval bundle source
  -> call __stackHost.render(...)
  -> call __stackHost.event(...)
```

### Static side

This is everything that defines what the runtime means before a session starts:

- app-specific bundle code
- package-provided VM APIs
- package docs and prompt policy
- package surface-type validators/renderers
- generated docs/source metadata

That is exactly why `RuntimePackage` is useful: it gives a name to the whole static cross-boundary capability bundle.

## Current code mapped to the new terms

### RuntimePackage: `ui`

Current package pieces:

- VM-side helper API:
  - [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js)
  - `__ui`
- prompt/docs:
  - [runtime-card-policy.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md)
- surface type validation:
  - [uiSchema.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/uiSchema.ts)
- host renderer:
  - [PluginCardRenderer.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardRenderer.tsx)
- current surface type id:
  - `ui.card.v1`

### RuntimePackage: `kanban`

Current package pieces:

- VM-side helper API:
  - [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js)
  - `__widgets.kanban.*`
- prompt/docs:
  - [runtime-card-policy.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md)
  - [kanban-pack.docs.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/docs/kanban-pack.docs.vm.js)
- surface type validation and renderer:
  - [kanbanV1Pack.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx)
- host widgets:
  - [runtime.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/runtime.ts)
  - [KanbanBoardView.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoardView.tsx)
- current surface type id:
  - `kanban.v1`

### RuntimeBundle: `os-launcher`

Current bundle assembly:

- [pluginBundle.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/pluginBundle.ts)

That file joins:

- runtime prelude
- home surface
- package docs file
- individual Kanban surface files

So the current bundle is:

```text
RuntimeBundle(os-launcher)
  includes:
    app-local helper prelude
    app-defined surfaces
    package docs source
```

### RuntimeSurface: `kanbanSprintBoard`

Current authored source:

- [kanbanSprintBoard.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/cards/kanbanSprintBoard.vm.js)

That surface:

- declares metadata with `__card__`
- declares docs with `__doc__` and `doc\`\``
- defines one render function and a handler set
- uses package-provided VM helpers `widgets.kanban.*`
- uses bundle-local helpers from `00-runtimePrelude.vm.js`

This is exactly why `RuntimeSurface` is the right noun. It is not “the bundle” and it is not “the package”.

## Why `RuntimePackage` is the missing term

The team’s current mental model was missing a name for the installable cross-boundary thing.

Without `RuntimePackage`, the system gets misdescribed in one of two wrong ways:

1. by calling everything a `card`
2. by calling the host validator/renderer pair a `pack` and pretending that is the whole story

Neither is right.

`RuntimePackage` is useful because it names the whole thing you want to register and install into sessions:

- VM API namespace
- docs/prompts
- host validators/renderers
- symbol metadata
- maybe examples

That is the thing a session should load “one or more of”.

## Proposed model in detail

### RuntimeSession

Recommended meaning:

- a running VM instance with loaded bundle and installed packages

Responsibilities:

- own engine lifecycle
- own loaded state/memory
- execute surface render/handler calls
- expose session health/metadata

### RuntimeBundle

Recommended meaning:

- app-specific authored code and metadata loaded into a session

Responsibilities:

- define surfaces
- declare initial state
- declare bundle title/description
- optionally declare package requirements

### RuntimePackage

Recommended meaning:

- installable cross-boundary capability bundle

Responsibilities:

- provide VM-side injected namespaces/helpers
- provide prompt/docs metadata
- provide one or more surface types
- register host validators/renderers for those types
- optionally provide examples and scaffolds

### RuntimeSurface

Recommended meaning:

- app-defined renderable and eventable thing inside a bundle

Responsibilities:

- render a tree
- respond to events with actions
- identify which surface type it uses

### RuntimeSurfaceType

Recommended meaning:

- host/runtime contract id for a render tree shape

Responsibilities:

- validate trees returned by surfaces
- render those trees through host widgets

## Proposed registries

This is the part the current architecture is still missing.

### RuntimePackageRegistry

Should register installable packages.

Recommended responsibilities:

- register package manifests/definitions
- resolve dependencies between packages
- expose package docs
- install selected packages into a new session bootstrap
- register surface types contributed by packages

### RuntimeSurfaceTypeRegistry

Should register host render/validation contracts.

This is basically what current `runtimePackRegistry.tsx` already is, just under the wrong name.

Recommended responsibilities:

- register surface type definitions
- validate trees by type id
- render trees by type id

### RuntimeSurfaceRegistry

Optional, but likely useful for:

- runtime-defined surfaces injected after bundle load
- editors/debuggers
- artifact-driven surfaces

This is close to current `runtimeCardRegistry`, but the new name would be more accurate.

## Proposed type shapes

### RuntimePackage

```ts
interface RuntimePackageManifest {
  packageId: string;
  title: string;
  version: string;
  description?: string;
  dependencies?: string[];
}

interface RuntimePackageDefinition {
  manifest: RuntimePackageManifest;
  installVM?(api: RuntimePackageInstallAPI): void;
  docs?: RuntimePackageDocs;
  surfaceTypes: RuntimeSurfaceTypeDefinition[];
}
```

There are two implementation strategies for `installVM`:

- source-based prelude injection
- structured bootstrap contribution registration

Current system is source-based.

### RuntimeSurfaceType

```ts
interface RuntimeSurfaceTypeDefinition<TTree = unknown> {
  typeId: string;
  packageId: string;
  validateTree(value: unknown): TTree;
  render(props: {
    tree: TTree;
    onEvent: (handler: string, args?: unknown) => void;
  }): ReactNode;
}
```

### RuntimeBundle

```ts
interface RuntimeBundleMeta {
  bundleId?: string;
  title: string;
  description?: string;
  requiredPackages?: string[];
  initialSessionState?: unknown;
  initialSurfaceState?: Record<string, unknown>;
  surfaces: string[];
  surfaceTypes?: Record<string, string>;
}
```

### RuntimeSurface

```ts
interface RuntimeSurfaceDefinition {
  id: string;
  typeId: string;
  render(ctx: { state: unknown }): unknown;
  handlers?: Record<string, (ctx: { state: unknown; dispatch(action: RuntimeAction): void }, args: unknown) => void>;
}
```

## Proposed rename map

### Core runtime

```text
Current                          Proposed
---------------------------------------------------------
LoadedStackBundle                RuntimeBundleMeta
loadStackBundle                  loadRuntimeBundle
cardPacks                        surfaceTypes
initialCardState                 initialSurfaceState
```

### Runtime unit

```text
Current                          Proposed
---------------------------------------------------------
CardId                           RuntimeSurfaceId
renderCard                       renderRuntimeSurface
eventCard                        eventRuntimeSurface
defineCard                       defineRuntimeSurface
defineCardRender                 defineRuntimeSurfaceRender
defineCardHandler                defineRuntimeSurfaceHandler
runtimeCardRegistry              runtimeSurfaceRegistry
PluginCardSessionHost            RuntimeSurfaceSessionHost
```

### Package/type registry

```text
Current                          Proposed
---------------------------------------------------------
RuntimePack                      RuntimeSurfaceType
runtimePackRegistry              runtimeSurfaceTypeRegistry
registerRuntimePack              registerRuntimeSurfaceType
getRuntimePackOrThrow            getRuntimeSurfaceTypeOrThrow
```

### Desktop layer

```text
Current                          Proposed
---------------------------------------------------------
CardDefinition                   RuntimeSurfaceMeta
CardStackDefinition              RuntimeBundleDefinition
homeCard                         homeSurface
cards                            surfaces
content.kind === 'card'          content.kind === 'surface' (or keep temporarily as UX alias)
```

## Static setup vs runtime setup

This section directly captures the user’s mental model because it is the right one.

### Runtime setup

```text
RuntimeSession
  -> VM engine
  -> bootstrap harness
  -> installed RuntimePackages
  -> loaded RuntimeBundle
  -> host calls render/event on RuntimeSurfaces
  -> host validates/renders via RuntimeSurfaceTypes
```

### Static setup

```text
RuntimePackage
  -> VM-side DSL/API injection
  -> docs and prompt metadata
  -> host-side validator
  -> host-side renderer
  -> examples/scaffolds

RuntimeBundle
  -> app-specific surface definitions
  -> bundle-local helpers
  -> initial state
  -> metadata
```

This is the strongest argument for why package and bundle must be separate nouns.

## How current files map to the new static/runtime split

### Package-side files

VM-side DSL/API injection:

- [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js)

Prompt-facing docs:

- [runtime-card-policy.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md)

Package docs:

- [kanban-pack.docs.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/docs/kanban-pack.docs.vm.js)

Host validation/rendering:

- [uiSchema.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/uiSchema.ts)
- [kanbanV1Pack.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx)

### Bundle-side files

Bundle assembly:

- [pluginBundle.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/pluginBundle.ts)

Bundle-local helpers:

- [00-runtimePrelude.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/00-runtimePrelude.vm.js)

Surface definitions:

- [kanbanSprintBoard.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/cards/kanbanSprintBoard.vm.js)
- the other files under `apps/os-launcher/src/domain/vm/cards/`

### Runtime-side files

Session lifecycle and VM calls:

- [runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts)

Host projection/render dispatch:

- [PluginCardSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx)

## Direct-cutover strategy

I still recommend a direct cutover, but now the cutover should be organized around the package/bundle/surface split rather than just a simpler rename.

### Phase 1: rename pack to surface type

Change:

- `RuntimePack` -> `RuntimeSurfaceType`
- `runtimePackRegistry` -> `runtimeSurfaceTypeRegistry`

Reason:

- this is the least ambiguous correction and the existing code already behaves that way

### Phase 2: rename card to surface in runtime core

Change:

- runtime service methods
- worker transport contracts
- runtime registries
- host session component names

Reason:

- makes the runtime core less UI-metaphor-bound

### Phase 3: introduce RuntimePackage explicitly

Change:

- package registry and manifests
- bootstrap contributions by package
- docs/prompt metadata organized by package
- bundle loading declares required packages

Reason:

- lets sessions be created from multiple packages plus app code

### Phase 4: rename stack/bundle terminology

Change:

- `CardStackDefinition` -> `RuntimeBundleDefinition`
- `homeCard` -> `homeSurface`
- `cards` -> `surfaces`

Reason:

- finishes aligning desktop/runtime naming with the new conceptual model

### Phase 5: optional UX terminology cleanup

Change:

- whether user-facing UI still says “Cards”

Reason:

- should be a product call, not a blocker for runtime cleanup

## Pseudocode for the target system

### Package registry

```ts
class RuntimePackageRegistry {
  register(definition: RuntimePackageDefinition): void;
  get(packageId: string): RuntimePackageDefinition;
  list(): RuntimePackageManifest[];
  resolveInstallOrder(packageIds: string[]): string[];
}
```

### Session creation

```ts
async function createRuntimeSession(input: {
  bundleCode: string;
  packageIds: string[];
}) {
  const session = createVM();
  const packages = packageRegistry.resolveInstallOrder(input.packageIds);

  loadRuntimeHarness(session);
  for (const packageId of packages) {
    installRuntimePackageIntoVM(session, packageRegistry.get(packageId));
  }
  loadRuntimeBundle(session, input.bundleCode);
  return session;
}
```

### Bundle authoring shape

```js
defineRuntimeBundle(() => ({
  id: 'os-launcher',
  title: 'go-go-os Launcher',
  requiredPackages: ['ui', 'kanban'],
  surfaces: {
    home: { type: 'ui.v1', render() { ... } },
    sprintBoard: { type: 'kanban.v1', render() { ... } },
  },
}));
```

## Testing strategy

### Package layer

- package registry tests
- docs extraction tests
- prompt package tests
- VM injection tests

### Surface type layer

- validator tests
- renderer tests
- registry lookup tests

### Bundle layer

- bundle assembly tests
- bundle metadata tests
- required package resolution tests

### Runtime session layer

- runtime service integration tests
- host/session tests
- surface render/event tests

## Final recommendation

Use this terminology stack:

- `RuntimeSession`
- `RuntimeBundle`
- `RuntimePackage`
- `RuntimeSurface`
- `RuntimeSurfaceType`

Interpret the current system like this:

- `ui` and `kanban` are packages
- `ui.card.v1` and `kanban.v1` are surface types
- `home`, `kanbanSprintBoard`, and `lowStock` are surfaces
- `os-launcher` and `inventory` are bundles
- each live QuickJS instance is a session

That model matches the real code much better than the current `card`-centric language.

## Related

- [index.md](../index.md)
- [tasks.md](../tasks.md)
- [changelog.md](../changelog.md)
- [01-investigation-diary.md](../reference/01-investigation-diary.md)
