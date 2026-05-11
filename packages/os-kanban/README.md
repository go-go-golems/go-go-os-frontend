# @go-go-golems/os-kanban

Kanban runtime package and renderer for go-go-os VM surfaces.

Use this package when a sandboxed runtime bundle should describe a Kanban page with semantic nodes instead of hand-written React components. It pairs with `@go-go-golems/os-scripting` and depends on the base `ui` runtime package from `@go-go-golems/os-ui-cards`.

## Install

```bash
npm install @go-go-golems/os-scripting @go-go-golems/os-ui-cards @go-go-golems/os-kanban
npm install react react-dom react-redux @reduxjs/toolkit
```

## Main exports

```ts
import {
  KANBAN_RUNTIME_PACKAGE,
  KANBAN_V1_RUNTIME_SURFACE_TYPE,
  KanbanV1Renderer,
  validateKanbanV1Node,
} from '@go-go-golems/os-kanban';
```

- `KANBAN_RUNTIME_PACKAGE` registers the VM-side `widgets.kanban.*` helper namespace.
- `KANBAN_V1_RUNTIME_SURFACE_TYPE` registers the host-side `kanban.v1` validator and renderer.
- `KanbanV1Renderer` renders a validated Kanban tree directly.
- `validateKanbanV1Node` validates unknown data before rendering.

## Register with os-scripting

```ts
import { registerRuntimePackage, registerRuntimeSurfaceType } from '@go-go-golems/os-scripting';
import { UI_RUNTIME_PACKAGE, UI_CARD_V1_RUNTIME_SURFACE_TYPE } from '@go-go-golems/os-ui-cards';
import { KANBAN_RUNTIME_PACKAGE, KANBAN_V1_RUNTIME_SURFACE_TYPE } from '@go-go-golems/os-kanban';

registerRuntimePackage(UI_RUNTIME_PACKAGE);
registerRuntimeSurfaceType(UI_CARD_V1_RUNTIME_SURFACE_TYPE);
registerRuntimePackage(KANBAN_RUNTIME_PACKAGE);
registerRuntimeSurfaceType(KANBAN_V1_RUNTIME_SURFACE_TYPE);
```

`KANBAN_RUNTIME_PACKAGE` declares `dependencies: ['ui']`, so the runtime service installs `ui` before `kanban` when a bundle declares both packages.

## VM-side usage

The VM helper API is exposed under `widgets.kanban`.

```js
defineRuntimeBundle(({ widgets }) => ({
  id: 'kanban-example',
  title: 'Kanban Example',
  packageIds: ['ui', 'kanban'],
  surfaces: {
    board: {
      packId: 'kanban.v1',
      render() {
        return widgets.kanban.page(
          widgets.kanban.taxonomy({
            issueTypes: [{ id: 'task', label: 'Task' }],
            priorities: [{ id: 'high', label: 'High' }],
            labels: [{ id: 'docs', label: 'Docs' }],
          }),
          widgets.kanban.header({ title: 'Runtime Kanban' }),
          widgets.kanban.board({
            columns: [
              { id: 'todo', title: 'Todo', icon: '□' },
              { id: 'done', title: 'Done', icon: '✓' },
            ],
            tasks: [
              {
                id: 't1',
                col: 'todo',
                title: 'Publish VM packages',
                type: 'task',
                labels: ['docs'],
                priority: 'high',
                desc: 'Prepare and validate the public runtime package wave.',
              },
            ],
            editingTask: null,
            collapsedCols: {},
          }),
        );
      },
    },
  },
}));
```

Check the exported TypeScript types and the package examples for the exact node schema supported by the current renderer.

## Related packages

- `@go-go-golems/os-scripting` — QuickJS runtime and host bridge.
- `@go-go-golems/os-ui-cards` — base UI runtime package required by Kanban.
- `@go-go-golems/os-widgets` — shared rich widgets used by the Kanban renderer.
