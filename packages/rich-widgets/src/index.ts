// Primitives
export { Sparkline, type SparklineProps } from './primitives/Sparkline';

// LogViewer
export { LogViewer, type LogViewerProps } from './log-viewer/LogViewer';
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
export {
  StreamLauncher,
  type StreamLauncherProps,
} from './stream-launcher/StreamLauncher';
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
export {
  SteamLauncher,
  type SteamLauncherProps,
} from './steam-launcher/SteamLauncher';
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

// Parts
export { RICH_PARTS, type RichPartName } from './parts';
