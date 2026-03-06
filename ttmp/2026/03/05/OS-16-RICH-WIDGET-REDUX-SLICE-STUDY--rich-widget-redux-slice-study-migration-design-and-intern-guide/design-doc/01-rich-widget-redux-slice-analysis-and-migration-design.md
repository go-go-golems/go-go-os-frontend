---
Title: Rich widget Redux slice analysis and migration design
Ticket: OS-16-RICH-WIDGET-REDUX-SLICE-STUDY
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
LastUpdated: 2026-03-05T20:24:43.022326708-05:00
WhatFor: ""
WhenToUse: ""
---

# Rich widget Redux slice analysis and migration design

## Executive Summary

This ticket studies every composite rich widget in `packages/rich-widgets/src` and answers one question per widget: should the current local state stay local, move into a Redux slice, or be split between Redux and local transient state?

The short answer is:

- **Adopt Redux slices now** for widgets whose state is durable, seed-worthy in Storybook, or likely to matter outside the leaf component: `LogViewer`, `KanbanBoard`, `NodeEditor`, `MacCalendar`, `MacCalc`, `DeepResearch`, `GameFinder`, `RetroMusicPlayer`, `StreamLauncher`, `SteamLauncher`, `YouTubeRetro`, `ChatBrowser`, `SystemModeler`.
- **Use a partial slice later** for widgets where only the document/session model is durable but the interaction layer is mostly transient: `GraphNavigator`, `MacRepl`, `LogicAnalyzer`, `ControlRoom`.
- **Keep local state for now** for widgets whose state is mostly local presentation control and already story-seedable via props: `ChartView`, `MacWrite`, `Oscilloscope`.

The key architectural constraint is the launcher store API. `LaunchableAppModule.state` allows one reducer registration per module, and `collectModuleReducers()` rejects duplicate state keys in `packages/desktop-os/src/contracts/launchableAppModule.ts:9` and `packages/desktop-os/src/store/createLauncherStore.ts:14`. That means the lowest-friction path is **one state key per widget module**, not a single shared reducer key for the whole package.

This document recommends:

1. Use **unique `app_rw_<widget>` keys** for widgets that gain slices.
2. Move only **durable, story-worthy, externally meaningful** state into Redux.
3. Keep **dragging, hover, animation, canvas cursor, temporary modal form drafts** local.
4. Use Storybook seeding as the proof that a slice or seed prop is justified.

## Problem Statement

The current rich-widget package is inconsistent about state ownership:

- almost every widget stores its session state internally via `useState` or `useReducer`;
- only launcher analytics are registered in the global launcher store today via `packages/rich-widgets/src/launcher/richWidgetsLauncherState.ts:1`;
- Storybook now has good fixture coverage, but many important UI states still cannot be rendered deterministically without reaching into component-local state;
- the existing OS-07 guidance still talks about Redux in broad strokes, but the codebase needs a widget-by-widget decision, not a blanket rule.

This matters for four reasons:

1. **Story determinism.** Search panels, selected rows, active tabs, modal states, and in-progress sessions are hard to represent when they only exist as local state.
2. **Persistence.** If we want a widget window to reopen in a useful state, the durable part of that state needs a stable home.
3. **Observability.** Launcher badges, notifications, command routing, and future automation only work cleanly when externally meaningful state is lifted out of leaf components.
4. **Refactor safety.** A state model that is explicit in a slice is easier to test, seed, and migrate than a long component full of ad hoc hook state.

The goal is not to “Redux everything.” The goal is to identify the durable state model for each widget and leave the rest local.

## System Context

### Launcher store integration

The launcher architecture already supports app-specific reducers:

- `packages/desktop-os/src/contracts/launchableAppModule.ts:9` defines `LaunchableAppStateConfig`.
- `packages/desktop-os/src/store/createLauncherStore.ts:14` collects module reducers.
- `packages/desktop-os/src/store/createLauncherStore.ts:71` merges them into the launcher store.
- `packages/desktop-os/src/store/createLauncherStore.ts:78` exposes `selectModuleState()`.

Current rich-widget registration lives in:

- `packages/rich-widgets/src/launcher/modules.tsx:80` where `logViewerModule` is the only widget currently registering `state`.
- `packages/rich-widgets/src/launcher/richWidgetsLauncherState.ts:1` which only tracks launcher analytics (`launchCount`, `lastLaunchReason`).

Storybook now has reusable store seeding support in:

- `packages/rich-widgets/src/storybook/seededStore.tsx:1`
- `packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx:1`

### Store topology options

There are two viable patterns:

1. **One slice per widget module**
   - each module registers its own `stateKey`, such as `app_rw_log_viewer`
   - easiest incremental adoption path
   - easiest to seed in stories
   - clearest ownership boundary

2. **One shared rich-widgets reducer tree**
   - one reducer key such as `app_rich_widgets`
   - nested subtrees per widget
   - requires central registration through one module or launcher `sharedReducers`
   - creates extra coupling and a more awkward migration path

This document recommends **option 1** for the next phase.

### State placement decision ladder

Use this rule for every state variable:

```text
Is it frame-by-frame or purely visual?
  -> keep local

Is it important for deterministic stories but still widget-scoped?
  -> seed prop first, or local reducer if the component is already reducer-shaped

Is it durable, externally meaningful, or worth persisting/reopening?
  -> Redux slice
```

## Proposed Solution

### Design direction

For each widget:

1. Inventory current local state.
2. Split it into:
   - **document/session state** → candidate for Redux
   - **ephemeral interaction state** → stays local
3. Add one slice per qualifying widget with a unique `app_rw_<widget>` key.
4. Add selectors and `initial*` seed helpers for Storybook and tests.
5. Refactor the component to read durable state via selectors and dispatch actions.

### Recommended state key convention

Use a predictable prefix:

```text
app_rw_log_viewer
app_rw_kanban
app_rw_node_editor
app_rw_mac_calendar
...
```

This stays valid under `AppStateKey = \`app_${string}\`` from `packages/desktop-os/src/contracts/appManifest.ts:1`.

### Widget-by-widget recommendation matrix

| Widget | Current state refs | Recommendation | Proposed state key | Proposed slice shape | Keep local |
|---|---|---|---|---|---|
| LogViewer | `packages/rich-widgets/src/log-viewer/LogViewer.tsx:33` | Redux now | `app_rw_log_viewer` | `entries`, `filters`, `selectedId`, `viewPrefs`, `streaming` | scroll position, auto-scroll DOM effects |
| ChartView | `packages/rich-widgets/src/chart-view/ChartView.tsx:16` | Keep local | — | none for now; use props | tooltip hover, local chart type if data is prop-driven |
| MacWrite | `packages/rich-widgets/src/mac-write/MacWrite.tsx:31` | Keep local for now | — | none now; future document model could be separate | cursor, scroll sync, find modal draft |
| KanbanBoard | `packages/rich-widgets/src/kanban/KanbanBoard.tsx:267` | Redux now | `app_rw_kanban` | `tasks`, `columns`, `filters`, `editingTaskId`, `collapsedCols` | drag-over hint, modal form field draft |
| MacRepl | `packages/rich-widgets/src/repl/MacRepl.tsx:13` | Partial later | `app_rw_mac_repl` | `lines`, `history`, `aliases`, `envVars`, `sessionPrefs` | live suggestion string, completion cursor |
| NodeEditor | `packages/rich-widgets/src/node-editor/NodeEditor.tsx:215` | Redux now | `app_rw_node_editor` | `nodes`, `connections`, `selectedId`, `viewport`, `documentMeta` | dragging offsets, temp connection preview |
| Oscilloscope | `packages/rich-widgets/src/oscilloscope/Oscilloscope.tsx:37` | Keep local for now | — | optional future presets slice only | waveform controls, canvas animation, crosshair |
| LogicAnalyzer | `packages/rich-widgets/src/logic-analyzer/LogicAnalyzer.tsx:47` | Partial later | `app_rw_logic_analyzer` | `channels`, `trigger`, `protocol`, `zoom`, `prefs` | cursor hover, frame rendering state |
| MacCalendar | `packages/rich-widgets/src/calendar/MacCalendar.tsx:452` | Redux now | `app_rw_mac_calendar` | `events`, `currentDate`, `view`, `editingEventId`, `paletteOpen` | modal input draft while typing |
| GraphNavigator | `packages/rich-widgets/src/graph-navigator/GraphNavigator.tsx:370` | Partial later | `app_rw_graph_navigator` | `selectedNodeId`, `query`, `filterType`, `queryLog`, `dataset` | force-layout positions, drag/pan physics |
| MacCalc | `packages/rich-widgets/src/calculator/MacCalc.tsx:259` | Redux now | `app_rw_mac_calc` | `cells`, `selection`, `selectionRange`, `clipboard`, `ui`, `columnWidths` | active edit draft, drag anchor |
| DeepResearch | `packages/rich-widgets/src/deep-research/DeepResearch.tsx:57` | Redux now | `app_rw_deep_research` | `query`, `settings`, `steps`, `progress`, `report`, `sessionStatus` | interval handles, scroll-to-bottom effect |
| GameFinder | `packages/rich-widgets/src/game-finder/GameFinder.tsx:242` | Redux now | `app_rw_game_finder` | `games`, `view`, `selectedGameId`, `search`, `filter`, `sortBy`, `installing`, `launching` | launch animation timer |
| RetroMusicPlayer | `packages/rich-widgets/src/music-player/RetroMusicPlayer.tsx:131` | Redux now | `app_rw_music_player` | `selectedPlaylistId`, `playback`, `libraryUi`, `liked`, `queuePrefs` | EQ bar animation |
| StreamLauncher | `packages/rich-widgets/src/stream-launcher/StreamLauncher.tsx:218` | Redux now | `app_rw_stream_launcher` | `category`, `activeStreamId`, `search`, `sortBy`, `player` | thumbnail canvas animation |
| SteamLauncher | `packages/rich-widgets/src/steam-launcher/SteamLauncher.tsx:247` | Redux now | `app_rw_steam_launcher` | `selectedGameId`, `activeTab`, `showFriends`, `filter`, `search`, `installing`, `launching` | launch/install timers |
| YouTubeRetro | `packages/rich-widgets/src/youtube-retro/YouTubeRetro.tsx:155` | Redux now | `app_rw_youtube_retro` | `view`, `currentVideoId`, `playback`, `filters`, `subscriptions`, `likes`, `comments` | scanline animation, playback timer effect |
| ChatBrowser | `packages/rich-widgets/src/chat-browser/ChatBrowser.tsx:12` | Redux now | `app_rw_chat_browser` | `selectedConversationId`, `quickFilter`, `advancedSearch`, `searchResults`, `showSearchPanel` | text input focus and DOM scroll |
| SystemModeler | `packages/rich-widgets/src/system-modeler/SystemModeler.tsx:14` | Redux now | `app_rw_system_modeler` | `blocks`, `wires`, `selectedId`, `dialogs`, `simulation`, `paletteVisible` | drag wiring preview |
| ControlRoom | `packages/rich-widgets/src/control-room/ControlRoom.tsx:17` | Partial later | `app_rw_control_room` | `switches`, `knobs`, `alarmState`, `sessionPreset` | tick counter, generated log stream, scope waveform buffer |

### Recommended migration order

The best order is not alphabetical. It should maximize payoff for Storybook and minimize launcher-store churn:

1. `LogViewer`
2. `MacCalc`
3. `MacCalendar`
4. `KanbanBoard`
5. `DeepResearch`
6. `ChatBrowser`
7. `GameFinder`
8. `RetroMusicPlayer`
9. `StreamLauncher`
10. `SteamLauncher`
11. `YouTubeRetro`
12. `NodeEditor`
13. `SystemModeler`
14. `GraphNavigator`
15. `MacRepl`
16. `LogicAnalyzer`
17. `ControlRoom`
18. `ChartView`
19. `MacWrite`
20. `Oscilloscope`

This order starts with widgets whose current local state blocks the richest story scenarios and ends with widgets whose state is mostly visual or prop-driven.

## Design Decisions

### Decision 1: Use one reducer key per widget

**Why:** `collectModuleReducers()` rejects duplicate keys. A per-widget key avoids a shared-reducer bottleneck and lets each widget migrate independently.

### Decision 2: Redux is for durable state, not every hook

**Why:** Moving hover, drag ghosts, temporary form fields, or animation counters into Redux would add churn without adding observability.

### Decision 3: Keep reducer state normalized where the widget behaves like a document

For complex widgets (`KanbanBoard`, `SystemModeler`, `NodeEditor`, `MacCalendar`, `GameFinder`), normalize IDs and entities early. It makes selectors, updates, and Storybook seeding much cleaner.

### Decision 4: Prefer selectors that expose “story states”

Selectors should make common seeded scenarios easy:

```ts
selectVisibleKanbanTasks(state)
selectCurrentCalendarEvent(state)
selectCurrentTrack(state)
selectSelectedConversation(state)
```

If the selector is hard to name, the slice shape is probably still too UI-mechanical.

### Decision 5: Keep timers and DOM-only effects outside the slice

Playback timers, scrolling, canvas paints, and animation loops remain component effects. Redux should own state snapshots, not imperative browser work.

## Alternatives Considered

### A. Keep all widget state local and rely on `initial*` props forever

Rejected because it does not solve externally meaningful state, persistence, or launcher integration. It also breaks down for complex session state such as research progress, playlist/session state, or editable document models.

### B. Put all rich widget state under one giant `app_rich_widgets` reducer

Rejected for incremental migration. The launcher contract already wants distinct reducers. A giant root reducer would create coupling and sequencing pain for every new slice.

### C. Move everything into Redux, including transient UI controls

Rejected because it would create noisy reducers, excessive action churn, and unnecessary serialization pressure for drag/animation/canvas-heavy widgets.

## Implementation Plan

### Phase 1: Establish the reusable slice pattern

1. Add one reference slice for `LogViewer`.
2. Add selectors and seeded stories using `packages/rich-widgets/src/storybook/seededStore.tsx:1`.
3. Update `packages/rich-widgets/src/launcher/modules.tsx:80` to give `LogViewer` a dedicated `stateKey` such as `app_rw_log_viewer`.

### Phase 2: Migrate document-style widgets

Migrate:
- `KanbanBoard`
- `MacCalendar`
- `MacCalc`
- `NodeEditor`
- `SystemModeler`

These all have clear entity/document state and benefit immediately from normalized slices.

### Phase 3: Migrate session-style widgets

Migrate:
- `DeepResearch`
- `GameFinder`
- `RetroMusicPlayer`
- `StreamLauncher`
- `SteamLauncher`
- `YouTubeRetro`
- `ChatBrowser`

These are strong storybook and persistence wins because they have active session state and multiple UI modes.

### Phase 4: Re-evaluate partial candidates

After the first slices land, revisit:
- `GraphNavigator`
- `MacRepl`
- `LogicAnalyzer`
- `ControlRoom`

Only move them if we still need shared/persistent/seedable state beyond what local props and helper wrappers can provide.

### Representative slice pseudocode

```ts
// app_rw_game_finder
interface GameFinderSliceState {
  library: {
    gamesById: Record<string, Game>;
    gameOrder: string[];
  };
  ui: {
    view: 'library' | 'detail';
    selectedGameId: string | null;
    search: string;
    filter: GameFilter;
    sortBy: GameSort;
  };
  session: {
    installing: Record<string, 'idle' | 'pending' | 'done'>;
    launchingGameId: string | null;
  };
}
```

```ts
// app_rw_mac_calc
interface MacCalcSliceState {
  document: {
    cells: Record<string, CellData>;
    columnWidths: number[];
    clipboard: ClipboardData | null;
  };
  selection: {
    active: { r: number; c: number };
    range: CellRange | null;
  };
  ui: {
    showFind: boolean;
    findQuery: string;
    showPalette: boolean;
  };
}
```

```text
LaunchableAppModule.state
        |
        v
collectModuleReducers()
        |
        v
createLauncherStore()
        |
        v
store.app_rw_<widget>
   |              |
   |              +--> Storybook SeededStoreProvider
   |
   +--> selectors + dispatch hooks inside the widget
```

## Open Questions

1. Should `LogViewer` share data with engine diagnostics later, or remain an isolated app slice first?
2. Do we want a small `useRichWidgetSlice()` utility in the package once the first 3–4 slices exist?
3. Should `GraphNavigator` and `NodeEditor` share a generalized graph-document slice utility, or stay separate to preserve domain language?
4. Should the launcher register widget reducers directly from `RICH_WIDGET_MODULES`, or should a future `sharedReducers` path own package-level concerns?

## References

- Launcher contracts:
  - `packages/desktop-os/src/contracts/launchableAppModule.ts:9`
  - `packages/desktop-os/src/store/createLauncherStore.ts:14`
  - `packages/desktop-os/src/store/createLauncherStore.ts:71`
- Current rich-widget module wiring:
  - `packages/rich-widgets/src/launcher/modules.tsx:80`
  - `packages/rich-widgets/src/launcher/modules.tsx:190`
  - `packages/rich-widgets/src/launcher/richWidgetsLauncherState.ts:1`
- Storybook helpers:
  - `packages/rich-widgets/src/storybook/frameDecorators.tsx:1`
  - `packages/rich-widgets/src/storybook/seededStore.tsx:1`
- Prior analysis:
  - `ttmp/2026/03/05/OS-15-RICH-WIDGET-STORYBOOK-COVERAGE--rich-widget-storybook-coverage-redux-scenarios-and-cleanup-follow-through/design-doc/01-rich-widget-storybook-matrix-and-rollout-plan.md`
  - `ttmp/2026/03/01/OS-07-ADD-RICH-WIDGETS--import-and-integrate-rich-macos-widgets-into-frontend-collection/playbooks/01-widget-porting-playbook.md`
