# @go-go-golems/os-ui-cards

Base UI runtime package and renderer for go-go-os VM surfaces.

Use this package with `@go-go-golems/os-scripting` when a runtime bundle should return simple structured UI trees such as panels, text, buttons, inputs, rows, columns, badges, tables, dropdowns, and selectable tables.

## Install

```bash
npm install @go-go-golems/os-scripting @go-go-golems/os-ui-cards
npm install react react-dom react-redux @reduxjs/toolkit
```

## Bundler note

Starting with `@go-go-golems/os-ui-cards@0.1.1`, the package's VM-side `ui` prelude is shipped as a generated JavaScript string module. Consumers do **not** need to exclude this package from Vite dependency optimization.

You may still import your own app-local VM bundles with `?raw`; that is an application concern, not a package workaround.

## Main exports

```ts
import {
  UI_RUNTIME_PACKAGE,
  UI_CARD_V1_RUNTIME_SURFACE_TYPE,
  UIRuntimeRenderer,
  validateUINode,
} from '@go-go-golems/os-ui-cards';
```

- `UI_RUNTIME_PACKAGE` registers the VM-side `ui` helper namespace.
- `UI_CARD_V1_RUNTIME_SURFACE_TYPE` registers the host-side `ui.card.v1` validator and renderer.
- `UIRuntimeRenderer` renders a validated UI node tree directly.
- `validateUINode` validates unknown data before rendering.

## Register with os-scripting

```ts
import { registerRuntimePackage, registerRuntimeSurfaceType } from '@go-go-golems/os-scripting';
import { UI_RUNTIME_PACKAGE, UI_CARD_V1_RUNTIME_SURFACE_TYPE } from '@go-go-golems/os-ui-cards';

registerRuntimePackage(UI_RUNTIME_PACKAGE);
registerRuntimeSurfaceType(UI_CARD_V1_RUNTIME_SURFACE_TYPE);
```

Register once before any runtime bundle declares `packageIds: ['ui']` or any surface declares `packId: 'ui.card.v1'`.

## VM-side usage

```js
defineRuntimeBundle(({ ui }) => ({
  id: 'ui-example',
  title: 'UI Example',
  packageIds: ['ui'],
  surfaces: {
    home: {
      packId: 'ui.card.v1',
      render({ state }) {
        return ui.panel([
          ui.text('Hello from a sandboxed runtime surface'),
          ui.row([
            ui.badge('QuickJS'),
            ui.badge(state.ui.runtimeStatus),
          ]),
          ui.button('Notify host', { onClick: { handler: 'notify' } }),
        ]);
      },
      handlers: {
        notify(ctx) {
          ctx.dispatch({
            type: 'notify.show',
            payload: { message: 'Hello from the VM' },
          });
        },
      },
    },
  },
}));
```

If a bundle dispatches `notify.show`, its host `RuntimeBundleDefinition.plugin.capabilities.system` must include `'notify.show'`, and the React host must render toast/notification chrome from the same Redux provider.

## Surface contract

A `ui.card.v1` surface returns a JSON-like tree. The VM bundle constructs the tree with `ui.*` helpers. The host validates the tree and renders it with React. Event references name VM handlers; the browser never executes the VM bundle as normal page JavaScript.

## Related packages

- `@go-go-golems/os-scripting` — QuickJS runtime, runtime sessions, and React host bridge.
- `@go-go-golems/os-kanban` — runtime package for Kanban surfaces built on top of `ui`.
- `@go-go-golems/os-core` — theme, primitive widgets, and shell types used by the renderer.
