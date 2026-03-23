# Tasks

## Ticket Setup

- [x] Create APP-24 as a dedicated follow-up ticket instead of burying plain JS REPL work inside APP-22
- [x] Record the sequencing decision that plain JS REPL comes before attach mode
- [x] Write a detailed intern-facing guide with prose, diagrams, pseudocode, API references, and file references
- [x] Keep the ticket focused on spawned blank JS sessions rather than HyperCard attach mode

## Current-State Analysis

- [x] Re-audit the generic `@hypercard/repl` shell and confirm it already supports a plain JS profile
- [x] Re-audit the current HyperCard runtime broker and document why it is too bundle/surface-specific for blank JS
- [x] Re-audit `QuickJSRuntimeService` and identify the shared lower-level VM lifecycle logic that should be extracted instead of duplicated
- [x] Document the current host integration path in `hypercardReplModule.tsx` as the comparison point for a future JS REPL launcher module

## Architecture Decisions

- [x] Decide that APP-24 should create a plain JS REPL before attach mode
- [x] Decide that a blank JS REPL must not pretend to be a `RuntimeBundle`
- [x] Decide that the new design should introduce a lower-level JS session service/broker instead of overloading `RuntimeBroker`
- [x] Decide that the REPL shell stays in `@hypercard/repl` and only the driver/broker/runtime seam changes
- [x] Decide that the first plain JS REPL should use `:` commands for session control and plain JS for evaluation
- [x] Decide that the initial feature set should stay intentionally small:
  - [x] spawn/use/reset/dispose sessions
  - [x] eval JS
  - [x] list globals
  - [x] print logs/errors/results
  - [x] basic help/completions
- [x] Decide that attach mode remains a separate later ticket/slice

## JS Session Service Design

- [x] Define the responsibilities of a lower-level QuickJS session service
- [x] Specify the API for creating, evaluating, inspecting, and disposing blank JS sessions
- [x] Specify what should stay shared with the existing `QuickJSRuntimeService`
- [x] Specify what should remain HyperCard-only in the current runtime service
- [x] Specify timeout/error/value-formatting expectations for raw JS evaluation

## JS Broker Design

- [x] Define a `JsSessionBroker` API
- [x] Define `JsSessionHandle` and `JsSessionSummary`
- [x] Define subscription and lifecycle semantics
- [x] Define reset/dispose behavior
- [x] Define how a tiny blank-session prelude should be supplied

## JS REPL Driver Design

- [x] Define the interaction model of `:` commands plus plain JS eval
- [x] Define the first required commands:
  - [x] `:spawn`
  - [x] `:sessions`
  - [x] `:use`
  - [x] `:globals`
  - [x] `:reset`
  - [x] `:dispose`
  - [x] `:help`
- [x] Define the first completion sources:
  - [x] command names
  - [x] JS keywords
  - [x] session globals
- [x] Define the first help sources:
  - [x] command help
  - [x] JS profile topics
  - [x] prelude helper docs

## Host Integration Design

- [x] Define a simple `js-repl` launcher module in `wesen-os`
- [x] Decide that the first phase only needs one console window
- [x] Leave extra inspector or preview windows for later
- [x] Describe how this module should differ from the heavier `hypercard-repl` module

## Implementation Plan

- [x] Phase 0: design extraction of shared QuickJS lifecycle code
- [x] Phase 1: implement lower-level JS session service
- [x] Phase 2: implement `JsSessionBroker`
- [x] Phase 3: implement `JsReplDriver`
- [x] Phase 4: add `wesen-os` launcher module
- [x] Phase 5: optional niceties such as multiline input and object inspection

## Recommended Execution Tasks

- [x] Slice 1: Extract shared QuickJS lifecycle code from `QuickJSRuntimeService`
  - [x] Move QuickJS module bootstrapping, timeout helpers, error formatting, and VM disposal into a lower-level shared file
  - [x] Keep `QuickJSRuntimeService` behavior unchanged while it is migrated to the shared helpers
  - [x] Add focused regression coverage so HyperCard bundle load/render/event behavior still passes after extraction
- [x] Slice 2: Implement `JsSessionService`
  - [x] Add service APIs for create/eval/reset/dispose on blank JS sessions
  - [x] Support optional prelude code at session creation time
  - [x] Support global-name inspection
  - [x] Add tests for:
    - [x] arithmetic evaluation
    - [x] persistent globals across eval calls
    - [x] captured `console.log`
    - [x] thrown error formatting
    - [x] timeout behavior
    - [x] reset behavior
- [x] Slice 3: Implement `JsSessionBroker` and `JsSessionHandle`
  - [x] Add broker tests for spawn/list/use/reset/dispose flows
  - [x] Keep live handles outside Redux
  - [x] Publish serializable summaries only
- [x] Slice 4: Implement the first plain JS REPL driver using the current `ReplDriver` contract
  - [x] Support `:spawn`, `:sessions`, `:use`, `:globals`, `:reset`, `:dispose`, and `:help`
  - [x] Treat non-command lines as raw JS eval
  - [x] Format values, logs, and errors into transcript lines
- [ ] Add completion/help support for:
  - [x] REPL commands
  - [x] JS keywords
  - [x] active session globals
- [x] Add a tiny JS REPL prelude for `console.log` capture and optional helper docs
- [ ] Slice 5: Add a `js-repl` launcher module to `wesen-os`
  - [x] Add the `js-repl` launcher module
  - [x] Add focused launcher-module tests
  - [x] Add a live browser smoke
- [x] Add transcript echo so submitted commands appear in the REPL backlog even when the driver only returns output lines
- [x] Expose broker-owned JS sessions in runtime debug tooling without forcing them into the runtime-surface Redux slice
- [ ] Revisit attach mode only after the plain JS REPL is stable

## Delivery

- [x] Run `docmgr doctor --ticket APP-24-CLEAN-JS-REPL-PROFILE --stale-after 30`
- [ ] Commit the APP-24 docs
- [ ] Upload the APP-24 bundle to reMarkable
