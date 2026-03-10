---
Title: ""
Ticket: ""
Status: ""
Topics: []
DocType: ""
Intent: ""
Owners: []
RelatedFiles:
    - Path: workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoard.tsx
      Note: Kanban board wrapper that renders inside window body
    - Path: workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanHeaderBar.tsx
      Note: Motivating example - hardcoded min-width:140px and width:140px in toolbar
ExternalSources: []
Summary: ""
LastUpdated: 0001-01-01T00:00:00Z
WhatFor: ""
WhenToUse: ""
---


# Implementation Plan: Auto-Measure Window Content Minimum Size

## Problem Statement

In the Wesen-OS windowing system, windows can be resized below the intrinsic minimum
width of their content. The kanban board's `widget-toolbar` (containing a title with
`min-width: 140px`, a button, separators, and a search input with `width: 140px`)
requires ~354px minimum, but the windowing system uses a global default of 220px.

Currently, minimum window sizes are either hardcoded global defaults (220x140 in the
interaction controller, 180x120 in the Redux state) or must be manually specified in
`OpenWindowPayload`. There is no mechanism for content to declare or report its own
minimum size requirements.

## Goal

Allow window content to **automatically bubble up** its intrinsic minimum size to the
windowing system, so that:

1. The window cannot be resized below the content's hard minimum during drag
2. The Redux state reflects the content-derived minimum
3. No manual `minW`/`minH` specification is needed in `OpenWindowPayload`
4. Content changes (e.g., new toolbar buttons) trigger re-measurement

## Approach: Zero-Width Measurement in useLayoutEffect

Render the window body content, then immediately (before paint) measure its intrinsic
minimum by temporarily setting the body container to `width: 0` and reading `scrollWidth`.
This captures all "hard" constraints: elements with `min-width`, fixed-width inputs,
non-shrinkable flex items, button text widths. Wrappable text collapses to single-word
width, which is the desired behavior -- we want the structural floor, not the comfortable
size.

### Why useLayoutEffect + scrollWidth

- `useLayoutEffect` runs synchronously after DOM mutation but before browser paint
- No visual flicker: the 0-width state is never rendered to screen
- `scrollWidth` at `width: 0` gives the minimum content width including overflow
- Simple, no hidden probe elements or duplicate rendering needed
- Works with any CSS layout (flex, grid, block)

## Architecture Overview

```
WindowBody mounts / content changes
  |
  v
useLayoutEffect:
  el.style.width = '0px'
  minW = el.scrollWidth
  el.style.width = '' (restore)
  |
  v
onContentMinSize(windowId, { minW, minH })
  |
  v
dispatch(updateWindowMinSize({ id, minW, minH }))
  |
  v
WindowInstance.minW updated in Redux
  |
  v
Interaction controller reads per-window minW during drag
Reducer clamps on commit
```

## Detailed Changes by File

### Layer 1: Redux State -- New Reducer Action

**File:** `packages/engine/src/desktop/core/state/windowingSlice.ts`

Add a new `updateWindowMinSize` reducer action after `resizeWindow` (line ~131):

```ts
updateWindowMinSize(
  state,
  action: PayloadAction<{ id: string; minW?: number; minH?: number }>
) {
  const win = state.windows[action.payload.id];
  if (!win) return;
  if (action.payload.minW !== undefined) {
    win.minW = Math.max(win.minW, action.payload.minW);
  }
  if (action.payload.minH !== undefined) {
    win.minH = Math.max(win.minH, action.payload.minH);
  }
}
```

Note: uses `Math.max` so the content measurement can only raise the minimum, never lower
it below the payload-specified or default minimum. This is intentional -- the
`OpenWindowPayload.minW` serves as a floor, the content measurement can only push it
higher.

Export it alongside the other actions.

**Also export from:** `packages/engine/src/desktop/core/state/windowingSlice.ts` exports block (line ~186).

### Layer 2: Per-Window Constraints in Interaction Controller

**File:** `packages/engine/src/components/shell/windowing/useWindowInteractionController.ts`

Currently, `constraints` is a static `WindowInteractionConstraints` object (lines 40, 143-144).
During resize, the same `constraints.minWidth` is used for every window.

**Change:** Make constraints support per-window lookup.

Option A (minimal change): Add a `getMinSizeForWindow` callback:

```ts
export interface WindowInteractionControllerOptions {
  // ... existing fields ...
  constraints?: WindowInteractionConstraints;
  getMinSizeForWindow?: (windowId: string) => { minWidth: number; minHeight: number } | undefined;
}
```

Then at lines 143-144, prefer the per-window value:

```ts
const perWindow = getMinSizeForWindow?.(active.windowId);
active.latestWidth = Math.max(
  perWindow?.minWidth ?? constraints?.minWidth ?? 220,
  active.startWidth + dx
);
active.latestHeight = Math.max(
  perWindow?.minHeight ?? constraints?.minHeight ?? 140,
  active.startHeight + dy
);
```

Option B (cleaner but larger change): Replace the static `constraints` with a function
`(windowId: string) => WindowInteractionConstraints`. This is cleaner but changes the
call signature for all consumers. Prefer Option A for backwards compatibility.

### Layer 3: Wire Per-Window Lookup in Desktop Shell Controller

**File:** `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`

Add a `getMinSizeForWindow` callback that reads from Redux state:

```ts
const getMinSizeForWindow = useCallback(
  (windowId: string) => {
    const state = store.getState() as ShellState;
    const win = state.windowing.windows[windowId];
    if (!win) return undefined;
    return { minWidth: win.minW, minHeight: win.minH };
  },
  [store]
);
```

Pass it to `useWindowInteractionController` at line 669:

```ts
const { beginMove, beginResize } = useWindowInteractionController({
  // ... existing fields ...
  constraints: { minX: 0, minY: 0, minWidth: 220, minHeight: 140 },
  getMinSizeForWindow,
});
```

Also add a handler for the content measurement callback:

```ts
const handleContentMinSize = useCallback(
  (windowId: string, size: { minW: number; minH: number }) => {
    dispatch(updateWindowMinSize({ id: windowId, ...size }));
  },
  [dispatch]
);
```

This needs to be threaded through `renderWindowBody` or exposed as a prop on `WindowSurface`.

### Layer 4: Measurement Hook

**New file:** `packages/engine/src/components/shell/windowing/useContentMinSize.ts`

A standalone hook that encapsulates the measurement logic:

```ts
import { useLayoutEffect, useRef, useState } from 'react';

export interface ContentMinSize {
  minW: number;
  minH: number;
}

export function useContentMinSize(
  onMinSize?: (size: ContentMinSize) => void,
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const lastReportedRef = useRef<string>('');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Measure minimum width
    const savedWidth = el.style.width;
    el.style.width = '0px';
    const minW = el.scrollWidth;
    el.style.width = savedWidth;

    // Measure minimum height
    const savedHeight = el.style.height;
    el.style.height = '0px';
    const minH = el.scrollHeight;
    el.style.height = savedHeight;

    // Only report if changed (avoid dispatch loops)
    const key = `${minW}:${minH}`;
    if (key !== lastReportedRef.current) {
      lastReportedRef.current = key;
      onMinSize?.({ minW, minH });
    }
  });
  // Note: no dependency array -- runs every render to catch content changes.
  // The key-based dedup prevents unnecessary dispatches.

  return ref;
}
```

Design decisions:
- **No dependency array**: runs every layout to catch any content change (new buttons, text changes). The key-based dedup prevents unnecessary callbacks.
- **Ref-based**: returns a ref the consumer attaches to the container div.
- **Separate width/height measurement**: measures each axis independently by zeroing one at a time.

### Layer 5: WindowBody Integration

**File:** `packages/engine/src/components/shell/windowing/WindowSurface.tsx`

`WindowBody` (line 25) needs to use the measurement hook:

```tsx
interface WindowBodyProps {
  children?: ReactNode;
  onMinSize?: (size: ContentMinSize) => void;
}

const WindowBody = memo(function WindowBody({ children, onMinSize }: WindowBodyProps) {
  const ref = useContentMinSize(onMinSize);
  return (
    <div ref={ref} data-part={PARTS.windowingWindowBody}>
      {children}
    </div>
  );
});
```

`WindowSurfaceProps` gets a new callback:

```ts
export interface WindowSurfaceProps {
  // ... existing fields ...
  onContentMinSize?: (windowId: string, size: ContentMinSize) => void;
}
```

`WindowSurfaceBase` threads it to `WindowBody`:

```tsx
const handleMinSize = useCallback(
  (size: ContentMinSize) => onContentMinSize?.(window.id, size),
  [onContentMinSize, window.id]
);
// ...
<WindowBody onMinSize={handleMinSize}>{children}</WindowBody>
```

Update `areWindowSurfacePropsEqual` to include `onContentMinSize`.

### Layer 6: WindowLayer Threading

**File:** `packages/engine/src/components/shell/windowing/WindowLayer.tsx`

This component maps windows to `WindowSurface` instances. It needs to accept and pass
through the `onContentMinSize` callback.

### Layer 7: Re-measurement on Content Changes

The `useLayoutEffect` with no dependency array handles this -- it runs on every render.
If window content changes (e.g., toolbar gains a button), the next render triggers
re-measurement. The key-based dedup in the hook prevents redundant dispatches.

For more expensive scenarios (content that rarely changes), a `ResizeObserver` could be
used instead:

```ts
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const observer = new ResizeObserver(() => measure());
  observer.observe(el);
  return () => observer.disconnect();
}, []);
```

But the `useLayoutEffect` approach is simpler and sufficient for the current use case.

## Edge Cases and Considerations

### Race condition: measurement before content mounts
If `WindowBody` mounts before its children have fully rendered (e.g., async content),
the initial measurement may be too small. Mitigation: the hook runs every layout, so
it will re-measure once the real content appears.

### Content with flex-grow or percentage widths
Elements that use `flex: 1` or `width: 50%` will collapse to 0 at zero parent width.
This is correct -- they have no intrinsic minimum. Only elements with hardcoded
`min-width`, `width` in px, or non-wrapping text contribute to the measured minimum.

### Very large content minimums
If content has an unusually large minimum (e.g., a wide table), the window will have a
high minW. This is correct behavior but could surprise users. Consider capping the
measured minimum at some reasonable maximum (e.g., 80% of viewport width).

### Performance
`useLayoutEffect` with no dep array runs every render. For most windows this is fine
(the DOM read is fast). If profiling shows issues, switch to `ResizeObserver` which
only fires on actual size changes.

### minH measurement
Measuring minimum height with `height: 0` + `scrollHeight` works for block/flex-column
layouts. For flex-row layouts where height is determined by the tallest item, this may
undercount. In practice, most window content flows vertically, so this should be
accurate for the majority of cases. Height measurement is lower priority than width.

### Interaction between payload minW and measured minW
The `Math.max` in the reducer ensures the content measurement can only raise the floor:
- `OpenWindowPayload.minW = 180` (default) -> content measures 354 -> `win.minW = 354`
- `OpenWindowPayload.minW = 500` (explicit) -> content measures 354 -> `win.minW = 500`

This is the correct behavior: explicit payload values serve as a guaranteed floor.

## Testing Strategy

### Unit tests (windowingSlice)
- `updateWindowMinSize` raises minW/minH when measured > current
- `updateWindowMinSize` does not lower minW/minH below current value
- `resizeWindow` respects updated minW/minH after content measurement
- Missing window id is a no-op

### Unit tests (useContentMinSize hook)
- Returns a ref that can be attached to a div
- Calls onMinSize with measured values on mount
- Does not call onMinSize again if values haven't changed
- Re-calls onMinSize when content changes cause new scrollWidth

### Unit tests (useWindowInteractionController)
- `getMinSizeForWindow` is preferred over global `constraints.minWidth`
- Falls back to global constraints when `getMinSizeForWindow` returns undefined
- Falls back to hardcoded defaults when neither is provided

### Integration test
- Open a window with content that has known minimum widths
- Attempt to resize below content minimum
- Verify the window stops at the content-derived minimum
- Add content (e.g., wider toolbar item) and verify minW updates

## File Inventory

| File | Change Type | Description |
|------|-------------|-------------|
| `windowingSlice.ts` | Modify | Add `updateWindowMinSize` reducer |
| `useWindowInteractionController.ts` | Modify | Add `getMinSizeForWindow` callback, per-window constraint lookup |
| `useDesktopShellController.tsx` | Modify | Wire `getMinSizeForWindow` and `handleContentMinSize` |
| `useContentMinSize.ts` | **New** | Measurement hook |
| `WindowSurface.tsx` | Modify | Add `onContentMinSize` prop, wire to `WindowBody` |
| `WindowLayer.tsx` | Modify | Thread `onContentMinSize` callback |
| `types.ts` (windowing) | Modify | No change needed -- `DesktopWindowDef` already sufficient |
| `types.ts` (state) | No change | `WindowInstance` already has `minW`/`minH` |
| `windowing.test.ts` | Modify | Add tests for `updateWindowMinSize` |
| `useContentMinSize.test.ts` | **New** | Hook unit tests |

## Implementation Order

Recommended bottom-up order to keep the system working at each step:

1. **Redux reducer** (`updateWindowMinSize`) -- pure state, easy to test in isolation
2. **Interaction controller** (`getMinSizeForWindow`) -- backwards compatible, falls back to existing behavior
3. **Measurement hook** (`useContentMinSize`) -- standalone, testable without windowing
4. **WindowBody/WindowSurface** -- wire the hook to the DOM
5. **WindowLayer** -- pass-through threading
6. **Desktop shell controller** -- wire everything together
7. **Tests** -- unit + integration
