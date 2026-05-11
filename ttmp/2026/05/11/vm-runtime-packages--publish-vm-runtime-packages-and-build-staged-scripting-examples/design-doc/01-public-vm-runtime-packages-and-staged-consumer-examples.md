---
Title: Public VM Runtime Packages and Staged Consumer Examples
Ticket: vm-runtime-packages
Status: active
Topics:
    - frontend
    - react
    - npm
    - widgets
    - vm
    - quickjs
    - runtime
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../2026-05-11--npm-go-go-os-test/.storybook/main.ts
      Note: Storybook Vite optimization configuration for VM packages
    - Path: ../../../../../../../2026-05-11--npm-go-go-os-test/examples/shared/src/VmExampleHost.tsx
      Note: shared scripting-aware provider and RuntimeSurfaceSessionHost wrapper
    - Path: ../../../../../../../2026-05-11--npm-go-go-os-test/examples/shared/src/runtimePackages.ts
      Note: idempotent runtime package and surface type registration
    - Path: ../../../../../../../2026-05-11--npm-go-go-os-test/vite.config.ts
      Note: Vite dev optimization configuration for published VM raw imports
    - Path: packages/os-kanban/src/runtimeRegistration.tsx
      Note: kanban runtime package and renderer registration
    - Path: packages/os-scripting/src/plugin-runtime/quickJsSessionCore.ts
      Note: QuickJS runtime/session core and resource limits
    - Path: packages/os-scripting/src/plugin-runtime/runtimeService.ts
      Note: runtime bundle load/render/event service
    - Path: packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js
      Note: VM-side defineRuntimeBundle and surface APIs
    - Path: packages/os-scripting/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: React host bridge for VM surfaces
    - Path: packages/os-ui-cards/src/runtimeRegistration.tsx
      Note: base ui runtime package and renderer registration
    - Path: scripts/packages/build-dist.mjs
      Note: dist builder used for public package artifacts
ExternalSources: []
Summary: Design and implementation guide for publishing the QuickJS VM runtime packages and extending the standalone npm demo with staged VM/runtime examples.
LastUpdated: 2026-05-11T18:25:00-04:00
WhatFor: Use this before publishing or consuming the VM runtime package family from standalone applications.
WhenToUse: When working on os-scripting, runtime surface packages, VM-backed examples, or wesen-os migration from local HyperCard aliases to public go-go-os packages.
---



# Public VM Runtime Packages and Staged Consumer Examples

## Executive Summary

This ticket turns the browser-side JavaScript VM system into a public package family and then teaches consumers how to use it through progressive examples in the standalone npm demo application. The earlier package wave published the shell, primitive widgets, rich widgets, and REPL. That made ordinary React desktop examples possible. It did not yet expose the QuickJS runtime that executes sandboxed JavaScript bundles, installs runtime DSL packages, renders runtime surfaces, and routes user interaction back into the host application.

The VM package family is centered on `@go-go-golems/os-scripting`. That package owns QuickJS session creation, runtime bundle loading, runtime package registration, runtime surface rendering, event execution, Redux session state, intent routing, runtime debugging utilities, and REPL bridges. Two companion packages provide concrete VM-facing APIs and host renderers: `@go-go-golems/os-ui-cards` registers the base `ui` DSL and `ui.card.v1` renderer, while `@go-go-golems/os-kanban` registers a higher-level `kanban` DSL and `kanban.v1` renderer. Two adjacent packages, `@go-go-golems/os-chat` and `@go-go-golems/os-confirm`, should be published in the same wave because `os-scripting` and future consumer apps already depend on shared chat/runtime/confirmation surfaces.

The consumer-facing outcome is a staged path beyond the existing examples:

1. Publish the VM package family publicly on npm.
2. Add a scripting-aware store setup to the demo application.
3. Add an example that registers `ui` runtime packages and renders a tiny QuickJS surface.
4. Add an example that demonstrates VM event handlers and host intent routing.
5. Add an example that registers the Kanban runtime package and renders a structured Kanban surface.
6. Keep the demo in registry-dependency state after validation, not local tarball state.

The implementation should follow the local-debug workflow established during the REPL focus fix: validate source and `dist/` locally, publish once per verified package version, update dependent packages, and only then update the external demo to registry versions.

## Problem Statement and Scope

The public npm package family currently covers important non-VM surfaces:

- `@go-go-golems/os-core` for theme, primitives, desktop types, and low-level shell components.
- `@go-go-golems/os-repl` for terminal/REPL UI.
- `@go-go-golems/os-widgets` for rich widgets and launcher modules.
- `@go-go-golems/os-shell` for public shell/window-manager and launcher boundaries.

The missing boundary is the VM-backed runtime system. Without it, external consumers cannot build the HyperCard-style flow where a JavaScript bundle is loaded as data, executed inside QuickJS, returns a validated UI tree, and sends structured actions to the host. The current demo can show shell windows and React widgets, but it cannot yet show:

- a `defineRuntimeBundle(...)` VM bundle,
- host-side registration of runtime packages,
- QuickJS render/event cycles,
- capability-limited state projection,
- dynamic runtime surfaces,
- runtime DSL packages such as `ui` and `kanban`.

This ticket covers:

- package publication work in `go-go-os-frontend`,
- documentation and package README work for the VM package family,
- demo examples in `2026-05-11--npm-go-go-os-test`,
- validation and publication bookkeeping,
- reMarkable delivery of the design bundle.

This ticket does not cover a full `wesen-os` migration. `wesen-os` is a useful real-world reference and future validation target, but this ticket should first prove the VM package family in the standalone demo app. After these packages are public, `wesen-os` can migrate from old `@hypercard/*` aliases to public `@go-go-golems/os-*` packages in a separate, smaller migration ticket.

## Terms and Concepts

### Runtime bundle

A runtime bundle is a JavaScript source string loaded into QuickJS. It calls `defineRuntimeBundle(...)` and declares metadata, package IDs, initial state, and named surfaces. In TypeScript, the host describes the same bundle with `RuntimeBundleDefinition` from `@go-go-golems/os-core` / `@go-go-golems/os-shell`.

### Runtime surface

A runtime surface is one renderable VM unit inside a bundle. A surface has a surface ID, a surface type such as `ui.card.v1` or `kanban.v1`, a render function, and optional event handlers. The host opens surfaces in desktop windows, asks QuickJS to render them, validates the returned tree, and converts the tree to React.

### Runtime package

A runtime package is a VM-side API prelude. For example, `os-ui-cards` provides a prelude that registers `ui` helpers inside the sandbox. `os-kanban` provides a `widgets.kanban` helper namespace and declares a dependency on `ui`.

### Runtime surface type

A runtime surface type is the host-side renderer and validator for a VM tree. For example, `ui.card.v1` validates UI card nodes and renders them with React components. `kanban.v1` validates Kanban page nodes and renders them with the Kanban renderer.

### Scripting-aware store

The shell-only store knows about windowing, notifications, and app module reducers. VM surfaces also need `runtimeSessions`, `hypercardArtifacts`, artifact projection middleware, and runtime session lifecycle middleware. Those live in `@go-go-golems/os-scripting`.

## Current-State Architecture

### Package boundaries

The current package list shows the VM system is already separated into publishable package directories:

```text
packages/os-chat
packages/os-confirm
packages/os-core
packages/os-kanban
packages/os-repl
packages/os-scripting
packages/os-shell
packages/os-ui-cards
packages/os-widgets
```

The packages that matter for this wave are:

| Package | Current role | Publication role |
|---|---|---|
| `@go-go-golems/os-chat` | Shared chat UI/state/runtime helpers | Publish as a dependency of scripting and future host apps. |
| `@go-go-golems/os-confirm` | plz-confirm integration surfaces | Publish adjacent integration package. |
| `@go-go-golems/os-scripting` | QuickJS VM, runtime sessions, host bridge, runtime REPL | Main VM package. |
| `@go-go-golems/os-ui-cards` | Base UI DSL runtime package and `ui.card.v1` renderer | First runtime package consumers must register. |
| `@go-go-golems/os-kanban` | Higher-level Kanban runtime package and `kanban.v1` renderer | Advanced staged VM example. |

Evidence:

- `packages/os-scripting/package.json` describes the package as `QuickJS runtime, plugin, and REPL-session support for go-go-os` and depends on QuickJS packages.
- `packages/os-ui-cards/src/runtimeRegistration.tsx` exports `UI_RUNTIME_PACKAGE` and `UI_CARD_V1_RUNTIME_SURFACE_TYPE`.
- `packages/os-kanban/src/runtimeRegistration.tsx` exports `KANBAN_RUNTIME_PACKAGE` and `KANBAN_V1_RUNTIME_SURFACE_TYPE`.

### QuickJS session core

`packages/os-scripting/src/plugin-runtime/quickJsSessionCore.ts` is the lowest layer. It imports `quickjs-emscripten`, creates one shared QuickJS WASM module promise, creates runtime/context pairs, sets resource limits, evaluates code, dumps values back to native JavaScript, and disposes resources.

Important API points:

```ts
export interface QuickJsSessionCoreOptions {
  memoryLimitBytes: number;
  stackLimitBytes: number;
  loadTimeoutMs: number;
}

export async function createQuickJsSessionVm(
  scopeId: string,
  sessionId: string,
  options: QuickJsSessionCoreOptions,
  bootstrapSources: Array<{ code: string; filename: string }> = [],
): Promise<QuickJsSessionVm>
```

Evidence:

- The shared WASM module is initialized with `newQuickJSWASMModule(SINGLEFILE_RELEASE_SYNC)` in `quickJsSessionCore.ts:21-25`.
- Runtime limits are set with `runtime.setMemoryLimit`, `runtime.setMaxStackSize`, and `runtime.setInterruptHandler` in `quickJsSessionCore.ts:116-118`.
- Evaluation converts QuickJS errors into host errors in `evalQuickJsToNative` and `evalQuickJsCodeOrThrow` in `quickJsSessionCore.ts:60-95`.

### Runtime service

`packages/os-scripting/src/plugin-runtime/runtimeService.ts` is the service layer over sessions. It loads the bootstrap, installs runtime package preludes, evaluates bundle code, validates metadata, renders surfaces, runs event handlers, validates runtime actions, and exposes mutation methods for dynamic runtime surface injection.

Important API points:

```ts
export class QuickJSRuntimeService {
  async loadRuntimeBundle(
    stackId: StackId,
    sessionId: SessionId,
    packageIds: string[],
    code: string,
  ): Promise<RuntimeBundleMeta>

  renderRuntimeSurface(sessionId: SessionId, surfaceId: RuntimeSurfaceId, state: unknown): JsEvalResult<unknown>

  eventRuntimeSurface(
    sessionId: SessionId,
    surfaceId: RuntimeSurfaceId,
    handler: string,
    args: unknown,
    state: unknown,
  ): RuntimeAction[]
}
```

Evidence:

- Default VM limits are declared in `runtimeService.ts:24-30`: 32 MB memory, 1 MB stack, 1000 ms load timeout, 100 ms render/event timeouts.
- Package installation resolves dependency order and calls each package prelude in `runtimeService.ts:130-136`.
- Bundle loading creates a QuickJS session with `stack-bootstrap.vm.js`, installs packages, runs bundle code, reads metadata, and checks declared packages in `runtimeService.ts:138-190`.

### VM bootstrap API

`packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js` runs inside QuickJS. It defines the global VM APIs. This is the API bundle authors use.

VM-side API:

```js
defineRuntimeBundle(function({ ui, widgets }) {
  return {
    id: 'example',
    title: 'Example Bundle',
    packageIds: ['ui'],
    surfaces: {
      home: {
        packId: 'ui.card.v1',
        render({ state }) {
          return ui.panel([ui.text('Hello from QuickJS')]);
        },
        handlers: {
          clicked(ctx, args) {
            ctx.dispatch({ scope: 'system', command: 'notify', payload: { message: 'clicked' } });
          },
        },
      },
    },
  };
});
```

Evidence:

- `registerRuntimePackageApi` merges package exports and places them on `globalThis` in `stack-bootstrap.vm.js:28-43`.
- `defineRuntimeBundle` stores the bundle returned by the factory in `stack-bootstrap.vm.js:49-56`.
- Runtime surfaces are normalized and required to have `render()` in `stack-bootstrap.vm.js:67-93`.
- `__runtimeBundleHost.renderRuntimeSurface` calls the surface `render({ state })` in `stack-bootstrap.vm.js:173-181`.
- `__runtimeBundleHost.eventRuntimeSurface` collects dispatched actions from handlers in `stack-bootstrap.vm.js:183-211`.

### Host React bridge

`packages/os-scripting/src/runtime-host/RuntimeSurfaceSessionHost.tsx` is the React component that connects the desktop window to the runtime service.

It does four jobs:

1. Registers a runtime session in Redux.
2. Ensures the QuickJS session exists for the bundle/session ID.
3. Projects allowed host state into the VM-facing `state` object.
4. Renders the validated surface tree and dispatches events back into the runtime.

Important props:

```ts
export interface RuntimeSurfaceSessionHostProps {
  windowId: string;
  sessionId: string;
  bundle: RuntimeBundleDefinition;
  mode?: 'interactive' | 'preview';
}
```

Evidence:

- `RuntimeSurfaceSessionHost` accepts `windowId`, `sessionId`, and `bundle` in `RuntimeSurfaceSessionHost.tsx:98-110`.
- It registers the session with `registerRuntimeSession` in `RuntimeSurfaceSessionHost.tsx:179-193`.
- It calls `DEFAULT_RUNTIME_SESSION_MANAGER.ensureSession(...)` with package IDs and bundle code in `RuntimeSurfaceSessionHost.tsx:216-222`.
- It validates rendered trees with `validateRuntimeSurfaceTree` and renders them through `renderRuntimeSurfaceTree` in `RuntimeSurfaceSessionHost.tsx:410` and `RuntimeSurfaceSessionHost.tsx:513`.

### Runtime package registry

`packages/os-scripting/src/runtime-packages/runtimePackageRegistry.ts` is the host registry for VM preludes. A host application must register packages before loading a bundle that declares those package IDs.

API:

```ts
export interface RuntimePackageDefinition {
  packageId: string;
  version: string;
  summary?: string;
  docsMetadata?: Record<string, unknown>;
  installPrelude: string;
  surfaceTypes: string[];
  dependencies?: string[];
}

export function registerRuntimePackage(definition: RuntimePackageDefinition): void;
export function resolveRuntimePackageInstallOrder(packageIds: string[]): string[];
```

Evidence:

- Runtime packages include `installPrelude` and `dependencies` in `runtimePackageRegistry.ts:1-8`.
- `resolveRuntimePackageInstallOrder` performs dependency traversal and detects cycles in `runtimePackageRegistry.ts:29-55`.

### Runtime surface type registry

`packages/os-scripting/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx` is the host registry for surface validators and renderers. A host must register the surface type before `RuntimeSurfaceSessionHost` can render a VM tree of that type.

API:

```ts
export interface RuntimeSurfaceTypeDefinition<TTree> {
  packId: string;
  validateTree: (value: unknown) => TTree;
  render: (props: RuntimeSurfaceTypeRendererProps<TTree>) => ReactNode;
}

export function registerRuntimeSurfaceType<TTree>(definition: RuntimeSurfaceTypeDefinition<TTree>): void;
export function validateRuntimeSurfaceTree<TTree>(packId: string | undefined, value: unknown): TTree;
export function renderRuntimeSurfaceTree(packId: string | undefined, value: unknown, onEvent: ...): ReactNode;
```

### UI and Kanban runtime packages

`os-ui-cards` defines the base package consumers need first:

```ts
export const UI_RUNTIME_PACKAGE: RuntimePackageDefinition = {
  packageId: 'ui',
  version: '1.0.0',
  summary: 'Base UI DSL package providing ui.* node constructors.',
  installPrelude: uiPackagePrelude,
  surfaceTypes: ['ui.card.v1'],
};
```

`os-kanban` defines a package with a dependency on `ui`:

```ts
export const KANBAN_RUNTIME_PACKAGE: RuntimePackageDefinition = {
  packageId: 'kanban',
  version: '1.0.0',
  summary: 'Kanban widget DSL package providing widgets.kanban.* constructors.',
  installPrelude: kanbanPackagePrelude,
  surfaceTypes: ['kanban.v1'],
  dependencies: ['ui'],
};
```

Evidence:

- `UI_RUNTIME_PACKAGE` is defined in `packages/os-ui-cards/src/runtimeRegistration.tsx:6-14`.
- `KANBAN_RUNTIME_PACKAGE` is defined in `packages/os-kanban/src/runtimeRegistration.tsx:9-17`.

### Shell integration point

The desktop shell can render application windows through `renderAppWindow`, but VM surfaces are a different content kind. The shell accepts window content adapters through contributions.

A consumer app should provide a VM surface adapter that renders `RuntimeSurfaceSessionHost` for windows whose content kind is `surface`.

Pseudocode:

```tsx
import type { DesktopContribution, WindowContentAdapter } from '@go-go-golems/os-shell';
import { RuntimeSurfaceSessionHost } from '@go-go-golems/os-scripting';

export function createRuntimeSurfaceContribution(bundle): DesktopContribution {
  const runtimeSurfaceAdapter: WindowContentAdapter = {
    id: 'demo.runtime-surface',
    canRender: (window) => window.content.kind === 'surface',
    render: (window) => {
      if (window.content.kind !== 'surface') return null;
      return (
        <RuntimeSurfaceSessionHost
          windowId={window.id}
          sessionId={window.content.surface.surfaceSessionId}
          bundle={bundle}
        />
      );
    },
  };

  return {
    id: 'demo.runtime-surfaces',
    windowContentAdapters: [runtimeSurfaceAdapter],
  };
}
```

Evidence:

- `DesktopShellProps` includes `contributions?: DesktopContribution[]` in `packages/os-core/src/components/shell/windowing/desktopShellTypes.ts`.
- The shell merges contribution adapters with default adapters in `useDesktopShellController.tsx:1108-1115`.
- The default adapters only handle app windows and fallback rendering in `defaultWindowContentAdapters.tsx:3-22`; VM surface rendering must be provided by a contribution.

## Gap Analysis

### Publication gaps

The five VM-related packages currently have package metadata that blocks public npm publishing:

- `private: true` prevents publishing.
- `publishConfig.registry` points to GitHub Packages instead of public npm.
- Package READMEs are missing or too sparse for consumer onboarding.
- The packages use `workspace:*` dependencies that must be rewritten by the existing `build-dist.mjs` script before publication.

### Consumer API gaps

A consumer needs a concise recipe for six separate pieces:

1. Install package dependencies.
2. Register runtime packages and surface types exactly once.
3. Define a `RuntimeBundleDefinition` host object.
4. Author a `.vm.js` bundle with `defineRuntimeBundle`.
5. Add a `RuntimeSurfaceSessionHost` window content adapter.
6. Use the scripting-aware Redux store.

The current demo does not show these pieces. It has stage 05 for shell/window-manager and stage 06 for REPL, but no stage 07+ for the VM runtime.

### Validation gaps

The package-local tests are good, but publication needs consumer validation. The examples workspace should prove:

- direct install from npm works,
- Vite can load `.vm.js?raw` assets from consumer source,
- QuickJS WASM dependency works in a fresh app,
- runtime package preludes copied into `dist/` correctly,
- the shell can render surface windows through a contribution adapter,
- VM handlers can update session/surface state or route intents.

## Proposed Architecture

### Published package set

Publish these packages from `go-go-os-frontend`:

```text
@go-go-golems/os-chat@0.1.0
@go-go-golems/os-confirm@0.1.0
@go-go-golems/os-scripting@0.1.0
@go-go-golems/os-ui-cards@0.1.0
@go-go-golems/os-kanban@0.1.0
```

Dependency order:

```text
os-core            already public
os-repl            already public
os-widgets         already public

os-chat            depends on os-core
os-confirm         depends on os-core
os-scripting       depends on os-core, os-chat, os-repl
os-ui-cards        depends on os-core, os-scripting
os-kanban          depends on os-core, os-scripting, os-widgets, os-ui-cards
```

Build/publish order:

1. `os-chat`
2. `os-confirm`
3. `os-scripting`
4. `os-ui-cards`
5. `os-kanban`

The exact order matters because `build-dist.mjs` rewrites `workspace:*` dependencies to currently declared workspace versions, and downstream packages should depend on the published versions.

### Public package metadata

Each package should use public npm settings consistent with the already published packages:

```json
{
  "private": false,
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

If existing packages omit `private` instead of setting `false`, use the same style already adopted for `os-core`, `os-repl`, `os-widgets`, and `os-shell`.

### README requirements

Each package README should answer these questions:

- What is this package?
- When should a consumer install it?
- Which peer dependencies are required?
- Which runtime packages or surface types does it export?
- What must be registered at host startup?
- What is a minimal import example?
- Which package should users reach for next?

Minimal example for `os-scripting`:

```tsx
import { RuntimeSurfaceSessionHost } from '@go-go-golems/os-scripting';
import type { RuntimeBundleDefinition } from '@go-go-golems/os-shell';

export function RuntimeWindow({ windowId, sessionId, bundle }: {
  windowId: string;
  sessionId: string;
  bundle: RuntimeBundleDefinition;
}) {
  return <RuntimeSurfaceSessionHost windowId={windowId} sessionId={sessionId} bundle={bundle} />;
}
```

Minimal example for `os-ui-cards`:

```ts
import { registerRuntimePackage, registerRuntimeSurfaceType } from '@go-go-golems/os-scripting';
import { UI_RUNTIME_PACKAGE, UI_CARD_V1_RUNTIME_SURFACE_TYPE } from '@go-go-golems/os-ui-cards';

registerRuntimePackage(UI_RUNTIME_PACKAGE);
registerRuntimeSurfaceType(UI_CARD_V1_RUNTIME_SURFACE_TYPE);
```

### Demo examples

Add staged examples after the existing stage 06:

```text
examples/07-vm-ui-card
examples/08-vm-events-and-intents
examples/09-vm-kanban-runtime
```

Each example should be a directory with colocated source, CSS, and Storybook story:

```text
examples/07-vm-ui-card/src/VmUiCardExample.tsx
examples/07-vm-ui-card/src/VmUiCardExample.css
examples/07-vm-ui-card/src/VmUiCardExample.stories.tsx
examples/07-vm-ui-card/src/exampleBundle.vm.js
examples/07-vm-ui-card/src/index.ts
```

The root example registry should add stages 07, 08, and 09 so the browser navigator and Storybook both show them.

### Demo runtime registration

Runtime package registration should be idempotent. Put it in shared example code rather than repeating it in every example.

Pseudocode:

```ts
// examples/shared/src/registerRuntimePackages.ts
import { registerRuntimePackage, registerRuntimeSurfaceType } from '@go-go-golems/os-scripting';
import { UI_RUNTIME_PACKAGE, UI_CARD_V1_RUNTIME_SURFACE_TYPE } from '@go-go-golems/os-ui-cards';
import { KANBAN_RUNTIME_PACKAGE, KANBAN_V1_RUNTIME_SURFACE_TYPE } from '@go-go-golems/os-kanban';

let registered = false;

export function registerExampleRuntimePackages() {
  if (registered) return;
  registered = true;

  registerRuntimePackage(UI_RUNTIME_PACKAGE);
  registerRuntimeSurfaceType(UI_CARD_V1_RUNTIME_SURFACE_TYPE);
  registerRuntimePackage(KANBAN_RUNTIME_PACKAGE);
  registerRuntimeSurfaceType(KANBAN_V1_RUNTIME_SURFACE_TYPE);
}
```

### Demo scripting-aware store

For examples that render `RuntimeSurfaceSessionHost` inside a standalone view, create a dedicated Redux store with `createAppStore` from `os-scripting`.

Pseudocode:

```ts
import { Provider } from 'react-redux';
import { createAppStore } from '@go-go-golems/os-scripting';
import { RuntimeSurfaceSessionHost } from '@go-go-golems/os-scripting';

function VmExampleProvider({ children }) {
  const store = useMemo(() => createAppStore({}, { enableReduxDiagnostics: false }).store, []);
  return <Provider store={store}>{children}</Provider>;
}
```

For examples that want a full desktop shell, combine the scripting store with the `DesktopShell` and a runtime surface contribution.

### Runtime bundle authoring pattern

A minimal host-side bundle:

```ts
import type { RuntimeBundleDefinition } from '@go-go-golems/os-shell';
import bundleCode from './exampleBundle.vm.js?raw';

export const VM_UI_CARD_BUNDLE: RuntimeBundleDefinition = {
  id: 'vm-ui-card-example',
  name: 'VM UI Card Example',
  icon: '🧪',
  homeSurface: 'home',
  plugin: {
    packageIds: ['ui'],
    bundleCode,
    capabilities: {
      domain: [],
      system: ['notify'],
    },
  },
  surfaces: {
    home: {
      id: 'home',
      type: 'ui.card.v1',
      title: 'VM UI Card',
      icon: '🧪',
      ui: {},
    },
  },
};
```

A matching VM bundle:

```js
defineRuntimeBundle(({ ui }) => ({
  id: 'vm-ui-card-example',
  title: 'VM UI Card Example',
  packageIds: ['ui'],
  surfaces: {
    home: {
      packId: 'ui.card.v1',
      render({ state }) {
        return ui.panel([
          ui.text('Hello from QuickJS'),
          ui.text('Session: ' + state.self.sessionId),
        ]);
      },
    },
  },
}));
```

### Event and intent example pattern

The second stage should show handlers. Prefer a small surface-local state update first because it is deterministic and easy to see.

Pseudocode VM handler:

```js
handlers: {
  increment(ctx) {
    const current = Number(ctx.state.draft.count || 0);
    ctx.dispatch({
      scope: 'surface',
      action: 'patch',
      payload: { count: current + 1 },
    });
  },
}
```

If the action schema expects specific fields, use `packages/os-scripting/src/plugin-runtime/contracts.ts` and `intentSchema.ts` as the source of truth. Do not invent a demo-only action shape that bypasses validation.

### Kanban example pattern

The third stage should register both `ui` and `kanban`, then author a VM bundle that returns a Kanban page tree. Keep the board small and static at first, then add one handler such as selecting a task.

Pseudocode:

```js
defineRuntimeBundle(({ widgets }) => ({
  id: 'vm-kanban-example',
  title: 'VM Kanban Example',
  packageIds: ['ui', 'kanban'],
  surfaces: {
    board: {
      packId: 'kanban.v1',
      render() {
        return widgets.kanban.page({
          header: widgets.kanban.header({ title: 'VM Kanban' }),
          board: widgets.kanban.board({
            columns: [...],
            tasks: [...],
          }),
        });
      },
    },
  },
}));
```

The exact helper API should be verified from `packages/os-kanban/src/runtime-packages/kanban.package.vm.js` before implementation.

## Implementation Plan

### Phase 0: Documentation and validation baseline

1. Create this ticket and design doc.
2. Create a strict-format diary.
3. Add a task list.
4. Baseline validation:
   - `npm run typecheck -w packages/os-chat`
   - `npm run typecheck -w packages/os-confirm`
   - `npm run typecheck -w packages/os-scripting`
   - `npm run typecheck -w packages/os-ui-cards`
   - `npm run typecheck -w packages/os-kanban`
   - `npm test -w packages/os-chat`
   - `npm test -w packages/os-scripting`
   - `npm test -w packages/os-ui-cards`
   - `npm test -w packages/os-kanban`
   - `npm run build:dist -w ...` for all five packages.

### Phase 1: Make VM packages public-ready

Files:

```text
packages/os-chat/package.json
packages/os-confirm/package.json
packages/os-scripting/package.json
packages/os-ui-cards/package.json
packages/os-kanban/package.json
```

Actions:

- Remove `private: true` or set `private: false`.
- Change `publishConfig` to public npm.
- Verify dependency versions are correct after `build:dist`.
- Add package READMEs.

### Phase 2: Local package validation

Commands:

```bash
npm run typecheck -w packages/os-chat
npm run typecheck -w packages/os-confirm
npm run typecheck -w packages/os-scripting
npm run typecheck -w packages/os-ui-cards
npm run typecheck -w packages/os-kanban

npm test -w packages/os-chat
npm test -w packages/os-scripting
npm test -w packages/os-ui-cards
npm test -w packages/os-kanban

npm run build:dist -w packages/os-chat
npm run build:dist -w packages/os-confirm
npm run build:dist -w packages/os-scripting
npm run build:dist -w packages/os-ui-cards
npm run build:dist -w packages/os-kanban
```

Then inspect each `dist/package.json` to ensure:

- `private` is absent,
- `publishConfig.registry` is npmjs,
- workspace dependencies have concrete versions,
- `.vm.js` files were copied,
- README files were copied.

### Phase 3: Publish

Publish from each package `dist/` directory:

```bash
npm publish packages/os-chat/dist --access public --registry https://registry.npmjs.org/
npm publish packages/os-confirm/dist --access public --registry https://registry.npmjs.org/
npm publish packages/os-scripting/dist --access public --registry https://registry.npmjs.org/
npm publish packages/os-ui-cards/dist --access public --registry https://registry.npmjs.org/
npm publish packages/os-kanban/dist --access public --registry https://registry.npmjs.org/
```

Verify with explicit npmjs registry:

```bash
npm view @go-go-golems/os-scripting version --registry https://registry.npmjs.org/
```

### Phase 4: Demo dependency update

In `2026-05-11--npm-go-go-os-test/package.json`, add:

```json
{
  "@go-go-golems/os-chat": "^0.1.0",
  "@go-go-golems/os-confirm": "^0.1.0",
  "@go-go-golems/os-scripting": "^0.1.0",
  "@go-go-golems/os-ui-cards": "^0.1.0",
  "@go-go-golems/os-kanban": "^0.1.0"
}
```

Run:

```bash
npm install
npm ls @go-go-golems/os-scripting @go-go-golems/os-ui-cards @go-go-golems/os-kanban
```

### Phase 5: Demo examples

Add staged examples:

```text
examples/07-vm-ui-card
examples/08-vm-events-and-intents
examples/09-vm-kanban-runtime
```

Update:

```text
src/exampleRegistry.ts
README.md
.storybook/main.ts if needed
examples/shared/src/index.ts
```

### Phase 6: Consumer validation

Run in demo repo:

```bash
npm run typecheck
npm run build
npm run build-storybook
npm run dev -- --host 127.0.0.1 --force
```

Browser-smoke:

- stage 07 renders a VM-produced UI card,
- stage 08 runs a VM event handler and visibly updates state,
- stage 09 renders the VM Kanban surface,
- console has no package-resolution or QuickJS initialization errors.



### Vite dev-server dependency optimization note

The published VM packages import `.vm.js?raw` assets from package code. Vite production builds handle these imports, but Vite dev dependency optimization can hand package code to esbuild before Vite's raw-import plugin handles the query. The symptom is an error like:

```text
No matching export in "node_modules/@go-go-golems/os-scripting/plugin-runtime/stack-bootstrap.vm.js?raw" for import "default"
```

Standalone Vite consumers should exclude the VM runtime packages from dependency optimization:

```ts
const vmRuntimePackages = [
  '@go-go-golems/os-scripting',
  '@go-go-golems/os-ui-cards',
  '@go-go-golems/os-kanban',
];

export default defineConfig({
  optimizeDeps: {
    exclude: vmRuntimePackages,
    include: ['debug'],
  },
});
```

The `debug` include is necessary because excluded VM packages import published code that depends on `debug`; without prebundling, Vite may serve the CommonJS browser file directly and hit `ReferenceError: exports is not defined`.

## Testing and Validation Strategy

### Package-level tests

Use package tests to verify runtime internals:

- `os-scripting` tests cover QuickJS session service, runtime service, runtime package registry, runtime surface type registry, runtime session host rerender behavior, runtime REPL drivers, and artifact projection.
- `os-ui-cards` tests cover UI runtime registration and schema validation.
- `os-kanban` tests cover Kanban runtime registration and rendering contracts.
- `os-chat` tests cover chat runtime helpers used by scripting/debug surfaces.

### Dist-level validation

Because this work is about publishing, `src/` success is not enough. Always inspect `dist/` output after `build:dist`.

Checklist:

```bash
node -e "console.log(require('./packages/os-scripting/dist/package.json'))"
find packages/os-scripting/dist -name '*.vm.js' -print
find packages/os-ui-cards/dist -name '*.vm.js' -print
find packages/os-kanban/dist -name '*.vm.js' -print
```

### Consumer validation

The standalone demo is the real validation target. It must install from npm and build without workspace aliases. The demo should not commit local tarball paths.

### Browser validation

Use Playwright to inspect visible text and console errors. For example:

```js
await page.goto('http://127.0.0.1:5173/');
await page.getByRole('button', { name: /07 VM UI card/ }).click();
await expect(page.getByText('Hello from QuickJS')).toBeVisible();
```

## Risks and Mitigations

### Risk: QuickJS package size and bundler behavior

QuickJS WASM/singlefile dependencies can be sensitive to bundlers. Mitigation: validate with Vite production build, Storybook build, and browser runtime smoke in the external demo.

### Risk: `.vm.js` assets missing from published packages

The build script copies `.vm.js` assets, but each package must be checked. Mitigation: inspect `dist/` and run a consumer example that imports package-provided runtime package definitions.

### Risk: duplicate runtime registries

If multiple copies of `os-scripting` are installed, one package may register runtime packages into a registry that another copy does not use. Mitigation: run `npm ls @go-go-golems/os-scripting` in the demo and ensure dedupe.

### Risk: package publication order

Publishing `os-ui-cards` before `os-scripting` exists on npm can create an install gap. Mitigation: publish in dependency order and verify `npm view` after each package.

### Risk: API surface too broad

`os-scripting` currently exports many internals. Mitigation: publish 0.1.0 with README language that marks the stable consumer path: `createAppStore`, runtime package registration, runtime surface registration, and `RuntimeSurfaceSessionHost`. Treat lower-level service APIs as advanced.

## Alternatives Considered

### Alternative 1: Keep VM packages private and only publish examples later

Rejected. The user goal is to publish the VM packages and demonstrate standalone consumption. Keeping the VM private would keep `wesen-os` and other apps dependent on sibling workspace aliases.

### Alternative 2: Fold VM host into `os-shell`

Rejected for this ticket. `os-shell` is intentionally the public shell/window-manager boundary. Pulling QuickJS and CodeMirror-related dependencies into it would make ordinary shell consumers pay for the VM runtime even when they only want app windows and menus.

### Alternative 3: Publish only `os-scripting`

Rejected. A useful consumer needs at least one runtime package and one surface renderer. `os-scripting` alone can execute bundles, but consumers would immediately hit `Unknown runtime package: ui` or `Unknown runtime surface type: ui.card.v1` unless `os-ui-cards` is also published.

### Alternative 4: Build demo examples against local source only

Rejected as final state. Local source validation is useful before publication, but the committed demo must validate public npm consumption.

## API Reference Summary

### `@go-go-golems/os-scripting`

Primary consumer APIs:

```ts
createAppStore(domainReducers, options)
registerRuntimePackage(definition)
registerRuntimeSurfaceType(definition)
RuntimeSurfaceSessionHost
RuntimeSurfaceSessionHostProps
```

Advanced APIs:

```ts
QuickJSRuntimeService
DEFAULT_RUNTIME_SESSION_MANAGER
createRuntimeSessionManager
registerRuntimeSurface
clearRuntimeSurfaceRegistry
createHypercardReplDriver
createJsReplDriver
```

### `@go-go-golems/os-ui-cards`

Primary APIs:

```ts
UI_RUNTIME_PACKAGE
UI_CARD_V1_RUNTIME_SURFACE_TYPE
validateUINode
UIRuntimeRenderer
```

### `@go-go-golems/os-kanban`

Primary APIs:

```ts
KANBAN_RUNTIME_PACKAGE
KANBAN_V1_RUNTIME_SURFACE_TYPE
KanbanV1Renderer
validateKanbanV1Node
```

### `@go-go-golems/os-shell`

Runtime integration APIs needed by the demo:

```ts
DesktopShell
DesktopContribution
WindowContentAdapter
RuntimeBundleDefinition
createLauncherStore
collectModuleReducers
```

For VM examples, use `createAppStore` from `os-scripting` instead of `createLauncherStore` if runtime sessions are needed.

## File Reference Index

### Package publication files

```text
packages/os-chat/package.json
packages/os-confirm/package.json
packages/os-scripting/package.json
packages/os-ui-cards/package.json
packages/os-kanban/package.json
scripts/packages/build-dist.mjs
```

### Runtime core files

```text
packages/os-scripting/src/plugin-runtime/quickJsSessionCore.ts
packages/os-scripting/src/plugin-runtime/jsSessionService.ts
packages/os-scripting/src/plugin-runtime/runtimeService.ts
packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js
packages/os-scripting/src/plugin-runtime/contracts.ts
packages/os-scripting/src/plugin-runtime/intentSchema.ts
```

### Runtime host and state files

```text
packages/os-scripting/src/runtime-host/RuntimeSurfaceSessionHost.tsx
packages/os-scripting/src/runtime-host/pluginIntentRouting.ts
packages/os-scripting/src/app/createAppStore.ts
packages/os-scripting/src/app/runtimeSessionLifecycleMiddleware.ts
packages/os-scripting/src/features/runtimeSessions/runtimeSessionsSlice.ts
packages/os-scripting/src/features/runtimeSessions/selectors.ts
```

### Runtime package files

```text
packages/os-scripting/src/runtime-packages/runtimePackageRegistry.ts
packages/os-scripting/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx
packages/os-ui-cards/src/runtimeRegistration.tsx
packages/os-ui-cards/src/runtime-packages/ui.package.vm.js
packages/os-ui-cards/src/runtime-packs/uiCardV1Pack.tsx
packages/os-kanban/src/runtimeRegistration.tsx
packages/os-kanban/src/runtime-packages/kanban.package.vm.js
packages/os-kanban/src/runtime-packs/kanbanV1Pack.tsx
```

### Demo files to add or update

```text
2026-05-11--npm-go-go-os-test/package.json
2026-05-11--npm-go-go-os-test/package-lock.json
2026-05-11--npm-go-go-os-test/src/exampleRegistry.ts
2026-05-11--npm-go-go-os-test/README.md
2026-05-11--npm-go-go-os-test/examples/shared/src/registerRuntimePackages.ts
2026-05-11--npm-go-go-os-test/examples/07-vm-ui-card/src/*
2026-05-11--npm-go-go-os-test/examples/08-vm-events-and-intents/src/*
2026-05-11--npm-go-go-os-test/examples/09-vm-kanban-runtime/src/*
```
