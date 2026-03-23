# Tasks

## Ticket Setup

- [x] Create APP-26 as a dedicated service-layer follow-up ticket
- [x] Write a detailed intern-facing design and implementation guide
- [x] Keep the ticket focused on service layering rather than attach-mode UI

## Current-State Analysis

- [x] Re-audit `quickJsSessionCore.ts`
- [x] Re-audit `jsSessionService.ts`
- [x] Re-audit `runtimeService.ts`
- [x] Re-audit `runtimeBroker.ts` and `jsSessionBroker.ts`
- [x] Document which responsibilities already moved into the lower layer and which still remain duplicated or implicit

## Architecture Decisions

- [x] Decide the exact lower-layer responsibilities of `JsSessionService`
- [x] Decide the exact runtime-specific responsibilities of `RuntimeSessionService`
- [x] Decide whether runtime service composes a concrete `JsSessionService` instance or lower-level session handles
- [x] Decide how much of the current runtime-service public API remains stable during the refactor
- [x] Decide where runtime-session metadata should live relative to JS-session metadata

## Lower-Layer API Audit

- [x] Map current runtime-service internals into:
  - [x] generic JS-session operations
  - [x] runtime-specific operations
- [x] Identify missing lower-layer helpers
- [x] Identify lower-layer helpers that should explicitly not be added

## Refactor Plan

- [x] Slice 1: add only the lower-level helpers truly needed by runtime service
- [x] Slice 2: refactor runtime-service internals to depend on `JsSessionService`
- [x] Slice 3: remove any now-duplicated QuickJS session paths
- [x] Slice 4: verify `RuntimeBroker` and `JsSessionBroker` still have clean ownership boundaries
- [x] Slice 5: update docs and tests

## Validation

- [x] Add or expand focused service-layer tests
- [x] Re-run runtime bundle integration tests
- [x] Re-run plain JS REPL tests
- [x] Re-run runtime broker tests
- [x] Reconfirm no regressions in `Stacks & Cards` or REPL tooling

## Delivery

- [x] Run `docmgr doctor --ticket APP-26-RUNTIME-SERVICE-LAYER-REFRACTOR --stale-after 30`
- [x] Commit the APP-26 docs
- [x] Upload the APP-26 bundle to reMarkable
