---
Title: Rich widget Storybook matrix and rollout plan
Ticket: OS-15-RICH-WIDGET-STORYBOOK-COVERAGE
Status: active
Topics:
    - frontend
    - widgets
    - storybook
    - state-management
    - architecture
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-05T19:58:56.483074176-05:00
WhatFor: ""
WhenToUse: ""
---

# Rich widget Storybook matrix and rollout plan

## Executive Summary

The rich widget package already has one story file per widget, but coverage is shallow and inconsistent. Most widgets only expose `Default`, `Compact`, and one light fixture variant, which is not enough to drive the remaining cleanup goals: Redux adoption where appropriate, further primitive extraction, and confidence in edge-state rendering.

This ticket treats Storybook as the execution harness for the unfinished guide. The job is not “add a few more stories”; it is to define a repeatable story matrix for every widget, add shared helpers where the current stories are repetitive, and then use those stories to expose which widgets need Redux-backed state or additional primitive cleanup.

## Problem Statement

The original OS-07 porting guide assumed richer Storybook coverage than what actually shipped. Current gaps:

1. Most widgets lack stateful scenarios such as filtered, loading/running, error, selected, or modal/palette-open states.
2. Redux-backed scenarios are almost entirely absent outside desktop integration.
3. Stories duplicate framing boilerplate (`height: 100vh`, fixed window shells) instead of using shared helpers.
4. Several widgets have internal states that are not externally seedable, which blocks deterministic stories and is a signal for either Redux state or better seed props.

## Proposed Solution

Create a ticket-driven rollout that:

1. Adds shared Storybook helpers for rich widgets.
2. Audits every widget against a target story matrix.
3. Implements stories widget-by-widget in a fixed order, checking tasks off as they land.
4. Uses the new stories to drive subsequent Redux and primitive-cleanup work rather than guessing.

## Design Decisions

### Decision 1: Keep a per-widget task list

Every composite widget gets its own task. This keeps progress visible and commits focused.

### Decision 2: Use Storybook to surface Redux targets

We are not treating stories and Redux as separate workstreams. When a widget cannot express an important state through props or a thin story wrapper, that becomes evidence for either:
- a new seed prop, or
- a Redux slice / seedable store-backed story path.

### Decision 3: Start with shared story helpers

Many stories repeat the same framing pattern. A shared helper should land before broad story expansion so the follow-on work stays mechanical and consistent.

### Decision 4: Define a practical matrix, not one fixed template

Every widget should cover:
- baseline/default
- empty or minimal data
- compact/constrained layout

Then each widget adds domain-specific state stories:
- streaming / paused / running
- filtered / searched / selected
- modal / palette / overlay open
- error-heavy / dense / edge-case content

## Current Coverage Audit

Audit source: `ttmp/2026/03/05/OS-15-RICH-WIDGET-STORYBOOK-COVERAGE--rich-widget-storybook-coverage-redux-scenarios-and-cleanup-follow-through/scripts/audit-story-exports.mjs`

| Widget | Current stories | Target additions |
|---|---|---|
| LogViewer | `Default`, `Empty`, `FewEntries`, `ManyEntries`, `Streaming`, `ErrorHeavy` | `SingleService`, `DenseErrors`, `SearchActive`, `InspectorOpen` |
| ChartView | `LineChart`, `BarChart`, `PieChart`, `ScatterChart`, `WithDatasetSwitcher`, `BugTracker`, `SmallChart`, `LargeChart`, `LimitedTypes` | `EmptyDataset`, `DenseDataset`, `ThemeContrast` |
| MacWrite | `Default`, `Empty`, `EditOnly`, `PreviewOnly`, `CodeHeavy`, `LongDocument` | `FindBarOpen`, `SplitViewBusy`, `MarkdownEdgeCases` |
| KanbanBoard | `Default`, `Empty`, `FewColumns`, `ManyTasks` | `ModalOpen`, `FilteredBoard`, `DenseTags`, `CollapsedColumns` |
| MacRepl | `Default`, `CustomPrompt`, `WithHistory` | `CompletionOpen`, `ErrorOutput`, `LongSession`, `AltThemeState` |
| NodeEditor | `Default`, `Empty`, `SingleChain` | `DenseGraph`, `SelectedNode`, `ConnectionsFocus`, `PannedCanvas` |
| Oscilloscope | `Default`, `SquareWave`, `Paused`, `LargeCanvas` | `DualChannel`, `HighPhosphor`, `CrosshairOff`, `ControlsDense` |
| LogicAnalyzer | `Default`, `Paused`, `AllChannels`, `TwoChannels`, `Compact` | `TriggerFocused`, `BusView`, `DenseEdges`, `Zoomed` |
| MacCalendar | `Default`, `WeekView`, `Empty`, `EmptyWeek`, `Compact` | `ModalOpen`, `PaletteOpen`, `DenseMonth`, `TodayFocus` |
| GraphNavigator | `Default`, `Compact`, `Empty`, `PersonsOnly` | `DenseGraph`, `SelectedNode`, `ConsoleHistory`, `FilteredTypes` |
| MacCalc | `Default`, `Empty`, `Compact` | `FormulaGrid`, `FindBarOpen`, `PaletteOpen`, `DenseSheet`, `SelectionState` |
| DeepResearch | `Default`, `WithResults`, `Compact` | `ResearchRunning`, `ReportReady`, `SourcesOnly`, `EmptyPrompt` |
| GameFinder | `Default`, `Compact`, `FewGames` | `SearchFiltered`, `DetailOpen`, `Installing`, `LaunchOverlay` |
| RetroMusicPlayer | `Default`, `Compact`, `FewPlaylists` | `QueueHeavy`, `PlayingState`, `EmptyQueue`, `SearchFiltered` |
| StreamLauncher | `Default`, `Compact`, `FewStreams` | `SearchFiltered`, `LivePlayer`, `ChatHidden`, `EmptyCategory` |
| SteamLauncher | `Default`, `Compact`, `FewGames` | `DownloadsActive`, `StoreView`, `LaunchOverlay`, `EmptyLibrary` |
| YouTubeRetro | `Default`, `Compact`, `FewVideos` | `WatchMode`, `SearchFiltered`, `PlayingState`, `EmptyResults` |
| ChatBrowser | `Default`, `Compact`, `FewConversations` | `SearchPanelOpen`, `NoMatches`, `ViewerFocused`, `EmptyState` |
| SystemModeler | `Default`, `Compact`, `EmptyCanvas` | `PaletteOpen`, `SimulationRunning`, `DialogOpen`, `DenseCanvas` |
| ControlRoom | `Default`, `Compact`, `FastTick` | `AlarmsActive`, `QuietState`, `DenseLogs`, `MetricExtremes` |

## Implementation Status (2026-03-05)

The initial story expansion sweep is complete across all 20 composite widgets.

- Baseline coverage before implementation: 79 exported widget stories.
- Coverage after implementation: 128 exported widget stories.
- New shared harness: `packages/rich-widgets/src/storybook/frameDecorators.tsx`.
- Taxonomy status: all touched widget stories now use the `RichWidgets/...` namespace consistently.

### Redux-backed seed state candidates exposed by story work

The story expansion confirms that some widgets still cannot express important states through props alone. These are the clearest next candidates for Redux-backed story seeding or explicit seed props:

- `MacCalc`: selection, find bar, command palette, edit mode.
- `MacCalendar`: selected day, open modal, command palette, active event.
- `KanbanBoard`: selected task, open modal, filtered board state.
- `GameFinder`: selected game, detail view, install progress, launch overlay, active filters.
- `RetroMusicPlayer`: selected playlist, current track, queue visibility, search filter, playback state.
- `StreamLauncher`: selected category, active stream, player/chat visibility, search/sort state.
- `SteamLauncher`: active tab, selected game, friends drawer, install/launch state, filters.
- `YouTubeRetro`: watch mode, active video, search/category state, interaction state.
- `ChatBrowser`: selected conversation, quick filter, advanced search panel/results.

The remaining widgets are still worth making more seedable, but they do not yet show the same pressure for Redux as the list above:

- `LogViewer`, `ChartView`, `MacWrite`, `MacRepl`, `NodeEditor`, `Oscilloscope`, `LogicAnalyzer`, `GraphNavigator`, `DeepResearch`, `SystemModeler`, `ControlRoom`.

## Story Harness Work

Shared work that should land before broad widget conversion:

1. Story frame helpers for fullscreen and fixed-window rendering.
2. Reusable naming convention for stories (`Default`, `Empty`, `Compact`, then domain-specific names).
3. Seed wrapper patterns for widgets that need temporary local-state setup before Redux slices exist.
4. Follow-on store helper for widgets that migrate to Redux-backed seeded scenarios.

## Rollout Order

Recommended order:

1. Shared story helper layer
2. LogViewer
3. MacCalc
4. RetroMusicPlayer
5. DeepResearch
6. ChatBrowser
7. GameFinder
8. StreamLauncher
9. SteamLauncher
10. YouTubeRetro
11. MacCalendar
12. KanbanBoard
13. MacRepl
14. NodeEditor
15. GraphNavigator
16. SystemModeler
17. ControlRoom
18. Oscilloscope
19. LogicAnalyzer
20. ChartView
21. MacWrite

The first ten are the best cleanup drivers because they combine rich UI state with obvious future Redux or primitive work.

## Alternatives Considered

### A. Expand stories only when a widget is actively refactored

Rejected because it leaves the overall matrix incomplete and makes it easy to forget widgets.

### B. Add Redux slices first, then stories

Rejected because stories are the better forcing function for deciding which state needs to be externally seeded.

### C. Treat all widgets uniformly

Rejected because the right story set depends on widget behavior. Instruments, data tools, editors, and entertainment widgets need different scenario coverage.

## Implementation Plan

1. Add shared story helpers and seed wrappers.
2. Update ticket tasks with one checkbox per widget plus shared harness work.
3. Implement stories widget-by-widget with focused commits.
4. Update diary and changelog after each completed widget.
5. Re-run story audit and Storybook taxonomy checks continuously.

## Open Questions

1. Which of the high-pressure widgets should move to Redux first versus receiving temporary seed props?
2. Should some story-only interaction states use `play` functions, or should we keep pushing toward deterministic seed state?
3. Should visual snapshot capture be a follow-on ticket after the Redux-backed seed states land?
