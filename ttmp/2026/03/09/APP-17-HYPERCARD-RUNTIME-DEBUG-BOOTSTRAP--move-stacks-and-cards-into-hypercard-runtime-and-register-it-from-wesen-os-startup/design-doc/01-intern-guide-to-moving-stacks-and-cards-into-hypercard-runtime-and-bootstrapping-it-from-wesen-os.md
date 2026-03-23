---
Title: Intern guide to moving Stacks and Cards into hypercard-runtime and bootstrapping it from wesen-os
Ticket: APP-17-HYPERCARD-RUNTIME-DEBUG-BOOTSTRAP
Status: completed
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/App.tsx
      Note: |-
        Host startup seam where wesen-os can register runtime-debug surfaces globally
        Startup/bootstrap seam for global debug registration
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/app/modules.tsx
      Note: |-
        Current launchable-module composition list for the desktop
        Launcher module composition seam in wesen-os
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/app/registry.ts
      Note: |-
        Registry creation seam where registration helpers can be integrated
        App registry creation seam for later registration work
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.tsx
      Note: |-
        Current launcher and window-routing owner for Stacks and Cards
        Current inventory-owned Stacks and Cards launcher and routing seam
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx
      Note: |-
        Shared debug component that still contains residual inventory ownership assumptions
        Shared debug surface and residual inventory coupling
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/runtimeDebugApp.tsx
      Note: |-
        Package-owned runtime debug window payload and render wrapper added by APP-17
        Shared runtime debug app surface
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/runtimeDebugRegistry.ts
      Note: |-
        Package-owned stack registration hook used by host apps such as wesen-os
        Shared stack registration seam
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/editorLaunch.ts
      Note: |-
        Editor-launch helper whose ownerAppId flow must become explicit
        Explicit ownerAppId editor-launch seam that later registration must drive
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/index.ts
      Note: |-
        Public export seam for a future launcher-module factory or registration helper
        Future export seam for runtime-debug module factory
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/public.ts
      Note: |-
        Inventory public export seam used to expose inventoryStack to host apps
        Inventory stack export used by wesen-os registration
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/app/runtimeDebugModule.tsx
      Note: |-
        Thin wesen-os launcher wrapper that registers stacks and renders the shared runtime debug app
        Host-level runtime debug launcher wrapper
ExternalSources: []
Summary: Detailed design and implementation guide for the completed extraction of Stacks and Cards from inventory ownership and its registration from wesen-os startup through shared runtime-debug helpers.
LastUpdated: 2026-03-10T23:35:00-04:00
WhatFor: Use this guide when reviewing the completed APP-17 implementation or when preparing the next follow-up that will add built-in VM source display on top of the shared runtime debug surface.
WhenToUse: Use when onboarding an intern to runtime-debug ownership, when reviewing why the final implementation uses package-owned helpers plus a thin wesen-os wrapper, or when extending the debugger after APP-17.
---


# Intern guide to moving Stacks and Cards into hypercard-runtime and bootstrapping it from wesen-os

## Executive Summary

`Stacks & Cards` started as a half-extracted tool: the reusable view component lived in `hypercard-runtime`, while the launcher entry, window payload, and actual user-facing route still lived inside the inventory app. APP-17 finished that extraction. The debug surface is now package-owned in `hypercard-runtime`, while `wesen-os` registers the launcher entry at startup through a thin host wrapper.

The implemented shape is deliberately simple: `hypercard-runtime` exports stack registration hooks and a shared runtime debug app wrapper, and `wesen-os` binds those helpers into a normal launcher module. Inventory no longer owns bespoke Stacks and Cards route glue; it only launches the shared app and re-exports its stack so hosts can register it.

This guide explains the original problem, the dependency-cycle constraint that changed the design, the final API we implemented, the migration phases, and the validation strategy. It is written for a new intern who needs enough context to understand why the finished architecture looks the way it does.

## Problem Statement

Today, a user can open `Stacks & Cards` from inventory because inventory still creates the window payload and routes the app key to the shared `RuntimeCardDebugWindow`. The component itself is in `hypercard-runtime`, but that does not make the whole feature app-agnostic. The feature is still operationally coupled to inventory in three important ways:

- inventory owns the launcher/menu/folder entry
- inventory owns the app-window route for the debug surface
- the shared component still assumes `ownerAppId: 'inventory'` when it opens the runtime card editor

This creates several problems:

1. `wesen-os` cannot expose `Stacks & Cards` as a first-class global debug tool without reimplementing inventory-specific glue.
2. The runtime-debug feature is harder to reason about because ownership is split across packages in a misleading way.
3. Future improvements, such as built-in VM card source display, multi-stack selection, or app-specific debug registration, are harder because the package boundary is incomplete.

The objective is not to rewrite the window UI. The objective is to move ownership of the feature boundary.

## Current System

### 1. Current ownership map

Current reality:

- `hypercard-runtime` owns:
  - `RuntimeCardDebugWindow`
  - `CodeEditorWindow`
  - `editorLaunch`
  - runtime-artifact and runtime-registry selectors
- inventory owns:
  - the `Stacks & Cards` launcher entry
  - the app-key/window payload for opening the debugger
  - the route that renders the shared component
- `wesen-os` currently owns:
  - global launcher composition for the desktop
  - app startup and registry creation
  - no shared Stacks and Cards registration yet

### 2. Concrete file seams

The current inventory ownership is visible in:

- `apps/inventory/src/launcher/renderInventoryApp.tsx`

This file:

- imports `RuntimeCardDebugWindow`
- creates `buildRuntimeDebugWindowPayload()`
- exposes the launcher/folder entry
- routes the debug app key to `<RuntimeCardDebugWindow stacks={[STACK]} />`

The current shared component lives in:

- `packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx`

This file is already shared, but it still contains app-specific behavior:

```tsx
openCodeEditor(dispatch, { ownerAppId: 'inventory', cardId: card.cardId }, card.code)
```

That hardcoded owner app proves the feature is not truly generic yet.

The current wesen-os startup seam lives in:

- `apps/os-launcher/src/App.tsx`
- `apps/os-launcher/src/app/modules.tsx`
- `apps/os-launcher/src/app/registry.ts`

These files already compose all first-party launcher modules. That makes them the correct place to register a shared runtime-debug module.

### 3. Runtime flow today

Current flow:

```text
Inventory launcher/menu
    ->
buildRuntimeDebugWindowPayload()
    ->
inventory app route
    ->
RuntimeCardDebugWindow
    ->
runtime card registry + artifact state + plugin sessions
```

This is important: the UI itself already uses shared runtime data. The remaining problem is how users get to it and which app owns editor follow-up behavior.

## Proposed Solution

### High-level design

We should move to this ownership model:

- `hypercard-runtime` owns:
  - the `RuntimeCardDebugWindow` component
  - package-level runtime debug registration and window helpers
  - app-agnostic props and contracts for editor ownership, stack selection, and window identity
- `wesen-os` owns:
  - registering the shared runtime debug app during startup
  - deciding which stacks are exposed in the global debugger
  - deciding icon/title/placement defaults for the desktop surface
- inventory owns:
  - no bespoke Stacks & Cards route or launcher behavior
  - only its own stack export and optional launcher entry that points at the shared app

### Recommended API shape

The first design pass suggested a package-owned `LaunchableAppModule` factory inside `hypercard-runtime`. We did not ship that shape because it would create a dependency cycle: `desktop-os` already depends on `hypercard-runtime`, so `hypercard-runtime` cannot safely import `LaunchableAppModule` contracts from `desktop-os`.

The implemented shape is a package-owned runtime-debug helper surface plus a thin host wrapper in `wesen-os`.

Implemented API:

```ts
export function registerRuntimeDebugStacks(
  stacks: readonly CardStackDefinition[],
): void;

export function useRegisteredRuntimeDebugStacks(): CardStackDefinition[];

export function buildRuntimeDebugWindowPayload(options?: {
  appId?: string;
  instanceId?: string;
  title?: string;
  icon?: string;
  bounds?: OpenWindowPayload['bounds'];
  dedupeKey?: string;
}): OpenWindowPayload;

export function RuntimeDebugAppWindow(props: {
  ownerAppId: string;
  instanceId: string;
  stacks?: CardStackDefinition[];
}): ReactNode;
```

Why this shape:

- `hypercard-runtime` owns the reusable debug behavior without depending on `desktop-os`
- the host app still provides host-specific identity, module manifest, and stack registration timing
- `wesen-os` can compose the launcher module like any other desktop app
- inventory can launch the shared app without re-owning the routing logic

The thin `wesen-os` wrapper is intentionally small:

```tsx
registerRuntimeDebugStacks([inventoryStack, STACK]);

export const runtimeDebugLauncherModule: LaunchableAppModule = {
  manifest: { id: HYPERCARD_RUNTIME_DEBUG_APP_ID, ... },
  buildLaunchWindow: () => buildRuntimeDebugWindowPayload(),
  renderWindow: ({ instanceId }) => (
    <RuntimeDebugAppWindow
      ownerAppId={HYPERCARD_RUNTIME_DEBUG_APP_ID}
      instanceId={instanceId}
    />
  ),
};
```

### Proposed render flow

Target flow:

```text
wesen-os startup
    ->
registerRuntimeDebugStacks([inventoryStack, osLauncherStack])
    ->
runtimeDebugLauncherModule
    ->
launcherModules
    ->
desktop icon or command entry
    ->
buildRuntimeDebugWindowPayload()
    ->
RuntimeDebugAppWindow(ownerAppId, instanceId)
    ->
RuntimeCardDebugWindow(ownerAppId, registeredStacks)
    ->
openCodeEditor(ownerAppId, cardId, code)
```

### Package boundary diagram

```text
Before
------
inventory
  |- window payload
  |- route
  |- stack binding
  |- launcher icon
  +-> RuntimeCardDebugWindow (shared component only)

hypercard-runtime
  |- RuntimeCardDebugWindow
  |- CodeEditorWindow
  |- editorLaunch
  |- runtimeDebugApp helpers
  |- runtimeDebugRegistry hooks

wesen-os
  |- no Stacks and Cards registration


After
-----
hypercard-runtime
  |- RuntimeCardDebugWindow
  |- CodeEditorWindow
  |- editorLaunch
  |- runtimeDebugApp helpers
  |- runtimeDebugRegistry hooks

wesen-os
  |- startup decides stacks + ownerAppId
  |- registers stacks
  |- wraps the shared app in a launcher module

inventory
  |- launches the shared app
  |- exports inventoryStack
```

## Design Decisions

### Decision 1: keep startup registration in wesen-os

Reason:

- `wesen-os` already owns launcher composition
- the debug tool should be globally available there
- this avoids a hidden side effect inside `hypercard-runtime`

### Decision 2: avoid a `LaunchableAppModule` factory inside `hypercard-runtime`

Reason:

- `desktop-os` already depends on `hypercard-runtime`
- importing `LaunchableAppModule` contracts back into `hypercard-runtime` would point the graph the wrong way
- package-owned helpers plus a thin host wrapper preserve the correct dependency direction

### Decision 3: move feature ownership into hypercard-runtime

Reason:

- the runtime-debug surface is logically part of runtime tooling, not an inventory feature
- the package already contains the core component and editor surface
- future additions, such as built-in source display and richer session introspection, belong with runtime tooling

### Decision 4: make owner app explicit

Reason:

- the current hardcoded `ownerAppId: 'inventory'` is the clearest remaining leak
- editor-open behavior should depend on host configuration, not a constant baked into the shared package

Suggested prop shape:

```ts
export interface RuntimeCardDebugWindowProps {
  ownerAppId: string;
  stacks?: CardStackDefinition[];
  defaultStackId?: string;
}
```

### Decision 5: preserve explicit stack binding

Reason:

- different hosts may want different stack subsets
- runtime debug should not guess which stacks exist globally
- explicit stack injection is testable and easy to review

## Detailed Implementation Plan

### Phase 1: make RuntimeCardDebugWindow app-agnostic

Target files:

- `packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx`
- `packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.stories.tsx`

Work:

- add `ownerAppId` prop
- replace hardcoded inventory editor ownership with that prop
- optionally add active-stack selection support if multiple stacks are passed
- update stories to demonstrate non-inventory owner IDs

Pseudocode:

```tsx
export function RuntimeCardDebugWindow({
  ownerAppId,
  stacks = [],
  defaultStackId,
}: RuntimeCardDebugWindowProps) {
  ...
  onClick={() =>
    openCodeEditor(dispatch, { ownerAppId, cardId: card.cardId }, card.code)
  }
}
```

Review checkpoint:

- no string literal `'inventory'` remains in this component

### Phase 2: add package-owned runtime debug helpers

Target files:

- `packages/hypercard-runtime/src/hypercard/index.ts`
- likely new files such as:
  - `packages/hypercard-runtime/src/hypercard/debug/runtimeDebugApp.tsx`
  - `packages/hypercard-runtime/src/hypercard/debug/runtimeDebugRegistry.ts`

Work:

- create stack registration helpers that do not depend on `desktop-os`
- add a shared window payload builder for the runtime debug app
- add a runtime debug app wrapper that routes instance IDs to `RuntimeCardDebugWindow`

Pseudocode:

```ts
export function registerRuntimeDebugStacks(stacks) {
  for (const stack of stacks) {
    registeredStacks.set(stack.id, stack);
  }
}

export function RuntimeDebugAppWindow({ ownerAppId, instanceId, stacks }) {
  if (instanceId !== 'stacks') {
    return <UnknownRuntimeDebugWindow instanceId={instanceId} />;
  }
  return <RuntimeCardDebugWindow ownerAppId={ownerAppId} stacks={stacks} />;
}
```

Review checkpoint:

- inventory should no longer need to create its own copy of `buildRuntimeDebugWindowPayload()`

### Phase 3: register it from wesen-os startup

Target files:

- `apps/os-launcher/src/App.tsx`
- `apps/os-launcher/src/app/modules.tsx`
- possibly `apps/os-launcher/src/app/registry.ts`

Work:

- import the package-owned runtime debug helpers
- create a thin launcher module for the stacks `wesen-os` wants to expose
- register the stacks at module load time or startup
- add that module to the launcher module list

Two viable registration placements:

1. registration in `modules.tsx`
2. registration in a startup helper called from `App.tsx`

Recommendation:

- keep static composition in `modules.tsx` unless runtime conditions require something dynamic

Pseudocode:

```ts
import {
  buildRuntimeDebugWindowPayload,
  HYPERCARD_RUNTIME_DEBUG_APP_ID,
  registerRuntimeDebugStacks,
  RuntimeDebugAppWindow,
} from '@hypercard/hypercard-runtime';
import { inventoryStack } from '@hypercard/inventory/launcher';
import { STACK as OS_STACK } from '../domain/stack';

registerRuntimeDebugStacks([inventoryStack, OS_STACK]);

export const runtimeDebugLauncherModule = {
  manifest: { id: HYPERCARD_RUNTIME_DEBUG_APP_ID, name: 'Stacks & Cards', ... },
  buildLaunchWindow: () => buildRuntimeDebugWindowPayload(),
  renderWindow: ({ instanceId }) => (
    <RuntimeDebugAppWindow
      ownerAppId={HYPERCARD_RUNTIME_DEBUG_APP_ID}
      instanceId={instanceId}
    />
  ),
};
```

Review checkpoint:

- `wesen-os` desktop shows a top-level `Stacks & Cards` entry
- opening it does not require inventory to be launched first

### Phase 4: switch inventory to the shared module

Target files:

- `apps/inventory/src/launcher/renderInventoryApp.tsx`

Work:

- remove inventory-owned route/payload code
- consume the same package-owned module or helper
- keep only inventory-specific configuration such as stack selection if needed

Review checkpoint:

- inventory no longer has a custom `buildRuntimeDebugWindowPayload()`
- inventory still exposes the same user-facing surface if desired

### Phase 5: add tests

Target areas:

- `hypercard-runtime` tests for the module factory
- `wesen-os` tests for launcher-module composition
- story or Playwright checks for opening the window and launching the editor

Minimum validation:

- module registration succeeds
- window opens from `wesen-os`
- runtime cards are visible
- edit button opens editor using the configured `ownerAppId`

## API References

### Current shared exports

Current public exports in `packages/hypercard-runtime/src/hypercard/index.ts` now include:

```ts
export * from './debug/RuntimeCardDebugWindow';
export * from './debug/runtimeDebugApp';
export * from './debug/runtimeDebugRegistry';
export * from './editor/CodeEditorWindow';
export * from './editor/editorLaunch';
export * from './editor/runtimeCardRef';
```

### Current editor-launch API

Current flow in `editorLaunch.ts`:

- accepts `{ ownerAppId, cardId }`
- stashes code
- opens the editor app window

That API is already close to what we need. The problem is the caller, not the helper.

### Current launcher composition API

`wesen-os` currently composes launcher modules as a flat array in `apps/os-launcher/src/app/modules.tsx`.

That means the future runtime-debug module should behave like:

- `inventoryLauncherModule`
- `sqliteLauncherModule`
- `hypercardToolsLauncherModule`
- `kanbanVmLauncherModule`

This is why the final implementation uses a thin host wrapper instead of a module factory inside `hypercard-runtime`.

## Alternatives Considered

### Alternative A: leave launcher ownership in inventory

Rejected because:

- it keeps the feature operationally inventory-owned
- it makes global debug access in `wesen-os` awkward
- it perpetuates the incomplete package boundary

### Alternative B: put all registration side effects directly in App.tsx

Rejected as the primary design because:

- it mixes startup orchestration and feature definition
- module composition is already centralized in `modules.tsx`
- it makes the registration harder to test in isolation

### Alternative C: put a `LaunchableAppModule` factory inside `hypercard-runtime`

Rejected because:

- `desktop-os` already depends on `hypercard-runtime`
- importing launcher contracts back into `hypercard-runtime` would create a dependency cycle
- the thin host wrapper in `wesen-os` solves the launcher problem without compromising package ownership of the runtime debug surface

## Risks And Review Notes

### Risk 1: package dependencies drift the wrong way

Do not make `hypercard-runtime` depend on inventory.

Invariant:

- `hypercard-runtime` may expose runtime debug helpers and React surfaces
- host apps wrap those helpers in launcher modules
- inventory is only a consumer

### Risk 2: editor ownership remains implicit

Do not leave a fallback default that silently points to inventory unless the host explicitly asks for it.

Invariant:

- the host must pass `ownerAppId`

### Risk 3: stack selection is hardcoded incorrectly

If multiple stacks are exposed later, the UI should either:

- show a selector
- or receive one explicit stack only

Do not infer random stack state from the global store.

## Rollback Strategy

If implementation becomes messy, the safe fallback is:

1. finish Phase 1 first
2. keep inventory route temporarily
3. add the package-owned module factory behind the old route
4. migrate `wesen-os` only after the shared module opens and edits correctly

This keeps the work reversible and reviewable.

## Testing Plan

### Unit and integration

- runtime-debug module factory tests in `hypercard-runtime`
- editor-launch tests for explicit `ownerAppId`
- `wesen-os` launcher composition tests

### Interactive verification

1. launch `wesen-os`
2. confirm `Stacks & Cards` appears on the desktop or in the launcher
3. open the window
4. verify plugin sessions and runtime registry entries render
5. click `Edit`
6. verify the editor window opens for the configured owner app rather than inventory

### Nice-to-have later

- Playwright smoke for:
  - open debug window
  - open VM card source
  - switch stack

## Open Questions

1. Should the first version expose only the `os-launcher` stack or a broader stack list?
2. Should `wesen-os` expose `Stacks & Cards` as a desktop icon, a tools-folder entry, or both?
3. Should multi-stack selection be implemented immediately or deferred until a second host stack matters?
4. Should built-in stack-card source display be tackled inside APP-17 or left as a follow-up?

Outcome:

- APP-17 shipped multi-stack support immediately because the `wesen-os` wrapper registers both inventory and `os-launcher`
- the move is complete
- built-in source display remains the next follow-up slice

## Intern Checklist

Before you code:

- read `renderInventoryApp.tsx`
- read `RuntimeCardDebugWindow.tsx`
- read `editorLaunch.ts`
- read `App.tsx`, `modules.tsx`, and `registry.ts`

When you code:

- remove hardcoded inventory ownership first
- add the shared runtime debug helpers second
- register it in `wesen-os` third
- migrate inventory last

When you review:

- check that feature ownership is now in `hypercard-runtime`
- check that `wesen-os` only registers stacks and wraps the shared app in a launcher module
- check that inventory no longer owns bespoke Stacks and Cards routing

## References

- `../index.md`
- `../tasks.md`
- `../reference/01-implementation-diary.md`
