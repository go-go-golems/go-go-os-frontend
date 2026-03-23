# Tasks

## Documentation And Delivery

- [x] Create APP-11 ticket workspace
- [x] Reconcile APP-11 scope against APP-05, APP-07, APP-08, and APP-09
- [x] Audit the current HyperCard VM boundary across runtime host, QuickJS bootstrap, runtime contracts, and inventory authoring files
- [x] Write a detailed intern-facing analysis, design, and implementation guide for VM boundary simplification
- [x] Record the documentation and delivery path in the APP-11 implementation diary
- [x] Relate the key runtime files and background documents to the APP-11 design doc and diary
- [x] Run `docmgr doctor --ticket APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION --stale-after 30`
- [x] Dry-run the APP-11 bundle upload to reMarkable
- [x] Upload the finalized APP-11 bundle to reMarkable and verify the remote listing

## Planned Implementation Work

### Slice 1: Runtime Contract And QuickJS Bootstrap

- [x] Replace `RuntimeIntent` with a generic `RuntimeAction` model in `packages/hypercard-runtime/src/plugin-runtime/contracts.ts`
- [x] Change `RenderCardRequest` and `EventCardRequest` to accept one VM-facing `state` object
- [x] Update `intentSchema.ts` and `intentSchema.test.ts` to validate the new action envelope only
- [x] Rewrite `stack-bootstrap.vm.js` so cards render with `{ state }` and handlers receive `{ state, dispatch }`
- [x] Update `runtimeService.ts` to call the new bootstrap signatures and validate returned actions
- [x] Rewrite `runtimeService.integration.test.ts` fixtures and expectations to the new state/action contract
- [x] Commit Slice 1 runtime contract/bootstrap changes

### Slice 2: Host Projection, Runtime State, And Action Routing

- [x] Replace `projectGlobalState(...)` in `PluginCardSessionHost.tsx` with semantic `projectRuntimeState(...)`
- [x] Stop passing `cardState`, `sessionState`, and `globalState` separately through render/event calls
- [x] Simplify `pluginCardRuntimeSlice.ts` so runtime-local state and timeline entries are action-driven rather than scoped-intent-driven
- [x] Update `selectors.ts` to serve the new host projection model instead of `globalState.domains` passthrough
- [x] Replace `dispatchRuntimeIntent(...)` in `pluginIntentRouting.ts` with generic action interpretation plus capability checks
- [x] Update host-facing tests such as `PluginCardSessionHost.rerender.test.tsx`, `plugin-card-runtime.test.ts`, and `plugin-intent-routing.test.ts`
- [x] Commit Slice 2 host projection/routing changes

### Slice 3: Inventory Authoring, Prompt Policy, And Remaining Fixtures

- [x] Rewrite `apps/inventory/src/domain/pluginBundle.authoring.d.ts` to expose only `{ state, dispatch }`
- [x] Rewrite `apps/inventory/src/domain/pluginBundle.vm.js` to consume semantic projected state and dispatch semantic actions
- [x] Update `pkg/pinoweb/prompts/runtime-card-policy.md` so the generated-card authoring contract matches the new runtime
- [x] Search for and remove remaining in-repo examples, fixtures, and assertions that still teach the old split-state or scoped-dispatch API
- [x] Run targeted test suites for runtime service, host rerender, routing, and inventory-facing runtime integration
- [x] Commit Slice 3 authoring/prompt/test cleanup

### Ticket Bookkeeping

- [x] Record the reMarkable re-upload and implementation-task expansion in the APP-11 diary and changelog
- [x] After each slice, update the diary with exact commands, test outcomes, failures, and commit hashes
- [x] After each slice, mark completed tasks in this ticket
- [x] Keep the APP-11 bundle ready for a final re-upload once implementation is complete

## Execution Sweep: Remaining APP Consumers

### Slice 4: ARC AGI Player Runtime Cutover

- [x] Replace remaining `ingestRuntimeIntent(...)` bridge calls with `ingestRuntimeAction(...)`
- [x] Rewrite the ARC demo plugin bundle to consume `state` and dispatch generic runtime actions only
- [x] Align ARC stack capabilities with the slices and system actions the bundle now reads and dispatches
- [x] Run targeted ARC typecheck validation against `apps/arc-agi-player/tsconfig.json`
- [x] Commit Slice 4 ARC runtime cutover

### Slice 5: SQLite Runtime Cutover

- [x] Rewrite the SQLite plugin bundle to consume `state` and dispatch `draft.*`, `sqlite/*`, and `nav.*` actions
- [x] Stop reading `globalState.domains` in SQLite and project `app_sqlite.hypercard` directly from runtime state
- [x] Align SQLite stack capabilities with both `sqlite` dispatch actions and `app_sqlite` projected state
- [x] Run targeted SQLite typecheck validation against `apps/sqlite/tsconfig.json`
- [x] Commit Slice 5 SQLite runtime cutover

### Slice 6: Ticket Closeout For The Sweep

- [x] Record the ARC and SQLite cutovers in the APP-11 diary with exact prompts, commands, validations, and commit hashes
- [x] Update the APP-11 changelog with the final sweep commits and runtime breakage fixes
- [x] Mark the remaining execution-sweep tasks complete in this file
- [x] Run `docmgr doctor --ticket APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION --stale-after 30`
- [x] Commit Slice 6 ticket bookkeeping updates
