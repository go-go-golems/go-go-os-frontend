# Tasks

## Phase 1: Package scaffolding and primitives

- [ ] 1. Create `packages/rich-widgets` package with package.json, tsconfig, vitest config
- [ ] 2. Register in pnpm-workspace, storybook config, and build scripts
- [ ] 3. Create `Sparkline` primitive widget with stories
- [ ] 4. Create `Slider` primitive widget with stories

## Phase 2: LogViewer integration

- [ ] 5. Convert log-viewer types and sample data generators to TypeScript
- [ ] 6. Create `logViewerSlice.ts` Redux slice
- [ ] 7. Build `LogViewer.tsx` composing engine widgets + new primitives
- [ ] 8. Write comprehensive Storybook stories for LogViewer

## Phase 3: Developer tools

- [ ] 9. Port `repl.jsx` → `MacRepl.tsx` with stories
- [ ] 10. Port `oscilloscope.jsx` → `Oscilloscope.tsx` with stories
- [ ] 11. Port `logic-analyzer.jsx` → `LogicAnalyzer.tsx` with stories
- [ ] 12. Port `chart-widget.jsx` → `ChartView.tsx` with stories

## Phase 4: Productivity widgets

- [ ] 13. Port `mactask.jsx` → `KanbanBoard.tsx` with CommandPalette + stories
- [ ] 14. Port `macwrite.jsx` → `MacWrite.tsx` with stories
- [ ] 15. Port `maccal.jsx` → `MacCalendar.tsx` with stories

## Phase 5: Data visualization

- [ ] 16. Port `graph-navigator.jsx` → `GraphNavigator.tsx` with stories
- [ ] 17. Port `node-editor.jsx` → `NodeEditor.tsx` with stories

## Phase 6: Entertainment/utility widgets

- [ ] 18. Port `maccalc.jsx` → `MacCalculator.tsx` with stories
- [ ] 19. Port `deep-research-mac.jsx` → `DeepResearch.tsx` with stories
- [ ] 20. Port `gamefinder.jsx` → `GameFinder.tsx` with stories
- [ ] 21. Port `spotify-retro.jsx` → `RetroMusicPlayer.tsx` with stories
- [ ] 22. Port remaining: steam-launcher, stream-launcher, youtube-retro with stories

## Phase 7: Desktop integration

- [ ] 23. Register all widgets as launchable apps via AppManifest
- [ ] 24. Integration testing with DesktopShell
