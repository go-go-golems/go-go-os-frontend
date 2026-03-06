---
Title: Widget Porting Playbook
Ticket: OS-07-ADD-RICH-WIDGETS
Status: active
Topics:
    - frontend
    - widgets
    - storybook
    - state-management
    - architecture
DocType: playbooks
Intent: long-term
Owners: []
RelatedFiles:
    - /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/engine/src/parts.ts:Data-part constants registry
    - /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/engine/src/components/widgets/index.ts:Engine widget exports
    - /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/engine/docs/theming-and-widget-playbook.md:Full widget authoring guide
ExternalSources: []
Summary: "Repeatable playbook for porting external React widget sketches into the go-go-os framework"
LastUpdated: 2026-03-01T22:30:00.000000000-05:00
WhatFor: "Step-by-step guide for integrating any external React component into the engine's data-part/token system"
WhenToUse: "When importing a new external React widget or sketch into the go-go-os frontend"
---

# Widget Porting Playbook

A repeatable process for converting external React sketches (inline-styled, self-contained JSX) into go-go-os framework widgets that use data-parts, CSS tokens, deterministic Storybook stories, and Redux only where it is actually warranted.

**This playbook is a living document.** It will be updated with lessons learned from each widget port during OS-07.

**OS-15 update:** Storybook is now the forcing function for cleanup. Start by making widget states deterministic in stories. If a meaningful scenario cannot be expressed via props, decide whether it needs a seed prop or a Redux slice before adding more ad hoc local state.

**OS-17 update:** The first real rollout migration (`LogViewer`) added a few concrete rules that are now mandatory for cleanup work:

- **Redux state must stay serializable.** Do not store `Date`, `Set`, function updaters, DOM nodes, timer handles, or drag events in slices. Store timestamps as numbers, store enabled filters as arrays, and compute `Set` views or `Date` objects at selector/render time.
- **Do not port `useReducer` actions literally if they carry functions.** Patterns like `{ type: 'UPDATE_CELLS', updater: (prev) => ... }` are acceptable in a local reducer and unacceptable in Redux. Replace them with serializable actions such as `replaceCells(nextCells)` or `patchCell({ cellId, updates })`.
- **Keep widgets usable outside Redux.** If a widget is exported as a package component, prefer a connected path plus a standalone fallback rather than making raw component usage depend on a provider everywhere.
- **Use seeded stories to prove the slice shape.** If the slice design is correct, it should be easy to seed `selected`, `filtered`, `palette-open`, `streaming`, or `search-active` stories without interaction hacks.
- **Be explicit about package-level reducer debt.** The launcher currently has package-wide analytics that do not yet live in `sharedReducers`. When needed, document interim combined reducers and treat them as temporary, not the target architecture.

---

## Phase 0: Analyze the Import

### 0.1 Read the entire file

Read the import file end-to-end. Understand:
- What does it render? (visual layout, user interactions)
- What state does it manage? (local useState hooks)
- What UI primitives does it reimplement? (buttons, checkboxes, windows, inputs)
- Does it use canvas, SVG, or DOM-only rendering?
- What external fonts or assets does it reference?

### 0.2 Build the Primitive Mapping Table

This is the **most important artifact**. For every inline-styled element in the import, determine:

| Import Element | Engine Equivalent | Action |
|---------------|-------------------|--------|
| `MacButton` | `Btn` from engine | Replace |
| `MacCheckbox` | `Checkbox` from engine | Replace |
| `TitleBar` | Shell windowing | Remove (handled by shell) |
| Custom slider | — | Create new `Slider` widget |
| Search input | `data-part="field-input"` | Use existing CSS part |

**Rules for the mapping:**
- If the engine has an equivalent widget → **Replace**
- If the engine has a CSS data-part that provides the styling → **Use existing part**
- If no equivalent exists and the element appears in multiple imports → **Create new primitive**
- If no equivalent exists and it's unique to this widget → **Create widget-local part**

### 0.3 Identify State Boundaries

Classify all `useState` calls:

| State Variable | Scope | Redux? | Rationale |
|---------------|-------|--------|-----------|
| `items` / core data | Widget or desktop | Maybe | Redux only if other desktop systems need to observe or persist it |
| `filterValues` | Widget | Maybe | Use Redux if it should persist/reopen or drive cross-window behavior |
| `selected` | Widget | Maybe | Prefer seed props first; move to Redux if selection becomes externally meaningful |
| `hoverState` | Local | No | Pure UI transient, no value in persisting |
| `dragPosition` | Local | No | Frame-by-frame UI state |

**Decision ladder:**
1. **Pure UI transient** (`hover`, drag rectangles, local animation toggles) → keep local.
2. **Important for deterministic stories but still widget-local** (`selected row`, `search query`, `open modal`) → add seed props or a seeded story wrapper first.
3. **Cross-window, launcher-visible, persistence-worthy, or externally observable** → add a Redux slice.

**Rule of thumb:** Storybook should tell you when local state is a problem. If you cannot render an important state deterministically without brittle interaction hacks, either expose a seed prop or promote the durable part of that state into Redux.

### 0.4 Plan the Story Matrix

Before writing code, list the Storybook stories you'll need:

1. **Default** — Widget with typical data, default settings
2. **Empty** — Widget with no data (empty state)
3. **Compact** — Widget in compact/minimal mode if applicable
4. **Dense / stressed** — Widget with large data or busy content
5. **Filtered / focused** — Widget showing a reduced or targeted subset
6. **Running / paused / loading** — Domain-specific operational state
7. **Empty/error edge** — Widget showing no matches, errors, or blank content
8. **Seeded state** — Story that proves the widget can render important internal state deterministically

**Current helper baseline in `packages/rich-widgets/src/storybook/`:**
- `frameDecorators.tsx` for fullscreen and fixed-window shells
- `seededStore.tsx` for Redux-backed story seeding when a widget slice exists

**Storybook-first workflow:**
1. Add prop-driven stories first.
2. If a key state is still inaccessible, add a seed prop or seeded wrapper.
3. If the state should persist, coordinate with launcher/desktop, or be observed elsewhere, move it into a Redux slice and use `seededStore.tsx` in Storybook.

---

## Phase 1: Set Up the Widget Directory

### 1.1 Create the directory structure

```
packages/rich-widgets/src/<widget-name>/
  <WidgetName>.tsx        # Main component
  <WidgetName>.stories.tsx # Storybook stories
  types.ts                 # TypeScript interfaces
  sampleData.ts            # Test data generators
  <widgetName>State.ts     # Redux slice/selectors/seed helpers (only if justified by the state policy)
```

### 1.2 Define types first

Convert the import's implicit data shapes into TypeScript interfaces:

```typescript
// types.ts
export interface LogEntry {
  id: number;
  timestamp: Date;
  level: LogLevel;
  service: string;
  message: string;
  // ... explicit types for everything
}

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
```

### 1.3 Extract sample data generators

Move data generation out of the component into `sampleData.ts`:

```typescript
// sampleData.ts
export function generateSampleLogs(count: number): LogEntry[] {
  // ... converted from the import's inline generator
}
```

---

## Phase 2: Register New Data-Parts

### 2.1 Add parts constants

In `packages/rich-widgets/src/parts.ts` (or engine's `parts.ts` if the parts are generic enough):

```typescript
export const RICH_PARTS = {
  logViewer: 'log-viewer',
  logViewerRow: 'log-viewer-row',
  logViewerLevelBadge: 'log-viewer-level-badge',
  // ... one entry per styled element
} as const;
```

**Naming convention:** `<widget>-<element>` in kebab-case.

### 2.2 Write CSS rules

In `packages/rich-widgets/src/theme/rich-widgets.css`:

```css
/* Log Viewer */
[data-part="log-viewer-row"] {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--hc-color-border);
  font-family: var(--hc-font-family);
  font-size: var(--hc-font-size);
  cursor: pointer;
}

[data-part="log-viewer-row"]:hover {
  background: var(--hc-color-row-hover);
}

[data-part="log-viewer-row"][data-state="selected"] {
  background: var(--hc-confirm-selected-bg);
  color: var(--hc-confirm-selected-fg);
}
```

**Rules for CSS conversion:**
- Replace every hardcoded color with the nearest `--hc-*` token
- Replace every hardcoded font with `var(--hc-font-family)`
- Replace every hardcoded border with a token or `var(--hc-color-border)`
- Keep structural properties (flex, grid, overflow) as-is
- Keep dynamic properties (width percentages, calculated positions) as inline styles

---

## Phase 3: Build the Component

### 3.1 Start with the outermost layout

The import's root `<div>` with full-page background becomes a simple container with a data-part:

```tsx
// Before (import):
<div style={{ width: "100%", height: "100vh", background: checkerBg, ... }}>

// After (ported):
<div data-part={RICH_PARTS.logViewer}>
```

The desktop shell provides the window chrome, background, and sizing. The widget just fills its container.

### 3.2 Replace primitives inside-out

Work from leaf nodes upward:
1. Replace `MacButton` → `<Btn>` from engine
2. Replace `MacCheckbox` → `<Checkbox>` from engine  
3. Replace custom lists → `<SelectableList>` or `<DataTable>` from engine
4. Replace the window chrome → remove it (shell handles it)
5. Replace inline-styled containers → `<div data-part="...">` with CSS rules

### 3.3 Wire up state

For Redux-managed state:

```typescript
// widgetState.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface LogViewerState {
  entries: StoredLogEntry[];
  levelFilter: LogLevel[];
  serviceFilter: string;
  searchQuery: string;
  selectedId: number | null;
}

const logViewerSlice = createSlice({
  name: 'logViewer',
  initialState: { ... },
  reducers: {
    addEntry(state, action: PayloadAction<StoredLogEntry>) { ... },
    setLevelFilter(state, action: PayloadAction<LogLevel[]>) { ... },
    // ...
  },
});
```

**Additional Redux cleanup rules:**
- reducers should accept **plain data**, not callback updaters;
- “seed helpers” should build a whole initial slice snapshot for Storybook;
- selectors or render helpers can rehydrate non-serializable convenience shapes like `Date` or `Set`;
- local transient state should remain local even after a widget gets a slice.

For Storybook stories:
- use props-based stories first,
- use `packages/rich-widgets/src/storybook/seededStore.tsx` when the widget already has a Redux slice,
- avoid brittle “click buttons in `play` just to reach state X” patterns unless there is no better short-term option.

### 3.4 Handle canvas-based rendering

For widgets that use `<canvas>` (oscilloscope, charts):
- Keep the canvas rendering logic
- Wrap it in a container with a data-part for the bezel/frame
- Read theme tokens from CSS custom properties via `getComputedStyle()` if needed
- The CRT overlay, grid colors, etc. can reference tokens

---

## Phase 4: Write Stories

### 4.1 Story file structure

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { LogViewer } from './LogViewer';
import { generateSampleLogs } from './sampleData';

const meta: Meta<typeof LogViewer> = {
  title: 'RichWidgets/LogViewer',
  component: LogViewer,
  parameters: {
    layout: 'fullscreen',  // rich widgets typically need full space
  },
};

export default meta;
type Story = StoryObj<typeof LogViewer>;

export const Default: Story = {
  args: {
    initialLogs: generateSampleLogs(200),
  },
};

export const Empty: Story = {
  args: {
    initialLogs: [],
  },
};

// ... more stories per the matrix from Phase 0.4
```

### 4.2 Theme stories

```typescript
import { HyperCardTheme } from '@hypercard/engine';

export const ModernTheme: Story = {
  decorators: [
    (Story) => (
      <HyperCardTheme theme="theme-modern">
        <Story />
      </HyperCardTheme>
    ),
  ],
  args: { initialLogs: generateSampleLogs(200) },
};
```

### 4.2 Seeded story guidance

Use the shared helpers instead of re-creating wrappers in every file:

```tsx
import {
  fixedFrameDecorator,
  fullscreenDecorator,
} from '../storybook/frameDecorators';

export const Default: Story = {
  args: { ... },
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  args: { ... },
  decorators: [fixedFrameDecorator(760, 420)],
};
```

When a widget has a Redux slice, use the shared seeded provider:

```tsx
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';

const seedSelectedRecord: SeedStore<MyWidgetStore> = (store) => {
  store.dispatch(selectRecord('row-42'));
  store.dispatch(setSearchQuery('critical'));
};
```

If you cannot write the story this way, stop and decide whether the widget needs:
- an `initial*` prop,
- a story-only seeded wrapper,
- or a real Redux slice.

### 4.3 Run Storybook to verify

```bash
# In a tmux session:
pnpm storybook
# Navigate to RichWidgets/LogViewer
# Check: Default, Empty, each theme, compact mode, etc.
```

---

## Phase 5: Integrate with Desktop

### 5.1 Create an AppManifest

```typescript
export const logViewerManifest: AppManifest = {
  id: 'log-viewer',
  name: 'Log Viewer',
  icon: '📜',
  launch: {
    mode: 'window',
    singleton: false,
    defaultWindow: { width: 900, height: 600 },
  },
};
```

### 5.2 Create a LaunchableAppModule

```typescript
export const logViewerModule: LaunchableAppModule = {
  manifest: logViewerManifest,
  state: {
    stateKey: 'app_log_viewer',
    reducer: logViewerSlice.reducer,
  },
  render: (params) => <LogViewer {...params} />,
};
```

---

## Checklist (copy for each widget port)

```markdown
- [ ] Read and understand the import file
- [ ] Build primitive mapping table
- [ ] Identify state boundaries (Redux vs. local)
- [ ] Plan story matrix
- [ ] Create directory structure and types
- [ ] Extract sample data generators
- [ ] Register new data-parts
- [ ] Write CSS rules using tokens
- [ ] Build component (replace primitives, wire state)
- [ ] Write Storybook stories (all variants)
- [ ] Verify under all themes in Storybook
- [ ] Run accessibility addon check
- [ ] Create AppManifest for desktop integration
- [ ] Update diary with lessons learned
- [ ] Commit and update changelog
```

---

## Token Quick Reference

When converting inline styles, use these token mappings:

| Inline Value | Token |
|-------------|-------|
| `#000` (text) | `var(--hc-color-fg)` |
| `#fff` (background) | `var(--hc-color-bg)` |
| `#c0c0c0` (gray bg) | `var(--hc-color-desktop-bg)` |
| `#777`, `#888` (muted) | `var(--hc-color-muted)` |
| `2px solid #000` (border) | `var(--hc-color-border)` or `var(--hc-btn-border)` |
| `Geneva, monospace` (font) | `var(--hc-font-family)` |
| `11px` (font size) | `var(--hc-font-size)` |
| `0px` (border radius) | `var(--hc-border-radius)` |
| `1px 1px 0 #000` (shadow) | `var(--hc-btn-shadow)` |
| selected bg `#000` | `var(--hc-confirm-selected-bg)` |
| selected fg `#fff` | `var(--hc-confirm-selected-fg)` |
| row odd bg | `var(--hc-color-row-odd)` |
| row even bg | `var(--hc-color-row-even)` |
| row hover bg | `var(--hc-color-row-hover)` |
| error color | `var(--hc-color-error)` |
| warning color | `var(--hc-color-warning)` |
| success color | `var(--hc-color-success)` |
