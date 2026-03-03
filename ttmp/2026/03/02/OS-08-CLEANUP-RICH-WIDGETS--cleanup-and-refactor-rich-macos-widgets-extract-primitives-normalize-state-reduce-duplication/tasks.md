# Tasks

## DONE

- [x] Analyze all 20 widgets for cleanup opportunities (5 parallel agents)
- [x] Write full widget-by-widget cleanup report (design doc 01)
- [x] Upload report to reMarkable

### Phase 1: Bug Fixes (OS-09)
- [x] Fix module-level mutable state in KanbanBoard, MacCalendar/types, SystemModeler
- [x] Fix YouTubeRetro useMemo with Math.random()
- [x] Fix MacRepl startTime useState → useRef
- [x] Fix SystemModeler useEffect missing dependencies
- [x] Remove dead state from DeepResearch (webSearch, academicOnly)
- [x] Add devicePixelRatio to Oscilloscope and LogicAnalyzer canvas
- [x] Add velocity threshold to GraphNavigator force simulation

### Phase 2: Extract Shared Primitives (OS-10)
- [x] WidgetToolbar primitive (12 widgets)
- [x] WidgetStatusBar primitive (14 widgets)
- [x] ModalOverlay primitive (9 widgets)
- [x] ProgressBar primitive (6 widgets)
- [x] EmptyState primitive (7 widgets)
- [x] SearchBar primitive (9 widgets)
- [x] Separator primitive (7 widgets)

### Phase 3: Extract Specialized Primitives (OS-11)
- [x] CrtDisplay primitive (Oscilloscope + LogicAnalyzer)
- [x] LabeledSlider primitive (merge OscSlider + LaSlider)
- [x] useAnimationLoop hook (3 widgets)
- [x] CommandPalette primitive (MacCalc + MacCalendar)
- [x] ButtonGroup primitive (3 widgets)

### Phase 4: Adopt Engine Components (OS-12)
- [x] Replace hand-rolled radio buttons with engine RadioButton (GameFinder, DeepResearch, StreamLauncher)
- [x] Remove orphaned radio CSS and data-part constants
- [x] Add Btn to MacRepl

### Phase 5: Naming Standardization (OS-13)
- [x] Standardize data-part prefixes to 2-letter abbreviations (5 widgets)
- [x] Standardize RICH_PARTS import as P alias (27 files)
- [x] Migrate ControlRoom CSS to CSS variables (~80 hex → var())

### Phase 6: State Restructuring (OS-14)
- [x] KanbanBoard: 8 useState → useReducer (12 actions)
- [x] RetroMusicPlayer: 13 useState → useReducer (14 actions)
- [x] MacCalc: 12 useState → useReducer (19 actions)
- [x] Evaluate and skip Oscilloscope (14 independent slider/toggle states)
- [x] Evaluate and skip MacCalendar (5 main states, below threshold)

### Post-Cleanup Code Review
- [x] Audit widget sizes and modularity (5 monolithic widgets identified)
- [x] Audit state management (6 remaining useReducer candidates prioritized)
- [x] Audit CSS theming (29 standalone hex violations, 72 dead data-parts)
- [x] Audit code quality (9 TS errors, 0 React.memo, 6 bare timeouts)
- [x] Audit primitive adoption (ButtonGroup 0/20, SearchBar 1/6)
- [x] Write post-cleanup code review report (design doc 02)
- [x] Upload to reMarkable

### Independent Re-Review (2026-03-03)
- [x] Re-review OS-07 and OS-08 assumptions against current code and live Storybook
- [x] Write independent analysis report (design doc 03)
- [x] Upload independent review bundle to reMarkable
