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
