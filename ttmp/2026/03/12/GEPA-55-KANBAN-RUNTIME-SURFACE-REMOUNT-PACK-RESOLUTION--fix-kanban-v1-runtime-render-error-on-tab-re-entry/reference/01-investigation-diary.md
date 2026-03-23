---
Title: Investigation Diary
Ticket: GEPA-55-KANBAN-RUNTIME-SURFACE-REMOUNT-PACK-RESOLUTION
Status: active
Topics:
    - frontend
    - runtime
    - kanban
    - bugfix
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: |-
        Primary file investigated for remount mismatch
        Diary Step 3 implementation details
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx
      Note: |-
        Explains default fallback to ui.card.v1
        Diary Step 4 strict normalization decision
    - Path: workspace-links/go-go-os-frontend/packages/kanban-runtime/src/runtime-packs/kanbanV1Pack.tsx
      Note: Expected kanban.page root contract
    - Path: workspace-links/go-go-os-frontend/packages/ui-runtime/src/runtime-packs/uiSchema.ts
      Note: Error message provenance
ExternalSources: []
Summary: Chronological investigation log for the kanban.v1 remount render bug, including commands, evidence, and delivery actions.
LastUpdated: 2026-03-12T17:30:00-04:00
WhatFor: Preserve step-by-step debugging and documentation workflow for review and future continuation.
WhenToUse: Use when reviewing how the bug was diagnosed, what evidence supports the root cause, and how ticket deliverables were produced.
---



# Diary

## Goal

Document the full investigation and delivery workflow for the `kanban.v1` remount rendering failure, including concrete commands, failures, and resulting design guidance for implementation.

## Step 1: Reproduce Failure Path And Isolate Pack-Resolution Bug

I started by tracing the user-visible error string through runtime host and schema validators. The immediate objective was to prove whether the bug was in Kanban tree generation or in host-side pack selection.

The key result was that the Kanban tree shape remained valid, but the host could select the wrong validator (`ui.card.v1`) on remount, which explains the exact error text seen by the user.

### Prompt Context

**User prompt (verbatim):** "we were working on go-go-os-frontend, I often get \"Runtime render error: root.kind 'kanban.page' is not supported when tabbing back into a kanban RuntimeSurface kanban.v1 window."

**Assistant interpretation:** Investigate a remount-time render regression in `go-go-os-frontend` where a Kanban RuntimeSurface is rejected as unsupported.

**Inferred user intent:** Identify the technical root cause and prepare a reliable fix path that prevents runtime render crashes when tabbing back into Kanban windows.

**Commit (code):** N/A (analysis-only step)

### What I did

- Ran codebase-wide searches for `root.kind`, `kanban.page`, `kanban.v1`, and runtime render error strings.
- Inspected `RuntimeSurfaceSessionHost.tsx` render and load/recovery logic with line numbers.
- Inspected `runtimeSurfaceTypeRegistry.tsx` default normalization behavior.
- Inspected `stack-bootstrap.vm.js` packId normalization and surfaceTypes meta emission.
- Inspected UI and Kanban validators to map the exact throw path and expected root kinds.
- Inspected existing rerender/StrictMode tests to evaluate coverage gaps for non-default packs.

### Why

- The failure message contains `root.kind` and `not supported`, which is validator-path language.
- Tabbing back into a window suggests remount/recovery/session-state edge cases.

### What worked

- Evidence collection quickly showed a deterministic mismatch path:
  - `kanban.page` is valid for Kanban validator.
  - UI validator throws unsupported-kind for `kanban.page`.
  - Missing pack metadata resolves to default `ui.card.v1`.
- Mapped exact host lines where pack selection occurs in both validation and render paths.

### What didn't work

- Initial direct attempts to add ticket docs failed due sandbox write restrictions outside `/wesen-os`.
- Exact command/error:

```bash
docmgr doc add --ticket GEPA-55-KANBAN-RUNTIME-SURFACE-REMOUNT-PACK-RESOLUTION --doc-type design-doc --title "Kanban RuntimeSurface Remount Render Error: Analysis and Fix Guide"
# Error: failed to create directory ... permission denied
```

### What I learned

- `RuntimeSurfaceSessionHost` can be `ready` from manager state while local `loadedBundleRef` remains empty, creating a pack-resolution hole.
- Existing tests verify remount stability for `ui.card.v1` but do not force non-default pack behavior.

### What was tricky to build

- The bug depends on lifecycle ordering, not static typing. The host has multiple "ready" signals (Redux status, manager session presence, and local ref state) that can temporarily diverge.
- Symptom appears as schema mismatch, but root cause is metadata availability during remount.

### What warrants a second pair of eyes

- Pack-resolution precedence order in host helper (registry override vs bundle meta).
- Whether default fallback to `ui.card.v1` should remain implicit.

### What should be done in the future

- Add telemetry around runtime surface-type resolution to detect silent fallbacks.
- Add dedicated non-default pack remount regression tests.

### Code review instructions

- Start with `RuntimeSurfaceSessionHost.tsx`:
  - `localRuntimeReady` logic.
  - load/recovery effect.
  - pack resolution in render and final JSX.
- Compare against `runtimeSurfaceTypeRegistry.tsx` normalization behavior.
- Validate with a remount test using a non-default surface type (`kanban.v1`) and a `kanban.page` tree.

### Technical details

- Command examples used:

```bash
rg -n "root.kind|Runtime render error|kanban\.page|kanban\.v1" -S .
rg -n "root\.kind|is not supported" workspace-links/go-go-os-frontend/packages -S
nl -ba workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx | sed -n '340,520p'
nl -ba workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx | sed -n '1,120p'
```

## Step 2: Create Ticket Deliverables And Prepare reMarkable Bundle

After the root-cause analysis was complete, I switched to producing formal ticket artifacts for handoff: design guide, diary, bookkeeping updates, validation, and reMarkable delivery.

This step focused on producing intern-friendly documentation with implementation-level specificity and preserving provenance for future contributors.

### Prompt Context

**User prompt (verbatim):** "Create a new docmgr ticket and store you detailed analysis of the bug and all the necessary context in there. Create a detailed analysis / design / implementation guide that is very detailed for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file
  references.
  It should be very clear and detailed. Store in the ticket and the nupload to remarkable."

**Assistant interpretation:** Create a new ticket workspace, write a comprehensive intern-level guide and diary, update ticket bookkeeping, and upload the resulting document bundle to reMarkable.

**Inferred user intent:** Ensure this bug knowledge is durable, reviewable, and easily consumable by a new engineer while also distributing it to a reMarkable workflow.

**Commit (code):** N/A (documentation-only step)

### What I did

- Created new ticket:
  - `GEPA-55-KANBAN-RUNTIME-SURFACE-REMOUNT-PACK-RESOLUTION`
- Added docs:
  - design doc
  - investigation diary
- Drafted detailed architecture + root cause + implementation plan + test strategy.
- Updated ticket index/tasks/changelog for discoverability and workflow continuity.
- Planned and executed doc validation and reMarkable upload flow.

### Why

- User explicitly requested a full ticket-based analysis artifact with delivery to reMarkable.
- Durable docs reduce repeated debugging cost and speed intern onboarding.

### What worked

- Escalated `docmgr` operations succeeded for out-of-sandbox ticket root.
- Created a complete analysis/design/implementation guide with evidence anchors.

### What didn't work

- Non-escalated `docmgr` write commands failed due permissions outside the sandbox root.
- Exact failure seen before escalation:

```text
Error: failed to write document: open .../reference/.docmgr-...: permission denied
```

### What I learned

- This environment requires explicit escalation for writes to the shared `openai-app-server/ttmp` root.
- Ticket workflow remains smooth once escalation is granted.

### What was tricky to build

- Balancing intern-level depth with actionability required organizing architecture and behavior into a phased plan plus explicit API/file references.

### What warrants a second pair of eyes

- Task ordering for implementation phases if done in parallel by multiple contributors.
- Whether optional diagnostics work should be included in the first PR.

### What should be done in the future

- Implement Phase 1 + Phase 2 from the design doc in a focused code PR.
- Add release note entry once patch lands.

### Code review instructions

- Review design doc sections in order:
  1. Root cause narrative.
  2. Proposed helper API and precedence.
  3. Regression test plan.
- Confirm all listed evidence files align with quoted behavior.

### Technical details

- Ticket commands:

```bash
docmgr ticket create-ticket --ticket GEPA-55-KANBAN-RUNTIME-SURFACE-REMOUNT-PACK-RESOLUTION --title "Fix kanban.v1 runtime render error on tab re-entry" --topics frontend,runtime,kanban,bugfix
docmgr doc add --ticket GEPA-55-KANBAN-RUNTIME-SURFACE-REMOUNT-PACK-RESOLUTION --doc-type design-doc --title "Kanban RuntimeSurface Remount Render Error: Analysis and Fix Guide"
docmgr doc add --ticket GEPA-55-KANBAN-RUNTIME-SURFACE-REMOUNT-PACK-RESOLUTION --doc-type reference --title "Investigation Diary"
```

## Step 3: Apply APP-28 Ownership Pattern To RuntimeSurfaceSessionHost

I implemented the host-side code changes so `RuntimeSurfaceSessionHost` resolves runtime surface pack metadata from the manager-owned session handle instead of relying on mount-local ref state. The primary objective in this step was to make remount behavior deterministic for non-default packs like `kanban.v1`.

I also added a dedicated non-default-pack remount regression test that unmounts and remounts the host while keeping the manager session alive, then verifies that rendering still succeeds with `kanban.page`.

### Prompt Context

**User prompt (verbatim):** "Ok, then address RuntimeSurfaceSessionHost the same way as APP_28. Make a new design / implementation guide and upload it to the tablet when done. Don't forgetr to keep a diary and commit."

**Assistant interpretation:** Implement APP-28-style lifecycle ownership in `RuntimeSurfaceSessionHost`, produce a new detailed guide, upload docs to reMarkable, and commit all resulting work.

**Inferred user intent:** Fix the real runtime behavior (not only document it), preserve implementation traceability, and deliver durable onboarding documentation.

**Commit (code):** `b2f45bb` — "Fix remount pack resolution in RuntimeSurfaceSessionHost"

### What I did

- Updated `RuntimeSurfaceSessionHost.tsx`:
  - made manager session presence the runtime-ready source
  - added `readRuntimeBundleMeta(...)` helper that rehydrates from `runtimeHandle.getBundleMeta()`
  - added `resolveSurfacePackId(...)` helper and used it in render validation path
  - made `renderOutcome` carry `{ tree, packId, error }` so final render does not recompute divergent pack ids
- Extended `RuntimeSurfaceSessionHost.rerender.test.tsx`:
  - mocked session-specific `surfaceTypes` (`ui.card.v1` vs `kanban.v1`)
  - added new remount regression test for `session-kanban-remount`
- Ran targeted tests for host + surface-type registry behavior.

### Why

- Local refs are not lifecycle-stable across unmount/remount.
- Runtime session manager already owns canonical bundle metadata.
- APP-28 ownership model says React host should observe manager state, not duplicate ownership.

### What worked

- Manager-backed metadata rehydration removed the remount gap.
- New non-default pack regression test passed and explicitly validated no `kanban.page` mismatch error.
- Targeted test command passed with full package test run (118 tests passing).

### What didn't work

- Initial command intended to run only two files still triggered full `src` due workspace script behavior:

```bash
npm run test -w packages/hypercard-runtime -- src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx src/runtime-packs/runtimeSurfaceTypeRegistry.test.tsx
# Result: vitest run src ... (full package tests)
```

### What I learned

- Current package `test` script prefixes `vitest run src`, so extra args append but do not narrow scope.
- The remount bug sits in ownership of metadata, not in VM tree generation or kanban validator logic.

### What was tricky to build

- The host has three related but different readiness signals: Redux session status, manager session availability, and local `loadedBundleRef` cache. The tricky part is preserving behavior when those signals are briefly out of sync after unmount/remount.
- Recomputing pack id in multiple render locations can create inconsistent behavior. Consolidating pack resolution into `renderOutcome` was necessary to avoid split-brain render/validate paths.

### What warrants a second pair of eyes

- Whether `resolveSurfacePackId` should eventually include stronger diagnostics on missing metadata source.
- Whether remaining explicit `?? 'ui.card.v1'` call sites in REPL/docs paths should be hardened similarly.

### What should be done in the future

- Audit non-host code paths for implicit UI pack fallbacks (especially REPL summaries and docs surfaces).

### Code review instructions

- Start in `RuntimeSurfaceSessionHost.tsx` around:
  - manager-ready flag
  - `readRuntimeBundleMeta`
  - `resolveSurfacePackId`
  - `renderOutcome` tuple (`tree`, `packId`, `error`)
- Validate remount regression behavior in `RuntimeSurfaceSessionHost.rerender.test.tsx` new kanban test.
- Confirm test command and pass status from CI/local vitest logs.

### Technical details

- Key commands:

```bash
git -C workspace-links/go-go-os-frontend diff -- packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
npm run test -w packages/hypercard-runtime -- src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx src/runtime-packs/runtimeSurfaceTypeRegistry.test.tsx
```

## Step 4: Remove Implicit ui.card.v1 Fallback In normalizeRuntimeSurfaceTypeId

After the host refactor, I applied the follow-up requirement to remove implicit normalization fallback to `ui.card.v1`. This makes missing or blank runtime surface type ids fail fast with explicit errors.

I paired this behavioral change with focused tests so the invariant is locked and regressions are obvious.

### Prompt Context

**User prompt (verbatim):** "also, don't normalize to ui.v1 by default. We should not even get to that point, so it's fine to just fail properly. (normalizeRuntimeSurfaceTypeId)"

**Assistant interpretation:** Change `normalizeRuntimeSurfaceTypeId` to throw on missing/blank ids instead of defaulting to UI surface type.

**Inferred user intent:** Enforce strict metadata correctness and eliminate silent fallback paths that can mask runtime bugs.

**Commit (code):** `b2f45bb` — "Fix remount pack resolution in RuntimeSurfaceSessionHost"

### What I did

- Updated `runtimeSurfaceTypeRegistry.tsx`:
  - `normalizeRuntimeSurfaceTypeId` now throws `Runtime surface type id is required` when id is missing/blank.
- Updated `runtimeSurfaceTypeRegistry.test.tsx`:
  - added assertions that `normalizeRuntimeSurfaceTypeId()` throws for `undefined`, `''`, and whitespace.
- Re-ran tests to confirm host and registry behavior remain green.

### Why

- Silent fallback can route runtime trees into the wrong validator.
- Missing pack IDs are integrity failures, not valid defaults.

### What worked

- Strict normalization produced explicit host render errors when metadata is missing.
- Existing tests stayed green; new missing-id tests pass.

### What didn't work

- N/A.

### What I learned

- The strict-normalization change is low-risk when manager-backed metadata rehydration is already in place.

### What was tricky to build

- The main subtlety is avoiding uncaught throws in final render. Returning `packId` from `renderOutcome` and rendering from that cached value avoids a second throw path.

### What warrants a second pair of eyes

- Any cross-package callers that may still assume normalize has a defaulting contract.

### What should be done in the future

- Consider making VM bootstrap strict for missing pack IDs too, instead of assigning `ui.card.v1` at definition time.

### Code review instructions

- Review changed lines in:
  - `runtimeSurfaceTypeRegistry.tsx`
  - `runtimeSurfaceTypeRegistry.test.tsx`
  - `RuntimeSurfaceSessionHost.tsx` final render guard and error path
- Execute package tests and confirm no behavior regressions.

### Technical details

```bash
git -C workspace-links/go-go-os-frontend diff -- \
  packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx \
  packages/hypercard-runtime/src/runtime-packs/runtimeSurfaceTypeRegistry.test.tsx
npm run test -w packages/hypercard-runtime -- src/runtime-packs/runtimeSurfaceTypeRegistry.test.tsx
```
