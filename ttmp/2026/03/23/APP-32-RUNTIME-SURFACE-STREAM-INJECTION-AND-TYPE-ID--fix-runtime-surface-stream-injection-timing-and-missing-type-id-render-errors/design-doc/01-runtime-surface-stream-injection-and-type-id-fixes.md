---
Title: Runtime surface stream injection and type-id fixes
Ticket: APP-32-RUNTIME-SURFACE-STREAM-INJECTION-AND-TYPE-ID
Status: active
Topics:
    - bugfix
    - frontend
    - hypercard
    - runtime
    - wesen-os
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go
      Note: Maps streaming and final hypercard card SEM events into timeline entity status values
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts
      Note: Immediately registers runtime surfaces from projected artifact upserts today
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts
      Note: Extracts runtimeSurfaceId, runtimeSurfaceCode, and optional packId from card timeline payloads
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts
      Note: Global registry that injects all registered runtime surfaces into sessions
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Injects pending surfaces into live sessions and resolves pack ids during render
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx
      Note: Throws when packId is missing and defines the default ui.card.v1 surface type id
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.chat.test.tsx
      Note: Existing inventory chat projection tests can be extended to cover these bugs
ExternalSources: []
Summary: Detailed implementation guide for fixing early runtime-surface injection during card streaming and missing default runtime surface type ids when opening projected card artifacts.
LastUpdated: 2026-03-23T14:45:00-04:00
WhatFor: Help a new engineer understand the hypercard card streaming pipeline and implement the two small runtime-surface fixes safely.
WhenToUse: Use when changing inventory chat artifact projection, runtime surface injection timing, or runtime surface type resolution.
---

# Runtime surface stream injection and type-id fixes

## Executive Summary

Inventory chat currently has two adjacent runtime-surface bugs, and the clean fix requires one contract-tightening step.

The first bug happens during streaming. A `hypercard.card.update` event produces a timeline entity whose payload contains partial card code and whose `status` is explicitly marked as `streaming`. The frontend artifact projection middleware currently ignores that status and immediately registers the `runtimeSurfaceId` and `runtimeSurfaceCode` with the global runtime-surface registry. As soon as the registry changes, every live runtime host tries to inject the code into QuickJS. If the code is still partial, QuickJS sees invalid JavaScript and throws syntax errors such as `SyntaxError: expecting '}'`.

The second bug happens when the user opens the card artifact. The runtime host eventually needs a runtime surface type id, also called a `packId`, so it can validate and render the tree returned by the runtime surface. The current system inconsistently allows some runtime-surface definitions to omit `packId` and then tries to recover later. That is what eventually produces `Runtime surface type id is required`.

These bugs are related because they both live in the same runtime-surface pipeline:

```text
SEM card event
  -> timeline entity
  -> artifact projection
  -> runtime surface registry
  -> runtime session host
  -> QuickJS injection
  -> runtime render/type resolution
```

The fix should be small and direct:

- do not register/inject runtime surfaces while the card entity is still marked `streaming`,
- keep streaming timeline rendering intact so the user still sees card progress in chat,
- require emitted and injected runtime surfaces to carry an explicit `packId`,
- remove hidden defaulting for missing pack ids instead of adding more fallback.

## The System To Understand First

### 1. Backend card streaming becomes timeline status

Inventory backend code maps SEM events into timeline entities in [hypercard_events.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go).

The important distinction is:

- `hypercard.card.update` becomes a timeline entity with `status: "streaming"`
- `hypercard.card.v2` becomes a timeline entity with `status: "success"`

That means the backend already tells the frontend whether the card is still incomplete or final.

Pseudocode:

```text
if event.type == "hypercard.card.update":
  props.status = "streaming"
if event.type == "hypercard.card.v2":
  props.status = "success"
```

This status field is the most obvious gating signal for the registration fix.

### 2. Artifact projection currently ignores streaming status

Frontend artifact extraction happens in [artifactRuntime.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts). It pulls out:

- `runtimeSurfaceId`
- `runtimeSurfaceCode`
- optional `packId`

Then [artifactProjectionMiddleware.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts) does two things for every projected card:

1. upserts the artifact record into Redux
2. if `runtimeSurfaceId` and `runtimeSurfaceCode` exist, immediately calls `registerRuntimeSurface(...)`

There is currently no check for `status === "streaming"`.

Current shape:

```text
projectArtifactFromEntity(entity):
  upsertArtifact(...)
  if runtimeSurfaceId && runtimeSurfaceCode:
    registerRuntimeSurface(...)
```

That is why partial streamed code gets injected too early.

### 3. Runtime-surface registration fans out to every live session

The global registry lives in [runtimeSurfaceRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts).

This registry is intentionally simple:

- `registerRuntimeSurface(...)` stores the surface definition and notifies listeners
- `injectPendingRuntimeSurfacesWithReport(...)` iterates every registered surface and calls `defineRuntimeSurface(...)`

The runtime host subscribes to those registry changes in [RuntimeSurfaceSessionHost.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx). When a new surface arrives, it immediately tries to define it in the live QuickJS session.

That means the failure is deterministic:

```text
partial code registered
  -> registry change
  -> runtime host listener fires
  -> defineSurface(surfaceId, partialCode)
  -> QuickJS parse error
```

### 4. The runtime still defaults pack ids in some places

The runtime-surface type registry in [runtimeSurfaceTypeRegistry.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx) defines:

- `DEFAULT_RUNTIME_SURFACE_TYPE_ID = 'ui.card.v1'`

But it also throws if `packId` is missing:

```text
normalizeRuntimeSurfaceTypeId(undefined) -> Error("Runtime surface type id is required")
```

Elsewhere in the runtime stack, defaulting already exists. The VM bootstrap currently turns missing pack ids into `ui.card.v1`. That means the system sends mixed signals:

- some emitters omit `packId`,
- some runtime paths silently invent `ui.card.v1`,
- some render paths crash because they insist on a real `packId`.

That inconsistency is what produces the second user-visible error. The correct fix is to stop allowing missing pack ids, not to add another fallback at the render layer.

## Problem 1: Early Injection Of Streaming Card Code

### What the user sees

- the chat shows a streaming card
- the runtime host logs repeated `Live-injected ... runtime surfaces`
- QuickJS logs parse failures like `SyntaxError: expecting '}'`

### Why it happens

`hypercard.card.update` is supposed to be preview state. The UI renderer for the timeline card already treats streaming specially in [hypercardCard.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx):

- `Open` is disabled while `status === "streaming"`
- `Edit` is disabled while `status === "streaming"`

So the product-level rule already exists: a streaming card is not yet executable/openable. The artifact projection layer simply has not adopted the same rule.

### Target behavior

Streaming cards should still appear in the chat timeline with highlighted partial code, but they should not be registered as executable runtime surfaces until the final `hypercard.card.v2` entity arrives.

### Recommended implementation

Add a completion gate in the artifact projection path. The simplest rule is:

- always upsert the artifact record for display/debug purposes,
- only call `registerRuntimeSurface(...)` when the entity status is final,
- treat `status: "streaming"` and `status: "pending"` as not executable.

Pseudocode:

```ts
const status = extractCardStatus(entity.props);

dispatch(upsertArtifact(...));

if (status === 'streaming' || status === 'pending') {
  return;
}

if (upsert.runtimeSurfaceId && upsert.runtimeSurfaceCode) {
  registerRuntimeSurface(upsert.runtimeSurfaceId, upsert.runtimeSurfaceCode, upsert.packId);
}
```

### Why this is the right level

- It keeps the fix local to the projection boundary.
- It uses the status contract already emitted by the backend.
- It does not require the runtime registry to understand partial code.
- It preserves timeline preview rendering for the user.

## Problem 2: Missing Runtime Surface Type Id On Open

### What the user sees

When opening the artifact window, the runtime host can render:

```text
Runtime render error: Runtime surface type id is required
```

### Why it happens

`RuntimeSurfaceSessionHost` resolves the pack id with this logic:

```text
runtimeSurface.packId ?? runtimeBundle.surfaceTypes[surfaceId]
```

and then immediately normalizes it.

If neither source contains a pack id, `normalizeRuntimeSurfaceTypeId(...)` throws. That is stricter than the rest of the runtime system, which already has an implicit default surface type id for ordinary cards.

### Target behavior

Every executable runtime surface should have an explicit `packId` before it reaches runtime registration, injection, or render.

### Recommended implementation

Tighten the contract in three places:

1. the inventory card prompt must require `runtime.pack` even for ordinary `ui.card.v1` cards,
2. artifact extraction and runtime registration should reject executable card definitions that omit `packId`,
3. runtime bootstrap should stop inventing `ui.card.v1` for missing pack ids.

### Why this is consistent

- it prevents bad card payloads from surviving until render time,
- it makes the protocol explicit,
- it removes one of the hidden fallback paths that currently obscures the real source of the bug.

## Suggested Implementation Order

### Phase 1: Lock down the failing behavior in tests

Add tests that demonstrate:

- streaming card entities create or update artifacts but do not register/inject runtime surfaces yet,
- final card entities do register the runtime surface,
- rendering an opened artifact without explicit `packId` uses `ui.card.v1` successfully.

Likely test files:

- [artifactProjectionMiddleware.test.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.test.ts)
- [runtimeSurfaceRegistry.test.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.test.ts)
- [RuntimeSurfaceSessionHost.rerender.test.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx)
- [renderInventoryApp.chat.test.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.chat.test.tsx)

### Phase 2: Gate registration on final status

Update the artifact projection code so the runtime surface is only registered when the card is final.

### Phase 3: Tighten the pack-id contract

Require `runtime.pack` for emitted cards, require `packId` for dynamic runtime surface definition, and remove implicit defaulting from runtime bootstrap/meta generation.

### Phase 4: Validate with focused frontend test runs

Run the narrow test set first, then the broader inventory frontend chat tests.

## Diagram

```text
Before
------
hypercard.card.update (streaming, partial code)
  -> timeline entity
  -> project artifact
  -> registerRuntimeSurface(partial code)
  -> inject into live QuickJS
  -> syntax error

hypercard.card.v2 (final)
  -> same path again

Open artifact
  -> resolve packId(undefined)
  -> runtime surface type id required


After
-----
hypercard.card.update (streaming, partial code)
  -> timeline entity
  -> project artifact for UI/debug only
  -> no runtime-surface registration yet

hypercard.card.v2 (final)
  -> project artifact
  -> registerRuntimeSurface(final code, packId?)
  -> inject into live QuickJS
  -> success

Open artifact
  -> resolve packId(explicit value only)
  -> validate/render
```

## Review Checklist

- Confirm that streaming timeline cards still display partial code in chat.
- Confirm that runtime-surface injection does not happen on `status: streaming`.
- Confirm that final cards still inject into the live inventory runtime.
- Confirm that artifact windows render only when the card declares an explicit `runtime.pack`.
- Confirm that missing-pack cards fail early and clearly instead of silently defaulting.
