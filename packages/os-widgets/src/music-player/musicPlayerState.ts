import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { PLAYLISTS } from './sampleData';
import type { Playlist, Track, ViewMode } from './types';

export const MUSIC_PLAYER_STATE_KEY = 'app_rw_music_player' as const;

export interface MusicPlayerStateSeed {
  initialPlaylists?: readonly Playlist[];
  currentTrack?: Track | null;
  trackIdx?: number;
  playing?: boolean;
  elapsed?: number;
  selectedPlaylistId?: string;
  searchTerm?: string;
  showQueue?: boolean;
  showEq?: boolean;
  view?: ViewMode;
  volume?: number;
  shuffle?: boolean;
  repeat?: boolean;
  liked?: Record<string, boolean>;
}

export interface MusicPlayerState {
  initialized: boolean;
  playlists: Playlist[];
  currentTrack: Track | null;
  trackIdx: number;
  playing: boolean;
  elapsed: number;
  selectedPlaylistId: string;
  searchTerm: string;
  showQueue: boolean;
  showEq: boolean;
  view: ViewMode;
  volume: number;
  shuffle: boolean;
  repeat: boolean;
  liked: Record<string, boolean>;
}

type MusicPlayerModuleState = MusicPlayerState | undefined;
type MusicPlayerStateInput = MusicPlayerStateSeed | MusicPlayerState | undefined;

function cloneTrack(track: Track | null | undefined): Track | null {
  if (!track) return null;
  return { ...track };
}

function clonePlaylist(playlist: Playlist): Playlist {
  return { ...playlist };
}

function clampVolume(volume: number | undefined): number {
  return Math.max(0, Math.min(100, volume ?? 72));
}

export function createMusicPlayerStateSeed(
  seed: MusicPlayerStateSeed = {},
): MusicPlayerState {
  const playlists = (seed.initialPlaylists ?? PLAYLISTS).map(clonePlaylist);
  return {
    initialized: true,
    playlists,
    currentTrack: cloneTrack(seed.currentTrack),
    trackIdx: seed.trackIdx ?? 0,
    playing: seed.playing ?? false,
    elapsed: seed.elapsed ?? 0,
    selectedPlaylistId: seed.selectedPlaylistId ?? playlists[0]?.id ?? '',
    searchTerm: seed.searchTerm ?? '',
    showQueue: seed.showQueue ?? false,
    showEq: seed.showEq ?? true,
    view: seed.view ?? 'list',
    volume: clampVolume(seed.volume),
    shuffle: seed.shuffle ?? false,
    repeat: seed.repeat ?? false,
    liked: { ...(seed.liked ?? {}) },
  };
}

function materializeMusicPlayerState(seed: MusicPlayerStateInput): MusicPlayerState {
  if (seed && typeof seed === 'object' && 'playlists' in seed && 'selectedPlaylistId' in seed) {
    return {
      ...seed,
      playlists: seed.playlists.map(clonePlaylist),
      currentTrack: cloneTrack(seed.currentTrack),
      liked: { ...seed.liked },
    };
  }

  return createMusicPlayerStateSeed(seed);
}

const initialState: MusicPlayerState = {
  ...createMusicPlayerStateSeed(),
  initialized: false,
};

export const musicPlayerSlice = createSlice({
  name: 'musicPlayer',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<MusicPlayerStateInput>) {
      if (state.initialized) return;
      return materializeMusicPlayerState(action.payload);
    },
    replaceState(_state, action: PayloadAction<MusicPlayerStateInput>) {
      return materializeMusicPlayerState(action.payload);
    },
    playTrack(state, action: PayloadAction<{ track: Track; idx: number }>) {
      state.currentTrack = { ...action.payload.track };
      state.trackIdx = action.payload.idx;
      state.playing = true;
      state.elapsed = 0;
    },
    togglePlaying(state) {
      state.playing = state.currentTrack ? !state.playing : false;
    },
    tick(state) {
      state.elapsed += 1;
    },
    setElapsed(state, action: PayloadAction<number>) {
      state.elapsed = Math.max(0, action.payload);
    },
    setVolume(state, action: PayloadAction<number>) {
      state.volume = clampVolume(action.payload);
    },
    toggleShuffle(state) {
      state.shuffle = !state.shuffle;
    },
    setShuffle(state, action: PayloadAction<boolean>) {
      state.shuffle = action.payload;
    },
    toggleRepeat(state) {
      state.repeat = !state.repeat;
    },
    toggleQueue(state) {
      state.showQueue = !state.showQueue;
    },
    toggleEq(state) {
      state.showEq = !state.showEq;
    },
    setView(state, action: PayloadAction<ViewMode>) {
      state.view = action.payload;
    },
    selectPlaylist(state, action: PayloadAction<string>) {
      state.selectedPlaylistId = action.payload;
      state.searchTerm = '';
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },
    toggleLike(state, action: PayloadAction<string>) {
      state.liked = {
        ...state.liked,
        [action.payload]: !state.liked[action.payload],
      };
    },
  },
});

export const musicPlayerReducer = musicPlayerSlice.reducer;
export const musicPlayerActions = musicPlayerSlice.actions;
export type MusicPlayerAction = ReturnType<
  (typeof musicPlayerActions)[keyof typeof musicPlayerActions]
>;

const selectRawMusicPlayerState = (rootState: unknown): MusicPlayerState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, MusicPlayerModuleState>)[MUSIC_PLAYER_STATE_KEY]
    : undefined;

export const selectMusicPlayerState = (rootState: unknown): MusicPlayerState =>
  selectRawMusicPlayerState(rootState) ?? initialState;
