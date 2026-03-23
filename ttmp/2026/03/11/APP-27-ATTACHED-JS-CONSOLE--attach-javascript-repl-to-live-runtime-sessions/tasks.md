# Tasks

## Ticket setup

- [x] Create APP-27 as the dedicated follow-up for attached JS console work
- [x] Document why APP-24 intentionally stopped at spawned blank JS sessions
- [x] Write the first implementation guide and task backlog

## Analysis and decisions

- [x] Re-audit `JsSessionService`, `JsSessionBroker`, and `JsReplDriver`
- [x] Re-audit `QuickJSRuntimeService` and `RuntimeSurfaceSessionHost`
- [x] Decide the ownership model for attached JS sessions
- [x] Decide the first supported operations:
  - [x] list attached sessions
  - [x] attach/use attached sessions
  - [x] eval plain JS
  - [x] inspect globals
  - [x] block reset/dispose

## Implementation slice 1

- [x] Add live-session JS eval/global inspection to `QuickJSRuntimeService`
- [x] Add an attached-JS-session registry in `hypercard-runtime`
- [x] Register attached JS handles from `RuntimeSurfaceSessionHost`
- [x] Extend `JsReplDriver` to support mixed spawned/attached sessions
- [x] Add focused tests for runtime service, registry, and driver
- [x] Run a live browser smoke through `JavaScript REPL`

## Follow-up questions

- [ ] Decide whether attached JS eval should be marked explicitly unsafe in the UI
- [ ] Decide whether attached JS sessions should expose any write guardrails
- [x] Decide whether `Task Manager` should show an “Open JS Console” action for runtime sessions

## Delivery

- [x] Update changelog and diary after the first implementation checkpoint
- [x] Run `docmgr doctor --ticket APP-27-ATTACHED-JS-CONSOLE --stale-after 30`
- [x] Commit the ticket docs
