---
Title: Frontend Timeline Widget Registration Investigation, Design, and Implementation Guide
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
    - Path: ../../../../../../../pinocchio/pkg/webchat/timeline_projector.go
      Note: Generic backend projection for message/tool timeline entities
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/app/store.ts
      Note: Inventory host store includes chat reducers and uses shared hypercard app store
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.tsx
      Note: Inventory launcher explicitly registers hypercard timeline runtime module
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go
      Note: Inventory backend projects hypercard lifecycle events into timeline entities
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/app/store.ts
      Note: Apps-browser host store is not yet chat-capable
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/renderers/rendererRegistry.ts
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/runtime/moduleBootstrap.ts
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/runtime/registerChatModules.ts
      Note: Default chat runtime bootstrap for SEM handlers and builtin renderers
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/semRegistry.ts
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelineMapper.ts
      Note: Generic timeline transport mapper currently contains hypercard-specific remap logic
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelinePropsRegistry.ts
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/app/createAppStore.ts
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts
      Note: Middleware projects hypercard timeline entities into artifact/runtime-card state
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardWidget.tsx
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/registerHypercardTimeline.ts
      Note: Hypercard timeline renderers are registered here
ExternalSources: []
Summary: Explains the end-to-end frontend timeline entity path for chat artifacts, shows where current registration and store wiring can fail, and proposes a clearer extension-based design for future chat-enabled host apps.
LastUpdated: 2026-03-06T11:40:00-05:00
WhatFor: Use when investigating why backend-projected timeline entities like hypercard.card.v2 or tool_call do not render correctly in frontend chat windows, or when designing a reusable chat-enabled frontend host architecture.
WhenToUse: Use before implementing chat windows in new host apps such as apps-browser, or when auditing renderer registration, timeline mapping, and artifact projection behavior.
---


# Frontend Timeline Widget Registration Investigation, Design, and Implementation Guide

## Executive Summary

This ticket investigates why timeline entities such as `hypercard.card.v2`, and possibly `tool_call` / `tool_result`, can be present on the backend but still fail to appear correctly in the frontend chat window.

The short answer is that there is not one registration step. There are several:

1. The backend must project domain events into durable timeline entities.
2. The frontend chat runtime must decode `timeline.upsert` and map transport entities into UI entities.
3. The frontend renderer registry must know how to render the resulting entity `kind`.
4. The host Redux store must actually contain the chat reducers and, for HyperCard artifacts, the artifact projection middleware.

Today those responsibilities are spread across multiple packages and a mix of explicit APIs and module-import side effects:

- backend projection is explicit and seems healthy
- frontend renderer registration is global and side-effect based
- HyperCard entity remapping is hardcoded inside generic chat-runtime code
- artifact projection depends on store middleware
- launcher host stores are not uniformly wired

Scope note: widget support is out of scope for the target cutover. The ticket should be read as a card-first investigation and cleanup plan. Widget paths remain relevant only as legacy evidence of how the architecture drifted.

The investigation result is that the frontend architecture works in isolated package tests but is fragile at real host-app boundaries. Inventory is wired correctly because it uses a dedicated store and import-time bootstrap. `apps-browser` is not wired as a chat-capable host today, and future generic “chat with app” work will hit this immediately unless the frontend chat/timeline stack is made explicit and reusable.

## Problem Statement

The user symptom is: “the backend seems to properly project to `hypercard.card`, but the frontend timeline renderer for card or maybe tool call does not look registered anymore.”

That symptom can mean several different failures:

- a timeline entity exists in Redux, but the renderer registry has no renderer for that `kind`
- the entity is being remapped into a different `kind` than expected
- the renderer exists, but the host store is missing artifact projection middleware, so follow-on runtime-card behavior never happens
- the chat reducers are missing entirely, so the conversation window cannot consume the timeline state
- legacy direct-SEM paths and current backend-driven `timeline.upsert` paths are being confused

This ticket is therefore not just “re-register a card renderer.” It is an architecture ticket about how frontend chat extensions are mounted, discovered, tested, and reused.

For a new intern, the most important mental model is:

```text
Backend event emitted
  -> backend timeline projector persists entity
  -> websocket emits timeline.upsert
  -> frontend SEM handler decodes it
  -> frontend mapper may remap its kind/props
  -> Redux timeline state stores it
  -> optional middleware projects artifact/runtime-card side state
  -> ChatConversationWindow resolves renderer by entity.kind
  -> actual card/tool row appears
```

If any one of those steps is not wired, “the backend emitted the right thing” is still not enough.

## Proposed Solution

The proposed solution has two layers.

### Layer 1: Immediate stabilization

Make the current system observable, explicit, and testable without changing the product contract yet.

- Add real host-level integration coverage for chat windows.
- Define one explicit “chat-enabled host store” recipe instead of copy/paste store wiring.
- Make HyperCard timeline registration visible and centralized.
- Audit and remove dead frontend registration paths that are no longer part of the live contract.

### Layer 2: Architectural cleanup

Move from today’s hybrid design:

- generic chat runtime has hardcoded HyperCard mapping logic
- HyperCard runtime registers renderers globally
- HyperCard runtime still exports unused direct-SEM reducers
- artifact projection is implicit store middleware

to a clearer extension model:

```text
chat-runtime
  owns:
    - generic SEM decoding
    - generic timeline state
    - builtin generic renderers (message/tool/status/log)
    - extension registration surface

hypercard-runtime
  owns:
    - hypercard entity remap rules
    - hypercard renderers
    - hypercard artifact projection
    - runtime-card side effects

host app
  owns:
    - whether it is chat-enabled
    - which extensions it installs
    - which store bundle it uses
```

The key design change is: do not let HyperCard-specific timeline remap logic live silently in generic chat-runtime forever.

## Current System Map

### 1. Backend projection

Generic Pinocchio tool events are projected by the core timeline projector in [timeline_projector.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/pinocchio/pkg/webchat/timeline_projector.go).

- `tool.start` becomes `tool_call` at lines 254-271.
- `tool.done` updates `tool_call` at lines 273-286.
- `tool.result` becomes `tool_result` at lines 288-315.

Inventory-specific HyperCard events are projected separately in [hypercard_events.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go).

- status events like `hypercard.card.start` and `hypercard.card.update` become `status` entities at lines 300-354.
- final card result events become first-class timeline kind `hypercard.card.v2` at lines 356-376.

This means the backend is not sending only raw SEM. It is already doing durable timeline projection.

### 2. Frontend chat runtime bootstrap

The generic chat runtime bootstrap lives in [registerChatModules.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/runtime/registerChatModules.ts).

- default SEM handlers are registered at lines 8-12
- default renderers are registered at lines 13-16
- `ensureChatModulesRegistered()` runs the bootstrap at lines 19-21

The underlying bootstrap machinery is in [moduleBootstrap.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/runtime/moduleBootstrap.ts).

Important behavior:

- modules are registered by string id
- `ensureRegistered()` runs each module once
- modules added after bootstrap execute immediately

This is convenient, but it is still global mutable registration state.

### 3. Frontend SEM decode and timeline mapping

The default frontend `timeline.upsert` handler is in [semRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/semRegistry.ts).

- `registerDefaultSemHandlers()` installs the `timeline.upsert` consumer at lines 315-330
- it decodes `TimelineUpsertV2`
- it calls `timelineEntityFromProto(...)`
- then upserts the resulting entity into Redux

The main mapping logic is in [timelineMapper.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelineMapper.ts).

Important findings:

- `tool_result` has a builtin props normalizer path via [timelinePropsRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelinePropsRegistry.ts) lines 8-16
- but HyperCard is not handled via that registry
- instead, `timelineMapper.ts` hardcodes HyperCard remapping:
  - `hypercard.widget.v1` becomes `hypercard_widget` at lines 115-130
  - `hypercard.card.v2` becomes `hypercard_card` at lines 134-149
  - remap dispatch happens at lines 152-175

This is the first major architectural smell: generic chat-runtime already knows about a specific frontend extension package. For the card cutover, that means generic chat code is currently responsible for part of the HyperCard card contract.

### 4. Frontend renderer resolution

The renderer registry lives in [rendererRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/renderers/rendererRegistry.ts).

- builtin renderers are only:
  - `message`
  - `tool_call`
  - `tool_result`
  - `status`
  - `log`
- see lines 9-15

So:

- tool-call rendering should work whenever default chat modules are installed
- HyperCard card rows require extra renderer registration

That extra registration is in [registerHypercardTimeline.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/registerHypercardTimeline.ts) lines 5-9.

It registers renderers for:

- `hypercard_widget`
- `hypercard_card`
- `hypercard.widget.v1`
- `hypercard.card.v2`

For the card cutover, the important mismatch is:

- current live mapping remaps `hypercard.card.v2` into `hypercard_card`
- yet the renderer module still registers both the remapped and unmapped kinds

That redundancy is harmless, but it signals historical drift.

### 5. HyperCard artifact projection

Rendering a HyperCard row is not the whole story. Runtime-card behavior depends on artifact projection middleware in [artifactProjectionMiddleware.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts).

That middleware:

- listens to `timelineSlice.actions.addEntity` at lines 35-40
- listens to `upsertEntity` at lines 42-47
- listens to snapshot application at lines 49-64
- derives artifact state and registers runtime cards when possible

This means a host store can successfully render a timeline row but still fail to open/edit/runtime-launch artifacts if it lacks this middleware.

### 6. Host-store wiring

This is the second major fault line.

Inventory store setup in [store.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/app/store.ts) is chat-capable:

- includes `timeline`, `chatSession`, `chatWindow`, and `chatProfiles` reducers at lines 12-21
- uses `createAppStore(...)` from HyperCard runtime, which adds artifact projection middleware at [createAppStore.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/app/createAppStore.ts) lines 74-82

`apps-browser` store setup in [store.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/app/store.ts) is not chat-capable today:

- it includes `hypercardArtifacts` reducer, but not `timeline`, `chatSession`, `chatWindow`, or `chatProfiles`
- it does not install artifact projection middleware
- see lines 11-26

This is crucial for future app-chat work. `apps-browser` can host docs and metadata windows today, but it is not yet a chat-enabled host store.

## Findings

### Finding A: Backend card projection looks correct

The backend already projects HyperCard card result events into timeline entities with kind `hypercard.card.v2` in [hypercard_events.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go#L356).

This supports the user report that backend output is likely not the issue.

### Finding B: Default chat rendering for tool calls is generic and separate

Tool calls and tool results are not part of HyperCard registration. They are part of generic Pinocchio + chat-runtime:

- backend generic projection: [timeline_projector.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/pinocchio/pkg/webchat/timeline_projector.go#L254)
- frontend builtin renderers: [rendererRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/renderers/rendererRegistry.ts#L9)

So if `tool_call` looks unregistered in a live UI, the likely failure is not “HyperCard registration broke.” It is either:

- default chat modules were not bootstrapped
- the host store is not chat-enabled
- or a future richer tool renderer was expected but not implemented

### Finding C: HyperCard card support has overlapping extension mechanisms

There are at least three separate HyperCard frontend mechanisms today:

1. renderer registration in [registerHypercardTimeline.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/registerHypercardTimeline.ts#L5)
2. hardcoded entity remapping in [timelineMapper.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelineMapper.ts#L99)
3. dead-looking direct SEM handlers in:
   - [hypercardCard.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx#L51)
   - plus widget-side code that is now outside the intended scope

The direct card SEM handler is not referenced anywhere in the current workspace. It appears to be legacy from the earlier frontend-driven projection model.

### Finding D: Tests pass, but they validate the pieces in isolation

The following tests pass:

- `packages/chat-runtime/src/chat/runtime/registerChatModules.test.ts`
- `packages/hypercard-runtime/src/hypercard/timeline/hypercardWidget.test.ts`
- `packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.test.ts`
- `apps/apps-browser/src/launcher/module.test.tsx`

But the coverage gap is important:

- HyperCard runtime tests create an ad-hoc store that manually includes `timeline`, `chatSession`, `hypercardArtifacts`, and the artifact projection middleware.
- `apps-browser` launcher tests do not render a chat window at all.

So the tests prove the components work individually, but they do not prove that a real launcher host is wired to support them.

## Failure Matrix

Use this table when debugging a live issue.

| Symptom | Most likely missing piece | Evidence file |
| --- | --- | --- |
| No tool calls, no messages, no status rows | host store missing chat reducers or chat window not mounted | [apps-browser store](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/app/store.ts) |
| Messages render, but `hypercard.card` shows as generic JSON | HyperCard card renderer module not registered | [registerHypercardTimeline.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/registerHypercardTimeline.ts) |
| HyperCard row renders, but open/edit/runtime-card behavior fails | artifact projection middleware missing | [artifactProjectionMiddleware.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts) |
| `tool_call` also looks generic or missing | default chat module bootstrap missing | [registerChatModules.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/runtime/registerChatModules.ts) |
| HyperCard entity kind is unexpected (`hypercard_card` vs `hypercard.card.v2`) | frontend remap transformed the kind | [timelineMapper.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelineMapper.ts) |

## Why This Is Confusing Today

An intern reading the code can easily reach the wrong conclusion for at least three reasons.

### Reason 1: “Registration” is not one thing

There is no single API that means “HyperCard chat support is installed.”

Instead, support is split across:

- backend timeline handler registration
- frontend SEM handler bootstrap
- frontend renderer bootstrap
- host store reducer assembly
- host store middleware assembly

### Reason 2: generic chat-runtime contains HyperCard-specific code

This violates the package story. A developer expects HyperCard behavior to live in `@hypercard/hypercard-runtime`, but part of the live behavior is in [timelineMapper.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelineMapper.ts).

### Reason 3: dead code suggests an older model still exists

The `registerHypercardCardSemHandlers()` function still exists, and it projects direct SEM into timeline state. But the live path is backend-driven `timeline.upsert`. Leaving both models in the codebase makes it harder to know what is actually active.

## Recommended Target Design

### Design goals

- one explicit way to make a host app chat-capable
- one explicit way to install timeline extensions
- no HyperCard-specific mapping code in generic chat-runtime
- no unused direct-SEM projection helpers
- tests that prove real launcher/store integration, not only package internals

### Proposed frontend contracts

#### A. Chat-capable store assembly

Introduce a shared store helper with a name like:

- `createChatEnabledStore(...)`
- or `withChatRuntimeStore(...)`

It should own:

- `timelineReducer`
- `chatSessionReducer`
- `chatWindowReducer`
- optionally `chatProfilesReducer`
- artifact projection middleware for installed extensions

Pseudocode:

```ts
const { reducer, middleware } = createChatEnabledStoreBundle({
  profiles: true,
  extensions: ['hypercard'],
});

configureStore({
  reducer: {
    ...baseReducers,
    ...reducer,
  },
  middleware: (getDefault) => getDefault().concat(...middleware),
});
```

#### B. Timeline extension registration

Introduce a proper extension surface instead of mixing remap logic, renderers, and store middleware in unrelated files.

Pseudocode:

```ts
interface ChatTimelineExtension {
  id: string;
  registerRenderers?: () => void;
  registerPropsNormalizers?: () => void;
  registerEntityTransforms?: () => void;
  createMiddleware?: () => Middleware[];
}

registerChatTimelineExtension(hypercardExtension);
```

#### C. Entity transform hook

The most important missing extension seam is entity remapping.

Today:

- `normalizeTimelineProps(kind, props)` is extensible
- entity-kind remapping is not extensible

That is why HyperCard remap ended up hardcoded in generic chat-runtime.

Instead, add an extension hook:

```ts
type TimelineEntityTransform = (entity: TimelineEntity) => TimelineEntity;

registerTimelineEntityTransform('hypercard-card', (entity) => {
  if (entity.kind === 'hypercard.card.v2') return remapCard(entity);
  return entity;
});
```

Then `timelineEntityFromProto(...)` becomes generic:

```ts
const mapped = {
  id,
  kind,
  props: normalizeTimelineProps(kind, props),
};
return applyTimelineEntityTransforms(mapped);
```

#### D. Remove legacy direct-SEM projection helpers

Unless a specific fallback mode still depends on them, remove:

- `registerHypercardWidgetSemHandlers()`
- `registerHypercardCardSemHandlers()`

from the active frontend surface.

If they must stay temporarily, mark them clearly as legacy and document when they should be used.

## Detailed Migration Plan

### Phase 1: Reproduce and pin down the live card failure

Goal: know exactly which layer is broken in the live app.

Tasks:

1. Reproduce with a real inventory conversation that emits:
   - at least one `tool_call`
   - at least one `hypercard.card.v2`
2. Inspect Redux state and determine whether entities exist.
3. Inspect entity `kind` values after frontend mapping.
4. Inspect renderer registry contents at runtime.
5. Inspect whether artifact side state exists in `hypercardArtifacts`.

Debug checklist:

```text
If timeline.byConvId[convId] is empty:
  problem is before rendering

If entity exists with kind=hypercard_card but UI shows GenericRenderer:
  renderer registry missing HyperCard renderer

If entity renders but no artifact/runtime-card behavior:
  store middleware missing

If tool_call also missing:
  default chat bootstrap/store wiring likely broken
```

### Phase 2: Add end-state integration tests

Important cutover rule:

- do not add tests that freeze the current intermediate architecture just because it exists today
- only add tests for the contract that should still exist after the cutover

Add tests that use a real host store, not only package-local mock stores.

Minimum new tests:

1. Inventory launcher/store integration test:
   - mount `ChatConversationWindow`
   - feed `timeline.upsert` with `hypercard.card.v2`
   - assert rendered `Card:` row appears
   - assert `hypercardArtifacts` contains the artifact

2. Inventory launcher/store integration test for `tool_call`:
   - feed `timeline.upsert` for `tool_call`
   - assert builtin tool renderer appears

3. Apps-browser negative test:
   - assert current store is not chat-capable
   - document failure mode explicitly

4. Future apps-browser positive test after store migration:
   - chat window renders inside apps-browser host store

### Phase 3: Factor store wiring into a shared bundle

Move host-store chat wiring out of app-local assembly.

Current contrast:

- inventory: correct chat reducers and middleware in [inventory store](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/app/store.ts)
- apps-browser: non-chat host store in [apps-browser store](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/app/store.ts)

Deliverable:

- one reusable helper that both inventory and future app-chat hosts can consume

### Phase 4: Move HyperCard remap out of generic chat-runtime

This is the main cleanup step.

Tasks:

1. Add extension-based entity transform registration in chat-runtime.
2. Move HyperCard remap code out of `timelineMapper.ts`.
3. Register HyperCard transforms from hypercard-runtime.
4. Keep backward-compat tests green.

### Phase 5: Delete or quarantine dead legacy paths

Audit and likely remove:

- `registerHypercardCardSemHandlers()`

If they are kept:

- rename them to make their status explicit
- add comments explaining they are legacy SEM-direct projection, not the preferred backend-driven path

## Design Decisions

### Decision 1: Treat store wiring as part of chat enablement

Rationale:

- a renderer-only registration story is incomplete
- artifact projection and timeline state are required for real behavior

### Decision 2: Keep builtin generic kinds in chat-runtime

Builtin generic kinds belong in chat-runtime:

- `message`
- `tool_call`
- `tool_result`
- `status`
- `log`

Rationale:

- these are cross-domain chat primitives
- they should not depend on HyperCard

### Decision 3: Move domain-specific kind remapping out of chat-runtime

Rationale:

- it keeps the generic package honest
- it avoids invisible domain coupling
- it makes future app-chat extensions possible without editing core chat code

### Decision 4: Prefer backend-driven timeline projection

Rationale:

- it is durable and hydrates cleanly
- it survives reconnects
- it avoids two competing frontend state models

## Alternatives Considered

### Alternative A: Just re-register renderers in more places

Rejected because it would only paper over one possible failure mode. It would not solve:

- missing chat reducers
- missing artifact projection middleware
- hidden HyperCard-specific remap logic

### Alternative B: Put all extension logic into chat-runtime

Rejected because it would make every app-specific timeline extension a core-package edit.

### Alternative C: Keep direct SEM projection helpers as fallback

Rejected as the primary model because it duplicates backend projection and makes hydration/reconnect semantics harder.

## Implementation Plan

### Deliverables

- one research ticket with this guide
- a host-level reproduction and debugging checklist
- a concrete task list for wiring and cleanup
- follow-up implementation PRs in:
  - `go-go-os-frontend`
  - `go-go-app-inventory`
  - possibly `apps-browser`

### Suggested implementation order

1. Add integration tests before cleanup.
2. Add temporary debug visibility needed to observe the live card path.
3. Create shared chat-enabled store bundle.
4. Migrate inventory to the shared bundle with no behavior change.
5. Add apps-browser chat-capable host support for future app-chat work.
6. Introduce extension entity-transform API.
7. Move card remap out of chat-runtime.
8. Delete legacy direct-SEM handlers.

### Review checklist for the intern

- Can you point to the exact reducer slice that stores timeline entities?
- Can you explain why `tool_call` is generic but `hypercard_card` is extension-owned?
- Can you show where runtime-card registration happens?
- Can you explain why `apps-browser` is not yet a chat-capable host?
- Can you explain why `timelineMapper.ts` is currently the wrong long-term home for HyperCard remap logic?

## Open Questions

1. Should `hypercard_card` remain the canonical frontend UI kind, or should the renderer bind directly to `hypercard.card.v2`?
2. Do we still need the direct SEM helper function in the card renderer file for any storybook or fallback scenario?
3. Should `apps-browser` adopt a shared chat-enabled store bundle now, or only when APP-05 generic app-chat bootstrap work begins?
4. Do we want richer builtin renderers for `tool_call` / `tool_result` than the current minimal JSON views?

## References

### Core backend files

- [timeline_projector.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/pinocchio/pkg/webchat/timeline_projector.go)
- [hypercard_events.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go)

### Core frontend files

- [registerChatModules.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/runtime/registerChatModules.ts)
- [moduleBootstrap.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/runtime/moduleBootstrap.ts)
- [semRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/semRegistry.ts)
- [timelineMapper.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelineMapper.ts)
- [rendererRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/renderers/rendererRegistry.ts)
- [ChatConversationWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/components/ChatConversationWindow.tsx)

### HyperCard extension files

- [registerHypercardTimeline.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/registerHypercardTimeline.ts)
- [artifactProjectionMiddleware.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts)
- [hypercardWidget.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardWidget.tsx)
- [hypercardCard.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx)

### Host store files

- [inventory store](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/app/store.ts)
- [apps-browser store](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/app/store.ts)

### Relevant tests

- [registerChatModules.test.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/runtime/registerChatModules.test.ts)
- [timelineMapper.test.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/sem/timelineMapper.test.ts)
- [hypercardWidget.test.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardWidget.test.ts)
- [hypercardCard.test.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.test.ts)
