# Authoring Surface Source Editing Guide

Last verified against source: 2026-03-11

This guide explains how authored runtime surface source is preserved, edited, and surfaced through
the current frontend tooling.

It is for a new intern who needs to understand:

- where built-in runtime surface source actually comes from
- how `vmmeta` fits into source editing
- why package docs and bundle-owned surface docs are different
- how `Stacks & Cards` can open an editor for built-in source
- what a new package or app must do if it wants source editing to work

Related guides:

- [runtime-concepts-guide.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/docs/runtime-concepts-guide.md)
- [repl-and-runtime-debug-guide.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/docs/repl-and-runtime-debug-guide.md)
- [js-api-user-guide-reference.md](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/docs/js-api-user-guide-reference.md)

## 1. The short version

Built-in source editing works only if the authored runtime surface source is preserved all the way
through the toolchain.

That means:

```text
authored VM source files
  -> vmmeta generation
  -> bundle metadata / surface metadata
  -> runtime debug window
  -> code editor launcher
```

If one layer drops the source string, editing stops working.

## 2. The two ownership levels

There are two different kinds of docs/source metadata in the current system.

### Package-owned docs

These describe the DSL or API surface owned by a runtime package.

Examples:

- `ui`
- `kanban`

These belong in:

- `@go-go-golems/os-ui-cards`
- `@go-go-golems/os-kanban`

### Bundle-owned authored surface source and docs

These describe the concrete surfaces authored inside one app bundle.

Examples:

- `home`
- `lowStock`
- `kanbanSprintBoard`

These belong in the app bundle, not in the package.

This distinction is why package docs and built-in source editing are related but not identical.

## 3. Where authored source starts

Current pattern:

- split VM source files under `src/domain/vm/`

Examples:

- [apps/os-launcher/src/domain/vm/cards/kanbanSprintBoard.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/cards/kanbanSprintBoard.vm.js)
- [workspace-links/go-go-app-inventory/apps/inventory/src/domain/vm/cards/home.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/domain/vm/cards/home.vm.js)

These files are the real authored source of truth.

They are better than embedding everything in one giant string because they support:

- exact source preservation
- docs extraction
- per-surface metadata
- easier editing and review

## 4. `vmmeta`

`vmmeta` is the generated metadata layer extracted from authored VM files.

It preserves:

- ids
- titles/icons
- package ids / surface type ids
- exact source strings
- handler names
- docs entries

Examples:

- [apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts)
- [workspace-links/go-go-app-inventory/apps/inventory/src/domain/generated/inventoryVmmeta.generated.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/domain/generated/inventoryVmmeta.generated.ts)

If `vmmeta` generation fails or is skipped, built-in source editing gets much weaker.

## 5. How source reaches bundle metadata

The app must explicitly expose generated metadata to its bundle definition.

Typical path:

- generated metadata module
- app-local `vmmeta.ts`
- app-local `stack.ts` or bundle-definition file

That final bundle metadata should preserve source on each built-in surface, usually under:

- `meta.runtime.source`

This is what the debug/editor tooling reads.

## 6. How `Stacks & Cards` finds built-in source

Main files:

- [RuntimeSurfaceDebugWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-scripting/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx)
- [editorLaunch.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-scripting/src/hypercard/editor/editorLaunch.ts)

Current flow:

1. the debug window renders predefined bundle surfaces
2. it looks for `surface.meta.runtime.source`
3. if present, it shows `Edit`
4. clicking `Edit` opens a code editor window with that exact source string

Pseudo-flow:

```ts
const source = surface.meta?.runtime?.source;

if (source) {
  openCodeEditor(dispatch, { ownerAppId, surfaceId }, source);
}
```

So the editor is not re-reading a file from disk. It is editing the source string preserved in the
bundle metadata.

## 7. What happens for runtime-injected surfaces

There is a second source-editing path:

- runtime-injected surfaces from artifacts or ad-hoc registration

Those do not need `vmmeta` because they are already source-string first:

- registry entries already have `code`
- artifacts already carry runtime surface code

That is why built-in source editing and injected-surface editing look similar in the UI but come
from different provenance paths.

## 8. Common failure modes

### Failure: surface has no `Edit` button

Likely causes:

- the bundle metadata dropped `meta.runtime.source`
- `vmmeta` generation was not wired
- the app-local `vmmeta.ts` was not connected to the bundle definition

### Failure: package docs exist but built-in source editing does not

That usually means:

- package docs were mounted correctly
- but bundle-owned surface source metadata was not exposed

Those are related systems, not the same system.

### Failure: source editor opens stale or giant bundled code

That usually means:

- the app is still preserving only the raw bundle string
- not per-surface generated source metadata

### Failure: docs browser has package docs but not per-surface docs

That usually means:

- package-owned docs are mounted
- bundle-owned `vmmeta` docs were not mounted

## 9. Recommended implementation pattern for new packages/apps

If you want good authoring and source-editing support, follow this checklist:

1. author runtime surfaces as real split VM files
2. add docs metadata with `__doc__`, `doc\`\``, and related helpers
3. generate `vmmeta`
4. expose `vmmeta` through an app-local `vmmeta.ts`
5. attach `meta.runtime.source` to each built-in surface
6. mount both package docs and bundle-owned surface docs
7. verify `Edit` appears in `Stacks & Cards`

## 10. File-by-file map

Read these in order if you are onboarding:

1. [apps/os-launcher/src/domain/vm/cards/kanbanSprintBoard.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/cards/kanbanSprintBoard.vm.js)
2. [apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts)
3. [apps/os-launcher/src/domain/vmmeta.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vmmeta.ts)
4. [apps/os-launcher/src/domain/stack.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/stack.ts)
5. [RuntimeSurfaceDebugWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/os-scripting/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx)
