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
