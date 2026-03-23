# Changelog

## 2026-03-11

- Created APP-24 as the dedicated follow-up ticket for a true blank JavaScript REPL profile with spawned QuickJS sessions
- Recorded the sequencing decision that plain JS REPL should come before HyperCard attach mode
- Audited the current `@hypercard/repl` shell and confirmed the shell itself is already generic enough
- Audited the current HyperCard runtime broker and documented why it is too bundle/surface-oriented for a blank JS console
- Audited `QuickJSRuntimeService` and identified the lower-level VM lifecycle code that should be extracted rather than duplicated
- Wrote the intern-facing design/implementation guide with architecture diagrams, pseudocode, API sketches, validation guidance, and file references
- Expanded the APP-24 task list into execution-oriented implementation slices so code can land in foundation-first checkpoints
- Extracted shared QuickJS lifecycle logic into `quickJsSessionCore.ts` and migrated `QuickJSRuntimeService` onto it without changing the HyperCard runtime behavior
- Added `JsSessionService` for blank JS sessions with create/eval/reset/dispose/global-inspection support and a tiny `console.log` capture bootstrap
- Added focused `JsSessionService` tests and re-ran the existing HyperCard runtime integration suite to confirm the shared QuickJS refactor did not break the bundle/surface path
- Added `JsSessionBroker` as the tool-facing lifecycle layer for blank JS sessions, with live handles outside Redux and serializable summaries for list views
- Added the first `JsReplDriver` with `:` commands for session management and raw JS evaluation for non-command lines
- Added focused broker and driver tests covering spawn/list/reset/dispose flows, persistent globals, help/completions, console logs, and error formatting
- Added the first `wesen-os` launcher module for the plain JS REPL and wired it into the launcher module list
- Added focused launcher-module and launcher-host tests for the new `js-repl` app window
- Added transcript echo in `MacRepl`, so submitted commands now appear in the backlog even if the driver only returns output lines
- Added a live browser smoke for `http://localhost:5173` confirming `:spawn js-1` echoes into the transcript and creates a real blank JS session
- Added `jsSessionDebugRegistry.ts` plus a new `JS Sessions` section in `Stacks & Cards`, so broker-owned plain JS sessions are visible and operable without being forced into the runtime-surface Redux model

## 2026-03-11

- Initial workspace created
