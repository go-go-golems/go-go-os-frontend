---
Title: Investigation diary
Ticket: OS-15-RICH-WIDGET-STORYBOOK-COVERAGE
Status: active
Topics:
    - frontend
    - widgets
    - storybook
    - state-management
    - architecture
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-05T19:58:56.469322964-05:00
WhatFor: ""
WhenToUse: ""
---

# Investigation Diary

## Goal

Track the Storybook coverage follow-up for all rich widgets, including the audit that defines missing story states, the task-by-task rollout, and the commits used to expand coverage.

## Step 1: Create the Storybook follow-up ticket and audit baseline coverage

I created a dedicated OS-15 ticket so the Storybook work can proceed as its own cleanup stream rather than being buried inside the earlier import and cleanup tickets. The immediate goal was to avoid starting ad hoc story edits before we had a complete per-widget inventory.

I then audited the current story files in `packages/rich-widgets/src` and captured the actual exported story names for every composite widget. That gave a concrete baseline for the design doc and task list, and it showed the current pattern clearly: almost every widget has baseline coverage, but most are missing domain-specific state stories.

### Prompt Context

**User prompt (verbatim):** "yes create a new ticket and analyze for each widget (don't forget any) creat a set of stories. \n\nThen create tasks to actually do it, and go through each widget task by task and checking things off as you go, adding stories and keeping a detailed diary.\n\nCommit appropriately"

**Assistant interpretation:** Create a dedicated ticket for Storybook expansion, perform a full widget-by-widget analysis, write tasks from that analysis, and then begin implementing the story work with diary + commit discipline.

**Inferred user intent:** Turn the unfinished guide into an execution ticket with complete widget coverage and visible implementation progress.

### What I did
- Created ticket `OS-15-RICH-WIDGET-STORYBOOK-COVERAGE`.
- Added ticket documents:
  - `design-doc/01-rich-widget-storybook-matrix-and-rollout-plan.md`
  - `reference/01-investigation-diary.md`
- Added ticket-local audit script:
  - `scripts/audit-story-exports.mjs`
- Ran the audit script to list current story exports for all rich widgets.
- Wrote the initial design doc with:
  - current story coverage,
  - target additions for each widget,
  - rollout order,
  - shared harness work.
- Replaced placeholder tasks with shared-harness, per-widget, and follow-through tasks.

### Why
- The ticket needs a complete inventory first; otherwise the later story work will drift and some widgets will get skipped.
- The audit script makes the coverage baseline reproducible.

### What worked
- The ticket workspace creation and document scaffolding were straightforward with `docmgr`.
- The audit showed all 20 widget story files cleanly and exposed the current story-export counts with no manual bookkeeping.

### What didn't work
- N/A

### What I learned
- The package already has one story file per composite widget, so the problem is not missing story files; it is shallow coverage depth.
- A dedicated ticket-local audit script is worthwhile because this matrix will need to be rerun as tasks are completed.

### What was tricky to build
- The main risk was accidentally mixing composite widgets with launcher/primitives/theme directories. The audit script explicitly ignores `launcher`, `primitives`, and `theme` so the matrix only covers the actual widget tasks the user asked for.

### What warrants a second pair of eyes
- The exact target additions per widget are still a planning artifact; they should be revised if implementation uncovers better state boundaries or if Redux slices land earlier than expected.

### What should be done in the future
- Start implementation with the shared Storybook harness work, then take widgets in the rollout order from the design doc.

### Code review instructions
- Start with:
  - `ttmp/2026/03/05/OS-15-RICH-WIDGET-STORYBOOK-COVERAGE--rich-widget-storybook-coverage-redux-scenarios-and-cleanup-follow-through/design-doc/01-rich-widget-storybook-matrix-and-rollout-plan.md`
  - `ttmp/2026/03/05/OS-15-RICH-WIDGET-STORYBOOK-COVERAGE--rich-widget-storybook-coverage-redux-scenarios-and-cleanup-follow-through/tasks.md`
  - `ttmp/2026/03/05/OS-15-RICH-WIDGET-STORYBOOK-COVERAGE--rich-widget-storybook-coverage-redux-scenarios-and-cleanup-follow-through/scripts/audit-story-exports.mjs`
- Validate with:
  - `node ttmp/2026/03/05/OS-15-RICH-WIDGET-STORYBOOK-COVERAGE--rich-widget-storybook-coverage-redux-scenarios-and-cleanup-follow-through/scripts/audit-story-exports.mjs`

### Technical details
- Key commands:
  - `docmgr ticket create-ticket --ticket OS-15-RICH-WIDGET-STORYBOOK-COVERAGE --title "Rich widget Storybook coverage, Redux scenarios, and cleanup follow-through" --topics frontend,widgets,storybook,redux,architecture`
  - `docmgr doc add --ticket OS-15-RICH-WIDGET-STORYBOOK-COVERAGE --doc-type design-doc --title "Rich widget Storybook matrix and rollout plan"`
  - `docmgr doc add --ticket OS-15-RICH-WIDGET-STORYBOOK-COVERAGE --doc-type reference --title "Investigation diary"`
  - `node ttmp/2026/03/05/OS-15-RICH-WIDGET-STORYBOOK-COVERAGE--rich-widget-storybook-coverage-redux-scenarios-and-cleanup-follow-through/scripts/audit-story-exports.mjs`

## Step 2: Add shared frame helpers and expand all widget story files

I moved from planning into implementation by first removing the repeated frame boilerplate from the widget stories. The codebase had the same ad hoc wrappers repeated across almost every story file (`height: 100vh`, fixed-width/fixed-height shells, and mixed Storybook title namespaces). I added a small Storybook-only helper module and then rewrote every composite widget story file against that shared framing pattern.

After the helper landed, I expanded all 20 composite widget story files. The implementation stayed intentionally pragmatic: where the widget already exposed useful seed props, I added richer fixture states directly; where the widget still hides important state internally, I added the best prop-driven stories available and documented that the missing states are evidence for Redux-backed seeding or explicit story seed props.

### Prompt Context

**User prompt (verbatim):** "yes create a new ticket and analyze for each widget (don't forget any) creat a set of stories. \n\nThen create tasks to actually do it, and go through each widget task by task and checking things off as you go, adding stories and keeping a detailed diary.\n\nCommit appropriately"

**Assistant interpretation:** Implement the story rollout, not just the ticket scaffolding, and keep the work traceable with task checkoffs, diary entries, and commits.

**Inferred user intent:** Use Storybook coverage as the next concrete cleanup step toward Redux adoption and richer widget modularization.

### What I did
- Added `packages/rich-widgets/src/storybook/frameDecorators.tsx`.
- Updated all 20 composite widget story files:
  - `packages/rich-widgets/src/calculator/MacCalc.stories.tsx`
  - `packages/rich-widgets/src/calendar/MacCalendar.stories.tsx`
  - `packages/rich-widgets/src/chart-view/ChartView.stories.tsx`
  - `packages/rich-widgets/src/chat-browser/ChatBrowser.stories.tsx`
  - `packages/rich-widgets/src/control-room/ControlRoom.stories.tsx`
  - `packages/rich-widgets/src/deep-research/DeepResearch.stories.tsx`
  - `packages/rich-widgets/src/game-finder/GameFinder.stories.tsx`
  - `packages/rich-widgets/src/graph-navigator/GraphNavigator.stories.tsx`
  - `packages/rich-widgets/src/kanban/KanbanBoard.stories.tsx`
  - `packages/rich-widgets/src/log-viewer/LogViewer.stories.tsx`
  - `packages/rich-widgets/src/logic-analyzer/LogicAnalyzer.stories.tsx`
  - `packages/rich-widgets/src/mac-write/MacWrite.stories.tsx`
  - `packages/rich-widgets/src/music-player/RetroMusicPlayer.stories.tsx`
  - `packages/rich-widgets/src/node-editor/NodeEditor.stories.tsx`
  - `packages/rich-widgets/src/oscilloscope/Oscilloscope.stories.tsx`
  - `packages/rich-widgets/src/repl/MacRepl.stories.tsx`
  - `packages/rich-widgets/src/steam-launcher/SteamLauncher.stories.tsx`
  - `packages/rich-widgets/src/stream-launcher/StreamLauncher.stories.tsx`
  - `packages/rich-widgets/src/system-modeler/SystemModeler.stories.tsx`
  - `packages/rich-widgets/src/youtube-retro/YouTubeRetro.stories.tsx`
- Added richer scenarios per widget: dense datasets, empty states, filtered subsets, compact windows, single-item views, and domain-specific content variants.
- Normalized the remaining inconsistent Storybook titles from `Rich Widgets/...` to `RichWidgets/...`.
- Re-ran the audit to capture the new matrix.
- Recorded which widgets still want Redux-backed seed state next.

### Why
- The helper removes repeated story-shell noise and makes future widget stories mechanical instead of custom.
- The expanded story matrix is the concrete basis for the next Redux/seed-state pass.
- The implementation needed to cover every widget in this ticket, not just a first trio.

### What worked
- The frame helper kept the story rewrites simple and consistent.
- Most widgets already exposed enough seed props to support richer deterministic stories without changing runtime component code.
- The ticket-local audit script made it easy to verify that every widget file actually gained coverage.

### What didn't work
- `npm run typecheck -w packages/rich-widgets` still fails for reasons outside this story pass:
  - `packages/engine` files are pulled into the rich-widgets build with `rootDir`/project-list mismatches.
  - `src/launcher/modules.tsx` still cannot resolve `@hypercard/desktop-os`.
  - `src/oscilloscope/Oscilloscope.tsx` still has pre-existing setter-signature errors.
- Those failures are useful baseline data, but they are not regressions caused by the story changes.

### What I learned
- Story work is already enough to separate widgets into two buckets:
  - widgets that can represent meaningful scenarios with fixture props today;
  - widgets that still need Redux-backed seed state or dedicated seed props.
- The strongest Redux pressure is not uniform. It clusters around navigation-heavy widgets with internal selection/search/modal state rather than pure render widgets.

### What was tricky to build
- Several target states from the original plan (palette-open, selected row, modal-open, watch-mode, install-in-progress) cannot be represented cleanly yet because the components keep those states fully internal.
- I avoided fake DOM-click setup wrappers because those would obscure the real gap. The ticket should record that those states need first-class seeding, not brittle story hacks.

### What warrants a second pair of eyes
- The Redux-candidate list in the design doc should be sanity-checked before we start the next pass, because that list effectively defines the order of the upcoming state work.
- Some “empty” stories depend on runtime widgets tolerating zero data gracefully. The current implementations appear safe in Storybook taxonomy/test coverage, but those states are worth manually viewing in the browser during the next pass.

### What should be done in the future
- Add a seeded-story wrapper layer for widgets that need local-state setup before Redux lands.
- Prioritize Redux-backed scenario seeding for `MacCalc`, `MacCalendar`, `KanbanBoard`, `GameFinder`, `RetroMusicPlayer`, `StreamLauncher`, `SteamLauncher`, `YouTubeRetro`, and `ChatBrowser`.
- Update the OS-07 playbook after the seeded-story / Redux direction is finalized.

### Code review instructions
- Start with the new shared helper:
  - `packages/rich-widgets/src/storybook/frameDecorators.tsx`
- Then review one representative story file from each cluster:
  - data-heavy: `packages/rich-widgets/src/log-viewer/LogViewer.stories.tsx`
  - editor-style: `packages/rich-widgets/src/calculator/MacCalc.stories.tsx`
  - browser/search-heavy: `packages/rich-widgets/src/chat-browser/ChatBrowser.stories.tsx`
  - media/library-style: `packages/rich-widgets/src/steam-launcher/SteamLauncher.stories.tsx`
  - canvas/modeling: `packages/rich-widgets/src/node-editor/NodeEditor.stories.tsx`
- Validate with:
  - `node ttmp/2026/03/05/OS-15-RICH-WIDGET-STORYBOOK-COVERAGE--rich-widget-storybook-coverage-redux-scenarios-and-cleanup-follow-through/scripts/audit-story-exports.mjs`
  - `npm run storybook:check`
  - `npm run test -w packages/rich-widgets`

### Technical details
- Story count moved from 79 to 128 exported widget stories.
- Representative commands:
  - `node ttmp/2026/03/05/OS-15-RICH-WIDGET-STORYBOOK-COVERAGE--rich-widget-storybook-coverage-redux-scenarios-and-cleanup-follow-through/scripts/audit-story-exports.mjs`
  - `npm run storybook:check`
  - `npm run test -w packages/rich-widgets`
  - `npm run typecheck -w packages/rich-widgets`
- Code commit for the story sweep:
  - `b59b3cc feat(rich-widgets): expand story coverage across widgets`

## Step 3: Add the reusable seeded-store pattern and close the follow-through task

The first story sweep still left one important harness gap: the package had a Redux-backed story pattern only inside `RichWidgetsDesktop.stories.tsx`, and that logic was trapped inside the story file. I extracted that pattern into a shared helper so future widget slices can use the same seeded-store story path instead of rewriting provider/store setup each time.

I added `packages/rich-widgets/src/storybook/seededStore.tsx` with two pieces:
- `SeededStoreProvider` to create a store once per story render and optionally seed it before the component tree mounts
- `composeSeedStores` to combine multiple seed functions into a single scenario

I then refactored `packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx` to use the shared helper and added `SeedAnalysisSuite` as an example seeded-store scenario. After that, I updated the OS-07 playbook so the porting guidance now reflects the actual story workflow we want: prop stories first, seeded wrappers next, Redux slices only when the state is durable or externally meaningful.

### What I did
- Added `packages/rich-widgets/src/storybook/seededStore.tsx`.
- Refactored `packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx` to use the shared provider helper.
- Added the `SeedAnalysisSuite` launcher story to demonstrate composed seed functions.
- Updated `ttmp/2026/03/01/OS-07-ADD-RICH-WIDGETS--import-and-integrate-rich-macos-widgets-into-frontend-collection/playbooks/01-widget-porting-playbook.md`.
- Closed the remaining OS-15 shared-harness and playbook follow-through tasks.

### Why
- The story sweep needed a reusable Redux-backed seeding path before the next state-migration ticket starts.
- The OS-07 playbook needed to stop recommending blanket Redux usage and start recommending the Storybook-first state decision ladder we actually want.

### What worked
- The launcher desktop integration story was the right extraction point because it already had real seeded-store scenarios.
- `composeSeedStores` is simple enough to be reusable without locking us into a heavyweight story DSL.

### What didn't work
- No new failures in this step. I reused the existing validation set and did not re-run the known-bad package typecheck.

### Technical details
- Validation:
  - `npm run storybook:check`
  - `npm run test -w packages/rich-widgets`
- Pending commit for this step:
  - shared seeded-store helper + OS-07/OS-15 doc updates
