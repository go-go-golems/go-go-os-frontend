---
Title: Widget Porting Playbook
Ticket: OS-07-ADD-RICH-WIDGETS
Status: active
Topics:
    - frontend
    - widgets
    - storybook
    - redux
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

A repeatable process for converting external React sketches (inline-styled, self-contained JSX) into go-go-os framework widgets that use data-parts, CSS tokens, Redux state, and Storybook stories.

**This playbook is a living document.** It will be updated with lessons learned from each widget port during OS-07.

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
| `items` / core data | Global | Yes | Should persist, observable by other widgets |
| `filterValues` | Widget | Yes | Useful to persist across window close/reopen |
| `selected` | Widget | Maybe | Depends on whether selection is meaningful externally |
| `hoverState` | Local | No | Pure UI transient, no value in persisting |
| `dragPosition` | Local | No | Frame-by-frame UI state |

**Rule of thumb:** If another part of the desktop would ever want to read or react to this state, it belongs in Redux. If it's purely visual/transient, keep it local.

### 0.4 Plan the Story Matrix

Before writing code, list the Storybook stories you'll need:

1. **Default** — Widget with typical data, default settings
2. **Empty** — Widget with no data (empty state)
3. **Loading** — Widget in a loading/streaming state
4. **Filtered** — Widget with active filters showing reduced data
5. **Themed** — Widget under each theme (classic, modern, macos1)
6. **Compact** — Widget in compact/minimal mode if applicable
7. **Error state** — Widget showing error conditions
8. **Interactive** — Story demonstrating key user interactions

---

## Phase 1: Set Up the Widget Directory

### 1.1 Create the directory structure

```
packages/rich-widgets/src/<widget-name>/
  <WidgetName>.tsx        # Main component
  <WidgetName>.stories.tsx # Storybook stories
  types.ts                 # TypeScript interfaces
  sampleData.ts            # Test data generators
  <widgetName>Slice.ts     # Redux slice (if applicable)
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
// widgetSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface LogViewerState {
  entries: LogEntry[];
  levelFilter: Set<LogLevel>;
  serviceFilter: string;
  searchQuery: string;
  selectedId: number | null;
}

const logViewerSlice = createSlice({
  name: 'logViewer',
  initialState: { ... },
  reducers: {
    addEntry(state, action: PayloadAction<LogEntry>) { ... },
    setLevelFilter(state, action: PayloadAction<Set<LogLevel>>) { ... },
    // ...
  },
});
```

For Storybook stories, provide a mock store or use the component's props-based API.

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
