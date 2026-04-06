# HyperCard JavaScript API User Guide and Reference

Last verified against source: 2026-03-11

This document is meant to do two jobs at once:

- act as a user guide for a new intern who needs to understand how to build things in this workspace;
- act as a reference for the current JavaScript-facing APIs exposed by the first-party packages in `go-go-os-frontend`.

It is intentionally more explanatory than a normal API index. If you are brand new to this codebase, read this file top to bottom once. After that, you should be able to return to individual sections as a reference.

Related documents:

- `docs/runtime-concepts-guide.md`
- `docs/repl-and-runtime-debug-guide.md`
- `docs/hypercard-runtime-pack-playbook.md`
- `docs/widget-dsl-porting-playbook.md`
- `docs/docs-source-mount-playbook.md`

## 1. What This Workspace Actually Contains

There are several JavaScript and TypeScript package layers in this workspace, and it is easy to get them mixed up if you only look at import paths.

At a high level:

- `@go-go-golems/os-core` gives you the desktop shell, windowing state/actions, generic widgets, theming, and Storybook helpers.
- `@go-go-golems/os-scripting` gives you the runtime core: runtime sessions, runtime bundle loading, runtime package registration, runtime surface-type registration, runtime debug windows, and runtime-host plumbing.
- `@go-go-golems/os-ui-cards` gives you the concrete `ui` runtime package and the `ui.card.v1` runtime surface type.
- `@go-go-golems/os-kanban` gives you the concrete `kanban` runtime package and the `kanban.v1` runtime surface type.
- `@go-go-golems/os-repl` gives you the reusable REPL shell: transcript, prompt, completions, history, and effect delivery.

That means the architecture is intentionally layered:

```text
@go-go-golems/os-core
  desktop shell + widgets + theming + story helpers

@go-go-golems/os-scripting
  generic runtime lifecycle + registries + host/runtime bridge

@go-go-golems/os-repl
  reusable shell for multiple REPL profiles

@go-go-golems/os-ui-cards
  concrete base UI DSL package

@go-go-golems/os-kanban
  concrete Kanban DSL package
```

The single most important architectural rule is:

- `@go-go-golems/os-scripting` owns generic runtime infrastructure;
- concrete runtime DSL packages live outside it and are registered explicitly by the host app.

## 2. The Mental Model You Should Use

If you only remember one conceptual model, make it this one:

```text
RuntimeBundle
  declares packageIds
  defines RuntimeSurfaces

RuntimeSession
  loads a RuntimeBundle
  installs RuntimePackages
  renders RuntimeSurfaces

RuntimeSurfaceType
  validates and renders the tree returned by a RuntimeSurface
```

More concretely:

1. A host app registers runtime packages like `ui` and `kanban`.
2. A runtime bundle declares which packages it needs.
3. A runtime session loads that bundle into QuickJS.
4. VM code returns a structured tree for a runtime surface type such as `ui.card.v1` or `kanban.v1`.
5. The host validates and renders that tree.
6. UI events call runtime handlers, which dispatch semantic runtime actions such as `nav.go`, `notify.show`, `draft.patch`, or `filters.patch`.

This is why the current code uses the nouns:

- `RuntimeBundle`
- `RuntimePackage`
- `RuntimeSurface`
- `RuntimeSurfaceType`
- `RuntimeSession`

and not the older `stack` / `card` terminology in runtime core.

## 3. Package Map

### `@go-go-golems/os-core`

Main barrel:

- `packages/os-core/src/index.ts`

Use this package when you need:

- generic desktop shell/windowing
- generic widgets
- theme loading
- Storybook helpers
- notifications
- basic shared TypeScript types

Main import patterns:

```ts
import { createStoryHelpers, DataTable, Btn } from '@go-go-golems/os-core';
import { DesktopShell } from '@go-go-golems/os-core/desktop-react';
import { openWindow, closeWindow, windowingReducer } from '@go-go-golems/os-core/desktop-core';
import '@go-go-golems/os-core/theme';
import '@go-go-golems/os-core/theme/modern.css';
```

### `@go-go-golems/os-scripting`

Main barrel:

- `packages/os-scripting/src/index.ts`

Use this package when you need:

- runtime package registration
- runtime surface-type registration
- QuickJS runtime service
- runtime surface session hosting
- runtime debug windows
- runtime artifact projection / editor plumbing

Main import patterns:

```ts
import {
  registerRuntimePackage,
  registerRuntimeSurfaceType,
  RuntimeSurfaceSessionHost,
  buildRuntimeDebugWindowPayload,
} from '@go-go-golems/os-scripting';
```

### `@go-go-golems/os-ui-cards`

Use this package when you need:

- the `ui` runtime package definition
- the `ui.card.v1` runtime surface type definition
- UI-tree validation helpers
- UI surface-type docs metadata

Main file:

- `packages/os-ui-cards/src/index.ts`

### `@go-go-golems/os-repl`

Main barrel:

- `packages/os-repl/src/index.ts`

Use this package when you need:

- a reusable console-style REPL shell
- transcript rendering
- history navigation
- completion popups
- generic REPL effects
- a shell that can host multiple profiles, not just HyperCard

Main import patterns:

```ts
import { MacRepl, type ReplDriver } from '@go-go-golems/os-repl';
```

### `@go-go-golems/os-kanban`

Use this package when you need:

- the `kanban` runtime package definition
- the `kanban.v1` runtime surface type definition
- Kanban host widgets
- Kanban reducer/state helpers
- Kanban surface-type docs metadata

Main file:

- `packages/os-kanban/src/index.ts`

## 4. The Most Important Public Types

These are the types new developers most often need first.

### `RuntimeBundleDefinition`

Source:

- `packages/os-core/src/cards/types.ts`

Definition:

```ts
interface PluginRuntimeBundleConfig {
  packageIds: string[];
  bundleCode: string;
  capabilities?: {
    domain?: 'all' | string[];
    system?: 'all' | string[];
  };
}

interface RuntimeSurfaceMeta {
  id: string;
  type: string;
  title?: string;
  icon?: string;
  ui: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

interface RuntimeBundleDefinition {
  id: string;
  name: string;
  icon: string;
  homeSurface: string;
  plugin: PluginRuntimeBundleConfig;
  surfaces: Record<string, RuntimeSurfaceMeta>;
}
```

How to think about it:

- this is the host-side description of a runtime bundle;
- it tells the desktop shell what the bundle is called, what its home surface is, and how to load its VM code;
- it also carries host-visible metadata for predefined surfaces.

The `plugin.bundleCode` field is the raw VM-authored source that QuickJS will evaluate.

The `plugin.packageIds` field is not documentation only. It is part of runtime loading and must match what the runtime session installs.

### `DesktopShellProps`

Source:

- `packages/os-core/src/components/shell/windowing/desktopShellTypes.ts`

Definition:

```ts
interface DesktopShellProps {
  bundle: RuntimeBundleDefinition;
  mode?: 'interactive' | 'preview';
  themeClass?: string;
  homeParam?: string;
  menus?: DesktopMenuSection[];
  icons?: DesktopIconDef[];
  renderAppWindow?: (appKey: string, windowId: string) => ReactNode;
  onCommand?: (commandId: string, invocation?: DesktopCommandInvocation) => void;
  visibilityContextResolver?: DesktopVisibilityContextResolver;
  contributions?: DesktopContribution[];
}
```

This is the core host-shell composition prop set. In practice:

- `bundle` is required;
- `contributions` is how you extend menus/icons/app windows in a structured way;
- `renderAppWindow` is how you render non-surface windows whose content kind is `app`.

### `OpenWindowPayload`

Source:

- `packages/os-core/src/desktop/core/state/types.ts`

Definition:

```ts
interface OpenWindowPayload {
  id: string;
  title: string;
  icon?: string;
  bounds: { x: number; y: number; w: number; h: number };
  minW?: number;
  minH?: number;
  isDialog?: boolean;
  isResizable?: boolean;
  content: WindowContent;
  dedupeKey?: string;
}
```

This is the imperative API payload for opening a window in the desktop shell.

Window content is one of:

- `kind: 'surface'`
- `kind: 'app'`
- `kind: 'dialog'`

The most important runtime case is:

```ts
content: {
  kind: 'surface',
  surface: {
    bundleId: 'inventory',
    surfaceId: 'home',
    surfaceSessionId: 'session-123',
    param: 'optional-param',
  },
}
```

### `RuntimePackageDefinition`

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

A runtime package is the installable DSL/API unit.

A package can contribute:

- VM-side helper APIs
- docs metadata
- dependencies on other packages
- one or more runtime surface types

### `RuntimeSurfaceTypeDefinition`

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

This is the host-side contract for a runtime surface tree.

One runtime surface type owns:

- validation
- rendering
- event callback adaptation

Examples:

- `ui.card.v1`
- `kanban.v1`

## 5. Quick Start Recipes

### Recipe A: Render a Bundle in the Desktop Shell

Use this when you already have a `RuntimeBundleDefinition` and want to render it in a host shell.

```tsx
import { DesktopShell } from '@go-go-golems/os-core/desktop-react';
import '@go-go-golems/os-core/theme';
import '@go-go-golems/os-core/theme/modern.css';

export function App() {
  return <DesktopShell bundle={MY_BUNDLE} />;
}
```

What actually happens:

```text
DesktopShell
  -> useDesktopShellController(...)
  -> opens homeSurface window
  -> surface window mounts RuntimeSurfaceSessionHost
  -> host loads plugin.bundleCode into QuickJS
  -> VM render returns a tree
  -> host validates and renders the tree
```

### Recipe B: Register Runtime Packages at App Startup

Use this when your app has runtime-authored surfaces.

```ts
import { registerRuntimePackage, registerRuntimeSurfaceType } from '@go-go-golems/os-scripting';
import { UI_RUNTIME_PACKAGE, UI_CARD_V1_RUNTIME_SURFACE_TYPE } from '@go-go-golems/os-ui-cards';
import { KANBAN_RUNTIME_PACKAGE, KANBAN_V1_RUNTIME_SURFACE_TYPE } from '@go-go-golems/os-kanban';

registerRuntimePackage(UI_RUNTIME_PACKAGE);
registerRuntimeSurfaceType(UI_CARD_V1_RUNTIME_SURFACE_TYPE);

registerRuntimePackage(KANBAN_RUNTIME_PACKAGE);
registerRuntimeSurfaceType(KANBAN_V1_RUNTIME_SURFACE_TYPE);
```

Important rule:

- registration belongs at host startup;
- do not hide it inside bundle code or runtime core.

### Recipe C: Build Storybook Stories for a Bundle

Source:

- `packages/os-core/src/app/generateCardStories.tsx`

```tsx
import { createStoryHelpers } from '@go-go-golems/os-core';

const { storeDecorator, createStory, FullApp } = createStoryHelpers({
  bundle: MY_BUNDLE,
  createStore,
  surfaceParams: {
    detail: { id: 'item-1' },
  },
});

const meta = {
  title: 'Inventory/Full App',
  component: FullApp,
  decorators: [storeDecorator],
} satisfies Meta<typeof FullApp>;

export default meta;

export const Home = createStory('home');
export const Detail = createStory('detail', { id: 'item-1' });
```

What `createStoryHelpers(...)` gives you:

- `storeDecorator`: isolated Redux store per story
- `createStory(surfaceId, params?)`: story render helper
- `FullApp`: shell mounted at the bundle’s `homeSurface`

### Recipe D: Open a Window Programmatically

Use the desktop-core state actions:

```ts
import { openWindow, closeWindow } from '@go-go-golems/os-core/desktop-core';

dispatch(openWindow({
  id: 'window:inventory:report',
  title: 'Report',
  icon: '📊',
  bounds: { x: 120, y: 60, w: 900, h: 700 },
  content: {
    kind: 'surface',
    surface: {
      bundleId: 'inventory',
      surfaceId: 'report',
      surfaceSessionId: 'inventory-report-session',
    },
  },
}));

dispatch(closeWindow('window:inventory:report'));
```

Use this API when:

- a menu command opens a surface;
- an app launches a shared debug window;
- a non-runtime host wants to open an app window.

## 6. `@go-go-golems/os-core` API Reference

This section covers the public API families exported by `@go-go-golems/os-core`.

### 6.1 App Helpers

Source:

- `packages/os-core/src/app/index.ts`
- `packages/os-core/src/app/generateCardStories.tsx`

Exports:

- `createStoryHelpers`
- `toStoryParam`
- `CardStoriesConfig`

`toStoryParam(value)` is important because the desktop navigation stack stores params as strings. Structured params are encoded with `JSON.stringify(...)`.

### 6.2 Desktop React Exports

Source:

- `packages/os-core/src/desktop/react/index.ts`

Important exports:

- `DesktopShell`
- `DesktopShellView`
- `DesktopIconLayer`
- `DesktopMenuBar`
- `WindowLayer`
- `WindowSurface`
- `WindowTitleBar`
- `useDesktopShellController`
- `renderWindowContentWithAdapters`
- `createAppWindowContentAdapter`
- `createFallbackWindowContentAdapter`
- contribution APIs such as `composeDesktopContributions`, `routeContributionCommand`
- menu/context APIs such as `useRegisterWindowMenuSections`, `useOpenDesktopContextMenu`

Use these when:

- you are building or extending the shell itself;
- you need app-window content adapters;
- you want structured menu/icon/window contributions rather than ad hoc callbacks.

### 6.3 Desktop Core Exports

Source:

- `packages/os-core/src/desktop/core/state/index.ts`

Important exports:

- reducers:
  - `windowingReducer`
- actions:
  - `openWindow`
  - `closeWindow`
  - `focusWindow`
  - `moveWindow`
  - `resizeWindow`
  - `sessionNavGo`
  - `sessionNavBack`
  - `sessionNavHome`
  - `setActiveMenu`
  - `setSelectedIcon`
  - `setDesktopContextMenu`
  - `clearDesktopTransient`
- selectors:
  - `selectWindowsByZ`
  - `selectFocusedWindow`
  - `selectSessionCurrentNav`
  - `selectSessionNavDepth`
  - `selectWindowById`
  - `selectWindowCount`

These are the APIs to use when you are writing reducers, launchers, or app-shell integration code.

### 6.4 Generic Widget Exports

Source:

- `packages/os-core/src/components/widgets/index.ts`

Important exports include:

- data views:
  - `DataTable`
  - `DetailView`
  - `ListView`
  - `SelectableDataTable`
  - `ReportView`
- input / form:
  - `Checkbox`
  - `FieldRow`
  - `FilterBar`
  - `FormView`
  - `DropdownMenu`
  - `RadioButton`
  - `ListBox`
  - `SelectableList`
- shell / utility:
  - `AlertDialog`
  - `ContextMenu`
  - `Toast`
  - `ToolPalette`
  - `RequestActionBar`
- richer widgets:
  - `GridBoard`
  - `ImageChoiceGrid`
  - `FilePickerDropzone`
  - `SchemaFormRenderer`

These are normal React host widgets. They are not the same thing as VM-side DSL constructors.

That distinction matters:

- `GridBoard` is a host React widget from `@go-go-golems/os-core`;
- `ui.gridBoard(...)` is a VM-side structured node constructor exposed through `@go-go-golems/os-ui-cards`.

### 6.5 Generic Shared Types

Source:

- `packages/os-core/src/types.ts`

Important types:

- `ColumnConfig`
- `FieldConfig`
- `ComputedFieldConfig`
- `FilterConfig`
- `ActionConfig`
- `FooterConfig`
- `ReportSection`

Use these for generic host widgets such as data tables, forms, list/detail views, and reports.

### 6.6 Theme Loading

Source:

- `packages/os-core/src/theme/index.ts`

Load once at app entry:

```ts
import '@go-go-golems/os-core/theme';
```

Optional theme layer:

```ts
import '@go-go-golems/os-core/theme/modern.css';
```

What the base theme loads:

- `desktop/tokens.css`
- `desktop/shell.css`
- `desktop/primitives.css`
- `desktop/syntax.css`
- `desktop/animations.css`

If you forget the theme import, the shell and widgets still render, but they will look broken or unstyled.

## 7. `@go-go-golems/os-scripting` API Reference

This package is the runtime core. It is where QuickJS sessions, registries, and runtime-host plumbing live.

### 7.1 Registry APIs

Source:

- `packages/os-scripting/src/runtime-packages/runtimePackageRegistry.ts`
- `packages/os-scripting/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx`

Runtime package API:

```ts
registerRuntimePackage(definition)
clearRuntimePackages()
getRuntimePackageOrThrow(packageId)
listRuntimePackages()
resolveRuntimePackageInstallOrder(packageIds)
```

Runtime surface-type API:

```ts
registerRuntimeSurfaceType(definition)
clearRuntimeSurfaceTypes()
normalizeRuntimeSurfaceTypeId(packId?)
getRuntimeSurfaceTypeOrThrow(packId?)
listRuntimeSurfaceTypes()
validateRuntimeSurfaceTree(packId, value)
renderRuntimeSurfaceTree(packId, value, onEvent)
```

These registries are module-global today. That means:

- host apps should register first-party packages at startup;
- tests should clear registries before asserting startup behavior.

### 7.2 Runtime Session Service

Source:

- `packages/os-scripting/src/plugin-runtime/runtimeService.ts`

Core class:

- `QuickJSRuntimeService`

This is still the public runtime-specific service class, but it now sits on top of
`JsSessionService` rather than owning a completely separate low-level QuickJS session layer.

Important methods:

- `loadRuntimeBundle(stackId, sessionId, packageIds, code)`
- `defineRuntimeSurface(sessionId, surfaceId, code, packId?)`
- `renderRuntimeSurface(sessionId, surfaceId, state)`
- `eventRuntimeSurface(sessionId, surfaceId, handlerName, args, state)`
- `disposeRuntimeSession(sessionId)`

Critical authoring rule:

- `packageIds` installs VM-side package APIs;
- `packId` selects the runtime surface type for one surface;
- one does not imply the other.

This is the mistake to avoid:

- `packageIds: ['ui']` does not mean a `home` surface is automatically typed as `ui.card.v1`.

Every bundle-owned surface must carry an explicit `packId` that matches a registered surface type. If it does not, `loadRuntimeBundle(...)` fails during bundle initialization rather than later during render.

Useful options:

```ts
interface QuickJSRuntimeServiceOptions {
  memoryLimitBytes?: number;
  stackLimitBytes?: number;
  loadTimeoutMs?: number;
  renderTimeoutMs?: number;
  eventTimeoutMs?: number;
}
```

Pseudo-flow:

```ts
const runtime = new QuickJSRuntimeService();

registerRuntimePackage(UI_RUNTIME_PACKAGE);
registerRuntimeSurfaceType(UI_CARD_V1_RUNTIME_SURFACE_TYPE);

const meta = await runtime.loadRuntimeBundle(
  'inventory',
  'session-1',
  ['ui'],
  bundleCode,
);

const tree = runtime.renderRuntimeSurface('session-1', 'home', state);
const actions = runtime.eventRuntimeSurface('session-1', 'home', 'save', args, state);
```

Service layering:

```text
quickJsSessionCore
  engine bootstrap/eval helpers

JsSessionService
  generic QuickJS sessions

QuickJSRuntimeService
  runtime bundle/package/surface semantics
```

### 7.3 VM Bootstrap Contract

Source:

- `packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js`

This file defines the globals that exist inside the QuickJS VM:

- `registerRuntimePackageApi(packageId, apiExports)`
- `defineRuntimeBundle(factory)`
- `defineRuntimeSurface(surfaceId, definitionOrFactory, packId?)`
- `defineRuntimeSurfaceRender(surfaceId, renderFn)`
- `defineRuntimeSurfaceHandler(surfaceId, handlerName, handlerFn)`
- `globalThis.__runtimeBundleHost.*`

That is the actual VM-side host/runtime contract.

Key detail:

- packages install their APIs into the VM by calling `registerRuntimePackageApi(...)`;
- bundle factories receive the merged package APIs when they run.

That means a VM bundle does not import `ui` or `kanban` with JavaScript module syntax. Instead, those APIs are injected into the VM before the bundle is evaluated.

Bundle authoring example:

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
    },
  },
}));
```

Failure mode to remember:

```text
packageIds: ['ui']           // installs VM helpers
surfaces.home.packId missing // runtime surface type is still unknown
=> loadRuntimeBundle(...) throws
```

Minimal review checklist for new bundles:

- Does every surface object declare `packId`?
- Does that `packId` correspond to a registered runtime surface type?
- Does the bundle also list the VM package needed by its render code in `packageIds`?
- Is there a test that loads the bundle and renders at least one surface through `QuickJSRuntimeService`?

### 7.4 Runtime Host Components

Important exports:

- `RuntimeSurfaceSessionHost`
- `dispatchRuntimeAction`
- plain JS session / REPL helpers:
  - `JsSessionService`
  - `createJsSessionBroker`
  - `createJsReplDriver`
- runtime debug helpers:
  - `buildRuntimeDebugWindowPayload`
  - `RuntimeDebugAppWindow`
  - `registerRuntimeDebugStacks`
  - `registerJsSessionDebugSource`

Use `RuntimeSurfaceSessionHost` when you need to mount a runtime-authored surface inside the host React tree.

### 7.5 Plain JS Session and REPL APIs

Source:

- `packages/os-scripting/src/plugin-runtime/jsSessionService.ts`
- `packages/os-scripting/src/repl/jsSessionBroker.ts`
- `packages/os-scripting/src/repl/jsReplDriver.ts`

Core types:

```ts
interface JsSessionSummary {
  sessionId: string;
  title: string;
  createdAt: string;
  globalNames: string[];
}

interface JsSessionBroker {
  spawnSession(request): Promise<JsSessionHandle>;
  getSession(sessionId): JsSessionHandle | null;
  listSessions(): JsSessionSummary[];
  resetSession(sessionId): Promise<JsSessionSummary>;
  disposeSession(sessionId): boolean;
  subscribe(listener): () => void;
}
```

Use these when you need:

- a blank QuickJS session that is not pretending to be a runtime bundle
- a plain JavaScript REPL profile
- a debug surface that can list or manage broker-owned JS sessions

Important rule:

- the broker owns the live session handles
- debug UIs should consume summaries and subscriptions, not serialize broker objects into Redux

## 8. `@go-go-golems/os-ui-cards` Reference

This is the base UI DSL package.

Source entry:

- `packages/os-ui-cards/src/index.ts`

Important exports:

- `UI_RUNTIME_PACKAGE`
- `UI_CARD_V1_RUNTIME_SURFACE_TYPE`
- `UI_RUNTIME_DOCS_METADATA`
- `UIRuntimeRenderer`
- `assertUINode`
- `validateUINode`
- types:
  - `UIEventRef`
  - `UINode`

Registration example:

```ts
registerRuntimePackage(UI_RUNTIME_PACKAGE);
registerRuntimeSurfaceType(UI_CARD_V1_RUNTIME_SURFACE_TYPE);
```

What it owns:

- the VM-side `ui.*` constructors
- the `ui.card.v1` validator
- the `ui.card.v1` renderer
- surface-type docs metadata for `/docs/objects/surface-type/ui.card.v1/*`

What it does not own:

- QuickJS lifecycle
- bundle loading
- app startup

## 9. `@go-go-golems/os-kanban` Reference

This is the richer Kanban DSL package.

Source entry:

- `packages/os-kanban/src/index.ts`

Important exports:

- `KANBAN_RUNTIME_PACKAGE`
- `KANBAN_V1_RUNTIME_SURFACE_TYPE`
- `KANBAN_RUNTIME_DOCS_METADATA`
- host widgets:
  - `KanbanBoard`
  - `KanbanBoardView`
  - `KanbanHighlights`
  - `KanbanHeaderBar`
  - `KanbanFilterBar`
  - `KanbanLaneView`
  - `KanbanStatusBar`
  - `KanbanTaskCard`
  - `KanbanTaskModal`
- state helpers:
  - `KANBAN_STATE_KEY`
  - `createKanbanStateSeed`
  - `kanbanActions`
  - `kanbanReducer`
  - `selectKanbanState`
- sample data:
  - `KANBAN_EXAMPLE_BOARDS`
  - `INITIAL_COLUMNS`
  - `INITIAL_TASKS`

Registration example:

```ts
registerRuntimePackage(KANBAN_RUNTIME_PACKAGE);
registerRuntimeSurfaceType(KANBAN_V1_RUNTIME_SURFACE_TYPE);
```

Dependency note:

- `kanban` depends on `ui`
- host apps should register both
- bundle `packageIds` should still declare what the bundle needs

## 10. How a VM Bundle Uses the API

A runtime bundle authored for QuickJS typically looks like this:

```js
defineRuntimeBundle(({ ui, widgets }) => ({
  id: 'demo',
  title: 'Demo Bundle',
  packageIds: ['ui', 'kanban'],
  surfaces: {
    home: {
      render({ state }) {
        return widgets.kanban.page(
          widgets.kanban.header({
            title: 'Sprint Radar',
            subtitle: 'Delivery board',
            primaryAction: { label: '+ Slice', onClick: { handler: 'openTaskEditor' } },
          }),
          widgets.kanban.board({
            columns: state.draft.columns,
            tasks: state.draft.tasks,
            onMoveTask: { handler: 'moveTask' },
          }),
        );
      },
      handlers: {
        moveTask(context, args) {
          context.dispatch({
            type: 'notify.show',
            payload: { message: 'Moved ' + String(args.id) },
          });
        },
      },
    },
  },
}));
```

Interpretation:

- the VM sees `ui` and `widgets` because packages installed those APIs;
- `render()` returns a structured tree, not a React element;
- `handlers` return runtime actions via `context.dispatch(...)`;
- the host is responsible for validating and rendering the tree.

## 11. Runtime Actions Reference

These are the semantic actions the host interprets today.

Common actions:

- `nav.go`
  - payload: `{ surfaceId, param? }`
- `nav.back`
- `notify.show`
  - payload: `{ message }`
- `window.close`
- `draft.set`
- `draft.patch`
- `draft.reset`
- `filters.set`
- `filters.patch`
- `filters.reset`

The exact action schema is validated in runtime core before the host applies it.

Rule of thumb:

- runtime actions should stay semantic;
- avoid leaking reducer internals or deep host implementation details into VM bundles.

## 12. Docs, Source Metadata, and Debugging

The runtime system is not only about rendering. It also preserves source and docs metadata.

Important concepts:

- package docs metadata
- bundle-owned runtime surface docs
- generated `vmmeta`
- built-in source editing in `Stacks & Cards`
- docs browser mounts under `/docs/objects/...`

Typical ownership split:

- `@go-go-golems/os-ui-cards` owns `ui.card.v1` docs
- `@go-go-golems/os-kanban` owns `kanban.v1` docs
- `os-launcher` owns docs for its concrete demo surfaces
- Inventory owns docs for its concrete `ui.card.v1` surfaces

This is why package-level docs and bundle-level docs are not the same thing.

The same section of the system now also hosts REPL-facing debugging:

- runtime-surface debugging still centers on bundles, surfaces, and source editors
- plain JS sessions are exposed as separate debug sources through `registerJsSessionDebugSource(...)`
- `Stacks & Cards` currently presents both views, but keeps the data models separate

If you need the full operator model for the REPLs and debug windows, read:

- `docs/repl-and-runtime-debug-guide.md`

## 13. Common Mistakes

### Mistake: Treating host widgets and VM DSL nodes as the same thing

They are not the same.

- `DataTable` is a host React component
- `ui.table(...)` is a VM-side structured node constructor

### Mistake: Letting runtime core own concrete packages

That used to be true. It is no longer the desired architecture.

Register concrete packages at host startup instead.

### Mistake: Hiding runtime registration in convenience helpers

Host apps should import definitions from concrete packages and call:

- `registerRuntimePackage(...)`
- `registerRuntimeSurfaceType(...)`

directly.

This keeps module ownership and startup order obvious.

### Mistake: Putting bundle-local helpers into runtime packages

If a helper is specific to one bundle or one demo app, keep it bundle-local.

Examples:

- bundle-specific formatting helpers
- demo-only sample layout composition
- app-specific state helpers that are not general package API

## 14. Suggested Reading Order for a New Intern

1. Read this document once.
2. Read `docs/runtime-concepts-guide.md`.
3. Read `docs/hypercard-runtime-pack-playbook.md`.
4. Read one concrete package:
   - `packages/os-ui-cards/src/index.ts`
   - `packages/os-kanban/src/index.ts`
5. Read one host app bootstrap:
   - `apps/os-launcher/src/App.tsx`
   - `apps/os-launcher/src/app/registerRuntimePackages.ts`
6. Read one bundle definition:
   - `apps/os-launcher/src/domain/stack.ts`
   - `apps/os-launcher/src/domain/pluginBundle.ts`
7. Then read runtime core:
   - `packages/os-scripting/src/plugin-runtime/runtimeService.ts`
   - `packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js`

## 15. Short File Reference Map

If you need to jump straight into code, start here:

- engine barrel:
  - `packages/os-core/src/index.ts`
- engine desktop shell:
  - `packages/os-core/src/components/shell/windowing/DesktopShell.tsx`
  - `packages/os-core/src/components/shell/windowing/desktopShellTypes.ts`
- desktop state/actions:
  - `packages/os-core/src/desktop/core/state/index.ts`
  - `packages/os-core/src/desktop/core/state/types.ts`
- story helpers:
  - `packages/os-core/src/app/generateCardStories.tsx`
- runtime core barrel:
  - `packages/os-scripting/src/index.ts`
- runtime service:
  - `packages/os-scripting/src/plugin-runtime/runtimeService.ts`
- runtime bootstrap:
  - `packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js`
- runtime package registry:
  - `packages/os-scripting/src/runtime-packages/runtimePackageRegistry.ts`
- runtime surface-type registry:
  - `packages/os-scripting/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx`
- UI package:
  - `packages/os-ui-cards/src/index.ts`
- Kanban package:
  - `packages/os-kanban/src/index.ts`

That set of files is enough to reconstruct the current architecture from source.
