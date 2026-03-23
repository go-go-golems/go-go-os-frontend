---
Title: Investigation diary
Ticket: APP-23-HYPERCARD-RUNTIME-LANGUAGE-BOUNDARY
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - tooling
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/cards/types.ts
      Note: Reviewed to confirm card is still the top-level engine and desktop noun
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts
      Note: Reviewed to confirm the worker transport API is card-shaped all the way down
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Reviewed to confirm the JS authoring API is also card-shaped all the way down
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
      Note: Reviewed to confirm current host logic mixes session ownership and current-card rendering
    - Path: /home/manuel/code/wesen/corporate-headquarters/vm-system/README.md
      Note: Reviewed as precedent showing a cleaner runtime-first naming model based on templates sessions and executions
Summary: Investigation diary for APP-23 covering the original card-terminology overload, the completed package/bundle/surface rename, and the final carve-out for the external artifact protocol.
LastUpdated: 2026-03-11T12:35:00-04:00
WhatFor: Record the reasoning and evidence behind the APP-23 rename so future implementation work can distinguish the completed runtime-core cutover from the remaining artifact-protocol carve-outs.
WhenToUse: Use when reviewing why the runtime now uses package/bundle/surface concepts, or when checking whether a remaining `card` term is still intentional.
---

# Investigation diary

## Goal

Figure out whether the current runtime stack is deeply tied to the idea of a `card`, and if so, what the correct replacement model is. The final answer turned out not to be just “rename card to runtime surface.” It required naming the installable static capability bundle as well.

## Step 1: Re-check the current runtime and desktop nouns

I started by rereading the current engine and runtime files rather than relying on memory, because the question was specifically about how deeply entangled the concepts are.

The answer from the code is:

- QuickJS itself is not card-shaped
- the public runtime API is card-shaped
- the desktop shell API is card-shaped

That is an important distinction. The problem is not the engine. It is the terminology and transport boundary we built around it.

The strongest evidence was:

- `CardStackDefinition`
- `homeCard`
- `cards`
- `RenderCardRequest`
- `EventCardRequest`
- `DefineCardRequest`
- `defineCard(...)`
- `PluginCardSessionHost`

That is too much coupling to dismiss as a harmless label.

## Step 2: Compare against a cleaner runtime-first system

I then compared this against `vm-system`, because the user specifically pointed to that earlier lineage.

That comparison was clarifying. `vm-system` does not make UI terminology the core runtime concept. It uses:

- templates
- sessions
- executions
- runtime summary

This does not solve our exact frontend problem, but it proves the lower runtime layer can be modeled without product/UI metaphors leaking into it.

That was enough to justify moving away from the old `card` terminology, but it did not yet answer what `ui` and `kanban` actually are.

## Step 3: Realize that package is the missing concept

The next clarification came from the user pushing on what `ui` and `kanban` really contain.

That was the turning point. The system does not just have:

- sessions
- bundles
- renderable surfaces

It also has installable cross-boundary capability bundles that include:

- VM-side helper APIs
- docs and prompt metadata
- host validators/renderers
- examples and generated metadata

That is not “just a pack” in the current narrow sense, and it is not “just part of the bundle”. It is a separate concept. That concept is `RuntimePackage`.

Once that was named, the current code became much easier to describe accurately:

- `ui` is a runtime package
- `kanban` is a runtime package
- `ui.card.v1` and `kanban.v1` are runtime surface types
- authored “cards” are runtime surfaces
- assembled app code is a runtime bundle
- the live QuickJS instance is a runtime session

## Step 4: Reframe current `RuntimePack` as `RuntimeSurfaceType`

Earlier I had treated current `RuntimePack` as the main host/runtime abstraction. That was incomplete.

After the package clarification, the right interpretation became:

- current `RuntimePack` is really a registry of surface types
- it is not the whole installable capability package

That was an important correction, because it means the rename should not simply preserve `RuntimePack` as the central noun. It should demote it into the more precise concept:

- `RuntimeSurfaceType`

This fits the current code much better:

- `ui.card.v1`
- `kanban.v1`

are type/contract ids, not package ids.

## Step 5: Drop the `JSRuntime*` names for now

I then revised the lower-layer naming choice again.

At first, `JSRuntimeSession` and `JSRuntimeBundle` seemed attractive because they made the current engine explicit. But after the user clarified that future multi-language support is not the immediate goal, those names started to look like premature specialization.

The immediate problem is not “support many languages now.” The immediate problem is “the current runtime model has the wrong nouns.”

So the lower layer became:

- `RuntimeSession`
- `RuntimeBundle`

with multi-language follow-up explicitly deferred.

## Step 4: Choose between compatibility and direct cutover

I rejected a compatibility-heavy approach for the same reasons we already used in the HyperCard pack work:

- a mixed vocabulary is harder to reason about than a hard rename
- the system is still internal enough that a direct cutover is tractable
- packs, docs, debug tooling, and session hosts are already changing together often enough

That led to the recommendation:

- direct rename
- one branch
- no `defineCard` plus `defineSurface` coexistence

## Step 5: Decide how much of the desktop layer to rename

This was the only place I intentionally stopped short of a hard answer.

Internally, the desktop model should eventually align with the new runtime nouns. But there is a product/UX question hiding there:

- do we still want the HyperCard metaphor in user-facing labels

I do not think that question should block the runtime cleanup.

So the design recommendation became:

- rename runtime core first
- rename desktop types too if possible
- but keep open the option that some user-facing labels still say “Card”

## Commands and files reviewed

Commands run:

```bash
sed -n '1,220p' workspace-links/go-go-os-frontend/packages/engine/src/cards/types.ts
sed -n '1,220p' workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/desktopShellTypes.ts
sed -n '1,240p' workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts
sed -n '1,260p' workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
sed -n '1,260p' workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
sed -n '1,220p' /home/manuel/code/wesen/corporate-headquarters/vm-system/README.md
```

## What worked

- The current codebase already has a useful higher-level abstraction in `RuntimePack`.
- `vm-system` gives a clear precedent for keeping engine/session concepts free of UI metaphors.
- The split into language-specific and language-neutral layers is easy to explain and defensible technically.

## Main design conclusion

The right terminology stack is:

- `RuntimeSession`
- `RuntimeBundle`
- `RuntimePackage`
- `RuntimeSurface`
- `RuntimeSurfaceType`

The wrong thing to do would be:

- keep `card` as the lower-layer noun forever
- treat current `RuntimePack` as the whole installable package concept
- collapse bundle code and reusable package capabilities into one term

## Step 6: Validate and publish the ticket

Once the design guide and task breakdown were in place, I ran `docmgr doctor` for APP-23. The ticket passed without vocabulary issues, which was useful confirmation that the topic choices were already aligned with the current docs taxonomy.

I then bundled the ticket docs and uploaded them to reMarkable at:

- `/ai/2026/03/10/APP-23-HYPERCARD-RUNTIME-LANGUAGE-BOUNDARY`

That bundle includes:

- `index.md`
- the main design guide
- `tasks.md`
- `changelog.md`
- this investigation diary

## Step 7: Turn the design into a direct-cutover implementation backlog

After the naming and architecture stabilized further around `RuntimeSession`, `RuntimeBundle`, `RuntimePackage`, `RuntimeSurface`, and `RuntimeSurfaceType`, I expanded `tasks.md` from a research checklist into an implementation-ready transition plan.

The important constraint from the user was explicit:

- no backward compatibility
- no wrapper layers
- no dual APIs

So the task list now assumes one coordinated branch that:

- renames runtime transport and service APIs in place
- renames bootstrap globals in place
- introduces a real runtime package registry instead of more implicit package wiring
- renames current `RuntimePack` concepts into `RuntimeSurfaceType`
- updates desktop/windowing/runtime/debug/docs layers together
- deletes old public names rather than aliasing them

That backlog is intentionally detailed enough to be used as the implementation ticket plan, not just as a high-level roadmap.

## Step 8: Implement Slice 0 and Slice 1 as the first hard cutover

I started the implementation branch by taking the smallest high-leverage rename first: the host-side runtime pack registry. That registry sits at the boundary between VM output and host rendering, so renaming it early forces the rest of the branch to use the new `RuntimeSurfaceType` vocabulary instead of letting the old `RuntimePack` terms keep spreading.

I also used this slice to make the no-compatibility rule concrete instead of leaving it as a design preference. The APP-23 index now explicitly says the transition must not introduce compatibility aliases, dual exports, or wrapper layers. That matters because this rename could easily drift into a long transitional state if the first slice left the old registry names alive.

### What I changed

- Renamed the registry file:
  - `runtimePackRegistry.tsx` -> `runtimeSurfaceTypeRegistry.tsx`
- Renamed the public registry types:
  - `RuntimePackDefinition` -> `RuntimeSurfaceTypeDefinition`
  - `RuntimePackRendererProps` -> `RuntimeSurfaceTypeRendererProps`
  - `RuntimePackId` -> `RuntimeSurfaceTypeId`
  - `RuntimePackTree` -> `RuntimeSurfaceTree`
- Renamed the public registry functions:
  - `registerRuntimePack` -> `registerRuntimeSurfaceType`
  - `getRuntimePackOrThrow` -> `getRuntimeSurfaceTypeOrThrow`
  - `normalizeRuntimePackId` -> `normalizeRuntimeSurfaceTypeId`
  - `listRuntimePacks` -> `listRuntimeSurfaceTypes`

## Step 9: Finish the sweep and define the remaining carve-out precisely

After the major runtime/core renames landed, the last job was not more code movement. It was proving that the remaining `card` nouns in the live tree were either intentional or truly stale.

I re-ran repo searches over the live frontend and app trees, excluding generated artifacts and ticket archives, looking specifically for:

- `renderCard(`
- `eventCard(`
- `defineCard(`
- `CardStackDefinition`
- `homeCard`
- `runtimeCardId`
- `runtimeCardCode`
- `RuntimePack`

The result was useful:

- runtime-core execution code was already clean
- most remaining `card` hits were in:
  - external artifact protocol names such as `hypercard.card.v2`
  - backend/prompt filenames such as `runtime-card-policy.md`
  - Go extractor errors that still correctly describe the card artifact envelope
  - historical docs and ticket archives

That meant APP-23 could stop trying to rename every `card` string in the repository and instead document the rule clearly:

- runtime-core execution and host internals should use bundle/surface/package nouns
- artifact-envelope protocol code may still use `card`

### Final cleanup actions

I made a small last pass over the live docs/tests that still accidentally used runtime-card wording where the new runtime model was already in place:

- inventory VM-boundary guide:
  - `runtime card-local state` -> `runtime surface-local state`
  - `effectful runtime cards` -> `effectful runtime surfaces`
- inventory bundle test description:
  - now talks about runtime surfaces instead of runtime cards
- HyperCard timeline test description:
  - now says the artifact still registers a runtime surface

I also wrote a repo-level runtime concepts guide in:

- `go-go-os-frontend/docs/runtime-concepts-guide.md`

That guide is important because APP-23 should not be the only place where the final runtime model is explained. Ticket docs are useful for history, but contributors need a stable repo-local document too.

### Validation

I validated the closeout with:

```bash
npx vitest run packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.test.ts
npm test -- --run src/domain/pluginBundle.test.ts
go test ./pkg/pinoweb -run 'TestRuntimeCardExtractor|TestHypercardTimelineHandlers_CardUpdateProjectsStreamingCardResult'
docmgr doctor --ticket APP-23-HYPERCARD-RUNTIME-LANGUAGE-BOUNDARY --stale-after 30
```

All of those passed.

### Final conclusion

APP-23 is complete enough to close.

The runtime-core rename is finished. The remaining intentional carve-outs are:

- external artifact protocol names
- backend extractor/event names tied to `hypercard.card.v2`
- historical ticket/archive material

The next real architecture move is no longer “finish the rename.” It is APP-16: extract concrete runtime packages out of runtime core.
  - `validateRuntimeTree` -> `validateRuntimeSurfaceTree`
  - `renderRuntimeTree` -> `renderRuntimeSurfaceTree`
- Renamed the default surface-type constant:
  - `DEFAULT_RUNTIME_PACK_ID` -> `DEFAULT_RUNTIME_SURFACE_TYPE_ID`
- Renamed the kanban constant to match the same layer:
  - `KANBAN_V1_PACK_ID` -> `KANBAN_V1_SURFACE_TYPE_ID`
- Updated dependent imports in:
  - `PluginCardSessionHost.tsx`
  - `runtimeService.integration.test.ts`
  - `apps/os-launcher/src/domain/pluginBundle.test.ts`
- Updated the APP-23 docs to record the in-place-only implementation stance and check off Slice 0 and Slice 1
- Code commits:
  - `go-go-os-frontend` `d3d26a3` — `Rename runtime pack registry to surface type registry`
  - `wesen-os` `025da34` — `Update os-launcher tests for surface type registry rename`

### Commands and validation

Commands run:

```bash
rg -n "RuntimePack|runtimePackRegistry|renderCard\\(|eventCard\\(|defineCard\\(|CardStackDefinition|homeCard|cardPacks|PluginCardSessionHost|runtimeCardRegistry" workspace-links/go-go-os-frontend apps workspace-links/go-go-app-inventory workspace-links/go-go-app-sqlite workspace-links/go-go-app-arc-agi-3
rg -n "runtimePackRegistry|RuntimePackDefinition|registerRuntimePack|getRuntimePackOrThrow|validateRuntimeTree|renderRuntimeTree|DEFAULT_RUNTIME_PACK_ID|RuntimePackId|RuntimePackTree" workspace-links/go-go-os-frontend apps/os-launcher
npx vitest run packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.test.tsx packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts
npm run typecheck -w packages/hypercard-runtime
cd apps/os-launcher && npm test -- --run src/domain/pluginBundle.test.ts
docmgr doctor --ticket APP-23-HYPERCARD-RUNTIME-LANGUAGE-BOUNDARY --stale-after 30
```

What worked:

- The registry rename was self-contained enough to land first without touching worker transport yet.
- `hypercard-runtime` tests passed after the public API rename.
- `os-launcher`'s targeted runtime-bundle test passed after updating the imported validation helper.

What did not work:

- My first validation command tried to run the `apps/os-launcher` test from the `workspace-links/go-go-os-frontend` repo root as part of one Vitest invocation. That only executed the local `hypercard-runtime` tests and silently did not cover `os-launcher`, so I reran the launcher test from `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher`.

What this unlocked:

- The rest of the APP-23 branch can now talk about surface types at the host validation/rendering layer without carrying `RuntimePack` aliases.
- The next slice can rename runtime transport and service contracts against a stable host-side noun.

## Step 9: Cut over runtime transport and VM authoring in one slice

I took Slice 2 and Slice 3 together. Splitting them would have forced a temporary bridge between the renamed runtime service and the old VM bootstrap globals, which would have violated APP-23's “no wrappers, no aliases” rule.

### What changed in runtime transport

In `packages/hypercard-runtime/src/plugin-runtime/contracts.ts` I renamed the runtime transport contract to the new bundle/surface vocabulary:

- `CardId` -> `RuntimeSurfaceId`
- `LoadedStackBundle` -> `RuntimeBundleMeta`
- `RenderCardRequest` -> `RenderRuntimeSurfaceRequest`
- `EventCardRequest` -> `EventRuntimeSurfaceRequest`
- `DefineCardRequest` -> `DefineRuntimeSurfaceRequest`
- `DefineCardRenderRequest` -> `DefineRuntimeSurfaceRenderRequest`
- `DefineCardHandlerRequest` -> `DefineRuntimeSurfaceHandlerRequest`

I also renamed the transport payload fields:

## Step 10: Finish the desktop/windowing cutover to bundle and surface nouns

After the runtime-core slices were stable, I moved on to the place where the old vocabulary was still most visible: the desktop/windowing layer and the app launchers that sit on top of it.

This slice mattered because the branch was otherwise in an awkward mixed state:

- runtime transport talked about bundles and surfaces
- but the engine shell and launcher payloads still used stack/card nouns in a lot of places

That would have left the public host boundary internally inconsistent, so I treated Slice 7 as a real cutover rather than a cosmetic cleanup.

### What changed

In `packages/engine`:

- `CardStackDefinition` became `RuntimeBundleDefinition`
- `CardDefinition` became `RuntimeSurfaceMeta`
- `homeCard` became `homeSurface`
- `cards` became `surfaces`
- window content `kind: 'card'` became `kind: 'surface'`
- `content.card` became `content.surface`
- session nav entries now store `{ surface, param }`
- `cardSessionId` became `surfaceSessionId`

That forced corresponding updates in:

- `windowingSlice.ts`
- desktop shell controller/adapter/router files
- story helpers
- desktop shell stories and tests
- runtime debug window/tests/stories
- runtime artifact open-window payloads
- runtime host rerender tests

Then I propagated the same rename through the first-party launchers and stack definitions:

- `os-launcher`
- `inventory`
- `sqlite`
- `arc-agi-player`
- `book-tracker-debug`
- `crm`
- `hypercard-tools`
- `todo`

### One unrelated but blocking test issue

While validating this slice, the SQLite launcher tests still exploded before any assertions ran. That turned out not to be an APP-23 behavior regression. The local Vitest alias for `@reduxjs/toolkit` only stubbed `createSlice`, while the launcher runtime state also imports `createAction`.

So I fixed the test harness itself in `go-go-app-sqlite`:

- added `createAction` to `src/test/stubs/redux-toolkit.ts`

I kept that as its own isolated commit so the APP-23 rename diff did not hide unrelated test-harness repair.

### Commands and validation

Commands run during this slice:

```bash
npx vitest run \
  packages/engine/src/components/shell/windowing/desktopCommandRouter.test.ts \
  packages/engine/src/components/shell/windowing/DesktopShell.contextMenu.test.tsx \
  packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.test.tsx \
  packages/hypercard-runtime/src/hypercard/debug/runtimeDebugRegistry.test.tsx

npx vitest run \
  packages/engine/src/__tests__/windowing.test.ts \
  packages/engine/src/components/shell/windowing/windowContentAdapter.test.ts \
  packages/engine/src/components/shell/windowing/desktopContributions.test.ts \
  packages/hypercard-runtime/src/__tests__/plugin-intent-routing.test.ts \
  packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.test.ts \
  packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx

npm run typecheck -w packages/hypercard-runtime
npm exec tsc -- --noEmit -p apps/apps-browser/tsconfig.json

cd apps/os-launcher
npm test -- --run src/__tests__/launcherHost.test.tsx src/app/kanbanVmModule.test.tsx

cd workspace-links/go-go-app-inventory/apps/inventory
npm run typecheck

cd workspace-links/go-go-app-sqlite/apps/sqlite
npm test -- --run src/launcher/module.test.tsx
```

What worked:

- The engine/windowing rename was broad but mechanically consistent once `content.kind` changed in the same branch.
- The old `card` nav assertions were easy to spot because reducer tests failed immediately.
- `apps/apps-browser` TypeScript validation stayed green after the runtime-debug payload rename.
- `os-launcher`, `inventory`, and `sqlite` all validated cleanly after their launcher payloads switched to `surface`.

What needed cleanup:

- A handful of stories/tests still passed `stack=` to `DesktopShell` or used half-renamed locals from an earlier mechanical replace. I fixed those surgically instead of doing another repo-wide replacement.
- The Kanban VM launcher still had a few stale `cardId` property references in its demo metadata path. That did not break the targeted tests, but it was a latent bug, so I fixed it before cutting the commit.

### Commits

- `go-go-os-frontend` `e042f41` — `Rename desktop and runtime shell state to bundle/surface terminology`
- `go-go-app-inventory` `d67feaf` — `Rename inventory launcher stack/card paths to bundle/surface`
- `go-go-app-sqlite` `aca1074` — `Fix sqlite redux toolkit test stub`
- `go-go-app-sqlite` `30caa5d` — `Rename sqlite launcher stack/card paths to bundle/surface`
- `go-go-app-arc-agi-3` `eaafe5d` — `Rename ARC launcher stack/card paths to bundle/surface`
- `wesen-os` `a544136` — `Rename os-launcher runtime windows to bundle/surface`

### Result

At the end of Slice 7, the runtime core and desktop/windowing shell now speak the same vocabulary:

- bundles
- surfaces
- packages
- surface types

The branch no longer preserves the old `content.kind === 'card'` path, which was the right call for keeping the cutover simple.

## Step 11: Align authored VM navigation and prompt/docs wording

Once Slice 7 landed, I did a narrower audit of the still-authored VM sources and prompt docs. That exposed a real mismatch:

- the runtime and desktop shell now route `nav.go` using `payload.surfaceId`
- but some authored VM surfaces were still dispatching `payload.cardId`

That meant the rename was not fully carried through at the authoring layer yet. This was not just terminology debt. It was an actual behavior bug in any VM surface that still emitted the old payload shape.

### What I changed

In authored VM sources:

- `apps/os-launcher/src/domain/vm/10-home.vm.js`
- inventory VM sources under `apps/inventory/src/domain/vm/cards/*.vm.js`
- shared runtime host nav fixture `CardSessionHost.nav.vm.js`

I changed:

- `args.cardId` -> `args.surfaceId`
- `payload: { cardId: ... }` -> `payload: { surfaceId: ... }`

Then I regenerated `vmmeta` for:

- `os-launcher`
- `inventory`

That ensured the stored source metadata and extracted docs now match the actual runtime contract instead of preserving stale examples.

I also updated the authoring and package docs:

- `runtime-card-policy.md` now talks about runtime surfaces and uses `nav.go { surfaceId }`
- `inventory-pack.docs.vm.js` now describes `ui.card.v1` as a UI runtime package for surfaces rather than “UI Card Runtime Pack”
- `kanban-pack.docs.vm.js` now refers to render functions for runtime surfaces
- `pluginBundle.authoring.d.ts` now names the first `defineRuntimeSurface` parameter `surfaceId`

### Commands and validation

Commands run:

```bash
cd apps/os-launcher
npm run vmmeta:generate
npm test -- --run src/domain/pluginBundle.test.ts

cd workspace-links/go-go-app-inventory/apps/inventory
npm run vmmeta:generate
npm run typecheck
npm test -- --run src/launcher/renderInventoryApp.chat.test.tsx

cd workspace-links/go-go-os-frontend
npx vitest run packages/hypercard-runtime/src/__tests__/runtime-sessions.test.ts
```

What worked:

- The authored-source rename was mechanically simple once the earlier bundle/surface cutover existed.
- Regenerating `vmmeta` immediately surfaced whether the source/docs wording changes were actually reflected in the generated metadata.
- The inventory chat render test remained green, which was important because it exercises the artifact/runtime prompt path.

What remains:

- Some internal debug/editor/artifact structures still use `runtimeCardId` and similar field names. Those are part of the remaining Slice 8/9 cleanup, not this checkpoint.
- The prompt file is still named `runtime-card-policy.md`; I only updated its content in this pass.

### Commits

- `go-go-os-frontend` `9be1afd` — `Update runtime nav fixtures to use surface ids`
- `go-go-app-inventory` `a36f99d` — `Align inventory surfaces and prompt docs with surface nav`
- `wesen-os` `d5f8a27` — `Align os-launcher Kanban sources with surface navigation`

- `cardId` -> `surfaceId`
- `cards` -> `surfaces`
- `cardPacks` -> `surfaceTypes`
- `initialCardState` -> `initialSurfaceState`

In `runtimeService.ts` I renamed:

- `QuickJSCardRuntimeService` -> `QuickJSRuntimeService`
- `loadStackBundle(...)` -> `loadRuntimeBundle(...)`
- `renderCard(...)` -> `renderRuntimeSurface(...)`
- `eventCard(...)` -> `eventRuntimeSurface(...)`
- `defineCard(...)` -> `defineRuntimeSurface(...)`
- `defineCardRender(...)` -> `defineRuntimeSurfaceRender(...)`
- `defineCardHandler(...)` -> `defineRuntimeSurfaceHandler(...)`

The service now calls `globalThis.__runtimeBundleHost.*` and expects bundle metadata with `surfaces`, `surfaceTypes`, and `initialSurfaceState`.

### What changed in the VM bootstrap

In `stack-bootstrap.vm.js` I renamed the public authoring globals in place:

- `defineStackBundle(...)` -> `defineRuntimeBundle(...)`
- `defineCard(...)` -> `defineRuntimeSurface(...)`
- `defineCardRender(...)` -> `defineRuntimeSurfaceRender(...)`
- `defineCardHandler(...)` -> `defineRuntimeSurfaceHandler(...)`
- `__stackHost` -> `__runtimeBundleHost`

I updated the bootstrap metadata fields to:

- `surfaces`
- `surfaceTypes`
- `initialSurfaceState`

I also fixed a subtle recursion trap introduced by the rename. Once the host object methods and the outer helper functions had the same new names, it became too easy to recurse into the object methods instead of the outer helpers. I avoided that by renaming the outer helpers to:

- `defineRuntimeBundleImpl`
- `defineRuntimeSurfaceImpl`
- `defineRuntimeSurfaceRenderImpl`
- `defineRuntimeSurfaceHandlerImpl`

and then wiring both the globals and `__runtimeBundleHost` methods to those implementations explicitly.

### What changed in built-in sources and generators

I updated the touched built-in VM sources in one cut so the workspace would not carry both authoring vocabularies:

- `os-launcher`
- `inventory`
- `sqlite`
- `arc-agi-player`
- first-party demo/plugin bundles inside `go-go-os-frontend`

I then updated `go-go-os-backend/pkg/vmmeta` so the generator now expects `defineRuntimeSurface(...)` instead of `defineCard(...)`, and regenerated `vmmeta` outputs for:

- `apps/os-launcher`
- `apps/inventory`

### Validation commands

Commands run:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher
npm run vmmeta:generate

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory
npm run vmmeta:generate

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-backend
go test ./pkg/vmmeta ./cmd/go-go-os-backend

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npx vitest run \
  packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts \
  packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.rerender.test.tsx \
  packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.test.tsx \
  packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.test.tsx

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm run typecheck -w packages/hypercard-runtime

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher
npm test -- --run src/domain/pluginBundle.test.ts

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory
npm test -- --run src/domain/pluginBundle.test.ts
```

All of those passed after one small follow-up fix.

### What failed first

The first `runtimeService.integration.test.ts` run failed one assertion because the renamed code still threw:

- `Unknown runtime pack: ...`

while the renamed test expected:

- `unknown runtime surface type`

That came from the bootstrap error message in `createPackHelpers(...)`. I updated the string to `Unknown runtime surface type: ...`, reran the runtime test sweep, and the suite passed cleanly.

### Commits

I split the cutover into repo-local commits that match the affected layers:

- `go-go-os-frontend` `02ad2ad` — `Rename runtime service and VM authoring to bundle/surface terms`
- `go-go-os-backend` `091e56f` — `Update vmmeta for runtime surface authoring`
- `go-go-app-inventory` `6da5f43` — `Rename inventory VM bundle authoring to runtime surfaces`
- `go-go-app-arc-agi-3` `3dd7f8f` — `Rename ARC demo bundle authoring to runtime surfaces`
- `go-go-app-sqlite` `f90b945` — `Rename SQLite VM authoring to runtime surfaces`
- `wesen-os` `e0d20e8` — `Rename os-launcher bundle authoring to runtime surfaces`

### What this unlocked

- The runtime transport layer now speaks in terms of bundles and surfaces instead of cards.
- The VM authoring API now speaks in terms of bundles and surfaces instead of cards.
- `vmmeta` now parses runtime-surface authoring directly.
- The next slice can introduce explicit `RuntimePackage` installation without still carrying old runtime transport nouns underneath it.

## Step 10: Introduce explicit runtime packages and bundle-declared package installation

Slice 4 is the first part of APP-23 that changes architecture rather than only vocabulary. Up to this point, the runtime still *implicitly* assumed that `ui` and `kanban` existed inside the VM bootstrap. That contradicted the APP-23 model, because `RuntimePackage` was supposed to be an explicit installable capability bundle rather than a hardcoded bootstrap special case.

### The design decision I implemented

I chose the stricter version of the model:

- stacks declare `plugin.packageIds`
- bundles declare `packageIds`
- runtime session creation installs those packages before evaluating bundle code
- bundle metadata must exactly match the installed package ids

I kept the “exact match” rule rather than weakening it to a subset check. That means a bundle that only declares `['ui']` cannot quietly receive `kanban` helpers as a side effect of session setup. If a bundle wants `kanban`, it must say so.

### What changed in `hypercard-runtime`

I added a new runtime package layer under:

- `packages/hypercard-runtime/src/runtime-packages/`

That includes:

- `RuntimePackageDefinition`
- `RuntimePackageRegistry`
- built-in `ui` package prelude
- built-in `kanban` package prelude

The two package preludes now own the VM-side API installation:

- `ui.package.vm.js`
- `kanban.package.vm.js`

Those files install their APIs through:

- `globalThis.registerRuntimePackageApi(packageId, exports)`

The bootstrap no longer hardcodes `__ui` and `__widgets` as privileged one-off globals. Instead it now:

- keeps a runtime package state object
- merges installed package exports into that state
- exposes those merged APIs to bundle factories
- records `packageIds` in bundle metadata

That means the bootstrap finally behaves like a generic runtime-package host instead of a hand-built switch over `ui.card.v1` and `kanban.v1`.

### What changed in the runtime service

In `runtimeService.ts` I added:

- package installation before bundle evaluation
- dependency-aware install ordering
- exact-match validation between:
  - installed package ids
  - bundle-declared package ids

I also added host-side surface-type validation in `defineRuntimeSurface(...)`. That mattered because once package installation became explicit, the old integration test that expected an “unknown surface type” failure no longer failed naturally. The right place to enforce that is at the host runtime-service layer, since surface types are host-side contracts.

### What changed in stacks and bundles

I added `packageIds` to `PluginRuntimeStackConfig` and updated the touched stacks:

- `os-launcher` -> `['ui', 'kanban']`
- `inventory` -> `['ui']`
- `sqlite` -> `['ui']`
- `arc-agi-player` -> `['ui']`
- `book-tracker-debug` -> `['ui']`
- `crm` -> `['ui']`
- `todo` -> `['ui']`
- `hypercard-tools` -> `['ui']`

I also updated the corresponding built-in bundle sources so they declare matching `packageIds` in `defineRuntimeBundle(...)`.

That includes the VM fixtures and runtime-host test fixtures, because the stricter package declaration rule needs to be true everywhere, not just in the main app bundles.

### What I deliberately did not mark complete yet

I did **not** check off Slice 5. This slice enforces the package/bundle boundary, but it does not yet fully audit bundle-local helpers versus reusable package helpers.

What is true now:

- reusable public VM DSLs live in runtime package preludes
- app-specific helper composition still lives in bundle-local code

What is still left for Slice 5:

- a full audit of `00-runtimePrelude.vm.js`
- deciding whether any remaining helper should become package-level API
- documenting the separation rule more broadly across affected bundles

### Validation commands

Commands run:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npx vitest run \
  packages/hypercard-runtime/src/runtime-packages/runtimePackageRegistry.test.ts \
  packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts \
  packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.rerender.test.tsx \
  packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.test.tsx \
  packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.test.tsx \
  packages/hypercard-runtime/src/hypercard/debug/runtimeDebugRegistry.test.tsx

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npx vitest run \
  packages/engine/src/components/shell/windowing/windowContentAdapter.test.ts \
  packages/engine/src/components/shell/windowing/DesktopShell.contextMenu.test.tsx

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm run typecheck -w packages/hypercard-runtime

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher
npm test -- --run src/domain/pluginBundle.test.ts

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory
npm test -- --run src/domain/pluginBundle.test.ts
```

All of those passed.

I also ran:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os
node node_modules/typescript/bin/tsc --noEmit -p apps/os-launcher/tsconfig.json
```

That failed, but the errors were the same pre-existing linked `rich-widgets` state/type issues in `node_modules/@hypercard/rich-widgets/...`, not failures caused by the runtime-package slice. I left that as an unrelated existing validation problem.

### What failed during implementation

The first package-registry runtime test run exposed two design mismatches:

1. The dynamic `kanban.v1` integration test was loading the `inventory` bundle with installed packages `['ui', 'kanban']`, but `inventory-stack.vm.js` still declared only `['ui']`. Under the new exact-match rule, that is a real error, not a test nuisance.
2. The old “unknown runtime surface type” test stopped failing naturally because package installation and surface-type validation were no longer coupled inside the bootstrap.

I fixed those by:

- moving the dynamic kanban test onto a bundle that actually declares `['ui', 'kanban']`
- adding explicit host-side surface-type validation in `defineRuntimeSurface(...)`
- adding a new direct mismatch test for the bundle/package contract

That made the package slice behavior explicit instead of accidental.

### Commits

I split the Slice 4 code into these repo-local commits:

- `go-go-os-frontend` `3bfff72` — `Add explicit runtime package installation`
- `go-go-app-inventory` `dba9519` — `Declare inventory runtime packages explicitly`
- `go-go-app-sqlite` `5c467e2` — `Declare SQLite runtime packages explicitly`
- `go-go-app-arc-agi-3` `f1eb352` — `Declare ARC runtime packages explicitly`
- `wesen-os` `8b9718a` — `Declare os-launcher runtime packages explicitly`

### What this unlocked

- `RuntimePackage` is now real code, not just APP-23 design prose.
- runtime-session setup installs packages explicitly before bundle evaluation.
- bundle/package mismatches now fail fast instead of silently inheriting more DSL than declared.
- later slices can rename hosts and desktop metadata on top of a real package model rather than the old implicit bootstrap special cases.

## Step 11: Audit bundle-local preludes and make the package boundary legible in source

After Slice 4, the runtime had a real package registry, but the source layout in `os-launcher` and `inventory` still made it easy to miss the boundary. Both bundles had a `00-runtimePrelude.vm.js` file, and without reading the new runtime package code carefully it would still be easy for an intern to assume “this is where the DSL lives.”

So Slice 5 was not about changing behavior. It was about making the code organization say the same thing the architecture now says.

### What I audited

I reread:

- `apps/os-launcher/src/domain/vm/00-runtimePrelude.vm.js`
- `apps/os-launcher/src/domain/pluginBundle.ts`
- `workspace-links/go-go-app-inventory/apps/inventory/src/domain/vm/00-runtimePrelude.vm.js`
- `workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.ts`

The result of that audit was:

- the remaining helpers in those preludes are bundle-local
- they are mostly:
  - seed data
  - selectors
  - state cloning/materialization helpers
  - local composition helpers for those specific demo bundles
- they are **not** hidden public DSL namespaces

That meant there was no additional helper that should have been moved into a runtime package during this slice. The actual public DSL had already moved into the runtime package preludes in Slice 4.

### What I changed

I made two changes to make that boundary explicit:

1. I added leading comments in the preludes:

- `os-launcher` prelude now says it contains bundle-local Kanban demo helpers and that public DSL belongs to runtime packages
- `inventory` prelude now says it contains bundle-local Inventory helpers and that public DSL belongs to runtime packages

2. I restructured bundle assembly in `pluginBundle.ts`:

- `os-launcher` now assembles:
  - bundle-local prelude
  - bundle-local docs
  - bundle-local surfaces
- `inventory` now assembles:
  - bundle-local prelude/docs
  - bundle-local surfaces

That makes the source read like:

- runtime package installs shared DSL
- bundle prelude installs app-local helpers
- cards/surfaces are authored on top of both

which is exactly the model APP-23 is trying to establish.

### Validation commands

Commands run:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher
npm test -- --run src/domain/pluginBundle.test.ts

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory
npm test -- --run src/domain/pluginBundle.test.ts
```

Both passed after the assembly cleanup.

### Commits

- `go-go-app-inventory` `ae6ecb4` — `Clarify inventory bundle-local runtime helpers`
- `wesen-os` `f38037a` — `Clarify os-launcher bundle-local runtime helpers`

### Why I marked Slice 5 complete

The task wording included “move any reusable package-level helper that should be available broadly out of bundle preludes and into package installation.” The audit result here was that no additional helper met that bar once Slice 4 had already extracted the public VM DSL into runtime package preludes.

So Slice 5 was completed by:

- auditing the remaining helpers
- confirming they are app-local
- making that distinction visible in source layout and comments

instead of inventing another package API just to satisfy the task mechanically.

## Step 12: Rename the live host component and injected-definition registry to surface nouns

After Slice 5, the runtime still had one big host-layer inconsistency: the static/runtime transport had already moved to `RuntimeBundle`, `RuntimeSurface`, and `RuntimeSurfaceType`, but the React host and hot-injection registry were still named around “card”.

That mismatch showed up in exactly the places the user touches most:

- launcher modules still imported `PluginCardSessionHost`
- the debug/editor code still registered ad-hoc snippets through `runtimeCardRegistry`
- test failures and runtime logs still talked about “runtime cards” even after the lower-level API no longer did

So I took the first half of Slice 6 as a direct cutover:

- `PluginCardSessionHost` -> `RuntimeSurfaceSessionHost`
- `runtimeCardRegistry` -> `runtimeSurfaceRegistry`
- local host variables like `currentCardId` / `cardState` -> `currentSurfaceId` / `surfaceState`

I explicitly did **not** try to rename the Redux slice or the runtime-card editor provenance helpers in the same checkpoint. Those are still part of Slice 6, but they touch different failure domains and would have made this checkpoint harder to validate cleanly.

### Files changed

Core runtime host / registry:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/CardSessionHost.stories.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.test.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/index.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/index.ts`

Direct runtime consumers updated to import the new host symbol:

- `apps/os-launcher/src/app/kanbanVmModule.tsx`
- `apps/os-launcher/src/app/kanbanVmModule.test.tsx`
- `workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.tsx`
- `workspace-links/go-go-app-sqlite/apps/sqlite/src/launcher/module.tsx`
- `workspace-links/go-go-app-sqlite/apps/sqlite/src/launcher/module.test.tsx`
- `workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/launcher/module.tsx`
- `workspace-links/go-go-os-frontend/apps/book-tracker-debug/src/launcher/module.tsx`
- `workspace-links/go-go-os-frontend/apps/crm/src/launcher/module.tsx`
- `workspace-links/go-go-os-frontend/apps/hypercard-tools/src/launcher/module.tsx`
- `workspace-links/go-go-os-frontend/apps/todo/src/launcher/module.tsx`

Support code that references the injected-definition registry:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.stories.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/CodeEditorWindow.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/CodeEditorWindow.stories.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/editorLaunch.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.test.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.test.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.test.ts`

### What broke during the first validation pass

The first targeted validation run exposed three concrete problems:

1. `runtimeSurfaceRegistry.test.ts` still imported `injectPendingCards` instead of `injectPendingRuntimeSurfaces`.
2. The test mocks still implemented `defineCard(...)` instead of `defineRuntimeSurface(...)`.
3. `RuntimeSurfaceSessionHost.tsx` still referenced `getPendingRuntimeSurfaces()` in the render path after I temporarily removed the import while cleaning up the top of the file.

That combination caused:

- two `ReferenceError` failures in the registry test file,
- a `service.defineRuntimeSurface is not a function` failure in the report-helper path,
- and both host rerender tests timing out waiting for `Count: 0` because the host component hit the missing-import path before it could render the mock tree.

I fixed those directly in source rather than weakening the tests:

- updated the registry tests to use `injectPendingRuntimeSurfaces`
- updated the mocks to implement `defineRuntimeSurface`
- restored the `getPendingRuntimeSurfaces` import in the host

### Validation commands

Successful commands:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npx vitest run \
  packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.test.ts \
  packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx \
  packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.test.tsx \
  packages/hypercard-runtime/src/hypercard/debug/runtimeDebugRegistry.test.tsx \
  packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.test.tsx \
  packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm run typecheck -w packages/hypercard-runtime

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher
npm test -- --run src/app/kanbanVmModule.test.tsx

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory
node ../../../../node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
```

Those all passed.

Commands that still fail for unrelated existing reasons:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-sqlite/apps/sqlite
npm test -- --run src/launcher/module.test.tsx
```

This still fails before reaching the host rename because `src/domain/hypercard/runtimeState.ts` trips an existing `createAction is not a function` runtime import problem.

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player
node ../../../../node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
```

This still fails with the known linked-workspace `TS6059` rootDir errors and missing `?raw` module declarations. The new host name shows up in those diagnostics because ARC imports the updated package entrypoint, but the failure mode itself is the same existing workspace-configuration problem tracked elsewhere.

### Commits

- `go-go-os-frontend` `4e65f33` — `Rename runtime host and registry to surfaces`
- `wesen-os` `588d09e` — `Update os-launcher for runtime surface host rename`
- `go-go-app-inventory` `757b380` — `Update inventory runtime surface host import`
- `go-go-app-sqlite` `1f8a572` — `Update sqlite runtime surface host import`
- `go-go-app-arc-agi-3` `aec8245` — `Update ARC runtime surface host import`

### What is still left in Slice 6

This checkpoint did **not** finish Slice 6. Remaining work:

- rename the `pluginCardRuntime` Redux slice/selectors/actions where they still leak runtime-card nouns
- rename the editor provenance helpers in `runtimeCardRef.ts` and its payload/instance-id helpers
- decide how much of the debug/editor UI should stay user-facing “Stacks & Cards” language versus runtime-core “surface/bundle” language

So this checkpoint is “host + registry renamed and validated,” not “all runtime-card terminology removed from the entire host/debug/editor layer.”

## Step 13: Finish Slice 6 by renaming the runtime session store and editor provenance helpers

After the first Slice 6 checkpoint, the remaining inconsistency was obvious:

- the host component was `RuntimeSurfaceSessionHost`
- the registry was `runtimeSurfaceRegistry`
- but the Redux feature was still `pluginCardRuntime`
- and the editor provenance helpers were still `runtimeCardRef`

That would have left the system half-renamed in exactly the places where downstream apps import package APIs. Since the user explicitly said not to preserve compatibility layers, I finished the slice with one more direct cutover rather than introducing transitional aliases.

### What changed

I renamed the runtime session/store feature:

- `features/pluginCardRuntime` -> `features/runtimeSessions`
- `pluginCardRuntimeSlice.ts` -> `runtimeSessionsSlice.ts`
- `pluginCardRuntimeReducer` -> `runtimeSessionsReducer`
- `PluginCardRuntimeState` -> `RuntimeSessionsState`
- `PluginRuntimeSession` -> `RuntimeSessionRecord`
- `selectPluginCardRuntimeState` -> `selectRuntimeSessionsState`
- `selectRuntimeCardState` -> `selectRuntimeSurfaceState`
- root state key `pluginCardRuntime` -> `runtimeSessions`
- per-session draft bucket `cardState` -> `surfaceState`
- action payload `initialCardState` -> `initialSurfaceState`

I also renamed the editor provenance helpers:

- `runtimeCardRef.ts` -> `runtimeSurfaceRef.ts`
- `RuntimeCardRef` -> `RuntimeSurfaceRef`
- `encodeRuntimeCardEditorInstanceId(...)` -> `encodeRuntimeSurfaceEditorInstanceId(...)`
- `decodeRuntimeCardEditorInstanceId(...)` -> `decodeRuntimeSurfaceEditorInstanceId(...)`
- `buildRuntimeCardEditorAppKey(...)` -> `buildRuntimeSurfaceEditorAppKey(...)`
- `RuntimeSurfaceRef` now carries `surfaceId` instead of `cardId`

That rename propagated into:

- `CodeEditorWindow`
- `editorLaunch.ts`
- `RuntimeCardDebugWindow`
- `hypercard-tools`
- `apps-browser` store setup
- ARC launcher/store/bridge state access

### Files changed

Core Redux/session store:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/runtimeSessions/capabilityPolicy.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/runtimeSessions/index.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/runtimeSessions/runtimeSessionsSlice.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/runtimeSessions/selectors.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/app/createAppStore.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/pluginIntentRouting.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`

Editor provenance helpers:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/runtimeSurfaceRef.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/runtimeSurfaceRef.test.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/editorLaunch.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/CodeEditorWindow.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/CodeEditorWindow.stories.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx`
- `workspace-links/go-go-os-frontend/apps/hypercard-tools/src/launcher/module.tsx`

Direct store consumers outside `hypercard-runtime`:

- `workspace-links/go-go-os-frontend/apps/apps-browser/src/app/store.ts`
- `workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/app/store.ts`
- `workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/bridge/middleware.ts`

### What broke during implementation

The main issue here was one of those predictable “rename propagates almost everywhere except one last literal” problems:

1. After the reducer/editor cutover, the targeted Vitest suite passed.
2. `hypercard-runtime` TypeScript build still failed because `hypercardCard.tsx` constructed a `RuntimeSurfaceRef` with `{ ownerAppId, cardId }` instead of `{ ownerAppId, surfaceId }`.

That was a real type-safety win from the rename, not busywork. The new `RuntimeSurfaceRef` type caught the last stale callsite immediately.

I patched that one remaining callsite and reran the tests/typecheck.

There was also one accidental string replacement in SQLite demo code:

- `hypercardState(...)` had been mechanically renamed to `hypersurfaceState(...)`

That helper was unrelated to the runtime-session slice, so I reverted it to keep the SQLite bundle readable and to avoid mixing domain-local naming churn into the runtime vocabulary work.

### Validation commands

Successful commands for this checkpoint:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npx vitest run \
  packages/hypercard-runtime/src/__tests__/runtime-sessions.test.ts \
  packages/hypercard-runtime/src/__tests__/plugin-intent-routing.test.ts \
  packages/hypercard-runtime/src/hypercard/editor/runtimeSurfaceRef.test.ts \
  packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.test.tsx \
  packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx \
  packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.test.ts \
  packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm run typecheck -w packages/hypercard-runtime

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm exec tsc -- --noEmit -p apps/apps-browser/tsconfig.json

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher
npm test -- --run src/app/kanbanVmModule.test.tsx

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory
node ../../../../node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
```

Those all passed.

Existing unrelated failures that still remain outside this slice:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-sqlite/apps/sqlite
npm test -- --run src/launcher/module.test.tsx
```

This still fails on the existing `createAction is not a function` issue in SQLite runtime-state code.

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player
node ../../../../node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
```

This still fails on the long-standing linked-workspace `TS6059` / `?raw` module resolution problem. The second Slice 6 checkpoint touched ARC’s store key, so I kept checking it, but the failure class did not change.

### Commits

- `go-go-os-frontend` `0a09895` — `Rename runtime session store and editor refs`
- `go-go-app-arc-agi-3` `052cacf` — `Rename ARC runtime session store key`

### Why Slice 6 is now complete

At this point the remaining user-facing/debug names like `RuntimeCardDebugWindow` and `Stacks & Cards` are mostly UI/tooling labels, not runtime-core boundary names. The actual runtime host/store/editor path is now on the final runtime vocabulary:

- `RuntimeSurfaceSessionHost`
- `runtimeSurfaceRegistry`
- `runtimeSessions`
- `surfaceState`
- `RuntimeSurfaceRef`
- `surfaceId`

That is enough to mark Slice 6 complete and move on to the larger desktop/windowing rename in Slice 7.

## Step 12: Rename artifact/debug metadata from runtime-card to runtime-surface

The next useful cut was not another large transport rename. It was the smaller but high-friction boundary where old nouns were still visible in three places at once:

- artifact projection/state
- runtime surface injection reporting
- the debug/editor windows that inspect and edit runtime-authored code

Even after the earlier slices, this layer still used fields like:

- `runtimeCardId`
- `runtimeCardCode`
- `injectedCardIds`
- failure payloads keyed by `cardId`

That was enough to keep the mental model muddy in the debugger, and it also meant the artifact state shape no longer matched the rest of the runtime vocabulary.

### What I changed

In `go-go-os-frontend` I updated the artifact pipeline:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts`

Those files now use:

- `runtimeSurfaceId`
- `runtimeSurfaceCode`
- `injectedSurfaceIds`
- failure entries keyed by `surfaceId`

I kept the incoming artifact envelope parsing on the literal `data.card.id` / `data.card.code` shape because that is still the wire format of the HyperCard artifact envelope. The rename here is about the host/runtime state model, not about changing the card-shaped artifact payload inside the same slice.

I also cleaned up the injected-definition registry and consumers:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/editorLaunch.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx`

The registry had one bad partial-edit state during the work:

- it was briefly calling `defineRuntimeSurface(...)` twice, once with `def.cardId` and once with `def.surfaceId`

That happened because I started the rename in stages and left a stale pre-rename line in the file. I removed the old call so the registry injects each surface exactly once.

Finally, I updated the shared debugger UI:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.stories.tsx`

The window component name is still `RuntimeCardDebugWindow` for now, but its internal state and table rendering now speak in surface terms:

- artifact rows show `runtimeSurfaceId`
- registry rows use `surface.surfaceId`
- session lookup uses `sessionCurrentSurfaceIds`
- built-in source lookup uses a `surfaceSource(...)` helper instead of `cardSource(...)`

### One bug caught by the focused tests

This slice produced one real regression in:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx`

I had already renamed:

- `cardCode` -> `surfaceCode`
- `hasCardCode` -> `hasSurfaceCode`

but left one stale local reference:

```ts
const canEditCode = hasRuntimeSurface && hasCardCode && ...
```

That broke both the renderer tests and `hypercard-runtime` typecheck with:

```text
ReferenceError: hasCardCode is not defined
TS2304: Cannot find name 'hasCardCode'
```

I fixed that one remaining local reference and reran the targeted suite.

### Inventory follow-through

Because inventory host tests assert the artifact shape after projection, I updated:

- `workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.chat.test.tsx`

to expect `runtimeSurfaceId` instead of `runtimeCardId`.

This was a good signal that the rename is now crossing app boundaries cleanly instead of being trapped inside `hypercard-runtime`.

### Validation commands

Successful commands for this checkpoint:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npx vitest run \
  packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.test.ts \
  packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.test.ts \
  packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.test.ts \
  packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.test.ts \
  packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.renderer.test.tsx \
  packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.test.tsx

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm run typecheck -w packages/hypercard-runtime

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory
npm test -- --run src/launcher/renderInventoryApp.chat.test.tsx
```

All of those passed.

### Commits

Pending at the time of this diary entry:

- `go-go-os-frontend` artifact/debug/editor rename checkpoint
- `go-go-app-inventory` inventory projection assertion update

### Why this matters

This slice finally lines up the terminology users see in the runtime debugger with the terminology the runtime core is using internally:

- runtime artifact projection talks about surfaces
- the injection registry talks about surfaces
- the debug window talks about surfaces
- editor launch references talk about surfaces

That leaves the remaining old nouns mostly in UI labels (`Stacks & Cards`) and a few story/test-local variable names, which is the right place to pause before the next slice.

## Step 13: Rename the shared debug window symbol to `RuntimeSurfaceDebugWindow`

After the metadata checkpoint, the main runtime-core noun mismatch left in `hypercard-runtime` was the debug window symbol itself:

- `RuntimeCardDebugWindow`

At that point the component was already rendering bundles, surfaces, and runtime-surface metadata, so keeping the old symbol name around would have left the public API lagging behind the implementation.

### What I changed

I renamed the component file set in `go-go-os-frontend`:

- `packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx`
  -> `packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx`
- `packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.test.tsx`
  -> `packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.test.tsx`
- `packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.stories.tsx`
  -> `packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.stories.tsx`

Then I updated:

- `packages/hypercard-runtime/src/hypercard/debug/runtimeDebugApp.tsx`
- `packages/hypercard-runtime/src/hypercard/index.ts`

so the runtime debug app and package barrel now export/use `RuntimeSurfaceDebugWindow`.

I also updated the component-local symbol names:

- `RuntimeCardDebugWindowProps` -> `RuntimeSurfaceDebugWindowProps`
- story title to `HypercardRuntime/Debug/RuntimeSurfaceDebugWindow`
- test description to `RuntimeSurfaceDebugWindow`

### Why this was a separate checkpoint

I kept this rename separate from the earlier artifact/debug metadata sweep because it changes:

- file paths
- public exports
- story/test entrypoints

Those are the kinds of moves that are easy to validate in isolation and easy to revert if they accidentally leak across unrelated runtime code. Doing them as a small follow-up keeps the branch easier to review.

### Validation commands

Successful commands for this checkpoint:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npx vitest run \
  packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.test.tsx \
  packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.test.ts \
  packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.renderer.test.tsx

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm run typecheck -w packages/hypercard-runtime
```

Those both passed.

### Commits

Pending at the time of this diary entry:

- `go-go-os-frontend` debug-window symbol rename checkpoint

### Result

At this point the runtime-core public debug/export path now matches the rest of the renamed runtime model:

- `RuntimeSurfaceSessionHost`
- `runtimeSurfaceRegistry`
- `RuntimeSurfaceRef`
- `RuntimeSurfaceDebugWindow`

That leaves mostly UI labels and a few story-local variable names, not structural runtime-core nouns.

## Step 14: Clean up first-party stories/tests/examples that still taught `card`

After the main runtime-core renames, there were still a handful of places that were not technically broken but were still teaching the wrong vocabulary to future readers:

- Storybook examples
- targeted test descriptions
- docs-browser mount fixtures

These are easy to ignore because they do not usually break builds. They are also exactly the places new contributors copy from, so they are worth cleaning once the real APIs stabilize.

### What I changed

In `go-go-os-frontend`:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/RuntimeMutation.stories.tsx`
  - `cards` -> `surfaces`
  - `activeCardId` -> `activeSurfaceId`
  - local helper args now use `surfaceId`
  - visible labels now say `Surfaces` and `Active surface`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx`
  - renamed the mocked render target parameter from `_cardId` to `_surfaceId`
- `workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsMountAdapters.test.ts`
  - fixture source now uses `defineRuntimeSurface(...)`
  - fixture package title/category now describe a surface type instead of a runtime pack
- `workspace-links/go-go-os-frontend/apps/apps-browser/src/components/BrowserDetailPanel.test.tsx`
  - summary text now says `Mounted runtime surface docs.`

In `wesen-os`:

- `apps/os-launcher/src/domain/pluginBundle.test.ts`
  - description now says `runtime surfaces`
- `apps/os-launcher/src/__tests__/launcherHost.test.tsx`
  - editor-window test description now says `runtime surface refs`

### Validation

Successful commands:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npx vitest run \
  packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx \
  apps/apps-browser/src/domain/docsMountAdapters.test.ts \
  apps/apps-browser/src/components/BrowserDetailPanel.test.tsx
```

That passed.

For `os-launcher`, I ran:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher
npm test -- --run src/domain/pluginBundle.test.ts src/__tests__/launcherHost.test.tsx
```

Observed behavior:

- `src/domain/pluginBundle.test.ts` completed and passed
- the Vitest process then stalled without printing a result for `launcherHost.test.tsx`

I also tried the launcher-host test in isolation:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher
npx vitest run src/__tests__/launcherHost.test.tsx
```

and hit the same stall: process starts, no failure output, no clean exit.

Because this checkpoint only changed test descriptions in `os-launcher`, I treated that as existing test-runner noise rather than as a blocker for the vocabulary cleanup itself.

### Why this matters

This kind of cleanup is not glamorous, but it is how the direct-cutover rename becomes real:

- the runtime API changed
- the debugger changed
- the artifact state changed
- now the example/test layer stops reintroducing the old mental model

That still leaves broader repo docs and some app-local VM source helpers using `card` terms, but the first-party runtime-adjacent examples are now much less likely to mislead the next person touching this code.

## Step 15: Rename docs-browser runtime mounts from `pack/card` to `surface-type/surface`

The next structural place where the old model was still frozen into public API was the docs browser mount tree.

Before this step, runtime docs were mounted like:

- `/docs/objects/pack/kanban.v1/...`
- `/docs/objects/card/os-launcher/...`

Those paths were wrong in two different ways:

1. `kanban.v1` is not a runtime package; it is a runtime surface type.
2. The VM-authored things mounted per owner are runtime surfaces, not runtime cards.

That meant the mounted-object filesystem still taught the old architecture even after the runtime/session code had been renamed.

### What I changed

In `apps-browser`:

- `workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsMountAdapters.ts`
  - `createVmmetaPackDocsMount` -> `createVmmetaSurfaceTypeDocsMount`
  - `createVmmetaCardDocsMount` -> `createVmmetaSurfaceDocsMount`
  - canonical kinds changed from:
    - `pack` -> `surface-type`
    - `card` -> `surface`
  - helper names and local variables now use `surfaceType` / `surface`
- `workspace-links/go-go-os-frontend/apps/apps-browser/src/index.ts`
  - re-export names updated
- tests/stories updated:
  - `apps/apps-browser/src/domain/docsMountAdapters.test.ts`
  - `apps/apps-browser/src/domain/docsCatalogStore.test.ts`
  - `apps/apps-browser/src/components/BrowserDetailPanel.test.tsx`
  - `apps/apps-browser/src/components/BrowserDetailPanel.stories.tsx`

In `wesen-os`:

- `apps/os-launcher/src/app/registerAppsBrowserDocs.ts`
  - startup registration now uses:
    - `createVmmetaSurfaceTypeDocsMount(...)`
    - `createVmmetaSurfaceDocsMount(...)`

### Resulting path shape

After the cutover, the mounted runtime docs now live under:

```text
/docs/objects/surface-type/<surface-type-id>/<slug>
/docs/objects/surface/<owner>/<slug>
```

Examples:

```text
/docs/objects/surface-type/kanban.v1/overview
/docs/objects/surface-type/kanban.v1/widgets.kanban.page
/docs/objects/surface/os-launcher/kanbanIncidentCommand
/docs/objects/surface/inventory/home
```

That is much closer to the actual APP-23 model:

- runtime packages are installable capability bundles
- runtime surface types are render contracts like `kanban.v1`
- runtime surfaces are authored/renderable program units owned by a bundle/app

### Validation

Successful commands:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npx vitest run \
  apps/apps-browser/src/domain/docsMountAdapters.test.ts \
  apps/apps-browser/src/domain/docsCatalogStore.test.ts \
  apps/apps-browser/src/components/BrowserDetailPanel.test.tsx

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm exec tsc -- --noEmit -p apps/apps-browser/tsconfig.json

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher
npm test -- --run src/__tests__/launcherHost.test.tsx
```

All of those passed.

### Why this mattered

This is the first place where the docs browser’s mounted-object tree itself now reflects the new runtime model instead of just paraphrasing it in prose.

That matters because the docs browser is effectively a Plan 9-like namespace browser for runtime metadata. If the mount kinds are wrong there, every downstream tool built on top of that tree inherits the wrong ontology.

## Step 16: Prove built-in source display still works after the rename

There was one remaining open checkbox in Slice 9:

- verify that built-in source display still works after all the surface/bundle renames

The highest-value place to lock that down is the shared runtime debug window test, because that is where built-in surfaces surface their source-backed edit affordances.

### What I changed

I extended:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.test.tsx`

The test already covered one important behavior:

- only the actively running surface should appear in the session-actions row

I added a second assertion on top of the same render:

- built-in predefined surfaces with `meta.runtime.source` still produce `Edit` buttons

In the test fixture:

- `currentCard` has source metadata
- `cachedCard` has source metadata
- the session row should only expose the currently running `currentCard`

So the expected `Edit` button count is:

1. predefined `currentCard`
2. predefined `cachedCard`
3. session action for active `currentCard`

That yields a stable total of `3`.

### Validation

Successful commands:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npx vitest run packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.test.tsx

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm run typecheck -w packages/hypercard-runtime
```

Both passed.

### Why this closes Slice 9

At this point the runtime debug/editor/docs tooling slice is no longer just renamed internally. It is also behaviorally checked for the thing most likely to regress:

- source-backed editability of built-in runtime surfaces

That gives APP-23 a clean stop on the debugging/tooling side before moving on to the remaining app-local VM source vocabulary and broader repo docs.

## Step 17: Cut the remaining first-party VM bundles over from `cardId` navigation payloads to `surfaceId`

After the runtime/session and windowing renames landed, there was still one bad class of stale app code left behind:

- several first-party VM bundles were still dispatching `nav.go` with `{ cardId }`

That looked cosmetic at first glance, but it was not cosmetic anymore. The runtime host now interprets navigation through the renamed shape:

- `nav.go { surfaceId, param? }`

and the system-action router simply ignores `nav.go` payloads that still carry `cardId`.

### Why this mattered

I confirmed that in:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/pluginIntentRouting.ts`

That file now resolves:

- `action.payload.surfaceId`

for `nav.go`, and returns `null` if it is missing.

So any stale VM bundle still doing this:

```js
context.dispatch({ type: 'nav.go', payload: { cardId: 'browse' } });
```

would silently stop navigating after the runtime rename.

### Remaining stale bundles

The remaining offenders were:

- `workspace-links/go-go-app-sqlite/apps/sqlite/src/domain/pluginBundle.vm.js`
- `workspace-links/go-go-os-frontend/apps/todo/src/domain/pluginBundle.vm.js`
- `workspace-links/go-go-os-frontend/apps/book-tracker-debug/src/domain/pluginBundle.vm.js`
- `workspace-links/go-go-os-frontend/apps/crm/src/domain/pluginBundle.vm.js`
- `workspace-links/go-go-os-frontend/apps/hypercard-tools/src/domain/pluginBundle.vm.js`

### What I changed

Across those bundles, I updated the runtime-facing navigation contract consistently:

- helper args:
  - `cardId` -> `surfaceId`
- nav helpers:
  - `navigate(context, cardId, ...)` -> `navigate(context, surfaceId, ...)`
  - `goTo(context, cardId, ...)` -> `goTo(context, surfaceId, ...)`
- dispatched system actions:
  - `nav.go { cardId }` -> `nav.go { surfaceId }`
- handler lookups:
  - `asRecord(args).cardId` -> `asRecord(args).surfaceId`

This included user-facing demo control buttons in:

- SQLite
- Todo
- Book Tracker
- CRM
- Hypercard Tools

The scope here was intentionally narrow:

- do not redesign the bundles
- do not rename app-domain ids unrelated to the runtime contract
- just make the runtime navigation payloads match the new host boundary

### SQLite validation surfaced a second bug

While re-running SQLite as the most concrete signal app, I hit a separate failure in:

- `workspace-links/go-go-app-sqlite/apps/sqlite/src/domain/hypercard/runtimeState.test.ts`

The tests were failing like this:

```text
expected [] to have a length of 1 but got 0
expected undefined to be 'seed'
```

The launcher test itself was already passing, so this was not the bundle-navigation change.

I traced it to the local Vitest RTK stub:

- `workspace-links/go-go-app-sqlite/apps/sqlite/src/test/stubs/redux-toolkit.ts`

The stub had already been updated earlier to export `createAction`, but it still mishandled:

- `builder.addCase(sqliteHypercardQueryIntent, reducer)`

because it keyed `extraReducers` by:

- `String(type)`

which, for an action creator function, becomes the function source text rather than the action type.

The real RTK behavior is:

- action creators have a `.type`
- `addCase(actionCreator, ...)` resolves that `.type`

So I fixed the stub to:

- attach `.type` to `createAction(...)` results
- accept either a string or action creator in `addCase(...)`
- resolve function cases through `type.type`

### Validation

Successful commands:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-sqlite/apps/sqlite
npm test -- --run src/launcher/module.test.tsx src/domain/hypercard/runtimeState.test.ts
```

Result:

- `src/domain/hypercard/runtimeState.test.ts` passed
- `src/launcher/module.test.tsx` passed

I also ran a direct parse sanity check on every edited VM bundle:

```bash
node - <<'NODE'
const fs = require('fs');
const files = [
  '.../sqlite/pluginBundle.vm.js',
  '.../todo/pluginBundle.vm.js',
  '.../book-tracker-debug/pluginBundle.vm.js',
  '.../crm/pluginBundle.vm.js',
  '.../hypercard-tools/pluginBundle.vm.js',
];
for (const file of files) {
  new Function(fs.readFileSync(file, 'utf8'));
  console.log('OK', file);
}
NODE
```

All edited bundles parsed cleanly.

And I re-ran:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm exec tsc -- --noEmit -p apps/hypercard-tools/tsconfig.json
```

That also passed.

### Remaining noise

The broader app `tsc` runs for:

- `apps/todo`
- `apps/book-tracker-debug`
- `apps/crm`

still fail, but for a different, pre-existing reason:

```text
Object literal may only specify known properties, and 'stack' does not exist in type 'CardStoriesConfig'
```

Those failures come from Storybook config/types in the app story files, not from the `surfaceId` navigation edits.

### Why this step matters

This is the point where the runtime-core rename stopped being “mostly done but with stale app edges” and became behaviorally coherent across the remaining first-party VM bundles.

Before this step:

- some apps had already moved to `surfaceId`
- others were dispatching dead nav intents

After this step:

- the runtime host and the remaining first-party VM bundles agree on the same nav contract

That removes one of the last places where APP-23 could still fail at runtime even though the core rename had already landed.

## Step 18: Remove the last live-source `homeCard` / `__stackBundle` stragglers and separate them from historical docs debt

After the navigation sweep, I did the repo-wide residual search APP-23 calls for:

```bash
rg -n "renderCard\\(|eventCard\\(|defineCard\\(|CardStackDefinition|RuntimePack|homeCard|cardPacks" ...
```

The useful outcome from that pass was not “everything is done.” It was:

- most remaining hits are no longer active runtime code
- they are historical docs, archived tickets, or intentional current concepts like `RuntimePackage`

That made the remaining live-source cleanup finite.

### Live-source leftovers I found

The meaningful active-code stragglers were:

- `apps/os-launcher/src/domain/pluginBundle.ts`
  - raw import variable `homeCard`
- `workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.ts`
  - raw import variable `homeCard`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - internal mutable bundle variable `__stackBundle`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.renderer.test.tsx`
  - local helper named `renderCard(...)`

None of these were user-visible bugs. They were cleanup debt in live source that still taught the old model.

### What I changed

In bundle assembly:

- `homeCard` raw import variables became `homeSurface`

Files:

- `apps/os-launcher/src/domain/pluginBundle.ts`
- `workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.ts`

That keeps the bundle assembly source aligned with the new `homeSurface` metadata field we already use elsewhere.

In the VM bootstrap:

- internal mutable program storage changed from `__stackBundle` to `__runtimeBundle`

File:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`

I also aligned the fallback title string there from:

- `Untitled Stack`

to:

- `Untitled Bundle`

This matters because the bootstrap is one of the most central files in the whole runtime system. Leaving its private state named `__stackBundle` would keep leaking the old ontology into every future refactor.

In the timeline test:

- renamed local helper `renderCard(...)` to `renderEntity(...)`

File:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.renderer.test.tsx`

That is not architecturally deep, but it prevents APP-23’s own tests from reintroducing the old term at the callsite level.

### Validation

Successful commands:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npx vitest run \
  packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts \
  packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.renderer.test.tsx

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher
npm run vmmeta:generate
npm test -- --run src/domain/pluginBundle.test.ts

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory
npm run vmmeta:generate
npm test -- --run src/launcher/renderInventoryApp.chat.test.tsx
```

All of those passed.

### What remains after the search

After this cleanup, the remaining search hits divide into three categories:

1. Legitimate current concepts that should stay:
   - `RuntimePackage*`
2. Historical/internal docs that still need a deliberate docs sweep:
   - old guides under `workspace-links/go-go-os-frontend/docs`
   - older ticket docs under `ttmp/`
3. Intentionally preserved external artifact-envelope naming:
   - `hypercard.card.v2`
   - extractor/test names in Go inventory backend that still refer to “runtime card” at the artifact boundary

That is a much healthier place than earlier in the branch, because the search is no longer finding lots of live runtime-core code pretending to still be card/stack based.

### Why this step matters

The point of APP-23 is not only to make the runtime *behavior* use the new nouns. It is also to make the active implementation teach the new model to the next engineer.

At this point:

- live runtime code mostly speaks bundle/surface/package/surface-type
- the remaining old terms are increasingly concentrated in docs/backlog/history rather than in the running system

That means the branch is finally approaching the stage where the next APP-23 effort can focus on:

- public docs cleanup
- artifact-boundary naming decisions
- final repo search closure

instead of still finding fresh live code to rename.

## Step 19: Finish the examples/storybook fixture sweep and clear the stale `CardStoriesConfig` failure

The repo search in Step 18 exposed one more genuinely active place where APP-23 was not finished:

- engine demo VM fixtures were still dispatching `nav.go { cardId }`
- app story files were still using the old `createStoryHelpers` config shape

That second problem was already visible indirectly in validation:

```text
Object literal may only specify known properties, and 'stack' does not exist in type 'CardStoriesConfig'
```

for:

- `apps/todo`
- `apps/book-tracker-debug`
- `apps/crm`

So this was not optional polish. It was the last obvious place where examples and storybook-facing code were still telling the old story.

### What I changed

#### 1. Engine demo VM fixtures

Updated:

- `workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/fixtures/DesktopShell.demo.vm.js`
- `workspace-links/go-go-os-frontend/packages/engine/src/components/widgets/BookTracker.plugin.vm.js`

Changes:

- `navigate(context, cardId, param)` -> `navigate(context, surfaceId, param)`
- `nav.go { cardId }` -> `nav.go { surfaceId }`
- handler reads:
  - `asRecord(args).cardId` -> `asRecord(args).surfaceId`

These fixtures are still valuable because people read and reuse them. Leaving them stale would keep reintroducing broken VM navigation patterns into future examples.

#### 2. Storybook helper call sites

Updated:

- `workspace-links/go-go-os-frontend/apps/todo/src/app/stories/TodoApp.stories.tsx`
- `workspace-links/go-go-os-frontend/apps/book-tracker-debug/src/app/stories/BookTrackerDebugApp.stories.tsx`
- `workspace-links/go-go-os-frontend/apps/crm/src/app/stories/CrmApp.stories.tsx`

Those stories were still calling:

```ts
createStoryHelpers({
  stack: STACK,
  cardParams: { ... },
})
```

But the current helper API in:

- `workspace-links/go-go-os-frontend/packages/engine/src/app/generateCardStories.tsx`

expects:

```ts
createStoryHelpers({
  bundle: STACK,
  surfaceParams: { ... },
})
```

So I cut those story files over directly:

- `stack` -> `bundle`
- `cardParams` -> `surfaceParams`

### Validation

Successful commands:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm exec tsc -- --noEmit -p apps/todo/tsconfig.json

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm exec tsc -- --noEmit -p apps/book-tracker-debug/tsconfig.json

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm exec tsc -- --noEmit -p apps/crm/tsconfig.json
```

All three passed.

I also re-ran a direct parse check for the edited engine VM fixtures:

```bash
node - <<'NODE'
const fs = require('fs');
for (const file of [
  '.../DesktopShell.demo.vm.js',
  '.../BookTracker.plugin.vm.js',
]) {
  new Function(fs.readFileSync(file, 'utf8'));
  console.log('OK', file);
}
NODE
```

Both parsed cleanly.

### Why this step matters

This closes the “examples and stories still reintroduce the old model” gap that was left open after the main runtime code renames.

Before this step:

- the core runtime mostly spoke bundle/surface/package/surface-type
- but examples and stories still taught:
  - `cardId`
  - `stack`
  - `cardParams`

After this step:

- the first-party example layer is much closer to the actual APP-23 target model
- and the previously failing app-level TypeScript checks for those story projects now pass again

That makes the remaining APP-23 work much clearer:

- old docs
- artifact-boundary naming
- final export/search cleanup

## Step 20: Correct the live public docs that still actively taught the old runtime-core model

After the code/fixture cleanup, the remaining high-signal confusion was no longer in runtime code. It was in the live docs people are likely to actually read:

- `workspace-links/go-go-os-frontend/docs/js-api-user-guide-reference.md`
- `workspace-links/go-go-app-inventory/pkg/pinoweb/docs/02-vm-state-dispatch-boundary-simplification.md`

The first document was especially stale. It still taught:

- `CardStackDefinition`
- `CardDefinition`
- `homeCard`
- `nav.go { card }`
- `createStoryHelpers({ stack, cardParams })`

That is exactly the wrong model after APP-23.

### What I changed

#### 1. `js-api-user-guide-reference.md`

I did not try to rewrite the whole document from scratch in one pass. Instead, I corrected the sections that were actively misleading and easy to verify against current source:

- updated the verification date to `2026-03-11`
- changed the scope/intro from card-stack DSL language to:
  - `RuntimeBundleDefinition`
  - `RuntimeSurfaceMeta`
  - desktop shell
  - Storybook runtime-surface helpers
- updated the package-structure table so `cards/` now points to:
  - `RuntimeBundleDefinition`
  - `RuntimeSurfaceMeta`
- replaced the old `CardStackDefinition` / `CardDefinition` section with the current bundle/surface types from:
  - `packages/engine/src/cards/types.ts`
- replaced the stale runtime DSL/action examples with a current `defineRuntimeBundle(...)` / `defineRuntimeSurface(...)` style example
- updated built-in action docs to:
  - `nav.go { surfaceId, param? }`
  - `notify.show`
  - `draft.*`
  - `filters.*`
- replaced the old Storybook helper example with:
  - `createStoryHelpers({ bundle, createStore, surfaceParams })`
- replaced the old navigation helper snippet with the actual current runtime action form:
  - `context.dispatch({ type: 'nav.go', payload: { surfaceId: ... } })`

This is still not a perfect complete engine reference, but it no longer teaches the pre-APP-23 runtime-core terminology as if it were current.

#### 2. Inventory VM boundary doc

In:

- `workspace-links/go-go-app-inventory/pkg/pinoweb/docs/02-vm-state-dispatch-boundary-simplification.md`

I updated the explicit runtime method references:

- `renderCard(...)` -> `renderRuntimeSurface(...)`
- `eventCard(...)` -> `eventRuntimeSurface(...)`

and the remaining navigation examples:

- `nav.go { cardId }` -> `nav.go { surfaceId }`

### Validation

I validated this pass with source-consistency searches rather than forcing unrelated app builds:

```bash
rg -n "CardStackDefinition|homeCard|nav\\.go.*card|cardParams|renderCard\\(|eventCard\\(" \
  workspace-links/go-go-os-frontend/docs/js-api-user-guide-reference.md \
  workspace-links/go-go-app-inventory/pkg/pinoweb/docs/02-vm-state-dispatch-boundary-simplification.md
```

After the second small patch, the remaining hits in those two files were cleared.

### Why this is only a partial docs slice

This does **not** mean the broader docs cleanup is complete.

The repo search still shows many old references in:

- historical ticket docs under `ttmp/`
- older architecture notes
- archive material

Those are real cleanup work, but they are lower priority than the live code and live public reference pages. For APP-23, the important thing was to stop the currently shipped docs from contradicting the runtime code that now exists.

## Step 21: Make the artifact-boundary carve-out explicit

After the live docs pass, the remaining search hits were no longer all the same kind of problem.

Some are still stale debt.
Some are still correct because the external artifact protocol has not been versioned away from `card` yet.

### The distinction

These are still intentionally card-shaped today:

- timeline entity kind:
  - `hypercard.card.v2`
- backend sem event kinds:
  - `hypercard.card.start`
  - `hypercard.card.update`
  - `hypercard.card.v2`
  - `hypercard.card.error`
- inventory extractor tag:
  - `hypercard/card/v2`
- backend event structs:
  - `HypercardCardStartEvent`
  - `HypercardCardV2ReadyEvent`
  - `HypercardCardErrorEvent`
- timeline renderer component:
  - `HypercardCardRenderer`

Those names are not ideal relative to the new runtime-core model, but they still describe the current external artifact envelope and transport/event protocol.

By contrast, APP-23 is supposed to rename:

- runtime host/service/bootstrap internals
- runtime session/bundle/surface state
- VM navigation payloads
- Storybook helper config
- docs-mount object kinds
- live public reference docs

So the working rule is:

- if code is talking about the external artifact envelope, `card` may still be correct for now
- if code is talking about runtime-core execution/host state, `card` is usually stale

### Small code cleanup

I still tightened one active file at that boundary:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx`

The component name remains:

- `HypercardCardRenderer`

because it renders `hypercard.card.v2` entities.

But I renamed its internal helper functions from generic names like:

- `cardPayload`
- `cardData`
- `cardArtifactId`
- `titleFromCard`
- `detailFromCard`

to names that make the boundary explicit:

- `artifactPayload`
- `artifactData`
- `artifactIdFromCardArtifact`
- `titleFromArtifactCard`
- `detailFromArtifactCard`

That keeps the implementation honest:

- the component is parsing a card-shaped artifact envelope
- it is not evidence that the runtime core is still card-based

### Validation

Successful command:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npx vitest run packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.renderer.test.tsx
```

It passed.

### Why this matters

This gives APP-23 a safer stopping rule for the remaining cleanup.

Without this note, the repo search encourages renaming protocol-level artifact terms prematurely.
With it, the remaining work is clearer:

- keep cleaning stale runtime-core/live-doc terms
- do not blindly rename the external `hypercard.card.v2` protocol in the same ticket unless we explicitly choose to version that protocol too

## Related

- [index.md](../index.md)
- [tasks.md](../tasks.md)
- [changelog.md](../changelog.md)
- [01-intern-guide-to-runtime-session-bundle-package-surface-and-surface-type-boundaries.md](../design/01-intern-guide-to-runtime-session-bundle-package-surface-and-surface-type-boundaries.md)
