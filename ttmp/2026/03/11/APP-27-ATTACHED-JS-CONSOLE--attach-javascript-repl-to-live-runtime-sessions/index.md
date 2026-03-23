---
Title: APP-27 Attached JS Console
Ticket: APP-27-ATTACHED-JS-CONSOLE
Status: active
DocType: index
Topics:
  - frontend
  - repl
  - hypercard
  - architecture
Summary: Follow-up ticket for attaching the plain JavaScript REPL to live runtime sessions so operators can evaluate JS inside an already-running QuickJS VM.
---

# APP-27 Attached JS Console

## Goal

Add an attached JavaScript console path so the existing `JavaScript REPL` can attach to a live runtime session and evaluate code inside that session's QuickJS VM.

## Why this exists

APP-24 intentionally stopped at spawned blank JS sessions. That gave us:

- `JsSessionService`
- `JsSessionBroker`
- `JsReplDriver`
- the `JavaScript REPL` window

But it did **not** give us a way to evaluate JavaScript inside an already-running runtime session owned by `RuntimeSurfaceSessionHost`.

This ticket covers that gap.

## Deliverables

- runtime-service APIs for live JS eval/global inspection against existing runtime sessions
- an attached-JS-session registry for host-owned runtime sessions
- `JavaScript REPL` commands for listing and attaching to live runtime-backed JS sessions
- focused docs, tests, and diary updates

## Main docs

- [design/01-intern-guide-to-attached-js-console-for-live-runtime-sessions.md](design/01-intern-guide-to-attached-js-console-for-live-runtime-sessions.md)
- [tasks.md](tasks.md)
- [changelog.md](changelog.md)
- [reference/01-investigation-diary.md](reference/01-investigation-diary.md)
