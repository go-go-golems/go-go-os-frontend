# Tasks

## Ticket Setup

- [x] Create APP-19 ticket workspace
- [x] Add APP-19 design doc and investigation diary
- [x] Identify the key runtime, editor, session host, and os-launcher VM metadata files

## Investigation

- [x] Audit the runtime card registry contract and current injection assumptions
- [x] Audit the editor launch and save path used by `CodeEditorWindow`
- [x] Audit the `PluginCardSessionHost` session-load and live-injection loops
- [x] Audit the `QuickJSCardRuntimeService` APIs for full-bundle eval versus card-definition injection
- [x] Audit the built-in `os-launcher` Kanban source path from generated metadata into `Stacks & Cards`
- [x] Document all runtime card load paths in one bug report
- [x] Document the mismatch between runtime snippet injection and built-in VM module source

## Analysis Deliverables

- [x] Write a detailed intern-facing bug report with architecture map, prose, diagrams, pseudocode, and file references
- [x] Record the investigation step in the diary and changelog
- [ ] Relate the key code files directly to the new docs if more references are needed later

## Suggested Fix Work

- [ ] Extend editor launch state so it carries document provenance, not just `cardId` plus raw code
- [ ] Add explicit injection modes such as `factory` versus `module` to the runtime editor/runtime registry contract
- [ ] Preserve `packId` and source mode when reopening editors from runtime registry entries
- [ ] Add a runtime service API that can re-evaluate full VM source files inside an existing session
- [ ] Route built-in stack card edits through full-source evaluation instead of `defineCard(..., (code), packId)`
- [ ] Add tests covering both injected runtime cards and built-in VM source edits

## TODO

- [ ] Add tasks here
