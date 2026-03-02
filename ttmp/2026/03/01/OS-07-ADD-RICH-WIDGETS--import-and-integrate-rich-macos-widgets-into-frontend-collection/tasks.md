# Tasks

## Phase 1: Package scaffolding and primitives

- [x] 1. Create `packages/rich-widgets` package with package.json, tsconfig, vitest config
- [x] 2. Register in pnpm-workspace, storybook config, and build scripts
- [x] 3. Create `Sparkline` primitive widget with stories
- [ ] 4. Create `Slider` primitive widget with stories

## Phase 2: LogViewer integration

- [x] 5. Convert log-viewer types and sample data generators to TypeScript
- [ ] 6. Create `logViewerSlice.ts` Redux slice
- [x] 7. Build `LogViewer.tsx` composing engine widgets + new primitives
- [x] 8. Write comprehensive Storybook stories for LogViewer

## Phase 3: Developer tools

- [x] 9. Port `repl.jsx` → `MacRepl.tsx` with stories
- [x] 10. Port `oscilloscope.jsx` → `Oscilloscope.tsx` with stories
- [x] 11. Port `logic-analyzer.jsx` → `LogicAnalyzer.tsx` with stories
- [x] 12. Port `chart-widget.jsx` → `ChartView.tsx` with stories

## Phase 4: Productivity widgets

- [x] 13. Port `mactask.jsx` → `KanbanBoard.tsx` with CommandPalette + stories
- [x] 14. Port `macwrite.jsx` → `MacWrite.tsx` with stories
- [x] 15. Port `maccal.jsx` → `MacCalendar.tsx` with stories

## Phase 5: Data visualization

- [x] 16. Port `graph-navigator.jsx` → `GraphNavigator.tsx` with stories
- [x] 17. Port `node-editor.jsx` → `NodeEditor.tsx` with stories

## Phase 6: Entertainment/utility widgets

- [x] 18. Port `maccalc.jsx` → `MacCalc.tsx` with stories
- [x] 19. Port `deep-research-mac.jsx` → `DeepResearch.tsx` with stories
- [ ] 20. Port `gamefinder.jsx` → `GameFinder.tsx` with stories
- [ ] 21. Port `spotify-retro.jsx` → `RetroMusicPlayer.tsx` with stories
- [ ] 22. Port remaining: steam-launcher, stream-launcher, youtube-retro with stories

## Phase 7: Desktop integration

- [ ] 23. Register all widgets as launchable apps via AppManifest
- [ ] 24. Integration testing with DesktopShell
