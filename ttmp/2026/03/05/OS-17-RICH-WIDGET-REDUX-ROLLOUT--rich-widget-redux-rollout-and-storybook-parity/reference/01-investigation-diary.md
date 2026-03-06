---
Title: Redux rollout diary
Ticket: OS-17-RICH-WIDGET-REDUX-ROLLOUT
Status: active
Topics:
    - frontend
    - widgets
    - state-management
    - storybook
    - diary
DocType: reference
Intent: implementation-log
Owners: []
RelatedFiles:
    - packages/rich-widgets/src/log-viewer/LogViewer.tsx
    - packages/rich-widgets/src/log-viewer/logViewerState.ts
    - packages/rich-widgets/src/log-viewer/LogViewer.stories.tsx
    - packages/rich-widgets/src/launcher/modules.tsx
    - packages/rich-widgets/src/index.ts
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-05T20:00:00-05:00
WhatFor: ""
WhenToUse: ""
---

# Redux rollout diary

## 2026-03-05 — Task 1 (`LogViewer`)

### Goal

Start the execution phase from OS-16 by migrating the first rich widget in the recommended order:

- move durable `LogViewer` session state into a real Redux slice;
- keep the component usable outside a Redux provider;
- add store-seeded Storybook scenarios instead of only prop-seeded stories;
- preserve the current package-level launch-stat dispatch behavior until the package-level shared reducer path is cleaned up later.

### Files changed

- `packages/rich-widgets/src/log-viewer/logViewerState.ts`
- `packages/rich-widgets/src/log-viewer/logViewerState.test.ts`
- `packages/rich-widgets/src/log-viewer/LogViewer.tsx`
- `packages/rich-widgets/src/log-viewer/LogViewer.stories.tsx`
- `packages/rich-widgets/src/launcher/modules.tsx`
- `packages/rich-widgets/src/index.ts`

### Implementation notes

1. Added a dedicated `LogViewer` slice under `app_rw_log_viewer`.
2. Stored log timestamps as `timestampMs` instead of `Date` inside Redux state so the slice stays serialization-safe.
3. Split the widget into:
   - a shared render frame (`LogViewerFrame`);
   - a standalone/local-state wrapper for non-Redux consumers;
   - a connected wrapper for launcher and seeded stories.
4. Added seeded Storybook scenarios that use `SeededStoreProvider` and dispatch `replaceState(...)`.
5. Updated launcher registration so the `log-viewer` module now uses the dedicated widget state key instead of the old `app_rich_widgets` key.
6. Kept the old launcher analytics reducer alive by temporarily combining it with the new `viewer` reducer inside the `log-viewer` module reducer. This is an interim step until package-level `sharedReducers` are wired cleanly.
7. Fixed an existing UX bug while refactoring: clicking the log-level checkbox row no longer double-toggles because the `Checkbox` click path is now routed through the row click only.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
npm run typecheck -w packages/rich-widgets
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅
- `npm run typecheck -w packages/rich-widgets` ⚠️ fails for existing workspace-level `rootDir` / project-file-list issues in `packages/rich-widgets/tsconfig.json`; this is not introduced by the `LogViewer` change and reproduces across many existing cross-package imports.
- `remarquee upload bundle ...` ✅ uploaded `OS-17-RICH-WIDGET-REDUX-ROLLOUT.pdf` to `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT`

### Next task

Continue with `MacCalc`, which is next in the OS-16 migration order and also one of the largest remaining blockers for deterministic state-seeded stories.

## 2026-03-05 — Task 2 (`MacCalc`)

### Goal

Take the next durable widget in the rollout order and:

- move spreadsheet/session UI state into `app_rw_mac_calc`;
- preserve standalone package usage with a local fallback;
- replace local reducer callback-updater actions with serializable Redux actions;
- add seeded Storybook states for find, palette, and active editing scenarios;
- update the cleanup guides with the concrete lessons from the first two real migrations.

### Guide updates

Updated the primary guides in:

- `ttmp/2026/03/01/OS-07-ADD-RICH-WIDGETS--import-and-integrate-rich-macos-widgets-into-frontend-collection/playbooks/01-widget-porting-playbook.md`
- `ttmp/2026/03/05/OS-16-RICH-WIDGET-REDUX-SLICE-STUDY--rich-widget-redux-slice-study-migration-design-and-intern-guide/playbooks/01-rich-widget-redux-slice-implementation-guide-for-interns.md`

New explicit guidance added:

- slice payloads must stay serializable;
- `useReducer` updater-function actions must be rewritten before moving into Redux;
- connected widgets should keep a standalone fallback when they are package exports;
- Storybook seeded states should be treated as proof that the slice shape is right.

### Files changed

- `packages/rich-widgets/src/calculator/macCalcState.ts`
- `packages/rich-widgets/src/calculator/macCalcState.test.ts`
- `packages/rich-widgets/src/calculator/MacCalc.tsx`
- `packages/rich-widgets/src/calculator/MacCalc.stories.tsx`
- `packages/rich-widgets/src/launcher/modules.tsx`
- `packages/rich-widgets/src/index.ts`

### Implementation notes

1. Added `app_rw_mac_calc` and moved the spreadsheet state into a real RTK slice.
2. Kept the state shape close to the old reducer so the migration remained mechanical and reviewable.
3. Removed the old `UPDATE_CELLS` function-updater pattern and replaced it with explicit `setCells(nextCells)` writes computed before dispatch.
4. Kept `MacCalc` package-safe by using the same pattern as `LogViewer`: a connected path when the slice is registered, and a standalone local reducer fallback otherwise.
5. Added Redux-seeded stories for:
   - find results open,
   - command palette open,
   - active formula editing with a seeded selection.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅
- `remarquee upload bundle ... --force` ✅ refreshed `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT`

### Next task

Continue with `MacCalendar`.

## 2026-03-06 — Task 3 (`MacCalendar`)

### Goal

Migrate the calendar widget into `app_rw_mac_calendar`, preserve standalone usage, and add seeded Storybook scenarios for the states that were previously trapped in local `useState`.

### Files changed

- `packages/rich-widgets/src/calendar/macCalendarState.ts`
- `packages/rich-widgets/src/calendar/macCalendarState.test.ts`
- `packages/rich-widgets/src/calendar/MacCalendar.tsx`
- `packages/rich-widgets/src/calendar/MacCalendar.stories.tsx`
- `packages/rich-widgets/src/launcher/modules.tsx`
- `packages/rich-widgets/src/index.ts`

### Implementation notes

1. Added `app_rw_mac_calendar` with serialized event timestamps and persisted view/current-date/editor/palette state.
2. Kept the modal form draft local inside `EventModal`, but moved the editor-open state into Redux by storing either:
   - `editingEventId` for existing events, or
   - `draftDateMs` for new-event creation.
3. Preserved the package-export pattern used by the earlier migrations:
   - connected path when the slice is registered,
   - standalone local reducer fallback otherwise.
4. Added seeded calendar stories for:
   - modal open on an existing event,
   - command palette open,
   - a new-event draft opened on a seeded week/time slot.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅
- `remarquee upload bundle ... --force` ✅ refreshed `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT`

### Next task

Continue with `KanbanBoard`.

## 2026-03-06 — Task 4 (`KanbanBoard`)

### Goal

Move `KanbanBoard` into `app_rw_kanban`, preserve the standalone fallback path, and convert the Storybook coverage from prop-only setup to store-seeded workflow scenarios.

### Files changed

- `packages/rich-widgets/src/kanban/kanbanState.ts`
- `packages/rich-widgets/src/kanban/kanbanState.test.ts`
- `packages/rich-widgets/src/kanban/KanbanBoard.tsx`
- `packages/rich-widgets/src/kanban/KanbanBoard.stories.tsx`
- `packages/rich-widgets/src/launcher/modules.tsx`
- `packages/rich-widgets/src/index.ts`

### Implementation notes

1. Added `app_rw_kanban` with a serializable RTK slice for:
   - `tasks`
   - `columns`
   - `editingTask`
   - tag/priority/search filters
   - `collapsedCols`
2. Kept the drag-over column hint local because it is purely transient pointer state and does not need Redux persistence or story seeding.
3. Reworked `KanbanBoard` into the same export pattern used by the earlier rollout tasks:
   - standalone `useReducer` fallback when no slice is registered
   - connected Redux path when `app_rw_kanban` is present in the store
4. Replaced the old ad hoc local reducer actions with slice actions:
   - `upsertTask`
   - `deleteTask`
   - `moveTask`
   - `setEditingTask`
   - `setFilterTag`
   - `setFilterPriority`
   - `setSearchQuery`
   - `clearFilters`
   - `toggleCollapsed`
5. Converted the Storybook scenarios to seeded store-backed stories and added workflow-specific seeds for:
   - edit modal open on an existing task
   - urgent filtered/search state
   - collapsed workflow lanes with a priority filter
6. Wired launcher registration and public package exports to the new state key.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅
- Live Storybook verification on port `6006` ✅ for:
  - `richwidgets-kanbanboard--redux-editing-existing-task`
  - `richwidgets-kanbanboard--redux-collapsed-workflow`
- Playwright MCP only showed the existing Storybook/MSW asset warnings; no Kanban-specific runtime errors surfaced.

### Next task

Continue with `DeepResearch`.

## 2026-03-06 — Task 5 (`DeepResearch`)

### Goal

Move the durable research session state into `app_rw_deep_research`, preserve the standalone package-export path, and add Redux-seeded Storybook scenarios for in-progress and report-ready states.

### Files changed

- `packages/rich-widgets/src/deep-research/deepResearchState.ts`
- `packages/rich-widgets/src/deep-research/deepResearchState.test.ts`
- `packages/rich-widgets/src/deep-research/DeepResearch.tsx`
- `packages/rich-widgets/src/deep-research/DeepResearch.stories.tsx`
- `packages/rich-widgets/src/launcher/modules.tsx`
- `packages/rich-widgets/src/index.ts`

### Implementation notes

1. Added `app_rw_deep_research` with a serializable slice for:
   - `query`
   - `steps`
   - `progress`
   - `report`
   - `depthLevel`
   - `webSearch`
   - `academicOnly`
   - `isResearching`
   - `runRevision`
2. Kept the interval handle and scroll-to-bottom effect local, which matches the OS-16 guidance: timers and DOM refs stay outside Redux.
3. Added `runRevision` so Storybook can seed static “researching” states without automatically starting the interval loop on mount; actual interactive runs increment the revision and start the timer effect.
4. Reworked the widget into the same pattern as the previous rollout tasks:
   - connected Redux path when the slice is registered
   - standalone `useReducer` fallback otherwise
5. Converted the stories to seeded Redux scenarios and added explicit workflow cases for:
   - `ReduxResearching`
   - `ReduxReportReady`
6. Wired launcher registration and package exports to the new slice key.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅
- Live Storybook verification on port `6006` ✅ for:
  - `richwidgets-deepresearch--redux-researching`
  - `richwidgets-deepresearch--redux-report-ready`
- Playwright MCP only showed the existing Storybook/MSW asset warnings; no DeepResearch-specific runtime errors surfaced.

### Next task

Continue with `ChatBrowser`.

## 2026-03-06 — Task 6 (`ChatBrowser`)

### Goal

Move `ChatBrowser` browsing/filter/search state into `app_rw_chat_browser`, keep the standalone export path intact, and add Redux-seeded Storybook scenarios for the search panel and filtered result states.

### Files changed

- `packages/rich-widgets/src/chat-browser/chatBrowserState.ts`
- `packages/rich-widgets/src/chat-browser/chatBrowserState.test.ts`
- `packages/rich-widgets/src/chat-browser/ChatBrowser.tsx`
- `packages/rich-widgets/src/chat-browser/ChatBrowser.stories.tsx`
- `packages/rich-widgets/src/launcher/modules.tsx`
- `packages/rich-widgets/src/index.ts`

### Implementation notes

1. Added `app_rw_chat_browser` with a serializable slice for:
   - `selectedConversationId`
   - `quickFilter`
   - `searchParams`
   - `searchResultIds`
   - `showSearch`
   - the conversation list seed used by stories and standalone usage
2. Stored search results as conversation IDs instead of duplicated conversation objects so the slice shape stays deterministic and small.
3. Reworked the widget into the same connected/standalone pattern used across the rollout:
   - connected path when the slice is present
   - local `useReducer` fallback otherwise
4. Converted the Storybook matrix to store-backed states and added explicit scenarios for:
   - search panel open
   - filtered results
   - a seeded selected conversation
5. Wired launcher registration and package exports to the new slice key.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅
- Live Storybook verification on port `6006` ✅ for:
  - `richwidgets-chatbrowser--redux-search-panel`
  - `richwidgets-chatbrowser--redux-selected-conversation`
- Playwright MCP only showed the existing Storybook/MSW asset warnings; no ChatBrowser-specific runtime errors surfaced.

### Next task

Continue with `GameFinder`.

## 2026-03-06 — Task 7 (`GameFinder`)

### Goal

Move `GameFinder` library/detail/search/install state into `app_rw_game_finder`, keep standalone export usage intact, and add Redux-seeded Storybook scenarios for detail/install/filter states.

### Files changed

- `packages/rich-widgets/src/game-finder/gameFinderState.ts`
- `packages/rich-widgets/src/game-finder/gameFinderState.test.ts`
- `packages/rich-widgets/src/game-finder/GameFinder.tsx`
- `packages/rich-widgets/src/game-finder/GameFinder.stories.tsx`
- `packages/rich-widgets/src/launcher/modules.tsx`
- `packages/rich-widgets/src/index.ts`

### Implementation notes

1. Added `app_rw_game_finder` with a serializable slice for:
   - `games`
   - `view`
   - `selectedGameId`
   - `installingId`
   - `search`
   - `filter`
   - `sortBy`
   - `launchedGameId`
2. Kept the download bar animation progress local because it is transient timer-driven UI, while the install/launch session flags moved into Redux.
3. Reworked the widget into the same connected/standalone pattern used across OS-17.
4. Converted Storybook to store-backed states and added explicit scenarios for:
   - installed detail view
   - installing detail view
   - backlog-filtered library search
5. Wired launcher registration and public exports to the new slice key.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅
- Live Storybook verification on port `6006` ✅ for:
  - `richwidgets-gamefinder--redux-detail-installed`
  - `richwidgets-gamefinder--redux-installing`
- Playwright MCP only showed the existing Storybook/MSW asset warnings; no GameFinder-specific runtime errors surfaced.

### Next task

Continue with `RetroMusicPlayer`.

### Publication refresh

```bash
docmgr doctor --ticket OS-17-RICH-WIDGET-REDUX-ROLLOUT --stale-after 30
remarquee upload bundle \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/index.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/design/01-redux-rollout-backlog-and-sequencing.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/tasks.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/changelog.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/reference/01-investigation-diary.md \
  --name "OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task7" \
  --remote-dir "/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT" \
  --toc-depth 2 --non-interactive
remarquee cloud ls /ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT --long --non-interactive
```

- `docmgr doctor --ticket OS-17-RICH-WIDGET-REDUX-ROLLOUT --stale-after 30` ✅
- Updated bundle upload ✅
- Remote listing now shows:
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT`
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task4`

## 2026-03-06 — Task 9 (`StreamLauncher`)

### What changed

1. Added `packages/rich-widgets/src/stream-launcher/streamLauncherState.ts` with a dedicated `app_rw_stream_launcher` slice covering:
   - stream library seed data
   - category/search/sort state
   - active player selection
   - player progress, playing, volume, and chat visibility
2. Added reducer coverage in `packages/rich-widgets/src/stream-launcher/streamLauncherState.test.ts`.
3. Reworked `packages/rich-widgets/src/stream-launcher/StreamLauncher.tsx` into the connected/standalone pattern used across OS-17.
4. Converted `packages/rich-widgets/src/stream-launcher/StreamLauncher.stories.tsx` to Redux-seeded scenarios and added explicit stories for:
   - player-open playback state
   - search-filtered browse state
   - archive-only and empty-library browse states
5. Wired launcher registration and public exports to the new slice key.
6. Fixed an existing layout flaw discovered during live Storybook review by switching the widget root from flex-wrap layout to a grid layout so the shared status bar stops compressing the player area.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅
- Live Storybook verification on port `6006` ✅ for:
  - `richwidgets-streamlauncher--redux-player-open`
- Playwright MCP only showed the existing Storybook/MSW asset warnings after the layout fix; no `StreamLauncher`-specific runtime errors remained.

### Next task

Continue with `SteamLauncher`.

### Publication refresh

```bash
docmgr doctor --ticket OS-17-RICH-WIDGET-REDUX-ROLLOUT --stale-after 30
remarquee upload bundle \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/index.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/design/01-redux-rollout-backlog-and-sequencing.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/tasks.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/changelog.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/reference/01-investigation-diary.md \
  --name "OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task9" \
  --remote-dir "/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT" \
  --toc-depth 2 --non-interactive
remarquee cloud ls /ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT --long --non-interactive
```

## 2026-03-06 — Task 8 (`RetroMusicPlayer`)

### What changed

1. Added `packages/rich-widgets/src/music-player/musicPlayerState.ts` with a dedicated `app_rw_music_player` slice covering:
   - playback selection and elapsed state
   - playlist selection and search state
   - queue/EQ/view toggles
   - volume, shuffle, repeat, and liked-track state
2. Added reducer coverage in `packages/rich-widgets/src/music-player/musicPlayerState.test.ts`.
3. Reworked `packages/rich-widgets/src/music-player/RetroMusicPlayer.tsx` into the connected/standalone pattern used across OS-17, while keeping the EQ bar animation local.
4. Converted `packages/rich-widgets/src/music-player/RetroMusicPlayer.stories.tsx` to Redux-seeded scenarios and added explicit stories for:
   - active playback with queue open
   - grid-view browsing
   - playlist search results
5. Wired launcher registration and public exports to the new slice key.
6. Fixed one normalization gap discovered during validation by clamping seeded volume values in the slice seed path.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅
- Live Storybook verification on port `6006` ✅ for:
  - `richwidgets-retromusicplayer--redux-playing-queue`
- Playwright MCP only showed the existing Storybook/MSW asset warnings; no `RetroMusicPlayer`-specific runtime errors surfaced.

### Next task

Continue with `StreamLauncher`.

### Publication refresh

```bash
docmgr doctor --ticket OS-17-RICH-WIDGET-REDUX-ROLLOUT --stale-after 30
remarquee upload bundle \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/index.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/design/01-redux-rollout-backlog-and-sequencing.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/tasks.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/changelog.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/reference/01-investigation-diary.md \
  --name "OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task8" \
  --remote-dir "/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT" \
  --toc-depth 2 --non-interactive
remarquee cloud ls /ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT --long --non-interactive
```
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task5`
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task6`
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task7`

### Publication refresh

```bash
docmgr doctor --ticket OS-17-RICH-WIDGET-REDUX-ROLLOUT --stale-after 30
remarquee upload bundle \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/index.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/design/01-redux-rollout-backlog-and-sequencing.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/tasks.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/changelog.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/reference/01-investigation-diary.md \
  --name "OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task6" \
  --remote-dir "/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT" \
  --toc-depth 2 --non-interactive
remarquee cloud ls /ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT --long --non-interactive
```

- `docmgr doctor --ticket OS-17-RICH-WIDGET-REDUX-ROLLOUT --stale-after 30` ✅
- Updated bundle upload ✅
- Remote listing now shows:
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT`
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task4`
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task5`
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task6`

### Publication refresh

```bash
docmgr doctor --ticket OS-17-RICH-WIDGET-REDUX-ROLLOUT --stale-after 30
remarquee upload bundle \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/index.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/design/01-redux-rollout-backlog-and-sequencing.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/tasks.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/changelog.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/reference/01-investigation-diary.md \
  --name "OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task5" \
  --remote-dir "/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT" \
  --toc-depth 2 --non-interactive
remarquee cloud ls /ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT --long --non-interactive
```

- `docmgr doctor --ticket OS-17-RICH-WIDGET-REDUX-ROLLOUT --stale-after 30` ✅
- Updated bundle upload ✅
- Remote listing now shows:
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT`
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task4`
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task5`

### Publication refresh

```bash
docmgr doctor --ticket OS-17-RICH-WIDGET-REDUX-ROLLOUT --stale-after 30
remarquee upload bundle \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/index.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/design/01-redux-rollout-backlog-and-sequencing.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/tasks.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/changelog.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/reference/01-investigation-diary.md \
  --name "OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task4" \
  --remote-dir "/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT" \
  --toc-depth 2 --non-interactive
remarquee cloud ls /ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT --long --non-interactive
```

- `docmgr doctor --ticket OS-17-RICH-WIDGET-REDUX-ROLLOUT --stale-after 30` ✅
- Updated bundle upload ✅
- Remote listing now shows:
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT`
  - `/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT/OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task4`

## 2026-03-06 — Task 10 (`SteamLauncher`)

### What changed

1. Added `packages/rich-widgets/src/steam-launcher/steamLauncherState.ts` with a dedicated `app_rw_steam_launcher` slice covering:
   - game library and friend-list seed data
   - selected game, tab, filter, and search state
   - install-in-progress and launch-overlay state
   - friend-panel visibility
2. Added reducer coverage in `packages/rich-widgets/src/steam-launcher/steamLauncherState.test.ts`.
3. Reworked `packages/rich-widgets/src/steam-launcher/SteamLauncher.tsx` into the connected/standalone pattern used across OS-17.
4. Converted `packages/rich-widgets/src/steam-launcher/SteamLauncher.stories.tsx` to Redux-seeded scenarios and added explicit stories for:
   - install/download state
   - launch-overlay state
   - installed-only, offline-friends, and empty-library states
5. Wired launcher registration and public exports to the new slice key.
6. Fixed an existing behavior bug during the migration: completed installs now actually mark the game as installed instead of returning to the same uninstalled state.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅
- Live Storybook verification on port `6006` ✅ for:
  - `richwidgets-steamlauncher--redux-installing`
- Playwright MCP only showed the existing Storybook/MSW asset warnings; no `SteamLauncher`-specific runtime errors surfaced.

### Next task

Continue with `YouTubeRetro`.

### Publication refresh

```bash
docmgr doctor --ticket OS-17-RICH-WIDGET-REDUX-ROLLOUT --stale-after 30
remarquee upload bundle \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/index.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/design/01-redux-rollout-backlog-and-sequencing.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/tasks.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/changelog.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/reference/01-investigation-diary.md \
  --name "OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task10" \
  --remote-dir "/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT" \
  --toc-depth 2 --non-interactive
remarquee cloud ls /ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT --long --non-interactive
```

## 2026-03-06 — Task 11 (`YouTubeRetro`)

### What changed

1. Added `packages/rich-widgets/src/youtube-retro/youTubeRetroState.ts` with a dedicated `app_rw_youtube_retro` slice covering:
   - feed videos and current watch selection
   - playback state and elapsed time
   - category/search state
   - subscription, liked-video, and user-comment state
2. Added reducer coverage in `packages/rich-widgets/src/youtube-retro/youTubeRetroState.test.ts`.
3. Split the widget subcomponents into their own files:
   - `packages/rich-widgets/src/youtube-retro/VideoPlayer.tsx`
   - `packages/rich-widgets/src/youtube-retro/VideoCard.tsx`
   - `packages/rich-widgets/src/youtube-retro/CommentItem.tsx`
4. Reworked `packages/rich-widgets/src/youtube-retro/YouTubeRetro.tsx` into the connected/standalone pattern used across OS-17 while keeping the CRT scanline animation local to the player component.
5. Converted `packages/rich-widgets/src/youtube-retro/YouTubeRetro.stories.tsx` to Redux-seeded scenarios and added explicit stories for:
   - watch-mode playback state
   - search-filtered results
   - reduced and empty feeds
6. Wired launcher registration and public exports to the new slice key.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅
- Live Storybook verification on port `6006` ✅ for:
  - `richwidgets-youtuberetro--redux-watch-state`
- Playwright MCP only showed the existing Storybook/MSW asset warnings; no `YouTubeRetro`-specific runtime errors surfaced.

### Next task

Continue with `NodeEditor`.

### Publication refresh

```bash
docmgr doctor --ticket OS-17-RICH-WIDGET-REDUX-ROLLOUT --stale-after 30
remarquee upload bundle \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/index.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/design/01-redux-rollout-backlog-and-sequencing.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/tasks.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/changelog.md \
  ttmp/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT--rich-widget-redux-rollout-and-storybook-parity/reference/01-investigation-diary.md \
  --name "OS-17-RICH-WIDGET-REDUX-ROLLOUT-2026-03-06-task11" \
  --remote-dir "/ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT" \
  --toc-depth 2 --non-interactive
remarquee cloud ls /ai/2026/03/05/OS-17-RICH-WIDGET-REDUX-ROLLOUT --long --non-interactive
```
