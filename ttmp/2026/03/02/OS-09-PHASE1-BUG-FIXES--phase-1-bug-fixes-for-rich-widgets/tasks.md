# Tasks — OS-09-PHASE1-BUG-FIXES

## Bug Fixes

- [x] Task 1: Fix module-level `let nextId` in KanbanBoard.tsx:9 — timestamp+seq ID
- [x] Task 2: Fix module-level `let nextId` in calendar/types.ts:53 — timestamp+seq ID
- [x] Task 3: Fix module-level `let idCounter` in SystemModeler.tsx:18 — useRef inside component
- [x] Task 4: Fix useMemo with Math.random() in YouTubeRetro.tsx:217 — deterministic shuffle
- [x] Task 5: Fix startTime useState → useRef in MacRepl.tsx
- [x] Task 6: Wire dead state (webSearch, academicOnly) in DeepResearch.tsx:70-71
- [x] Task 7: Add devicePixelRatio to Oscilloscope.tsx and LogicAnalyzer.tsx canvas
- [x] Task 8: Add velocity threshold to GraphNavigator.tsx force simulation

## Verification

- [x] TypeScript check passes (no new errors, only pre-existing)
- [ ] All affected widget stories render without errors (visual check pending)
- [ ] No new console warnings/errors (visual check pending)
- [ ] Desktop integration story launches all 20 widgets (visual check pending)
- [x] Diary updated with all steps
- [x] Changelog updated
- [x] `docmgr doctor` passes
