---
Title: Implementation diary
Ticket: OS-10-PHASE2-SHARED-PRIMITIVES
Status: active
Topics:
    - frontend
    - widgets
    - refactoring
    - design-system
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - packages/rich-widgets/src/primitives/WidgetToolbar.tsx:New shared toolbar primitive
    - packages/rich-widgets/src/primitives/WidgetStatusBar.tsx:New shared status bar primitive
    - packages/rich-widgets/src/primitives/ModalOverlay.tsx:New shared modal overlay primitive
    - packages/rich-widgets/src/primitives/ProgressBar.tsx:New shared progress bar primitive
    - packages/rich-widgets/src/primitives/EmptyState.tsx:New shared empty state primitive
    - packages/rich-widgets/src/primitives/SearchBar.tsx:New shared search bar primitive
    - packages/rich-widgets/src/primitives/Separator.tsx:New shared separator primitive
    - packages/rich-widgets/src/theme/primitives.css:Shared CSS for all primitives
    - packages/rich-widgets/src/parts.ts:Data-part constants registry (added 13 new entries)
    - packages/rich-widgets/src/index.ts:Barrel exports (added 7 primitives)
ExternalSources: []
Summary: "Implementation diary for Phase 2: extracting shared primitives from rich widgets"
LastUpdated: 2026-03-02T19:00:00-05:00
WhatFor: "Track what changed, what worked, and what was tricky during Phase 2"
WhenToUse: "When reviewing Phase 2 changes or continuing cleanup work"
---

# Implementation Diary — OS-10-PHASE2-SHARED-PRIMITIVES

## Step 1: Create 7 shared primitive components

### What changed

Created 7 primitive components in `primitives/`:

| Component | File | Props | data-part |
|-----------|------|-------|-----------|
| WidgetToolbar | `WidgetToolbar.tsx` | `children, className` | `widget-toolbar` |
| WidgetStatusBar | `WidgetStatusBar.tsx` | `children, className` | `widget-status-bar` |
| ModalOverlay | `ModalOverlay.tsx` | `children, onClose, className` | `modal-overlay` + `modal-content` |
| ProgressBar | `ProgressBar.tsx` | `value, max, className` | `widget-progress-bar` + `widget-progress-fill` |
| EmptyState | `EmptyState.tsx` | `icon, message, className` | `widget-empty-state` + `widget-empty-icon` |
| SearchBar | `SearchBar.tsx` | `value, onChange, placeholder, count, className` | `widget-search-bar` + related |
| Separator | `Separator.tsx` | `orientation, className` | `widget-separator` |

Supporting changes:
- **parts.ts** — Added 13 new data-part constants (prefixed `widget*` or `modal*`)
- **theme/primitives.css** — Shared CSS for all 7 primitives. Toolbar: flex row with gap/border-bottom. StatusBar: flex row with justify-content:space-between/border-top. ModalOverlay: absolute inset:0 with rgba backdrop. ProgressBar: relative container + absolute fill. EmptyState: flex-col centered. SearchBar: flex row with inset-shadow input. Separator: inline-block with data-orientation for vertical/horizontal variants.
- **theme/index.ts** — Added `import './primitives.css'` at top
- **index.ts** — Barrel-exported all 7 components + props types

### Design decisions

1. **ModalOverlay wraps children with stopPropagation** — The overlay div handles `onClick={onClose}`, and an inner `modal-content` div calls `stopPropagation` automatically. Widgets supply their own modal card styling inside.
2. **Separator uses data-orientation** — Rather than two separate components or a boolean prop, `data-orientation="vertical"|"horizontal"` drives CSS. Vertical is default since toolbars are the primary use case.
3. **SearchBar is a controlled component** — Takes `value` and `onChange` directly, matching the pattern used by all widgets. The `count` prop is optional for showing result counts.
4. **ProgressBar normalizes to percentage** — Accepts `value/max` and calculates percentage internally, clamped to 0-100%.
5. **All primitives accept `className`** — For per-widget overrides when the shared style doesn't match exactly.

### What worked

All 7 primitives compiled without errors on first try. The CSS patterns were distilled from the background research agent that analyzed all 20 widgets' CSS rules.

### Commit

`ddd3711 feat(rich-widgets): add 7 shared primitives — Toolbar, StatusBar, ModalOverlay, ProgressBar, EmptyState, SearchBar, Separator (OS-10 Phase 2)`

---

## Step 2: Migrate toolbars (12 widgets)

### What changed

Replaced `<div data-part={RICH_PARTS.xxxToolbar}>` with `<WidgetToolbar>` in 12 widgets:

LogViewer, MacWrite, KanbanBoard, NodeEditor, Oscilloscope, LogicAnalyzer, MacCalendar, MacCalc, MusicPlayer, SteamLauncher, ChatBrowser, SystemModeler

Each file gained an `import { WidgetToolbar } from '../primitives/WidgetToolbar'` and swapped the opening/closing div tags. All toolbar children remain untouched.

### What worked

All 12 migrations were mechanical — open tag + close tag swap. No children needed adjustment. TypeScript passed clean on first try.

### Commit

`244a185 refactor(rich-widgets): migrate 12 widgets to shared WidgetToolbar primitive (OS-10 Phase 2)`

---

## Step 3: Migrate status bars (14 widgets)

### What changed

Replaced `<div data-part={...xxxStatusBar}>` with `<WidgetStatusBar>` in 14 widgets:

LogViewer, MacWrite, KanbanBoard, MacRepl, NodeEditor, MacCalendar, MacCalc, GameFinder, MusicPlayer, StreamLauncher, SteamLauncher, YouTubeRetro, ChatBrowser, SystemModeler

### What worked

Same mechanical pattern as toolbars. Some widgets use `const P = RICH_PARTS` alias — both patterns (`RICH_PARTS.xxx` and `P.xxx`) were handled.

### Commit

`5f7ebdd refactor(rich-widgets): migrate 14 widgets to shared WidgetStatusBar primitive (OS-10 Phase 2)`

---

## Step 4: Migrate separators (7 widgets, 13 instances) and modal overlays (6 widgets, 7 instances)

### What changed

**Separators:** Replaced `<span data-part={RICH_PARTS.xxxSeparator} />` and `<div data-part={P.xxxSeparator} />` with `<Separator />` in MacWrite (3), KanbanBoard (3), Oscilloscope (1), LogicAnalyzer (1), MacCalc (3), SystemModeler (1), StreamLauncher (1).

**Modal Overlays:** Replaced overlay+stopPropagation div pairs with `<ModalOverlay onClose={...}>` in:
- KanbanBoard (TaskModal component)
- MacCalendar (Palette + EventModal — 2 instances)
- SystemModeler (ParamsDialog + SimParamsDialog — 2 instances)
- MacCalc (Palette)
- GameFinder (LaunchOverlay)
- SteamLauncher (LaunchOverlay)

### What was tricky

- **ModalOverlay needed a `style` prop** — The Calendar Palette passes `paddingTop: 40, alignItems: 'flex-start'` to its overlay (the command palette opens near the top, not centered). Added `style?: CSSProperties` to `ModalOverlayProps`.
- **GameFinder and SteamLauncher launch overlays** had no click-to-dismiss behavior (they auto-dismiss after a timer). The migration adds click-to-dismiss via `onClose`, which is a minor behavior improvement.

### Commit

`1d39cdd refactor(rich-widgets): migrate separators (7 widgets, 13 instances) and modal overlays (6 widgets, 7 instances) to shared primitives (OS-10 Phase 2)`

---

## Step 5: Migrate EmptyState (7 widgets), SearchBar (1 widget), ProgressBar (2 widgets)

### What changed

**EmptyState** migrated in 7 widgets:
- StreamLauncher: icon 📺 + "No streams found"
- GameFinder: icon 🕹️ + "No games found"
- MusicPlayer: 2 instances — "No matching tracks." and "Queue empty." (no icon)
- YouTubeRetro: icon 📭 + "No videos found."
- ChatBrowser: 2 instances — sidebar "No conversations found." + main area with icon 🗄️ and multi-line message
- SteamLauncher: 2 instances — "No downloads in progress." with icon + "No games found." (no icon)
- DeepResearch: complex multi-line with icon 🔍

**SearchBar** migrated in 1 widget:
- StreamLauncher: `<SearchBar value={search} onChange={setSearch} placeholder="Search streams..." count={filtered.length} />`
- Skipped GameFinder (no icon, custom count text) and SteamLauncher (bare input, no icon/count)

**ProgressBar** migrated in 2 widgets (4 instances):
- GameFinder: 3 instances (download bar, achievements bar, profile stats bar)
- SystemModeler: 1 instance (simulation progress)
- Skipped DeepResearch (has `indeterminate` state) and StreamLauncher (interactive seekable bar)

### What worked

EmptyState migration was the biggest win — replaced 10+ lines of inline JSX per instance with a single `<EmptyState icon="..." message="..." />` call. The `message` prop accepting `ReactNode` made complex multi-line content possible.

### What was skipped and why

| Widget | Primitive | Reason |
|--------|-----------|--------|
| GameFinder | SearchBar | No icon, custom count text ("X games") |
| SteamLauncher | SearchBar | Bare input, no icon or count |
| DeepResearch | ProgressBar | Has indeterminate state not supported by primitive |
| StreamLauncher | ProgressBar | Interactive seekable bar with thumb handle |

### Commit

`7092693 refactor(rich-widgets): migrate EmptyState (7 widgets), SearchBar (1 widget), ProgressBar (2 widgets) to shared primitives (OS-10 Phase 2)`

---

## Verification

- TypeScript check: no new errors introduced (all remaining are pre-existing: ChartView RadioButton type, launcher missing dep, Oscilloscope Checkbox type)
- 4 commits in Phase 2: 1 creation + 4 migration batches
- Files changed across all commits: 7 new files + ~18 modified widgets

## Code review instructions

1. **Primitive CSS specificity**: The shared `[data-part='widget-toolbar']` CSS now applies instead of per-widget `[data-part='xxx-toolbar']` rules. If any widget's toolbar looks different after migration, it means the per-widget CSS had overrides (gap, padding, background) that aren't carried by the shared rule. Check visually.
2. **ModalOverlay style prop**: The Calendar Palette uses `style={{ paddingTop: 40, alignItems: 'flex-start' }}` on the ModalOverlay. Verify the command palette opens near top of window, not dead center.
3. **EmptyState with complex message**: ChatBrowser and DeepResearch pass multi-line JSX fragments as `message`. Verify they render correctly — the `<div>` wrapper around `message` in EmptyState.tsx should not break layout.
4. **ProgressBar max normalization**: GameFinder's profile stats bar passes `max={totalPossible || 1}` to avoid division by zero. Verify the bar renders correctly with 0 achievements.
