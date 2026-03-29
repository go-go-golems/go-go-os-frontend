import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { ALL_LOG_LEVELS, type LogEntry, type LogLevel } from './types';

export const LOG_VIEWER_STATE_KEY = 'app_rw_log_viewer' as const;

export interface StoredLogEntry extends Omit<LogEntry, 'timestamp'> {
  timestampMs: number;
}

export interface LogViewerStateSeed {
  logs?: readonly LogEntry[];
  search?: string;
  levels?: readonly LogLevel[];
  serviceFilter?: string;
  selectedId?: number | null;
  autoScroll?: boolean;
  streaming?: boolean;
  compactMode?: boolean;
  wrapLines?: boolean;
}

export interface LogViewerState {
  initialized: boolean;
  baselineEntries: StoredLogEntry[];
  entries: StoredLogEntry[];
  search: string;
  levels: LogLevel[];
  serviceFilter: string;
  selectedId: number | null;
  autoScroll: boolean;
  streaming: boolean;
  compactMode: boolean;
  wrapLines: boolean;
}

type LogViewerModuleState = LogViewerState | { viewer: LogViewerState } | undefined;
type LogViewerStateInput = LogViewerStateSeed | LogViewerState | undefined;

function normalizeLevels(levels?: readonly LogLevel[]): LogLevel[] {
  if (!levels || levels.length === 0) {
    return [...ALL_LOG_LEVELS];
  }

  const allowed = new Set(levels);
  const normalized = ALL_LOG_LEVELS.filter((level) => allowed.has(level));
  return normalized.length > 0 ? normalized : [...ALL_LOG_LEVELS];
}

function sanitizeSelectedId(
  entries: readonly StoredLogEntry[],
  selectedId: number | null | undefined,
): number | null {
  if (selectedId == null) {
    return null;
  }
  return entries.some((entry) => entry.id === selectedId) ? selectedId : null;
}

export function serializeLogEntry(entry: LogEntry): StoredLogEntry {
  return {
    ...entry,
    timestampMs: entry.timestamp.getTime(),
  };
}

export function deserializeLogEntry(entry: StoredLogEntry): LogEntry {
  return {
    ...entry,
    timestamp: new Date(entry.timestampMs),
  };
}

export function createLogViewerStateSeed(
  seed: LogViewerStateSeed = {},
): LogViewerState {
  const entries = (seed.logs ?? []).map(serializeLogEntry);
  return {
    initialized: true,
    baselineEntries: entries,
    entries: [...entries],
    search: seed.search ?? '',
    levels: normalizeLevels(seed.levels),
    serviceFilter: seed.serviceFilter ?? 'All',
    selectedId: sanitizeSelectedId(entries, seed.selectedId),
    autoScroll: seed.autoScroll ?? true,
    streaming: seed.streaming ?? false,
    compactMode: seed.compactMode ?? false,
    wrapLines: seed.wrapLines ?? false,
  };
}

function materializeLogViewerState(seed: LogViewerStateInput): LogViewerState {
  if (
    seed &&
    typeof seed === 'object' &&
    'entries' in seed &&
    'baselineEntries' in seed
  ) {
    return {
      ...seed,
      baselineEntries: [...seed.baselineEntries],
      entries: [...seed.entries],
      levels: normalizeLevels(seed.levels),
      selectedId: sanitizeSelectedId(seed.entries, seed.selectedId),
    };
  }

  return createLogViewerStateSeed(seed);
}

function createInitialState(): LogViewerState {
  const seeded = createLogViewerStateSeed();
  return {
    ...seeded,
    initialized: false,
  };
}

function ensureSelectedEntry(state: LogViewerState): void {
  if (state.selectedId == null) {
    return;
  }
  if (!state.entries.some((entry) => entry.id === state.selectedId)) {
    state.selectedId = null;
  }
}

const initialState = createInitialState();

export const logViewerSlice = createSlice({
  name: 'logViewer',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<LogViewerStateInput>) {
      if (state.initialized) {
        return;
      }
      return materializeLogViewerState(action.payload);
    },
    replaceState(_state, action: PayloadAction<LogViewerStateInput>) {
      return materializeLogViewerState(action.payload);
    },
    appendEntry(state, action: PayloadAction<StoredLogEntry>) {
      state.entries.push(action.payload);
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    toggleLevel(state, action: PayloadAction<LogLevel>) {
      const level = action.payload;
      if (state.levels.includes(level)) {
        state.levels = state.levels.filter((candidate) => candidate !== level);
        return;
      }
      state.levels = ALL_LOG_LEVELS.filter(
        (candidate) => candidate === level || state.levels.includes(candidate),
      );
    },
    setServiceFilter(state, action: PayloadAction<string>) {
      state.serviceFilter = action.payload;
    },
    setSelectedId(state, action: PayloadAction<number | null>) {
      state.selectedId = sanitizeSelectedId(state.entries, action.payload);
    },
    setAutoScroll(state, action: PayloadAction<boolean>) {
      state.autoScroll = action.payload;
    },
    setStreaming(state, action: PayloadAction<boolean>) {
      state.streaming = action.payload;
    },
    setCompactMode(state, action: PayloadAction<boolean>) {
      state.compactMode = action.payload;
    },
    setWrapLines(state, action: PayloadAction<boolean>) {
      state.wrapLines = action.payload;
    },
    resetToBaseline(state) {
      state.entries = [...state.baselineEntries];
      state.selectedId = null;
      ensureSelectedEntry(state);
    },
  },
});

export const logViewerReducer = logViewerSlice.reducer;
export const logViewerActions = logViewerSlice.actions;

function unwrapLogViewerState(slice: LogViewerModuleState): LogViewerState | undefined {
  if (!slice) {
    return undefined;
  }
  if ('viewer' in slice) {
    return slice.viewer;
  }
  return slice;
}

const selectRawLogViewerState = (rootState: unknown): LogViewerState | undefined =>
  unwrapLogViewerState(
    typeof rootState === 'object' &&
      rootState !== null &&
      !Array.isArray(rootState)
      ? (rootState as Record<string, LogViewerModuleState | undefined>)[LOG_VIEWER_STATE_KEY]
      : undefined,
  );

export const selectLogViewerState = createSelector(
  [selectRawLogViewerState],
  (state) => state ?? initialState,
);
