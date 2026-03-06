---
Title: MacSlides import diary
Ticket: OS-18-MAC-SLIDES-IMPORT
Status: active
Topics:
    - frontend
    - widgets
    - storybook
    - cleanup
    - diary
DocType: reference
Intent: implementation-log
Owners: []
RelatedFiles:
    - imports/mac-slides.jsx
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-06T09:00:00-05:00
WhatFor: ""
WhenToUse: ""
---

# MacSlides import diary

## 2026-03-06 — Ticket creation and initial audit

### Goal

Create a dedicated ticket for importing `imports/mac-slides.jsx` as a proper rich widget, then break the work into task-sized steps before starting implementation.

### Initial findings from `imports/mac-slides.jsx`

- The file is a monolith combining UI, styles, markdown parsing, slideshow handling, and fake desktop/window chrome.
- The import reimplements app shell elements that should not survive the port:
  - menu bar,
  - dropdown menus,
  - title bar,
  - close box,
  - desktop texture,
  - browser-global style injection.
- The actual reusable widget content is the presentation editor itself:
  - slide list,
  - markdown editor,
  - preview pane,
  - slideshow mode,
  - alignment control.
- The markdown rendering layer needs cleanup before adoption:
  - ad hoc HTML generation,
  - fake `oli` intermediate tags,
  - duplicated directive parsing paths,
  - inline `<style>` injection.

### Next step

Task 1: scaffold the widget folder and extract the reusable helper/domain layer before starting the big JSX/CSS rebuild.

## 2026-03-06 — Task 1 scaffold

### Goal

Create the initial `packages/rich-widgets/src/mac-slides/` folder and extract the raw import’s reusable domain/helpers before attempting the UI rewrite.

### Files added

- `packages/rich-widgets/src/mac-slides/types.ts`
- `packages/rich-widgets/src/mac-slides/sampleData.ts`
- `packages/rich-widgets/src/mac-slides/markdown.ts`
- `packages/rich-widgets/src/mac-slides/MacSlides.tsx`
- `packages/rich-widgets/src/mac-slides/markdown.test.ts`

### What changed

1. Added a typed deck model:
   - `SlideAlignment`
   - `SlideDocument`
   - `MacSlidesDeck`
2. Extracted the raw import’s core helper logic into `markdown.ts`:
   - slide splitting,
   - alignment directive parsing,
   - alignment class naming,
   - the initial markdown-to-HTML renderer.
3. Moved the demo deck into `sampleData.ts` and added helper variants for dense and empty decks.
4. Added a minimal `MacSlides.tsx` scaffold component so the folder has a real widget entrypoint while the full CSS/primitive rebuild is still pending.
5. Added tests around the extracted helper layer so the cleanup can proceed with a stable baseline.

### Notes

- This is intentionally not yet wired into `parts.ts`, `theme/index.ts`, package exports, or launcher modules.
- The markdown renderer is still intentionally simple; the goal of Task 1 was extraction and typing, not final rendering fidelity.

### Commands run

```bash
npm run test -w packages/rich-widgets
```

### Results

- `npm run test -w packages/rich-widgets` ✅

### Next task

Task 2: add `RICH_PARTS` entries and build `theme/mac-slides.css`, replacing the import’s inline style object and injected style blocks with repo-native CSS.

## 2026-03-06 — Task 2 parts and CSS contract

### Goal

Define the widget’s parts/CSS contract before the full JSX rebuild so the next implementation step can target stable `data-part` names instead of inventing them during the component rewrite.

### Files changed

- `packages/rich-widgets/src/parts.ts`
- `packages/rich-widgets/src/theme/mac-slides.css`
- `packages/rich-widgets/src/theme/index.ts`

### What changed

1. Added a `MacSlides` section to `RICH_PARTS` for the major widget regions:
   - root/body/sidebar/editor/preview,
   - slide thumbnail regions,
   - pane headers/meta,
   - preview frame/navigation row,
   - alignment toggle/deck stats,
   - presentation-mode frame/status.
2. Added `theme/mac-slides.css` with the initial CSS contract:
   - base widget layout,
   - sidebar/thumb layout,
   - editor/preview pane structure,
   - presentation-mode overlay/frame,
   - extracted `.slide-content` typography rules.
3. Imported the new CSS file from `packages/rich-widgets/src/theme/index.ts`.

### Notes

- This task intentionally defines the target CSS contract before the full widget rebuild.
- The current scaffold component does not yet consume all of these parts; that happens in Task 3.
- Remote font imports, desktop textures, and browser-global scrollbar hacks are still absent from the CSS on purpose and will not be reintroduced.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅

## 2026-03-06 — Task 9 helper test coverage

### Goal

Close the final coverage gap in the extracted helper layer.

### Files changed

- `packages/rich-widgets/src/mac-slides/helpers.test.ts`

### What changed

Added direct tests for:

- alignment cycle order,
- rewriting the active slide alignment directive,
- removal of explicit alignment directives when cycling back to `auto`.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅

## 2026-03-06 — Task 10 content-parts normalization

### Goal

Remove the last widget-global MacSlides CSS contract and stop repeating the rendered slide markup pattern across thumbnail, preview, and presentation views.

### Files changed

- `packages/rich-widgets/src/mac-slides/SlideMarkup.tsx`
- `packages/rich-widgets/src/mac-slides/MacSlidesSections.tsx`
- `packages/rich-widgets/src/mac-slides/markdown.ts`
- `packages/rich-widgets/src/parts.ts`
- `packages/rich-widgets/src/theme/mac-slides.css`

### What changed

1. Added a shared `SlideMarkup` component that owns the rendered HTML surface for slide content.
2. Replaced the old `.slide-content` / `.slide-auto` / `.slide-all-center` / `.slide-all-left` class scheme with:
   - `data-part="ms-slide-content"`
   - `data-align="auto|center|left"`
3. Reused the same slide markup component in:
   - the main preview pane,
   - the slide thumbnails,
   - the presentation overlay.
4. Removed the old `alignClassName()` helper because alignment is now expressed in the DOM through the part/state contract instead of widget-global class names.

### Why this matters

- The widget now follows the same low-specificity theming rule as the rest of `rich-widgets`.
- The CSS contract is easier to theme without depending on hidden class names.
- The slide preview/presentation/sidebar paths can no longer drift in markup structure.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅

## 2026-03-06 — Task 11 Redux-backed story parity

### Goal

Bring `MacSlides` story coverage in line with the Redux rollout guide now that the widget has a real slice.

### Files changed

- `packages/rich-widgets/src/mac-slides/MacSlides.stories.tsx`

### What changed

1. Converted the main story matrix to store-seeded scenarios:
   - `Default`
   - `EmptyDeck`
   - `DenseDeck`
   - `AlignmentStates`
   - `PresentationOpen`
   - `PaletteOpen`
2. Added a small `renderSeededStory()` helper so each story seeds the Redux slice instead of depending on prop-only setup.
3. Kept one explicit `StandaloneEmbed` story so the local fallback path is still visible and reviewable without conflating it with the primary integration path.
4. Rechecked the standalone story through live Storybook on port `6006`.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅

## 2026-03-06 — Task 11 publication refresh

### Goal

Refresh the OS-18 ticket after the final MacSlides cleanup pass so the published bundle matches the normalized content parts and Redux-seeded Storybook stories.

### Commands run

```bash
docmgr doctor --ticket OS-18-MAC-SLIDES-IMPORT --stale-after 30
remarquee upload bundle \
  ttmp/2026/03/06/OS-18-MAC-SLIDES-IMPORT--macslides-rich-widget-import-and-cleanup/index.md \
  ttmp/2026/03/06/OS-18-MAC-SLIDES-IMPORT--macslides-rich-widget-import-and-cleanup/design/01-macslides-import-plan.md \
  ttmp/2026/03/06/OS-18-MAC-SLIDES-IMPORT--macslides-rich-widget-import-and-cleanup/tasks.md \
  ttmp/2026/03/06/OS-18-MAC-SLIDES-IMPORT--macslides-rich-widget-import-and-cleanup/changelog.md \
  ttmp/2026/03/06/OS-18-MAC-SLIDES-IMPORT--macslides-rich-widget-import-and-cleanup/reference/01-investigation-diary.md \
  --name "OS-18-MAC-SLIDES-IMPORT-2026-03-06-task11" \
  --remote-dir "/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT" \
  --toc-depth 2 --non-interactive
remarquee cloud ls /ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT --long --non-interactive
```

### Results

- `docmgr doctor --ticket OS-18-MAC-SLIDES-IMPORT --stale-after 30` ✅
- Updated bundle upload ✅
- Remote listing now shows:
  - `/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT/OS-18-MAC-SLIDES-IMPORT-2026-03-06`
  - `/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT/OS-18-MAC-SLIDES-IMPORT-2026-03-06-task6`
  - `/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT/OS-18-MAC-SLIDES-IMPORT-2026-03-06-task7`
  - `/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT/OS-18-MAC-SLIDES-IMPORT-2026-03-06-task8`
  - `/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT/OS-18-MAC-SLIDES-IMPORT-2026-03-06-task9`
  - `/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT/OS-18-MAC-SLIDES-IMPORT-2026-03-06-task11`

## 2026-03-06 — Task 8 publication refresh

### Goal

Refresh the ticket publication after the final modularization pass so the reMarkable bundle reflects the latest code structure.

### Commands run

```bash
docmgr doctor --ticket OS-18-MAC-SLIDES-IMPORT --stale-after 30
remarquee upload bundle \
  .../index.md \
  .../design/01-macslides-import-plan.md \
  .../tasks.md \
  .../changelog.md \
  .../reference/01-investigation-diary.md \
  --name "OS-18-MAC-SLIDES-IMPORT-2026-03-06-task8" \
  --remote-dir "/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT" \
  --toc-depth 2 --non-interactive
remarquee cloud ls /ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT --long --non-interactive
```

### Results

- `docmgr doctor --ticket OS-18-MAC-SLIDES-IMPORT --stale-after 30` ✅
- Updated bundle upload ✅
- Remote listing now shows:
  - `/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT/OS-18-MAC-SLIDES-IMPORT-2026-03-06`
  - `/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT/OS-18-MAC-SLIDES-IMPORT-2026-03-06-task6`
  - `/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT/OS-18-MAC-SLIDES-IMPORT-2026-03-06-task7`
  - `/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT/OS-18-MAC-SLIDES-IMPORT-2026-03-06-task8`

## 2026-03-06 — Task 8 final modularization pass

### Goal

Take one more cleanup pass so the widget no longer keeps medium-size helper/component logic bundled inside `MacSlidesView.tsx`.

### Files changed

- `packages/rich-widgets/src/mac-slides/MacSlidesView.tsx`
- `packages/rich-widgets/src/mac-slides/MacSlidesSections.tsx`
- `packages/rich-widgets/src/mac-slides/helpers.ts`
- `packages/rich-widgets/src/mac-slides/useMacSlidesHotkeys.ts`
- `packages/rich-widgets/src/parts.ts`
- `packages/rich-widgets/src/theme/mac-slides.css`

### What changed

1. Extracted helper logic into `helpers.ts`:
   - alignment cycling,
   - current-slide alignment rewriting.
2. Extracted presentational subcomponents into `MacSlidesSections.tsx`:
   - `PresentationOverlay`
   - `SlideSidebar`
   - `EditorPane`
   - `PreviewPane`
3. Extracted keyboard behavior into `useMacSlidesHotkeys.ts`.
4. Reduced `MacSlidesView.tsx` from a monolith to a coordinating view/controller.
5. Added `msPaletteButton` styling in CSS and removed the last inline visual override from the toolbar button.

### Outcome

- `MacSlidesView.tsx` dropped to a much smaller coordinating component.
- The widget is now split across clearer domains:
  - wrapper,
  - state,
  - markdown,
  - helpers,
  - sections,
  - hotkeys,
  - stories,
  - theme.

### Live verification

Rechecked the empty-deck story in Storybook via Playwright MCP after the split. The widget still loads and the empty-state layout remains intact.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅

## 2026-03-06 — Task 6 publication refresh

### Goal

Refresh the ticket publication after the renderer cleanup so the reMarkable bundle matches the latest code/docs state.

### Commands run

```bash
docmgr doctor --ticket OS-18-MAC-SLIDES-IMPORT --stale-after 30
remarquee upload bundle \
  .../index.md \
  .../design/01-macslides-import-plan.md \
  .../tasks.md \
  .../changelog.md \
  .../reference/01-investigation-diary.md \
  --name "OS-18-MAC-SLIDES-IMPORT-2026-03-06-task6" \
  --remote-dir "/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT" \
  --toc-depth 2 --non-interactive
remarquee cloud ls /ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT --long --non-interactive
```

### Results

- `docmgr doctor --ticket OS-18-MAC-SLIDES-IMPORT --stale-after 30` ✅
- Updated bundle upload ✅
- Remote listing now shows:
  - `/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT/OS-18-MAC-SLIDES-IMPORT-2026-03-06`
  - `/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT/OS-18-MAC-SLIDES-IMPORT-2026-03-06-task6`

## 2026-03-06 — Task 7 modularization and live Storybook verification

### Goal

Continue cleanup now that the widget is functional by reducing component size, making the empty state intentional, and confirming the live Storybook output through Playwright MCP.

### Files changed

- `packages/rich-widgets/src/mac-slides/MacSlides.tsx`
- `packages/rich-widgets/src/mac-slides/MacSlidesView.tsx`
- `packages/rich-widgets/src/mac-slides/macSlidesState.ts`
- `packages/rich-widgets/src/mac-slides/sampleData.ts`
- `packages/rich-widgets/src/theme/mac-slides.css`

### What changed

1. Split the large widget implementation into:
   - a thin connected/standalone wrapper in `MacSlides.tsx`,
   - a presentational `MacSlidesView.tsx`,
   - smaller internal view sections for sidebar, editor pane, preview pane, and presentation overlay.
2. Replaced the implicit blank empty-deck state with real UI:
   - sidebar empty state,
   - preview empty state,
   - disabled presentation/alignment affordances when no slides exist.
3. Changed `createEmptyDeckMarkdown()` to return a truly empty deck instead of a pre-seeded slide.
4. Removed the selector warning seen in Storybook by replacing the `createSelector` wrapper in `macSlidesState.ts` with a plain selector function.

### Playwright MCP verification

After resetting the locked `mcp-chrome` process, I used Playwright MCP directly against Storybook on port `6006`.

Stories checked:

- `richwidgets-macslides--empty-deck`
- `richwidgets-macslides--default`
- `richwidgets-macslides--presentation-open`

Observed results:

- empty-deck story now shows intentional empty-state affordances instead of blank panes;
- default story renders the expected three-column layout;
- presentation-open story renders without the prior selector warning;
- remaining warnings are Storybook/MSW noise, not widget-specific runtime errors.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅

### Next task

Task 3: rebuild the widget layout against the new parts/CSS contract, remove the fake app chrome, and keep only the actual presentation editor functionality.

## 2026-03-06 — Task 3 widget rebuild

### Goal

Replace the placeholder component with the actual widget layout, mapped onto rich-widget primitives and the new `data-part` contract.

### Files changed

- `packages/rich-widgets/src/mac-slides/MacSlides.tsx`
- `packages/rich-widgets/src/parts.ts`
- `packages/rich-widgets/src/theme/mac-slides.css`

### What changed

1. Replaced the placeholder component with the real widget UI:
   - `WidgetToolbar`,
   - slide sidebar,
   - markdown editor pane,
   - preview pane,
   - `WidgetStatusBar`,
   - command palette,
   - presentation overlay.
2. Kept the actual presentation-editor behavior from the import while removing the fake shell:
   - no menu bar,
   - no fake title bar,
   - no desktop texture,
   - no global style injection,
   - no app-shell chrome copied into the widget.
3. Added small helper behavior needed for the cleaned port:
   - slide alignment cycling,
   - current-slide alignment rewriting,
   - keyboard shortcuts for palette/presentation/navigation.
4. Extended the CSS/parts contract to eliminate the remaining inline layout styling used during the first rebuild pass:
   - toolbar button sizing,
   - toolbar spacer,
   - thumbnail preview content wrapper.

### Notes

- State is still local at this point; Task 5 is where the Redux decision gets made.
- The widget is intentionally not yet exported or launcher-registered.
- Task 3 focused on getting the cleaned widget structure correct before Storybook and state wiring.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅

### Next task

Task 4: add Storybook stories for default, empty, dense, alignment, and presentation-focused states so the widget has a real scenario harness before launcher wiring.

## 2026-03-06 — Task 4 Storybook coverage

### Goal

Add scenario coverage for the cleaned widget before export/launcher wiring so the port has a review harness for layout and stateful UI states.

### Files changed

- `packages/rich-widgets/src/mac-slides/MacSlides.tsx`
- `packages/rich-widgets/src/mac-slides/MacSlides.stories.tsx`

### What changed

1. Added seedable view props to `MacSlides`:
   - `initialSlide`
   - `initialShowPalette`
   - `initialShowPresentation`
2. Added Storybook stories covering the first review set:
   - default deck,
   - empty deck,
   - dense deck,
   - alignment-focused deck,
   - presentation-open state,
   - palette-open state.
3. Kept this task local-state friendly so the story harness could land before the Redux decision in Task 5.

### Notes

- The new seed props are deliberate: they let stories represent UI states cleanly and they remain useful even if Task 5 adds a Redux-backed path.
- The alignment story uses a targeted demo deck instead of overloading the main sample deck.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅

### Next task

Task 5: decide the state boundary, add the Redux-backed path if warranted, and wire package exports plus launcher integration.

## 2026-03-06 — Task 5 Redux boundary and launcher wiring

### Goal

Finish the import by deciding the durable state boundary, wiring the widget into the rich-widgets package surface, and making it launchable from the desktop module list.

### Files changed

- `packages/rich-widgets/src/mac-slides/macSlidesState.ts`
- `packages/rich-widgets/src/mac-slides/macSlidesState.test.ts`
- `packages/rich-widgets/src/mac-slides/MacSlides.tsx`
- `packages/rich-widgets/src/mac-slides/MacSlides.stories.tsx`
- `packages/rich-widgets/src/index.ts`
- `packages/rich-widgets/src/launcher/modules.tsx`
- `ttmp/2026/03/06/OS-18-MAC-SLIDES-IMPORT--macslides-rich-widget-import-and-cleanup/design/01-macslides-import-plan.md`

### State decision

I decided the widget does justify a Redux slice.

Why:

- the deck text and current slide are real widget-session state, not purely local rendering details;
- palette/presentation visibility are part of the behavior we want Storybook and launcher-backed windows to reproduce deterministically;
- the repo’s current cleanup direction is to move meaningful widget state into Redux where it improves seeded scenarios and desktop integration.

What stays local:

- textarea refs and cursor manipulation,
- DOM event handlers inside presentation mode,
- transient browser focus mechanics.

### What changed

1. Added `macSlidesState.ts` with a dedicated `app_rw_mac_slides` slice for:
   - markdown content,
   - current slide,
   - palette-open state,
   - presentation-open state.
2. Added reducer tests covering seed normalization and state replacement/update behavior.
3. Reworked `MacSlides.tsx` into the same connected/standalone pattern used by other migrated widgets:
   - Redux-backed path when the slice is registered,
   - local reducer fallback when used standalone.
4. Updated the Storybook stories so stateful scenarios can use the seeded store helper instead of only prop seeding.
5. Exported the widget and slice helpers from `packages/rich-widgets/src/index.ts`.
6. Registered the widget in `packages/rich-widgets/src/launcher/modules.tsx` so it can launch as a desktop rich widget.
7. Updated the implementation plan doc to record the final state-boundary decision instead of the earlier tentative note.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
npm run typecheck -w packages/rich-widgets
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅
- `npm run typecheck -w packages/rich-widgets` ⚠️ fails on the pre-existing `packages/rich-widgets` project `rootDir` / file-list configuration and unrelated baseline errors in `packages/engine` and `src/oscilloscope`, not on `MacSlides`

### Ticket status

- All planned import tasks are now complete.

## 2026-03-06 — Ticket validation and reMarkable upload

### Goal

Close the ticket cleanly by verifying doc hygiene and publishing the finished bundle for offline review.

### Commands run

```bash
docmgr doctor --ticket OS-18-MAC-SLIDES-IMPORT --stale-after 30
remarquee status
remarquee upload bundle \
  .../index.md \
  .../design/01-macslides-import-plan.md \
  .../tasks.md \
  .../changelog.md \
  .../reference/01-investigation-diary.md \
  --name "OS-18-MAC-SLIDES-IMPORT-2026-03-06" \
  --remote-dir "/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT" \
  --toc-depth 2 --dry-run --non-interactive
remarquee upload bundle \
  .../index.md \
  .../design/01-macslides-import-plan.md \
  .../tasks.md \
  .../changelog.md \
  .../reference/01-investigation-diary.md \
  --name "OS-18-MAC-SLIDES-IMPORT-2026-03-06" \
  --remote-dir "/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT" \
  --toc-depth 2 --non-interactive
remarquee cloud ls /ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT --long --non-interactive
```

### Results

- `docmgr doctor --ticket OS-18-MAC-SLIDES-IMPORT --stale-after 30` ✅
- `remarquee status` ✅
- Bundle upload dry-run ✅
- Bundle upload ✅
- Remote listing verified:
  - `/ai/2026/03/06/OS-18-MAC-SLIDES-IMPORT/OS-18-MAC-SLIDES-IMPORT-2026-03-06`

### Notes

- The first cloud-list attempt raced the upload and returned `Error: entry '06' doesnt exist`; rerunning after the upload completed succeeded.

## 2026-03-06 — Task 6 markdown renderer cleanup

### Goal

Continue the import cleanup past initial launchability by removing the most fragile remaining logic from the imported helper layer.

### Why this task

The widget was working, but `renderBasicMarkdown()` still preserved one of the raw import’s weakest implementation details:

- regex-heavy block conversion,
- placeholder `oli` tags for ordered lists,
- paragraph wrapping that depended on post-hoc HTML detection.

That was acceptable for initial scaffolding, but not as a stable imported helper.

### Files changed

- `packages/rich-widgets/src/mac-slides/markdown.ts`
- `packages/rich-widgets/src/mac-slides/markdown.test.ts`

### What changed

1. Replaced the old renderer with a simple line-based pass that explicitly handles:
   - headings,
   - unordered lists,
   - ordered lists,
   - paragraphs,
   - inline bold / italic / code formatting.
2. Added a small `escapeHtml()` + `renderInlineMarkdown()` split so the rendering stages are clearer.
3. Removed the placeholder ordered-list tag hack entirely.
4. Expanded tests to cover:
   - ordered/unordered list rendering,
   - HTML escaping,
   - inline formatting preservation.

### Storybook note

I attempted headless capture against the running Storybook on port `6006`, but the capture path only returned the Storybook loading frame rather than a stable rendered story. I treated that as an inspection-tool limitation and continued with the next concrete code cleanup instead of blocking on it.

### Commands run

```bash
npm run test -w packages/rich-widgets
npm run storybook:check
```

### Results

- `npm run test -w packages/rich-widgets` ✅
- `npm run storybook:check` ✅
