# Runtime Concepts Guide

Last verified against source: 2026-03-11

This guide explains the runtime architecture used by the first-party frontend packages after the APP-23 and APP-16 cleanup work.

It is written for a new intern who needs to answer questions like:

- What is a runtime bundle?
- What is a runtime package?
- What runs inside QuickJS and what stays on the host?
- Where do `ui` and `kanban` actually live now?
- What is the difference between a runtime surface and a runtime surface type?
- Why do we keep talking about docs metadata and `vmmeta` in a runtime guide?

If you only want the high-level API list, read `docs/js-api-user-guide-reference.md`.

If you want the operator view of REPLs, brokers, and debug windows, also read
`docs/repl-and-runtime-debug-guide.md`.

If you want the conceptual model that makes the API list make sense, read this guide first.

## 1. The One-Screen Summary

Here is the shortest accurate description of the system:

```text
Host app
  registers RuntimePackages and RuntimeSurfaceTypes
  opens windows in DesktopShell

RuntimeSession
  loads a RuntimeBundle into QuickJS
  installs RuntimePackages
  renders RuntimeSurfaces

RuntimeSurface
  returns a tree for a RuntimeSurfaceType

RuntimeSurfaceType
  validates and renders that tree on the host
```

Everything else in this guide is just unpacking that model carefully.

## 2. Why These Terms Exist

Earlier versions of this system used `stack` and `card` almost everywhere. That worked while there was effectively one default UI DSL and one dominant use case.

That naming started to fail once the runtime grew to include:

- multiple DSL/API families like `ui` and `kanban`;
- package registration and dependency ordering;
- generated source/docs metadata;
- runtime debug windows and built-in source editing;
- the idea that future packages might define very different render surfaces.

So the current runtime uses these terms instead:

- `RuntimeSession`
- `RuntimeBundle`
- `RuntimePackage`
- `RuntimeSurface`
- `RuntimeSurfaceType`

These names are not cosmetic. They separate concerns that used to be collapsed together.

## 3. The Two Halves of the System

The runtime is easiest to understand if you split it into a static half and a live half.

### Static half

This is everything that exists before a VM session starts:

- package definitions
- VM-side package preludes
- bundle source code
- package docs metadata
- bundle-owned surface docs
- generated `vmmeta`
- host-side validators/renderers
- runtime bundle definitions used by the desktop shell

### Live half

This is everything that exists after a session starts:

- QuickJS runtime and context
- installed package APIs
- loaded bundle metadata
- current surface render state
- session-local draft/filter state
- emitted runtime actions

Diagram:

```text
Static artifacts
  package definitions
  bundle source
  docs metadata
  vmmeta
      |
      v
Runtime execution
  RuntimeSession
    installs packages
    loads bundle
    renders surfaces
    emits actions
      |
      v
Host React shell
  validates tree
  renders tree
  updates Redux
```

This distinction matters because many bugs happen when someone assumes a static concept lives at runtime, or vice versa.

## 4. Layer Map

The workspace now has a clear layer split.

### Layer 1: Desktop shell and host widgets

Main package:

- `@go-go-golems/os-core`

Responsibilities:

- desktop shell
- windows, menus, icons, context menus
- generic widgets
- theme loading
- Storybook helpers
- desktop Redux state/actions/selectors

Key files:

- `packages/os-core/src/index.ts`
- `packages/os-core/src/components/shell/windowing/DesktopShell.tsx`
- `packages/os-core/src/desktop/core/state/types.ts`
- `packages/os-core/src/app/generateCardStories.tsx`

### Layer 2: Runtime core

Main package:

- `@go-go-golems/os-scripting`

Responsibilities:

- QuickJS runtime lifecycle
- runtime package registry
- runtime surface-type registry
- runtime surface host component
- runtime debug/editor tooling
- artifact/runtime projection

Key files:

- `packages/os-scripting/src/index.ts`
- `packages/os-scripting/src/plugin-runtime/runtimeService.ts`
- `packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js`
- `packages/os-scripting/src/runtime-packages/runtimePackageRegistry.ts`
- `packages/os-scripting/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx`

### Layer 3: Concrete runtime packages

Current first-party examples:

- `@go-go-golems/os-ui-cards`
- `@go-go-golems/os-kanban`

Responsibilities:

- define a runtime package
- provide VM-side DSL/API helpers
- provide docs metadata
- provide runtime surface-type validation/rendering
- provide package-owned host widgets if needed

Key files:

- `packages/os-ui-cards/src/index.ts`
- `packages/os-ui-cards/src/runtimeRegistration.tsx`
- `packages/os-kanban/src/index.ts`
- `packages/os-kanban/src/runtimeRegistration.tsx`

### Layer 4: Host apps and bundles

Examples:

- `wesen-os/apps/os-launcher`
- `workspace-links/go-go-app-inventory/apps/inventory`

Responsibilities:

- register runtime packages at startup
- define runtime bundle metadata for the shell
- provide app-local VM bundle source
- mount docs
- expose demo surfaces

This is the composition boundary.

## 5. RuntimeSession

A `RuntimeSession` is one running runtime instance.

Current implementation:

- `packages/os-scripting/src/plugin-runtime/runtimeService.ts`
- `packages/os-scripting/src/plugin-runtime/jsSessionService.ts`

Current class:

- `QuickJSRuntimeService`

As of APP-26, this runtime service is no longer a parallel VM owner beside the plain JS layer.
It now composes over `JsSessionService`:

- `JsSessionService` owns the generic QuickJS session map
- `QuickJSRuntimeService` owns runtime-specific metadata, package installation, bundle load, and surface semantics

Responsibilities:

- create a QuickJS runtime/context
- install the generic bootstrap
- install runtime packages in dependency order
- evaluate bundle code
- read runtime bundle metadata from the VM
- render a runtime surface
- call a runtime surface handler
- dispose the session cleanly

That means the current service stack is:

```text
quickJsSessionCore
  low-level engine helpers

JsSessionService
  generic persistent QuickJS sessions

QuickJSRuntimeService
  runtime-specific bundle/surface service built on top of JsSessionService
```

Important options:

```ts
interface QuickJSRuntimeServiceOptions {
  memoryLimitBytes?: number;
  stackLimitBytes?: number;
  loadTimeoutMs?: number;
  renderTimeoutMs?: number;
  eventTimeoutMs?: number;
}
```

Important public methods:

```ts
loadRuntimeBundle(stackId, sessionId, packageIds, code)
defineRuntimeSurface(sessionId, surfaceId, code, packId?)
renderRuntimeSurface(sessionId, surfaceId, state)
eventRuntimeSurface(sessionId, surfaceId, handlerName, args, state)
disposeRuntimeSession(sessionId)
```

Important load-time invariant:

- every runtime surface must resolve to a concrete surface-type id;
- in practice that means bundle-owned surfaces must declare `packId`;
- runtime package installation and runtime surface typing are separate concerns.

The common mistake is assuming:

- `packageIds: ['ui']` means surfaces automatically become `ui.card.v1`.

That is wrong.

- `packageIds` tells the host which VM helper APIs to install;
- `packId` tells the host which surface-type validator/renderer owns the tree returned by one specific surface.

If a bundle omits `packId` for a surface, bundle load fails before the surface can render. The runtime currently fails with an error shaped like:

```text
Runtime surface packId is required for surface: home
```

### What a session is not

A runtime session is not:

- a desktop window
- a bundle
- a surface
- a package

It is the running VM instance that hosts those things.

### Session flow

```text
create RuntimeSession
  -> install bootstrap
  -> install packages
  -> evaluate bundle
  -> read bundle meta
  -> render/evaluate surfaces repeatedly
  -> dispose session
```

### RuntimeSessionManager

After APP-28, there is an explicit manager layer above `QuickJSRuntimeService`:

- `packages/os-scripting/src/runtime-session-manager/runtimeSessionManager.ts`
- `packages/os-scripting/src/runtime-session-manager/runtimeOwnership.ts`
- `packages/os-scripting/src/app/runtimeSessionLifecycleMiddleware.ts`

This manager is important because the VM lifecycle is no longer supposed to follow ordinary React mount/unmount behavior.

Responsibilities:

- ensure a runtime session exists for a given `bundleId + sessionId`
- keep the stable `sessionId -> handle` map for managed runtime sessions
- track attached window/view ids
- publish serializable summaries for operator tooling
- expose ownership classes such as:
  - `window-owned`
  - `broker-owned`
  - `attached-read-only`
  - `attached-writable` (future)

The first central disposal rule now is:

- last surface-window close only auto-disposes `window-owned` runtime sessions

That rule is enforced from Redux desktop lifecycle middleware, not from `useEffect` cleanup in `RuntimeSurfaceSessionHost`.

## 6. RuntimeBundle

A `RuntimeBundle` is app-authored source code plus metadata.

There are two ways to think about bundles:

- host-side `RuntimeBundleDefinition` used by the desktop shell;
- VM-side bundle declaration registered through the bootstrap.

### Host-side bundle definition

Source:

- `packages/os-core/src/cards/types.ts`

Important fields:

- `id`
- `name`
- `icon`
- `homeSurface`
- `plugin.packageIds`
- `plugin.bundleCode`
- `surfaces`

Example host-side bundle definitions:

- `apps/os-launcher/src/domain/stack.ts`
- `workspace-links/go-go-app-inventory/apps/inventory/src/domain/stack.ts`

### VM-side bundle declaration

Source:

- `packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js`

Main entrypoint:

- `defineRuntimeBundle(factory)`

Typical bundle declaration:

```js
defineRuntimeBundle(({ ui, widgets }) => ({
  id: 'inventory',
  title: 'Shop Inventory',
  packageIds: ['ui'],
  initialSessionState: {},
  initialSurfaceState: {},
  surfaces: {
    home: ...,
    browse: ...,
  },
}));
```

### The important distinction

The host bundle definition and the VM bundle declaration are related, but not the same.

The host bundle definition is how the shell knows what it can open.

The VM bundle declaration is what the runtime session reads after evaluating the source.

The runtime service validates that the declared `packageIds` match what the host installed.

## 7. RuntimePackage

A `RuntimePackage` is the installable DSL/API capability bundle.

Source:

- `packages/os-scripting/src/runtime-packages/runtimePackageRegistry.ts`

Definition:

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

Examples:

- `UI_RUNTIME_PACKAGE`
- `KANBAN_RUNTIME_PACKAGE`

### What a package can contribute

A runtime package may contribute:

- VM-side helper APIs
- docs metadata
- dependencies on other packages
- one or more runtime surface types

It may also own:

- package-specific host widgets
- validator code
- renderer code

### Current registry behavior

The registry is currently module-global.

API:

```ts
registerRuntimePackage(definition)
clearRuntimePackages()
getRuntimePackageOrThrow(packageId)
listRuntimePackages()
resolveRuntimePackageInstallOrder(packageIds)
```

### Dependency ordering

The runtime service does not install packages in random order. It uses dependency ordering.

For example:

- `kanban` depends on `ui`

That means:

```text
bundle declares ['ui', 'kanban']
  -> resolveRuntimePackageInstallOrder(...)
  -> install ui
  -> install kanban
```

If the dependency graph cycles, runtime-core throws.

## 8. RuntimeSurface

A `RuntimeSurface` is the renderable/eventable unit inside a bundle.

This is the runtime-core replacement for the old notion of a “card”.

Source of the VM-side authoring contract:

- `packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js`

Main entrypoints:

- `defineRuntimeSurface(surfaceId, definitionOrFactory, packId?)`
- `defineRuntimeSurfaceRender(surfaceId, renderFn)`
- `defineRuntimeSurfaceHandler(surfaceId, handlerName, handlerFn)`

Typical shape:

```js
defineRuntimeSurface(
  'kanbanSprintBoard',
  ({ widgets }) => ({
    render({ state }) {
      return widgets.kanban.page(...);
    },
    handlers: {
      moveTask(context, args) {
        context.dispatch({
          type: 'notify.show',
          payload: { message: 'Moved task' },
        });
      },
    },
  }),
  'kanban.v1',
);
```

Bundle-owned surfaces follow the same rule even when they are declared as metadata objects inside `defineRuntimeBundle(...)`.

Correct:

```js
defineRuntimeBundle(({ ui }) => ({
  id: 'demo',
  title: 'Demo Bundle',
  packageIds: ['ui'],
  surfaces: {
    home: {
      packId: 'ui.card.v1',
      render({ state }) {
        return ui.panel([]);
      },
      handlers: {
        reload(context) {
          context.dispatch({ type: 'reload.requested' });
        },
      },
    },
  },
}));
```

Incorrect:

```js
defineRuntimeBundle(({ ui }) => ({
  id: 'demo',
  title: 'Demo Bundle',
  packageIds: ['ui'],
  surfaces: {
    home: {
      render({ state }) {
        return ui.panel([]);
      },
    },
  },
}));
```

The incorrect example installs the `ui` API but never tells the runtime which surface type owns `home`.

### What a surface owns

A runtime surface owns:

- its `render({ state })` function
- its `handlers`
- its surface-type id such as `ui.card.v1` or `kanban.v1`

### What a surface does not own

A surface does not own:

- the host renderer
- the VM package APIs
- the desktop shell
- the runtime session itself

## 9. RuntimeSurfaceType

A `RuntimeSurfaceType` is the host/runtime contract for the tree returned by a surface.

Source:

- `packages/os-scripting/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx`

Definition:

```ts
interface RuntimeSurfaceTypeDefinition<TTree> {
  packId: string;
  validateTree: (value: unknown) => TTree;
  render: (props: {
    tree: TTree;
    onEvent: (handler: string, args?: unknown) => void;
  }) => ReactNode;
}
```

This is where host-side interpretation happens.

Examples:

- `ui.card.v1`
- `kanban.v1`

### Why surface types exist

They let the VM return semantic data structures instead of host React elements.

That gives you:

- validation
- stable DSL boundaries
- safer runtime behavior
- room for documentation and prompting around a real schema

### Authoring checklist

Before you load a bundle, verify:

- each surface has a `packId`;
- each `packId` matches a registered runtime surface type such as `ui.card.v1` or `kanban.v1`;
- the bundle `packageIds` include the VM helper package needed by the surface implementation, such as `ui` for `ui.panel(...)`;
- you are not relying on package installation to infer a surface type;
- there is at least one direct regression test that loads the bundle and renders a real surface.

### Registry API

```ts
registerRuntimeSurfaceType(definition)
clearRuntimeSurfaceTypes()
normalizeRuntimeSurfaceTypeId(packId?)
getRuntimeSurfaceTypeOrThrow(packId?)
listRuntimeSurfaceTypes()
validateRuntimeSurfaceTree(packId, value)
renderRuntimeSurfaceTree(packId, value, onEvent)
```

## 10. The VM Bootstrap Contract

The VM bootstrap file is the most important single file in runtime core.

Source:

- `packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js`

It defines the contract between the host and the QuickJS runtime.

### Important globals it provides

- `registerRuntimePackageApi(packageId, apiExports)`
- `defineRuntimeBundle(factory)`
- `defineRuntimeSurface(...)`
- `defineRuntimeSurfaceRender(...)`
- `defineRuntimeSurfaceHandler(...)`
- `globalThis.__runtimeBundleHost`

### What `registerRuntimePackageApi(...)` does

Each installed package calls:

```js
registerRuntimePackageApi('ui', {
  ui: { ...constructors... },
});
```

or:

```js
registerRuntimePackageApi('kanban', {
  widgets: {
    kanban: { ...constructors... },
  },
});
```

The bootstrap merges these exports into a shared package API state and exposes them on `globalThis`.

That is why bundle factories can receive:

- `ui`
- `widgets`

without using JavaScript imports.

### What `__runtimeBundleHost` does

This is the host-facing adapter object inside the VM.

It provides:

- `getMeta()`
- `renderRuntimeSurface(surfaceId, state)`
- `eventRuntimeSurface(surfaceId, handlerName, args, state)`
- `defineRuntimeSurface(...)`
- `defineRuntimeSurfaceRender(...)`
- `defineRuntimeSurfaceHandler(...)`

The host runtime service calls into this object rather than poking surface definitions directly.

## 11. Static vs Runtime Ownership

One of the most useful questions to ask while reading this codebase is:

“Is this thing static metadata, or is it runtime state?”

### Static ownership examples

- `UI_RUNTIME_PACKAGE`
- `KANBAN_RUNTIME_PACKAGE`
- `UI_RUNTIME_DOCS_METADATA`
- `KANBAN_RUNTIME_DOCS_METADATA`
- raw VM bundle source strings
- generated `vmmeta`
- `RuntimeBundleDefinition`

### Runtime ownership examples

- active QuickJS sessions
- runtime surface state
- runtime-emitted actions
- current window nav state
- current rendered surface tree

Mixing these levels up is a common source of confusion.

## 12. What Lives in `ui-runtime`

Source entry:

- `packages/os-ui-cards/src/index.ts`

This package owns:

- `UI_RUNTIME_PACKAGE`
- `UI_CARD_V1_RUNTIME_SURFACE_TYPE`
- `UI_RUNTIME_DOCS_METADATA`
- `UIRuntimeRenderer`
- `validateUINode(...)`

It is the base structured UI DSL package.

It owns:

- the VM-side `ui.*` constructors
- the host-side validation/rendering for `ui.card.v1`
- the surface-type docs for `ui.card.v1`

It does not own:

- QuickJS lifecycle
- bundle loading
- app startup

## 13. What Lives in `kanban-runtime`

Source entry:

- `packages/os-kanban/src/index.ts`

This package owns:

- `KANBAN_RUNTIME_PACKAGE`
- `KANBAN_V1_RUNTIME_SURFACE_TYPE`
- `KANBAN_RUNTIME_DOCS_METADATA`
- Kanban host widgets
- Kanban state helpers
- Kanban stories

It owns:

- the VM-side `widgets.kanban.*` constructors
- the host-side validation/rendering for `kanban.v1`
- package-owned docs for `kanban.v1`

It depends on:

- `ui`

That dependency exists at the runtime-package layer and is enforced by install ordering.

## 14. What Lives in the Host App

Host apps such as `os-launcher` and Inventory own composition.

That means they decide:

- which runtime packages to register;
- which runtime surface types to register;
- which bundle source to load;
- which docs to mount;
- which demo/runtime surfaces to expose;
- which desktop contributions to install.

Examples:

- `apps/os-launcher/src/app/registerRuntimePackages.ts`
- `apps/os-launcher/src/app/registerAppsBrowserDocs.ts`
- `workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.tsx`

This is why startup registration belongs in the app layer, not inside runtime core.

## 15. End-to-End Flow

Here is the full flow from startup to user interaction.

```text
host app starts
  -> register runtime packages
  -> register runtime surface types
  -> build RuntimeBundleDefinition
  -> DesktopShell opens home surface
  -> RuntimeSurfaceSessionHost asks RuntimeSessionManager for RuntimeSession
  -> runtime installs package preludes
  -> runtime evaluates bundle code
  -> runtime exposes bundle meta
  -> host asks runtime to render current surface
  -> surface returns structured tree
  -> host validates tree via RuntimeSurfaceType
  -> host renders tree with React widgets
  -> user interacts with UI
  -> host sends handler event to runtime
  -> runtime emits semantic actions
  -> host updates Redux/session state
  -> runtime re-renders surface
```

This is the core loop of the system.

The important ownership correction is:

- React hosts attach and detach views
- the session manager owns runtime-process existence
- Redux desktop lifecycle decides when a truly window-owned session should be torn down

## 16. Docs and `vmmeta`

Runtime docs are not an afterthought in this architecture.

We now treat docs and exact source as first-class metadata.

### Package-owned docs

Examples:

- `UI_RUNTIME_DOCS_METADATA`
- `KANBAN_RUNTIME_DOCS_METADATA`

These belong to the runtime package because they describe the package-owned DSL/API.

### Bundle-owned surface docs

Examples:

- `apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts`
- `workspace-links/go-go-app-inventory/apps/inventory/src/domain/generated/inventoryVmmeta.generated.ts`

These belong to the app bundle because they describe the concrete authored surfaces in that bundle.

### Why this matters

This supports:

- docs browser mounting under `/docs/objects/...`
- built-in source editing
- runtime debug windows
- generated symbol/package docs
- future authoring assistance

## 17. Debugging and Source Editing

The runtime system includes tools that depend on the concepts above.

Examples:

- `RuntimeSurfaceDebugWindow`
- code editor windows opened from `Stacks & Cards`
- runtime debug registry
- docs browser surface/package mounts

These tools work because:

- packages expose docs metadata;
- bundles expose exact source in `vmmeta`;
- stack/bundle definitions preserve runtime source metadata;
- host apps mount docs from the correct owner.

If docs or source metadata are missing, the debugger becomes much less useful.

### Current debug split

There are now two different live-debug data models:

- runtime-surface debugging
- plain JS session debugging

They should be presented together carefully, but they should not be collapsed into one fake common
runtime object.

#### Runtime-surface debugging

Main examples:

- `RuntimeSurfaceDebugWindow`
- runtime-surface registry entries
- built-in source editing for bundle-owned surfaces

This side of the world is about:

- bundles
- surfaces
- surface types
- runtime actions
- built-in authored source

#### Plain JS session debugging

Main examples:

- `JsSessionBroker`
- `JsSessionService`
- the `JavaScript REPL`
- `Task Manager`
- the compact `JS Sessions` handoff inside `Stacks & Cards`

This side of the world is about:

- blank QuickJS sessions
- globals
- raw eval
- reset/dispose lifecycle
- transcript-oriented tooling

Diagram:

```text
Stacks & Cards
  -> runtime-surface Redux state
  -> runtime debug stack registry
  -> JS session debug registry (summary only)

Task Manager
  -> TaskManagerSource registry
  -> runtime-session source adapter
  -> JS-session source adapter

JS session debug registry
  -> JsSessionBroker objects
  -> serializable JsSessionSummary values
```

The important rule is:

- runtime-surface sessions live in runtime-core state
- plain JS sessions live in broker-owned external state
- operator windows may show both, but they should do so through summary adapters rather than one fake shared reducer

That split is intentional.

## 18. Common Failure Modes

### Missing package registration

Symptom:

- runtime bundle load fails with `Unknown runtime package: ...`

Cause:

- host app did not register the package before loading the bundle

### Package ID mismatch

Symptom:

- bundle load fails with a package mismatch error

Cause:

- bundle declares `packageIds` that do not match what the host installed

### Unknown surface type

Symptom:

- render path fails with `Unknown runtime surface type: ...`

Cause:

- surface type definition was not registered

### Wrong ownership boundary

Symptom:

- duplicated docs
- missing docs
- confusing package/app coupling

Cause:

- package-owned API docs were kept in an app bundle, or app-owned surface docs were incorrectly moved into a package

## 19. Anti-Patterns

### Anti-pattern: Treating the bundle as the package

A runtime bundle is app-authored program code.

A runtime package is an installable DSL/API unit.

They are related, but not the same layer.

### Anti-pattern: Treating a surface as a host widget

A runtime surface returns a structured tree.

The host widget tree is created later by the surface-type renderer.

### Anti-pattern: Hiding startup registration in runtime core

Registration belongs in the host app.

If runtime core imports and registers concrete packages by itself, the ownership model becomes muddy again.

### Anti-pattern: Using bundle-local helpers as public package API

Bundle-specific helpers should stay bundle-local unless they are truly reusable across apps.

## 20. File-by-File Orientation Map

If you are onboarding and want a concrete reading path, use this order.

### Start here

- `packages/os-core/src/cards/types.ts`
- `packages/os-core/src/desktop/core/state/types.ts`
- `packages/os-scripting/src/runtime-packages/runtimePackageRegistry.ts`
- `packages/os-scripting/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx`

### Then read runtime core

- `packages/os-scripting/src/plugin-runtime/runtimeService.ts`
- `packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js`
- `packages/os-scripting/src/runtime-host/RuntimeSurfaceSessionHost.tsx`

### Then read the concrete packages

- `packages/os-ui-cards/src/index.ts`
- `packages/os-ui-cards/src/runtimeRegistration.tsx`
- `packages/os-kanban/src/index.ts`
- `packages/os-kanban/src/runtimeRegistration.tsx`

### Then read a host app

- `apps/os-launcher/src/app/registerRuntimePackages.ts`
- `apps/os-launcher/src/App.tsx`
- `apps/os-launcher/src/domain/stack.ts`
- `apps/os-launcher/src/domain/pluginBundle.ts`

### Then read docs/debug integration

- `apps/os-launcher/src/app/registerAppsBrowserDocs.ts`
- `packages/os-scripting/src/hypercard/debug/runtimeDebugApp.tsx`
- `packages/os-scripting/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx`

## 21. Closing Mental Model

If you finish this guide and still feel some ambiguity, reduce the architecture back down to this:

```text
engine
  renders the desktop and widgets

runtime core
  runs QuickJS sessions and generic registries

runtime packages
  inject VM APIs and own surface-type contracts

bundles
  define app-specific surfaces

surfaces
  render trees and emit semantic actions
```

That is the current system.

Once that model feels natural, the rest of the codebase becomes much easier to navigate.
