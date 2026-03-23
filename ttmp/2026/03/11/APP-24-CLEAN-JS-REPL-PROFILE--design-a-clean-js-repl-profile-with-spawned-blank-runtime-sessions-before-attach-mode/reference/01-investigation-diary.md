---
Title: Investigation diary
Ticket: APP-24-CLEAN-JS-REPL-PROFILE
Status: active
Topics:
    - architecture
    - frontend
    - repl
    - tooling
    - hypercard
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl/src/MacRepl.tsx
      Note: Re-read to confirm the shell is already generic enough for a plain JS profile.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl/src/types.ts
      Note: Re-read to confirm the current driver/help/completion/effect contracts are reusable for a JS REPL.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts
      Note: Re-read to show why the current broker starts at the bundle/surface layer and is therefore the wrong seam for blank JS.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: Re-read to identify the lower-level QuickJS lifecycle logic that should be extracted instead of duplicated.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/hypercardReplModule.tsx
      Note: Current launcher integration used as the comparison point for a simpler JS REPL host module.
Summary: Investigation diary for designing a true blank JavaScript REPL profile with spawned QuickJS sessions, intentionally separate from HyperCard attach mode and from bundle/surface-specific runtime tooling.
LastUpdated: 2026-03-11T15:40:00-04:00
WhatFor: Record the reasoning behind doing a plain JS REPL before attach mode and show why the existing runtime broker is the wrong abstraction level for blank JavaScript evaluation.
WhenToUse: Use when implementing APP-24 or when deciding whether generic JS tooling should reuse or bypass the HyperCard bundle/surface layer.
---

# Investigation diary

## Goal

Create a dedicated ticket for a clean JavaScript REPL profile with its own spawned sessions, and explain in detail why this should happen before attach mode for existing HyperCard runtime sessions.

## Step 1: Confirm the current REPL shell is already generic enough

I started by re-reading the extracted `@hypercard/repl` shell because the first question was whether APP-24 needed a new shell at all.

The answer is no.

`MacRepl` already operates on:

- a generic `ReplDriver`
- generic completion items
- generic help entries
- generic host effects

That means APP-24 is not a shell ticket. It is a driver/broker/runtime-seam ticket.

This is important because it keeps the next architecture step narrow and reduces the risk of duplicating UI work that APP-22 already finished.

## Step 2: Reconfirm that the current HyperCard broker is too high-level

I then re-read `runtimeBroker.ts` and the answer was straightforward:

- the broker is designed around `RuntimeBundle`
- it assumes `packageIds`
- it assumes bundle code
- it assumes runtime surfaces
- it assumes render/event operations

That is exactly what we want for HyperCard runtime tooling, but it is the wrong public interface for a blank JS REPL.

This was the key design decision for the ticket:

- APP-24 should not “fake” a blank JS REPL as a weird empty bundle
- APP-24 should introduce or extract a lower-level JS session seam

## Step 3: Identify the real reuse point

`QuickJSRuntimeService` still contains valuable lower-level machinery:

- booting the QuickJS module
- creating runtimes and contexts
- timeouts
- memory and stack limits
- error formatting
- disposal

The issue is not the implementation language or engine choice. The issue is the public API boundary. The current public API starts at `loadRuntimeBundle(...)`, which is already inside HyperCard framework semantics.

So the real reuse point is:

- keep the shared QuickJS lifecycle
- extract a lower-level session service
- let the HyperCard runtime service build on top of it
- let the plain JS REPL build on top of it

## Step 4: Decide sequencing relative to attach mode

The user explicitly asked whether attach mode should happen first instead.

After rechecking the current state, the answer stayed the same:

- attach mode is more coupled
- attach mode needs ownership rules
- attach mode needs discovery rules
- attach mode needs read/write safety rules
- attach mode needs lifecycle coordination with existing windows and hosts

The clean JS REPL has none of those constraints.

That makes APP-24 the correct next foundational ticket after APP-22.

## Step 5: Decide the first user experience

The first user experience should not imitate the current HyperCard command vocabulary too closely.

The better UX for a plain JS REPL is:

- colon-prefixed meta commands
- plain JS for everything else

Examples:

- `:spawn js-1`
- `:use js-1`
- `1 + 2`
- `const x = 41`
- `x + 1`
- `:globals`

This keeps the mental model much cleaner than trying to overload plain JS syntax with bundle/surface authoring commands.

## Step 6: Bound the scope intentionally

It would be easy for this ticket to explode into:

- a full object inspector
- multi-line editor semantics
- debugger hooks
- attach mode
- package loading
- docs mounting

That would be a mistake.

The right first boundary is:

- spawn a blank session
- eval code
- persist globals
- print results/logs/errors
- reset/dispose sessions
- provide basic completions/help

That is enough to prove the architecture and enough to unblock later attach-mode work.

## Step 7: Turn APP-24 into implementation slices

Before writing code, I expanded the backlog into real execution slices instead of one flat list.

The practical reason is that APP-24 crosses three layers:

- shared QuickJS lifecycle
- blank JS session service / broker
- REPL driver and launcher integration

If those get mixed together in one patch, review quality drops and it becomes hard to tell whether a failure is:

- a VM lifecycle regression
- a broker/lifecycle bug
- a driver/formatting issue

So the ticket now has explicit slices:

1. extract shared QuickJS lifecycle helpers
2. implement `JsSessionService`
3. implement `JsSessionBroker`
4. implement the JS REPL driver
5. add the `wesen-os` launcher module

That is the order I will follow in code too.

## Step 8: Extract the shared QuickJS seam and implement the first blank-session service

The first implementation checkpoint deliberately stayed below any REPL-driver work. I wanted to prove two things independently:

1. the shared QuickJS lifecycle can be extracted without changing HyperCard runtime behavior
2. a blank JS session service can exist without forcing everything through the bundle/surface layer

### Prompt Context

**User prompt (verbatim):** "ok, cool, then let's add tasks for APP-24 and then work on them step by step"

**Assistant interpretation:** Turn APP-24 into an active implementation ticket and begin with the lowest-risk foundational slice instead of jumping straight to a broker or UI.

**Inferred user intent:** Build the plain JS REPL architecture incrementally and visibly, with the foundation landing first and the diary/tasks staying current.

### What I changed

I extracted the common QuickJS lifecycle pieces from `runtimeService.ts` into:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/quickJsSessionCore.ts`

That file now owns:

- shared QuickJS module bootstrapping
- VM/context creation
- timeout/deadline helpers
- `eval` helpers
- JS literal encoding
- VM disposal

Then I moved `QuickJSRuntimeService` over to that shared core so the HyperCard path still uses one source of truth for VM lifecycle behavior.

After that, I added the first blank JS service:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/jsSessionService.ts`

This service now supports:

- `createSession(...)`
- `evaluate(...)`
- `getGlobalNames(...)`
- `resetSession(...)`
- `disposeSession(...)`
- `clear()`

The session service also installs a tiny REPL bootstrap that captures `console.log(...)` through `globalThis.__jsReplHost`.

### Why this checkpoint matters

This is the first time the codebase has a true blank JS session layer that is not pretending to be a runtime bundle.

That is the key APP-24 architectural test. If this layer had turned out awkward or highly repetitive, it would have meant the design was wrong. It did not. The implementation fit cleanly once the shared QuickJS VM lifecycle was pulled down a level.

### Validation

Commands that passed:

- `pnpm exec vitest run packages/hypercard-runtime/src/plugin-runtime/jsSessionService.test.ts packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts --reporter=verbose`
- `npm run typecheck -w packages/hypercard-runtime`

New JS session tests now cover:

- arithmetic evaluation
- persistent globals across eval calls
- `console.log` capture
- thrown error formatting
- timeout behavior
- session reset behavior

And the existing HyperCard runtime integration test suite still passes on top of the shared QuickJS core.

### Result

APP-24 now has its foundation:

- shared QuickJS session core
- blank JS session service

The next slice can build `JsSessionBroker` on top of that instead of building directly on `QuickJSRuntimeService`.

## Step 9: Add the broker and the first real JS REPL driver

Once the blank session service was stable, the next step was straightforward: add the public tool-facing seam and then use it to implement the actual driver contract that `@hypercard/repl` expects.

### What I changed

I added the broker in:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts`

This mirrors the shape of the HyperCard runtime broker, but at the lower JS-session layer:

- `spawnSession(...)`
- `getSession(...)`
- `listSessions()`
- `resetSession(...)`
- `disposeSession(...)`
- subscription support

The important rule stayed intact:

- live handles remain outside Redux
- only serializable summaries are returned from `listSessions()`

Then I added the first plain JS driver in:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsReplDriver.ts`

It implements the APP-24 interaction model directly:

- `:spawn`
- `:sessions`
- `:use`
- `:globals`
- `:reset`
- `:dispose`
- `:help`

and treats every non-command line as raw JS eval against the active session.

### Why this matters

This is the first time the codebase has a real non-HyperCard REPL driver. That is the core architectural proof APP-24 was meant to provide.

At this point, the system now has:

- reusable shell (`@hypercard/repl`)
- HyperCard runtime driver/profile
- plain JS driver/profile

That confirms the shell is actually becoming a multi-profile platform and not just a HyperCard console with extra steps.

### Validation

Commands that passed:

- `pnpm exec vitest run packages/hypercard-runtime/src/repl/jsSessionBroker.test.ts packages/hypercard-runtime/src/repl/jsReplDriver.test.ts packages/hypercard-runtime/src/plugin-runtime/jsSessionService.test.ts packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts --reporter=verbose`
- `npm run typecheck -w packages/hypercard-runtime`

New coverage now includes:

- broker spawn/list/reset/dispose/subscription flows
- JS REPL command handling
- plain-JS eval with persistent globals

## Step 10: Make the plain JS REPL behave like a real transcript and expose sessions in debug tooling

Once the first launcher module was in place, the next real usability issue showed up immediately in live use:

- pressing Enter executed the command, but the command itself did not appear in the transcript unless the driver manually echoed it

That was a shell bug, not a broker bug.

### What I changed

I updated `MacRepl.tsx` so the shell prepends an `input` transcript line for every non-empty submission, even if the driver only returns output lines.

That keeps the user interaction model correct:

- the shell owns transcript rendering
- the driver owns result formatting

I also added a focused `MacRepl.test.tsx` regression test for that exact case.

### Why this matters

Without transcript echo, the plain JS REPL feels broken as soon as the driver returns only evaluation results. A real REPL should always show:

1. what the user typed
2. what the system returned

That is especially important for blank JS sessions, where the transcript is the only immediate record of the interactive session.

## Step 11: Decide how plain JS sessions should appear in debug tooling

The user also asked why the new blank JS sessions did not appear in `Stacks & Cards`.

After re-reading the debug window and runtime state model, the answer was clear:

- `Stacks & Cards` is runtime-surface oriented
- it reads bundle metadata, injected runtime surfaces, artifact runtime surfaces, and runtime-surface sessions from Redux
- `JsSessionBroker` sessions are different objects with different lifecycle semantics

Forcing plain JS sessions into the runtime-surface Redux slice would have been the wrong fix.

### What I changed instead

I added:

- `jsSessionDebugRegistry.ts`

This is the matching debug-side registry for broker-owned JS session sources.

Then I extended `RuntimeSurfaceDebugWindow.tsx` with a dedicated `JS Sessions` section that:

- subscribes to registered `JsSessionBroker`s
- renders serializable `JsSessionSummary` rows
- exposes `Reset` and `Dispose` actions

The `js-repl` launcher module now registers its broker explicitly as a debug source.

### Architectural result

This keeps the models clean:

- runtime-surface sessions remain runtime-core state
- plain JS sessions remain broker-owned external state
- the debug window can present both

That is already close to the future task-manager concept, but without collapsing two different session models into one fake shared reducer.

## Step 12: Live smoke

I verified the new behavior against the running app on `http://localhost:5173`.

Observed successful flow:

1. open `JavaScript REPL`
2. submit `:spawn js-1`
3. confirm the transcript shows:
   - `▸ :spawn js-1`
   - `Spawned JS session js-1`
4. open `Stacks & Cards`
5. confirm the `JS Sessions` section shows:
   - session id `js-1`
   - source `JavaScript REPL`
   - reset/dispose buttons

This was the first end-to-end proof that the blank JS REPL is not just unit-tested, but visible and inspectable in the live desktop shell too.
- console log capture
- driver help/completion behavior

### Result

APP-24 is now complete through the driver layer. The remaining work is the `wesen-os` launcher module and live desktop integration.

## Step 10: Add the first `wesen-os` launcher module

With the driver finished, the next slice was intentionally small: prove the plain JS profile can live in the desktop shell without dragging in any of the heavier HyperCard runtime-window machinery.

### What I changed

I added:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/jsReplModule.tsx`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/jsReplModule.test.tsx`

and wired the module into:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/modules.tsx`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/__tests__/launcherHost.test.tsx`

The module is intentionally simpler than `hypercardReplModule.tsx`:

- one console window
- one app id: `js-repl`
- no runtime-surface child windows
- no runtime package/bundle docs wiring

That is the correct first UI for APP-24.

### Validation

Commands that passed:

- `pnpm exec vitest run src/app/jsReplModule.test.tsx src/app/hypercardReplModule.test.tsx src/__tests__/launcherHost.test.tsx --reporter=verbose`
- `npm run vmmeta:generate` in `apps/os-launcher`

### Remaining UI work

The focused launcher tests are done, but I have not yet recorded a fresh live browser smoke specifically for the new `js-repl` window. That stays as the last open subtask in the current slice.
