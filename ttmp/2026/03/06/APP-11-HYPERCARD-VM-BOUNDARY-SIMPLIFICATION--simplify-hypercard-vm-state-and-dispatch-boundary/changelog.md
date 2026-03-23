# Changelog

## 2026-03-09

Re-read the APP-11 implementation guide against the current runtime files and revised the implementation plan to assume a direct cross-stack cutover instead of a compatibility migration.

Updated the design doc to make these decisions explicit:

- do not add wrapper APIs or dual support for `cardState` / `sessionState` / `globalState`
- do not keep `dispatchCardAction`, `dispatchSessionAction`, `dispatchDomainAction`, and `dispatchSystemCommand` alive in parallel with `dispatch(action)`
- project semantic VM state directly instead of introducing transitional `local.card` / `local.session` wrappers
- migrate inventory sample cards, prompt policy, authoring types, fixtures, and tests in the same change set as the runtime contract

Updated the task list to reflect that implementation strategy.

Re-uploaded the refreshed APP-11 ticket bundle to reMarkable with the revised no-compatibility plan and verified the remote listing at `/ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION`.

Expanded `tasks.md` into concrete implementation slices so execution can proceed in focused commits:

- Slice 1: runtime contracts, bootstrap, and runtime-service validation
- Slice 2: host projection, runtime state, and action routing
- Slice 3: inventory authoring, prompt policy, remaining fixtures, and final targeted tests
- Ticket bookkeeping tasks for diary/changelog updates and final bundle refresh

Implemented the runtime/package side of APP-11 in `go-go-os-frontend` and committed it as `788f17f` (`Refactor hypercard runtime to state/action boundary`).

That change set:

- replaced scoped runtime intents with generic `RuntimeAction`
- changed QuickJS render/event boundaries to one `state` object and `dispatch(action)`
- rewired runtime-service validation, host projection, runtime-local state ingestion, and action routing
- updated runtime fixtures, stories, and the package test suite to the new contract

Validated the runtime package with:

- `npm run test -w packages/hypercard-runtime`
- `npm run typecheck -w packages/hypercard-runtime`

Followed up with `2014065` (`Restrict projected runtime selectors`) so `selectors.ts` now projects only runtime-relevant slices instead of passing through the full non-excluded app state.

Implemented the inventory/prompt side of APP-11 in `go-go-app-inventory` and committed it as `c1df9ac` (`Rewrite inventory cards for new runtime API`).

That change set:

- rewrote the inventory authoring `.d.ts` surface to `{ state, dispatch }`
- rewrote `pluginBundle.vm.js` to use projected `state` and semantic action types
- updated inventory stack capabilities from `notify` to `notify.show`
- updated `runtime-card-policy.md` so the prompt pack now teaches the new contract

Validated the inventory-side TypeScript build with:

- `node node_modules/typescript/bin/tsc --build workspace-links/go-go-app-inventory/apps/inventory/tsconfig.json`

Also recorded that the repo-local inventory typecheck scripts currently fail before reaching our code because the repo lacks a local `node_modules/typescript/bin/tsc`.

Re-uploaded the finalized APP-11 bundle after the implementation diary, task list, and changelog were updated with code commits and validation results, then re-verified the remote folder:

- upload result: `OK: uploaded APP-11 HyperCard VM Boundary Simplification.pdf -> /ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION`
- remote listing: `[f] APP-11 HyperCard VM Boundary Simplification`

Expanded the task list again into an execution sweep for the remaining linked-app consumers, then completed the two remaining code repos without adding compatibility wrappers.

Committed the ARC AGI player cleanup in `go-go-app-arc-agi-3` as `2f91571` (`Migrate ARC plugin runtime bundle`).

That change set:

- replaced the remaining `ingestRuntimeIntent(...)` bridge calls with `ingestRuntimeAction(...)`
- rewrote the ARC demo plugin bundle to use `{ state, dispatch(action) }`
- changed mirrored runtime session updates to `filters.patch`
- aligned stack capabilities with the slices/actions the bundle actually reads and dispatches: `arc`, `arcBridge`, and `notify.show`

Recorded that targeted ARC TypeScript validation is still blocked by an existing linked-package workspace configuration problem:

- `node node_modules/typescript/bin/tsc --build workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/tsconfig.json`
- primary failure: `TS6059` linked-source `rootDir` errors
- additional linked-runtime failure surfaced during that build: `TS2307 Cannot find module './stack-bootstrap.vm.js?raw'`

Committed the SQLite cleanup in `go-go-app-sqlite` as `12c145f` (`Migrate SQLite plugin runtime bundle`).

That change set:

- rewrote the SQLite bundle away from `cardState` / `globalState.domains`
- moved query-form state to `state.draft`
- projected runtime data directly from `state.app_sqlite.hypercard`
- replaced scoped dispatch helpers with generic `sqlite/*`, `nav.*`, and `notify.show` actions
- aligned stack capabilities with both dispatch authorization (`sqlite`) and projected state reads (`app_sqlite`)

Validated the SQLite app successfully with:

- `node node_modules/typescript/bin/tsc --build workspace-links/go-go-app-sqlite/apps/sqlite/tsconfig.json`

## 2026-03-07

Created APP-11 as the dedicated follow-on ticket for HyperCard VM boundary simplification after confirming that the work is distinct from the APP-09 chat-shell/bootstrap track and is best treated as the runtime-platform continuation of APP-07 analysis and APP-08 contract cleanup.

Added a detailed intern-facing design and implementation guide that explains:

- how generated runtime cards move from backend prompt policy to timeline artifacts to frontend QuickJS execution
- where the current VM boundary leaks host topology
- why one projected `state` plus one `dispatch(action)` is the right target model
- which files, APIs, tests, and rollout steps will be involved in the implementation

Also created the APP-11 implementation diary to record the documentation, validation, and delivery path for this ticket.

Completed ticket hygiene and delivery for the documentation pass:

- related the core runtime, prompt, and background files to the APP-11 design doc and diary
- ran `docmgr doctor --ticket APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION --stale-after 30` with all checks passing
- dry-ran the bundled reMarkable upload
- uploaded and verified `APP-11 HyperCard VM Boundary Simplification.pdf` at `/ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION`

## 2026-03-06

- Initial workspace created
