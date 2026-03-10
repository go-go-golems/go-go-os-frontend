# Tasks

## TODO

- [x] Add tasks here

- [x] Add updateWindowMinSize reducer action to windowingSlice.ts
- [x] Add getMinSizeForWindow callback to useWindowInteractionController.ts with per-window constraint lookup
- [x] Create useContentMinSize.ts measurement hook (useLayoutEffect + scrollWidth at width:0)
- [x] Wire useContentMinSize into WindowBody in WindowSurface.tsx with onContentMinSize callback
- [x] Thread onContentMinSize through WindowLayer.tsx
- [x] Wire getMinSizeForWindow and handleContentMinSize in useDesktopShellController.tsx
- [x] Add unit tests for updateWindowMinSize reducer (raise/no-lower/no-op semantics)
- [x] Add unit tests for useContentMinSize hook (mount, dedup, re-measure)
- [x] Add unit tests for per-window constraint lookup in interaction controller
- [ ] Integration test: resize clamped to content-derived minimum
