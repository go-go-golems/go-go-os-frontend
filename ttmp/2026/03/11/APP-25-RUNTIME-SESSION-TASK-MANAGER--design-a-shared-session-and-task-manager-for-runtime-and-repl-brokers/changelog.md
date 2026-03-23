# Changelog

## 2026-03-11

- Created APP-25 as the dedicated follow-up ticket for a shared task-manager style window above runtime sessions and REPL brokers
- Documented why `Stacks & Cards` is the wrong long-term home for general session/task management
- Documented the current split between runtime-surface sessions and plain JS sessions
- Designed a source-adapter architecture using external source objects plus summary rows rather than one fake universal reducer
- Added a detailed task list for a generic task manager registry, runtime-session source adapter, JS-session source adapter, window design, `wesen-os` integration, and validation
- Implemented the shared `TaskManagerSource` / `TaskManagerRow` / `TaskManagerAction` model in `hypercard-runtime`
- Implemented the external task-manager registry and hook layer with heterogeneous-source tests
- Implemented the first runtime-session and JS-session source adapters with focused action-routing tests
- Implemented the first shared Task Manager window with summary counts, search/filter controls, mixed-source table rendering, action routing, and Storybook coverage
- Added the `Task Manager` launcher module in `wesen-os` and registered both runtime-session and JS-session sources from the live host app
- Ran a live browser smoke confirming that spawned JS sessions and active runtime-surface sessions both appear in the new task manager window
- Narrowed `Stacks & Cards` back toward source/runtime inspection by reducing its temporary JS-session section to a Task Manager handoff
- Added explicit cross-navigation: runtime rows can inspect in `Stacks & Cards`, JS rows can focus the JavaScript REPL, and `Stacks & Cards` can open the Task Manager
- Updated the runtime/debug docs to teach Task Manager as the operator view above runtime and JS session sources
- Re-ran `docmgr doctor` successfully and uploaded the refreshed ticket bundle to reMarkable as `APP-25 Runtime Session Task Manager v2`
