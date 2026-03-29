import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { VIDEOS } from './sampleData';
import type { YtComment, YtVideo, YtView } from './types';

export const YOUTUBE_RETRO_STATE_KEY = 'app_rw_youtube_retro' as const;

export interface YouTubeRetroStateSeed {
  initialVideos?: readonly YtVideo[];
  view?: YtView;
  currentVideoId?: number | null;
  playing?: boolean;
  elapsed?: number;
  category?: string;
  searchTerm?: string;
  searchActive?: string;
  subscribed?: Record<string, boolean>;
  likedVids?: Record<number, boolean>;
  commentText?: string;
  userComments?: readonly YtComment[];
}

export interface YouTubeRetroState {
  initialized: boolean;
  videos: YtVideo[];
  view: YtView;
  currentVideoId: number | null;
  playing: boolean;
  elapsed: number;
  category: string;
  searchTerm: string;
  searchActive: string;
  subscribed: Record<string, boolean>;
  likedVids: Record<number, boolean>;
  commentText: string;
  userComments: YtComment[];
}

type YouTubeRetroModuleState = YouTubeRetroState | undefined;
type YouTubeRetroStateInput = YouTubeRetroStateSeed | YouTubeRetroState | undefined;

function cloneVideo(video: YtVideo): YtVideo {
  return { ...video };
}

function cloneComment(comment: YtComment): YtComment {
  return { ...comment };
}

export function createYouTubeRetroStateSeed(
  seed: YouTubeRetroStateSeed = {},
): YouTubeRetroState {
  return {
    initialized: true,
    videos: (seed.initialVideos ?? VIDEOS).map(cloneVideo),
    view: seed.view ?? 'home',
    currentVideoId: seed.currentVideoId ?? null,
    playing: seed.playing ?? false,
    elapsed: Math.max(0, seed.elapsed ?? 0),
    category: seed.category ?? 'all',
    searchTerm: seed.searchTerm ?? '',
    searchActive: seed.searchActive ?? '',
    subscribed: { ...(seed.subscribed ?? {}) },
    likedVids: { ...(seed.likedVids ?? {}) },
    commentText: seed.commentText ?? '',
    userComments: (seed.userComments ?? []).map(cloneComment),
  };
}

function materializeYouTubeRetroState(seed: YouTubeRetroStateInput): YouTubeRetroState {
  if (seed && typeof seed === 'object' && 'videos' in seed && 'view' in seed) {
    return {
      ...seed,
      videos: seed.videos.map(cloneVideo),
      userComments: seed.userComments.map(cloneComment),
      subscribed: { ...seed.subscribed },
      likedVids: { ...seed.likedVids },
      elapsed: Math.max(0, seed.elapsed),
    };
  }
  return createYouTubeRetroStateSeed(seed);
}

const initialState: YouTubeRetroState = {
  ...createYouTubeRetroStateSeed(),
  initialized: false,
};

export const youTubeRetroSlice = createSlice({
  name: 'youTubeRetro',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<YouTubeRetroStateInput>) {
      if (state.initialized) return;
      return materializeYouTubeRetroState(action.payload);
    },
    replaceState(_state, action: PayloadAction<YouTubeRetroStateInput>) {
      return materializeYouTubeRetroState(action.payload);
    },
    goHome(state) {
      state.view = 'home';
      state.playing = false;
    },
    openVideo(state, action: PayloadAction<number>) {
      state.currentVideoId = action.payload;
      state.view = 'watch';
      state.playing = true;
      state.elapsed = 0;
      state.commentText = '';
      state.userComments = [];
    },
    setPlaying(state, action: PayloadAction<boolean>) {
      state.playing = action.payload;
    },
    setElapsed(state, action: PayloadAction<number>) {
      state.elapsed = Math.max(0, action.payload);
    },
    setCategory(state, action: PayloadAction<string>) {
      state.category = action.payload;
      state.searchActive = '';
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },
    activateSearch(state) {
      state.searchActive = state.searchTerm;
      state.view = 'home';
    },
    toggleSubscribed(state, action: PayloadAction<string>) {
      state.subscribed = {
        ...state.subscribed,
        [action.payload]: !state.subscribed[action.payload],
      };
    },
    toggleLiked(state, action: PayloadAction<number>) {
      state.likedVids = {
        ...state.likedVids,
        [action.payload]: !state.likedVids[action.payload],
      };
    },
    setCommentText(state, action: PayloadAction<string>) {
      state.commentText = action.payload;
    },
    submitComment(state) {
      if (!state.commentText.trim()) return;
      state.userComments = [
        {
          user: 'VHSCollector87',
          icon: '🧑',
          text: state.commentText,
          time: 'Just now',
          likes: 0,
        },
        ...state.userComments,
      ];
      state.commentText = '';
    },
  },
});

export const youTubeRetroReducer = youTubeRetroSlice.reducer;
export const youTubeRetroActions = youTubeRetroSlice.actions;
export type YouTubeRetroAction = ReturnType<
  (typeof youTubeRetroActions)[keyof typeof youTubeRetroActions]
>;

const selectRawYouTubeRetroState = (rootState: unknown): YouTubeRetroState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, YouTubeRetroModuleState>)[YOUTUBE_RETRO_STATE_KEY]
    : undefined;

export const selectYouTubeRetroState = (rootState: unknown): YouTubeRetroState =>
  selectRawYouTubeRetroState(rootState) ?? initialState;
