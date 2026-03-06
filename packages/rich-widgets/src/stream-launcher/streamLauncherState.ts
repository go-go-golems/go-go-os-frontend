import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { STREAMS } from './sampleData';
import type { Stream, StreamSort } from './types';

export const STREAM_LAUNCHER_STATE_KEY = 'app_rw_stream_launcher' as const;

export interface StreamLauncherStateSeed {
  initialStreams?: readonly Stream[];
  category?: string;
  activeStreamId?: string | null;
  search?: string;
  sortBy?: StreamSort;
  playerPlaying?: boolean;
  playerVolume?: number;
  playerProgress?: number;
  showChat?: boolean;
}

export interface StreamLauncherState {
  initialized: boolean;
  streams: Stream[];
  category: string;
  activeStreamId: string | null;
  search: string;
  sortBy: StreamSort;
  playerPlaying: boolean;
  playerVolume: number;
  playerProgress: number;
  showChat: boolean;
}

type StreamLauncherModuleState = StreamLauncherState | undefined;
type StreamLauncherStateInput =
  | StreamLauncherStateSeed
  | StreamLauncherState
  | undefined;

function cloneStream(stream: Stream): Stream {
  return { ...stream };
}

function clampVolume(volume: number | undefined): number {
  return Math.max(0, Math.min(1, volume ?? 0.7));
}

function clampProgress(progress: number | undefined): number {
  return Math.max(0, Math.min(1, progress ?? 0.34));
}

export function createStreamLauncherStateSeed(
  seed: StreamLauncherStateSeed = {},
): StreamLauncherState {
  return {
    initialized: true,
    streams: (seed.initialStreams ?? STREAMS).map(cloneStream),
    category: seed.category ?? 'All',
    activeStreamId: seed.activeStreamId ?? null,
    search: seed.search ?? '',
    sortBy: seed.sortBy ?? 'viewers',
    playerPlaying: seed.playerPlaying ?? true,
    playerVolume: clampVolume(seed.playerVolume),
    playerProgress: clampProgress(seed.playerProgress),
    showChat: seed.showChat ?? true,
  };
}

function materializeStreamLauncherState(
  seed: StreamLauncherStateInput,
): StreamLauncherState {
  if (seed && typeof seed === 'object' && 'streams' in seed && 'sortBy' in seed) {
    return {
      ...seed,
      streams: seed.streams.map(cloneStream),
      playerVolume: clampVolume(seed.playerVolume),
      playerProgress: clampProgress(seed.playerProgress),
    };
  }

  return createStreamLauncherStateSeed(seed);
}

const initialState: StreamLauncherState = {
  ...createStreamLauncherStateSeed(),
  initialized: false,
};

export const streamLauncherSlice = createSlice({
  name: 'streamLauncher',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<StreamLauncherStateInput>) {
      if (state.initialized) return;
      return materializeStreamLauncherState(action.payload);
    },
    replaceState(_state, action: PayloadAction<StreamLauncherStateInput>) {
      return materializeStreamLauncherState(action.payload);
    },
    setCategory(state, action: PayloadAction<string>) {
      state.category = action.payload;
      state.activeStreamId = null;
    },
    openStream(state, action: PayloadAction<string>) {
      state.activeStreamId = action.payload;
      state.playerPlaying = true;
      state.playerProgress = 0.34;
      state.showChat = true;
    },
    closePlayer(state) {
      state.activeStreamId = null;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setSortBy(state, action: PayloadAction<StreamSort>) {
      state.sortBy = action.payload;
    },
    setPlayerPlaying(state, action: PayloadAction<boolean>) {
      state.playerPlaying = action.payload;
    },
    setPlayerVolume(state, action: PayloadAction<number>) {
      state.playerVolume = clampVolume(action.payload);
    },
    setPlayerProgress(state, action: PayloadAction<number>) {
      state.playerProgress = clampProgress(action.payload);
    },
    toggleChat(state) {
      state.showChat = !state.showChat;
    },
  },
});

export const streamLauncherReducer = streamLauncherSlice.reducer;
export const streamLauncherActions = streamLauncherSlice.actions;
export type StreamLauncherAction = ReturnType<
  (typeof streamLauncherActions)[keyof typeof streamLauncherActions]
>;

const selectRawStreamLauncherState = (
  rootState: unknown,
): StreamLauncherState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, StreamLauncherModuleState>)[
        STREAM_LAUNCHER_STATE_KEY
      ]
    : undefined;

export const selectStreamLauncherState = (rootState: unknown): StreamLauncherState =>
  selectRawStreamLauncherState(rootState) ?? initialState;
