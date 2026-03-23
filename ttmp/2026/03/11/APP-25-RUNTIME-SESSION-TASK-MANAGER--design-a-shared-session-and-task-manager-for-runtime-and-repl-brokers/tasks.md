# Tasks

## Ticket Setup

- [x] Create APP-25 as a dedicated task-manager follow-up instead of burying it in APP-22 or APP-24
- [x] Write a detailed intern-facing analysis and implementation guide
- [x] Keep the ticket focused on the shared session/task manager layer, not attach-mode implementation

## Current-State Analysis

- [x] Re-audit `RuntimeSurfaceDebugWindow` and document why it is not the right long-term home for general session management
- [x] Re-audit `runtimeSessions` Redux state and document what should stay there
- [x] Re-audit `JsSessionBroker` and `jsSessionDebugRegistry` and document why their behaviorful objects should stay outside Redux
- [x] Document the current operator split between `Stacks & Cards`, `HyperCard REPL`, and `JavaScript REPL`

## Architecture Decisions

- [x] Decide that APP-25 should create a separate task-manager style window rather than continuously expanding `Stacks & Cards`
- [x] Decide that runtime-surface sessions and plain JS sessions must keep separate storage/lifecycle models
- [x] Decide that a source-adapter architecture is the right bridge into a shared operator UI
- [x] Decide that the shared row model should remain a summary model, not a fake universal session schema
- [x] Decide that behaviorful source objects should stay outside Redux
- [x] Decide that Redux is optional and should only hold task-manager UI state if needed

## Shared Task-Manager Model

- [x] Define `TaskManagerSource`
- [x] Define `TaskManagerRow`
- [x] Define `TaskManagerAction`
- [x] Define source registration and subscription semantics
- [x] Define how action invocation routes back to the owning source
- [x] Define how rows expose generic summary metadata without flattening source-specific semantics

## Runtime Session Source Adapter

- [x] Design a `RuntimeSessionSource` adapter over:
  - [x] `runtimeSessions` Redux state
  - [x] windowing state
  - [x] runtime debug bundle registry
- [x] Define row details for runtime sessions:
  - [x] bundle id / name
  - [x] current surface
  - [x] status
  - [x] relevant window/session ids
- [~] Define supported actions:
  - [x] open
  - [ ] focus
  - [x] inspect
  - [ ] optional close/terminate semantics

## JS Session Source Adapter

- [x] Design a `JsSessionSource` adapter over `JsSessionBroker`
- [x] Define row details for JS sessions:
  - [x] session id
  - [x] title
  - [x] global summary
  - [x] created time
- [x] Define supported actions:
  - [x] focus REPL
  - [x] reset
  - [x] dispose
- [x] Define how multiple JS brokers can coexist as separate sources

## Registry and Hooks

- [x] Implement a generic task-manager registry
- [x] Add `registerTaskManagerSource(...)`
- [x] Add `clearTaskManagerSources()`
- [x] Add `listTaskManagerSources()`
- [x] Add `useRegisteredTaskManagerSources()`
- [x] Add tests proving heterogeneous sources can register and update independently

## Window Design

- [x] Design the first task-manager window layout
- [x] Define:
  - [x] summary counts
  - [x] search input
  - [x] kind filter
  - [x] status filter
  - [x] table columns
  - [ ] optional detail/inspector panel
- [x] Keep the window clearly distinct from `Stacks & Cards`
- [x] Add focused tests for empty, mixed, and action-heavy states
- [x] Add Storybook coverage if the shared window lives in a story-covered package

## `wesen-os` Integration

- [x] Add a `Task Manager` launcher module in `os-launcher`
- [x] Register the runtime-session source from the host app
- [x] Register the JS-session source from the existing JS REPL broker
- [x] Confirm the task manager window can open alongside `Stacks & Cards`
- [x] Add focused launcher-module tests

## Relationship to Existing Tooling

- [x] Decide whether `Stacks & Cards` should keep the temporary `JS Sessions` section after the task manager exists
- [x] If not, remove or reduce that section and replace it with a cross-link or action into the task manager
- [x] Add cross-navigation from task manager rows to richer specialized tooling where appropriate

## Validation

- [x] Add source-adapter tests for runtime sessions
- [x] Add source-adapter tests for JS sessions
- [x] Add window tests for:
  - [x] no sources
  - [x] one runtime source
  - [x] one JS source
  - [x] mixed sources
  - [x] row actions
- [x] Run a live browser smoke in `http://localhost:5173`
- [x] Confirm a spawned JS session appears in the task manager
- [x] Confirm an active runtime-surface session appears in the task manager

## Cleanup and Follow-Up

- [x] Update `repl-and-runtime-debug-guide.md` to reference the task manager once it exists
- [x] Update `runtime-concepts-guide.md` to explain the task manager as an operator view above session models
- [ ] Consider a separate follow-up for non-session long-running tool tasks if the initial implementation stays session-only

## Delivery

- [x] Run `docmgr doctor --ticket APP-25-RUNTIME-SESSION-TASK-MANAGER --stale-after 30`
- [x] Commit the APP-25 docs
- [x] Upload the APP-25 bundle to reMarkable
