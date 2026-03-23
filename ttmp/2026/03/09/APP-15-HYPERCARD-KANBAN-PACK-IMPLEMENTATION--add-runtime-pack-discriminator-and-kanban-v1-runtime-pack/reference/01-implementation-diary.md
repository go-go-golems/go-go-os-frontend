---
Title: Implementation diary
Ticket: APP-15-HYPERCARD-KANBAN-PACK-IMPLEMENTATION
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
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts
      Note: Artifact projection middleware reviewed for packId propagation
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts
      Note: Artifact parsing seam reviewed for runtime.pack support
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
      Note: Runtime host seam reviewed for pack-aware selection
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoard.stories.tsx
      Note: Existing story coverage reviewed before adding extracted-piece stories
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoard.tsx
      Note: Current Kanban implementation reviewed before extraction work
ExternalSources: []
Summary: Diary for the APP-15 implementation work that adds explicit runtime-pack discrimination, wires the first `kanban.v1` pack, and records the accompanying Kanban widget and Storybook refactor steps.
LastUpdated: 2026-03-10T10:35:00-04:00
WhatFor: Record the implementation slices, validation commands, failures, and review instructions for the runtime-pack discriminator cutover and Kanban pack integration.
WhenToUse: Use when continuing APP-15, reviewing why each implementation slice landed, or validating the runtime-pack and Kanban widget changes across repos.
---


# Implementation diary

## Goal

Capture the step-by-step implementation of the explicit runtime-pack discriminator and the first concrete `kanban.v1` pack, including the code-path audit, Kanban widget extraction, Storybook coverage, validation commands, and commit boundaries.

## Step 1: Establish The Implementation Ticket And Define The First Code Slices

The APP-14 design work already removed the big architectural ambiguities. What remained was implementation coordination: the runtime currently behaves as if there is only one implicit pack, artifact projection only stores `runtimeCardId` plus `runtimeCardCode`, and the renderer only understands the base `ui.*` node family. That meant the first step here was not editing code yet. It was creating an implementation ticket with slice boundaries that match the real code seams.

I also re-audited the exact files that will matter in the first code slices. The important conclusion is that the runtime discriminator cut has a narrow first step: artifact parsing and projection. Once `packId` exists in artifact state and registry flow, runtime host selection and Kanban-specific rendering can build on it without compatibility branches.

### Prompt Context

**User prompt (verbatim):** "yes, work task by task, create storybook stories for all the widget work you do, and check tasks off, commit at appropriate intervals, and keep a detailed diary. You can use playwright to check the storybook on port 6007 if you want."

**Assistant interpretation:** Start real implementation with task tracking, diary updates, focused commits, and Storybook coverage for every Kanban widget extraction step.

**Inferred user intent:** Carry the APP-14 design into disciplined implementation without losing reviewability or letting the Kanban refactor drift into undocumented one-off code.

**Commit (code):** N/A

### What I did

- Created APP-15 as the dedicated implementation ticket for the discriminator and `kanban.v1` work.
- Added a detailed task list broken into four slices:
  - artifact discriminator and projection
  - runtime-pack registry and host selection
  - Kanban refactor and Storybook coverage
  - prompt policy and end-to-end cutover
- Re-audited the current code paths before editing:
  - `packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts`
  - `packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts`
  - `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
  - `packages/hypercard-runtime/src/runtime-host/PluginCardRenderer.tsx`
  - `packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
  - `packages/rich-widgets/src/kanban/KanbanBoard.tsx`
  - `packages/rich-widgets/src/kanban/kanbanState.ts`
  - `packages/rich-widgets/src/kanban/KanbanBoard.stories.tsx`

### Why

- The runtime-pack cut touches multiple repos and multiple layers. A single generic TODO list would make the commit boundaries sloppy.
- The user explicitly asked for task-by-task execution, Storybook stories for widget work, and a detailed diary, so the implementation ticket needed those expectations baked in before coding started.

### What worked

- The first slice boundary is narrow and defensible: artifact parser and projection changes can land before pack-specific rendering.
- The Kanban package already has an existing Storybook story file, which means extracted pieces can be covered without inventing a new story pipeline.

### What didn't work

- N/A

### What I learned

- The current runtime code is simpler than the APP-14 design language might suggest: the actual first cut is mostly metadata plumbing, not a broad framework rewrite.
- The Kanban refactor remains the expensive part, so it is worth keeping it as a separate later slice with dedicated Storybook validation.

### What was tricky to build

- The tricky part here was not implementation itself. It was choosing slice boundaries that map to the existing codebase rather than to architectural headings alone.
- For example, `PluginCardRenderer.tsx` and `runtimeService.ts` both participate in “pack support,” but they should not be edited in the same commit as artifact parsing unless the earlier metadata seam already exists.

### What warrants a second pair of eyes

- The artifact discriminator field shape should be reviewed once the first slice is coded, because it becomes part of the generated artifact contract.
- The Kanban view extraction should be reviewed with Storybook open, not only as file diffs, because layout and interaction seams are easier to assess visually.

### What should be done in the future

- Implement slice 1 next: parse `runtime.pack`, persist `packId`, and thread it through projection and registry flow.

### Code review instructions

- Start with `tasks.md` to confirm the intended slice boundaries.
- Then verify the runtime and Kanban files listed above are the actual seams the next commits should touch.

### Technical details

- Ticket creation:

```bash
docmgr ticket create-ticket \
  --ticket APP-15-HYPERCARD-KANBAN-PACK-IMPLEMENTATION \
  --title "Add runtime pack discriminator and kanban.v1 runtime pack" \
  --topics architecture,frontend,hypercard,wesen-os
```

- Diary creation:

```bash
docmgr doc add --ticket APP-15-HYPERCARD-KANBAN-PACK-IMPLEMENTATION --doc-type reference --title "Implementation diary"
```

## Step 2: Land Slice 1 For `runtime.pack` Parsing And Projection Metadata

The first code slice stayed intentionally narrow. I did not start with renderer changes or Kanban view extraction. I started at the point where generated artifacts become runtime metadata, because every later slice depends on that seam being explicit. Concretely, the runtime now needs to preserve the pack discriminator from the artifact envelope all the way through to the runtime card registry.

This slice touched only the artifact parser, artifact state, projection middleware, and runtime card registry metadata. That let me add `packId` without yet forcing the runtime host to choose a pack. The result is a clean first checkpoint: the metadata exists, tests assert it, and the next slice can focus purely on runtime-pack selection.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Start implementation with small, reviewable commits, keep the diary detailed, and validate each slice before moving on.

**Inferred user intent:** Avoid a giant cross-layer change. Land the discriminator path first, prove it with tests, and only then build the pack-aware runtime behavior on top.

**Commit (code):** `2eba055` - `hypercard: store runtime pack metadata in artifacts`

### What I did

- Updated `packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts` so artifact extraction reads:
  - `runtime.pack`
  - `card.id`
  - `card.code`
- Updated `packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.ts` so artifact records persist `packId`.
- Updated `packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts` so runtime card registration carries `packId`.
- Updated `packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.ts` so registry entries store optional pack metadata.
- Added/updated targeted tests in:
  - `artifactRuntime.test.ts`
  - `artifactsSlice.test.ts`
  - `artifactProjectionMiddleware.test.ts`
  - `runtimeCardRegistry.test.ts`

### Why

- Artifact parsing and projection are the first stable seam where `runtime.pack` can become real state instead of design language.
- The runtime host cannot select a pack until that metadata exists somewhere persistent.
- Keeping the first slice metadata-only avoids mixing contract introduction with renderer logic.

### What worked

- The slice stayed narrow and reviewable.
- The targeted tests for artifact parsing, artifact projection, artifact state, and registry metadata all passed once the code paths were aligned.
- `npm run typecheck -w packages/hypercard-runtime` passed after the metadata changes.

### What didn't work

- My first test run used the package test script with broad arguments and exposed two issues at once:
  - the repo contains untracked `.js` siblings next to some `.ts` sources, so Vitest in this workspace resolved those `.js` files first
  - the broad test invocation also ran an existing unrelated rerender test failure in `PluginCardSessionHost.rerender.test.tsx`
- Because of the mixed `.js`/`.ts` resolution in this workspace, I had to patch the local untracked `.js` siblings for the artifact/registry files so the runtime behavior under test actually matched the tracked TypeScript edits. I did not include those untracked build artifacts in the commit.

### What I learned

- In this repo, “change the TypeScript” is not always enough for immediate local validation because adjacent untracked JS build outputs can shadow the TS sources.
- The full package test command is a bad signal for this slice because it includes an existing rerender failure unrelated to `runtime.pack`.

### What was tricky to build

- The tricky part was not the metadata model itself. It was the workspace state.
- The runtime package currently lives in a mixed-source tree where:
  - tracked TypeScript files are the intended source of truth
  - local untracked JS outputs may still be present and resolve first in tests
- I handled that by:
  - keeping the actual commit to tracked TS sources and tests
  - patching local JS siblings only to make the current workspace’s validation reflect the TS changes
  - switching from the broad package test command to targeted Vitest file runs for the affected slice

### What warrants a second pair of eyes

- Reviewers should confirm the chosen location of `runtime.pack` in the parsed artifact shape is the one we want to standardize on before prompt-policy work lands.
- Reviewers should also be aware that the local JS sibling issue is environmental, not part of the intended committed source model.

### What should be done in the future

- Start slice 2: add the runtime-pack registry and make runtime session/bootstrap/renderer selection depend on `packId`.

### Code review instructions

- Review the metadata flow in this order:
  - `artifactRuntime.ts`
  - `artifactsSlice.ts`
  - `artifactProjectionMiddleware.ts`
  - `runtimeCardRegistry.ts`
- Then read the targeted tests that prove the slice:
  - `artifactRuntime.test.ts`
  - `artifactsSlice.test.ts`
  - `artifactProjectionMiddleware.test.ts`
  - `runtimeCardRegistry.test.ts`

### Technical details

- Targeted validation that passed:

```bash
npx vitest run \
  src/hypercard/artifacts/artifactRuntime.test.ts \
  src/hypercard/artifacts/artifactsSlice.test.ts \
  src/hypercard/artifacts/artifactProjectionMiddleware.test.ts \
  src/plugin-runtime/runtimeCardRegistry.test.ts

npm run typecheck -w packages/hypercard-runtime
```

- Broad validation attempt that was not used as the success criterion for this slice:

```bash
npm run test -w packages/hypercard-runtime -- artifactRuntime artifactProjectionMiddleware runtimeCardRegistry artifactsSlice
```

- Existing unrelated failure observed during the broad run:

```text
PluginCardSessionHost.rerender.test.tsx
Timed out waiting for text: Count: 2
```

## Related

- `../tasks.md`
- `../changelog.md`

## Step 5: Add The `wesen-os` Kanban VM Shortcut And Fix Built-In Pack Metadata

The user’s request at this point was pragmatic: make the Kanban examples open as real VM cards so they show up and behave like the other HyperCard runtime sessions. The right temporary place for that was not `rich-widgets`. It was the `wesen-os` app layer. That let me add a concrete launcher shortcut without creating a package cycle. The final architecture still belongs in APP-16, but this slice proves the cards themselves work.

While implementing that shortcut, I found one real runtime bug. Built-in plugin cards defined directly in a stack bundle were not surfacing their `packId` back to the host. The runtime host only knew how to look up pack metadata from the runtime card registry, which is the path used by artifact-injected cards. That meant the new `kanban.v1` built-in demo cards rendered as if they were default `ui.card.v1` cards and failed in the browser until the host/runtime metadata path was corrected.

### Prompt Context

**User prompt (verbatim):** "Then, create tasks for the wesen-os shortcut in the current ticket, and plow through them, so I can see if the cards themselves work."

**Assistant interpretation:** Add a temporary but real app-layer shortcut in `wesen-os` that opens concrete Kanban VM cards through the runtime session host, then validate that those cards actually render and behave correctly.

**Inferred user intent:** Get a fast, trustworthy proof that the `kanban.v1` cards work in the live shell, while keeping the clean long-term decoupling work separate.

**Commits (code):**

- `c41e1b2` - `hypercard-runtime: preserve built-in card pack metadata`
- `4591e19` - `os-launcher: add kanban vm shortcut app`

### What I did

- Added Slice 5 to APP-15 before coding so the shortcut work had explicit tasks and exit criteria.
- Extended the `os-launcher` stack in `apps/os-launcher/src/domain/stack.ts` and `apps/os-launcher/src/domain/pluginBundle.vm.js`:
  - added stack capabilities for `nav.go`, `nav.back`, and `notify.show`
  - added three concrete built-in `kanban.v1` cards:
    - `kanbanSprintBoard`
    - `kanbanBugTriage`
    - `kanbanPersonalPlanner`
  - added a richer `home` card with direct navigation buttons to those built-in cards
- Added a new app-layer launcher module in `apps/os-launcher/src/app/kanbanVmModule.tsx`:
  - top-level desktop icon: `Kanban VM`
  - launcher browser window listing the three demo boards
  - card window adapter that renders those board sessions through `PluginCardSessionHost`
- Added targeted tests in `apps/os-launcher/src/app/kanbanVmModule.test.tsx` and `apps/os-launcher/src/domain/pluginBundle.test.ts`.
- Updated launcher host coverage in `apps/os-launcher/src/__tests__/launcherHost.test.tsx` so the new app is treated as a first-class launcher module.
- Fixed the runtime host bug in `go-go-os-frontend`:
  - `stack-bootstrap.vm.js` now returns `cardPacks` in stack bundle metadata
  - `runtimeService.ts` now validates and preserves `cardPacks`
  - `PluginCardSessionHost.tsx` now resolves the current card pack from either:
    - runtime card registry metadata
    - or loaded bundle `cardPacks` for built-in stack cards
- Added a runtime regression test in `packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts` to prove built-in `defineCard(..., 'kanban.v1')` cards keep their pack metadata.
- Ran a browser smoke pass with Playwright against the `os-launcher` Vite app:
  - opened `Kanban VM`
  - launched `Sprint Board`
  - confirmed the Kanban board rendered
  - clicked `+ New`
  - confirmed the new-task modal opened

### Why

- The user needed a direct runtime proof path, not another design answer.
- Putting the shortcut in `wesen-os` avoids the package cycle that would come from making `rich-widgets` depend on `PluginCardSessionHost`.
- Fixing built-in pack metadata in the runtime host is the correct runtime behavior anyway. Without it, built-in stack cards can never safely use non-default packs.

### What worked

- Narrow `os-launcher` tests passed:

```bash
npx vitest run apps/os-launcher/src/app/kanbanVmModule.test.tsx apps/os-launcher/src/domain/pluginBundle.test.ts
```

- Runtime package regression test passed:

```bash
npx vitest run src/plugin-runtime/runtimeService.integration.test.ts
```

- Runtime package typecheck passed:

```bash
npm run typecheck -w packages/hypercard-runtime
```

- Browser smoke pass worked after the host metadata fix:
  - `Kanban VM` icon opened the launcher window
  - `Sprint Board` opened as a real runtime card window
  - the Kanban board rendered instead of throwing the default UI-pack schema error
  - the `+ New` button opened the modal

### What didn't work

- The first browser smoke pass failed with:

```text
Runtime render error: root.kind 'kanban.board' is not supported
```

- Root cause:
  - `PluginCardSessionHost` only knew how to resolve `packId` from `getPendingRuntimeCards()`
  - built-in stack cards are not stored there
  - so the host normalized the pack to the default `ui.card.v1`
  - the Kanban render tree was then validated against the wrong schema
- `npm run typecheck --workspace apps/os-launcher` still fails in this workspace because of pre-existing linked `rich-widgets` type errors outside this slice.
- The existing `apps/os-launcher/src/__tests__/launcherHost.test.tsx` suite is still blocked by its broader environment issue importing `@hypercard/arc-agi-player/launcher` in this workspace. I updated the file for coverage consistency, but I did not use that suite as the validation gate for Slice 5.
- The live browser path in this mixed-source workspace also required patching local untracked `hypercard-runtime` JS siblings to mirror the tracked TS fix, because Vite in this environment can pick up those stale generated files. I did not commit those untracked JS changes.

### What I learned

- APP-15 proved a subtle but important distinction:
  - artifact-injected runtime cards already had pack metadata via the runtime card registry
  - built-in stack cards did not
- A complete runtime-pack architecture has to preserve pack metadata for both paths.
- The right short-term place for demo launchers is the app layer, not the widget package layer.

### What was tricky to build

- The trickiest part was that the first implementation looked correct in isolated runtime tests but still failed in the browser.
- The underlying cause was a split metadata path:
  - runtime tests validated card execution and render-tree generation
  - the browser exposed that the host-side pack lookup still assumed every non-default card would come from the registry path
- The workspace also has mixed tracked TS plus untracked generated JS files, which means fixing the tracked source is not always enough to make the dev server behave immediately. I had to keep the local JS siblings in sync for the smoke pass while leaving them out of the commit.

### What warrants a second pair of eyes

- Review the built-in card pack metadata path in:
  - `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - `packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
  - `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
- Review whether the `Kanban VM` launcher should stay as a top-level icon until APP-16 lands, or whether it should eventually move under a broader app/debug folder.
- Review whether `os-launcher` should keep the demo cards permanently or only until the external-pack architecture lands.

### What should be done in the future

- APP-16 should still own the real decoupling:
  - dedicated Kanban pack package
  - app-level pack registration
  - removal of static concrete pack ownership from `hypercard-runtime`
- Once the workspace’s mixed-source TS/JS behavior is cleaned up, rerun the browser smoke pass without the local JS sibling sync patches.

### Code review instructions

- Review the runtime-side fix first:
  - `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - `packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
  - `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
  - `packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts`
- Then review the `os-launcher` shortcut:
  - `apps/os-launcher/src/domain/stack.ts`
  - `apps/os-launcher/src/domain/pluginBundle.vm.js`
  - `apps/os-launcher/src/app/kanbanVmModule.tsx`
  - `apps/os-launcher/src/app/kanbanVmModule.test.tsx`
  - `apps/os-launcher/src/domain/pluginBundle.test.ts`

### Technical details

- Browser smoke procedure used for the final proof:

```text
1. Start Vite for apps/os-launcher on port 4173
2. Open the desktop icon "Kanban VM"
3. Open "Sprint Board"
4. Confirm the board renders
5. Click "+ New"
6. Confirm the modal renders
```

## Step 3: Land Slice 2 For Runtime-Pack Registry, Helper Injection, And `kanban.v1`

Slice 2 is where `runtime.pack` stopped being passive metadata and started changing behavior. The runtime can no longer assume a single `ui.*` render tree. It now needs an explicit pack registry, VM helper injection that depends on `packId`, and host rendering that validates and renders through the selected pack instead of the generic `PluginCardRenderer` path. I implemented those pieces together because they form one contract boundary.

This slice also forced one useful packaging correction: `hypercard-runtime` cannot import the `@hypercard/rich-widgets` root barrel just to get at Kanban runtime pieces. Doing that drags unrelated widget exports and type debt into the runtime package build. The fix was to add a narrow `@hypercard/rich-widgets/kanban-runtime` subpath export and document that rule in a new APP-15 playbook.

### Prompt Context

**User prompt (verbatim):** "make a playbook on implementing runtime packs btw, as you are going on. update as you need to revise things. That way we can pass the playbook on later on."

**Assistant interpretation:** Keep implementing the runtime-pack slices, but also produce and maintain a practical playbook that captures the actual rules and lessons from the implementation as they change.

**Inferred user intent:** Make the runtime-pack work transferable, so future implementation or review work does not depend on tribal knowledge from this one session.

**Commit (code):** `d91838c` - `hypercard: add runtime pack registry and kanban v1 path`

### What I did

- Added a runtime-pack registry in `packages/hypercard-runtime/src/runtime-packs/`:
  - `runtimePackRegistry.tsx`
  - `kanbanV1Pack.tsx`
  - `index.ts`
- Registered explicit built-in packs:
  - `ui.card.v1`
  - `kanban.v1`
- Updated `stack-bootstrap.vm.js` so `defineCard(...)` selects helper injection from `packId`:
  - `ui.card.v1` injects `{ ui }`
  - `kanban.v1` injects `{ widgets }`
- Added the first pack-specific helper:
  - `widgets.kanban.board(...)`
- Changed `runtimeService.ts` so:
  - `defineCard(...)` accepts `packId`
  - render returns raw tree output instead of assuming the base UI schema
- Changed `runtimeCardRegistry.ts` so injected cards pass `packId` into the runtime service
- Changed `PluginCardSessionHost.tsx` so the current card’s pack determines:
  - render-tree validation
  - host-side rendering
- Added a narrow Kanban runtime export in `packages/rich-widgets/src/kanban/runtime.ts`
- Added runtime tests for:
  - pack registry contents and unknown-pack failures
  - `packId` injection through `runtimeCardRegistry`
  - a dynamic `kanban.v1` card rendered via the runtime service
- Added the living playbook:
  - `playbooks/01-runtime-pack-implementation-playbook.md`

### Why

- `runtime.pack` only matters if it changes behavior in both the VM bootstrap and the host render path.
- The first concrete non-`ui.*` pack had to be real enough to prove the architecture in running code, not just in docs.
- The Kanban runtime surface needed a narrow dependency seam so runtime package validation would not be dominated by unrelated rich-widget export debt.

### What worked

- `npm run typecheck -w packages/hypercard-runtime` passed after narrowing the rich-widget dependency to the `kanban-runtime` subpath export.
- The targeted Slice 2 test run passed:
  - `runtimeCardRegistry.test.ts`
  - `runtimeService.integration.test.ts`
  - `runtimePackRegistry.test.tsx`
- The new `kanban.v1` path now exists end to end:
  - registry
  - helper injection
  - runtime card definition
  - render-tree validation
  - host renderer selection

### What didn't work

- My first attempt imported `@hypercard/rich-widgets` directly from the runtime pack files. That pulled the entire root barrel into `hypercard-runtime` typechecking and exposed unrelated rich-widget errors.
- Local Vitest execution initially still loaded stale untracked `.js` siblings for `runtimeService` and `runtimeCardRegistry`, so the workspace behaved as if the new pack-aware TS path did not exist.

### What I learned

- Runtime-pack work needs a narrow package surface just as much as it needs a narrow runtime contract. A pack-aware architecture with a broad package import is still messy in practice.
- In this workspace, local untracked JS build outputs are not just cosmetic. They can invalidate the result of a targeted test run unless patched or regenerated.

### What was tricky to build

- The tricky part was deciding where pack validation belongs.
- If `runtimeService.renderCard(...)` keeps validating with `validateUINode(...)`, the new pack model is fake because every pack still has to masquerade as the base UI tree.
- The fix was to move pack-specific validation selection into the runtime-pack registry and make the host choose validation/rendering from `packId`.
- The second tricky part was packaging:
  - importing `@hypercard/rich-widgets` from `hypercard-runtime` is too broad
  - importing rich-widget files by relative path violates `rootDir` project boundaries
  - the stable answer is a narrow package subpath export

### What warrants a second pair of eyes

- Review the event surface in `kanbanV1Pack.tsx`: it currently adapts the existing `KanbanBoardFrame` dispatch shape, which is acceptable for this slice but should become cleaner once the Kanban view extraction lands.
- Review the default-pack rule for cards without explicit metadata. Static stack cards still effectively map to `ui.card.v1`, and that should remain an intentional baseline contract rather than an accidental fallback.

### What should be done in the future

- Start Slice 3:
  - extract Kanban view parts
  - make `KanbanBoard.tsx` a thin wrapper
  - move the pack renderer from the temporary `KanbanBoardFrame` adapter toward explicit view-part props/callbacks
  - add Storybook stories for each extracted piece and verify them visually

### Code review instructions

- Review the runtime pack path in this order:
  - `packages/hypercard-runtime/src/runtime-packs/runtimePackRegistry.tsx`
  - `packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx`
  - `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - `packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
  - `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
- Then review the package seam:
  - `packages/rich-widgets/src/kanban/runtime.ts`
  - `packages/rich-widgets/package.json`
- Then read the playbook:
  - `playbooks/01-runtime-pack-implementation-playbook.md`
- Finally run the targeted validation commands below.

### Technical details

- Slice 2 validation that passed:

```bash
npm run typecheck -w packages/hypercard-runtime

npx vitest run \
  src/plugin-runtime/runtimeCardRegistry.test.ts \
  src/plugin-runtime/runtimeService.integration.test.ts \
  src/runtime-packs/runtimePackRegistry.test.tsx
```

- Local workspace caveat:

```text
Vitest in this workspace still resolved stale untracked .js siblings for some runtime files.
To make the current workspace execute the tracked TS behavior, I patched the local untracked JS siblings for:
- runtimeCardRegistry.js
- runtimeService.js
- PluginCardSessionHost.js
- index.js

Those JS artifacts were not committed.
```

## Step 4: Land Slice 3 For Kanban View Extraction, Semantic Callbacks, And Storybook Coverage

Slice 3 is where the Kanban pack stopped depending on the internal Redux action shape of the original rich widget. That was the main architectural risk left from Slice 2. `kanban.v1` was real enough to prove the runtime-pack architecture, but its host renderer was still adapting against `KanbanBoardFrame` and `kanbanActions`. That is still too coupled to the widget’s implementation details. The real boundary needs reusable view parts with semantic callbacks.

### Prompt Context

**User prompt (verbatim):** "group them under Kanban/"

**Assistant interpretation:** Keep the new Kanban widget stories, but make the Storybook taxonomy explicit and grouped so extracted Kanban parts show up together.

**Inferred user intent:** Treat the Kanban extraction as a coherent component family, not as disconnected rich-widget fragments, and keep the runtime-pack refactor reviewable in Storybook.

**Commit (code):** `7f53467` - `rich-widgets: extract kanban view parts for runtime pack`

### What I did

- Extracted three reusable Kanban view pieces from the old monolithic `KanbanBoard.tsx`:
  - `KanbanTaskCard.tsx`
  - `KanbanTaskModal.tsx`
  - `KanbanBoardView.tsx`
- Changed `KanbanBoard.tsx` so the top-level widget wrapper now just maps Redux/local-state updates onto semantic callbacks consumed by `KanbanBoardView`.
- Changed `packages/rich-widgets/src/kanban/runtime.ts` so the narrow runtime-pack subpath now exports `KanbanBoardView` and `KanbanBoardViewProps` instead of forcing the runtime pack through the old `KanbanBoardFrame` seam.
- Changed `packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx` so the host pack renderer:
  - renders `KanbanBoardView` directly
  - emits semantic event payloads
  - no longer switches on `kanbanActions.*` action creators
- Added Storybook stories for each extracted Kanban piece:
  - `KanbanBoardView.stories.tsx`
  - `KanbanTaskCard.stories.tsx`
  - `KanbanTaskModal.stories.tsx`
- Regrouped the Kanban stories under:
  - `RichWidgets/Kanban/Board`
  - `RichWidgets/Kanban/BoardView`
  - `RichWidgets/Kanban/TaskCard`
  - `RichWidgets/Kanban/TaskModal`
- Updated `.storybook/main.ts` to alias `@hypercard/rich-widgets/kanban-runtime` explicitly so Storybook/Vite can resolve the narrow runtime-pack subpath.
- Verified the grouped stories interactively in Storybook with Playwright after restarting Storybook on a fresh port to avoid stale module resolution.

### Why

- `kanban.v1` should depend on a stable semantic view contract, not the private reducer/action vocabulary of the original rich widget.
- The extracted view parts are the reusable host-render seam APP-14 was aiming for.
- Storybook needed to become part of the implementation discipline here because the whole point of the split is to make the host-render pieces independently testable and reviewable.

### What worked

- `npm run typecheck -w packages/hypercard-runtime` passed after changing the runtime pack to use `KanbanBoardView`.
- The targeted runtime-pack test run still passed:
  - `runtimeCardRegistry.test.ts`
  - `runtimeService.integration.test.ts`
  - `runtimePackRegistry.test.tsx`
- `npm run storybook:check` passed with the regrouped `RichWidgets/Kanban/*` story taxonomy.
- Playwright confirmed the new grouped stories rendered correctly in Storybook:
  - `BoardView`
  - `TaskModal`

### What didn't work

- Storybook initially failed to load `kanbanV1Pack.tsx` because Vite could not resolve `@hypercard/rich-widgets/kanban-runtime`.
- The root cause was that `.storybook/main.ts` aliased `@hypercard/rich-widgets` but not the new custom `@hypercard/rich-widgets/kanban-runtime` subpath.
- The already-running Storybook instance on port `6007` was also stale enough that it was not a trustworthy signal after the runtime-pack refactor.

### What I learned

- A narrow runtime-pack subpath is only real once every build and preview environment resolves it consistently. Storybook needs the same alias discipline as the app build.
- Grouped Storybook taxonomy matters for refactor review. Once the extracted pieces lived under one Kanban folder, it became much easier to verify that the slice was complete.
- Replacing Redux action-shape coupling with semantic callbacks is the key move that turns a reused widget into a stable pack surface.

### What was tricky to build

- The hard part was separating “semantic callback” from “implementation detail”.
- For example, the old widget toggled filters through reducer actions like `setFilterTag` and `setFilterPriority`. The reusable view should not care that Redux exists; it should just surface `onSetFilterTag` and `onSetFilterPriority`.
- The second tricky part was deciding how much logic should stay in `KanbanBoardView`.
- The answer was:
  - keep view-local interaction state there, like drag-over highlights
  - keep filtering/grouping derived from semantic state there
  - keep persistence/store wiring out of it

### What warrants a second pair of eyes

- Review `KanbanBoardView.tsx` for whether any remaining logic should move down into smaller pure helpers rather than staying inline.
- Review `kanbanV1Pack.tsx` for payload naming consistency between the Kanban render tree and VM handler arguments, especially `onMoveTask`, `onSetFilterTag`, and `onSetFilterPriority`.
- Review whether `packages/rich-widgets/src/index.ts` should export every extracted Kanban part from the root barrel long-term, or whether some of those exports should stay runtime-pack-specific only.

### What should be done in the future

- Start Slice 4:
  - update prompt policy so Kanban-targeting artifacts emit `runtime.pack: kanban.v1`
  - update examples/fixtures/authoring surfaces to actually use the Kanban pack metadata and helper surface
  - re-run typecheck and Storybook validation after the authoring cutover

### Code review instructions

- Review the extracted view pieces first:
  - `packages/rich-widgets/src/kanban/KanbanTaskCard.tsx`
  - `packages/rich-widgets/src/kanban/KanbanTaskModal.tsx`
  - `packages/rich-widgets/src/kanban/KanbanBoardView.tsx`
- Then review the wrapper and runtime seams:
  - `packages/rich-widgets/src/kanban/KanbanBoard.tsx`
  - `packages/rich-widgets/src/kanban/runtime.ts`
  - `packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx`
- Then review the Storybook pieces:
  - `packages/rich-widgets/src/kanban/KanbanBoard.stories.tsx`
  - `packages/rich-widgets/src/kanban/KanbanBoardView.stories.tsx`
  - `packages/rich-widgets/src/kanban/KanbanTaskCard.stories.tsx`
  - `packages/rich-widgets/src/kanban/KanbanTaskModal.stories.tsx`
  - `.storybook/main.ts`

### Technical details

- Slice 3 validation that passed:

```bash
npm run typecheck -w packages/hypercard-runtime

npx vitest run \
  src/plugin-runtime/runtimeCardRegistry.test.ts \
  src/plugin-runtime/runtimeService.integration.test.ts \
  src/runtime-packs/runtimePackRegistry.test.tsx

npm run storybook:check
```

- Interactive Storybook verification:

```text
Started a fresh Storybook instance on port 6008 after the old 6007 instance served stale modules.
Playwright confirmed the grouped RichWidgets/Kanban stories and successfully opened:
- BoardView
- TaskModal
```

## Step 5: Land Slice 4 For Inventory Prompt Policy, Metadata Preservation, And Parser Alignment

Slice 4 was supposed to be the straightforward authoring cutover: update the inventory prompt policy so Kanban-producing cards emit `runtime.pack: kanban.v1`, preserve that metadata in the backend extractor, and add end-to-end tests. It did become that, but it also surfaced one last frontend inconsistency: the inventory backend emits pack metadata under `data.runtime.pack`, while the frontend parser was still reading `runtime.pack` from the wrong level. That mismatch was invisible until the new inventory projection test asserted the real store state.

### Prompt Context

**User prompt (verbatim):** "yes, work task by task, create storybook stories for all the widget work you do, and check tasks off, commit at appropriate intervals, and keep a detailed diary. You can use playwright to check the storybook on port 6007 if you want."

**Assistant interpretation:** Finish the remaining APP-15 slices in real code, keep the diary/playbook current, and do proper validation instead of just documenting intent.

**Inferred user intent:** Make `kanban.v1` an actual authored card path, not just a runtime-only capability, and leave behind durable docs about the real implementation seams.

**Commits (code):**

- `4295697` - `inventory: preserve kanban runtime pack metadata`
- `6ac6510` - `hypercard: read runtime pack metadata from card payload`

### What I did

- Updated the inventory runtime-card prompt policy:
  - documented the default `ui.card.v1` path versus the Kanban pack path
  - required `runtime.pack: kanban.v1` for Kanban-targeting cards
  - added a concrete Kanban envelope example using `({ widgets }) => ({ ... })`
- Extended the inventory runtime-card extractor payload shape so it preserves `runtime.pack` instead of dropping unknown YAML fields.
- Added backend tests that now prove:
  - extractor output preserves `data.runtime.pack`
  - timeline projection preserves the same metadata into `hypercard.card.v2` entities
- Reworked the inventory frontend test so it verifies projection into the host store instead of trying to render through a linked-workspace React hook setup.
- Added a new inventory projection test that confirms a `kanban.v1` card reaches the store with:
  - the correct artifact id
  - the correct runtime card id
  - `packId: kanban.v1`
- Fixed `packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts` so the frontend parser now reads pack metadata from `data.runtime.pack`, which matches the actual backend event shape.
- Updated runtime artifact tests to match the real emitted envelope shape.

### Why

- Without the inventory prompt-policy cutover, `kanban.v1` remains a hidden runtime feature that the authoring path does not actually use.
- Without the backend extractor update, authored `runtime.pack` metadata disappears before the frontend ever sees it.
- Without the frontend parser fix, the backend and frontend disagree about the location of pack metadata and the new discriminator silently stops working.

### What worked

- Backend targeted tests passed:
  - `go test ./pkg/pinoweb -run 'TestRuntimeCardExtractor|TestHypercardTimelineHandlers_CardUpdateProjectsStreamingCardResult'`
- Inventory frontend projection test passed:
  - `npx vitest run apps/inventory/src/launcher/renderInventoryApp.chat.test.tsx`
- Inventory app TypeScript build passed from the workspace root:
  - `node node_modules/typescript/bin/tsc --build workspace-links/go-go-app-inventory/apps/inventory/tsconfig.json`
- Frontend runtime package validation passed:
  - `npm run typecheck -w packages/hypercard-runtime`
  - `npx vitest run src/hypercard/artifacts/artifactRuntime.test.ts src/hypercard/artifacts/artifactProjectionMiddleware.test.ts`
- Storybook taxonomy validation still passed:
  - `npm run storybook:check`

### What didn't work

- My first attempt at the inventory frontend validation reused the existing `ChatConversationWindow` render test harness. In this linked-workspace layout it immediately failed with the known duplicate-React / invalid-hook-call problem, before it even exercised the card projection logic.
- `npm run typecheck -w packages/rich-widgets` still fails with the existing linked-workspace `TS6059` / `TS6307` project-boundary problem. Those errors are broader package-graph/rootDir issues and were already present before this slice.

### What I learned

- The most fragile part of the runtime-pack path was not the VM renderer. It was the exact nesting of `runtime.pack` inside the authored payload.
- A good end-to-end projection test is more valuable than a render-only test when the thing being verified is metadata continuity rather than DOM output.
- Prompt-policy changes only count if the backend extractor and frontend parser agree on the same envelope shape.

### What was tricky to build

- The tricky part was recognizing that the missing `packId` in the inventory projection test was not an inventory bug after the backend fix. It was a frontend parser bug.
- The backend emits card payload like this:
  - `title`
  - `name`
  - `data.artifact`
  - `data.runtime.pack`
  - `data.card`
- The frontend parser had been reading `runtime.pack` from the outer record instead of the nested `data` record.
- That bug stayed hidden because earlier runtime tests used the wrong shape too, so they were accidentally testing the parser’s mistaken assumption rather than the real backend output.

### What warrants a second pair of eyes

- Review `runtime-card-policy.md` to make sure the Kanban action names are the right long-term authoring vocabulary and not just temporary examples.
- Review whether the inventory frontend should eventually regain a stable rendered-chat test for `hypercard.card.v2` once the linked-workspace React duplication issue is cleaned up.
- Review whether the inventory backend should eventually validate known pack IDs, or whether preserving arbitrary `runtime.pack` strings is the right behavior at the extractor layer.

### What should be done in the future

- APP-15 itself is now functionally complete.
- The remaining meaningful follow-up is not more pack work inside this ticket; it is the existing workspace/typecheck cleanup around linked package `rootDir` boundaries, especially for `rich-widgets`.

### Code review instructions

- Review the inventory authoring seam first:
  - `pkg/pinoweb/prompts/runtime-card-policy.md`
  - `pkg/pinoweb/hypercard_extractors.go`
  - `pkg/pinoweb/hypercard_extractors_test.go`
  - `pkg/pinoweb/hypercard_timeline_handlers_test.go`
- Then review the inventory projection test:
  - `apps/inventory/src/launcher/renderInventoryApp.chat.test.tsx`
- Then review the frontend parser fix:
  - `packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts`
  - `packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.test.ts`
  - `packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.test.ts`

### Technical details

- Slice 4 validation that passed:

```bash
go test ./pkg/pinoweb -run 'TestRuntimeCardExtractor|TestHypercardTimelineHandlers_CardUpdateProjectsStreamingCardResult'

npx vitest run apps/inventory/src/launcher/renderInventoryApp.chat.test.tsx

node node_modules/typescript/bin/tsc --build workspace-links/go-go-app-inventory/apps/inventory/tsconfig.json

npm run typecheck -w packages/hypercard-runtime

npx vitest run \
  src/hypercard/artifacts/artifactRuntime.test.ts \
  src/hypercard/artifacts/artifactProjectionMiddleware.test.ts

npm run storybook:check
```

- Validation that still reports the pre-existing linked-workspace problem:

```text
npm run typecheck -w packages/rich-widgets

Fails with existing TS6059 / TS6307 rootDir and project-file-list errors caused by linked package boundaries.
This slice did not introduce those errors, but I am recording them because the validation task explicitly called for the check.
```
