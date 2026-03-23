---
Title: Card Cutover Fix Handoff Plan
Ticket: APP-06-FRONTEND-TIMELINE-REGISTRATION
Status: active
Topics:
    - frontend
    - chat
    - timeline
    - hypercard
    - wesen-os
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.tsx
      Note: Inventory host currently performs global hypercard chat module registration
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/components/ChatConversationWindow.tsx
      Note: Chat window currently resolves renderers only from the global registry
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelineMapper.ts
      Note: Generic chat runtime currently remaps hypercard.card.v2 into hypercard_card
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/renderers/types.ts
      Note: Shared renderer types that should gain an explicit host override seam
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts
      Note: Artifact/runtime-card extraction still supports both first-class and remapped legacy kinds
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx
      Note: Card renderer file still mixes live rendering code with legacy direct-SEM helpers
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/registerHypercardTimeline.ts
      Note: Global renderer registration helper to remove from the live inventory path
ExternalSources: []
Summary: Defines the direct cutover fix for the current inventory card rendering failure: remove widget scope, stop depending on global hypercard renderer registration, preserve hypercard.card.v2 end to end, and inject the card renderer explicitly from the host app.
LastUpdated: 2026-03-06T17:05:00-05:00
WhatFor: Use when handing off the concrete implementation work needed to fix inventory card rendering and simplify the frontend chat extension contract.
WhenToUse: Use instead of ad hoc debugging when the goal is to complete the card-only cutover with a clear end-state contract.
---

# Card Cutover Fix Handoff Plan

## Executive Decision

Do not spend more time debugging the current hybrid path.

The evidence already shows that:

- the backend projects `hypercard.card.v2` correctly
- the frontend receives `timeline.upsert`
- the frontend timeline mapper currently remaps that entity to `hypercard_card`
- the timeline store contains the entity and props
- the chat window still falls back to generic JSON rendering

That means the problem is no longer “can the frontend see the card.” The problem is “the final renderer resolution path is too indirect and too fragile.”

The cutover fix is therefore:

1. make `hypercard.card.v2` the only card timeline kind the live frontend cares about
2. remove widget scope from the live contract
3. stop relying on global HyperCard renderer registration for the card path
4. let the host app pass the card renderer explicitly into the chat window

This avoids the current class of failure entirely. If the inventory host passes the renderer directly, renderer selection no longer depends on module bootstrap order or shared mutable registry state.

## Final Target Contract

After the cutover, the live contract should be:

```text
inventory backend
  emits timeline.upsert(entity.kind = "hypercard.card.v2")

chat-runtime
  decodes timeline.upsert
  preserves entity.kind = "hypercard.card.v2"
  stores entity as-is in timeline state

inventory host
  renders ChatConversationWindow
  passes timelineRenderers = {
    "hypercard.card.v2": HypercardCardRenderer
  }

hypercard-runtime artifact layer
  derives artifact/runtime-card data from hypercard.card.v2

chat window
  resolves renderer directly for hypercard.card.v2
  renders card row
```

This means the following legacy elements are no longer part of the live path:

- `hypercard_card`
- `hypercard_widget`
- widget-first renderer registration
- HyperCard remap logic inside generic `timelineMapper.ts`
- inventory import-time registration of `registerHypercardTimelineModule()`
- direct-SEM card/widget projection helpers as a live dependency

## Why This Is The Right Fix

The current architecture has two distinct fragility points:

1. generic chat-runtime remaps a HyperCard-specific kind into a private alias kind
2. the inventory host depends on a global renderer registry being populated somewhere else

Your screenshots prove that steps 1 through 3 of the pipeline already work. The failure is step 4: choosing the card renderer.

The strongest fix is to make renderer ownership explicit at the host boundary. That gives the inventory app a normal React/TypeScript dependency on the card renderer instead of a hidden runtime dependency on a global registry side effect.

This also makes the handoff simpler:

- the median developer does not need to reason about two different card kinds
- the median developer does not need to reason about whether bootstrap ran in the same module instance
- the median developer does not need to keep widget code alive while touching the card path

## Non-Goals

This handoff deliberately does not try to solve everything.

Do not include the following in this implementation slice:

- generic `apps-browser` chat enablement
- widget support
- preserving `hypercard_card` as a backward-compatible public kind
- characterization tests for the old remap path
- broad chat-runtime plugin architecture redesign

Those can happen later. This slice is about fixing the live card path cleanly.

## Work Plan

## Phase 1: Add explicit host renderer injection

### Goal

Give `ChatConversationWindow` an explicit way for the host app to provide renderer overrides, so inventory can pass the card renderer directly instead of relying on global registration.

### Files

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/components/ChatConversationWindow.tsx`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/renderers/types.ts`

### Changes

- Add a new optional prop:
  - `timelineRenderers?: Partial<ChatWidgetRenderers>`
- Keep the existing global registry support for builtin renderers.
- Merge the renderer sources in this order:
  1. builtin/global registry resolution
  2. host-provided `timelineRenderers`
  3. `default`

The important rule is: host-provided renderers win.

### Pseudocode

```ts
export interface ChatConversationWindowProps {
  ...
  timelineRenderers?: Partial<ChatWidgetRenderers>;
}

const globalRenderers = useMemo(
  () => resolveTimelineRenderers(),
  [rendererRegistryVersion]
);

const renderers = useMemo(
  () => ({
    ...globalRenderers,
    ...(timelineRenderers ?? {}),
    default: timelineRenderers?.default ?? globalRenderers.default,
  }),
  [globalRenderers, timelineRenderers]
);
```

### Acceptance Criteria

- `ChatConversationWindow` can render a custom entity kind without any global registration helper.
- Existing builtin rows such as `message`, `tool_call`, `tool_result`, and `status` still work unchanged.

## Phase 2: Make inventory inject the card renderer directly

### Goal

Remove inventory’s live dependency on `registerHypercardTimelineModule()` and instead pass the card renderer explicitly.

### Files

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.tsx`

### Changes

- Stop importing:
  - `registerChatRuntimeModule`
  - `registerHypercardTimelineModule`
- Keep `ensureChatModulesRegistered()` for default chat SEM and builtin renderers.
- Import `HypercardCardRenderer` directly from `@hypercard/hypercard-runtime`.
- Pass:

```ts
timelineRenderers={{
  'hypercard.card.v2': HypercardCardRenderer,
}}
```

to each `ChatConversationWindow` instance owned by inventory.

### Pseudocode

```ts
import {
  ChatConversationWindow,
  ensureChatModulesRegistered,
} from '@hypercard/chat-runtime';
import { HypercardCardRenderer } from '@hypercard/hypercard-runtime';

ensureChatModulesRegistered();

<ChatConversationWindow
  ...
  timelineRenderers={{
    'hypercard.card.v2': HypercardCardRenderer,
  }}
/>
```

### Acceptance Criteria

- Inventory no longer registers HyperCard timeline renderers globally.
- Card rendering is owned explicitly by the inventory host.

## Phase 3: Remove HyperCard remap from generic chat-runtime

### Goal

Make generic chat-runtime preserve backend entity kinds exactly as received for the live card path.

### Files

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelineMapper.ts`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelineMapper.test.ts`

### Changes

- Delete the HyperCard-specific remap helpers:
  - `resultRecordFromProps(...)`
  - `runtimeCardFromResult(...)`
  - `remapHypercardEntity(...)`
  - `remapHypercardKind(...)`
- `timelineEntityFromProto(...)` should return the mapped entity directly with the original kind.
- Remove expectations for `hypercard_card` from tests.
- Replace them with expectations for `hypercard.card.v2`.

### Acceptance Criteria

- A `timeline.upsert` containing `entity.kind = hypercard.card.v2` remains `hypercard.card.v2` in Redux timeline state.
- Generic chat-runtime no longer contains live HyperCard card remap code.

## Phase 4: Cut artifact/runtime-card extraction to the first-class kind

### Goal

Make the HyperCard artifact layer operate on `hypercard.card.v2` directly.

### Files

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.test.ts`

### Changes

- Remove special handling for:
  - `hypercard_card`
  - `hypercard_widget`
  - widget-specific extraction branches
- Keep only first-class card extraction from:
  - direct `hypercard.card.v2` SEM payloads where still needed
  - `timeline.upsert` entities with `kind = hypercard.card.v2`
  - timeline entity props for `kind = hypercard.card.v2`
- Preserve extraction of:
  - `artifactId`
  - `runtimeCardId`
  - `runtimeCardCode`

### Acceptance Criteria

- Artifact projection middleware can still derive runtime-card state from a `hypercard.card.v2` timeline entity.
- No production code path depends on `hypercard_card`.

## Phase 5: Remove widget and legacy direct-SEM frontend paths

### Goal

Drop the obsolete widget and direct-SEM compatibility surface from the live frontend contract.

### Files

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/registerHypercardTimeline.ts`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardWidget.tsx`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/index.ts`
- any tests importing widget helpers

### Changes

- Remove `HypercardWidgetRenderer` from the live package surface.
- Remove `registerHypercardWidgetSemHandlers()` and `registerHypercardCardSemHandlers()` unless another live caller still exists.
- Either delete `registerHypercardTimeline.ts` entirely or reduce it to a deprecated compatibility helper not used by inventory.
- Keep `HypercardCardRenderer`, but make it renderer-only.

### Acceptance Criteria

- No live inventory code imports widget renderer or widget registration helpers.
- Card rendering code is no longer mixed with legacy direct-SEM registration helpers.

## Phase 6: Update debug tooling to reflect the new truth

### Goal

Ensure debug windows show the first-class card kind instead of private aliases.

### Files

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/debug/TimelineDebugWindow.tsx`
- any helper used to color or label timeline kinds

### Changes

- Remove `hypercard_card` and widget-specific color assumptions.
- Add or keep styling for `hypercard.card.v2`.
- Make screenshots and developer debugging reflect the same kind names the backend emits.

### Acceptance Criteria

- Timeline Debug displays `hypercard.card.v2` directly.
- There is no hidden remapped kind to mentally translate.

## Phase 7: Add only end-state tests

### Goal

Add tests for the final contract only. Do not harden the old remap API.

### Files

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/components/ChatConversationWindow...`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/...`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.test.ts`

### Tests To Add

- one chat-runtime test proving host-provided `timelineRenderers` overrides work
- one inventory host-level integration test:
  - inject a `timeline.upsert` with `kind = hypercard.card.v2`
  - render `ChatConversationWindow`
  - assert the card row renders via `HypercardCardRenderer`
- one artifact-runtime test proving runtime-card fields still extract from `hypercard.card.v2`
- one small regression test that builtin `tool_call` rendering still works after the cutover

### Tests Not To Add

- no tests asserting `hypercard_card`
- no tests asserting widget compatibility
- no tests preserving `registerHypercardTimelineModule()` in inventory

## Phase 8: Manual validation

### Goal

Confirm the live inventory app matches the new contract.

### Procedure

1. Run `wesen-os`.
2. Open inventory chat.
3. Trigger a prompt that produces a runtime card.
4. Open Event Viewer.
5. Open Timeline Debug.
6. Confirm the following:

- Event Viewer shows `timeline.upsert` with `entity.kind = hypercard.card.v2`
- Timeline Debug shows an entity with `kind = hypercard.card.v2`
- the chat window shows a card row rendered by `HypercardCardRenderer`
- the chat window no longer falls back to generic JSON for the card row
- Open/Edit actions still work
- builtin `tool_call` rows still render normally

## Implementation Order

Use this order. Do not reorder casually.

1. Add `timelineRenderers` prop to `ChatConversationWindow`
2. Switch inventory to pass `HypercardCardRenderer` explicitly
3. Verify the card renders before deleting remap code
4. Remove HyperCard remap from `timelineMapper.ts`
5. Update artifact/runtime-card extraction to first-class kind only
6. Delete widget and legacy direct-SEM frontend paths
7. Add final-contract tests
8. Perform manual validation

This order matters because it keeps the app working while removing legacy layers one by one.

## Risks

### Risk 1: another host still depends on global HyperCard renderer registration

Mitigation:

- search for all imports of `registerHypercardTimelineModule`
- if other hosts exist, migrate them in the same slice or leave a deprecated compatibility helper temporarily

### Risk 2: artifact projection still expects remapped kinds

Mitigation:

- update `artifactRuntime.ts` in the same slice as `timelineMapper.ts`
- do not remove the remap first and leave artifact extraction stale

### Risk 3: a runtime card path still depends on direct SEM events

Mitigation:

- grep for `registerHypercardCardSemHandlers` and `registerHypercardWidgetSemHandlers`
- if no live callers remain, delete them

## Handoff Summary

If you give this to a median developer, the instruction should be:

“Implement a card-only cutover. Preserve `hypercard.card.v2` end to end, add an explicit `timelineRenderers` prop to `ChatConversationWindow`, make inventory pass `HypercardCardRenderer` directly, remove HyperCard remap logic from generic chat-runtime, delete widget and legacy direct-SEM frontend paths, and add only final-contract tests.”
