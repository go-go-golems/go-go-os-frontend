# @go-go-golems/os-scripting

QuickJS-backed scripting runtime for go-go-os React hosts.

Use this package when a standalone app needs to load JavaScript runtime bundles as data, execute them inside a sandbox, render runtime surfaces, and route surface events back into host state.

## Install

```bash
npm install @go-go-golems/os-scripting @go-go-golems/os-ui-cards @go-go-golems/os-shell @go-go-golems/os-core
npm install react react-dom react-redux @reduxjs/toolkit
```

`react`, `react-dom`, `react-redux`, and `@reduxjs/toolkit` are peer dependencies.

## Main exports

```ts
import {
  createAppStore,
  RuntimeSurfaceSessionHost,
  registerRuntimePackage,
  registerRuntimeSurfaceType,
} from '@go-go-golems/os-scripting';
```

Consumer-facing APIs:

- `createAppStore(domainReducers, options)` — creates a Redux store with runtime session reducers and middleware.
- `RuntimeSurfaceSessionHost` — React bridge that loads a runtime bundle and renders the current surface.
- `registerRuntimePackage(definition)` — registers a VM-side package prelude such as `ui` or `kanban`.
- `registerRuntimeSurfaceType(definition)` — registers a host-side validator/renderer such as `ui.card.v1`.

Advanced APIs include the QuickJS runtime service, runtime session manager, attached REPL drivers, debug windows, and dynamic runtime surface registry.

## Minimal runtime registration

```ts
import { registerRuntimePackage, registerRuntimeSurfaceType } from '@go-go-golems/os-scripting';
import { UI_RUNTIME_PACKAGE, UI_CARD_V1_RUNTIME_SURFACE_TYPE } from '@go-go-golems/os-ui-cards';

let registered = false;

export function registerRuntimePackages() {
  if (registered) return;
  registered = true;

  registerRuntimePackage(UI_RUNTIME_PACKAGE);
  registerRuntimeSurfaceType(UI_CARD_V1_RUNTIME_SURFACE_TYPE);
}
```

Call this once at app startup before rendering runtime surfaces.

## Minimal store

```tsx
import { Provider } from 'react-redux';
import { createAppStore } from '@go-go-golems/os-scripting';

const { store } = createAppStore({});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
```

Use `createAppStore` when rendering VM surfaces. It includes `runtimeSessions`, runtime lifecycle middleware, and artifact projection middleware. For shell-only apps that never render VM surfaces, `createLauncherStore` from `@go-go-golems/os-shell` is lighter.

## Minimal surface host

```tsx
import { RuntimeSurfaceSessionHost } from '@go-go-golems/os-scripting';
import type { RuntimeBundleDefinition } from '@go-go-golems/os-shell';

export function RuntimeWindow({ bundle }: { bundle: RuntimeBundleDefinition }) {
  return (
    <RuntimeSurfaceSessionHost
      windowId="window:demo"
      sessionId="session:demo"
      bundle={bundle}
    />
  );
}
```

## Runtime bundle shape

Host TypeScript:

```ts
import type { RuntimeBundleDefinition } from '@go-go-golems/os-shell';
import bundleCode from './bundle.vm.js?raw';

export const BUNDLE: RuntimeBundleDefinition = {
  id: 'hello-vm',
  name: 'Hello VM',
  icon: '🧪',
  homeSurface: 'home',
  plugin: {
    packageIds: ['ui'],
    bundleCode,
    capabilities: { domain: [], system: [] },
  },
  surfaces: {
    home: {
      id: 'home',
      type: 'ui.card.v1',
      title: 'Hello VM',
      icon: '🧪',
      ui: {},
    },
  },
};
```

VM JavaScript:

```js
defineRuntimeBundle(({ ui }) => ({
  id: 'hello-vm',
  title: 'Hello VM',
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

## Security model

Runtime bundle code runs inside QuickJS, not in the browser global environment. It does not receive direct DOM, network, local storage, filesystem, or Node.js access. It communicates with the host by returning structured UI trees and dispatching validated runtime actions from event handlers.

## Related packages

- `@go-go-golems/os-ui-cards` — base `ui` VM package and `ui.card.v1` renderer.
- `@go-go-golems/os-kanban` — higher-level Kanban VM package and renderer.
- `@go-go-golems/os-shell` — desktop shell, app launcher, and window content adapter types.
- `@go-go-golems/os-repl` — terminal UI used by scripting REPL integrations.
