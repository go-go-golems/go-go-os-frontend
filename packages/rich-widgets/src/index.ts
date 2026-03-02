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

// Parts
export { RICH_PARTS, type RichPartName } from './parts';
