---
Title: Implementation diary
Ticket: APP-17-HYPERCARD-RUNTIME-DEBUG-BOOTSTRAP
Status: completed
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
        Reviewed as the wesen-os startup seam where global runtime-debug registration can occur
        Reviewed as the startup seam for wesen-os registration
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/app/modules.tsx
      Note: |-
        Reviewed as the launcher composition seam for exposing the new package-owned debug module
        Reviewed as the current launcher composition list
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.tsx
      Note: |-
        Reviewed to confirm current inventory ownership of the Stacks and Cards route and window payload
        Reviewed to confirm inventory still owns the user-facing route
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx
      Note: |-
        Reviewed to confirm the shared debug component exists already and still contains inventory-specific editor ownership
        Reviewed to confirm shared UI and residual ownerAppId hardcoding
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/runtimeDebugApp.tsx
      Note: Shared runtime debug app wrapper and window payload helper implemented by APP-17
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/runtimeDebugRegistry.ts
      Note: Shared runtime debug stack registration seam implemented by APP-17
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/index.ts
      Note: |-
        Reviewed as the public export seam for the later debug-module factory
        Reviewed as the public export seam for the later module factory
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/public.ts
      Note: Inventory stack export added so wesen-os can register inventory in the shared runtime debug surface
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/app/runtimeDebugModule.tsx
      Note: Thin wesen-os launcher wrapper that binds stacks to the shared runtime debug app
ExternalSources: []
Summary: Diary for the APP-17 design and implementation work that moved Stacks and Cards out of inventory-owned routing and into shared runtime-debug helpers registered by wesen-os.
LastUpdated: 2026-03-11T00:45:00-04:00
WhatFor: Record the reasoning, implementation steps, validation, and blockers behind APP-17 so later follow-ups such as built-in source display can start from the completed runtime-debug boundary.
WhenToUse: Use when reviewing APP-17, validating the shared Stacks and Cards move, or preparing the next debugger-source follow-up.
---


# Implementation diary

## Goal

Capture the design reasoning for moving `Stacks & Cards` fully into the shared runtime package surface and registering it from `wesen-os` startup instead of inventory-specific launcher glue.

## Step 1: Define The Runtime-Debug Bootstrap Ticket

The immediate question was whether `Stacks & Cards` is still part of inventory and whether moving it into `hypercard-runtime` would be hard. The file audit showed that the answer is mixed: the component is already shared, but the launcher entry, window payload creation, and actual user-facing route still live inside inventory. That made the correct follow-up clear. We needed a dedicated ticket for finishing the extraction instead of hand-waving that the work was “basically done.”

This design step focused on turning that observation into a later implementation plan. The main architectural choice is to keep `wesen-os` as the composition boundary while moving package ownership of the debug surface into `hypercard-runtime`. That means `hypercard-runtime` should export a reusable launcher-module factory or registration helper, while `wesen-os` performs explicit startup registration and passes app-specific inputs such as stack list and editor ownership.

### Prompt Context

**User prompt (verbatim):**

> create a ticket to move Stacks & Cards over and register it on startup in wesen-os. Add implementation guide and tasks, we'll tackle it later.
>
> Then... I do want to add more AST metadata later on. What would such a build process look like to call the preprocessor on these files?

**Assistant interpretation:** Create a follow-up design ticket for finishing the Stacks and Cards extraction and defining how `wesen-os` should register the shared debug surface at startup, then explain the likely future AST-preprocessor build shape for VM card files.

**Inferred user intent:** Finish separating runtime-debug tooling from inventory-specific ownership while also preparing for richer future metadata extraction on VM-authored card files.

**Commit (code):** N/A

### What I did

- Created APP-17 as a design-only ticket.
- Audited the current package seams in:
  - `apps/inventory/src/launcher/renderInventoryApp.tsx`
  - `packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx`
  - `packages/hypercard-runtime/src/hypercard/index.ts`
  - `apps/os-launcher/src/App.tsx`
  - `apps/os-launcher/src/app/modules.tsx`
- Wrote the design guide to explain:
  - current ownership split
  - target package-owned runtime-debug API
  - `wesen-os` startup registration path
  - migration phases
  - test plan and rollback points
- Added a later implementation slice for built-in stack-card source metadata because that directly affects debugger usefulness for VM cards such as Kanban.

### Why

- The user explicitly wants this tackled later, not mixed into the current Kanban implementation work.
- The existing extraction is partial enough that a fresh implementation pass could easily reintroduce inventory ownership unless the desired boundary is documented first.

### What worked

- The current package seams are now concrete instead of ambiguous.
- The later work is scoped as a runtime-debug registration problem rather than a generic UI move.

### What didn't work

- `docmgr ticket create-ticket` again created the workspace under `2026/03/09` rather than the session date. That does not block the ticket, but it is worth noting when locating the workspace later.

### What I learned

- `Stacks & Cards` is a good example of a nearly-extracted subsystem that still has meaningful app-level ownership leaks.
- The critical missing piece is not the component itself. It is the package-owned launcher and startup-registration contract.

### What was tricky to build

- The tricky part was avoiding a misleading recommendation to “just add a new icon in `wesen-os`.” That would solve access, but not actual ownership. The package boundary only becomes clear once the later implementation requires `hypercard-runtime` to export the registration API itself.
- I handled that by making the design explicitly separate package ownership of the runtime-debug surface from host ownership of startup registration and stack selection.

### What warrants a second pair of eyes

- The exact shape of the public registration API deserves review before implementation. The main choice is between:
  - a `createRuntimeDebugLauncherModule(...)` factory
  - a `registerHypercardRuntimeDebug(...)` helper that mutates an app registry
- The editor ownership handoff also deserves review because `RuntimeCardDebugWindow` still hardcodes `ownerAppId: 'inventory'`.

### What should be done in the future

- Implement the APP-17 slices in order, starting with app-agnostic `RuntimeCardDebugWindow` props and a package-owned module factory.
- Follow with the later built-in source metadata work so package-authored VM cards can show their source in the debugger.

### Code review instructions

- Start with the APP-17 design doc.
- Compare the “current state” section against:
  - `renderInventoryApp.tsx`
  - `RuntimeCardDebugWindow.tsx`
  - `App.tsx`
  - `modules.tsx`
- Confirm that the design keeps registration in `wesen-os` while moving reusable ownership into `hypercard-runtime`.

### Technical details

- Ticket creation commands:

```bash
docmgr ticket create-ticket \
  --ticket APP-17-HYPERCARD-RUNTIME-DEBUG-BOOTSTRAP \
  --title "Move Stacks and Cards into hypercard-runtime and register it from wesen-os startup" \
  --topics architecture,frontend,hypercard,wesen-os

docmgr doc add \
  --ticket APP-17-HYPERCARD-RUNTIME-DEBUG-BOOTSTRAP \
  --doc-type design-doc \
  --title "Intern guide to moving Stacks and Cards into hypercard-runtime and bootstrapping it from wesen-os"

docmgr doc add \
  --ticket APP-17-HYPERCARD-RUNTIME-DEBUG-BOOTSTRAP \
  --doc-type reference \
  --title "Implementation diary"
```

## Related

- `../index.md`
- `../tasks.md`
- `../changelog.md`
- `../design-doc/01-intern-guide-to-moving-stacks-and-cards-into-hypercard-runtime-and-bootstrapping-it-from-wesen-os.md`

## Step 2: Implement The Shared Runtime Debug Surface And Startup Registration

The user then asked to execute APP-17 task by task rather than leaving it as design-only work. The implementation ended up confirming one important design correction: `hypercard-runtime` should not create a `LaunchableAppModule` factory because that would reverse the dependency direction into `desktop-os`. The correct split was package-owned runtime debug helpers in `hypercard-runtime`, plus a thin `wesen-os` launcher wrapper that binds host stacks and startup registration.

This step carried the code through all three repos that own the final behavior. `hypercard-runtime` became the real runtime-debug home, inventory became a consumer instead of an owner, and `wesen-os` became the startup composition point. That leaves built-in VM source display as a clean next layer rather than a blocker for the boundary move.

### Prompt Context

**User prompt (verbatim):** "ok, go ahead. same away per task"

**Assistant interpretation:** Implement APP-17 in focused slices, commit each slice separately, and keep the ticket bookkeeping current as the work progresses.

**Inferred user intent:** Finish the Stacks and Cards move end to end instead of leaving it as a planning artifact, while preserving reviewable task boundaries and documentation.

**Commit (code):** `8cf7b35` — "Extract shared runtime debug app surface"  
**Commit (code):** `61f7848` — "Switch inventory to shared runtime debug app"  
**Commit (code):** `222b4a9` — "Register runtime debug app in os launcher"

### What I did

- Added `runtimeDebugRegistry.ts` and `runtimeDebugApp.tsx` in `packages/hypercard-runtime/src/hypercard/debug`.
- Updated `RuntimeCardDebugWindow.tsx` to accept `ownerAppId`, support multiple stacks, and fall back to the shared stack registry.
- Updated `RuntimeCardDebugWindow.stories.tsx` to register multiple stacks and exercise the new selection path.
- Added `runtimeDebugRegistry.test.tsx` in `hypercard-runtime`.
- Re-exported the runtime debug helpers from `packages/hypercard-runtime/src/hypercard/index.ts`.
- Re-exported `inventoryStack` from `apps/inventory/src/launcher/public.ts`.
- Removed inventory-owned `Stacks & Cards` command and route glue from `apps/inventory/src/launcher/renderInventoryApp.tsx`.
- Added `apps/os-launcher/src/app/runtimeDebugModule.tsx` as the thin `wesen-os` wrapper that registers `inventoryStack` plus the `os-launcher` stack and renders `RuntimeDebugAppWindow`.
- Added `apps/os-launcher/src/app/runtimeDebugModule.test.tsx` and updated `apps/os-launcher/src/__tests__/launcherHost.test.tsx` for the new app registration.
- Ran targeted validation in the affected repos and recorded the exact failures that were pre-existing workspace issues.

### Why

- The user wanted the move completed now, not left as a later design ticket.
- The runtime debugger had already become shared in UI terms; the remaining work was to make ownership, registration, and editor-open behavior match that reality.
- Pushing the move through before source display keeps the next debugger work focused on built-in source metadata rather than on lingering inventory routing glue.

### What worked

- `hypercard-runtime` now owns the reusable runtime debug surface and exports the public helpers needed by host apps.
- Inventory no longer owns a bespoke `Stacks & Cards` payload builder, command handler, or route case.
- `wesen-os` now registers the shared runtime debug app through normal launcher composition.
- `npx vitest run src/hypercard/debug/runtimeDebugRegistry.test.tsx` passed in `packages/hypercard-runtime`.
- `npm run typecheck -w packages/hypercard-runtime` passed in `workspace-links/go-go-os-frontend`.
- `npx tsc --build tsconfig.json` passed in `workspace-links/go-go-app-inventory/apps/inventory`.

### What didn't work

- The first direct inventory and `os-launcher` TypeScript validation attempt used:

```bash
node /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/node_modules/typescript/bin/tsc --build tsconfig.json
```

That failed immediately because the referenced TypeScript binary does not exist in this workspace layout:

```text
Error: Cannot find module '/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/node_modules/typescript/bin/tsc'
```

- `npx vitest run src/app/runtimeDebugModule.test.tsx src/__tests__/launcherHost.test.tsx` in `apps/os-launcher` failed before executing tests because of pre-existing linked `.js` import gaps:

```text
Error: Cannot find module '/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/desktop-os/src/contracts/appManifest' imported from /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/desktop-os/src/registry/createAppRegistry.js
```

and:

```text
Error: Cannot find module '/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/app/createAppStore' imported from /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/app/index.js
```

- `npx tsc --build tsconfig.json` in `apps/os-launcher` failed on pre-existing linked `@hypercard/rich-widgets` errors unrelated to APP-17, for example:

```text
node_modules/@hypercard/rich-widgets/src/chart-view/chartViewState.ts(32,5): error TS2322: Type '{ chartType?: ChartType | undefined; datasetKey?: string | undefined; } | { initialized: boolean; chartType: ChartType; datasetKey: string; }' is not assignable to type 'ChartViewState'.
```

### What I learned

- The original “put a launcher-module factory in `hypercard-runtime`” idea is wrong for this workspace because `desktop-os` already depends on `hypercard-runtime`.
- The right seam is lower-level: package-owned React/runtime helpers in `hypercard-runtime`, and host-owned launcher composition in `wesen-os`.
- Inventory only needed to export its stack and stop intercepting the route; it did not need its own transitional compatibility layer.

### What was tricky to build

- The tricky part was preserving the ownership move without introducing a dependency cycle. The symptom was architectural rather than compiler-only: the moment `hypercard-runtime` would import `LaunchableAppModule` from `desktop-os`, the package graph would invert. I handled that by keeping the shared code limited to runtime debug helpers and moving the actual launcher module into `wesen-os`.
- The other tricky part was validation. The `os-launcher` Vitest path is currently polluted by linked `.js` import resolution issues, and the `os-launcher` TypeScript build is blocked by pre-existing linked `@hypercard/rich-widgets` errors. I worked around that by validating the shared runtime package and inventory directly and recording the exact `os-launcher` blockers rather than misattributing them to APP-17.

### What warrants a second pair of eyes

- Review the `registerRuntimeDebugStacks(...)` usage in `apps/os-launcher/src/app/runtimeDebugModule.tsx` to confirm module-scope registration is acceptable for the desired startup semantics.
- Review the multi-stack selection behavior in `RuntimeCardDebugWindow.tsx`, especially the fallback from explicit `stacks` props to the shared registry.
- Review whether `hypercard/timeline/hypercardCard.tsx` should be generalized in the next ticket as well; APP-17 only moved Stacks and Cards, not every inventory-flavored editor-open path in the runtime package.

## Step 3: Restrict Plugin Sessions To The Actively Running Card

After the APP-17 move landed, the user noticed a real behavior bug in the shared `Stacks & Cards` window: the `Plugin Sessions` table showed every cached `cardState` bucket in a session and attached `Open` / `Edit` actions to all of them. That was misleading. A runtime session only has one actively running card at a time; the extra `cardState` entries are retained local state, not proof that those cards are currently mounted.

The fix was to stop using `session.cardState` as the source of truth for the running card and instead resolve `sessionId -> current nav card` from the windowing slice. That tightened the debugger behavior and made the session table line up with how `PluginCardSessionHost` actually resolves the active card.

### Prompt Context

**User prompt (verbatim):**

> I should only open / edit th erunning card. in the plugin sessions cards and stacks

**Assistant interpretation:** Limit `Plugin Sessions` actions to the session’s current running card rather than every retained `cardState` entry.

**Inferred user intent:** Make `Stacks & Cards` accurately reflect live runtime behavior so actions and editing targets are trustworthy.

**Commit (code):** `8378ac6` — "Show only active cards in runtime debug sessions"

### What I did

- Updated [RuntimeCardDebugWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx) to read `windowing.sessions[sessionId].nav` and resolve the current card from the top nav entry.
- Changed the `Plugin Sessions` table column from `Card States` to `Current Card`.
- Restricted session-row `Open` / `Edit` actions to that single active card.
- Added [RuntimeCardDebugWindow.test.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.test.tsx) to lock the behavior down with a jsdom test.

### Why

- `cardState` is historical local state, not a live session-routing source.
- The debugger should model what the runtime is actually doing, not expose every remembered card bucket as if it were currently running.

### What worked

- The shared debugger now shows one running card per session row.
- The new test passed.
- Existing registry tests still passed.

### What didn't work

- Nothing in the implementation itself failed, but the root cause was easy to miss because the session row looked plausible until multiple built-in stack cards had retained state in the same VM session.

### What I learned

- For runtime-debug UI, the right source of truth for “what is currently open” is the window/session navigation stack, not the runtime state buckets.
- `cardState` and nav state answer different questions:
  - nav state: what card is currently mounted
  - cardState: what local state exists for cards in this session

### What was tricky to build

- The debugger component already had access to runtime sessions, artifacts, and stack metadata, but not to the windowing session shape. The fix required threading that additional source into the component and being explicit about the fallback behavior when no nav entry exists.
- I kept a fallback to the first `cardState` key only for robustness, but the preferred path is always the nav stack.

### What warrants a second pair of eyes

- Review whether any other runtime-debug surfaces are still using `cardState` where they should really use window/session navigation state.
- Review whether the session row should eventually expose both the active card and a secondary cached-state count, or whether that would just reintroduce confusion.

### What should be done in the future

- Use the same active-card resolution logic when APP-19 / source-display work attaches built-in card source to session rows.

### Code review instructions

- Start in [RuntimeCardDebugWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx) and compare the new `sessionCurrentCardIds` logic with the old `Object.keys(cardState)` iteration.
- Then read [RuntimeCardDebugWindow.test.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.test.tsx).
- Validate with:
  - `npx vitest run packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.test.tsx packages/hypercard-runtime/src/hypercard/debug/runtimeDebugRegistry.test.tsx`
  - `npm run typecheck -w packages/hypercard-runtime`

### Technical details

Before:

```text
Plugin session row
  -> Object.keys(session.cardState)
  -> treat each key as "running card"
```

After:

```text
Plugin session row
  -> windowing.sessions[sessionId].nav.at(-1).card
  -> treat that one card as the active card
  -> use cardState only as a fallback
```

## Step 3: Add Launch And Session Actions To The Shared Debugger

After the shared `Stacks & Cards` app was live in `wesen-os`, the next usability gap showed up immediately in manual use. The stack table listed predefined cards, but it could not launch them, and the running plugin-session table still did not expose built-in source for active `os-launcher` Kanban cards. That made the extraction technically complete but still awkward in practice.

This final APP-17 polish solved that by treating predefined cards and session rows as two different action surfaces. Predefined stack cards now expose a generic `Open` action, while session rows resolve their `stackId` and `cardState` entries back to the matching stack cards so built-in source-bearing cards can expose `Edit` again. The only app-specific fix required was widening the `os-launcher` card adapter so generic `stackId === os-launcher` card windows render, instead of only windows whose session IDs use the old Kanban-specific prefix.

### Prompt Context

**User prompt (verbatim):**

> cool perfect. Can we launch cards from the Stack: view in the Stacks & Cards helper? Also, I didn't see the Edit button in the stacks and cards plugin view. Do we have stale js again? I was sure I saw it beforewhere you could open say the source of "Incident Command" when it was running...

**Assistant interpretation:** Investigate whether the missing actions are stale-module fallout or actual behavior gaps, then add the missing launch and edit paths if needed.

**Inferred user intent:** Make the moved debugger genuinely useful, not just structurally extracted, by letting it launch predefined cards and reopen the source for running built-in VM cards.

**Commit (code):** pending local commit in `go-go-os-frontend`  
**Commit (code):** pending local commit in `wesen-os`

### What I did

- Audited `RuntimeCardDebugWindow.tsx` and confirmed the missing controls were a real behavior gap rather than another stale generated-JS issue.
- Added a generic stack-card window builder in the shared runtime debug window and wired `▶ Open` actions into the predefined stack-card table.
- Added a new `Actions` column to the plugin-session table that resolves each session’s `stackId` and `cardState` keys back to the matching stack cards.
- Reused built-in stack-card runtime metadata so running Kanban cards in `os-launcher` expose `✏️ Edit` from the session table.
- Widened `apps/os-launcher/src/app/kanbanVmModule.tsx` so its card adapter claims all `os-launcher` stack card windows instead of only the old `os-launcher-kanban:` session prefix, which makes generic debug-launched card windows render correctly.
- Updated the `os-launcher` tests to reflect the broader card-adapter behavior and the shared runtime-debug wrapper expectations.

### Why

- The moved debugger was still missing the exact high-value affordances the user expected during real use.
- The session list already knew the running stack and card IDs; the missing piece was resolving those IDs back to stack metadata and source strings.
- Broadening the `os-launcher` adapter was simpler and cleaner than adding another one-off debug-only session-ID convention.

### What worked

- `Stacks & Cards` now shows `▶ Open` buttons for predefined `inventory` and `os-launcher` stack cards.
- When the selected stack is `os-launcher`, built-in Kanban cards now show `✏️ Edit` in the predefined-card table because their generated source metadata is already attached to the stack cards.
- The running plugin-session list now shows per-card `▶ Open` and `✏️ Edit` actions for the active `os-launcher` Kanban sessions.
- `npm run test -- --run src/app/kanbanVmModule.test.tsx src/app/runtimeDebugModule.test.tsx` passed in `apps/os-launcher`.
- `npm run typecheck -w packages/hypercard-runtime` passed in `workspace-links/go-go-os-frontend`.
- A live Playwright smoke in `wesen-os` confirmed:
  - the stack selector shows both `inventory` and `os-launcher`
  - predefined `inventory` cards now have `▶ Open`
  - predefined `os-launcher` Kanban cards have both `▶ Open` and `✏️ Edit`
  - the running session table can reopen `kanbanIncidentCommand` source in the editor

### What didn't work

- The first Playwright click attempt on the session-table `✏️ Edit` button failed because the newly opened `Incident Command` card window was on top and intercepting pointer events. Closing the window and clicking again worked immediately.
- The first Vitest assertion in `runtimeDebugModule.test.tsx` tried to compare module-identity-sensitive React component references and registry side effects, which is brittle under Vitest’s module reset behavior. I simplified the test to assert the rendered props instead.

### What I learned

- The missing actions were not another stale-JS problem. The UI simply never had those controls after the package move.
- The shared runtime-debug window can safely own generic stack-card opening as long as each host app contributes a card adapter that claims its own stack windows by `stackId`.
- The session table becomes much more useful once it treats `stackId + cardId` as the lookup key back into stack metadata rather than as isolated runtime state.

### What was tricky to build

- The tricky part was not the buttons themselves. It was making sure the opened card windows actually rendered through the correct host adapter. Before the `os-launcher` adapter change, generic stack-card windows for `os-launcher` would not render because the adapter only claimed the old Kanban-specific session prefix. I fixed that by widening the adapter to any `card.stackId === STACK.id`.
- The other subtle point was keeping the actions generic inside `RuntimeCardDebugWindow` without hardcoding app-specific launch builders. The shared debugger now constructs a normal `content.kind = 'card'` window payload, and the host-specific adapter layer takes care of rendering it.

### What warrants a second pair of eyes

- Review whether widening the `os-launcher` adapter to all `os-launcher` stack cards is the desired long-term policy or whether a later dedicated host adapter should split Kanban demos from other potential `os-launcher` cards.
- Review whether the session action list should eventually focus existing matching windows instead of always opening a fresh card window.
- Review whether inventory should later attach built-in source metadata too, so its predefined cards can expose `✏️ Edit` in the same way as the `os-launcher` Kanban demos.

### What should be done in the future

- Add generated built-in VM source display to `Stacks & Cards` on top of the now-shared runtime debug surface.
- Decide whether the next follow-up should also generalize the remaining inventory-owned editor launch from timeline card rendering.

### Code review instructions

- Start in `packages/hypercard-runtime/src/hypercard/debug/runtimeDebugApp.tsx` and `packages/hypercard-runtime/src/hypercard/debug/runtimeDebugRegistry.ts`.
- Then review `packages/hypercard-runtime/src/hypercard/debug/RuntimeCardDebugWindow.tsx` to see how owner app and stack selection became explicit.
- Then review `apps/inventory/src/launcher/renderInventoryApp.tsx` and confirm inventory no longer owns a bespoke runtime debug route.
- Then review `apps/os-launcher/src/app/runtimeDebugModule.tsx` and `apps/os-launcher/src/app/modules.tsx` to see how `wesen-os` now registers the shared app.
- Validate with:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime
npx vitest run src/hypercard/debug/runtimeDebugRegistry.test.tsx

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend
npm run typecheck -w packages/hypercard-runtime

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory
npx tsc --build tsconfig.json
```

### Technical details

- New shared runtime debug APIs:

```ts
registerRuntimeDebugStacks(stacks)
buildRuntimeDebugWindowPayload(options?)
RuntimeDebugAppWindow({ ownerAppId, instanceId, stacks? })
```

- Final runtime-debug flow:

```text
apps/os-launcher/src/app/runtimeDebugModule.tsx
    ->
registerRuntimeDebugStacks([inventoryStack, STACK])
    ->
buildRuntimeDebugWindowPayload()
    ->
RuntimeDebugAppWindow(ownerAppId='hypercard-runtime-debug')
    ->
RuntimeCardDebugWindow(ownerAppId, registeredStacks)
    ->
openCodeEditor(dispatch, { ownerAppId, cardId }, code)
```
