---
Title: Rich Widget Import Analysis and Integration Plan
Ticket: OS-07-ADD-RICH-WIDGETS
Status: active
Topics:
    - frontend
    - widgets
    - storybook
    - redux
    - architecture
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/imports/log-viewer.jsx
    - /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/engine/src/components/widgets/index.ts
    - /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/engine/src/parts.ts
    - /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/engine/docs/theming-and-widget-playbook.md
ExternalSources: []
Summary: "Comprehensive analysis of 17 imported macOS-style React widgets, mapping their inline-styled components to the engine's data-part/token system, with a phased integration plan."
LastUpdated: 2026-03-01T22:24:08.697862815-05:00
WhatFor: "Guide the integration of imported rich widgets into the go-go-os frontend framework"
WhenToUse: "When planning or executing widget porting tasks for OS-07"
---

# Rich Widget Import Analysis and Integration Plan

## Executive Summary

We have 17 imported React components (11,057 lines total) in `imports/` that implement rich macOS-style desktop applications. Each is a self-contained JSX file with inline styles, local state via React hooks, and its own reimplementation of Mac UI primitives (buttons, checkboxes, windows, title bars). The goal is to port these into a new `packages/rich-widgets` package that:

1. Replaces inline styles with the engine's `data-part` + CSS token system
2. Reuses existing engine widgets (`Btn`, `Checkbox`, `TabControl`, `DataTable`, `ListView`, etc.)
3. Adds Redux slices where appropriate for state that should be shared or persisted
4. Provides comprehensive Storybook stories for each widget
5. Registers as launchable apps via the `desktop-os` contribution system

We start with `log-viewer.jsx` as the reference implementation, then work through the remaining 16 widgets in priority order.

## Problem Statement

The 17 imported files share these problems:

1. **Duplicated primitives.** Every file reimplements `MacButton`, `MacCheckbox`, `MacWindow`, `TitleBar`, and `MacSlider` with slight variations. The engine already exports `Btn`, `Checkbox`, `TabControl`, and the windowing shell.

2. **Inline styles everywhere.** Each component hardcodes colors (`#000`, `#fff`, `#c0c0c0`), fonts (`"Geneva"`, `"Chicago"`), borders (`2px solid #000`), and spacing. This makes them un-themeable and inconsistent with the engine's token system.

3. **No data-part attributes.** The engine's CSS system targets `[data-part="..."]` selectors. None of the imports use this convention, so they can't participate in theming.

4. **Local-only state.** All state is managed via `useState` hooks. There's no Redux integration, meaning widget state can't be observed, persisted, or shared with other parts of the desktop.

5. **No Storybook coverage.** None of the imports have stories, making it impossible to test visual variants, themes, or edge cases.

6. **JSX not TSX.** All files are plain JavaScript without type annotations.

## Imported Widget Inventory

| # | File | Lines | Category | Description |
|---|------|-------|----------|-------------|
| 1 | `log-viewer.jsx` | 533 | Developer Tools | Log stream viewer with level filtering, service filtering, search, sparkline activity chart, streaming mode, detail inspector |
| 2 | `oscilloscope.jsx` | 505 | Instruments | Canvas-based oscilloscope with waveform generation, dual channels, CRT phosphor effect |
| 3 | `repl.jsx` | 809 | Developer Tools | Terminal/REPL with command history, tab autocomplete, themes, built-in commands |
| 4 | `chart-widget.jsx` | 667 | Data Visualization | Canvas-based charts (line, bar, pie, scatter) with Mac fill patterns and tooltips |
| 5 | `mactask.jsx` | 568 | Productivity | Kanban board with drag-and-drop columns, task cards, command palette, multi-theme |
| 6 | `node-editor.jsx` | 776 | Creative Tools | Visual node/graph editor with draggable nodes, port connections, pan/zoom |
| 7 | `macwrite.jsx` | 683 | Productivity | Rich text editor with formatting toolbar, ruler, document statistics |
| 8 | `maccal.jsx` | 625 | Utilities | Calendar application with month/week views, event management |
| 9 | `maccalc.jsx` | 869 | Utilities | Scientific calculator with history tape, multiple modes |
| 10 | `deep-research-mac.jsx` | 889 | AI/Research | Research assistant with query input, source cards, progress tracking |
| 11 | `gamefinder.jsx` | 611 | Entertainment | Game discovery browser with filtering, ratings, categories |
| 12 | `graph-navigator.jsx` | 633 | Data Visualization | Interactive graph/network navigator with node details |
| 13 | `logic-analyzer.jsx` | 556 | Instruments | Digital logic analyzer with signal traces, timing diagrams |
| 14 | `spotify-retro.jsx` | 622 | Entertainment | Retro music player with playlist, playback controls |
| 15 | `steam-launcher.jsx` | 690 | Entertainment | Game launcher with library, store, download management |
| 16 | `stream-launcher.jsx` | 442 | Entertainment | Streaming service launcher (shortest import) |
| 17 | `youtube-retro.jsx` | 579 | Entertainment | Retro video browser with thumbnails, playback |

## Mapping Imported Primitives to Engine Widgets

Each imported file reimplements a set of Mac UI primitives. Here's how they map to existing engine components:

### Direct Replacements

| Import Primitive | Engine Widget | Notes |
|-----------------|---------------|-------|
| `MacButton` / `MacBtn` | `Btn` | Engine's `Btn` supports `variant`, `active`, `isDefault`. Import's inline press state → use `data-state="active"` |
| `MacCheckbox` | `Checkbox` | Engine's `Checkbox` has `data-part="checkbox"` + `data-part="checkbox-mark"`. Direct replacement. |
| `TitleBar` + `MacWin` | Shell windowing system | When running inside `DesktopShell`, the window chrome is handled automatically. For standalone stories, use a `MacWindow` wrapper story decorator. |
| `MacSlider` | **NEW: `Slider`** | No engine equivalent exists. Need to create a new `Slider` widget with `data-part="slider"`, `data-part="slider-track"`, `data-part="slider-thumb"`. |
| Radio buttons (chart-widget) | `RadioButton` | Engine's `RadioButton` is a direct match. |
| Select/dropdown (chart-widget) | `DropdownMenu` | Engine's `DropdownMenu` handles this pattern. |
| Search input | `fieldInput` part | Engine's `data-part="field-input"` provides themed input styling. |
| Tab controls (several) | `TabControl` | Engine's `TabControl` with `data-part="tab-bar"` and `data-part="tab"`. |
| Data lists/tables | `DataTable` / `ListView` / `SelectableList` | Multiple engine widgets handle list/table patterns. |
| Status bars | `statusBar` part | Engine's `data-part="status-bar"` provides the bottom-of-window status strip. |
| Progress bars | `ProgressBar` | Engine's `ProgressBar` with dithered fill pattern. |
| Filter bars | `FilterBar` | Engine's `FilterBar` handles filter chip patterns. |
| Tooltips/toasts | `Toast` | Engine's `Toast` for transient messages. |
| Command palette (mactask) | **NEW: `CommandPalette`** | No engine equivalent. Need a new searchable command palette widget. |

### New Widgets Needed

These primitives appear across multiple imports and don't have engine equivalents:

1. **`Slider`** — Range input with Mac-style track and thumb. Used by oscilloscope, logic-analyzer.
2. **`Sparkline`** — Inline SVG bar chart for activity visualization. Used by log-viewer.
3. **`CommandPalette`** — Searchable action list with keyboard nav. Used by mactask.
4. **`CanvasView`** — Wrapper for canvas-based rendering (oscilloscope, chart-widget, logic-analyzer). Provides the CRT bezel, dither overlay, and status readout framing.
5. **`SplitPane`** — Resizable split layout (sidebar + main + inspector). Used by log-viewer, mactask, node-editor.

### New Composite Widgets (the "rich" widgets themselves)

Each imported file becomes a composite widget that composes engine primitives:

1. **`LogViewer`** — Composes `ListView`, `FilterBar`, `Sparkline`, `TabControl`, `Checkbox`, `Btn`, `SelectableList`
2. **`Oscilloscope`** — Composes `CanvasView`, `Slider`, `Checkbox`, `Btn`, `RadioButton`
3. **`MacRepl`** — Composes terminal-specific parts (new parts: `repl-output`, `repl-input`, `repl-prompt`)
4. **`ChartView`** — Composes `CanvasView`, `RadioButton`, `DropdownMenu`
5. **`KanbanBoard`** — Composes `DataTable`-like cards, `CommandPalette`, `FilterBar`
6. **`NodeEditor`** — Composes custom canvas/SVG layer with node parts
7. And so on for the remaining 11 widgets.

## Proposed Package Structure

```
packages/rich-widgets/
  package.json
  tsconfig.json
  vitest.config.ts
  src/
    index.ts                          # Public API
    parts.ts                          # New data-part constants
    primitives/                       # New primitive widgets
      Slider.tsx
      Slider.stories.tsx
      Sparkline.tsx
      Sparkline.stories.tsx
      CommandPalette.tsx
      CommandPalette.stories.tsx
      CanvasView.tsx
      CanvasView.stories.tsx
      SplitPane.tsx
      SplitPane.stories.tsx
    log-viewer/                       # First integration target
      LogViewer.tsx
      LogViewer.stories.tsx
      logViewerSlice.ts               # Redux slice for log state
      types.ts
      sampleData.ts                   # Test data generators
    oscilloscope/
      ...
    repl/
      ...
    chart-view/
      ...
    kanban/
      ...
    node-editor/
      ...
    (remaining widgets...)
    theme/
      rich-widgets.css                # CSS rules for new data-parts
```

## Design Decisions

### 1. New package vs. adding to engine

**Decision:** Create a new `packages/rich-widgets` package.

**Rationale:** The engine package contains the foundational widget library (buttons, tables, forms). Rich widgets are composite applications built *on top of* engine widgets. Keeping them separate:
- Prevents the engine package from growing too large
- Allows rich-widgets to depend on engine without circular deps
- Makes it clear which widgets are primitives vs. applications
- Allows independent versioning

### 2. CSS approach: data-parts + tokens, not inline styles

**Decision:** All styling through `data-part` attributes and `--hc-` tokens.

**Rationale:** The entire engine CSS system is built on this. Inline styles in the imports are un-themeable. By using data-parts, themes automatically apply to rich widgets.

### 3. State management: Redux slices per widget

**Decision:** Each rich widget gets an optional Redux slice for its core state.

**Rationale:** 
- Widget state can be persisted across window close/reopen
- Other parts of the desktop can observe widget state (e.g., notification badges)
- The `desktop-os` store system (`createLauncherStore`, `collectModuleReducers`) already supports per-module reducers
- Props-based state is still available for standalone/story usage

### 4. TypeScript from the start

**Decision:** All new code in TypeScript with strict types.

**Rationale:** The entire codebase is TypeScript. The imports are JSX which need conversion anyway.

### 5. Start with LogViewer

**Decision:** Port `log-viewer.jsx` first as the reference implementation.

**Rationale:**
- Medium complexity (533 lines) — not too simple, not too complex
- Exercises many engine widgets: `Btn`, `Checkbox`, `FilterBar`, `DataTable`-like table, `Sparkline` (new)
- Clear separation of concerns: data generation, filtering logic, presentation
- Good test of the Redux integration pattern (log entries, filter state, streaming)

## Alternatives Considered

### A. Wrap imports as-is behind thin adapters

**Rejected** because the inline styles would never participate in theming, the duplicate primitives would remain, and we'd have two styling systems in the codebase.

### B. Add all widgets directly to the engine package

**Rejected** because the engine package is the foundational widget library. Rich composite widgets are applications, not primitives. Mixing them blurs the boundary.

### C. One package per widget

**Rejected** as over-engineering. 17 packages would be excessive. A single `rich-widgets` package with subdirectories per widget is sufficient.

## Implementation Plan

### Phase 1: Package scaffolding and primitives (Tasks 1-3)

1. Create `packages/rich-widgets` with package.json, tsconfig, vitest config
2. Register in pnpm-workspace and storybook config
3. Create new primitive widgets: `Sparkline`, `Slider`
4. Add new data-parts to engine's `parts.ts` or rich-widgets' own parts
5. Add CSS rules for new parts to `rich-widgets.css`
6. Write Storybook stories for each primitive

### Phase 2: LogViewer integration (Tasks 4-7)

4. Convert LogViewer types and sample data to TypeScript
5. Create `logViewerSlice.ts` Redux slice (logs, filters, streaming state)
6. Build `LogViewer.tsx` composing engine widgets + new primitives
7. Write comprehensive Storybook stories (empty state, streaming, filtered, error-heavy, compact mode)

### Phase 3: Remaining developer tools (Tasks 8-11)

8. Port `repl.jsx` → `MacRepl.tsx`
9. Port `oscilloscope.jsx` → `Oscilloscope.tsx`
10. Port `logic-analyzer.jsx` → `LogicAnalyzer.tsx`
11. Port `chart-widget.jsx` → `ChartView.tsx`

### Phase 4: Productivity widgets (Tasks 12-14)

12. Port `mactask.jsx` → `KanbanBoard.tsx` (includes CommandPalette)
13. Port `macwrite.jsx` → `MacWrite.tsx`
14. Port `maccal.jsx` → `MacCalendar.tsx`

### Phase 5: Data visualization (Tasks 15-16)

15. Port `graph-navigator.jsx` → `GraphNavigator.tsx`
16. Port `node-editor.jsx` → `NodeEditor.tsx`

### Phase 6: Entertainment/utility widgets (Tasks 17-21)

17. Port `maccalc.jsx` → `MacCalculator.tsx`
18. Port `deep-research-mac.jsx` → `DeepResearch.tsx`
19. Port `gamefinder.jsx` → `GameFinder.tsx`
20. Port `spotify-retro.jsx` → `RetroMusicPlayer.tsx`
21. Port remaining: `steam-launcher`, `stream-launcher`, `youtube-retro`

### Phase 7: Desktop integration (Tasks 22-23)

22. Register all widgets as launchable apps via `AppManifest`
23. Integration testing with `DesktopShell`

## Testing and Validation Strategy

1. **Storybook stories** for every widget: default, themed (classic, modern, macos1), edge cases
2. **Unit tests** for Redux slices and pure logic (filtering, data generation)
3. **Visual regression** via Storybook's built-in tools
4. **Accessibility** checks via `@storybook/addon-a11y`
5. **Theme compatibility** test: every story should look correct under all 3 themes

## Key Files Reference

| File | Role |
|------|------|
| `packages/engine/src/parts.ts` | All 104 data-part constants |
| `packages/engine/src/theme/desktop/tokens.css` | ~90 CSS custom properties |
| `packages/engine/src/theme/desktop/primitives.css` | CSS rules targeting data-parts |
| `packages/engine/src/components/widgets/index.ts` | Engine widget exports |
| `packages/engine/docs/theming-and-widget-playbook.md` | Complete guide to the widget system |
| `packages/desktop-os/src/store/createLauncherStore.ts` | Redux store creation with module reducers |
| `packages/desktop-os/src/contracts/appManifest.ts` | App manifest types for desktop registration |
| `.storybook/main.ts` | Storybook config (need to add rich-widgets stories dir) |
| `.storybook/preview.ts` | Storybook preview with HyperCardTheme decorator |

## Open Questions

1. Should canvas-based widgets (oscilloscope, charts) continue using `<canvas>` or switch to SVG? Canvas offers better performance for animations; SVG is more theme-friendly. **Decision: keep canvas for animated widgets, use SVG for static charts.**

2. Should the REPL widget have a real JavaScript evaluation backend, or remain demo-only? **Decision: start demo-only, make the command handler pluggable for future backend integration.**

3. How much of the mactask Kanban state should live in Redux vs. local component state? **Decision: board layout and task data in Redux; UI transients (drag position, hover state) in local state.**
