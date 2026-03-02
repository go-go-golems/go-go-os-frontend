---
Title: Implementation diary
Ticket: OS-09-PHASE1-BUG-FIXES
Status: active
Topics:
    - frontend
    - widgets
    - debugging
    - cleanup
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - packages/rich-widgets/src/kanban/KanbanBoard.tsx:Fixed module-level let nextId
    - packages/rich-widgets/src/calendar/types.ts:Fixed module-level let nextId
    - packages/rich-widgets/src/system-modeler/SystemModeler.tsx:Fixed module-level let idCounter via useRef
    - packages/rich-widgets/src/youtube-retro/YouTubeRetro.tsx:Fixed useMemo with Math.random
    - packages/rich-widgets/src/repl/MacRepl.tsx:Fixed startTime useState to useRef
    - packages/rich-widgets/src/deep-research/DeepResearch.tsx:Wired dead state into simulation
    - packages/rich-widgets/src/deep-research/sampleData.ts:Added filtering indices and opts to generateReport
    - packages/rich-widgets/src/oscilloscope/Oscilloscope.tsx:Added devicePixelRatio handling
    - packages/rich-widgets/src/logic-analyzer/LogicAnalyzer.tsx:Added devicePixelRatio handling
    - packages/rich-widgets/src/graph-navigator/GraphNavigator.tsx:Added velocity threshold to force simulation
ExternalSources: []
Summary: "Implementation diary for Phase 1 bug fixes across 10 widget files"
LastUpdated: 2026-03-02T18:00:00-05:00
WhatFor: "Track what changed, what worked, and what was tricky during Phase 1"
WhenToUse: "When reviewing Phase 1 changes or continuing cleanup work"
---

# Implementation Diary — OS-09-PHASE1-BUG-FIXES

## Step 1: Module-level mutable state fixes (Tasks 1-3)

### What changed

- **KanbanBoard.tsx:9** — Replaced `let nextId = 20` with `let idSeq = 0` + `Date.now()` seed. Chose timestamp-based IDs because `mkId()` is called from `TaskModal` (a sub-component outside KanbanBoard), so `useRef` can't be used without threading a ref through props.
- **calendar/types.ts:53** — Same approach: replaced `let nextId = 100` with `let evtSeq = 0` + `Date.now()` seed. This is a shared utility function called from MacCalendar.tsx:246.
- **SystemModeler.tsx:18** — Used `useRef(1)` + `useCallback` because `uid()` is only called inside the main component's `addBlock` handler (line 374).

### What worked

All three fixes applied cleanly. The KanbanBoard and calendar used the same pattern (timestamp+seq) since their ID generators are module-level functions called from sub-components.

### What was tricky

KanbanBoard's `mkId()` is called inside `TaskModal`, a standalone function component — not inside `KanbanBoard` itself. This means `useRef` inside `KanbanBoard` wouldn't be accessible there without prop drilling. The timestamp approach avoids this entirely.

---

## Step 2: YouTubeRetro useMemo fix (Task 4)

### What changed

- **YouTubeRetro.tsx:217** — Replaced `Math.random()` inside sort comparator with a deterministic shuffle using `Math.sin(seed + i)` where seed is derived from `currentVideo.id` (which is a `number`, not `string`).

### What was tricky

Initial implementation used `currentVideo.id.split('')` which fails because `YtVideo.id` is `number`, not `string`. TypeScript caught this. Fixed by using the numeric ID directly as the seed.

---

## Step 3: MacRepl startTime fix (Task 5)

### What changed

- **MacRepl.tsx:35** — Changed `const [startTime] = useState(Date.now())` to `const startTime = useRef(Date.now())`
- **MacRepl.tsx:223** — Updated read to `startTime.current`
- **MacRepl.tsx:341** — Removed `startTime` from `useCallback` dependency array (refs don't need to be deps)

### What worked

Clean 3-line fix. `useRef` was already imported.

---

## Step 4: DeepResearch dead state fix (Task 6)

### What changed

- **sampleData.ts** — Added `WEB_ONLY_INDICES` and `ACADEMIC_INDICES` sets marking which demo steps are web-only or academic. Added `opts` parameter to `generateReport()` with `webSearch` and `academicOnly` flags that adjust source count and report text.
- **DeepResearch.tsx:81-102** — Updated `startResearch()` to filter `DEMO_STEPS` based on `academicOnly` (skips web-only sources) and `webSearch` (skips non-academic sources). Passes opts to `generateReport()`.

### What worked

The checkboxes now produce visibly different research runs — toggling "Academic Only" skips Wikipedia and MIT Tech Review sources, and the report reflects the different source count.

---

## Step 5: devicePixelRatio fixes (Task 7)

### What changed

- **Oscilloscope.tsx:108-122** — Added DPR scaling at start of `draw` callback. Sets `canvas.width/height` to `logicalW * dpr` and applies `ctx.scale(dpr, dpr)` once. Uses logical dimensions for all drawing. Added `canvasWidth`, `canvasHeight` to useCallback deps.
- **LogicAnalyzer.tsx:125-139** — Identical approach.

### What worked

The one-time `ctx.scale(dpr, dpr)` approach avoids needing to modify any drawing coordinates. The `if (canvas.width !== ...)` guard prevents re-scaling on every frame.

---

## Step 6: GraphNavigator velocity threshold (Task 8)

### What changed

- **GraphNavigator.tsx** — Added `totalEnergy` accumulator in the force simulation loop. After updating positions, checks if `totalEnergy > 0.1`. If below threshold, stops requestAnimationFrame (sets `frameRef.current = 0`). Added `stepFnRef` to store the step function for restart. `endDrag` perturbs all velocities slightly and restarts animation if it had stopped.

### What was tricky

- `stepFnRef` had to be declared before the `useEffect` that creates the `step` function (TypeScript caught "used before declaration" error).
- Restart on drag end: chose to perturb all node velocities by a small random amount, which naturally restarts the simulation through the `totalEnergy` threshold check.

---

## Verification

- TypeScript check: no new errors introduced (all remaining errors are pre-existing: ChartView RadioButton type, launcher modules missing dep, Oscilloscope Checkbox type)
- 10 files changed, 104 insertions, 36 deletions
- Commit: `882ba2a fix(rich-widgets): Phase 1 bug fixes across 10 widget files (OS-09)`

## Code review instructions

1. **Module-level state fixes (Tasks 1-3):** Verify that `Date.now()` + seq counter IDs won't collide. The seq counter is still module-level but now combined with a timestamp, making collisions extremely unlikely.
2. **YouTubeRetro (Task 4):** Verify the deterministic shuffle produces reasonable distribution. `Math.sin(seed + i)` is a simple hash — not cryptographically uniform but sufficient for related video ordering.
3. **devicePixelRatio (Task 7):** The DPR guard `if (canvas.width !== logicalW * dpr)` prevents re-scaling every frame but may not handle DPR changes (e.g., moving window between monitors). This is acceptable for a demo widget.
4. **GraphNavigator (Task 8):** The velocity threshold of `0.1` was chosen empirically. If the graph appears to settle too early, lower it; if it runs too long, raise it.
