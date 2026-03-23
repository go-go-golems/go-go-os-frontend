---
Title: Investigation diary
Ticket: APP-06-FRONTEND-TIMELINE-REGISTRATION
Status: active
Topics:
    - frontend
    - chat
    - timeline
    - hypercard
    - wesen-os
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/app/store.ts
      Note: Diary evidence for correct inventory host store wiring
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/app/store.ts
      Note: Diary evidence for missing chat reducers and middleware in apps-browser
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/runtime/registerChatModules.ts
      Note: Diary evidence for chat bootstrap behavior
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelineMapper.ts
      Note: Diary evidence for hardcoded hypercard remap in chat-runtime
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/registerHypercardTimeline.ts
      Note: Diary evidence for renderer registration layer
ExternalSources: []
Summary: Chronological research log for the frontend timeline registration audit, including commands run, evidence gathered, and the main architectural conclusions.
LastUpdated: 2026-03-06T18:35:00-05:00
WhatFor: Use this diary to review exactly how the investigation was performed and which evidence supports the design doc conclusions.
WhenToUse: Use when validating the current architecture, reproducing the audit, or reviewing what commands and tests were run.
---


# Investigation diary

## Goal

Determine whether frontend timeline widgets and renderers for chat artifacts are actually unregistered, or whether the visible problem is a broader integration issue involving timeline mapping, extension bootstrap, and host-store wiring.

## Context

The user suspected that frontend timeline widgets for:

- HyperCard cards
- maybe generic tool calls

were no longer registered even though the backend appeared to still emit the right projected entities.

That is an important distinction:

- if the backend projection is broken, the fix belongs in Go
- if projection is correct but UI is wrong, the fix belongs in the TypeScript extension/bootstrap/store stack

## Chronology

### 2026-03-06 11:22 ET

Created the APP-06 ticket workspace and initial documents under:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/06/APP-06-FRONTEND-TIMELINE-REGISTRATION--investigate-frontend-timeline-widget-registration-for-chat-artifacts`

Added:

- design doc skeleton
- investigation diary skeleton

### 2026-03-06 11:23 ET

Ran a broad code search across:

- `workspace-links/go-go-os-frontend`
- `workspace-links/go-go-app-inventory`

Search themes:

- `registerHypercard`
- `hypercard.card`
- `hypercard.widget`
- `registerChatModules`
- `timeline`
- `tool_call`
- renderer registration

Key findings from the search:

- backend HyperCard projection still exists in `pkg/pinoweb/hypercard_events.go`
- inventory launcher still explicitly registers the HyperCard chat module in `renderInventoryApp.tsx`
- HyperCard runtime still contains timeline registration helpers and tests
- chat-runtime still contains generic builtin renderers for `tool_call` and `tool_result`

### 2026-03-06 11:24 ET

Read the core chat bootstrap files:

- `packages/chat-runtime/src/chat/runtime/registerChatModules.ts`
- `packages/chat-runtime/src/chat/runtime/moduleBootstrap.ts`

Conclusion:

- default chat registration is global and side-effect based
- default chat bootstrap registers only:
  - SEM handlers
  - builtin renderers
- extension modules such as HyperCard must be registered separately

### 2026-03-06 11:24 ET

Read the default SEM handling and mapping path:

- `packages/chat-runtime/src/chat/sem/semRegistry.ts`
- `packages/chat-runtime/src/chat/sem/timelineMapper.ts`

Main observation:

- `timeline.upsert` is the canonical live frontend path
- HyperCard-specific entity remapping is hardcoded inside `timelineMapper.ts`
- generic chat-runtime already knows how to remap:
  - `hypercard.widget.v1` -> `hypercard_widget`
  - `hypercard.card.v2` -> `hypercard_card`

This is a design smell because HyperCard-specific behavior is not isolated to the HyperCard package.

### 2026-03-06 11:25 ET

Read inventory launcher bootstrap:

- `apps/inventory/src/launcher/renderInventoryApp.tsx`

Important evidence:

- inventory imports `registerHypercardTimelineModule`
- inventory calls `registerChatRuntimeModule(...)`
- inventory calls `ensureChatModulesRegistered()`

Conclusion:

- inventory is still explicitly bootstrapping HyperCard timeline rendering
- there is no evidence that registration was simply deleted from inventory

### 2026-03-06 11:26 ET

Read artifact projection middleware and store setup:

- `packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts`
- `packages/hypercard-runtime/src/app/createAppStore.ts`
- `apps/inventory/src/app/store.ts`
- `apps/apps-browser/src/app/store.ts`

This turned out to be the most important architectural finding.

Inventory store:

- includes `timeline`, `chatSession`, `chatWindow`, `chatProfiles`
- uses `createAppStore(...)`
- therefore gets artifact projection middleware

Apps-browser store:

- includes `hypercardArtifacts`
- does not include chat reducers
- does not install artifact projection middleware

Conclusion:

- not every host store is chat-capable today
- future app-chat windows in apps-browser would fail unless this changes

### 2026-03-06 11:27 ET

Read HyperCard runtime files:

- `packages/hypercard-runtime/src/hypercard/timeline/registerHypercardTimeline.ts`
- `packages/hypercard-runtime/src/hypercard/timeline/hypercardWidget.tsx`
- `packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx`

Key observation:

- `registerHypercardTimeline.ts` currently registers renderers only
- `hypercardWidget.tsx` and `hypercardCard.tsx` still export direct SEM registration functions:
  - `registerHypercardWidgetSemHandlers()`
  - `registerHypercardCardSemHandlers()`

I searched the workspace and found no active call sites for those functions.

Conclusion:

- there are overlapping extension models in the codebase
- renderer registration is live
- direct SEM-to-timeline projection helpers appear legacy

### 2026-03-06 11:28 ET

Read relevant tests:

- `packages/chat-runtime/src/chat/runtime/registerChatModules.test.ts`
- `packages/chat-runtime/src/chat/sem/timelineMapper.test.ts`
- `packages/hypercard-runtime/src/hypercard/timeline/hypercardWidget.test.ts`
- `packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.test.ts`
- `apps/apps-browser/src/launcher/module.test.tsx`

Conclusions:

- chat bootstrap and HyperCard remapping are tested
- HyperCard tests pass using ad-hoc stores that include the exact needed reducers/middleware
- apps-browser tests do not render any chat window
- there is no host-level integration test that proves a real launcher host can render a HyperCard timeline row

### 2026-03-06 11:25-11:26 ET

Attempted to run:

```bash
pnpm vitest packages/chat-runtime/src/chat/runtime/registerChatModules.test.ts \
  packages/hypercard-runtime/src/hypercard/timeline/hypercardWidget.test.ts \
  packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.test.ts --run
```

This failed because plain `pnpm vitest` was not available in that workspace shell.

Observed error:

### 2026-03-06 18:10-18:35 ET

Follow-up debugging after the frontend cutover shifted from renderer resolution to malformed structured-block diagnosis.

Evidence gathered from the user:

- Event Viewer showed `hypercard.card.error`
- the enriched payload now included:
  - `error`
  - `raw`
  - partial `data`
- the backend streaming logs showed the model emitted:
  - the card JavaScript body
  - the closing YAML/code fence
  - then stopped with `stop_reason=stop`
- the stream did **not** emit the outer closing tag `</hypercard:card:v2>`

This established that:

- the inner YAML/code fence had closed correctly
- the malformed error was not primarily a YAML failure
- the actual framing failure was the missing outer structured close tag

Implemented follow-up changes:

- in `go-go-app-inventory`, enriched `hypercard.card.error` to include `raw` and `data`
- in `geppetto`, changed `structuredsink` malformed errors to mention the expected closing tag and pass the reconstructed outer block into `raw`
- in `go-go-app-inventory`, tightened the runtime-card policy prompt to explicitly require `</hypercard:card:v2>` after the closing code fence

Relevant commits recorded during this phase:

- `015d859` in `go-go-app-inventory` — `fix: include raw payload on hypercard card errors`
- `4cf9e48` in `geppetto` — `debug: improve malformed structured block diagnostics`
- `5b51fe4` in `go-go-app-inventory` — `prompt: require closing hypercard card tag`

```text
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found
Did you mean "pnpm test"?
```

Then inspected package scripts and switched to `npm exec vitest`.

### 2026-03-06 11:25 ET

Ran:

```bash
npm exec vitest -- \
  packages/chat-runtime/src/chat/runtime/registerChatModules.test.ts \
  packages/hypercard-runtime/src/hypercard/timeline/hypercardWidget.test.ts \
  packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.test.ts \
  --run
```

Result:

- 3 test files passed
- 6 tests passed

This confirmed:

- bootstrap logic passes in isolation
- HyperCard remap and artifact projection pass in isolation

### 2026-03-06 11:25 ET

Ran:

```bash
npm exec vitest -- apps/apps-browser/src/launcher/module.test.tsx --run
```

Result:

- 1 test file passed
- 14 tests passed

This confirmed:

- apps-browser launcher works for its current docs/browser features
- but still does not prove any chat integration path

### 2026-03-06 16:45 ET

Reviewed user-provided runtime screenshots from the live inventory app:

- Event Viewer showed a `timeline.upsert`
- the payload contained `entity.kind = hypercard.card.v2`
- Timeline Debug showed the stored timeline entity already present with the remapped kind `hypercard_card`
- the chat window still rendered generic JSON instead of a card row

This materially narrowed the problem.

What the screenshots prove:

- backend projection is good
- websocket/SEM delivery is good
- `timeline.upsert` decode is good
- Redux timeline state is good
- the failure is in the final renderer-resolution layer

At that point, adding more generalized event logging no longer looked worthwhile. The better move was to stop debugging the hybrid path and define the cutover fix directly.

### 2026-03-06 16:52 ET

Made the implementation decision for the handoff plan:

- remove widget scope from the live contract
- preserve `hypercard.card.v2` end to end
- stop relying on global HyperCard renderer registration in inventory
- add an explicit renderer-override seam to `ChatConversationWindow`
- have inventory pass `HypercardCardRenderer` directly

This is a stronger fix than trying to patch one more bootstrap edge case because it removes the hidden dependency entirely.

### 2026-03-06 12:38 ET

Started implementation with the smallest safe slice: add an explicit renderer override seam to the chat window before changing any HyperCard behavior.

Code commit:

- `8e5324e` — `feat: allow chat window renderer overrides`

What changed:

- `ChatConversationWindow` now accepts an optional `timelineRenderers` prop.
- The component still subscribes to the global renderer registry for builtin/default behavior.
- Host-provided renderers are merged after global resolution, so host overrides win.

Why this order mattered:

- it gives inventory a direct way to render `hypercard.card.v2`
- it avoids touching the HyperCard remap and artifact paths yet
- it keeps the first commit small enough to validate independently

Validation run:

```bash
npm exec vitest -- \
  packages/chat-runtime/src/chat/runtime/registerChatModules.test.ts \
  packages/chat-runtime/src/chat/sem/timelineMapper.test.ts \
  --run
```

Result:

- 2 test files passed
- 7 tests passed

### 2026-03-06 12:45 ET

Implemented the second cutover slice in inventory:

- `67d0bed` — `refactor: inject inventory card renderer explicitly`

What changed:

- removed the live inventory import/use of `registerChatRuntimeModule(...)`
- removed the live inventory import/use of `registerHypercardTimelineModule()`
- kept `ensureChatModulesRegistered()` for builtin chat behavior
- passed `HypercardCardRenderer` directly to `ChatConversationWindow` via `timelineRenderers`

This was the point of the first slice. Once `ChatConversationWindow` accepted host overrides, inventory could own the card renderer explicitly instead of relying on global bootstrap.

Validation attempt 1:

```bash
npm run typecheck
```

Observed error:

```text
Error: Cannot find module '/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/node_modules/typescript/bin/tsc'
```

Validation attempt 2:

```bash
node /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/node_modules/typescript/bin/tsc \
  -p /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/tsconfig.json \
  --noEmit
```

Observed error class:

- many pre-existing `TS6305` project-reference build-output errors for shared frontend packages
- unrelated existing `implicit any` errors in inventory story and launcher files

What I learned:

- the inventory app does not currently have a clean standalone typecheck loop in this checkout
- that means validation for this slice has to rely on narrow code review plus broader end-to-end validation later in the ticket

### 2026-03-06 12:49 ET

Implemented the main cutover slice in `go-go-os-frontend`:

- `c43e40b` — `refactor: cut over chat timeline to first-class hypercard cards`

What changed:

- removed the HyperCard-specific remap from `timelineMapper.ts`
- kept `hypercard.card.v2` as the stored timeline kind
- updated `HypercardCardRenderer` to read first-class card payloads directly
- simplified `artifactRuntime.ts` and `artifactProjectionMiddleware` tests to the first-class card contract
- removed widget frontend files and the old HyperCard global registration helpers from the live package surface
- updated the debug color mapping to use `hypercard.card.v2`
- added a new `ChatConversationWindow` component test proving explicit renderer overrides and builtin `tool_call` rendering

This was the architectural center of the ticket. Once the host injection seam existed, the generic chat runtime no longer needed to understand a private `hypercard_card` alias, and the HyperCard runtime no longer needed to keep widget/bootstrap compatibility files alive.

### 2026-03-06 12:49 ET

Added the inventory host-level integration test:

- `c8a618e` — `test: cover inventory chat card rendering`

What changed:

- created a real jsdom test under the inventory app
- used an inventory-shaped host store via `createAppStore(...)`
- fed a real `timeline.upsert` envelope with `kind = hypercard.card.v2`
- rendered `ChatConversationWindow` with `timelineRenderers={{ 'hypercard.card.v2': HypercardCardRenderer }}`
- asserted that the rendered output contains the card row and runtime card id

This test is important because it proves the actual end-state host contract, not just isolated helper functions.

### 2026-03-06 12:50 ET

Ran the final automated validation from the `wesen-os` workspace root:

```bash
npm exec vitest -- \
  workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/components/ChatConversationWindow.test.tsx \
  workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/runtime/registerChatModules.test.ts \
  workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelineMapper.test.ts \
  workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.test.ts \
  workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.test.ts \
  workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.test.ts \
  workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.chat.test.tsx \
  --run
```

Result:

- 7 test files passed
- 20 tests passed

Also attempted live manual validation by starting:

```bash
go run ./cmd/wesen-os-launcher wesen-os-launcher --arc-enabled=false --addr 127.0.0.1:8092
```

The server started successfully on `127.0.0.1:8092`, but Playwright validation was blocked by an environment issue:

```text
Error: Browser is already in use for /home/manuel/.cache/ms-playwright/mcp-chrome
```

So the remaining open validation item is the real UI pass, not the code/test cutover itself.

## Quick Reference

### Main evidence chain

1. Backend generic tool projection:
   - `pinocchio/pkg/webchat/timeline_projector.go`
2. Backend inventory HyperCard projection:
   - `workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go`
3. Frontend decode:
   - `packages/chat-runtime/src/chat/sem/semRegistry.ts`
4. Frontend remap:
   - `packages/chat-runtime/src/chat/sem/timelineMapper.ts`
5. Frontend renderer registration:
   - `packages/hypercard-runtime/src/hypercard/timeline/registerHypercardTimeline.ts`
6. Frontend artifact side-state:
   - `packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts`
7. Host store wiring:
   - inventory store vs apps-browser store

### Scope revision

After the first pass, the target was narrowed to a card-first cutover.

- `hypercard.card.v2` is the primary artifact contract to preserve
- `tool_call` remains part of the generic chat contract
- widget paths are now treated as legacy or non-target unless a concrete consumer requires them

### Main conclusions

- The backend projection path looks correct.
- Tool-call rendering is generic chat-runtime behavior, not HyperCard behavior.
- HyperCard-specific remap logic currently lives in the wrong package.
- Host store wiring is a real integration boundary and currently inconsistent.
- The live inventory card bug is now narrowed to renderer resolution, not event transport or timeline state.
- The cleanest fix is explicit host-owned card renderer injection plus first-class `hypercard.card.v2`, not more global registration glue.
- The first-class card cutover is now implemented and covered by automated tests.
- The remaining gap is live UI validation in a browser session, not unit/integration coverage.

## Usage Examples

### Example: diagnosing a live missing-card bug

1. Check whether `timeline.byConvId[convId]` contains a row for the conversation.
2. If yes, inspect the entity `kind`.
3. If `kind === "hypercard_card"` but the UI shows generic JSON:
   - the remaining failure is renderer resolution
   - do not keep piling on more transport logging
   - prefer the card-cutover fix documented in `02-card-cutover-fix-handoff-plan.md`
4. If `kind === "hypercard.card.v2"` and the row renders correctly:
   - the cutover is working as intended
5. If the row renders but artifact open/edit behavior is missing:
   - host store likely lacks artifact projection middleware

### Example: planning chat support in a new host app

Before mounting `ChatConversationWindow` in a new app:

1. Add `timelineReducer`, `chatSessionReducer`, `chatWindowReducer`, and `chatProfilesReducer`.
2. Install artifact projection middleware if HyperCard artifacts are needed.
3. Prefer explicit host-owned renderer injection for non-builtin entity kinds.
4. Add an integration test that feeds a real `timeline.upsert` envelope into the host store.

## Related

- [01-frontend-timeline-widget-registration-investigation-design-and-implementation-guide.md](../design-doc/01-frontend-timeline-widget-registration-investigation-design-and-implementation-guide.md)
- [02-card-cutover-fix-handoff-plan.md](../design-doc/02-card-cutover-fix-handoff-plan.md)
