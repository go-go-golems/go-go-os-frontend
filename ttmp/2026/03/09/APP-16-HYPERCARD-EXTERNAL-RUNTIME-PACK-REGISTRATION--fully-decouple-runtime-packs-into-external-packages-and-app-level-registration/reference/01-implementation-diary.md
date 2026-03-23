---
Title: Implementation diary
Ticket: APP-16-HYPERCARD-EXTERNAL-RUNTIME-PACK-REGISTRATION
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/App.tsx
      Note: |-
        Host bootstrap seam reviewed for app-level registration
        Reviewed as the app bootstrap seam for runtime pack registration
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/app/modules.tsx
      Note: |-
        Host composition seam reviewed for demo launcher ownership
        Reviewed as the app-layer seam for demo launcher ownership
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: |-
        Current helper injection seam reviewed for the decoupling plan
        Reviewed while defining how helper injection should decouple
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.ts
      Note: |-
        Current runtime package registry reviewed while defining the extraction plan
        Reviewed while defining the target external-package model
ExternalSources: []
Summary: Diary for the APP-16 design work defining the post-APP-23 extraction path from runtime-core-owned concrete packages to externally registered runtime packages.
LastUpdated: 2026-03-11T11:58:00-04:00
WhatFor: Record the reasoning, file audit, and implementation guidance for the future extraction ticket so later implementation work can start from the current RuntimeBundle and RuntimeSurface architecture instead of redoing the analysis.
WhenToUse: Use when continuing APP-16, reviewing why runtime core should stop owning concrete packages, or checking the recommended extraction phases before coding.
---


# Implementation diary

## Goal

Capture the research and design reasoning for the fully decoupled runtime-pack architecture, including the current coupling points, the proposed external-package and app-registration model, and the recommended implementation sequence.

## Step 2: Refresh APP-16 after APP-23 changed the baseline architecture

APP-16 was originally written before the APP-23 runtime-language-boundary work landed. That meant the ticket still described the problem in older terms:

- runtime packs were discussed as if they were mostly hypothetical
- stack/card nouns were still mixed into the design
- the package registry was framed as a proposal rather than something the codebase now actually has

By the time I revisited the ticket, that framing was no longer accurate. The current runtime already has:

- `RuntimePackage`
- `RuntimeSurfaceType`
- `RuntimeBundle`
- `RuntimeSurface`
- `packageIds`
- runtime package installation before bundle load

So the APP-16 rewrite had to become more than a terminology cleanup. The ticket needed to explain a different architectural truth:

- package registration exists
- the real remaining work is physical extraction and ownership cleanup

### What I re-audited

I reread the current runtime-core files that define package and surface-type ownership:

- `packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.ts`
- `packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx`
- `packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
- `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
- `packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx`

That re-audit confirmed that the architecture has progressed farther than the old ticket text suggested. Runtime core now hosts the right abstractions, but it still owns the wrong concrete implementations.

### What changed in the ticket

I rewrote:

- `index.md`
- the main design guide
- `tasks.md`

to reflect the current post-APP-23 reality:

- APP-16 is now the extraction ticket
- `kanban` is the first concrete package to move
- `wesen-os` is the composition boundary
- runtime core should become generic-only
- no compatibility wrappers should be added when this ticket is eventually implemented

### Main design correction

The key correction is:

```text
APP-16 is not "add package registration"
APP-16 is "stop runtime core from owning concrete packages"
```

That is a much sharper and more useful statement for future implementation work.

### Follow-up task refinement

After the main rewrite, I expanded `tasks.md` again because the first refreshed version was structurally correct but still a little too phase-level for direct execution. The user asked for detailed tasks before implementation, so I added more file- and validation-oriented substeps:

- which runtime-core files need auditing first
- what exactly must move for the Kanban extraction
- where `wesen-os` registration should likely happen
- what docs/debug/source-editing behavior must be revalidated after the move
- what decision still needs to be recorded for the `ui` package

That turns APP-16 into a better implementation backlog instead of just a high-level migration outline.

## Step 3: Remove registry self-registration and make runtime defaults explicit

The first APP-16 code slice focused on the smallest architectural change that still mattered: stop the runtime registries from populating themselves as a side effect of import. This was the real blocker to later package extraction, because as long as `runtimePackageRegistry.ts` and `runtimeSurfaceTypeRegistry.tsx` self-registered `ui` and `kanban`, runtime core still owned those packages implicitly even if the type names were already correct.

I kept the behavior stable but changed the ownership pattern. The registries can now be empty, built-in defaults are registered through an explicit helper, and focused tests prove both the empty-registry state and the failure mode when a bundle requires a package that was not registered. That is the right intermediate checkpoint because later APP-16 slices can now move package definitions out of runtime core without first undoing hidden import behavior.

### Prompt Context

**User prompt (verbatim):** "Let's continue on APP-16 and go task by task, committing at appropriate intervals (not necesarily every task), keeping a diary."

**Assistant interpretation:** Start implementing APP-16 from the first extraction-ready slice, carry work through code, tests, commits, and ticket bookkeeping, and record the details as we go.

**Inferred user intent:** Make real progress on the package-extraction architecture rather than just refining ticket docs, while keeping the work reviewable and documented.

**Commit (code):** `da66c38` — "Make runtime defaults register explicitly"  
**Commit (code):** `2c44368` — "Register runtime defaults in os-launcher"  
**Commit (code):** `c9fc6f0` — "Register runtime defaults in inventory"

### What I did

- Removed import-time built-in registration from:
  - `packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.ts`
  - `packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx`
- Added explicit built-in definition files:
  - `packages/hypercard-runtime/src/runtime-packages/defaultRuntimePackages.ts`
  - `packages/hypercard-runtime/src/runtime-packs/defaultRuntimeSurfaceTypes.tsx`
- Added a single runtime-core helper:
  - `packages/hypercard-runtime/src/runtimeDefaults.ts`
  - `registerBuiltInHypercardRuntime()`
- Added clear/reset functions so focused tests can prove registries are empty before registration.
- Updated:
  - runtime registry tests
  - runtime integration tests
  - `os-launcher` bundle test
  - inventory bundle test
- Wired the current default-registration helper into:
  - `apps/os-launcher/src/App.tsx`
  - `apps/inventory/src/launcher/renderInventoryApp.tsx`
  - `RuntimeSurfaceSessionHost.tsx`
  - the runtime mutation story

### Why

- APP-16 needs explicit registration seams before external packages can be extracted cleanly.
- Removing self-registration first is lower-risk than trying to extract Kanban while runtime core still populates itself behind the scenes.
- The helper-based checkpoint keeps behavior stable for current apps while making the architecture honest.

### What worked

- Module-global registries plus explicit `register*` calls are enough for this phase.
- The runtime continues to work after explicit registration is introduced.
- The focused tests now cover the important new invariant: registries can be empty, and missing registration fails clearly.

### What didn't work

- I first considered moving directly to app-startup-only registration everywhere, but that would have forced a wider live-app sweep immediately across every runtime host entrypoint. That was larger than necessary for the first checkpoint.
- Instead I used the explicit runtime-default helper in the live entrypoints that need it today, which keeps the next extraction slice smaller.

### What I learned

- The real architecture win in this slice is not the helper itself. It is the deletion of the hidden bottom-of-file `registerRuntimePackage(...)` and `registerRuntimeSurfaceType(...)` calls.
- Once those are gone, the remaining work becomes much easier to reason about: extract definitions, then move the helper call outward.

### What was tricky to build

- The tricky part was choosing how strict to be in the first cut. If I removed self-registration without adding any runtime bootstrap path, many live flows and tests would fail immediately. If I added too much automatic fallback inside runtime core, the slice would not actually improve the architecture.
- The compromise was:
  - explicit registries
  - explicit built-in helper
  - narrow live entrypoint calls
  - test coverage for empty registries and unknown-package failure

### What warrants a second pair of eyes

- `RuntimeSurfaceSessionHost.tsx` currently calls the built-in registration helper directly as a temporary bridge. That is acceptable for this checkpoint, but it should move outward in later APP-16 slices so app startup owns registration.
- The same is true for the inventory and `os-launcher` entrypoint calls: they are correct today, but they are not yet the final external-package shape.

### What should be done in the future

- Finish the remaining Slice 1 doc/comment cleanup.
- Create the actual external Kanban package and move the concrete definitions out of runtime core.
- Then remove the built-in helper from runtime core once registration is fully host-owned.

### Code review instructions

- Start in:
  - `runtimePackageRegistry.ts`
  - `runtimeSurfaceTypeRegistry.tsx`
  - `runtimeDefaults.ts`
- Then review:
  - `defaultRuntimePackages.ts`
  - `defaultRuntimeSurfaceTypes.tsx`
- Finally check the live consumers:
  - `apps/os-launcher/src/App.tsx`
  - `apps/inventory/src/launcher/renderInventoryApp.tsx`
  - `runtimeService.integration.test.ts`

### Technical details

Commands run:

```bash
npx vitest run \
  packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.test.ts \
  packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.test.tsx \
  packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts \
  packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx

npm test -- --run src/domain/pluginBundle.test.ts

npm run typecheck -w packages/hypercard-runtime
```

Results:

- all focused `hypercard-runtime` tests passed
- `os-launcher` bundle test passed
- inventory bundle test passed
- `hypercard-runtime` typecheck passed

## Step 4: Fix the window render loop regression and add a window-level safety net

After the first APP-16 checkpoint landed, the user immediately hit a bad regression in the live shell: opening `Stacks & Cards`, `Inventory`, and later `Rich Widgets` could crash with React's `Maximum update depth exceeded` error. The stack pointed at `WindowBody2`, which is the memoized window body wrapper in the desktop shell. That was a useful clue because it shifted the investigation away from any specific app or runtime surface and toward the shared window-content/min-size path.

The actual failure mode was a feedback loop in window min-size reporting. `useContentMinSize(...)` measures the intrinsic size of a window body and reports it upward. The desktop controller was dispatching `updateWindowMinSize(...)` every time it received a size report, even when the effective minimum size had not changed after base-size clamping. That meant content that kept re-measuring during layout could churn the store indefinitely. I fixed the loop at both layers: the controller now checks the current min size before dispatching, and the reducer itself is a no-op if the computed min size is unchanged. Since the user also asked for a safety net, I added a per-window error boundary in the window layer so one crashing window body does not take down the entire desktop shell.

### Prompt Context

**User prompt (verbatim):** "When click on \"Cards & Stacks\" I get f9
[HTTP/1.1 200 OK 0ms]

GET
http://localhost:5173/node_modules/.vite/deps/module-6F3E5H7Y-PJILAMA6.js?v=294456f9
[HTTP/1.1 200 OK 0ms]

Uncaught Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
    React 4
    Redux 4
react-dom-client.development.js:4624:11
An error occurred in the <WindowBody2> component.

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.

## Step 5: Extract Kanban into `@hypercard/kanban-runtime` and make host apps register definitions explicitly

The next APP-16 slice was the first real physical extraction, not just an architectural seam cleanup. I created a new workspace package at `packages/kanban-runtime` and moved the concrete Kanban implementation there:

- the VM install prelude previously in `packages/hypercard-runtime/src/runtime-packages/kanban.package.vm.js`
- the `kanban.v1` surface-type validator/renderer previously in `packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx`
- the Kanban host widget/state/runtime files and stories previously in `packages/rich-widgets/src/kanban/*`
- the Kanban-specific theme CSS previously in `packages/rich-widgets/src/theme/kanban.css`

That gave the concrete package a real home:

- `packages/kanban-runtime/src/runtime-packages/*`
- `packages/kanban-runtime/src/runtime-packs/*`
- `packages/kanban-runtime/src/*.tsx`
- `packages/kanban-runtime/src/theme/*`

At the same time I removed Kanban ownership from runtime core:

- `defaultRuntimePackages.ts` now only registers `ui`
- `defaultRuntimeSurfaceTypes.tsx` now only registers `ui.card.v1`
- runtime-core barrels no longer export Kanban-specific definitions
- `hypercard-runtime` no longer depends on `@hypercard/rich-widgets`

### The important architecture correction

The first draft of the extraction exported a convenience helper:

```ts
registerKanbanRuntime()
```

from `@hypercard/kanban-runtime`. That looked fine in code review, but it turned out to be the wrong abstraction for an extracted package. In Vitest, the helper closed over its own imported `registerRuntimePackage(...)` / `registerRuntimeSurfaceType(...)` functions, and that created a package-singleton trap: the host test's `QuickJSRuntimeService` could end up looking at a different registry instance than the helper had registered into.

The symptom was precise and repeatable:

- `registerKanbanRuntime()` appeared to succeed
- `listRuntimePackages()` from the host test still returned only `['ui']`
- `QuickJSRuntimeService.loadRuntimeBundle(..., ['ui', 'kanban'], ...)` failed with:
  - `Unknown runtime package: kanban`

That was the right moment to switch to the cleaner final shape instead of adding a workaround.

### Final registration model

`@hypercard/kanban-runtime` now exports pure definitions only:

- `KANBAN_RUNTIME_PACKAGE`
- `KANBAN_V1_RUNTIME_SURFACE_TYPE`

Host apps register those definitions through their own `@hypercard/hypercard-runtime` imports:

```ts
registerBuiltInHypercardRuntime();
registerRuntimePackage(KANBAN_RUNTIME_PACKAGE);
registerRuntimeSurfaceType(KANBAN_V1_RUNTIME_SURFACE_TYPE);
```

That matters because it makes the ownership model explicit:

- concrete package owns the package and surface-type definitions
- host app owns when those definitions are registered
- runtime core owns only the generic registries and session/bundle mechanics

This is exactly the architectural outcome APP-16 wanted, and it avoids hidden cross-package registry state.

### Additional extraction fallout

Two other concrete issues surfaced during validation:

1. `runtimeRegistration.ts` needed to be renamed to `runtimeRegistration.tsx` because it returns JSX in the surface renderer definition.
2. The newly extracted package needed its own:
   - `raw-imports.d.ts` for `?raw`
   - `parts.ts` for Kanban-specific part names

Without those, `kanban-runtime` typecheck failed even though the moved files were otherwise correct.

I also fixed a separate live-shell blocker in `rich-widgets` that had nothing to do with the extraction itself but prevented `localhost:5173` from booting:

- `packages/rich-widgets/src/index.ts` was re-exporting `YOUTUBE_RETRO_STATE_KEY` from `./youtube-retro/types` instead of `./youtube-retro/youTubeRetroState`

Once that was corrected, the shell booted again and I could do the real live smoke.

### Live validation

After the extraction and the `rich-widgets` fix, I validated the running shell with Playwright against `http://localhost:5173`. The smoke pass opened:

- `Stacks & Cards`
- `Rich Widgets`
- `Inventory`

and confirmed:

- no `pageerror`
- no console warning/error entries
- the `Stacks & Cards` window rendered both `inventory` and `os-launcher` bundles
- `Rich Widgets` still opened and rendered its folder surface
- `Inventory` still opened and listed its predefined runtime surfaces

That was the right confidence check because APP-16 is not just a package move. It changes how the live shell discovers and registers runtime package behavior.

### Tests and checks that passed

Focused runtime-core and extracted-package checks:

```bash
pnpm exec vitest run \
  packages/kanban-runtime/src/kanbanState.test.ts \
  packages/kanban-runtime/src/runtimeRegistration.test.tsx \
  packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.test.ts \
  packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.test.tsx \
  packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts

pnpm exec tsc --noEmit -p packages/kanban-runtime/tsconfig.json
```

App-level checks:

```bash
pnpm exec vitest run \
  src/domain/pluginBundle.test.ts \
  src/app/runtimeDebugModule.test.tsx \
  src/app/kanbanVmModule.test.tsx
```

in `apps/os-launcher`, and:

```bash
pnpm exec vitest run \
  src/launcher/renderInventoryApp.chat.test.tsx \
  src/domain/pluginBundle.test.ts
```

in `apps/inventory`.

One more validation item is still intentionally open in the task list:

- Storybook check for the extracted Kanban package widgets

I did not mark that done yet because I had not run the root Storybook verification by the time this slice reached commit readiness.

### Review guidance

Review the slice in this order:

1. `packages/kanban-runtime`
2. `packages/hypercard-runtime` removal of Kanban ownership
3. `apps/os-launcher/src/App.tsx`
4. `apps/inventory/src/launcher/renderInventoryApp.tsx`
5. `apps/os-launcher/src/domain/pluginBundle.test.ts`

The most important architectural detail to look for is not the file move itself. It is the registration shape:

- definition exports in the concrete package
- generic registration calls in the host app
- no helper that hides registry ownership inside the concrete package

## Step 6: Record the `ui` follow-up decision before continuing extraction work

Before continuing deeper into docs re-homing and debugger/docs validation, I recorded the next architectural decision explicitly in APP-16:

- `ui` is not a temporary built-in exception
- `ui` is the next concrete package to extract after `kanban`

That matters because a lot of the remaining APP-16 work depends on whether we are treating `ui` as special. With this decision made, the ticket can assume a consistent end state:

```text
runtime core owns no concrete packages
kanban is the first extraction
ui is the second extraction
```

This avoids a common source of cleanup debt where the first extracted package is “proper” but the older default package becomes an indefinite special case.

## Step 7: Re-home Kanban package docs metadata while keeping demo surface docs with `os-launcher`

After the core extraction was stable, the next open APP-16 question was docs ownership. Before this step, `os-launcher` was still mounting Kanban surface-type docs from its own generated `vmmeta`, even though the actual `kanban.v1` implementation had already moved into `@hypercard/kanban-runtime`.

That was the wrong ownership shape. The rules are:

- package docs belong with the concrete package
- demo surface docs belong with the bundle that owns those surfaces

So I split those two concerns explicitly.

### What moved

I added:

- `packages/kanban-runtime/src/docsMetadata.ts`

This file exports package-owned docs metadata for:

- `kanban.v1`
- `widgets.kanban.page`
- `widgets.kanban.taxonomy`
- `widgets.kanban.header`
- `widgets.kanban.highlights`
- `widgets.kanban.filters`
- `widgets.kanban.board`
- `widgets.kanban.status`

and re-exported it from:

- `packages/kanban-runtime/src/index.ts`

### What stayed in `os-launcher`

The demo surface docs for:

- `kanbanSprintBoard`
- `kanbanBugTriage`
- `kanbanIncidentCommand`
- `kanbanPersonalPlanner`
- `kanbanReleaseTrain`

still belong to the launcher bundle, so they continue to come from:

- `apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts`
- `apps/os-launcher/src/domain/vmmeta.ts`

### Registration rule after the split

`registerAppsBrowserDocs()` now mounts:

- `createVmmetaSurfaceTypeDocsMount(KANBAN_RUNTIME_DOCS_METADATA)`
- `createVmmetaSurfaceDocsMount('os-launcher', OS_LAUNCHER_VM_PACK_METADATA)`
- the existing inventory mounts unchanged

That gives the right docs ownership model:

```text
/docs/objects/surface-type/kanban.v1/*
  -> package-owned docs from @hypercard/kanban-runtime

/docs/objects/surface/os-launcher/*
  -> app-owned demo surface docs from os-launcher vmmeta
```

### Validation

I added two kinds of tests:

1. a focused registration test:
   - `apps/os-launcher/src/app/registerAppsBrowserDocs.test.ts`
   - verifies the package docs metadata and app-owned surface metadata are each passed to the correct mount factory

2. a real integration test:
   - `apps/os-launcher/src/app/registerAppsBrowserDocs.integration.test.ts`
   - resolves:
     - `/docs/objects/surface-type/kanban.v1/overview`
     - `/docs/objects/surface/os-launcher/kanbanSprintBoard`
   - and checks that the returned docs content comes from the expected ownership side

I also reran:

- `apps-browser` docs mount adapter tests

so the generic mount machinery stayed green after the split.

### Why this matters

This is a small but important part of APP-16. If docs ownership stays wrong, later package extraction work will always look complete in code but incomplete in tooling. The docs browser is one of the places where hidden ownership leaks show up first.

---
(can I get sourcemaps maybe?)

An error occurred in the <WindowBody2> component.

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.
<anonymous code>:1:145535
Source map error: Error: JSON.parse: unexpected character at line 1 column 1 of the JSON data
Stack in the worker:parseSourceMapInput@resource://devtools/client/shared/vendor/source-map/lib/util.js:163:15
_factory@resource://devtools/client/shared/vendor/source-map/lib/source-map-consumer.js:1069:22
SourceMapConsumer@resource://devtools/client/shared/vendor/source-map/lib/source-map-consumer.js:26:12
_fetch@resource://devtools/client/shared/source-map-loader/utils/fetchSourceMap.js:83:19


---

I also think we should indeed add an error boundary at the window level"

**Assistant interpretation:** Investigate the render loop in the shared window shell, fix the immediate regression, and add the requested error containment around individual window bodies.

**Inferred user intent:** Restore the desktop shell to a usable state before continuing APP-16 extraction work, and make future window-body failures less destructive.

**Commit (code):** `0ce1bd2` — "Guard window min-size updates and add window error boundary"

### What I did

- Traced `WindowBody2` back to the memoized `WindowBody` inside:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/WindowSurface.tsx`
- Reviewed:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/useContentMinSize.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts`
- Added a controller-side guard in `handleContentMinSize(...)` so it skips dispatching when the computed min size is unchanged.
- Added a reducer-side no-op in `updateWindowMinSize(...)` so even repeated identical actions cannot churn window state.
- Added `WindowRenderErrorBoundary` in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/WindowLayer.tsx`
- Added a reducer test proving unchanged min-size updates are identity-preserving.

### Why

- The APP-16 branch needs to stay usable while the extraction work proceeds.
- The error affected multiple windows, which means it was a shell-level problem, not an app-level bug.
- Guarding the update in both the controller and reducer is more robust than relying only on the measurement hook's dedup.
- The error boundary is a separate resilience improvement the user explicitly asked for.

### What worked

- Focused windowing and runtime-host tests all passed after the change.
- The reducer now returns the same state object for identical min-size updates, which is the right invariant for breaking this feedback loop.
- The new error boundary gives a concrete fallback path for future window body crashes.

### What didn't work

- The Firefox source-map warning was not the root cause here. It points at `installHook.js.map` from the devtools hook path and is noise relative to the actual Redux/React render loop.
- I initially suspected the new APP-16 runtime registration helper or the runtime debug external store, but the same crash on `Inventory` and `Rich Widgets` made it clear the bug was broader and lived in the shared window shell.

### What I learned

- `useContentMinSize(...)`'s local dedup is not sufficient as the only protection layer. If upstream state churn causes remounts or layout-driven remeasurement, the shell still needs to defend itself against no-op updates.
- A reducer-level identity guard is worth having even when the controller already checks, because it protects every caller of `updateWindowMinSize(...)`.

### What was tricky to build

- The tricky part was narrowing the error quickly. `Stacks & Cards` failing could have been a runtime debug registry loop, but `Inventory` and `Rich Widgets` failing too meant the issue had to be somewhere lower in the stack. The `WindowBody2` clue was easy to dismiss as just a minified React component name, but in this codebase it mapped directly to the memoized body wrapper in `WindowSurface.tsx`, which pointed straight at the min-size measurement path.
- The other subtlety is that the measurement hook already deduplicates by `minW:minH`, so the bug is not obvious by inspection. The problem is the whole path, not just the hook: once the shell dispatches and clamps state unnecessarily, the layout can keep cycling even if the measured values are effectively stable.

### What warrants a second pair of eyes

- We should still keep an eye on any render-time side effects in runtime-host components, especially `RuntimeSurfaceSessionHost.tsx`, while APP-16 is in flight. They were not the direct cause here, but they are still worth keeping honest.
- The error boundary currently resets only when the window id changes. That is acceptable for now, but if we later want in-place recovery for the same window we should add an explicit reset key or retry action.

### What should be done in the future

- Manually verify in the live shell that the specific windows the user named now open cleanly.
- Consider adding a dedicated component test for `WindowLayer`'s error boundary fallback.
- Continue APP-16 Slice 2 once the shell is confirmed stable again.

### Code review instructions

- Start in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts`
- Then review:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/WindowLayer.tsx`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/__tests__/windowing.test.ts`
- Validate with:
  - `npm exec vitest run packages/engine/src/__tests__/windowing.test.ts packages/engine/src/components/shell/windowing/DesktopShell.contextMenu.test.tsx packages/engine/src/components/shell/windowing/useContentMinSize.test.tsx packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.test.tsx`
  - `npm run typecheck -w packages/hypercard-runtime`

### Technical details

Commands run:

```bash
npm exec vitest run \
  packages/engine/src/__tests__/windowing.test.ts \
  packages/engine/src/components/shell/windowing/DesktopShell.contextMenu.test.tsx \
  packages/engine/src/components/shell/windowing/useContentMinSize.test.tsx \
  packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx \
  packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.test.tsx

npm run typecheck -w packages/hypercard-runtime
```

Results:

- windowing tests passed
- runtime-host/debug tests passed
- `hypercard-runtime` typecheck passed

## Step 1: Define The Fully Decoupled Runtime-Pack Ticket

APP-15 solved the direct `kanban.v1` implementation problem, but it intentionally did not solve final ownership boundaries. Once the user asked whether the VM demo path should live in `wesen-os` or whether a dedicated Kanban package made more sense, the real follow-up became clear: we needed a separate ticket for the cleaner architecture so the shortcut work would not get mistaken for the long-term plan.

The design work in this step focused on identifying the exact remaining coupling and turning it into a concrete migration plan. The decisive observation is that `apps/os-launcher` is already the legal composition boundary where runtime infrastructure, concrete pack packages, and demo launchers can all meet without creating a cycle. That made the target architecture much clearer.

### Prompt Context

**User prompt (verbatim):**

> ok, create a new ticket for the fully decoupled architecture, with a detailed imlpementation guide and tasks, which we can then do for later.
>
> Create a detailed analysis / design / implementation guide that is very detailed for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file
>   references.
>   It should be very clear and detailed. Store in the ticket and the nupload to remarkable.
>
> ---
>
> Then, create tasks for the wesen-os shortcut in the current ticket, and plow through them, so I can see if the cards themselves work.

**Assistant interpretation:** Create a new design-only ticket for the fully decoupled external-pack architecture with a detailed intern guide and task plan, then separately continue APP-15 with the shorter-term host-app shortcut implementation.

**Inferred user intent:** Preserve the clean long-term architecture as an explicit plan while still moving forward immediately on a pragmatic host-level shortcut that proves the cards work in real runtime sessions.

**Commit (code):** N/A

### What I did

- Created APP-16 for the fully decoupled runtime-pack architecture.
- Audited the current coupling points in:
  - `packages/hypercard-runtime/src/runtime-packs/runtimePackRegistry.tsx`
  - `packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx`
  - `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - `apps/os-launcher/src/App.tsx`
  - `apps/os-launcher/src/app/modules.tsx`
- Wrote the design guide to explain:
  - current system flow
  - current coupling
  - target ownership boundaries
  - proposed APIs
  - migration phases
  - risks and review checklist
- Added detailed future implementation tasks and changelog entries.

### Why

- The user explicitly asked for a long-form handoff-quality guide for a later implementation ticket.
- The decoupled architecture is larger than the immediate shortcut. Mixing both in APP-15 would make the tactical shortcut look like the final architecture.

### What worked

- The package-boundary analysis is now concrete rather than speculative.
- The design ticket separates “what we do now in `wesen-os`” from “what the final architecture should become.”

### What didn't work

- `docmgr ticket create-ticket` created the workspace under `2026/03/09` rather than `2026/03/10`, so the ticket path reflects the tool’s current repo-local date behavior rather than the session date.
- That did not block the work, but it is worth noting when locating the ticket later.

### What I learned

- The current `kanban-runtime` subpath export in `rich-widgets` is already a useful clue for the future package split. It shows that the code has started to separate the Kanban runtime seam from the rest of the widget barrel.
- The host app is not just a pragmatic shortcut location. It is the correct final composition boundary for pack registration.

### What was tricky to build

- The tricky part was preventing the APP-15 shortcut from distorting the APP-16 design. A short-term fix can look deceptively close to the final architecture if the design ticket does not state the ownership boundaries explicitly.
- I handled that by documenting both:
  - why the `wesen-os` shortcut is valid now
  - why it is still not the final decoupled model

### What warrants a second pair of eyes

- The proposed registration API shape deserves review before implementation, especially the boundary between host-side registry state and VM helper lookup.
- The naming of the future package, such as `@hypercard/kanban-pack`, should be reviewed for consistency with the broader package naming strategy.

### What should be done in the future

- Execute the APP-15 shortcut work to prove the runtime cards behave correctly in real sessions.
- Implement APP-16 later in phases, starting with the dedicated Kanban package and instance-based registry.

### Code review instructions

- Start with the APP-16 design doc and compare each major claim to the current files listed in RelatedFiles.
- Verify that the design distinguishes clearly between:
  - generic runtime core
  - concrete pack package
  - host app composition

### Technical details

- Ticket creation commands:

```bash
docmgr ticket create-ticket \
  --ticket APP-16-HYPERCARD-EXTERNAL-RUNTIME-PACK-REGISTRATION \
  --title "Fully decouple runtime packs into external packages and app-level registration" \
  --topics architecture,frontend,hypercard,wesen-os

docmgr doc add \
  --ticket APP-16-HYPERCARD-EXTERNAL-RUNTIME-PACK-REGISTRATION \
  --doc-type design-doc \
  --title "Intern guide to fully decoupled runtime pack packages and app-level registration"

docmgr doc add \
  --ticket APP-16-HYPERCARD-EXTERNAL-RUNTIME-PACK-REGISTRATION \
  --doc-type reference \
  --title "Implementation diary"
```

## Related

- `../index.md`
- `../tasks.md`
- `../changelog.md`
- `../design-doc/01-intern-guide-to-fully-decoupled-runtime-pack-packages-and-app-level-registration.md`

## Step 6: Extract `ui` into `@hypercard/ui-runtime`

After the Kanban extraction, the main remaining APP-16 compromise was that runtime core still physically owned the default `ui` package. That made the architecture less honest than the ticket wanted: we had a real package system, but runtime core still contained one concrete first-party package and its `ui.card.v1` surface-type implementation.

The user had already made the decision explicit: `ui` should become the next extracted package. So I took the direct cutover rather than keeping a compatibility exception around.

### What moved

I created:

- `packages/ui-runtime`

and moved the remaining concrete UI ownership there:

- `ui.package.vm.js`
- `uiSchema.ts`
- `uiTypes.ts`
- the `ui.card.v1` surface-type validator/renderer
- UI surface-type docs metadata

At the same time I deleted the last concrete UI files from `hypercard-runtime`, including `PluginCardRenderer.tsx`, because that renderer is package-specific host logic, not runtime-core infrastructure.

### How runtime core changed

Runtime core now exposes only generic registration/lifecycle seams here:

- runtime package registry APIs
- runtime surface-type registry APIs
- runtime service / QuickJS lifecycle
- generic debug/editor/session plumbing

To keep runtime-core tests self-contained without reintroducing a dependency on the extracted UI package, I added a narrow test helper:

- `packages/hypercard-runtime/src/testRuntimeUi.tsx`

That helper is for tests/stories only. The live runtime no longer depends on concrete UI definitions from runtime core.

### How host apps changed

The live shells now register `ui` explicitly from their own startup code:

- `apps/os-launcher/src/app/registerRuntimePackages.ts`
- `apps/os-launcher/src/App.tsx`
- `apps/inventory/src/launcher/renderInventoryApp.tsx`

I also updated the `os-launcher` startup test to exercise the registration seam directly instead of importing the whole React app tree. Importing `App.tsx` was too slow and noisy for the narrow thing being tested.

### Docs ownership change

The extraction cleaned up docs ownership too:

- `@hypercard/ui-runtime` now owns `/docs/objects/surface-type/ui.card.v1/*`
- inventory no longer owns package docs for `ui.card.v1`
- inventory still owns its concrete surface docs under `/docs/objects/surface/inventory/*`

That is the right split:

- package docs belong to the package
- bundle surface docs belong to the bundle owner

### Validation

Commands run:

```bash
pnpm exec vitest run \
  packages/ui-runtime/src/runtimeRegistration.test.tsx \
  packages/ui-runtime/src/runtime-packs/uiSchema.test.ts \
  packages/kanban-runtime/src/runtimeRegistration.test.tsx \
  packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.test.ts \
  packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.test.tsx \
  packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts \
  --reporter=verbose

pnpm exec vitest run \
  src/App.test.tsx \
  src/domain/pluginBundle.test.ts \
  src/app/registerAppsBrowserDocs.test.ts \
  src/app/registerAppsBrowserDocs.integration.test.ts \
  src/app/runtimeDebugModule.test.tsx \
  src/app/kanbanVmModule.test.tsx \
  --reporter=verbose

npm run vmmeta:generate && \
pnpm exec vitest run \
  src/domain/pluginBundle.test.ts \
  src/launcher/renderInventoryApp.chat.test.tsx \
  --reporter=verbose

npm run storybook:check

docmgr doctor --ticket APP-16-HYPERCARD-EXTERNAL-RUNTIME-PACK-REGISTRATION --stale-after 30
```

Results:

- focused `ui-runtime`, `kanban-runtime`, and `hypercard-runtime` suites passed
- `os-launcher` startup/docs/runtime-debug tests passed
- inventory `vmmeta` generation and bundle tests passed
- Storybook check passed
- `docmgr doctor` passed

### What was tricky

The main trap was module-instance ownership during tests. I had already seen the same problem during the Kanban extraction: if a concrete package exports a convenience `registerXxxRuntime()` helper, the helper can end up registering into a different registry module instance than the host test is inspecting.

So I kept the same final shape for `ui`:

- concrete package exports pure definitions
- host app imports those definitions
- host app calls `registerRuntimePackage(...)` and `registerRuntimeSurfaceType(...)`

That keeps ownership explicit and avoids hidden singleton behavior.

### Current APP-16 state after this step

At this point:

- runtime core owns no concrete first-party packages
- `ui` lives in `@hypercard/ui-runtime`
- `kanban` lives in `@hypercard/kanban-runtime`
- host apps explicitly register both

The remaining APP-16 work is now mostly validation and follow-on cleanup rather than another major extraction.

## Step 7: Remove duplicated Kanban package docs from `os-launcher`

There was one APP-16 cleanup task still open after the main extractions: `os-launcher` still carried `src/domain/vm/docs/kanban-pack.docs.vm.js`, and the launcher `vmmeta` generator was still ingesting it. That meant package-level Kanban docs and symbol docs existed in two places:

- the correct package-owned home in `@hypercard/kanban-runtime`
- the stale app-owned copy in `os-launcher`

That duplication was no longer useful. The docs browser was already mounting:

- `/docs/objects/surface-type/kanban.v1/*` from `KANBAN_RUNTIME_DOCS_METADATA`
- `/docs/objects/surface/os-launcher/*` from `OS_LAUNCHER_VM_PACK_METADATA`

So the launcher-local `kanban-pack.docs.vm.js` only inflated `vmmeta` and confused ownership.

### What I changed

- deleted `apps/os-launcher/src/domain/vm/docs/kanban-pack.docs.vm.js`
- removed it from `apps/os-launcher/src/domain/pluginBundle.ts`
- regenerated:
  - `apps/os-launcher/src/domain/generated/kanban.vmmeta.json`
  - `apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts`

After regeneration, `os-launcher` keeps only bundle-local surface docs. Package-level Kanban docs live only in `@hypercard/kanban-runtime`, which is the correct final ownership split.

### Validation

Commands run:

```bash
npm run vmmeta:generate

pnpm exec vitest run \
  src/domain/pluginBundle.test.ts \
  src/app/registerAppsBrowserDocs.test.ts \
  src/app/registerAppsBrowserDocs.integration.test.ts \
  --reporter=verbose
```

Results:

- launcher `vmmeta` regeneration succeeded
- plugin bundle test passed
- docs registration tests still passed

That closes the last remaining APP-16 extraction cleanup task.
