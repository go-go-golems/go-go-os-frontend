# Runtime Concepts Guide

Last verified against source: 2026-03-11

This guide explains the current runtime model used by `@hypercard/hypercard-runtime` after the APP-23 rename and package work. It is meant to answer a simple question for developers:

What are the actual architectural pieces in this system, and where does each piece live?

The short answer is:

- a `RuntimeSession` is a running QuickJS-backed session
- a `RuntimeBundle` is app-authored source code plus metadata
- a `RuntimePackage` is an installable DSL/API capability bundle
- a `RuntimeSurface` is one renderable/eventable unit inside a bundle
- a `RuntimeSurfaceType` is the host/runtime contract that validates and renders a surface tree

This guide goes through each one, shows the current file locations, and explains the static and runtime halves of the system.

## Why This Model Exists

Earlier versions of the runtime used `card` and `stack` almost everywhere. That naming became misleading once the system started supporting:

- multiple DSL/API families such as `ui` and `kanban`
- reusable runtime packages
- generated docs and source metadata
- nontrivial runtime debug/editor tooling

The current model is more explicit:

```text
RuntimeSession
  runs
RuntimeBundle
  which declares RuntimePackages
  and exposes RuntimeSurfaces
  whose trees are interpreted by RuntimeSurfaceTypes
```

That is the mental model to use when reading the code.

## The Two Halves Of The System

It helps to separate the system into a static side and a runtime side.

### Static side

The static side is everything that exists before a VM is started:

- package definitions
- bundle source code
- VM-side DSL helpers/preludes
- host-side validators and renderers
- package docs and surface docs
- generated `vmmeta`

### Runtime side

The runtime side is everything that happens after a session starts:

- create QuickJS runtime/context
- install package preludes
- evaluate a bundle
- read bundle metadata
- render a surface
- send handler events
- validate returned actions

Diagram:

```text
Static side
  package definitions
  bundle source
  docs / vmmeta
      |
      v
Runtime side
  RuntimeSession
    -> install RuntimePackages
    -> load RuntimeBundle
    -> render RuntimeSurfaces
    -> validate/render via RuntimeSurfaceTypes
```

## RuntimeSession

A `RuntimeSession` is one running runtime instance.

Current implementation:

- [runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts)

Key responsibilities:

- create a QuickJS runtime and context
- load the generic bootstrap source
- install runtime packages in dependency order
- evaluate bundle code
- call `renderRuntimeSurface(...)`
- call `eventRuntimeSurface(...)`
- dispose sessions cleanly

Key public type names and methods:

- `QuickJSRuntimeService`
- `loadRuntimeBundle(...)`
- `renderRuntimeSurface(...)`
- `eventRuntimeSurface(...)`
- `defineRuntimeSurface(...)`

This is runtime infrastructure. It should not know Kanban-specific UI details.

## RuntimeBundle

A `RuntimeBundle` is app-authored program code plus metadata.

The VM-side authoring API is defined by the bootstrap:

- [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js)

The bundle author declares:

- bundle id/title/description
- `packageIds`
- `initialSessionState`
- `initialSurfaceState`
- `surfaces`

Example bundle sources:

- [os-launcher plugin bundle](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/pluginBundle.ts)
- [inventory plugin bundle](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.ts)

Example VM-side declaration shape:

```js
defineRuntimeBundle(() => ({
  id: 'inventory',
  title: 'Shop Inventory',
  packageIds: ['ui'],
  surfaces: {
    home: ...,
    browse: ...,
  },
}));
```

Important rule:

- bundle-local helpers belong in the bundle prelude
- reusable public DSL belongs in runtime packages

## RuntimePackage

A `RuntimePackage` is the installable capability bundle.

Current registry:

- [runtimePackageRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.ts)

Current built-in examples:

- `ui`
- `kanban`

A runtime package can contribute:

- a package id and version
- package docs metadata
- a VM install prelude
- dependencies on other packages
- one or more surface types

Current definition shape:

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
```

Current package prelude files:

- [ui.package.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packages/ui.package.vm.js)
- [kanban.package.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packages/kanban.package.vm.js)

Current install flow:

1. bundle declares `packageIds`
2. runtime resolves dependency order
3. each package prelude is eval’d into QuickJS
4. the package registers VM-side APIs using `registerRuntimePackageApi(...)`
5. bundle code runs and can access those APIs

Pseudo-flow:

```ts
const ordered = resolveRuntimePackageInstallOrder(bundle.packageIds);
for (const packageId of ordered) {
  const runtimePackage = getRuntimePackageOrThrow(packageId);
  eval(runtimePackage.installPrelude);
}
```

## RuntimeSurface

A `RuntimeSurface` is one renderable/eventable unit inside a bundle.

Current VM-side authoring entrypoint:

- `defineRuntimeSurface(...)`

Examples:

- inventory `home`
- inventory `browse`
- `kanbanSprintBoard`
- `kanbanIncidentCommand`

Surface responsibilities:

- implement `render({ state })`
- optionally expose `handlers`
- declare a `packId` / surface type id

Example:

```js
defineRuntimeSurface(
  'kanbanSprintBoard',
  ({ widgets }) => ({
    render({ state }) {
      return widgets.kanban.page(...);
    },
    handlers: {
      moveTask(context, args) {
        ...
      },
    },
  }),
  'kanban.v1',
);
```

This is the thing the host actually opens, rerenders, and sends events to.

## RuntimeSurfaceType

A `RuntimeSurfaceType` is the contract for a returned tree.

Current registry:

- [runtimeSurfaceTypeRegistry.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx)

Current built-in surface types:

- `ui.card.v1`
- `kanban.v1`

What a surface type owns:

- `validateTree(value)`
- `render({ tree, onEvent })`

This is a host concern, not a VM concern.

Current examples:

- `ui.card.v1`
  - validate with [uiSchema.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/uiSchema.ts)
  - render with [PluginCardRenderer.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardRenderer.tsx)
- `kanban.v1`
  - validate and render in [kanbanV1Pack.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx)

Important distinction:

- `kanban` is a runtime package
- `kanban.v1` is a runtime surface type

The package installs APIs. The surface type interprets returned trees.

## Where The VM-Side DSL Lives

Developers often ask: where does `ui.*` or `widgets.kanban.*` actually come from?

Answer:

- the generic registration mechanism is in [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js)
- the concrete API definitions are in package preludes such as:
  - [ui.package.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packages/ui.package.vm.js)
  - [kanban.package.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packages/kanban.package.vm.js)

The flow looks like:

```text
stack-bootstrap.vm.js
  defines registerRuntimePackageApi(...)

ui.package.vm.js
  calls registerRuntimePackageApi('ui', { ui: __ui })

kanban.package.vm.js
  calls registerRuntimePackageApi('kanban', { widgets: __kanbanWidgets })

bundle code
  receives collected package APIs in defineRuntimeBundle(...) and defineRuntimeSurface(...)
```

That means the DSL object crossing the VM boundary is really:

- a VM-side object graph installed by package preludes
- merged into the runtime package API namespace
- passed into bundle and surface factories by the bootstrap

## Where Docs Live

There are two distinct documentation layers.

### Prompt / authoring policy

These docs tell an AI author what shape to emit.

Example:

- [runtime-card-policy.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md)

This is still a prompt filename from the older artifact/protocol side, but the contents now teach runtime bundles, surfaces, packages, and surface types.

### Structured package/surface docs

These are authored near the VM code and extracted into `vmmeta`.

Examples:

- package docs:
  - [kanban-pack.docs.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/docs/kanban-pack.docs.vm.js)
  - [inventory-pack.docs.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/domain/vm/docs/inventory-pack.docs.vm.js)
- surface docs:
  - [kanbanSprintBoard.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/cards/kanbanSprintBoard.vm.js)

Generated outputs:

- [kanbanVmmeta.generated.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts)
- [inventoryVmmeta.generated.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/domain/generated/inventoryVmmeta.generated.ts)

## The Host Boundary

The host boundary is:

1. install packages
2. load bundle
3. ask the session to render a surface
4. validate the returned tree based on its surface type
5. render the host-side React UI
6. send handler events back into the session
7. validate returned runtime actions

Pseudo-code:

```ts
const bundle = await runtime.loadRuntimeBundle(stackId, sessionId, packageIds, code);
const rawTree = runtime.renderRuntimeSurface(sessionId, surfaceId, projectedState);
const reactNode = renderRuntimeSurfaceTree(surfaceTypeId, rawTree, onEvent);
```

That boundary is why the architecture separates packages and surface types:

- package = what the VM can use
- surface type = how the host interprets what comes back

## What Still Intentionally Uses `card`

Not every `card` string in the repo is stale.

The main intentional carve-out is the external artifact protocol:

- `hypercard.card.v2`
- backend extractor/event names
- some prompt filenames
- timeline card renderer names where they explicitly parse the artifact envelope

Those are external protocol or legacy document names. They are not runtime-core execution concepts.

Rule of thumb:

- if the code is about RuntimeSession / RuntimeBundle / RuntimeSurface execution, use the new nouns
- if the code is about the artifact envelope `hypercard.card.v2`, `card` may still be correct

## Current Architectural Tension

The current model is cleaner than before, but one major architectural issue remains:

- runtime core still physically owns concrete runtime packages like `ui` and `kanban`

That is what APP-16 is for.

Today:

- package registration exists
- surface-type registration exists
- but concrete package manifests and concrete surface-type renderers still live in runtime core

The next architecture step is to extract those concrete packages into external packages and let the host app register them.

## Reading Order For New Contributors

If you are new to the runtime, read these files in this order:

1. [runtimeService.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts)
2. [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js)
3. [runtimePackageRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.ts)
4. [runtimeSurfaceTypeRegistry.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx)
5. one bundle:
   - [os-launcher pluginBundle.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/pluginBundle.ts)
6. one concrete surface type:
   - [kanbanV1Pack.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx)

After that, read APP-16 if you want the next architecture move, and APP-23 if you want the rationale for the naming model itself.
