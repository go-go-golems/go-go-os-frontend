---
Title: Implementation diary
Ticket: OS-13-PHASE5-NAMING-STANDARDIZATION
Status: active
Topics:
    - frontend
    - widgets
    - css
    - cleanup
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - packages/rich-widgets/src/parts.ts:Renamed 61 data-part constants for 5 widgets
    - packages/rich-widgets/src/log-viewer/LogViewer.tsx:Renamed logViewer→lv references
    - packages/rich-widgets/src/theme/log-viewer.css:Renamed log-viewer→lv selectors
    - packages/rich-widgets/src/chart-view/ChartView.tsx:Renamed chartView→cv references
    - packages/rich-widgets/src/theme/chart-view.css:Renamed chart-view→cv selectors
    - packages/rich-widgets/src/mac-write/MacWrite.tsx:Renamed macWrite→mw references
    - packages/rich-widgets/src/theme/mac-write.css:Renamed mac-write→mw selectors
    - packages/rich-widgets/src/kanban/KanbanBoard.tsx:Renamed kanban→kb references
    - packages/rich-widgets/src/theme/kanban.css:Renamed kanban→kb selectors
    - packages/rich-widgets/src/node-editor/NodeEditor.tsx:Renamed nodeEditor→ne references
    - packages/rich-widgets/src/theme/node-editor.css:Renamed node-editor→ne selectors
    - packages/rich-widgets/src/theme/control-room.css:Migrated ~80 hex colors to CSS variables
ExternalSources: []
Summary: "Implementation diary for Phase 5: naming standardization and CSS variable migration"
LastUpdated: 2026-03-02T22:00:00-05:00
WhatFor: "Track what changed during Phase 5 naming cleanup"
WhenToUse: "When reviewing Phase 5 changes or debugging naming issues"
---

# Implementation Diary — OS-13-PHASE5-NAMING-STANDARDIZATION

## Step 1: Rename 5 widget prefixes to 2-letter convention

### What changed

Renamed data-part constants, CSS selectors, and TSX references for 5 widgets that used verbose prefixes:

| Widget | Old Prefix | New Prefix | Constants |
|--------|-----------|------------|-----------|
| LogViewer | `log-viewer-*` / `logViewer*` | `lv-*` / `lv*` | 18 |
| ChartView | `chart-view-*` / `chartView*` | `cv-*` / `cv*` | 6 |
| MacWrite | `mac-write-*` / `macWrite*` | `mw-*` / `mw*` | 9 |
| KanbanBoard | `kanban-*` / `kanban*` | `kb-*` / `kb*` | 19 |
| NodeEditor | `node-editor-*` / `nodeEditor*` | `ne-*` / `ne*` | 9 |

Each rename touched 3 places: parts.ts (key + value), CSS file (selectors), TSX file (RICH_PARTS references).

### What was tricky

The `kanban` prefix required careful ordering — `kanbanColumnHeader` must be renamed before `kanbanColumn` to avoid partial matches. Same for `kanbanCardTitle` vs `kanbanCard` and `kanbanModalOverlay` vs `kanbanModal`.

### Commit

`eeb4391 refactor(rich-widgets): rename 5 widget prefixes to 2-letter convention`

---

## Step 2: Standardize import alias RICH_PARTS → P

### What changed

Changed all 27 files that import `RICH_PARTS` from `import { RICH_PARTS }` to `import { RICH_PARTS as P }`, and replaced all `RICH_PARTS.xxx` usages with `P.xxx`.

This reduces visual noise in JSX — `data-part={P.lvTable}` vs `data-part={RICH_PARTS.logViewerTable}`.

### Commit

`dd7db69 refactor(rich-widgets): standardize import alias RICH_PARTS → P across 27 files`

---

## Step 3: Migrate ControlRoom hardcoded hex to CSS variables

### What changed

Replaced ~80 hardcoded hex color values in `control-room.css` with `var(--hc-color-*)` references:

| Hex | Mapped To | Usage |
|-----|-----------|-------|
| `#c0c0c0` | `var(--hc-color-alt, #c0c0c0)` | Panel backgrounds |
| `#fff` | `var(--hc-color-bg)` | Highlight borders, track backgrounds |
| `#808080` | `var(--hc-color-border)` | Shadow borders, labels via `--hc-color-muted` |
| `#000` | `var(--hc-color-fg)` | Foreground, text, dark fills |
| `#333` | `var(--hc-color-fg)` | Bar fill |
| `#f00` | `var(--hc-color-error, #f00)` | Alert bars, error log lines |
| `#886600` | `var(--hc-color-warning, #886600)` | Warning log lines |
| `#1a1a1a` | `var(--hc-color-fg)` | Seven-seg display background |
| `#dfdfdf` | `var(--hc-color-alt, #dfdfdf)` | Toggle on state, knob gradient |

**Kept as-is**: `#33ff33` (seven-segment digit color + text-shadow) — decorative CRT effect that should not follow theme.

### Commit

`5144270 refactor(rich-widgets): migrate ControlRoom CSS from hardcoded hex to var(--hc-color-*)`

---

## Verification

- `grep` for old prefixes (log-viewer-, chart-view-, mac-write-, kanban-, node-editor-) in src/ → zero matches (except launcher module names which are correct)
- `grep` for `import { RICH_PARTS }` (without alias) → zero matches
- `grep` for hardcoded hex in control-room.css → only fallback values inside `var()` and decorative `#33ff33`
- TypeScript check: no new errors

## Code review instructions

1. **Prefix renames** — Verify CSS selectors and TSX `data-part` references match. Spot-check a few entries in each widget.
2. **Import alias** — All 27 files should use `import { RICH_PARTS as P }` and `P.xxx` syntax.
3. **ControlRoom CSS** — The `--hc-color-bg` for `#fff` assumes the theme's bg is white/light. The `--hc-color-fg` for `#000`/`#1a1a1a` assumes dark foreground. This maps correctly to the classic Mac OS 7 aesthetic but may need adjustment for dark themes.
