---
Title: Investigation diary
Ticket: OS-08-CLEANUP-RICH-WIDGETS
Status: active
Topics:
    - frontend
    - widgets
    - refactoring
    - architecture
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/rich-widgets/src/index.ts:Main barrel export for all widgets
    - Path: packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx
      Note: |-
        Storybook run and Redux coverage evidence
        Task 2 Redux-seeded Storybook scenarios (commit 0a57c34b118824e70d02c8d3db90c54b0d3f2b9d)
    - Path: packages/rich-widgets/src/launcher/modules.tsx
      Note: Task 1 wiring across module launch paths (commit 6c766dad9bb19cb31c96984ce6da1b59e9a8bddc)
    - Path: packages/rich-widgets/src/launcher/richWidgetsLauncherState.test.ts
      Note: Task 1 verification (commit 6c766dad9bb19cb31c96984ce6da1b59e9a8bddc)
    - Path: packages/rich-widgets/src/launcher/richWidgetsLauncherState.ts
      Note: Task 1 reducer implementation (commit 6c766dad9bb19cb31c96984ce6da1b59e9a8bddc)
    - Path: packages/rich-widgets/src/parts.ts
      Note: Dead part constants audit script input
    - Path: packages/rich-widgets/src/parts.ts:Data-part constants registry
    - Path: packages/rich-widgets/src/theme/index.ts:CSS theme barrel import
    - Path: packages/rich-widgets/src/theme/log-viewer.css
      Note: Legacy selector residue evidence
    - Path: ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/design-doc/03-independent-review-redux-usage-storybook-state-simulation-modularization-and-css-duplication.md
      Note: Step 4 independent review outcomes
ExternalSources: []
Summary: Chronological record of the cleanup analysis investigation for OS-08
LastUpdated: 2026-03-02T23:30:00-05:00
WhatFor: ""
WhenToUse: ""
---




# Investigation Diary — OS-08-CLEANUP-RICH-WIDGETS

## Step 1: Scope and approach (2026-03-02)

### Goal

Analyze all 20 rich widgets in `packages/rich-widgets/src/` for cleanup opportunities:
- Extractable primitives that appear across multiple widgets
- State management patterns (useState vs Redux vs useReducer)
- Code duplication (toolbar/statusbar/modal/search patterns)
- Canvas usage patterns
- Engine component integration gaps
- CSS naming consistency

### Approach

Launched 5 parallel research agents:
1. Group 1: LogViewer, ChartView, MacWrite, KanbanBoard, MacRepl
2. Group 2: NodeEditor, Oscilloscope, LogicAnalyzer, Calendar, GraphNavigator
3. Group 3: MacCalc, DeepResearch, GameFinder, RetroMusicPlayer, StreamLauncher
4. Group 4: SteamLauncher, YouTubeRetro, ChatBrowser, SystemModeler, ControlRoom
5. Cross-cutting: Pattern analysis, useState audit, engine usage, duplication detection

### Widget inventory

20 widgets total across these directories:
- `log-viewer/`, `chart-view/`, `mac-write/`, `kanban/`, `repl/`
- `node-editor/`, `oscilloscope/`, `logic-analyzer/`, `calendar/`, `graph-navigator/`
- `calculator/`, `deep-research/`, `game-finder/`, `music-player/`, `stream-launcher/`
- `steam-launcher/`, `youtube-retro/`, `chat-browser/`, `system-modeler/`, `control-room/`
- Plus `primitives/` (Sparkline only)

Awaiting agent results before writing conclusions.

## Step 2: Agent results and synthesis (2026-03-02)

### What happened

All 5 research agents completed successfully. Collected detailed analysis for all 20 widgets plus cross-cutting patterns.

### Key findings

**Duplication scale:**
- 12 widgets share near-identical toolbar CSS (flex row, gap, border-bottom, background)
- 14 widgets share near-identical status bar CSS
- 10 widgets share sidebar layout CSS
- 6 widgets hand-roll progress bars
- 7 widgets hand-roll empty states
- 3 widgets hand-roll radio buttons instead of using engine RadioButton
- 9 widgets have search/filter inputs

**Structural twins identified:**
- Oscilloscope ↔ LogicAnalyzer: identical animation loop, identical slider component (OscSlider at lines 33-68 = LaSlider at lines 43-78), same CRT bezel, same CSS structure
- GameFinder ↔ StreamLauncher: same sidebar+list+detail layout, same canvas pixel art utilities, same hand-rolled radio buttons

**Bugs found:**
- `new Function()` in MacRepl.tsx:202,248 and formula.ts:146,178
- Module-level mutable state in KanbanBoard.tsx:9, calendar/types.ts:53, SystemModeler.tsx:18
- `useMemo` with `Math.random()` in YouTubeRetro.tsx:217
- Dead state in DeepResearch.tsx:70-71 (webSearch, academicOnly never consumed by logic)
- GraphNavigator force simulation never stops (no velocity threshold)
- No devicePixelRatio in Oscilloscope and LogicAnalyzer canvas

**State management:** All 20 widgets use React useState exclusively. Zero Redux. Total 213 useState calls.

### What worked

- Parallel agent strategy was very effective — 5 agents analyzing 4 widgets each completed in ~5 minutes
- Cross-cutting agent provided excellent summary tables with exact line references
- Verification agent confirmed line numbers and caught corrections (MacCalendar nextId is in types.ts not the main file)

### What didn't work

- Initial assumption that MacCalc used `new Function()` directly — it's in the imported formula.ts module
- Initial assumption that MacCalendar had module-level state in the main file — it's in types.ts

### Report written

Synthesized all agent results into the design doc at:
`design-doc/01-rich-widgets-cleanup-report-widget-by-widget-analysis.md`

Report contains:
1. Executive summary
2. Problem statement with widget inventory table
3. Current architecture (package structure, state management, engine usage, CSS theming)
4. Widget-by-widget analysis (all 20 widgets with issues, extractable patterns, cleanup priority)
5. Cross-cutting analysis (extractable primitives, state audit, engine gaps, CSS naming, structural twins)
6. Bug inventory with file:line references
7. 6-phase implementation plan (bug fixes → primitives → specialized primitives → engine adoption → naming → state)
8. Testing and validation strategy
9. Risks and alternatives
10. Open questions
11. References with priority-ordered file list

### Code review instructions

When reviewing the design doc, verify:
- Bug line numbers match current source (confirmed via verification agent)
- useState counts match (confirmed via cross-cutting agent grep)
- CSS duplication claims can be verified by diffing any two toolbar/statusbar CSS rules
- Structural twin claims can be verified by comparing OscSlider and LaSlider source

## Step 3: Post-cleanup code review (2026-03-02)

### Goal

After completing all 6 implementation phases (OS-09 through OS-14), perform a fresh review to assess:
1. useReducer adoption completeness across all widgets
2. Widget modularity — are any too large or monolithic?
3. General code quality — CSS theming, primitive adoption, dead code, TypeScript errors

### What happened

Launched 5 parallel audit agents:

1. **Widget sizes/modularity** — Ranked all widgets by line count and component count
2. **State management** — Audited useReducer adoption, identified remaining candidates
3. **CSS theming** — Scanned for standalone hex colors, inline styles, inconsistent fallbacks
4. **Code quality** — Checked TS errors, `any` types, bare timeouts, React.memo usage
5. **Primitive adoption** — Measured how many widgets actually use the shared primitives

### Key findings

**Widget size (top 5 by line count):**

| Widget | Lines | Components | Issue |
|--------|-------|------------|-------|
| MacCalc | 1098 | 2 | Only FindBar extracted |
| GraphNavigator | 717 | 1 | Monolithic, 9 useRef |
| MacCalendar | 694 | 2 | 35 inline styles |
| KanbanBoard | 637 | 2 | Reasonable after useReducer |
| LogViewer | 539 | 1 | Monolithic |

5 monolithic widgets (single component, 400+ lines): LogViewer, LogicAnalyzer, MacRepl, MacWrite, Oscilloscope.

Best-structured widgets: SteamLauncher (9 components), instruments.tsx (9), SystemModeler (7), GameFinder (6).

**State management gaps:**

3 widgets now use useReducer (KanbanBoard, RetroMusicPlayer, MacCalc). 6 remaining candidates prioritized:
1. YouTubeRetro (13 useState, `openVideo()` fires 6 setters)
2. MacRepl (11 useState, `handleSubmit` fires 6 setters)
3. SystemModeler (11 useState, `deleteSelected` updates 3 states)
4. Oscilloscope (15 useState — but all independent, low benefit)
5. LogicAnalyzer (12 useState, "Defaults" resets 4)
6. NodeEditor (9 useState, implicit state machine)

**Primitive adoption gaps:**
- ButtonGroup: 0/20 adoption despite 4+ candidates (MacCalendar, MacCalc, GameFinder, KanbanBoard)
- SearchBar: 1/6 eligible (only StreamLauncher uses it)
- DeepResearch defines a local shadow ProgressBar instead of importing the shared one
- GraphNavigator uses raw rAF instead of useAnimationLoop
- RetroMusicPlayer has bare `type="range"` instead of LabeledSlider

**CSS theming violations:**
- system-modeler.css: 14 standalone hex values
- youtube-retro.css: 8 standalone hex values
- logic-analyzer.css: 3 standalone hex values
- `--hc-color-row-odd` has 11 different fallback values across files
- 72 of 677 data-part constants (10.6%) are defined in parts.ts but never used

**Code quality:**
- 9 TypeScript errors (4 Oscilloscope Checkbox onChange, 3 launcher path alias, 2 ButtonGroup rootDir)
- Zero `any` types, zero TODO/FIXME, zero console.log — clean
- Zero React.memo usage (performance gap for complex widgets)
- 6 bare setTimeout calls without cleanup (SteamLauncher 2, MacWrite 4)
- Zero error boundaries

### What worked

- Parallel audit agents covered different dimensions efficiently
- Evidence-anchored approach (exact file:line citations) made the report actionable
- Categorizing findings by severity (must-fix vs nice-to-have) keeps the report practical

### What didn't work

- Initial assumption that "use redux everywhere" meant literal Redux — the user meant useReducer pattern, which was already the approach taken in Phase 6

### Report written

Synthesized all audit results into the second design doc at:
`design-doc/02-post-cleanup-code-review-modularity-state-management-and-code-quality.md`

Report contains:
1. Executive summary
2. Widget size/modularity analysis with rankings
3. State management audit with useReducer priority candidates
4. Primitive adoption gap analysis
5. CSS theming issues (hex colors, fallback inconsistency, inline styles, dead parts)
6. Code quality findings (TS errors, performance, hygiene)
7. Recommended next steps in 6 phases (A through F)
8. Complete reference tables

### Code review instructions

When reviewing the post-cleanup design doc, verify:
- Widget line counts match current source (after all Phase 1-6 changes)
- useReducer adoption counts are accurate (3 converted, 2 skipped, 6 remaining candidates)
- Standalone hex color counts can be verified with `rg '#[0-9a-fA-F]{3,6}' <css-file>`
- Dead data-part count can be verified by diffing parts.ts exports against grep results in TSX files

## Step 4: Independent OS-07/OS-08 re-review with Storybook run (2026-03-03)

I re-ran the audit directly from code to validate the four concerns in the user prompt, instead of relying on prior OS-08 conclusions. The goal was to produce an independent call on Redux usage, Storybook state simulation, modularity, and CSS duplication.

I also launched Storybook and inspected the rich-widget stories live (including Desktop Integration) to confirm runtime behavior and taxonomy from the running UI, not only static source reads.

### Prompt Context

**User prompt (verbatim):** "Go over OS-08-CLEANUP-RICH-WIDGETS and OS-07 and analyze the rich widgets for the following issues: 

 - not using redux but instead using other state mechanism
 - not using redux in the storybook to simulate different situations (like the other tests do) 
 - being too big / have not been modularized properly
 - wrong or duplicated CSS

I know our colleague already took multiple stabs, let's review ourselves. 

Store the result of your analysis in OS-08 and upload to remarkable.

You can run storybook and such if you want."

**Assistant interpretation:** Re-audit current rich-widget implementation against OS-07/OS-08 expectations, validate findings with live Storybook + source evidence, write a new OS-08 design doc, then publish to reMarkable.

**Inferred user intent:** Get a fresh, independent quality review (not inherited conclusions) and a documented, shareable artifact in the existing OS-08 ticket workflow.

### What I did
- Reviewed OS-07 design intent and OS-08 prior reports:
  - `ttmp/2026/03/01/OS-07-ADD-RICH-WIDGETS--import-and-integrate-rich-macos-widgets-into-frontend-collection/design-doc/01-rich-widget-import-analysis-and-integration-plan.md`
  - `ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/design-doc/01-rich-widgets-cleanup-report-widget-by-widget-analysis.md`
  - `ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/design-doc/02-post-cleanup-code-review-modularity-state-management-and-code-quality.md`
- Started Storybook in tmux and inspected rich-widget stories:
  - first attempt: `npm run storybook -- --host 127.0.0.1 --port 6006` (port conflict prompt)
  - second attempt: `npm run storybook -- --ci --host 127.0.0.1 --port 6008`
  - inspected `Rich Widgets / Desktop Integration - All Widgets` in browser automation.
- Ran supporting audits:
  - Redux import search across non-story rich-widget code
  - story file count vs Redux-backed story file count
  - widget LOC/state-hook counts
  - dead `RICH_PARTS` key detection vs actual usage
  - dead part selectors still present in CSS
  - hard-coded hex scans in theme files
- Added a new design doc via docmgr:
  - `design-doc/03-independent-review-redux-usage-storybook-state-simulation-modularization-and-css-duplication.md`
- Filled the document with findings, rationale, and an implementation plan.

### Why
- The user explicitly requested an independent review after multiple prior attempts.
- Prior docs contained strong claims, but fresh validation from the current tree and live Storybook was needed to avoid stale conclusions.

### What worked
- Storybook launched successfully on port 6008 and rich-widget integration stories rendered.
- Audit commands were fast and produced clear numbers:
  - rich-widget stories: 22 total, 1 Redux-backed
  - state hooks: 95 `useState`, 3 `useReducer`, 0 context hooks
  - dead parts: 72 unused constants, all still represented in CSS selectors
- Existing OS-07 doc provided a clear baseline for intended Redux direction.

### What didn't work
- Storybook first launch on 6006 failed due port collision:
  - Prompt observed in tmux: `Port 6006 is not available. Would you like to run Storybook on port 6008 instead?`
  - Resolved by restarting with explicit `--port 6008 --ci`.

### What I learned
- The package is not “anti-Redux”; it has Redux-aware integration points and peer deps, but runtime rich widgets are currently local-state only.
- The bigger present debt is consistency: Storybook state simulation and CSS/parts cleanup lag behind primitive extraction.

### What was tricky to build
- Distinguishing **intended local state** from **missing Redux adoption** required cross-referencing three layers:
  1) OS-07 intent docs,
  2) launcher contract/store capabilities (`LaunchableAppModule.state`, reducer collection),
  3) current rich-widget implementations.
- The subtle issue in CSS was not “obviously broken styles,” but migration residue: primitive parts adopted in JSX while legacy selectors/constants remain shipped.

### What warrants a second pair of eyes
- Decision boundary for which widgets should get module-level Redux state (to avoid over-engineering).
- Whether the 72 dead part constants/selectors should be removed immediately in OS-08 or deferred to a follow-up cleanup ticket.
- Storybook helper design: reuse `createStoryHelpers` patterns directly vs package-specific variant.

### What should be done in the future
- Implement Phase A/B/C/D from the new design doc, starting with:
  1) reducer adoption criteria,
  2) rich-widget Storybook store helper + seeded scenarios,
  3) dead parts/CSS selector removal.

### Code review instructions
- Start with:
  - `ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/design-doc/03-independent-review-redux-usage-storybook-state-simulation-modularization-and-css-duplication.md`
- Validate with these spot checks:
  - Redux expectation in OS-07: `.../design-doc/01-rich-widget-import-analysis-and-integration-plan.md` (state-management section)
  - Storybook Redux gap: `packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx` vs `packages/rich-widgets/src/log-viewer/LogViewer.stories.tsx`
  - App story helper baseline: `packages/engine/src/app/generateCardStories.tsx` and `apps/todo/src/app/stories/TodoApp.stories.tsx`
  - Dead parts residue: `packages/rich-widgets/src/parts.ts`, `packages/rich-widgets/src/theme/*.css`

### Technical details
- Key commands run:
  - `npm run storybook -- --ci --host 127.0.0.1 --port 6008`
  - `npm run storybook:check`
  - `rg -n "react-redux|@reduxjs/toolkit|configureStore|createSlice|useSelector|useDispatch|Provider" packages/rich-widgets/src --glob '!**/*.stories.tsx' -S`
  - `find packages/rich-widgets/src -name '*.stories.tsx' | wc -l`
  - `rg -l "configureStore|Provider|createStoryHelpers|storeDecorator" packages/rich-widgets/src/**/*.stories.tsx`
  - dead-part usage scripts comparing `parts.ts` keys against `P.<key>` references and CSS selectors.

## Step 5: Task 1 implementation — launcher Redux state target (2026-03-03)

I started implementation work from the new independent review plan, explicitly following the user’s request to move task-by-task with commit checkpoints and frequent diary updates. The first concrete task was adding a real Redux reducer target for rich widgets in launcher runtime, instead of leaving state purely local/ephemeral.

I implemented this as a package-level launcher slice that tracks launch stats by widget app id, then wired launch dispatch into all rich widget modules while registering the reducer once on `logViewerModule`.

### Prompt Context

**User prompt (verbatim):** "Yes. Work task by task, commit at appropriate intervals, keep a frequent diary."

**Assistant interpretation:** Start implementing the remediation plan now, in small task increments, with focused commits and regular diary bookkeeping after each step.

**Inferred user intent:** See steady, reviewable progress instead of a single large batch.

**Commit (code):** `6c766dad9bb19cb31c96984ce6da1b59e9a8bddc` — "feat(rich-widgets): track widget launches in launcher redux state"

### What I did
- Added new launcher state slice:
  - `packages/rich-widgets/src/launcher/richWidgetsLauncherState.ts`
  - Tracks `launchCount` + `lastLaunchReason` per `appId`.
- Added reducer test:
  - `packages/rich-widgets/src/launcher/richWidgetsLauncherState.test.ts`
- Updated launcher module wiring:
  - `packages/rich-widgets/src/launcher/modules.tsx`
  - Dispatches `markLaunched({ appId, reason })` in `buildLaunchWindow`.
  - Registers reducer once under `stateKey: 'app_rich_widgets'` on `logViewerModule`.
- Ran validation:
  - `npm run test -w packages/rich-widgets` (pass).

### Why
- This is the smallest high-signal implementation of “first Redux target”:
  - zero UI behavior risk,
  - immediate store observability,
  - aligns rich widgets with existing launcher module state patterns used by app modules.

### What worked
- Slice wiring integrated cleanly with existing launcher module helper.
- Test passed quickly and verifies per-app launch accounting behavior.
- Commit remained focused to 3 files.

### What didn't work
- Running `npm run typecheck -w packages/rich-widgets` emitted a large pre-existing workspace/typeconfig failure set (rootDir/path alias issues and known widget TS errors), and also generated transient untracked build artifacts under `packages/engine/src`.
- I cleaned generated artifacts with:
  - `git clean -fd packages/engine/src`

### What I learned
- `typecheck` in this workspace is currently not a reliable gate for targeted rich-widget changes because it drags in broad cross-package compile constraints.
- Focused `vitest` checks are currently the practical verification path for incremental rich-widget changes.

### What was tricky to build
- The tricky part was avoiding broad launcher refactors while still introducing a meaningful reducer target.
- Registering one shared reducer key (`app_rich_widgets`) and dispatching from every module launch path gives value immediately without introducing 20 separate state keys.

### What warrants a second pair of eyes
- Whether `logViewerModule` is the right owner for shared rich-widget launcher state, versus introducing a dedicated infrastructure module.
- Whether we should expose selectors for `app_rich_widgets` in a shared helper file now or after Storybook/state tooling lands.

### What should be done in the future
- Next task: add store-seeded Storybook scenarios for rich widgets (Redux-backed scenario simulation), then commit + diary again.

### Code review instructions
- Start in:
  - `packages/rich-widgets/src/launcher/richWidgetsLauncherState.ts`
  - `packages/rich-widgets/src/launcher/modules.tsx`
- Validate with:
  - `npm run test -w packages/rich-widgets`

### Technical details
- Key commands:
  - `npm run test -w packages/rich-widgets`
  - `npm run typecheck -w packages/rich-widgets` (known workspace failures)
  - `git clean -fd packages/engine/src` (cleanup of generated artifacts from failed typecheck)

## Step 6: Task 2 implementation — Redux-seeded Storybook desktop scenarios (2026-03-03)

I continued with the next scoped task from the same implementation sequence and kept the commit surface tight. This step targeted Storybook simulation depth: moving from only startup-window scenarios to explicit Redux-seeded window state scenarios for rich widgets.

The change is intentionally story-only and non-runtime, so it improves test/debug ergonomics without changing production launcher behavior.

### Prompt Context

**User prompt (verbatim):** (see Step 5)

**Assistant interpretation:** Continue task-by-task implementation with a dedicated commit and diary checkpoint for Storybook Redux simulation improvements.

**Inferred user intent:** Keep momentum with small, auditable increments and frequent visibility in the diary.

**Commit (code):** `0a57c34b118824e70d02c8d3db90c54b0d3f2b9d` — "feat(storybook): add redux-seeded rich-widget desktop scenarios"

### What I did
- Updated:
  - `packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx`
- Added seeded-store helpers:
  - `SeedStore` type
  - `seedWindows(widgetIds)` helper that dispatches `openWindow(...)` into the Redux store before render.
- Added two new Redux-seeded scenarios:
  - `SeedLogAndMusicWindows`
  - `SeedInstrumentCluster`
- Retained existing startup-widget stories (`StartWithLogViewer`, `StartWithMusicPlayer`, `StartWithSteamLauncher`) for compatibility.
- Validated:
  - `npm run storybook:check` (pass)
  - `npm run test -w packages/rich-widgets` (pass)

### Why
- This directly addresses the gap identified in the independent review: rich-widget Storybook had very limited Redux-backed state simulation.
- Seeding store state with open windows gives deterministic “already-running desktop” scenarios that are closer to real runtime snapshots.

### What worked
- Storybook taxonomy checks remained green after adding scenarios.
- The seeded approach fit the existing story architecture cleanly.
- No runtime package code changed; risk stayed low.

### What didn't work
- N/A

### What I learned
- Pre-seeding the store is a lightweight way to model multi-window desktop states without introducing heavy harness plumbing.
- This pattern is reusable for additional rich-widget scenarios (error-state layouts, multi-window stress snapshots, etc.).

### What was tricky to build
- The main subtlety was making seeding deterministic while preserving story isolation.
- Using `useMemo` store construction + seed callback per story render keeps each scenario isolated and repeatable.

### What warrants a second pair of eyes
- Whether we should extract the seeding helper into a shared `storyHelpers` module now or wait until a second story file needs it.
- Whether seeded stories should use deterministic window coordinates instead of randomized `buildWindowPayload` offsets for screenshot stability.

### What should be done in the future
- Next incremental task: extract shared Storybook helper(s) if more rich-widget stories start using seeded Redux state.

### Code review instructions
- Start with:
  - `packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx`
- Validate with:
  - `npm run storybook:check`
  - `npm run test -w packages/rich-widgets`

### Technical details
- Key commands:
  - `npm run storybook:check`
  - `npm run test -w packages/rich-widgets`

## Step 7: Task 3 implementation — remove dead LogViewer toolbar/status residue (2026-03-03)

I continued with the next incremental cleanup task from the independent review plan, focused on CSS/parts de-duplication with low behavior risk. This step targets migration residue left after `WidgetToolbar` and `WidgetStatusBar` adoption in LogViewer.

### Prompt Context

**User prompt (verbatim):** "continue"

**Assistant interpretation:** Execute the next pending cleanup task with a small, reviewable commit and then update ticket diary/changelog.

**Inferred user intent:** Keep making concrete progress task-by-task and document each step.

**Commit (code):** `25ee144f321db6251dfce9951dbf167cd419f93a` — "chore(rich-widgets): remove dead log-viewer part selectors"

### What I did
- Updated:
  - `packages/rich-widgets/src/parts.ts`
  - `packages/rich-widgets/src/theme/log-viewer.css`
- Removed dead LogViewer part constants no longer referenced in TSX:
  - `lvToolbar`
  - `lvStatusBar`
- Removed matching obsolete CSS selectors:
  - `[data-part="lv-toolbar"]`
  - `[data-part="lv-status-bar"]`
- Validated:
  - `npm run test -w packages/rich-widgets` (pass)
  - `npm run storybook:check` (pass)

### Why
- LogViewer now renders primitive wrappers (`WidgetToolbar`, `WidgetStatusBar`) rather than widget-specific toolbar/status parts.
- Keeping the old selectors/constants creates duplication and ambiguity about canonical styling ownership.

### What worked
- Cleanup was fully surgical (2 files, deletions only) and did not affect runtime behavior.
- Existing widget tests and Storybook taxonomy checks remained green.

### What didn't work
- N/A

### What I learned
- Small residue removals are safe to land incrementally and reduce the dead `RICH_PARTS`/CSS surface without large refactor risk.

### What was tricky to build
- Confirming selector/constant deadness required checking both part key references and raw selector usage so we did not remove active styles accidentally.

### What warrants a second pair of eyes
- Whether we should now batch-remove the remaining dead parts/selectors across all widgets in one pass, or continue widget-by-widget for easier review.

### What should be done in the future
- Next task should continue Phase D with another widget-scoped dead selector/constants cleanup, then re-count remaining dead parts.

### Code review instructions
- Verify no remaining references to removed parts:
  - `rg -n "lvToolbar|lvStatusBar|lv-toolbar|lv-status-bar" packages/rich-widgets/src`
- Validate:
  - `npm run test -w packages/rich-widgets`
  - `npm run storybook:check`

### Technical details
- Key commands:
  - `rg -n "lvToolbar|lvStatusBar|lv-toolbar|lv-status-bar" packages/rich-widgets/src`
  - `npm run test -w packages/rich-widgets`
  - `npm run storybook:check`

## Step 8: Re-upload refreshed OS-08 bundle to reMarkable (2026-03-03)

After Task 3 code and ticket-doc updates were committed, I refreshed the reMarkable artifact so the uploaded OS-08 package reflects the latest execution state.

### Prompt Context

**User prompt (verbatim):** "Store the result of your analysis in OS-08 and upload to remarkable."

**Assistant interpretation:** Keep the remote reMarkable copy current as implementation/diary updates continue.

**Inferred user intent:** The reMarkable folder should contain the latest ticket narrative, not only the initial independent review upload.

### What I did
- Verified remarquee auth/session:
  - `remarquee status`
  - `remarquee cloud account --non-interactive`
- Dry-ran upload bundle command with four docs:
  - design doc 03
  - investigation diary
  - tasks
  - changelog
- Uploaded real bundle:
  - name: `OS-08-CLEANUP-RICH-WIDGETS-update-2026-03-03`
  - remote dir: `/ai/2026/03/03/OS-08-CLEANUP-RICH-WIDGETS`
- Verified remote listing:
  - `remarquee cloud ls /ai/2026/03/03/OS-08-CLEANUP-RICH-WIDGETS --long --non-interactive`

### Why
- This keeps the analysis deliverable synchronized with in-progress execution work and avoids stale review artifacts on device/cloud.

### What worked
- Dry-run and actual upload both succeeded.
- Remote listing confirms both previous and refreshed PDFs are present.

### What didn't work
- N/A

### Technical details
- Key commands:
  - `remarquee upload bundle --dry-run ... --name "OS-08-CLEANUP-RICH-WIDGETS-update-2026-03-03" --remote-dir /ai/2026/03/03/OS-08-CLEANUP-RICH-WIDGETS --toc-depth 2`
  - `remarquee upload bundle ... --name "OS-08-CLEANUP-RICH-WIDGETS-update-2026-03-03" --remote-dir /ai/2026/03/03/OS-08-CLEANUP-RICH-WIDGETS --toc-depth 2`
  - `remarquee cloud ls /ai/2026/03/03/OS-08-CLEANUP-RICH-WIDGETS --long --non-interactive`

## Step 9: Task 4 implementation — remove dead MacWrite toolbar/separator/status residue (2026-03-03)

I continued the Phase D cleanup with another widget-scoped, low-risk residue removal. This step mirrors Task 3, but for MacWrite after its migration to shared primitives.

### Prompt Context

**User prompt (verbatim):** "Ok"

**Assistant interpretation:** Proceed with the next task in the same commit-and-diary cadence.

**Inferred user intent:** Keep execution moving without pausing between small tasks.

**Commit (code):** `63cd724d8cb0879d2876a2d9f5c6e68c230bc8c2` — "chore(rich-widgets): remove dead macwrite part selectors"

### What I did
- Updated:
  - `packages/rich-widgets/src/parts.ts`
  - `packages/rich-widgets/src/theme/mac-write.css`
- Removed dead MacWrite part constants:
  - `mwToolbar`
  - `mwSeparator`
  - `mwStatusBar`
- Removed matching legacy selectors:
  - `[data-part="mw-toolbar"]`
  - `[data-part="mw-separator"]`
  - `[data-part="mw-status-bar"]`
- Verified no remaining references:
  - `rg -n "mwToolbar|mwSeparator|mwStatusBar|mw-toolbar|mw-separator|mw-status-bar" packages/rich-widgets/src` → no matches
- Validation:
  - `npm run test -w packages/rich-widgets` (pass)
  - `npm run storybook:check` (pass)

### Why
- `MacWrite.tsx` now renders `WidgetToolbar`, `Separator`, and `WidgetStatusBar`, so widget-specific toolbar/separator/status selectors are orphaned migration residue.
- Removing them reduces duplicated style surface and dead part-key inventory.

### What worked
- Change was surgical and behavior-neutral (deletions only).
- Validation checks stayed green.

### What didn't work
- N/A

### What I learned
- Widget-by-widget residue cleanup is straightforward and keeps diffs highly reviewable while steadily reducing global dead-key counts.

### What should be done in the future
- Continue Phase D with the next widget that has primitive migration residue (`KanbanBoard`, `NodeEditor`, `Oscilloscope`, etc.), one small commit each.

### Technical details
- Key commands:
  - `rg -n "mwToolbar|mwSeparator|mwStatusBar|mw-toolbar|mw-separator|mw-status-bar" packages/rich-widgets/src || echo "no matches"`
  - `npm run test -w packages/rich-widgets`
  - `npm run storybook:check`
