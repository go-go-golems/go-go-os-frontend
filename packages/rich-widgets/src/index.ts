// Primitives
export { Sparkline, type SparklineProps } from './primitives/Sparkline';
export { WidgetToolbar, type WidgetToolbarProps } from './primitives/WidgetToolbar';
export { WidgetStatusBar, type WidgetStatusBarProps } from './primitives/WidgetStatusBar';
export { ModalOverlay, type ModalOverlayProps } from './primitives/ModalOverlay';
export { ProgressBar, type ProgressBarProps } from './primitives/ProgressBar';
export { EmptyState, type EmptyStateProps } from './primitives/EmptyState';
export { SearchBar, type SearchBarProps } from './primitives/SearchBar';
export { Separator, type SeparatorProps } from './primitives/Separator';
export {
  LabeledSlider,
  type LabeledSliderProps,
} from './primitives/LabeledSlider';
export { useAnimationLoop } from './primitives/useAnimationLoop';
export {
  CommandPalette,
  type CommandPaletteProps,
  type PaletteItem,
} from './primitives/CommandPalette';
export {
  ButtonGroup,
  type ButtonGroupProps,
} from './primitives/ButtonGroup';

// LogViewer
export { LogViewer, type LogViewerProps } from './log-viewer/LogViewer';
export {
  LOG_VIEWER_STATE_KEY,
  createLogViewerStateSeed,
  logViewerActions,
  logViewerReducer,
  selectLogViewerState,
} from './log-viewer/logViewerState';
export {
  type LogEntry,
  type LogLevel,
  type LogLevelMeta,
  type LogEntryMetadata,
  LOG_LEVELS,
  ALL_LOG_LEVELS,
} from './log-viewer/types';
export { generateSampleLogs, generateLogEntry } from './log-viewer/sampleData';

// ChartView
export { ChartView, type ChartViewProps } from './chart-view/ChartView';
export {
  type ChartType,
  type ChartDataset,
  type ChartSeries,
  type ChartTooltip,
} from './chart-view/types';
export { SAMPLE_DATASETS, DATASET_NAMES } from './chart-view/sampleData';

// MacWrite
export { MacWrite, type MacWriteProps } from './mac-write/MacWrite';
export { type ViewMode, type FormatAction, type WordCount } from './mac-write/types';
export { parseMarkdown } from './mac-write/markdown';
export { SAMPLE_DOCUMENT } from './mac-write/sampleData';

// KanbanBoard
export { KanbanBoard, type KanbanBoardProps } from './kanban/KanbanBoard';
export {
  KANBAN_STATE_KEY,
  createKanbanStateSeed,
  kanbanActions,
  kanbanReducer,
  selectKanbanState,
} from './kanban/kanbanState';
export {
  type Task,
  type Column,
  type TagId,
  type Priority,
  TAG_LABELS,
  PRIORITY_LABELS,
  ALL_TAGS,
  ALL_PRIORITIES,
} from './kanban/types';
export { INITIAL_COLUMNS, INITIAL_TASKS } from './kanban/sampleData';

// MacRepl
export { MacRepl, type MacReplProps } from './repl/MacRepl';
export { type TerminalLine, type LineType, type CommandInfo } from './repl/types';
export { BUILT_IN_COMMANDS, FORTUNES, INITIAL_LINES } from './repl/sampleData';

// NodeEditor
export { NodeEditor, type NodeEditorProps } from './node-editor/NodeEditor';
export {
  type GraphNode,
  type Connection,
  type Port,
  type NodeField,
  type TempConnection,
  NODE_WIDTH,
} from './node-editor/types';
export { INITIAL_NODES, INITIAL_CONNECTIONS } from './node-editor/sampleData';

// Oscilloscope
export { Oscilloscope, type OscilloscopeProps } from './oscilloscope/Oscilloscope';
export {
  type WaveformType,
  WAVEFORM_TYPES,
  WAVEFORM_ICONS,
} from './oscilloscope/types';

// MacCalendar
export {
  MacCalendar,
  type MacCalendarProps,
} from './calendar/MacCalendar';
export {
  MAC_CALENDAR_STATE_KEY,
  createMacCalendarStateSeed,
  macCalendarActions,
  macCalendarReducer,
  selectMacCalendarState,
} from './calendar/macCalendarState';
export {
  type CalendarEvent,
  type CalendarView,
  type PaletteAction,
  DAYS,
  MONTHS,
  DURATION_OPTIONS,
  sameDay,
  fmtTime,
  fmtDate,
} from './calendar/types';
export { INITIAL_EVENTS, EVENT_COLORS, makePaletteActions } from './calendar/sampleData';

// MacSlides
export { MacSlides, type MacSlidesProps } from './mac-slides/MacSlides';
export {
  MAC_SLIDES_STATE_KEY,
  createMacSlidesStateSeed,
  macSlidesActions,
  macSlidesReducer,
  selectMacSlidesState,
} from './mac-slides/macSlidesState';
export {
  type MacSlidesDeck,
  type SlideAlignment,
  type SlideDocument,
} from './mac-slides/types';
export {
  DEFAULT_MARKDOWN as MAC_SLIDES_DEFAULT_MARKDOWN,
  createDenseDeckMarkdown,
  createEmptyDeckMarkdown,
} from './mac-slides/sampleData';

// LogicAnalyzer
export {
  LogicAnalyzer,
  type LogicAnalyzerProps,
} from './logic-analyzer/LogicAnalyzer';
export {
  type SignalType,
  type TriggerEdge,
  type Protocol,
  type Channel,
  CHANNEL_COLORS,
  CHANNEL_NAMES,
  SIGNAL_TYPES,
  PROTOCOLS,
} from './logic-analyzer/types';

// GraphNavigator
export {
  GraphNavigator,
  type GraphNavigatorProps,
} from './graph-navigator/GraphNavigator';
export {
  type GraphNavNode,
  type GraphNavEdge,
  type NodeTypeStyle,
  TYPE_STYLES,
} from './graph-navigator/types';
export {
  SAMPLE_NODES,
  SAMPLE_EDGES,
  NODE_FILTER_TYPES,
} from './graph-navigator/sampleData';

// MacCalc (Spreadsheet)
export { MacCalc, type MacCalcProps } from './calculator/MacCalc';
export {
  MAC_CALC_STATE_KEY,
  createMacCalcStateSeed,
  macCalcActions,
  macCalcReducer,
  selectMacCalcState,
} from './calculator/macCalcState';
export {
  type CellData,
  type CellFormat,
  type CellAlign,
  type CellRange,
  type CalcAction,
  type ClipboardData,
  NUM_ROWS,
  NUM_COLS,
  DEFAULT_COL_W,
  ROW_H,
  HEADER_H,
  ROW_HEADER_W,
  colLabel,
  cellId,
  parseRef,
  EMPTY_CELL,
} from './calculator/types';
export { evaluateFormula } from './calculator/formula';
export { createSampleCells, CALC_ACTIONS } from './calculator/sampleData';

// DeepResearch
export {
  DeepResearch,
  type DeepResearchProps,
} from './deep-research/DeepResearch';
export {
  DEEP_RESEARCH_STATE_KEY,
  createDeepResearchStateSeed,
  deepResearchActions,
  deepResearchReducer,
  selectDeepResearchState,
} from './deep-research/deepResearchState';
export {
  type ResearchStep,
  type DepthLevel,
  DEPTH_LEVELS,
} from './deep-research/types';
export { DEMO_STEPS, generateReport } from './deep-research/sampleData';

// RetroMusicPlayer
export {
  RetroMusicPlayer,
  type RetroMusicPlayerProps,
} from './music-player/RetroMusicPlayer';
export {
  MUSIC_PLAYER_STATE_KEY,
  createMusicPlayerStateSeed,
  musicPlayerActions,
  musicPlayerReducer,
  selectMusicPlayerState,
} from './music-player/musicPlayerState';
export {
  type Playlist,
  type AlbumMeta,
  type Track,
  type ViewMode as MusicViewMode,
  parseDuration as parseMusicDuration,
  fmtTime as fmtMusicTime,
} from './music-player/types';
export {
  PLAYLISTS,
  ALBUMS,
  getTracksForPlaylist,
} from './music-player/sampleData';

// GameFinder
export { GameFinder, type GameFinderProps } from './game-finder/GameFinder';
export {
  GAME_FINDER_STATE_KEY,
  createGameFinderStateSeed,
  gameFinderActions,
  gameFinderReducer,
  selectGameFinderState,
} from './game-finder/gameFinderState';
export {
  type Game,
  type Achievement,
  type ArtType,
  type GameFilter,
  type GameSort,
  FILTER_OPTIONS,
  SORT_OPTIONS,
} from './game-finder/types';
export { SAMPLE_GAMES } from './game-finder/sampleData';
export { drawGameArt } from './game-finder/gameArt';

// StreamLauncher
export { StreamLauncher } from './stream-launcher/StreamLauncher';
export {
  type StreamLauncherProps,
  STREAM_LAUNCHER_STATE_KEY,
  createStreamLauncherStateSeed,
  selectStreamLauncherState,
  streamLauncherActions,
  streamLauncherReducer,
} from './stream-launcher/streamLauncherState';
export {
  type Stream,
  type StreamStatus,
  type ThumbType,
  type ChatMessage,
  type StreamSort,
  CATEGORIES as STREAM_CATEGORIES,
  SORT_OPTIONS as STREAM_SORT_OPTIONS,
} from './stream-launcher/types';
export { STREAMS, CHAT_MESSAGES } from './stream-launcher/sampleData';
export { drawStreamThumb } from './stream-launcher/streamArt';

// SteamLauncher
export { SteamLauncher } from './steam-launcher/SteamLauncher';
export {
  type SteamLauncherProps,
  STEAM_LAUNCHER_STATE_KEY,
  createSteamLauncherStateSeed,
  selectSteamLauncherState,
  steamLauncherActions,
  steamLauncherReducer,
} from './steam-launcher/steamLauncherState';
export {
  type SteamGame,
  type Friend,
  type FriendStatus,
  type SteamTab,
  type GameFilter as SteamGameFilter,
  TABS as STEAM_TABS,
} from './steam-launcher/types';
export {
  GAMES as STEAM_GAMES,
  FRIENDS as STEAM_FRIENDS,
} from './steam-launcher/sampleData';

// YouTubeRetro
export {
  YouTubeRetro,
  type YouTubeRetroProps,
} from './youtube-retro/YouTubeRetro';
export {
  type YtChannel,
  type YtVideo,
  type YtComment,
  type YtCategory,
  type YtView,
  CATEGORIES as YT_CATEGORIES,
  parseDuration as parseYtDuration,
  fmtTime as fmtYtTime,
} from './youtube-retro/types';
export {
  CHANNELS as YT_CHANNELS,
  VIDEOS as YT_VIDEOS,
  COMMENTS as YT_COMMENTS,
} from './youtube-retro/sampleData';

// ChatBrowser
export {
  ChatBrowser,
  type ChatBrowserProps,
} from './chat-browser/ChatBrowser';
export {
  CHAT_BROWSER_STATE_KEY,
  chatBrowserActions,
  chatBrowserReducer,
  createChatBrowserStateSeed,
  selectChatBrowserState,
} from './chat-browser/chatBrowserState';
export {
  type Conversation as ChatConversation,
  type ChatMessage as ChatBrowserMessage,
  type SearchParams as ChatSearchParams,
  EMPTY_SEARCH,
} from './chat-browser/types';
export {
  CONVERSATIONS as CHAT_CONVERSATIONS,
  getAllTags as getChatTags,
  getAllModels as getChatModels,
} from './chat-browser/sampleData';

// SystemModeler
export {
  SystemModeler,
  type SystemModelerProps,
} from './system-modeler/SystemModeler';
export {
  type BlockTypeDef,
  type BlockInstance,
  type Wire,
  type DragState,
  type WiringState,
  BLOCK_TYPES,
  SOURCE_BLOCKS,
  MATH_BLOCKS,
  ROUTING_BLOCKS,
} from './system-modeler/types';
export { INITIAL_BLOCKS, INITIAL_WIRES } from './system-modeler/sampleData';

// ControlRoom
export {
  ControlRoom,
  type ControlRoomProps,
} from './control-room/ControlRoom';
export {
  AnalogGauge,
  type AnalogGaugeProps,
  BarMeter,
  type BarMeterProps,
  HorizontalBar,
  type HorizontalBarProps,
  LED,
  type LEDProps,
  ToggleSwitch,
  type ToggleSwitchProps,
  SevenSeg,
  type SevenSegProps,
  Knob,
  type KnobProps,
  ScrollLog,
  type ScrollLogProps,
  Scope,
  type ScopeProps,
} from './control-room/instruments';
export {
  type LogLine,
  type SwitchState,
  type SwitchKey,
} from './control-room/types';

// Parts
export { RICH_PARTS, type RichPartName } from './parts';
