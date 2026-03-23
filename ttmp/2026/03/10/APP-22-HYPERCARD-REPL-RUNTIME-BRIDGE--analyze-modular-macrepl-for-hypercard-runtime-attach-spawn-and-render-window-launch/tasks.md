# Tasks

## Ticket Refresh

- [x] Re-audit APP-22 after APP-16 and APP-23 changed the runtime/package baseline
- [x] Replace the older card/stack-oriented wording with the current RuntimeSession / RuntimeBundle / RuntimePackage / RuntimeSurface model
- [x] Expand the ticket from “MacRepl for HyperCard” into “reusable REPL shell plus one HyperCard runtime bridge”
- [x] Update the design guide, tasks, changelog, and diary to record the refreshed architecture

## Current-State Analysis

- [x] Document the current `MacRepl` shell, command dispatcher, and reducer boundaries
- [x] Document why the current shell is visually reusable but architecturally too coupled to one toy command engine
- [x] Document the current `hypercard-runtime` service API that a REPL would want to use
- [x] Document the current runtime ownership blocker in `RuntimeSurfaceSessionHost`
- [x] Document the current extracted package architecture:
  - `@hypercard/ui-runtime`
  - `@hypercard/kanban-runtime`
  - explicit host registration

## Architecture Decisions

- [x] Decide that the REPL shell must be reusable for other languages and tool domains
- [x] Decide that shell UI stays separate from HyperCard-specific runtime logic
- [x] Decide that a generic REPL protocol is needed between shell and concrete drivers
- [x] Decide that completion, help, and inspection should be provider-based rather than hardcoded into one driver
- [x] Decide that live runtime handles stay outside Redux
- [x] Decide that HyperCard-specific runtime ownership belongs in `hypercard-runtime`, not `rich-widgets`
- [x] Decide that spawn mode is still the first useful implementation target
- [x] Decide that attach mode is a second-phase feature requiring a broker/registration seam
- [x] Decide that REPL-driven window launches should reuse normal desktop `openWindow(...)` flows

## Reusable REPL Shell Design

- [x] Specify the shell/UI layer responsibilities
- [x] Specify the generic controller/state responsibilities
- [x] Specify a reusable `ReplDriver` interface
- [x] Specify `ReplExecution`, `ReplEffect`, and driver-context contracts
- [x] Specify how a profile/language layer should sit on top of the generic protocol
- [x] Specify how the same shell can host future profiles such as:
  - HyperCard runtime JS
  - SQL console
  - agent/tool console
  - future language runtimes

## Completion / Help / Introspection Design

- [x] Specify a completion-provider interface
- [x] Specify a help-provider interface
- [x] Specify an inspection-provider interface
- [x] Specify how HyperCard package docs and `vmmeta` can feed on-demand help
- [x] Specify how package-aware completions should work for installed runtime packages and live surfaces
- [x] Specify how the shell should remain agnostic to where help/completions come from

## HyperCard Runtime Bridge Design

- [x] Specify a `HypercardRuntimeBroker` interface
- [x] Specify a `HypercardRuntimeHandle` interface
- [x] Specify spawn mode semantics
- [x] Specify attach mode semantics
- [x] Specify what data belongs in runtime-handle registries vs Redux projections
- [x] Specify how a HyperCard REPL profile would expose package-aware commands and help

## Host Effect / Window Launch Design

- [x] Specify a generic `ReplEffect` path
- [x] Specify a host-side effect executor boundary
- [x] Specify `open-window` as the primary window launch effect
- [x] Specify how HyperCard REPL commands can open runtime-backed windows through existing host actions

## Implementation Plan

- [x] Write the refreshed intern-facing architecture guide with prose, diagrams, pseudocode, API references, and file references
- [x] Include a phased implementation plan for:
  - shell extraction
  - protocol extraction
  - provider system
  - HyperCard runtime broker
  - spawn mode
  - attach mode
  - window launch integration
- [x] Include validation guidance for shell, protocol, HyperCard, and host layers
- [x] Decide whether the generic protocol/controller should become a new package such as `@hypercard/repl-core` or live temporarily under `rich-widgets/src/repl/core`
- [x] Revisit that decision after the first broker and async driver slices
- [x] Decide to extract the full REPL shell and protocol into a dedicated `@hypercard/repl` package once the first HyperCard driver starts depending on the generic contracts directly
- [x] Slice 1: Extract a generic REPL core under `packages/rich-widgets/src/repl/core`
  - [x] Add reusable core types for transcript lines, completion items, help entries, execution results, effects, and driver context
  - [x] Add a generic `ReplDriver` interface that supports execute/completion/help without hardcoding built-in commands
  - [x] Add controller helpers so `MacRepl` no longer imports `executeReplCommand(...)` or `BUILT_IN_COMMANDS` directly
  - [x] Keep the current toy-command behavior alive through one concrete built-in demo driver
- [x] Slice 1b: Extract the full REPL shell into `packages/repl`
  - [x] Move `MacRepl`, `ReplInputLine`, reducer/state, command helpers, tests, stories, and theme CSS into `@hypercard/repl`
  - [x] Re-export the REPL API from `rich-widgets` only as a convenience surface, not as the source of truth
  - [x] Update Storybook, workspace references, and launcher consumers to point at `@hypercard/repl`
  - [x] Delete the old `packages/rich-widgets/src/repl/*` source tree so there is one source of truth
- [x] Slice 2: Refactor `MacRepl` to consume the generic core
  - [x] Make `ReplInputLine` render generic completion items instead of assuming local command metadata
  - [x] Thread the driver through the shell UI without making the shell HyperCard-specific
  - [x] Keep the standalone and Redux-backed modes working
  - [x] Preserve launcher wiring and Storybook stories while the internal architecture changes
- [ ] Slice 3: Add validation and examples for the extracted shell/core
  - [x] Add unit tests for the generic controller/driver helpers
  - [x] Add unit tests for the built-in demo driver behavior
  - [x] Add or refresh Storybook stories that show the shell in default, history-heavy, and error-heavy states
  - [ ] Validate `packages/rich-widgets` tests and Storybook checks
    - [x] Focused REPL Vitest coverage passes
    - [x] `storybook:check` passes
    - [ ] package-wide `packages/rich-widgets` typecheck remains blocked by pre-existing linked-workspace and unrelated widget state errors outside the REPL files
- [ ] Slice 4: Design and implement the HyperCard runtime broker seam
  - [x] Add a tool-facing broker contract in `hypercard-runtime` for spawning runtime sessions
  - [x] Keep live runtime handles outside Redux
  - [x] Register and dispose spawned runtime sessions deliberately
  - [x] Document the attach-mode blocker separately instead of smuggling it into spawn-mode APIs
- [ ] Slice 5: Build the first HyperCard REPL profile on top of the generic shell
  - [x] Add a HyperCard profile/driver that can spawn a runtime session with explicit `RuntimePackage` registration
  - [x] Add package-aware completions sourced from installed runtime packages and package docs metadata
  - [x] Add on-demand help lookups sourced from runtime package docs metadata
  - [x] Add basic spawn/list/use/render/event commands that operate on `RuntimeBundle` / `RuntimeSurface`
  - [x] Extend the first driver with define-surface / define-render / define-handler authoring commands
  - [x] Add docs-mount / `vmmeta` lookups so help can resolve bundle-local card/surface docs as well as package docs
- [ ] Slice 6: Add REPL host effects and render-window launch flows
  - [x] Define host effects such as `open-window`
  - [x] Map those effects onto normal desktop `openWindow(...)` flows
  - [x] Add at least one example command that opens a runtime-backed render window from REPL output
  - [x] Add a real `wesen-os` launcher module that hosts the HyperCard REPL console window
  - [x] Add a `wesen-os` runtime-surface window path that can render broker-backed spawned sessions
  - [x] Validate the launcher module with focused Vitest coverage and a live `http://localhost:5173` smoke
- [ ] Slice 7: Revisit attach mode after spawn mode exists
  - [x] Decide how runtime sessions are discoverable and selectable
  - [x] Decide read-only vs read-write attach safety rules
  - [x] Add an attached-session registry fed by `RuntimeSurfaceSessionHost` for live interactive sessions
  - [x] Add `attach` / mixed `sessions` / mixed `use` flows to the HyperCard REPL driver
  - [x] Keep attached sessions read-only for now:
    - [x] allow `surfaces` and `render`
    - [x] block `event`
    - [x] block `define-surface`
    - [x] block `define-render`
    - [x] block `define-handler`
    - [x] allow `open-surface` only as a read-only duplicate view routed through the host
  - [x] Decide how completions/help adapt when attached to a live session
    - [x] package/docs completions remain available
    - [x] surface-aware commands use the attached session metadata
  - [ ] Decide whether any attached-mode mutations should later be allowed
  - [x] Decide whether attached sessions should support `open-surface` by routing to the owning host instead of the broker
- [ ] Commit focused code checkpoints at stable boundaries rather than every tiny task
- [ ] Update the APP-22 diary/changelog after each implementation checkpoint
- [x] Upload a fresh reMarkable bundle once implementation meaningfully changes the ticket story

## Delivery

- [x] Run `docmgr doctor --ticket APP-22-HYPERCARD-REPL-RUNTIME-BRIDGE --stale-after 30`
- [x] Re-upload the refreshed APP-22 bundle to reMarkable as a v2 deliverable
- [x] Commit the refreshed APP-22 docs
