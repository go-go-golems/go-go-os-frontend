---
Title: 'Independent review: redux usage, storybook state simulation, modularization, and CSS duplication'
Ticket: OS-08-CLEANUP-RICH-WIDGETS
Status: active
Topics:
    - frontend
    - widgets
    - refactoring
    - architecture
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/todo/src/app/stories/TodoApp.stories.tsx
      Note: Example of storeDecorator + createStory pattern
    - Path: packages/desktop-os/src/contracts/launchableAppModule.ts
      Note: Module contract supports optional reducer registration
    - Path: packages/desktop-os/src/store/createLauncherStore.ts
      Note: Launcher store collects module reducers
    - Path: packages/engine/src/app/generateCardStories.tsx
      Note: Reference helper used by other apps for store-backed stories
    - Path: packages/rich-widgets/src/calculator/MacCalc.tsx
      Note: Largest widget file (1098 LOC)
    - Path: packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx
      Note: Only Redux-backed rich-widget story
    - Path: packages/rich-widgets/src/launcher/modules.tsx
      Note: Current launcher modules omit module.state reducers
    - Path: packages/rich-widgets/src/log-viewer/LogViewer.stories.tsx
      Note: Fixture-based story scenarios without Redux store
    - Path: packages/rich-widgets/src/parts.ts
      Note: Dead data-part constants identified
    - Path: packages/rich-widgets/src/theme/log-viewer.css
      Note: Legacy toolbar/status selectors still present
    - Path: packages/rich-widgets/src/theme/primitives.css
      Note: Canonical primitive selectors
    - Path: packages/rich-widgets/src/theme/system-modeler.css
      Note: Hard-coded color residues
    - Path: ttmp/2026/03/01/OS-07-ADD-RICH-WIDGETS--import-and-integrate-rich-macos-widgets-into-frontend-collection/design-doc/01-rich-widget-import-analysis-and-integration-plan.md
      Note: Original state-management and storybook intent from OS-07
ExternalSources: []
Summary: 'Independent review across OS-07 and OS-08: rich widgets currently rely on local React state, Storybook rarely uses Redux-backed scenarios, several widgets remain monolithic, and CSS cleanup left 72 dead data-part selectors/constants.'
LastUpdated: 2026-03-03T00:48:00-05:00
WhatFor: ""
WhenToUse: ""
---


# Independent review: redux usage, storybook state simulation, modularization, and CSS duplication

## Executive Summary

This review validates the current rich widgets implementation against expectations from OS-07 and cleanup goals in OS-08.

Main conclusions:

1. **Redux usage in runtime widgets:** not present. Rich widgets are currently local-state components (`useState`/`useReducer`) with no module-level Redux slice registration.
2. **Redux usage in Storybook scenarios:** very limited. Out of 22 rich-widget story files, only 1 (`RichWidgetsDesktop.stories.tsx`) uses a Redux provider.
3. **Modularity:** improved versus the import baseline, but several files are still very large and mostly single-file implementations.
4. **CSS quality:** there is a concrete duplication/dead-code residue after primitive extraction: 72 unused data-part constants still map to selectors that remain in shipped CSS files.

This is a **real architecture consistency gap** with parts of OS-07’s original integration plan (which explicitly proposed Redux slices “where appropriate”), and a **real maintainability gap** in Storybook and CSS hygiene.

## Problem Statement

The request was to independently assess rich widgets across OS-07 and OS-08 for four potential issues:

1. Not using Redux and using other state mechanisms instead.
2. Not using Redux in Storybook to simulate states (unlike other stories/tests in the repo).
3. Widgets being too large / insufficiently modularized.
4. Wrong or duplicated CSS.

The objective is not to re-run prior conclusions blindly, but to validate the current codebase directly and document where the concerns are true, partially true, or no longer true.

## Proposed Solution

Use a targeted, evidence-backed cleanup pass rather than a blanket “convert everything to Redux” effort.

### 1) State management policy (Redux vs local)

Adopt a simple rule for rich widgets:

- Keep local `useState`/`useReducer` when state is purely presentational and ephemeral.
- Add module `state` reducers when state must survive window lifecycle, be externally observed, or participate in cross-widget workflows.

Then apply this intentionally to selected widgets instead of all 20.

### 2) Storybook state simulation parity

Introduce a rich-widget Storybook helper patterned after `createStoryHelpers` in `@hypercard/engine` so stories can:

- create isolated stores,
- optionally seed Redux state deterministically,
- render preconfigured scenarios from store state (not only prop fixtures).

### 3) Modularization budget and extraction

Define a modularization budget for widget files (for example: when a file exceeds 600 LOC and contains multiple major UI regions, it must extract subcomponents/hooks).
Prioritize extraction for the highest-LOC widgets first.

### 4) CSS cleanup completion

Run a final cleanup pass to remove dead legacy selectors/constants left behind after primitive adoption and normalize remaining hard-coded color literals that should be tokenized.

## Design Decisions

### Decision 1: Treat “no Redux” as a selective gap, not a universal bug

Observed:

- OS-07 proposed optional Redux slices for rich widgets (`ttmp/2026/03/01/OS-07-ADD-RICH-WIDGETS--import-and-integrate-rich-macos-widgets-into-frontend-collection/design-doc/01-rich-widget-import-analysis-and-integration-plan.md:183`).
- Current module contracts support per-app reducers (`packages/desktop-os/src/contracts/launchableAppModule.ts:24` and `packages/desktop-os/src/store/createLauncherStore.ts:14`).
- Rich widget launcher modules currently provide no `state` entries (`packages/rich-widgets/src/launcher/modules.tsx:57`).
- Runtime widget files have no Redux imports (verified via `rg` on `packages/rich-widgets/src` excluding stories; no matches).

Rationale:

Local state is not inherently wrong for UI-local behavior, but the current implementation does not use existing store-extension hooks for persistence/observability scenarios.

### Decision 2: Treat Storybook Redux simulation as an actionable gap

Observed:

- Rich widgets have 22 story files, but Redux wiring appears in only one (`packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx:1`).
- Individual widget stories (example: `LogViewer`) are prop/fixture driven (`packages/rich-widgets/src/log-viewer/LogViewer.stories.tsx:17`).
- Other app stories use store decorators/helpers (`apps/todo/src/app/stories/TodoApp.stories.tsx:6`, `packages/engine/src/app/generateCardStories.tsx:58`).

Rationale:

The current rich-widget stories are good visual fixtures, but weaker for deterministic stateful flows and parity with existing app story patterns.

### Decision 3: Keep modularization as a prioritized refactor, not forced churn

Observed LOC snapshot (current code):

| File | LOC |
|---|---:|
| `packages/rich-widgets/src/calculator/MacCalc.tsx` | 1098 |
| `packages/rich-widgets/src/graph-navigator/GraphNavigator.tsx` | 717 |
| `packages/rich-widgets/src/calendar/MacCalendar.tsx` | 694 |
| `packages/rich-widgets/src/system-modeler/SystemModeler.tsx` | 596 |
| `packages/rich-widgets/src/log-viewer/LogViewer.tsx` | 539 |
| `packages/rich-widgets/src/logic-analyzer/LogicAnalyzer.tsx` | 514 |

Rationale:

These files are maintainable today but high-friction for review and change isolation. Refactor should target highest-complexity/lowest-extraction files first.

### Decision 4: Classify CSS residue as real duplication/dead-code debt

Observed:

- Primitive selectors now exist (`packages/rich-widgets/src/theme/primitives.css:4` and `packages/rich-widgets/src/theme/primitives.css:17`).
- Legacy widget-specific toolbar/status selectors still remain (example: `packages/rich-widgets/src/theme/log-viewer.css:48` and `packages/rich-widgets/src/theme/log-viewer.css:185`).
- Components now render primitive parts instead (example: `packages/rich-widgets/src/log-viewer/LogViewer.tsx:267` and `packages/rich-widgets/src/log-viewer/LogViewer.tsx:379`).
- `RICH_PARTS` still exports many legacy keys (example: `packages/rich-widgets/src/parts.ts:37`, `packages/rich-widgets/src/parts.ts:53`, `packages/rich-widgets/src/parts.ts:643`, `packages/rich-widgets/src/parts.ts:659`).
- Audit command found **72 unused data-part keys**, and all 72 still map to selectors in `src/theme/*.css`.

Rationale:

This is cleanup debt from migration. It increases CSS payload and creates confusion about canonical parts.

## Alternatives Considered

1. **Convert all rich widgets to Redux immediately**
   - Rejected: high churn for low value on purely local view state; risks over-engineering.

2. **Leave everything as-is and rely on prior OS-08 reports**
   - Rejected: does not address current request for independent verification and misses concrete Storybook/CSS cleanup opportunities.

3. **Only fix CSS and skip Storybook/state architecture**
   - Rejected: CSS alone does not address reproducible state simulation and OS-07 design alignment concerns.

## Implementation Plan

### Phase A — State policy and reducer adoption targets

1. Define criteria for when a rich widget gets module `state`.
2. Select 2–3 widgets where persistence/observability is most valuable.
3. Add reducers through `LaunchableAppModule.state` and wire selectors/actions.

### Phase B — Storybook store-backed scenarios

1. Add rich-widget story helper (store decorator + optional seed hook).
2. Convert selected rich-widget stories to include seeded Redux scenarios.
3. Keep fixture/args stories for pure visual states.

### Phase C — Modularity pass on top offenders

1. Break `MacCalc`, `GraphNavigator`, and `MacCalendar` into composable sections/hooks.
2. Add file-level boundaries for toolbar/search/body/status regions where missing.
3. Keep behavior unchanged; refactor for readability/testability.

### Phase D — CSS and parts de-duplication final pass

1. Remove dead selectors for replaced primitive parts.
2. Remove unused `RICH_PARTS` constants.
3. Normalize remaining hard-coded hex usage where tokenized alternatives exist.
4. Validate visuals in Storybook after cleanup.

## Open Questions

1. Which rich widgets are intended to preserve state across close/reopen in production launcher usage?
2. Should rich-widget Storybook adopt a unified helper API identical to `createStoryHelpers`, or a narrower package-specific variant?
3. Do we want strict lint/CI checks for unused `RICH_PARTS` keys and orphaned `data-part` selectors?

## References

- `ttmp/2026/03/01/OS-07-ADD-RICH-WIDGETS--import-and-integrate-rich-macos-widgets-into-frontend-collection/design-doc/01-rich-widget-import-analysis-and-integration-plan.md`
- `ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/design-doc/01-rich-widgets-cleanup-report-widget-by-widget-analysis.md`
- `ttmp/2026/03/02/OS-08-CLEANUP-RICH-WIDGETS--cleanup-and-refactor-rich-macos-widgets-extract-primitives-normalize-state-reduce-duplication/design-doc/02-post-cleanup-code-review-modularity-state-management-and-code-quality.md`
- `packages/rich-widgets/src/launcher/modules.tsx`
- `packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx`
- `packages/rich-widgets/src/log-viewer/LogViewer.stories.tsx`
- `packages/rich-widgets/src/log-viewer/LogViewer.tsx`
- `packages/rich-widgets/src/calculator/MacCalc.tsx`
- `packages/rich-widgets/src/parts.ts`
- `packages/rich-widgets/src/theme/primitives.css`
- `packages/rich-widgets/src/theme/log-viewer.css`
- `packages/rich-widgets/src/theme/system-modeler.css`
- `packages/desktop-os/src/contracts/launchableAppModule.ts`
- `packages/desktop-os/src/store/createLauncherStore.ts`
- `packages/engine/src/app/generateCardStories.tsx`
- `apps/todo/src/app/stories/TodoApp.stories.tsx`
