# Tasks — OS-13-PHASE5-NAMING-STANDARDIZATION

## Prefix Rename (5 widgets)

- [x] Rename LogViewer: log-viewer-* → lv-* (parts.ts, LogViewer.tsx, log-viewer.css)
- [x] Rename ChartView: chart-view-* → cv-* (parts.ts, ChartView.tsx, chart-view.css)
- [x] Rename MacWrite: mac-write-* → mw-* (parts.ts, MacWrite.tsx, mac-write.css)
- [x] Rename KanbanBoard: kanban-* → kb-* (parts.ts, KanbanBoard.tsx, kanban.css)
- [x] Rename NodeEditor: node-editor-* → ne-* (parts.ts, NodeEditor.tsx, node-editor.css)

## Import Standardization

- [x] Change all 27 `import { RICH_PARTS }` to `import { RICH_PARTS as P }`

## CSS Variable Migration

- [x] Migrate ControlRoom hardcoded hex colors to var(--hc-color-*) in control-room.css

## Verification

- [x] Grep for old prefixes — zero matches (except launcher module names)
- [x] Grep for hardcoded hex in control-room.css — only fallback values and decorative #33ff33
- [x] TypeScript check passes (no new errors)
- [x] Diary updated, changelog updated, docmgr doctor passes
