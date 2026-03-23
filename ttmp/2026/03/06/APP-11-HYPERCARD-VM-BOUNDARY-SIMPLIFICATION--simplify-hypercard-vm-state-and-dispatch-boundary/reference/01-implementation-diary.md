---
Title: Implementation diary
Ticket: APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION
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
    - Path: 2026/03/05/APP-05-GENERIC-APP-CHAT-BOOTSTRAP--generic-app-chat-bootstrap-and-context-injection/index.md
      Note: Background ticket checked to confirm APP-11 scope boundaries
    - Path: 2026/03/06/APP-09-BOOTSTRAPPED-CHAT-SESSIONS--bootstrapped-chat-sessions-and-backend-specific-chat-window-extensions/index.md
      Note: Compared against APP-11 to keep chat-shell and VM-runtime work distinct
    - Path: 2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/changelog.md
      Note: Changelog entry summarizing the documentation delivery
    - Path: 2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/design-doc/01-intern-guide-to-hypercard-vm-boundary-simplification-runtime-flow-and-implementation-plan.md
      Note: Primary document whose preparation and delivery this diary records
    - Path: 2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/tasks.md
      Note: Task checklist updated during documentation and upload
    - Path: workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/bridge/ArcPendingIntentEffectHost.tsx
      Note: ARC bridge now ingests generic runtime actions and mirrors runtime filters via filters.patch
    - Path: workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/bridge/middleware.ts
      Note: ARC middleware cut over from ingestRuntimeIntent to ingestRuntimeAction during the APP-11 sweep
    - Path: workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/domain/pluginBundle.ts
      Note: ARC plugin bundle rewritten to read state and dispatch generic runtime actions
    - Path: workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/domain/stack.ts
      Note: ARC stack capabilities expanded to include arcBridge state projection and notify.show
    - Path: workspace-links/go-go-app-sqlite/apps/sqlite/src/domain/pluginBundle.vm.js
      Note: SQLite bundle rewritten from split state and scoped dispatch helpers to state plus dispatch(action)
    - Path: workspace-links/go-go-app-sqlite/apps/sqlite/src/domain/stack.ts
      Note: SQLite stack capabilities now project app_sqlite and authorize notify.show
ExternalSources: []
Summary: Chronological diary for the APP-11 documentation, implementation, linked-app cleanup, validation, and delivery path after the direct no-compatibility runtime cutover.
LastUpdated: 2026-03-09T19:13:02-04:00
WhatFor: Record how the APP-11 guide was assembled, how scope was reconciled with nearby APP tickets, how ticket hygiene and reMarkable delivery were completed, how the implementation plan shifted to a direct cutover, and how the remaining linked apps were migrated.
WhenToUse: Use when reviewing or continuing APP-11 documentation or implementation work, or when verifying exactly how the guide, repo commits, and delivered bundle were produced.
---



# Implementation diary

## Goal

Capture the documentation-first phase of APP-11 so another engineer can understand why the ticket exists, which files shaped the design, how the ticket scope was resolved against nearby APP work, and how the final guide was validated and delivered to reMarkable.

## Step 1: Establish APP-11 Scope And Write The Intern Guide

I started by checking the existing APP ticket sequence because the VM-boundary work had initially been considered as a frontend `GEPA-*` task, but the active ticket stream in this workspace is `APP-*`. That check showed that APP-08 already covered the external profile/runtime naming cleanup and APP-09 already covered bootstrapped chat sessions and shared shell cleanup, while APP-07 contained the broad analysis of the HyperCard runtime platform.

From there I re-read APP-05, APP-07, APP-08, and APP-09 to place APP-11 correctly. APP-05 turned out to be important background for the shared chat/bootstrap layer, but it did not already contain the QuickJS runtime-boundary analysis. That confirmed the right framing: APP-11 is a new runtime-platform ticket that conceptually continues APP-08's simplification work while remaining distinct from APP-09's chat-shell architecture.

### Prompt Context

**User prompt (verbatim):** "ok cool, go ahead with APP-11 then, Create a detailed analysis / design / implementation guide that is very detailed for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file
  references.
  It should be very clear and detailed. Store in the ticket and the nupload to remarkable."

**Assistant interpretation:** Create a full intern-facing APP-11 guide inside the ticket workspace, make the guide explicit and detailed enough to support implementation work, and then bundle and upload the ticket documents to reMarkable.

**Inferred user intent:** Establish a durable onboarding and implementation reference before code changes begin, so the VM boundary refactor can be executed and reviewed without rediscovering the surrounding architecture.

**Commit (code):** N/A

### What I did

- Verified the APP ticket sequence and confirmed that `APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION` is the right new ticket.
- Read and compared:
  - `APP-05-GENERIC-APP-CHAT-BOOTSTRAP`
  - `APP-07-HYPERCARD-VM-RUNTIME-PLATFORM`
  - `APP-08-PROFILE-RUNTIME-CONTRACT-ALIGNMENT`
  - `APP-09-BOOTSTRAPPED-CHAT-SESSIONS`
- Audited the current runtime boundary in:
  - `PluginCardSessionHost.tsx`
  - `stack-bootstrap.vm.js`
  - `runtimeService.ts`
  - `contracts.ts`
  - `pluginIntentRouting.ts`
  - `pluginCardRuntimeSlice.ts`
  - `selectors.ts`
- Audited the authoring and prompt surfaces in:
  - `pluginBundle.vm.js`
  - `pluginBundle.authoring.d.ts`
  - `runtime-card-policy.md`
- Created the APP-11 design doc and wrote the detailed guide.
- Updated the ticket index, tasks, and changelog to reflect the documentation-first phase.

### Why

- The VM boundary is cross-cutting. A useful implementation guide has to cover prompt policy, artifact extraction, timeline projection, runtime injection, QuickJS execution, and host routing.
- The overlap question with APP-05, APP-08, and APP-09 needed to be settled before writing the guide, otherwise the ticket would remain ambiguous and future implementation notes would drift.

### What worked

- APP-07 already contained much of the necessary end-to-end runtime mapping, which made APP-11's guide much more concrete.
- The current runtime files are cleanly separated enough that the guide could identify exact boundary seams without guessing.
- The user’s prompt was specific enough to justify a long-form intern guide rather than a short plan note.

### What didn't work

- My first instinct was to place this work in a frontend `GEPA-*` ticket because the code changes will largely happen in `go-go-os-frontend`. That was the wrong ticket stream for the active workspace and had to be corrected.
- An early attempt to create the ticket from within the sandbox failed with:

```text
Error: failed to create directory /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary: mkdir ...: permission denied
```

- That failure stopped mattering once the environment switched to full access and APP-11 was created successfully.

### What I learned

- APP-05 is important historical context, but it is not the ticket that already scoped the QuickJS boundary problem.
- APP-11 is easiest to communicate as "the internal runtime-boundary continuation of APP-08" while still remaining a separate ticket from APP-09.
- The current prompt docs are just as important as the runtime code for this refactor because they define what the model is taught to emit.

### What was tricky to build

- The tricky part was not the writing itself. The tricky part was drawing a clean scope boundary between adjacent tickets that all deal with "contracts" but at different layers.
- The symptoms of that ambiguity were immediate: APP-09 looked superficially similar because it is also a simplification ticket, and APP-05 looked like it might already contain the needed planning because it introduced the original bootstrap architecture.
- I resolved that by tracing each ticket back to the actual source files it governs. APP-09 centers on chat-shell and bootstrap code. APP-11 centers on `packages/hypercard-runtime` and inventory prompt/authoring files. Once the file ownership was explicit, the separation became defensible.

### What warrants a second pair of eyes

- The guide’s phased migration plan assumes a temporary compatibility period between legacy scoped intents and the new generic action envelope. That is probably the safest route, but it should be reviewed before implementation starts.
- The proposed transitional projected-state shape still carries `local.card` and `local.session`. That is intentional as an intermediate step, but it could be mistaken for the final semantic design if not read carefully.

### What should be done in the future

- Begin the actual code refactor in small slices following the phases in the design doc.

### Code review instructions

- Start with the APP-11 design doc and read the "Current Runtime Pipeline" and "Detailed Implementation Plan" sections first.
- Then inspect:
  - `PluginCardSessionHost.tsx`
  - `stack-bootstrap.vm.js`
  - `runtimeService.ts`
  - `contracts.ts`
  - `pluginIntentRouting.ts`
- Validate documentation hygiene with:
  - `docmgr doctor --ticket APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION --stale-after 30`
- Validate bundle generation and upload with the `remarquee upload bundle ...` commands captured in the next diary step.

### Technical details

- Ticket creation:

```bash
docmgr ticket create-ticket \
  --ticket APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION \
  --title "Simplify HyperCard VM State and Dispatch Boundary" \
  --topics architecture,frontend,hypercard,wesen-os
```

- Document creation:

```bash
docmgr doc add \
  --ticket APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION \
  --doc-type design-doc \
  --title "Intern guide to HyperCard VM boundary simplification, runtime flow, and implementation plan"

docmgr doc add \
  --ticket APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION \
  --doc-type reference \
  --title "Implementation diary"
```

## Step 2: Validate The Ticket And Deliver The Bundle

After the guide and diary existed, I moved into ticket hygiene and delivery mode. The first part was to relate the important source files to the design doc and diary so the ticket frontmatter becomes useful for later search and review. I kept the design doc focused on the core runtime and prompt files, while the diary got the APP ticket lineage files plus the guide, tasks, and changelog.

Once the related-file metadata was in place, I ran `docmgr doctor` and then moved to the reMarkable workflow. I verified `remarquee` was healthy, confirmed the cloud account, dry-ran the bundled upload, uploaded the APP-11 PDF to a dated remote folder, and then listed that exact folder to confirm the document exists remotely.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Finish the ticket documentation properly by validating the ticket metadata and delivering the final bundle to reMarkable.

**Inferred user intent:** Do not stop at writing the guide; make sure the ticket is reviewable, searchable, and visibly delivered.

**Commit (code):** N/A

### What I did

- Related the main runtime and prompt files to the design doc with `docmgr doc relate`.
- Related the guide, tasks, changelog, and APP lineage tickets to the diary with `docmgr doc relate`.
- Ran:
  - `docmgr doctor --ticket APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION --stale-after 30`
  - `remarquee status`
  - `remarquee cloud account --non-interactive`
- Dry-ran the bundle upload with:

```bash
remarquee upload bundle --dry-run \
  /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/index.md \
  /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/design-doc/01-intern-guide-to-hypercard-vm-boundary-simplification-runtime-flow-and-implementation-plan.md \
  /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/reference/01-implementation-diary.md \
  /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/tasks.md \
  /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/changelog.md \
  --name "APP-11 HyperCard VM Boundary Simplification" \
  --remote-dir "/ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION" \
  --toc-depth 2
```

- Uploaded the real bundle to the same destination.
- Verified the remote folder with:

```bash
remarquee cloud ls /ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION --long --non-interactive
```

### Why

- A ticket guide without related-file metadata is harder to search and review.
- A ticket doc that exists only locally is not the delivered artifact the user asked for.
- Re-running the upload after final diary updates keeps the remote copy aligned with the final local ticket state.

### What worked

- `docmgr doctor` reported all checks passing.
- `remarquee status` and `remarquee cloud account --non-interactive` both succeeded immediately.
- The bundle dry-run rendered the expected document order and remote destination.
- The upload succeeded with:

```text
OK: uploaded APP-11 HyperCard VM Boundary Simplification.pdf -> /ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION
```

- Remote verification succeeded with:

```text
[f] APP-11 HyperCard VM Boundary Simplification
```

### What didn't work

- Listing `/ai/2026/03/07` before upload failed with:

```text
Error: no matches for '07'
```

- Listing `/ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION` before upload also failed because the remote path did not exist yet:

```text
Error: entry '07' doesnt exist
```

- Those failures were expected once it became clear that the remote folder is only created by the first successful upload.

### What I learned

- For new dated reMarkable folders, a failed pre-upload `cloud ls` is not a sign of account trouble; it just means the dated path does not exist yet.
- The safest delivery loop is:
  1. dry-run the bundle
  2. upload
  3. verify the exact remote folder

### What was tricky to build

- The trickiest part was keeping the delivered PDF aligned with the final local ticket state. Because the diary itself needed to record the upload and verification steps, the first successful upload was no longer the last word; the docs then had to be updated one final time and re-uploaded.
- The practical solution was to treat the first upload as proof that the path and bundle command were correct, then patch the diary/tasks/changelog with the verified results and overwrite the remote copy so the final bundle reflects the completed work.

### What warrants a second pair of eyes

- The final APP-11 upload should be spot-checked on the device or in the cloud UI just to confirm the PDF renders the long design doc cleanly with the expected table of contents depth.

## Step 3: Revise The Plan To Remove Legacy Compatibility

After the original documentation pass, the user clarified the implementation posture for APP-11: there is no need to preserve legacy compatibility, and we are free to refactor across the stack, including inventory cards and authoring surfaces, if that makes the runtime boundary simpler.

I treated that as a request to re-read the implementation guide against the real runtime files and then rewrite the plan so it stops encouraging adapter layers. I re-opened the current `contracts.ts`, `stack-bootstrap.vm.js`, `PluginCardSessionHost.tsx`, `pluginIntentRouting.ts`, `pluginBundle.authoring.d.ts`, `pluginBundle.vm.js`, and `runtime-card-policy.md` files to confirm where the old contract still lives and which parts of the earlier plan would create unnecessary complexity.

### Prompt Context

**User prompt (verbatim):** "We are workign on docmgr openai-app-server/ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary .
 
  We don't want any legacy compatibility and are free to refactor across the stack to make our job easier.

GO over the implementation document, understand the full scope of the issue, update the plan to avoid doing complexity by adding wrappers or legacy compatibility. We can update all the cards in inventory and such to fit th enew API"

**Assistant interpretation:** Re-read the APP-11 implementation documents and the live runtime code, then rewrite the ticket plan so the intended implementation is a direct contract cutover rather than a migration with wrappers.

**Inferred user intent:** Spend the available refactor budget on deleting the old boundary everywhere we control it instead of preserving two APIs or introducing transitional state wrappers.

**Commit (code):** N/A

### What I did

- Re-read the APP-11 design doc sections that described the migration strategy and noted every place that still recommended compatibility or transitional wrappers.
- Re-checked the current runtime and authoring files to confirm the real scope of the old contract:
  - `contracts.ts`
  - `stack-bootstrap.vm.js`
  - `PluginCardSessionHost.tsx`
  - `pluginIntentRouting.ts`
  - `pluginBundle.authoring.d.ts`
  - `pluginBundle.vm.js`
  - `runtime-card-policy.md`
- Updated the design doc to:
  - remove compatibility-first language
  - replace the transitional projected-state recommendation with a direct semantic-state target
  - rewrite the implementation phases around a flag-day cutover
  - explicitly reject dual dispatch helpers and topology-wrapping state shapes
- Updated `tasks.md` so the implementation checklist now assumes one coordinated contract change across runtime, prompts, inventory cards, fixtures, and tests.
- Added a changelog entry documenting the plan reset.

### Why

- The previous plan spent complexity on a temporary bridge that we do not actually need.
- The old contract is concentrated in a manageable set of files that we control, so updating them together is cheaper than teaching the runtime to understand both old and new shapes.
- A transitional `local.card` / `local.session` state wrapper would have changed signatures without removing the authoring leak that APP-11 exists to fix.

### What worked

- The current runtime files make the legacy seams obvious, especially in `contracts.ts`, `stack-bootstrap.vm.js`, and `PluginCardSessionHost.tsx`.
- The inventory sample bundle and prompt policy are explicit enough that the cross-stack impact is easy to trace.
- The revised plan is materially simpler: one public contract, one authoring surface, one set of tests.

### What didn't work

- The earlier guide over-optimized for a safe migration path before we had an explicit user preference on compatibility. That produced recommendations that are now unnecessary.
- The "transitional state" idea would have made the VM API look cleaner on paper while still forcing authors to reason about host-owned storage buckets.

### What I learned

- For APP-11, the real implementation risk is not a flag day. The real risk is carrying the old model forward under a new wrapper and then having to migrate twice.
- Because inventory cards, prompt policy, and fixtures are all in-repo, the cost of coordinated change is lower than the cost of compatibility plumbing.
- The host boundary is the right place to spend complexity. The VM contract should get simpler, not more accommodating.

### What warrants a second pair of eyes

- The projected state shape should still be reviewed before coding starts so we do not accidentally replace one leaky topology with another.
- The action-family design for local state updates should be checked early, especially whether `state.patch` is sufficient or whether named actions are clearer for maintainers.

### What should be done in the future

- Implement APP-11 as a direct cross-stack cutover: contracts, bootstrap, runtime host, routing, inventory cards, prompt policy, fixtures, and tests in one coordinated branch.

## Step 4: Re-upload The Ticket And Expand The Execution Plan

Before starting code changes, I refreshed the APP-11 ticket bundle on reMarkable so the device copy matched the revised no-compatibility design doc. I then converted the high-level implementation checklist into concrete slices that map to actual files and natural commit boundaries.

That extra planning step mattered because the runtime contract, host projection/routing, and inventory authoring surfaces live in different repos but still need to move together. Breaking the work into slices gives a cleaner sequence for implementation, testing, diary updates, and focused commits.

### Prompt Context

**User prompt (verbatim):** "upload to remarkable, then add detailed tasks to the ticket, and work on them one by one, committing appropriate intervals, and keeping a detailed diary."

**Assistant interpretation:** Re-upload the APP-11 ticket docs, turn the plan into a detailed execution checklist, then start implementing the tasks in small committed slices while documenting each step in the diary.

**Inferred user intent:** Keep the ticket, the device copy, the code, and the implementation narrative synchronized while APP-11 moves from planning into execution.

**Commit (code):** N/A

### What I did

- Verified `remarquee` health and cloud auth with:
  - `remarquee status`
  - `remarquee cloud account --non-interactive`
- Dry-ran the APP-11 bundle upload with `remarquee upload bundle --dry-run ...`.
- Uploaded the refreshed bundle with `remarquee upload bundle --force ...`.
- Verified the remote folder with:
  - `remarquee cloud ls /ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION --long --non-interactive`
- Re-read the runtime, host, routing, and inventory authoring files to align the execution plan to real code seams.
- Expanded `tasks.md` into:
  - Slice 1: runtime contract/bootstrap
  - Slice 2: host projection/runtime state/action routing
  - Slice 3: inventory authoring/prompt policy/final fixtures and tests
  - bookkeeping tasks for diary/changelog/task maintenance

### Why

- The device copy should match the latest ticket state before implementation diverges further.
- A high-level checklist was not enough to support the user's requested working style of "one by one" execution with intermediate commits.
- The detailed task list now maps directly to likely commits and review chunks.

### What worked

- `remarquee status` returned `remarquee: ok`.
- `remarquee cloud account --non-interactive` returned `user=wesen@ruinwesen.com sync_version=1.5`.
- The bundle upload succeeded with:

```text
OK: uploaded APP-11 HyperCard VM Boundary Simplification.pdf -> /ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION
```

- Remote verification succeeded with:

```text
[f] APP-11 HyperCard VM Boundary Simplification
```

- The codebase inspection confirmed that the old contract is concentrated enough to support the three-slice plan cleanly.

### What didn't work

- N/A

### What I learned

- The APP-11 execution path is now concrete enough that each slice can be implemented and reviewed independently without losing the direct-cutover strategy.
- The runtime and inventory repos are both clean at the start of implementation, which reduces the risk of mixing unrelated changes into the APP-11 commits.

### What was tricky to build

- The tricky part here was not the upload itself; it was choosing slice boundaries that reflect real coupling. The runtime contract, host routing, and inventory authoring layers are tightly connected, but not all changes need to land in one monolithic commit.
- I handled that by checking the concrete files and tests before finalizing the task expansion. That made it possible to separate "contract/bootstrap", "host/routing", and "authoring/prompts/fixtures" into defensible review units.

### What warrants a second pair of eyes

- The slice boundaries should remain stable during implementation. If Slice 1 reveals a deeper host-state dependency than expected, that is a sign the plan needs tightening before more commits are made.

### What should be done in the future

- Commit the ticket-doc updates for this planning step.
- Begin Slice 1 in `go-go-os-frontend` and keep the diary synchronized after the first code commit.

### Code review instructions

- Review the updated APP-11 `tasks.md` first to see the new execution order.
- Confirm the bundle refresh by checking the remote path:
  - `remarquee cloud ls /ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION --long --non-interactive`

### Technical details

- Bundle command used:

```bash
remarquee upload bundle --force \
  /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/index.md \
  /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/design-doc/01-intern-guide-to-hypercard-vm-boundary-simplification-runtime-flow-and-implementation-plan.md \
  /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/reference/01-implementation-diary.md \
  /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/tasks.md \
  /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/changelog.md \
  --name "APP-11 HyperCard VM Boundary Simplification" \
  --remote-dir "/ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION" \
  --toc-depth 2
```

## Step 5: Cut Over The Frontend Runtime Package

With the task slices defined, I started in `go-go-os-frontend` because the runtime package had to become internally consistent before the inventory repo could safely target the new API. This step changed the public runtime contract, the QuickJS bootstrap, the runtime service, the host projection path, and the reducer/routing model so the package spoke only one state/action boundary.

The most important design choice in this step was to replace the scoped intent model everywhere inside the package, not just at the VM edge. That kept the runtime code honest: tests, fixtures, and host-side routing all had to move to the same model in the same change set instead of deferring conversion to later cleanup.

### Prompt Context

**User prompt (verbatim):** (same as Step 4)

**Assistant interpretation:** Start executing the APP-11 implementation slices with real code changes, committed in focused intervals.

**Inferred user intent:** Make the runtime package itself use one projected state and one generic dispatch boundary before updating dependent authored bundles.

**Commit (code):** `788f17f` — `Refactor hypercard runtime to state/action boundary`

### What I did

- Replaced `RuntimeIntent` with `RuntimeAction` in:
  - `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts`
- Replaced intent validation with action validation in:
  - `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/intentSchema.ts`
  - `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/intentSchema.test.ts`
- Rewrote the VM bootstrap and runtime service to use one `state` input and return action arrays:
  - `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
  - `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts`
- Reworked host/runtime state ingestion and routing:
  - `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts`
  - `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/pluginIntentRouting.ts`
  - `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
- Updated runtime fixtures, stories, and tests to the new API:
  - runtime fixtures under `packages/hypercard-runtime/src/plugin-runtime/fixtures/`
  - runtime-host fixtures under `packages/hypercard-runtime/src/runtime-host/fixtures/`
  - `RuntimeMutation.stories.tsx`
  - `PluginCardSessionHost.rerender.test.tsx`
  - `plugin-card-runtime.test.ts`
  - `plugin-intent-routing.test.ts`
  - `CodeEditorWindow.stories.tsx`
- Ran:
  - `npm run test -w packages/hypercard-runtime`
  - `npm run typecheck -w packages/hypercard-runtime`

### Why

- The runtime package was the narrowest place where the old API still had to be deleted comprehensively.
- Updating only the VM edge would have left old host-side ingestion and routing logic alive, which would have recreated the same ambiguity under a different type name.

### What worked

- The runtime package tests all passed after the cutover:

```text
Test Files  13 passed (13)
Tests  57 passed (57)
```

- `npm run typecheck -w packages/hypercard-runtime` completed successfully.
- The package changes were cohesive enough to fit into one focused commit.

### What didn't work

- N/A

### What I learned

- The old scope-based model was concentrated enough that it could be removed cleanly once the reducer/routing layer moved with it.
- Rewriting the host-side tests at the same time was important because they encoded a lot of implicit assumptions about `scope`, `command`, and `actionType`.

### What was tricky to build

- The tricky part was not the QuickJS bootstrap itself. The tricky part was that `RuntimeIntent` leaked into tests, stories, reducer queues, and downstream routing metadata.
- The safest path was to replace the whole package model at once: contracts, validation, bootstrap, runtime service, reducer ingestion, routing, fixtures, and host tests. That avoided an intermediate state where the runtime service returned one model but the host still reasoned in another.

### What warrants a second pair of eyes

- `PluginCardSessionHost.tsx` should be reviewed closely because it now defines the effective VM-facing state shape and bootstraps initial local state through action dispatches rather than the old scoped intent model.
- `pluginCardRuntimeSlice.ts` should be reviewed for any edge cases in how `draft.*`, `filters.*`, domain, and system actions are classified.

### What should be done in the future

- Finish the inventory-side cutover so authored cards and prompt policy match the runtime package.

### Code review instructions

- Start with:
  - `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts`
  - `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
  - `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/pluginIntentRouting.ts`
- Validate with:
  - `npm run test -w packages/hypercard-runtime`
  - `npm run typecheck -w packages/hypercard-runtime`

### Technical details

- Commit:

```text
788f17f Refactor hypercard runtime to state/action boundary
```

- Follow-up:

```text
2014065 Restrict projected runtime selectors
```

## Step 6: Rewrite Inventory Authoring And Prompt Policy

Once the runtime package was stable, I switched to `go-go-app-inventory` and rewrote the real authored card bundle plus the prompt pack that teaches the model how to generate cards. This step made the runtime cutover real at the repo boundary: the inventory cards now read `state` and emit `dispatch({ type, payload })`, and the prompt docs now teach the same model.

I kept the inventory-side state shape intentionally simple: `state.draft` for per-card local UI state, `state.filters` for session-shared filter state, `state.inventory` and `state.sales` for projected data, and `state.nav` for current navigation context. That is not the only semantic shape we could choose, but it is much cleaner than exposing `cardState`, `sessionState`, and `globalState`.

### Prompt Context

**User prompt (verbatim):** (same as Step 4)

**Assistant interpretation:** Finish the cross-stack cutover by updating the inventory bundle and the prompt policy to the new runtime API.

**Inferred user intent:** Ensure the actual authored cards and the inference-time authoring instructions stop teaching the deleted contract.

**Commit (code):** `c1df9ac` — `Rewrite inventory cards for new runtime API`

### What I did

- Rewrote the authoring type surface in:
  - `workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.authoring.d.ts`
- Rewrote the inventory VM bundle in:
  - `workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.vm.js`
- Updated inventory stack system capabilities in:
  - `workspace-links/go-go-app-inventory/apps/inventory/src/domain/stack.ts`
- Rewrote the prompt pack examples and contract description in:
  - `workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md`
- Ran:
  - `npm run typecheck -w apps/inventory`
  - `npm run typecheck`
  - `node node_modules/typescript/bin/tsc --build workspace-links/go-go-app-inventory/apps/inventory/tsconfig.json`

### Why

- The runtime package alone is not enough. If the bundle and prompt docs stay stale, APP-11 fails in practice because humans and models will keep writing code for the deleted API.
- The inventory bundle is the highest-signal authored example in the stack, so it has to demonstrate the new contract clearly.

### What worked

- The direct `tsc --build` command completed successfully:

```bash
node node_modules/typescript/bin/tsc --build workspace-links/go-go-app-inventory/apps/inventory/tsconfig.json
```

- The inventory bundle now uses the same runtime concepts the host projects: `draft`, `filters`, `inventory`, `sales`, and `nav`.
- The prompt doc no longer contains references to `cardState`, `sessionState`, `globalState`, or the four scoped dispatch helpers.

### What didn't work

- `npm run typecheck -w apps/inventory` failed before it reached our code because the repo-local script expects `workspace-links/go-go-app-inventory/node_modules/typescript/bin/tsc`, which does not exist in this environment:

```text
Error: Cannot find module '/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/node_modules/typescript/bin/tsc'
```

- `npm run typecheck` from the inventory repo root failed for the same reason.

### What I learned

- The inventory-side runtime contract is much easier to read once local UI state is treated as `state.draft` and session-shared controls are treated as `state.filters`.
- The repo’s existing `typecheck` scripts are environment-sensitive; in this workspace the reliable validation path was to invoke the root TypeScript binary directly.

### What was tricky to build

- The tricky part was rewriting the inventory bundle without accidentally smuggling the old topology back in under new names.
- I kept that under control by rewriting the helper functions first: item lookup, sales lookup, threshold calculation, and report generation now all derive from `state`, and the handlers only emit named actions like `draft.set`, `inventory/saveItem`, `nav.go`, or `notify.show`.

### What warrants a second pair of eyes

- `pluginBundle.vm.js` should be reviewed carefully for any places where `state.draft` or `state.filters` might still be too generic and deserve more explicit semantic names later.
- `runtime-card-policy.md` should be skimmed once more to confirm there are no stale examples left outside the main contract and tiny-example sections.

### What should be done in the future

- Refresh the APP-11 ticket bundle again so the delivered reMarkable copy includes the implementation steps and commit hashes.

### Code review instructions

- Start with:
  - `workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.vm.js`
  - `workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.authoring.d.ts`
  - `workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md`
- Validate with:
  - `node node_modules/typescript/bin/tsc --build workspace-links/go-go-app-inventory/apps/inventory/tsconfig.json`
- Treat the `npm run typecheck` failure as an environment script issue unless the direct `tsc --build` path also fails.

### Technical details

- Commits:

```text
c1df9ac Rewrite inventory cards for new runtime API
```

## Step 7: Refresh The Delivered Ticket Bundle

After the diary, task list, and changelog reflected the real code commits and validation commands, I uploaded the APP-11 bundle one final time so the reMarkable copy matched the current ticket state rather than the earlier planning-only version.

This was a short but necessary closure step. Without it, the remote PDF would lag behind the actual implementation record, which would defeat the purpose of keeping the ticket, commits, and delivered artifact synchronized.

### Prompt Context

**User prompt (verbatim):** (same as Step 4)

**Assistant interpretation:** Keep the delivered APP-11 artifact in sync as implementation progresses.

**Inferred user intent:** Make sure the reMarkable copy is not just a planning document, but the current implementation record.

**Commit (code):** N/A

### What I did

- Uploaded the refreshed APP-11 bundle with:
  - `remarquee upload bundle --force ... --remote-dir "/ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION" --toc-depth 2`
- Verified the remote folder again with:
  - `remarquee cloud ls /ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION --long --non-interactive`
- Marked the final bundle-readiness task complete in `tasks.md`.

### Why

- The implementation diary and changelog changed materially after the code commits.
- The user explicitly asked for the ticket work and the delivery artifact to stay in sync.

### What worked

- The upload succeeded with:

```text
OK: uploaded APP-11 HyperCard VM Boundary Simplification.pdf -> /ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION
```

- The remote verification succeeded with:

```text
[f] APP-11 HyperCard VM Boundary Simplification
```

### What didn't work

- N/A

### What I learned

- The cleanest ticket workflow is still the same: update docs, commit them, then refresh the delivered bundle so the device copy tracks the committed state.

### What was tricky to build

- Nothing was technically tricky here. The only real risk was forgetting to do the final refresh after the implementation diary grew beyond the earlier planning bundle.

### What warrants a second pair of eyes

- Spot-check the final PDF on the device or in the cloud UI if visual formatting matters for the long diary sections.

### What should be done in the future

- N/A

### Code review instructions

- Confirm the remote folder contents with:
  - `remarquee cloud ls /ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION --long --non-interactive`

### Technical details

- Upload result:

```text
OK: uploaded APP-11 HyperCard VM Boundary Simplification.pdf -> /ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION
```

### What should be done in the future

- Start the actual APP-11 implementation work in the frontend runtime code.

### Code review instructions

- Review the design doc first, then confirm the ticket bookkeeping files reflect the same state:
  - `tasks.md`
  - `changelog.md`
  - `reference/01-implementation-diary.md`
- Replay hygiene if needed:

```bash
docmgr doctor --ticket APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION --stale-after 30
```

- Replay delivery if a new version is needed:

```bash
remarquee upload bundle <same files> --name "APP-11 HyperCard VM Boundary Simplification" --remote-dir "/ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION" --toc-depth 2 --force
```

### Technical details

- Related-file bookkeeping commands:

```bash
docmgr doc relate --doc <design-doc> --file-note "/abs/path:reason" ...
docmgr doc relate --doc <diary> --file-note "/abs/path:reason" ...
```

- Hygiene result:

```text
## Doctor Report (1 findings)

### APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION

- ✅ All checks passed
```

## Step 8: Sweep The Remaining Linked App Consumers

After the initial APP-11 runtime and inventory commits, the remaining breakages were no longer in the core runtime package. They were in linked apps that still consumed the deleted API. The two visible symptoms were an ARC import failure for `ingestRuntimeIntent` and runtime crashes from plugin bundles that still expected split state plus scoped dispatch helpers.

I converted that loose cleanup into explicit execution slices in `tasks.md`, then finished the sweep repo by repo instead of adding compatibility layers. ARC needed both the bridge ingestion fix and the bundle/stack cutover. SQLite needed a full rewrite from `globalState.domains.app_sqlite` and `dispatch*Action(...)` helpers to projected `state.app_sqlite` plus generic runtime actions.

### Prompt Context

**User prompt (verbatim):** "go ahead, make tasks, then go through them, commit appropriately."

**Assistant interpretation:** Turn the remaining APP-11 cleanup into explicit ticket tasks, execute the remaining repo migrations one at a time, and leave a commit trail that matches the task slices.

**Inferred user intent:** Finish the direct-cutover rollout completely rather than stopping after the core runtime and inventory repos, and make continuation/review easy through focused commits and a detailed diary.

**Commit (code):** `2f91571` — `Migrate ARC plugin runtime bundle`; `12c145f` — `Migrate SQLite plugin runtime bundle`

### What I did

- Expanded `tasks.md` with three remaining execution slices:
  - ARC AGI player runtime cutover
  - SQLite runtime cutover
  - ticket closeout for the sweep
- Committed ARC AGI player changes in `workspace-links/go-go-app-arc-agi-3`:
  - `apps/arc-agi-player/src/bridge/ArcPendingIntentEffectHost.tsx`
  - `apps/arc-agi-player/src/bridge/middleware.ts`
  - `apps/arc-agi-player/src/domain/pluginBundle.ts`
  - `apps/arc-agi-player/src/domain/stack.ts`
- Replaced `ingestRuntimeIntent(...)` with `ingestRuntimeAction(...)` in the ARC bridge and changed the mirrored runtime state action from a scoped session patch to `filters.patch`.
- Rewrote the ARC plugin bundle to render from `{ state }`, dispatch only generic runtime actions, read projected `arcBridge` state directly, and use `notify.show`.
- Expanded ARC stack capabilities to include both `arc` dispatch actions and projected `arcBridge` state reads.
- Committed SQLite changes in `workspace-links/go-go-app-sqlite`:
  - `apps/sqlite/src/domain/pluginBundle.vm.js`
  - `apps/sqlite/src/domain/stack.ts`
- Rewrote the SQLite plugin bundle to:
  - use `state.draft` for query-form state
  - use `state.app_sqlite.hypercard` for runtime status/results
  - dispatch `sqlite/query.execute`, `sqlite/seed.execute`, `nav.go`, `nav.back`, and `notify.show`
- Expanded SQLite stack capabilities so runtime projection includes `app_sqlite` while dispatch authorization still covers `sqlite/*`.
- Validated SQLite with:
  - `node node_modules/typescript/bin/tsc --build workspace-links/go-go-app-sqlite/apps/sqlite/tsconfig.json`
- Attempted ARC validation with:
  - `node node_modules/typescript/bin/tsc --build workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/tsconfig.json`

### Why

- The runtime contract cutover is not complete if linked app bundles still import deleted helpers or expect `cardState`, `sessionState`, and `globalState`.
- Adding wrapper APIs at this stage would directly violate the APP-11 decision to do a clean cross-stack cutover with no compatibility layer.
- Keeping the remaining work in repo-sized commits makes it much easier to review which breakage each slice fixed.

### What worked

- ARC no longer contains imports or usage sites for `ingestRuntimeIntent`, `dispatchCardAction`, `dispatchSessionAction`, `dispatchDomainAction`, or `dispatchSystemCommand` in the app source tree.
- The ARC runtime bridge now looks for queued actions with `intent.type === 'arc/command.request'`, which matches the post-APP-11 action envelope.
- SQLite now typechecks cleanly with the direct `tsc --build` command.
- The SQLite bundle now follows the same runtime model as the migrated first-party examples:
  - projected runtime state via `state`
  - local card draft via `state.draft`
  - app/runtime slice projection via `state.app_sqlite`
  - generic `dispatch({ type, payload })`

### What didn't work

- ARC TypeScript validation still fails before it reaches app-level correctness because the workspace config pulls linked package sources outside the app’s configured `rootDir`:

```text
workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/bridge/middleware.ts(1,27): error TS6059: File '/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/index.ts' is not under 'rootDir' '/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src'. 'rootDir' is expected to contain all source files.
```

- The same ARC build also reported the existing linked-source issue for `@hypercard/hypercard-runtime` and a pre-existing raw-module resolution error in the linked runtime package:

```text
workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts(13,34): error TS2307: Cannot find module './stack-bootstrap.vm.js?raw' or its corresponding type declarations.
```

### What I learned

- The post-APP-11 cleanup problem is mostly about stack capability declarations and projected state names, not about the runtime host anymore.
- Linked apps that keep reducer state under app-specific keys such as `app_sqlite` need that exact slice name in plugin capabilities once the runtime host stops passing through the whole app tree.
- The ARC bridge and ARC plugin bundle both needed to move in lockstep because one side mirrors runtime filter state while the other side reads it.

### What was tricky to build

- The tricky part was separating real APP-11 regressions from existing workspace-configuration failures. ARC had a real runtime API mismatch, but its standalone `tsc` build is also broken by pre-existing linked-package `rootDir` assumptions.
- The symptoms were noisy: once TypeScript starts compiling linked `go-go-os-frontend` package sources into the ARC app program, it emits a wall of `TS6059` errors that are not caused by the ARC bundle rewrite itself.
- I handled that by reviewing the diff directly, running stale-API searches against the ARC app source tree, and treating the typecheck failure as an existing validation limitation to record rather than as a reason to keep legacy helpers alive.

### What warrants a second pair of eyes

- ARC should be checked in the browser once to confirm the projected `arcBridge` state name matches what `PluginCardSessionHost` now exposes for that stack.
- SQLite should be spot-checked interactively to confirm the `state.draft` query form preserves the same behavior across navigation and re-opened card sessions.
- The ARC workspace TypeScript configuration should be reviewed separately; its current linked-source `rootDir` assumptions make targeted validation much less useful than it should be.

### What should be done in the future

- Fix the ARC AGI player TypeScript workspace configuration so targeted app validation does not fail on linked package paths before reaching app code.
- Re-upload the APP-11 ticket bundle again if the user wants the latest diary/changelog state reflected on reMarkable.

### Code review instructions

- Start with the ARC cutover files:
  - `workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/bridge/ArcPendingIntentEffectHost.tsx`
  - `workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/bridge/middleware.ts`
  - `workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/domain/pluginBundle.ts`
  - `workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/domain/stack.ts`
- Then review the SQLite cutover files:
  - `workspace-links/go-go-app-sqlite/apps/sqlite/src/domain/pluginBundle.vm.js`
  - `workspace-links/go-go-app-sqlite/apps/sqlite/src/domain/stack.ts`
- Validate SQLite with:
  - `node node_modules/typescript/bin/tsc --build workspace-links/go-go-app-sqlite/apps/sqlite/tsconfig.json`
- Treat the ARC `tsc --build` output as a workspace-configuration blocker unless the linked-package `rootDir` issue is fixed first.

### Technical details

- Commands run:

```bash
rg -n "dispatchCardAction|dispatchSessionAction|dispatchSystemCommand|dispatchDomainAction|cardState|sessionState|globalState|ingestRuntimeIntent" workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player
git -C workspace-links/go-go-app-arc-agi-3 commit -m "Migrate ARC plugin runtime bundle"
node node_modules/typescript/bin/tsc --build workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/tsconfig.json

rg -n "dispatchCardAction|dispatchSessionAction|dispatchSystemCommand|dispatchDomainAction|cardState|sessionState|globalState" workspace-links/go-go-app-sqlite/apps/sqlite/src
git -C workspace-links/go-go-app-sqlite commit -m "Migrate SQLite plugin runtime bundle"
node node_modules/typescript/bin/tsc --build workspace-links/go-go-app-sqlite/apps/sqlite/tsconfig.json
```

- Commits:

```text
2f91571 Migrate ARC plugin runtime bundle
12c145f Migrate SQLite plugin runtime bundle
```

## Related

- `../design-doc/01-intern-guide-to-hypercard-vm-boundary-simplification-runtime-flow-and-implementation-plan.md`
- `../tasks.md`
- `../changelog.md`
