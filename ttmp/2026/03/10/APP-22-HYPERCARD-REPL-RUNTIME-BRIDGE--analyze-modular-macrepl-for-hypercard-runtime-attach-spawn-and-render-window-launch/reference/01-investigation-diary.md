---
Title: Investigation diary
Ticket: APP-22-HYPERCARD-REPL-RUNTIME-BRIDGE
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - widgets
    - repl
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/repl/MacRepl.tsx
      Note: Re-read during the APP-22 refresh to confirm the shell/driver coupling points and current reuse limits.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/repl/replCommands.ts
      Note: Re-read to confirm the current completion/help model is hardcoded and synchronous.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/repl/replState.ts
      Note: Re-read to confirm the current reducer shape is terminal-specific rather than generic protocol/session state.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: Re-read after APP-16 and APP-23 to map the current runtime service contract the REPL would need.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Re-read to verify the injected runtime-package API model and the live VM-side contract.
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Re-read to confirm that attach mode still needs a tool-facing broker/registration seam.
Summary: Investigation diary for the refreshed APP-22 design, now centered on a reusable REPL shell platform, provider-driven autocomplete/help, and a HyperCard runtime bridge that fits the extracted runtime-package architecture.
LastUpdated: 2026-03-11T14:03:30-04:00
WhatFor: Record the reasoning and evidence behind the refreshed APP-22 architecture so later implementation work does not have to rediscover the same shell/runtime boundary decisions.
WhenToUse: Use when continuing APP-22, deciding where the generic REPL protocol belongs, or implementing spawn/attach tooling for runtime sessions.
---

# Investigation diary

## Goal

Refresh APP-22 after the runtime/package architecture changed substantially, and make sure the ticket now describes a reusable REPL platform plus one HyperCard runtime bridge, not just a HyperCard-specific terminal hack.

## Step 1: Re-audit the current `MacRepl`

I started again from `packages/rich-widgets/src/repl/MacRepl.tsx` because the first question is still the same:

- what parts of the current REPL are worth keeping?
- what parts need to be redesigned?

The answer is clearer now than on the first pass.

Worth keeping:

- visual shell
- prompt/history interaction model
- basic completion popup interaction
- launcher/story presence

Not worth keeping as architecture:

- direct call to `executeReplCommand(...)`
- command-specific state shape
- hardcoded synchronous command semantics
- help/completion model that only knows local commands and aliases

This reconfirmed the core shell conclusion:

- the current widget is a reusable REPL *look and feel*
- it is not yet a reusable REPL *protocol and execution model*

## Step 2: Re-audit the current runtime with the new architecture in mind

The earlier version of APP-22 still described the runtime mostly in pre-APP-16 / pre-APP-23 terms. That is no longer good enough.

After the refresh, the important runtime facts are:

- runtime core now has the correct `RuntimeSession` / `RuntimeBundle` / `RuntimePackage` / `RuntimeSurface` / `RuntimeSurfaceType` vocabulary
- `ui` and `kanban` are now external concrete packages
- host apps register packages explicitly

That changes the REPL design significantly.

A useful runtime-aware REPL should now understand:

- which runtime packages are installed
- which surface types are available
- which bundle is loaded
- which surfaces exist
- where docs/help should come from

So the REPL cannot just be “JavaScript eval with a pretty window.” It has to become package-aware and docs-aware.

## Step 3: Decide that the shell itself must be reusable

The user explicitly asked to plan for:

- autocomplete
- on-demand help
- reuse of the REPL window for other languages or use cases

That immediately ruled out a narrower design where `MacRepl` becomes “the HyperCard console widget.”

The better model is:

- shell UI remains generic
- a generic protocol sits between shell and execution backend
- concrete profile/driver bindings implement one use case each

This also makes future language adoption easier. Even if the system later grows:

- a Lua runtime
- a Python runtime
- a SQL console
- an agent/tool console

the shell and its controller should not need to be rebuilt.

## Step 4: Add provider-driven help and completion to the architecture

The original APP-22 draft treated completion and help as secondary details. That was no longer enough once the user called them out explicitly.

I changed the design direction to use provider seams:

- completion providers
- help providers
- inspection providers

That decision matters because different information sources already exist in this repo:

- runtime package docs metadata
- docs-browser mounts
- bundle-local `vmmeta`
- runtime-package registries
- live runtime session summaries

If the shell hardcodes one completion/help source, it becomes brittle. Provider-based resolution is the cleaner long-term model.

## Step 5: Keep HyperCard-specific ownership in `hypercard-runtime`

I rechecked the same boundary question from the first draft:

- should HyperCard runtime logic leak into `rich-widgets`?

The answer is still no, and it is even clearer now.

`rich-widgets` should own:

- presentation
- shell chrome
- transcript rendering
- generic shell interaction

`hypercard-runtime` should own:

- HyperCard runtime handles
- spawn/attach broker
- package-aware commands
- package-aware help/completion
- session summaries

This mirrors the current post-APP-16 architecture well.

## Step 6: Reconfirm spawn mode before attach mode

The old APP-22 draft already preferred spawn mode first. I revisited that after the runtime cleanup to see whether attach mode had become easy enough to pull forward.

It has not.

`RuntimeSurfaceSessionHost` still owns live runtime service instances privately. So attach mode still needs:

- a broker or handle registry
- safe registration/unregistration
- decisions about read-only vs read-write attach

Spawn mode is still the correct first useful slice because:

- it uses runtime-core APIs we already have
- it avoids ownership collisions with live windows
- it is enough to prove the shell/protocol/provider architecture

## Step 7: Reconfirm normal host window launches

The REPL should not invent a second rendering/window system.

That conclusion held up on the refreshed pass too. The right design is:

- REPL driver returns semantic effects
- host effect executor maps those to desktop actions
- window launch still happens through `openWindow(...)`

That means REPL-driven rendering windows fit naturally into the existing desktop shell rather than bypassing it.

## Step 8: New architecture conclusion

The refreshed APP-22 conclusion is stronger than the original one.

The real deliverable is not:

- “HyperCard REPL”

It is:

- reusable REPL shell platform
- generic driver/protocol/provider architecture
- one HyperCard runtime profile/driver on top

That is the only design that satisfies all of the current asks at once:

- runtime spawn tooling
- future attach tooling
- autocomplete
- on-demand help
- multi-language reuse
- render-window launch

## Step 9: Turn the ticket into an implementation backlog

Once the refreshed design was in place, the next question was whether to stop and create separate follow-up tickets or keep APP-22 as the execution ticket. I chose to keep APP-22 as the execution ticket for the early slices because the first refactor is self-contained and local to the existing `MacRepl` widget.

The implementation decision is intentionally conservative:

- start the generic shell/protocol extraction inside `packages/rich-widgets/src/repl/core`
- keep the current toy command behavior alive through one built-in demo driver
- do not take on HyperCard runtime spawn/attach in the same first patch

That gives us a real architectural seam quickly without mixing three risky edits at once.

It also answers one of the open APP-22 questions directly: the generic protocol/controller should not become a separate package yet. It should stabilize under the current widget first, then get extracted once the contracts stop moving.

## Step 10: Extract the first reusable REPL core and keep the demo behavior alive

The first implementation slice focused on the minimum architectural seam that actually changes the code shape: stop letting the shell import command tables and execution functions directly. That meant introducing a generic driver contract and making the current toy command set just one concrete driver implementation.

I kept this first patch intentionally narrow. It does not yet touch HyperCard runtime spawn or attach. It only makes the current `MacRepl` shell less special-purpose and easier to reuse for a later HyperCard profile, SQL profile, or another tooling console.

### Prompt Context

**User prompt (verbatim):** "ok, create detailed tasks, and then start the work"

**Assistant interpretation:** Expand APP-22 into concrete implementation slices and start coding the first slice immediately.

**Inferred user intent:** Turn the refreshed REPL research ticket into active implementation work, with visible code movement and good bookkeeping rather than leaving it as design-only analysis.

**Commit (code):** `a5f475d` — `Extract generic REPL core from MacRepl`

### What I did
- Expanded APP-22 tasks into concrete implementation slices for:
  - generic REPL core extraction
  - shell refactor
  - validation/examples
  - later HyperCard runtime broker work
- Added reusable REPL core contracts in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/repl/core/types.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/repl/core/controller.ts`
- Refactored `MacRepl` and `ReplInputLine` so the shell consumes:
  - a `ReplDriver`
  - generic completion items
  - generic execution results
- Converted the old built-in command engine into one concrete driver:
  - `BUILTIN_DEMO_REPL_DRIVER`
- Added a custom-driver Storybook example to prove the shell can now host a different profile without changing the shell code
- Added focused tests for:
  - controller completion logic
  - built-in demo driver behavior

## Step 11: Implement the first attach-mode checkpoint as read-only live-session attach

Once spawn mode, the launcher module, and broker-backed `open-surface` flows were working, the next APP-22 question was whether attach mode should continue to stay purely theoretical. At this point the architecture was ready for a narrow first slice: discover live interactive runtime sessions and let the REPL render against them without taking ownership away from the existing host.

I chose a deliberately conservative attach design:

- live `RuntimeSurfaceSessionHost` instances register themselves as attach targets
- attached sessions are visible in the HyperCard REPL `sessions` list
- `attach <session-id>` and `use <session-id>` work for those live sessions
- attached sessions are read-only

That keeps the safety and ownership model simple. The existing host still owns session lifecycle, event dispatch, and desktop routing. The REPL gains inspection and rendering power without becoming a second competing writer.

### Why this shape

The important design choice was to avoid smuggling attach mode into the spawned-session broker. Spawned broker sessions and attached live sessions have different ownership semantics:

- spawned sessions are owned by the broker and are writable
- attached sessions are owned elsewhere and are not safe to mutate yet

So I added a separate attached-session registry instead of pretending both sources have identical semantics.

### Code changes

In `hypercard-runtime` I added:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.ts`
  - external store for live attached sessions
- `QuickJSRuntimeService.getRuntimeBundleMeta(...)`
  - so host-owned sessions can expose bundle/surface/package metadata without inventing a second metadata source
- registration in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`

The host now registers a read-only attached handle once:

- the bundle plugin config exists
- the runtime session is ready
- the host is not in preview mode

The attached handle exposes:

- `renderSurface(...)`
- `eventSurface(...)`
- `getBundleMeta()`

but the REPL driver treats the session as read-only and blocks mutation-oriented commands.

In the HyperCard REPL driver I added:

- mixed session discovery:
  - spawned broker sessions
  - attached live sessions
- `attach <session-id>`
- `use <session-id>` support for attached sessions
- explicit read-only enforcement for attached sessions on:
  - `event`
  - `define-surface`
  - `define-render`
  - `define-handler`
  - `open-surface`

The last one is important. `open-surface` today still assumes a broker-owned spawned session that can back its own window route. Attached live sessions do not yet have that routing handoff, so I kept it blocked instead of guessing.

### Test failures and fix

The first failing test was the host rerender test in:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx`

It timed out waiting for `Count: 0`. The root problem was not attach logic itself; it was that the test still assumed `ui.card.v1` was pre-registered globally. After APP-16, runtime surface-type registration is explicit. So I updated the test to register a test `ui` package and `ui.card.v1` surface type before rendering.

My first fix imported `@hypercard/ui-runtime` directly into that test, which made Vitest happy but broke the `hypercard-runtime` package typecheck with the expected `rootDir` / `file list` errors. I replaced that with the local test helper in:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/testRuntimeUi.tsx`

That kept the test faithful to the explicit-registration model without pulling another package’s source tree into the package-local `tsconfig`.

### Validation

I validated the attach checkpoint with:

- `pnpm exec vitest run workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/attachedRuntimeSessionRegistry.test.ts workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.test.ts workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/hypercardReplDriver.test.ts workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.rerender.test.tsx --reporter=verbose`
- `pnpm exec tsc --noEmit -p workspace-links/go-go-os-frontend/packages/hypercard-runtime/tsconfig.json`

The focused suite now proves:

- attached sessions can be registered and unregistered
- HyperCard REPL can attach to live sessions and render surfaces
- attached sessions are visibly marked as read-only
- mutation commands are blocked while attached
- ready interactive runtime hosts register themselves as attach targets

### Remaining attach-mode questions

This slice intentionally stops short of full collaborative attach mode. The remaining design questions are now smaller and explicit:

- should attached sessions ever allow mutation from the REPL?
- if so, under what ownership/safety model?
- should `open-surface` on attached sessions route through the owning host instead of the broker?
- do we want extra completions/help based on current attached surface state rather than only package and bundle metadata?

## Step 12: Fix the first attach-mode usability gaps

After the first attach checkpoint landed, two rough edges showed up immediately in live use:

- typing `help ...` in the HyperCard REPL did not work even though the driver exposed help metadata
- once attached, the prompt still stayed at the generic `hc>` form instead of showing which session was active

The root cause of the `help` issue was straightforward. The generic REPL shell does not synthesize a help command from `getHelp(...)`; it only exposes provider hooks for completions and separate callers. That meant the HyperCard driver needed to implement an actual `help` command in `execute(...)`, just like the JS REPL already does.

The prompt issue was best solved generically rather than by teaching `MacRepl` about runtime sessions. I added a small shell-level convention:

- if the driver returns `envVars.REPL_PROMPT`
- the shell uses that value as the visible prompt
- otherwise it falls back to the configured default prompt

That keeps the shell reusable while letting specific drivers project session-aware prompts.

For the HyperCard driver I now set:

- `REPL_PROMPT = hc[session-id]>`

when:

- a spawned session becomes active
- `attach <session-id>` succeeds
- `use <session-id>` succeeds

I also tightened completions so attached sessions participate in:

- `use`
- `attach`
- active-session surface completion for `render`, `event`, `define-render`, `define-handler`, and `open-surface`

The focused validation for this follow-up fix was:

- `pnpm exec vitest run workspace-links/go-go-os-frontend/packages/repl/src/MacRepl.test.tsx workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/hypercardReplDriver.test.ts --reporter=verbose`
- `pnpm exec tsc --noEmit -p workspace-links/go-go-os-frontend/packages/repl/tsconfig.json`
- `pnpm exec tsc --noEmit -p workspace-links/go-go-os-frontend/packages/hypercard-runtime/tsconfig.json`

I also re-smoked it live at `http://localhost:5173`:

- opened HyperCard REPL
- ran `help attach`
- ran `attach session-1`
- confirmed the prompt changed to `hc[session-1]>`

## Step 13: Let attached sessions open duplicate read-only surface windows

After the first attach slice was usable, the next obvious gap was `open-surface`. Blocking it entirely was safe, but it was also unnecessarily limiting once the host already had enough information to render a second window against the same attached session.

The important distinction was:

- allowing `open-surface` is not the same as allowing mutation
- the duplicate window can still be read-only

So I changed the model to allow attached sessions to emit the normal `open-window` REPL effect, but updated the `hypercard-repl` host module so it can resolve both:

- broker-owned spawned sessions
- attached live session handles from the attached-session registry

That required a small host change in:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/hypercardReplModule.tsx`

The runtime-surface window renderer now looks up:

- `RUNTIME_BROKER.getSession(sessionId)`
- or `getAttachedRuntimeSession(sessionId)?.handle`

When the opened surface window is backed by an attached session, it renders normally but treats event callbacks as read-only and shows a toast instead of dispatching runtime actions.

This preserves the ownership boundary:

- duplicate attached windows are fine
- REPL still does not become a second writer for that session

I updated the HyperCard REPL driver accordingly:

- `open-surface` no longer errors for attached sessions
- it prints a read-only attached-view message
- it emits the same `open-window` effect payload shape as spawned sessions

### Validation

I validated this checkpoint with:

- `pnpm exec vitest run workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/hypercardReplDriver.test.ts apps/os-launcher/src/app/hypercardReplModule.test.tsx --reporter=verbose`

The broader `apps/os-launcher` typecheck still hits the known unrelated workspace and linked-package errors, including existing `rich-widgets`, ARC, and readonly metadata issues. I did not broaden APP-22 into those.

I also smoke-tested it live:

- opened Inventory `Low Stock`
- opened HyperCard REPL
- ran `sessions`
- attached to the live low-stock session
- ran `open-surface lowStock`
- verified a duplicate read-only `inventory:lowStock` window opened

## Step 11: Turn the broker-backed REPL into a real `wesen-os` launcher module

Once the reusable shell, async driver contract, and broker-backed HyperCard driver were in place, the remaining question was whether the whole thing could operate inside the live desktop shell instead of only in tests and Storybook. The answer is now yes, with one important constraint: this is still spawn-mode-first, not true attach mode.

### Prompt Context

**User prompt (verbatim):** "go ahead"

**Assistant interpretation:** Continue APP-22 by wiring the new REPL stack into the actual `wesen-os` launcher and validating it against the live workspace.

**Inferred user intent:** Stop at neither the extracted package nor the driver. Prove the REPL can be launched from the desktop shell, use the runtime broker to spawn sessions, and open runtime-backed windows through the real host.

**Commits (code):**

- `ecb0884` in `go-go-os-frontend` — `Fix HyperCard REPL driver completions`
- pending `wesen-os` checkpoint for the launcher module and tests

### What I did

- Refreshed workspace links with:
  - `pnpm install`
  at the `wesen-os` root, so the new `@hypercard/repl` package resolves as a real workspace dependency instead of relying only on temporary TypeScript path aliases.
- Added a real launcher module in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/hypercardReplModule.tsx`
- Registered it from:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/modules.tsx`
- Wired the `os-launcher` app dependency graph to know about `@hypercard/repl`:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/package.json`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/tsconfig.json`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/pnpm-lock.yaml`
- Added focused launcher tests in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/hypercardReplModule.test.tsx`
- Extended the existing launcher-host hygiene test so the new module is included in the placeholder-label sweep:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/__tests__/launcherHost.test.tsx`

### What the launcher module actually does

The module introduces two window modes under one app id:

- console window:
  - `hypercard-repl:console`
  - renders `MacRepl`
  - uses the broker-backed `createHypercardReplDriver(...)`
- surface window:
  - encoded as `hypercard-repl:surface~...`
  - used when the REPL emits an `open-window` effect for a spawned runtime surface
  - renders broker-owned runtime sessions directly by:
    - looking up the broker session
    - projecting host state
    - calling `session.renderSurface(...)`
    - routing handler calls through `dispatchRuntimeAction(...)`

This is intentionally not attach mode yet. It is a spawn-owned rendering path, where the REPL module is still the runtime owner.

### Issues discovered

- `npm install` at the `wesen-os` root failed with `EUNSUPPORTEDPROTOCOL` because the repo expects a workspace-aware package manager and contains `workspace:*` dependencies. The correct recovery path was `pnpm install`, not `npm install`.
- The first post-refresh `os-launcher` typecheck still showed one real new compile issue in the HyperCard REPL driver:
  - `Array.prototype.at(...)` in `hypercardReplDriver.ts`
  - the local target/lib baseline does not guarantee `at`, so I replaced it with an explicit last-token lookup
- The rest of the `os-launcher` typecheck output remained the known unrelated blockers:
  - nested `rich-widgets` type errors under `kanban-runtime`
  - ARC app stale `cardId` compile errors
  These are not part of APP-22.

### Validation

Commands that passed:

- `pnpm install` at `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os`
- `pnpm exec vitest run packages/hypercard-runtime/src/repl/hypercardReplDriver.test.ts packages/hypercard-runtime/src/repl/runtimeBroker.test.ts --reporter=verbose`
- `pnpm exec vitest run src/app/hypercardReplModule.test.tsx src/app/kanbanVmModule.test.tsx src/app/runtimeDebugModule.test.tsx --reporter=verbose`

Live validation:

- the user confirmed the new REPL launcher works in the running shell

### Result

APP-22 is now beyond “reusable shell plus test-only driver.” There is a real desktop-integrated HyperCard REPL path in `wesen-os`.

The remaining major feature gap is still attach mode, not basic desktop integration:

- the REPL can spawn runtime sessions
- the REPL can render spawned runtime surfaces in real windows
- the REPL can ask the host to open those windows through normal desktop actions
- but it still does not attach to arbitrarily pre-existing runtime sessions owned elsewhere

## Step 12: Feed bundle-local `vmmeta` docs into the REPL and expose first authoring commands

Once the launcher module was working, the next APP-22 gap was obvious: the REPL could explain runtime packages like `ui` and `kanban`, but not the actual runtime surfaces that matter to a user working with `inventory` or `os-launcher`. At the same time, APP-22 still had the first live authoring commands open.

These two things fit together well, because both ride on the same broker-backed session model:

- `vmmeta` gives the REPL bundle-local docs and summaries
- the broker handle already exposes live mutation methods for:
  - `defineSurface(...)`
  - `defineSurfaceRender(...)`
  - `defineSurfaceHandler(...)`

### Prompt Context

**User prompt (verbatim):** "continue"

**Assistant interpretation:** Keep moving on APP-22 after the launcher integration checkpoint, prioritizing the next concrete missing capabilities rather than stopping at the first working host module.

**Inferred user intent:** Make the REPL more useful as an actual runtime tool by improving help and by letting it mutate spawned sessions, not just inspect them.

**Commits (code):**

- pending `go-go-os-frontend` checkpoint for bundle-local docs + authoring commands
- pending `wesen-os` follow-up checkpoint for wiring `vmmeta` into the launcher module

### What I did

- Extended `ReplBundleLibraryEntry` in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/hypercardReplDriver.ts`
  with optional `docsMetadata`
- Added bundle-local help/completion extraction from generated `vmmeta` data
- Updated `surfaces` output so it now prefers runtime-surface summaries from bundle-local docs when available
- Added first live authoring commands to the HyperCard REPL driver:
  - `define-surface <surface-id> <surface-type> <factory-code>`
  - `define-render <surface-id> <render-code>`
  - `define-handler <surface-id> <handler-name> <handler-code>`
- Wired `os-launcher` to pass:
  - `INVENTORY_VM_PACK_METADATA`
  - `OS_LAUNCHER_VM_PACK_METADATA`
  into the REPL bundle library

### Important implementation detail

The driver still uses line-oriented command input, so inline authoring commands treat “the rest of the line” as code after the fixed leading arguments. That is deliberate. It keeps the shell simple while still exposing live broker-backed mutation APIs.

Examples that now work in the driver tests:

- `define-surface scratch ui.card.v1 ({ ui }) => ({ render() { return ui.text("hello"); }, handlers: {} })`
- `define-render scratch function ({ state }) { return ui.text(state.message || "patched"); }`
- `define-handler scratch ping function ({ dispatch }) { dispatch({ type: "notify.show", payload: { message: "pong" } }); }`

This is enough to prove that spawned sessions are not read-only.

### Issues discovered

- The first `os-launcher` follow-up failed because I briefly imported `inventoryStack` from `@hypercard/inventory`, but that package root only exports the generated `vmmeta`, not the launcher stack definition. The fix was to split the imports again:
  - `INVENTORY_VM_PACK_METADATA` from `@hypercard/inventory`
  - `inventoryStack` from `@hypercard/inventory/launcher`
- The new `render` test exposed an older parsing limitation: `render <surface-id> <state-json>` previously lost JSON with spaces because the command path used simple whitespace splitting. I fixed `render` to parse its state payload from the raw remainder of the line instead of from tokenized args.

### Validation

Commands that passed:

- `pnpm exec vitest run packages/hypercard-runtime/src/repl/hypercardReplDriver.test.ts --reporter=verbose`
- `pnpm exec vitest run packages/hypercard-runtime/src/repl/hypercardReplDriver.test.ts packages/hypercard-runtime/src/repl/runtimeBroker.test.ts --reporter=verbose`
- `pnpm exec vitest run src/app/hypercardReplModule.test.tsx --reporter=verbose`

### Result

The HyperCard REPL is now materially more useful:

- it can explain bundle-local runtime surfaces like `lowStock`, not just package-level DSL symbols like `ui.panel`
- it can create and mutate runtime surfaces inside spawned sessions
- it still remains spawn-owned; attach mode is still the major remaining gap

### Why
- The earlier `MacRepl` architecture was still coupling shell presentation to command execution and command metadata
- A HyperCard REPL profile would have had to fight that coupling instead of plugging into a reusable shell
- The lowest-risk first step was to introduce a driver seam while preserving the current visible behavior

### What worked
- The shell now accepts an explicit driver and no longer imports `BUILT_IN_COMMANDS` or command completion logic directly
- `ReplInputLine` renders generic completion items instead of assuming built-in command metadata
- A small SQL-flavored Storybook example demonstrates that the shell can already host another profile shape
- Focused REPL tests pass:
  - `pnpm exec vitest run packages/rich-widgets/src/repl/replState.test.ts packages/rich-widgets/src/repl/replCommands.test.ts packages/rich-widgets/src/repl/core/controller.test.ts --reporter=verbose`
- Storybook taxonomy validation passes:
  - `npm run storybook:check`

### What didn't work
- `pnpm exec tsc --noEmit -p packages/rich-widgets/tsconfig.json` still fails in this repo, but for pre-existing reasons outside the REPL work:
  - linked-workspace `TS6059` / `TS6307` rootDir issues
  - unrelated widget state type errors
  - existing `?raw` resolution gaps
- That broad package-level typecheck did briefly reveal one real local mistake in my patch:
  - `packages/rich-widgets/src/repl/replCommands.ts(27,19): error TS2304: Cannot find name 'TerminalLine'.`
  - I fixed that missing type import before committing

### What I learned
- The right first abstraction is not “profile” or “language mode,” but a smaller `ReplDriver` seam
- The shell does not need async/runtime-awareness yet to become meaningfully more reusable
- Completion state should be derived from driver output, not managed as a second command-engine state store

### What was tricky to build
- The sharp edge was avoiding a fake abstraction that still leaked the old command table everywhere
- `ReplInputLine` was one of the hidden coupling points because it was still reading `BUILT_IN_COMMANDS` directly just to show completion details
- Another subtle edge was `clear`: previously the shell special-cased the input string, which breaks the driver boundary. I changed that behavior to flow through explicit execution results (`clearTranscript`) so the shell does not need to know command names

### What warrants a second pair of eyes
- The new `ReplDriver` contract is intentionally small; review whether it should already be async or whether that should wait for the HyperCard broker slice
- `MacRepl` now accepts a `driver` prop; confirm that this is the right public seam and not something that should remain internal until a second profile lands
- The current reducer/state model is still terminal-oriented and not yet a fully generic session model; that is acceptable for Slice 1, but it is not the final architecture

### What should be done in the future
- Add the HyperCard runtime broker and spawn-mode profile on top of this driver seam
- Add provider-based help/completion sources rather than keeping help inside the built-in demo driver only
- Revisit whether the core should move out of `rich-widgets/src/repl/core` into its own package after a second real profile exists

## Step 11: Extract the full shell into `@hypercard/repl` once `hypercard-runtime` needs the generic types directly

The next forcing function showed up quickly. As soon as I started the first real HyperCard driver slice, the “keep the core inside `rich-widgets` for now” compromise stopped paying for itself.

The concrete problem was simple:

- `hypercard-runtime` now needs to depend on the generic REPL driver contracts
- those contracts were still living inside `packages/rich-widgets/src/repl/*`
- that made `rich-widgets` the architectural owner of a protocol that is no longer widget-specific

At that point the extraction was cleaner than another round of temporary re-exports.

So I created a real package:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/repl`

and moved the full REPL surface there:

- `MacRepl.tsx`
- `ReplInputLine.tsx`
- `replState.ts`
- `replCommands.ts`
- `controller.ts`
- `types.ts`
- theme CSS
- stories
- focused tests

I then rewired:

- `packages/rich-widgets/src/index.ts`
- `packages/rich-widgets/src/launcher/modules.tsx`
- `packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx`
- Storybook aliasing and workspace references

and finally deleted the old `packages/rich-widgets/src/repl/*` tree so there was one source of truth again.

This is the point where APP-22 stopped being “a refactor inside a widget package” and became “a small platform extraction.”

## Step 12: Build the first actual HyperCard REPL driver

With the generic REPL contracts living in `@hypercard/repl`, the next step was finally the real point of APP-22: create a first useful HyperCard profile rather than stopping at shell plumbing.

I implemented:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/hypercardReplDriver.ts`

The first driver is deliberately spawn-first and broker-backed.

What it does now:

- lists registered runtime packages
- lists registered runtime surface types
- lists a configured bundle library
- spawns broker-owned runtime sessions from bundle-library entries
- tracks an active session
- lists runtime surfaces for the active session
- renders a runtime surface and prints the returned tree as JSON
- dispatches a runtime event and prints the returned actions
- provides completions for commands, bundle names, session ids, surface ids, and package docs symbols
- provides help from command metadata plus runtime package docs metadata

What it does not do yet:

- attach to arbitrary live app-owned runtime sessions
- open render windows through REPL host effects
- author new surfaces with `defineRuntimeSurface(...)` commands
- pull help from docs mounts or `vmmeta`

That is a good stopping point for this checkpoint because it proves the architecture end to end:

- generic REPL shell in `@hypercard/repl`
- HyperCard-specific driver in `hypercard-runtime`
- spawn-oriented runtime broker in `hypercard-runtime`
- package-aware help/completions using real runtime package registry data

## Step 13: Attach runtime package docs to the package definitions themselves

The first driver highlighted one more missing seam. The runtime package registry already knew:

- package ids
- summaries
- install preludes
- surface types

but the docs metadata still lived next to the packages without being attached to the definitions actually registered at runtime.

That was enough for prompting and docs-browser work, but not enough for a REPL that wants to ask the live runtime package registry for “what symbols and docs exist for the installed packages?”

So I attached `docsMetadata` directly to:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/ui-runtime/src/runtimeRegistration.tsx`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/kanban-runtime/src/runtimeRegistration.tsx`

That makes the runtime package registry a much better source of truth for:

- package-aware completions
- package-aware help
- future introspection providers

without yet requiring a docs-browser mount or a separate docs fetch path.

## Step 14: Add the first generic host-effect seam and one runtime-window effect

The first HyperCard driver could already spawn sessions and introspect surfaces, but it still ended at “print JSON into the transcript.” That was enough to prove the runtime profile, but not enough to prove the host-effect half of APP-22.

So I added the first generic effect seam to the extracted REPL package itself:

- `MacReplProps.onEffects?: (effects: ReplEffect[]) => void`

This change is intentionally small but important. It means the shell can stay generic while still letting app hosts interpret side effects outside the transcript.

I then used that seam immediately in the HyperCard driver by adding:

- `open-surface <surface-id> [session-id]`

That command does not try to open a window directly. It emits:

- `type: 'open-window'`
- payload describing the runtime surface window request

That is the correct layering for APP-22:

- driver decides *what* host effect is needed
- shell forwards effects generically
- app layer later decides *how* to map the effect to `openWindow(...)`

So the current end state is:

- generic effect delivery exists
- one concrete HyperCard window-launch effect exists
- the remaining work is the host executor path in the app layer

### Code review instructions
- Start in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/repl/MacRepl.tsx`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/repl/ReplInputLine.tsx`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/repl/core/types.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/repl/replCommands.ts`
- Validate with:
  - `pnpm exec vitest run packages/rich-widgets/src/repl/replState.test.ts packages/rich-widgets/src/repl/replCommands.test.ts packages/rich-widgets/src/repl/core/controller.test.ts --reporter=verbose`
  - `npm run storybook:check`
- Open Storybook and compare:
  - the existing `RichWidgets/MacRepl` stories
  - the new `CustomDriver` story

### Technical details
- New generic contracts:
  - `ReplDriver`
  - `ReplDriverContext`
  - `ReplCompletionItem`
  - `ReplExecutionResult`
- New shell helpers:
  - `resolveReplCompletionState(...)`
  - `executeReplSubmission(...)`
- The built-in demo driver now maps old command semantics into generic driver outputs rather than the shell reaching into command names directly

## Step 11: Add a spawned runtime broker seam in `hypercard-runtime`

Once the shell had a real driver seam, the next missing piece was on the runtime side: there was still no external owner for spawned runtime sessions. The runtime had the mechanics already, but no tool-facing object that could create a session, hold onto it, expose renders/events/definitions, and dispose it deliberately.

I implemented that seam as a broker around `QuickJSRuntimeService`, not by reaching into `RuntimeSurfaceSessionHost`. That keeps spawn-mode tooling clean and leaves attach mode as a separate problem instead of smuggling live-host ownership into the first broker API.

### Prompt Context

**User prompt (verbatim):** (see Step 10)

**Assistant interpretation:** Continue APP-22 implementation after the shell extraction by adding the runtime-side seam the future HyperCard REPL profile will need.

**Inferred user intent:** Make APP-22 progress beyond UI refactoring and establish a real runtime integration path, not just a prettier shell.

**Commit (code):** `5ce7147` — `Add spawned runtime broker for REPL tooling`

### What I did
- Added a new broker module in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts`
- Defined:
  - `SpawnRuntimeSessionRequest`
  - `RuntimeSessionSummary`
  - `RuntimeSessionHandle`
  - `RuntimeBroker`
  - `createRuntimeBroker(...)`
- Wrapped `QuickJSRuntimeService` so the broker can:
  - spawn a runtime session from `stackId`, `sessionId`, `packageIds`, and `bundleCode`
  - expose a live handle for `renderSurface(...)`, `eventSurface(...)`, `defineSurface(...)`, and patching surface render/handlers
  - publish serializable summaries through `listSessions()`
  - notify subscribers through `subscribe(...)`
  - dispose sessions deliberately
- Added focused tests in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.test.ts`
- Exported the broker from the `hypercard-runtime` package root

### Why
- The REPL shell alone is not enough; the HyperCard profile needs something it can own that is neither Redux state nor a React host component
- `RuntimeSurfaceSessionHost` is the wrong owner for spawn-mode tooling because it exists to drive live windows, not external tool sessions
- The broker pattern gives APP-22 a clean spawn-mode path while leaving attach mode explicitly separate

### What worked
- Focused broker and runtime tests pass:
  - `pnpm exec vitest run packages/hypercard-runtime/src/repl/runtimeBroker.test.ts packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts --reporter=verbose`
- `hypercard-runtime` typecheck passes:
  - `npm run typecheck -w packages/hypercard-runtime`
- The broker now holds the exact split APP-22 wanted:
  - live handles outside Redux
  - summaries available for external-store projection later

### What didn't work
- N/A for this slice. The runtime broker patch validated cleanly once implemented.

### What I learned
- The right spawn-mode API is smaller than I first thought. It only needs:
  - spawn
  - get/list
  - render/event/define through a handle
  - dispose
- Subscriber support is cheap to add now and will matter later when a REPL tooling window needs to reflect broker-owned sessions without storing handles in Redux

### What was tricky to build
- The main design edge was deciding what belongs in the broker summary versus the live handle
- The rule I used:
  - summary = serializable metadata (`sessionId`, `packageIds`, `surfaces`, `surfaceTypes`, titles)
  - handle = behavior (`renderSurface`, `eventSurface`, `defineSurface`, `dispose`)
- That split matters because it prevents the future UI path from trying to persist runtime service instances or callable objects in Redux

### What warrants a second pair of eyes
- Whether the broker should eventually own one `QuickJSRuntimeService` per session instead of one shared service per broker
- Whether `stackId` should be renamed to `bundleId` at this API boundary once the broader runtime naming sweep reaches this codepath
- Whether the broker should already expose runtime package docs/help lookup helpers, or whether that belongs in the higher-level HyperCard REPL profile

### What should be done in the future
- Build the first HyperCard REPL profile on top of this broker seam
- Add package-aware completion/help sources that use package docs and `vmmeta`
- Revisit attach mode with a separate registry for live host-owned sessions

### Code review instructions
- Start in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.test.ts`
- Then compare against:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`
- Validate with:
  - `pnpm exec vitest run packages/hypercard-runtime/src/repl/runtimeBroker.test.ts packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts --reporter=verbose`
  - `npm run typecheck -w packages/hypercard-runtime`

### Technical details
- The broker is intentionally spawn-oriented and does not expose live host-owned sessions
- `RuntimeSessionHandle` is deliberately synchronous after spawn because it is only wrapping already-loaded runtime service calls
- `subscribe(...)` is included now so later REPL/tool UIs can project session summaries from an external store without redesigning the broker API

## Step 12: Make the REPL driver contract async-capable before adding runtime-backed commands

After adding the runtime broker, the next constraint was obvious: a real HyperCard REPL driver will need to spawn runtime sessions, and spawning is asynchronous. The original `ReplDriver` contract was still synchronous, which meant the shell could not honestly host the next slice without another boundary change.

So I made that change explicitly before attempting a runtime-backed profile. This keeps the dependency order honest: first extract the shell, then add the runtime owner seam, then make the driver contract capable of async work, and only then build a HyperCard profile on top.

### Prompt Context

**User prompt (verbatim):** (see Step 10)

**Assistant interpretation:** Keep advancing APP-22 rather than stopping after the first code checkpoint, and land the next necessary architectural seam.

**Inferred user intent:** Make meaningful forward progress task by task, not just one refactor and stop.

**Commit (code):** `f037cf3` — `Add async execution support to REPL drivers`

### What I did
- Updated `ReplDriver.execute(...)` to support `Promise` results through `MaybePromise<T>`
- Changed `executeReplSubmission(...)` to normalize sync and async drivers into a promise-based path
- Updated `MacRepl` to:
  - await command execution
  - track `isRunning`
  - disable the input while a command is in flight
  - surface thrown execution errors back into the transcript
- Added focused async coverage in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/repl/core/controller.test.ts`

### Why
- The next real driver we care about, the HyperCard runtime profile, needs async spawning
- Faking that through synchronous APIs would create another round of shell/driver debt immediately
- The shell needed a clean “in progress” state before it could host runtime-backed commands responsibly

### What worked
- Focused REPL tests still pass after the async change:
  - `pnpm exec vitest run packages/rich-widgets/src/repl/replState.test.ts packages/rich-widgets/src/repl/replCommands.test.ts packages/rich-widgets/src/repl/core/controller.test.ts --reporter=verbose`
- Storybook taxonomy validation still passes:
  - `npm run storybook:check`
- The built-in demo driver still works because sync results are normalized through `Promise.resolve(...)`

### What didn't work
- N/A for this slice. The async seam landed without new failures in the focused validation set.

### What I learned
- Async support belongs in the generic shell contract, not only in a future HyperCard-specific driver
- The shell does not need a full job queue yet; a single in-flight guard is enough for the first async-capable iteration

### What was tricky to build
- The main edge was making async support real without overbuilding a command scheduler
- I kept the shell behavior intentionally simple:
  - one command at a time
  - transcript-level error reporting on rejected executions
  - minimal busy indicator in the status bar
- That is enough for the next spawn-mode slice without locking the design into a heavyweight execution manager too early

### What warrants a second pair of eyes
- Whether the shell should eventually allow concurrent/background commands rather than one in-flight command
- Whether help/completion providers should also become async before the first HyperCard profile lands

### What should be done in the future
- Build the first HyperCard REPL driver using the new async-capable contract and the runtime broker
- Decide whether the help/completion provider contracts also need async widening

### Code review instructions
- Start in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/repl/core/types.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/repl/core/controller.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/repl/MacRepl.tsx`
- Validate with:
  - `pnpm exec vitest run packages/rich-widgets/src/repl/replState.test.ts packages/rich-widgets/src/repl/replCommands.test.ts packages/rich-widgets/src/repl/core/controller.test.ts --reporter=verbose`
  - `npm run storybook:check`

### Technical details
- New generic type:
  - `MaybePromise<T>`
- The shell now treats execution as an async boundary even for sync drivers
- `isRunning` is intentionally UI-local state, not Redux state, because it reflects transient command execution rather than durable session state

## Related

- [index.md](../index.md)
- [tasks.md](../tasks.md)
- [changelog.md](../changelog.md)
- [01-intern-guide-to-reusable-repl-shell-architecture-hypercard-runtime-attach-spawn-and-window-launch.md](../design/01-intern-guide-to-reusable-repl-shell-architecture-hypercard-runtime-attach-spawn-and-window-launch.md)
