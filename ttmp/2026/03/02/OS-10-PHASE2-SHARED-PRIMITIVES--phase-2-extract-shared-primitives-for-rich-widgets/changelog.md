# Changelog

## 2026-03-02

- Initial workspace created


## 2026-03-02

Step 1: Created 7 shared primitives (WidgetToolbar, WidgetStatusBar, ModalOverlay, ProgressBar, EmptyState, SearchBar, Separator) with shared CSS, data-part registration, and barrel exports

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/primitives/WidgetToolbar.tsx — New primitive
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/theme/primitives.css — Shared CSS


## 2026-03-02

Step 2: Migrated 12 widgets to shared WidgetToolbar primitive

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoard.tsx — Toolbar migration
- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/log-viewer/LogViewer.tsx — Toolbar migration


## 2026-03-02

Step 3: Migrated 14 widgets to shared WidgetStatusBar primitive

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/repl/MacRepl.tsx — StatusBar migration


## 2026-03-02

Step 4: Migrated separators (7 widgets, 13 instances) and modal overlays (6 widgets, 7 instances) to shared primitives. Added style prop to ModalOverlay for Calendar Palette.

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/primitives/ModalOverlay.tsx — Added style prop


## 2026-03-02

Step 5: Migrated EmptyState (7 widgets, 10 instances), SearchBar (1 widget), ProgressBar (2 widgets, 4 instances). Skipped widgets with incompatible patterns (DeepResearch indeterminate progress, StreamLauncher seekable bar, etc.).

### Related Files

- /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/deep-research/DeepResearch.tsx — EmptyState migration

