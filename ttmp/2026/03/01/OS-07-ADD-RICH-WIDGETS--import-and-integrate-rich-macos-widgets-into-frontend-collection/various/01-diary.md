---
Title: Implementation Diary
Ticket: OS-07-ADD-RICH-WIDGETS
Status: active
Topics:
    - frontend
    - widgets
    - diary
DocType: various
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Step-by-step narrative of widget porting work"
LastUpdated: 2026-03-02T00:30:00.000000000-05:00
WhatFor: "Track what changed, why, what worked, what failed"
WhenToUse: "Review progress, understand decisions, onboard reviewers"
---

# Implementation Diary

## 2026-03-02 — MacCalendar widget port

### What was done

Full port of `maccal.jsx` → `MacCalendar.tsx`. This is a substantial widget with:
- Month view with full 6-week grid, event chips, day-click to create
- Week view with hourly time grid, positioned events, "now" line indicator
- Event modal for create/edit/delete with date, time, duration, color pickers
- Command palette (⌘P) with search, keyboard navigation
- Keyboard shortcuts (N=new, T=today, M/W=view toggle, ←→=navigate)
- Status bar with event counts and shortcut hints

**Files created:**
- `calendar/types.ts` — CalendarEvent, CalendarView, utility functions (sameDay, fmtTime, mkEventId)
- `calendar/sampleData.ts` — 8 initial events, EVENT_COLORS using CSS tokens, makePaletteActions
- `calendar/MacCalendar.tsx` — Main component + MonthView, WeekView, EventModal, Palette sub-components
- `calendar/MacCalendar.stories.tsx` — Default, WeekView, Empty, EmptyWeek, Compact stories
- `theme/calendar.css` — 35+ data-part rules

**Key decisions:**
- Dropped the original's 3 internal themes (classic/dark/green) — the engine's theming system handles that. The widget now uses CSS tokens exclusively.
- Removed window chrome/title bar (shell handles it)
- Replaced MacButton with `Btn` from engine
- Used `Btn` with `data-state="active"` for duration selector and color picker instead of custom styled divs
- Kept event colors as a prop (`eventColors`) defaulting to CSS token-based grays — theme can override

### Verification

All 5 Storybook stories render. Month view shows March 2026 grid with events properly placed. Controls panel in Storybook shows initialEvents, initialView (radio month/week), eventColors props.

### Lessons learned

- Calendar widgets are dense — many sub-components (month grid, week grid, event modal, palette) each need their own data-parts
- The original's inline theme system (`THEMES.classic`, `THEMES.dark`, `THEMES.green`) is replaced wholesale by the engine's CSS tokens — much cleaner
- Week view needs `position: relative` + absolute event positioning — keep structural CSS tight

---

## 2026-03-02 — LogicAnalyzer widget completion

### What was done

The LogicAnalyzer widget was partially ported (component + types + stories existed) but had several gaps preventing it from compiling and rendering properly. Fixed:

1. **Added LA parts to `parts.ts`** — The component referenced `RICH_PARTS.logicAnalyzer`, `RICH_PARTS.laMain`, `RICH_PARTS.laBezel`, etc. but these constants didn't exist. Added 16 part constants (logicAnalyzer, laMain, laDisplay, laBezel, laBezelReflection, laDisplayStatus, laControls, laControlGroup, laControlGroupTitle, laChannelRow, laChannelColor, laSlider, laSliderLabel, laSliderValue, laToolbar, laSeparator).

2. **Fleshed out CSS** — The existing `logic-analyzer.css` was structurally correct but missing:
   - Inset box-shadows on `la-control-group` (the classic Mac 3D effect: `inset -1px -1px 0 #fff, inset 1px 1px 0 #808080`)
   - Bezel `padding: 3px` (matching oscilloscope)
   - Status bar 3D border (`border-top-color` for the emboss effect)
   - CRT reflection overlay CSS rule for `la-bezel-reflection`

3. **Added CRT glass reflection** — Added `<div data-part="la-bezel-reflection" />` inside the bezel, with CSS providing the diagonal gradient overlay (matching the original import's glass effect).

4. **Registered exports** — Added LogicAnalyzer + types to `index.ts`, added CSS import to `theme/index.ts`.

5. **Fixed type errors** — The `Checkbox` engine component has `onChange: () => void` but the code was passing `Dispatch<SetStateAction<boolean>>` (the raw state setter). Wrapped with `() => setState(v => !v)` for proper toggle behavior.

### What was tricky

- **Checkbox onChange type mismatch**: The engine's `Checkbox` component takes `onChange: () => void` (a toggle callback) but the natural pattern is to pass `setFoo` from `useState`. The oscilloscope has the same bug (passes state setter directly) — it just isn't caught because the tsconfig cross-package check has pre-existing `rootDir` errors that mask it. Worth noting for future cleanup.

- **tsconfig cross-package errors**: Running `tsc --noEmit --project packages/rich-widgets/tsconfig.json` produces many `rootDir`/`TS6059` errors from the engine package being pulled in. This is a pre-existing issue — the rich-widgets tsconfig resolves `@hypercard/engine` by following the source, which brings files outside its rootDir. Our logic-analyzer changes are clean; only filtered output was used to verify.

### Verification

- Storybook renders all 5 stories (Default, Paused, AllChannels, TwoChannels, Compact)
- Signal traces animate on the dark CRT canvas with proper colors
- Control panel: channels with color swatches, timing sliders, trigger buttons, protocol decode, display checkboxes all render correctly
- Bottom toolbar with Stop/Reset/Defaults and quick-access checkboxes works
- No JS console errors

### Lessons learned

- Always check `parts.ts` registration when porting a new widget — the component compiles against `RICH_PARTS.*` constants that must be defined
- The engine `Checkbox.onChange` is `() => void` (a toggle), not `(checked: boolean) => void` — wrap state setters accordingly
- Compare original import's inline `boxShadow` values carefully — the classic Mac inset effect is `inset -1px -1px 0 #fff, inset 1px 1px 0 #808080`
