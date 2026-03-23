---
Title: Investigation diary
Ticket: APP-32-RUNTIME-SURFACE-STREAM-INJECTION-AND-TYPE-ID
Status: active
Topics:
    - bugfix
    - frontend
    - hypercard
    - runtime
    - wesen-os
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go
      Note: Confirmed streaming vs final status is already emitted by backend timeline handlers
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts
      Note: Confirmed runtime surfaces are registered immediately on projection today
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts
      Note: Confirmed projection extracts runtimeSurfaceId, runtimeSurfaceCode, and optional packId from card payloads
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx
      Note: Confirmed the timeline renderer already disables Open/Edit while status is streaming
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts
      Note: Confirmed all registered surfaces are injected into live sessions without a completion check
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Confirmed runtime host subscribes to registry changes and requires a pack id during render
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx
      Note: Confirmed default ui.card.v1 type exists but normalize still throws on missing pack ids
ExternalSources: []
Summary: Chronological diary for APP-32 investigation into early runtime-surface injection and missing type-id render failures.
LastUpdated: 2026-03-23T14:55:19-04:00
WhatFor: Record how the two runtime-surface bugs were traced through the inventory chat frontend stack and why the proposed fixes are local to projection timing and pack-id resolution.
WhenToUse: Use when implementing APP-32 or when reviewing how the diagnosis and task plan were derived.
---

# Investigation diary

## Goal

Capture how the inventory chat runtime-surface failures were traced through the frontend stack, and record the exact code evidence behind the proposed fixes.

## Step 1: Confirm the runtime-surface injection error path

The first step was to map the error the user pasted back into the code. The stack trace named the runtime-surface registry, the runtime session host, and the artifact projection middleware. That strongly suggested the runtime-surface code was being registered before the streamed card had finished arriving.

### Prompt Context

**User prompt (verbatim):** "ok, make a ticket for small adjustments and bugs.

1. When streaming a card in the inventory chat, don't try to inject it until it's done:
...
2. When I open it, I get \"Runtime render error: Runtime surface type id is required\"."

**Assistant interpretation:** Create a focused ticket for two small frontend/runtime bugs and gather enough concrete evidence to make implementation straightforward.

**Inferred user intent:** Capture the bugs as a real tracked item, not just a loose note, and explain the implementation path clearly enough that the fix can be done in small, direct slices.

### What I did

- Created the ticket workspace:
  - `docmgr ticket create-ticket --ticket APP-32-RUNTIME-SURFACE-STREAM-INJECTION-AND-TYPE-ID --title "Fix runtime surface stream injection timing and missing type id render errors" --topics bugfix,frontend,hypercard,runtime,wesen-os`
- Read the artifact projection middleware:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts`
- Read the runtime-surface registry:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts`
- Read the runtime session host:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`

### Why

- The user’s stack trace already pointed to the most likely frontend runtime path.
- I needed to verify whether registration, injection, and rendering are actually separate steps or whether the syntax error was coming from some other code editor/debug path.

### What worked

- The code path was direct. The artifact projection middleware currently calls `registerRuntimeSurface(...)` as soon as a projected artifact has both `runtimeSurfaceId` and `runtimeSurfaceCode`.
- The runtime host subscribes to registry changes and immediately injects all pending surfaces into the live session.

### What I learned

- The current architecture does not distinguish between “preview code displayed in the timeline” and “final code safe to execute in QuickJS.”
- That is the core timing bug.

### Technical details

Current flow:

```text
timeline entity
  -> projectArtifactFromEntity(...)
  -> registerRuntimeSurface(...)
  -> runtime host onRegistryChange(...)
  -> runtimeHandle.defineSurface(...)
```

The injection failure is therefore expected whenever the code string is still partial.

## Step 2: Find the completion signal for streamed cards

Once the early-registration theory looked correct, the next question was whether the code already had a completion signal. If the backend already marks card updates as streaming vs final, the frontend fix should reuse that rather than inventing a new protocol.

### What I did

- Read the inventory timeline handlers in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go`
- Read the artifact extraction helpers in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts`
- Read the timeline renderer in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx`

### Why

- I needed to know whether the right fix was “infer completion from code shape” or simply “respect the explicit timeline status.”

### What worked

- The backend already emits a clean status boundary:
  - `hypercard.card.update` -> `status: "streaming"`
  - `hypercard.card.v2` -> `status: "success"`
- The timeline card renderer already treats streaming cards as not openable/editable.

### What I learned

- The backend-to-frontend contract already contains the exact bit needed for the fix.
- The projection layer is the lagging piece; it simply ignores the status field today.

### Technical details

Relevant backend pseudocode:

```go
if eventType == "hypercard.card.update" {
  props["status"] = "streaming"
}
if eventType == "hypercard.card.v2" {
  props["status"] = "success"
}
```

Relevant frontend behavior:

```text
timeline renderer:
  if status == streaming:
    disable Open
    disable Edit
```

That makes the desired rule very clear: a streaming card may be previewed, but it should not yet be executable.

## Step 3: Confirm the missing type-id error path

The second user-reported error, `Runtime surface type id is required`, needed separate confirmation because it could have come from an entirely different path.

### What I did

- Searched the frontend runtime packages for the exact error string.
- Read:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx`
  - the relevant render path in `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`
- Searched for existing uses of the default runtime surface type id in the runtime stack.

### Why

- I needed to know whether the missing type id was caused by malformed user data or by an inconsistent defaulting rule inside the runtime system.

### What worked

- The runtime-surface type registry clearly defines `DEFAULT_RUNTIME_SURFACE_TYPE_ID = 'ui.card.v1'`.
- The runtime bootstrap stack already defaults missing pack ids to `ui.card.v1`.
- The runtime host injected-surface render path does not use that default before normalizing the pack id.

### What I learned

- The system currently sends mixed signals about `packId`:
  - some emitters treat it as optional,
  - some runtime paths silently default it,
  - some render paths insist on a real explicit value.
- That inconsistency is the real bug, more than the single render exception.

### Technical details

Current resolution logic:

```text
packId = runtimeSurface.packId ?? runtimeBundle.surfaceTypes[surfaceId]
normalizeRuntimeSurfaceTypeId(packId)
```

Failure case:

```text
packId = undefined
normalizeRuntimeSurfaceTypeId(undefined)
  -> Error("Runtime surface type id is required")
```

Revised fix direction:

```text
emitter must send runtime.pack
projection must preserve it
registration must require it
runtime bootstrap must not invent it
render consumes only explicit pack ids
```

## Step 4: Write the ticket plan

With both failure paths confirmed, the last step was to write the ticket so implementation can proceed in small chunks:

- document the current pipeline,
- define the two concrete fixes,
- separate the work into phases,
- point reviewers at the exact files that matter.

### What I did

- Updated:
  - `index.md`
  - `tasks.md`
- Added:
  - `design-doc/01-runtime-surface-stream-injection-and-type-id-fixes.md`
  - `reference/01-investigation-diary.md`

### Why

- The user asked for a real ticket, and these bugs are easier to fix when the runtime pipeline is written down in one place rather than reconstructed from stack traces later.

### What warrants a second pair of eyes

- Review whether the registration gate should look strictly at `status`, or also at code completeness markers if those are added later.
- Review whether the pack-id fallback should live in runtime host resolution, in artifact extraction, or in runtime-surface registration metadata.

### What should be done next

- Add focused tests first.
- Then gate registration on final status.
- Then default the pack id for ordinary injected cards.
- Then run the narrow frontend/inventory test set and record exact commands here.

## Step 5: Remove the implicit default runtime surface path

After the diagnosis was written down, the next implementation slice was to remove the ambiguity around runtime-surface type identity. The user explicitly asked to remove the concept of a default runtime surface, so the goal of this slice was not to add another fallback. It was to make the runtime contract strict everywhere the same way.

### What I did

- Tightened runtime-surface registration and dynamic definition so `packId` is required:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-session-manager/runtimeSessionManager.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts`
- Removed implicit defaulting inside runtime bundle bootstrap metadata:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx`
- Tightened artifact/chat UI paths so cards are only executable when a concrete `packId` is present:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/CodeEditorWindow.tsx`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/editor/editorLaunch.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/hypercard-tools/src/launcher/module.tsx`
- Updated built-in bundle fixtures, launcher VM metadata, and inventory prompt/examples so `packId` is explicit:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/10-home.vm.js`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md`
  - runtime fixture files under `packages/hypercard-runtime/src/plugin-runtime/fixtures` and `packages/hypercard-runtime/src/runtime-host/fixtures`
- Updated tests that were still assuming runtime surfaces could exist without a `packId`, including:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.renderer.test.tsx`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.chat.test.tsx`

### Why

- The previous system had contradictory rules:
  - some emitters treated `packId` as optional,
  - the runtime bootstrap silently invented `ui.card.v1`,
  - the render path still threw if no runtime surface type id was present.
- That makes bugs hard to reason about because the same payload can be accepted in one layer and rejected in another.
- A strict contract is easier for both runtime code and prompt authors to understand.

### What worked

- The runtime code accepted the stricter API with limited fallout.
- Most test failures were expectation mismatches rather than design problems.
- Updating the inventory prompt and the ready-card renderer tests made the intended contract explicit instead of implicit.

### What was tricky

- The workspace is dirty in multiple related repos, so staging needs to be narrow.
- The first narrow hypercard-runtime run still failed because one renderer test expected an `Open` action on a card that did not include `runtime.pack`. That failure was useful because it confirmed the stricter contract was actually being enforced.
- Some debug/editor flows can still open a code editor on a surface reference that does not yet have a `packId`; in that case save is now intentionally blocked instead of silently inventing a type id.

### Validation

Validated this slice with:

- `npm test -w packages/hypercard-runtime -- --run src/plugin-runtime/runtimeSurfaceRegistry.test.ts src/plugin-runtime/runtimeService.integration.test.ts src/runtime-packs/runtimeSurfaceTypeRegistry.test.tsx src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx src/hypercard/timeline/hypercardCard.test.ts src/hypercard/timeline/hypercardCard.renderer.test.tsx`
- `npm test -- --run src/launcher/renderInventoryApp.chat.test.tsx` from `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory`

Both command sets passed after the renderer expectation was updated to include `runtime.pack: 'ui.card.v1'`.

### What I learned

- Removing the implicit default surface type is viable without a broad frontend rewrite.
- The real leverage point is not the final render call. It is the contract boundary where cards become executable runtime surfaces.
- The next slice should stay focused on the streaming bug: cards can now fail correctly when the type id is missing, but they are still being registered too early while code is incomplete.

## Step 6: Gate runtime-surface registration on final card status

With the `packId` contract tightened, the second implementation slice focused on the original timing bug. The fix stays deliberately local: projection still records streamed card artifacts, but only final card entities are allowed to enter the runtime-surface registry.

### What I did

- Updated the artifact projection middleware to compute a runtime-surface execution gate from the timeline entity status:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts`
- Added an explicit `queueForInjection` flag to artifact upserts so the artifacts slice can distinguish “has code” from “is ready to inject”:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.ts`
- Added focused tests proving:
  - streaming cards project into the artifact store without being registered,
  - the later final `success` update flips the artifact into `pending` injection status and registers the runtime surface,
  - the artifacts slice only marks `pending` once a projection actually queued injection:
    - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.test.ts`
    - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactsSlice.test.ts`

### Why

- The user-reported syntax error was caused by partial streamed code being treated as executable runtime code.
- The backend already exposes the right signal through `status: "streaming"` versus the final success entity, so inventing a new completeness heuristic would have been unnecessary and more fragile.

### What worked

- The projection layer was the correct place to enforce the rule.
- No changes were needed in the timeline renderer, which already shows streaming cards as previews and disables their actions.
- By separating “artifact exists” from “artifact is queued for runtime injection,” the debug view and slice state now match reality better.

### Technical details

New rule in pseudocode:

```text
upsert = extractArtifactUpsert(entity)
queueForInjection =
  entity.status not in {streaming, pending}
  and upsert has runtimeSurfaceId
  and upsert has runtimeSurfaceCode
  and upsert has packId

dispatch upsertArtifact(..., queueForInjection)

if queueForInjection:
  registerRuntimeSurface(...)
```

That means the streaming path still produces an artifact record, but it is not yet queued as executable runtime code.

### Validation

Validated the timing slice with:

- `npm test -w packages/hypercard-runtime -- --run src/hypercard/artifacts/artifactProjectionMiddleware.test.ts src/hypercard/artifacts/artifactsSlice.test.ts src/hypercard/timeline/hypercardCard.test.ts src/hypercard/timeline/hypercardCard.renderer.test.tsx`
- `npm test -- --run src/launcher/renderInventoryApp.chat.test.tsx` from `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory`

Both command sets passed.

### What I learned

- The correct semantics are not “register as soon as code exists.” They are “register as soon as the card entity is final.”
- Keeping the gate in projection avoids pushing partial-code handling into the runtime registry or QuickJS runtime itself.
- The two APP-32 bugs were related but distinct:
  - `packId` strictness fixes the missing type-id render failure,
  - status-gated projection fixes the streamed partial-code injection failure.

## Step 7: Reject blank `runtime.pack` at the inventory producer boundary

After the frontend/runtime changes landed, one more regression surfaced in live inventory chat payloads: some finalized `hypercard.card.v2` events were still arriving with `runtime.pack: ""`. Under the new strict contract that means the card is malformed, so the frontend was correctly hiding `Open`. The missing piece was that the inventory extractor was still allowing that malformed card through as a “ready” card event.

### What I did

- Tightened the finalized runtime-card extractor validation so blank `runtime.pack` is rejected with a `hypercard.card.error` event:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_extractors.go`
- Added coverage proving:
  - an empty pack now emits `runtime.pack is required`,
  - the previously valid extractor fixtures now include `runtime.pack: ui.card.v1` explicitly:
    - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_extractors_test.go`

### Why

- The frontend behavior was already correct. It hid `Open` because the event said the card had no runtime surface type.
- Re-adding a frontend fallback would have undone the earlier design decision to remove the default runtime surface concept.
- The correct place to fail is the inventory producer boundary, where malformed structured card payloads first become typed events.

### Technical details

New finalized-card rule in pseudocode:

```text
if trim(card.id) == "":
  error("runtime card.id is required")
if trim(card.code) == "":
  error("runtime card.code is required")
if trim(runtime.pack) == "":
  error("runtime.pack is required")
emit hypercard.card.v2 only if all three checks pass
```

That means a malformed card no longer masquerades as a successful ready event.

### Validation

Validated the producer-side follow-up with:

- `go test ./pkg/pinoweb -count=1`

That package test initially failed because two older fixtures were still missing `runtime.pack`. After updating those fixtures to `ui.card.v1`, the package passed cleanly.

### What I learned

- Prompt guidance alone is not enough for a strict protocol boundary. The extractor still needs to reject malformed “final” payloads.
- This follow-up closes the loop on the `Open` regression: if a card has a blank pack now, that is an inventory structured-output bug, not a frontend rendering bug.
