# Changelog

## 2026-03-11

- Created APP-26 as the dedicated service-layer refactor ticket for making `RuntimeSessionService` explicitly build on top of `JsSessionService`
- Documented the current conceptual layering, the remaining mismatch in code, and the desired composed service architecture
- Added a detailed task list covering analysis, boundary decisions, lower-layer API audit, refactor slices, and validation
- Completed the service-layer refactor:
  - `JsSessionService` now supports bootstrap sources and generic code/native-eval helpers needed by the runtime layer
  - `QuickJSRuntimeService` now composes over `JsSessionService` instead of owning a parallel QuickJS VM map
  - runtime metadata stays in the runtime layer while generic QuickJS session ownership stays in the JS-session layer
- Revalidated the affected operator/tooling paths:
  - runtime bundle integration tests
  - JS REPL tests
  - HyperCard REPL tests
  - runtime/session manager tests
  - live browser smoke for `JavaScript REPL`, `HyperCard REPL`, and `Stacks & Cards`
- Updated repo docs so the runtime/service layering is explained as implemented, not just conceptually
- Refreshed and uploaded the final APP-26 bundle to reMarkable
