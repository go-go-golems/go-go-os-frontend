# Changelog

## 2026-03-02

- Initial workspace created


## 2026-03-02

Completed full widget-by-widget cleanup analysis of all 20 rich widgets: 13 extractable primitives identified, 11 bugs cataloged (2 security, 3 module-level state, 3 incorrect hooks, 2 dead code, 4 performance), 6-phase implementation plan proposed

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/design-doc/01-rich-widgets-cleanup-report-widget-by-widget-analysis.md — Full design doc


## 2026-03-02

Post-cleanup code review completed: audited widget sizes (5 monolithic >400 lines), state management (6 remaining useReducer candidates), CSS theming (29 hex violations, 72 dead data-parts), code quality (9 TS errors, 0 React.memo), primitive adoption (ButtonGroup 0/20, SearchBar 1/6). Recommended 6 follow-up phases (A-F).

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/design-doc/02-post-cleanup-code-review-modularity-state-management-and-code-quality.md — Post-cleanup review design doc


## 2026-03-02

Independent re-review completed across OS-07 and OS-08: validated Redux usage gaps, Storybook Redux simulation coverage, widget modularity hotspots, and CSS duplication/dead-part residue; published design doc 03 with phased remediation plan.

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx — Only rich-widget story with explicit Redux Provider
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/parts.ts — 72 dead data-part keys confirmed
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/theme/log-viewer.css — Legacy selector residue after primitive migration
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/design-doc/03-independent-review-redux-usage-storybook-state-simulation-modularization-and-css-duplication.md — Independent review report


## 2026-03-02

Uploaded independent review bundle (design doc 03 + investigation diary) to reMarkable at /ai/2026/03/03/OS-08-CLEANUP-RICH-WIDGETS.

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/design-doc/03-independent-review-redux-usage-storybook-state-simulation-modularization-and-css-duplication.md — Uploaded in review bundle
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/reference/01-investigation-diary.md — Uploaded in review bundle


## 2026-03-02

Phase A Task 1 complete (commit 6c766dad9bb19cb31c96984ce6da1b59e9a8bddc): added launcher Redux slice for rich-widget launch stats, wired launch dispatch across modules, and registered shared state key app_rich_widgets.

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/launcher/modules.tsx — Dispatch markLaunched on launch and register module state
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/launcher/richWidgetsLauncherState.test.ts — Reducer test coverage
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/launcher/richWidgetsLauncherState.ts — New launcher reducer and actions


## 2026-03-02

Phase A Task 2 complete (commit 0a57c34b118824e70d02c8d3db90c54b0d3f2b9d): added Redux-seeded Storybook desktop scenarios for rich widgets (SeedLogAndMusicWindows, SeedInstrumentCluster) using pre-render store seeding.

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx — Redux-seeded scenario support and new stories


## 2026-03-03

Phase A Task 3 complete (commit 25ee144f321db6251dfce9951dbf167cd419f93a): removed dead LogViewer toolbar/status part constants and their legacy selectors after primitive migration.

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/parts.ts — Removed `lvToolbar` and `lvStatusBar` dead part constants
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/theme/log-viewer.css — Removed unused `lv-toolbar`/`lv-status-bar` selectors


## 2026-03-03

Uploaded refreshed OS-08 review bundle (design doc 03 + updated diary/tasks/changelog) to reMarkable at `/ai/2026/03/03/OS-08-CLEANUP-RICH-WIDGETS`.

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/design-doc/03-independent-review-redux-usage-storybook-state-simulation-modularization-and-css-duplication.md — Included in uploaded bundle
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/reference/01-investigation-diary.md — Included in uploaded bundle
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/tasks.md — Included in uploaded bundle
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/changelog.md — Included in uploaded bundle


## 2026-03-03

Phase A Task 4 complete (commit 63cd724d8cb0879d2876a2d9f5c6e68c230bc8c2): removed dead MacWrite toolbar/separator/status part constants and legacy selectors after primitive migration.

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/parts.ts — Removed `mwToolbar`, `mwSeparator`, and `mwStatusBar` dead part constants
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/theme/mac-write.css — Removed unused `mw-toolbar`/`mw-separator`/`mw-status-bar` selectors


## 2026-03-03

Uploaded refreshed OS-08 review bundle including Task 4 updates to reMarkable at `/ai/2026/03/03/OS-08-CLEANUP-RICH-WIDGETS` as `OS-08-CLEANUP-RICH-WIDGETS-update-2026-03-03-task4`.

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/design-doc/03-independent-review-redux-usage-storybook-state-simulation-modularization-and-css-duplication.md — Included in uploaded bundle
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/reference/01-investigation-diary.md — Included in uploaded bundle
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/tasks.md — Included in uploaded bundle
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/changelog.md — Included in uploaded bundle
