import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { SAMPLE_DOCUMENT } from './sampleData';
import type { ViewMode } from './types';

export const MAC_WRITE_STATE_KEY = 'app_rw_mac_write' as const;

export interface MacWriteStateSeed {
  content?: string;
  viewMode?: ViewMode;
  showFind?: boolean;
  findQuery?: string;
  replaceQuery?: string;
  scrollSync?: boolean;
}

export interface MacWriteState {
  initialized: boolean;
  content: string;
  viewMode: ViewMode;
  showFind: boolean;
  findQuery: string;
  replaceQuery: string;
  scrollSync: boolean;
}

type MacWriteModuleState = MacWriteState | undefined;
type MacWriteStateInput = MacWriteStateSeed | MacWriteState | undefined;

export function createMacWriteStateSeed(
  seed: MacWriteStateSeed = {},
): MacWriteState {
  return {
    initialized: true,
    content: seed.content ?? SAMPLE_DOCUMENT,
    viewMode: seed.viewMode ?? 'split',
    showFind: seed.showFind ?? false,
    findQuery: seed.findQuery ?? '',
    replaceQuery: seed.replaceQuery ?? '',
    scrollSync: seed.scrollSync ?? true,
  };
}

function materializeMacWriteState(seed: MacWriteStateInput): MacWriteState {
  if (seed && typeof seed === 'object' && 'initialized' in seed) {
    return { ...seed };
  }
  return createMacWriteStateSeed(seed);
}

const initialState: MacWriteState = {
  ...createMacWriteStateSeed(),
  initialized: false,
};

export const macWriteSlice = createSlice({
  name: 'macWrite',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<MacWriteStateInput>) {
      if (state.initialized) return;
      return materializeMacWriteState(action.payload);
    },
    replaceState(_state, action: PayloadAction<MacWriteStateInput>) {
      return materializeMacWriteState(action.payload);
    },
    setContent(state, action: PayloadAction<string>) {
      state.content = action.payload;
    },
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
    },
    setShowFind(state, action: PayloadAction<boolean>) {
      state.showFind = action.payload;
    },
    setFindQuery(state, action: PayloadAction<string>) {
      state.findQuery = action.payload;
    },
    setReplaceQuery(state, action: PayloadAction<string>) {
      state.replaceQuery = action.payload;
    },
    setScrollSync(state, action: PayloadAction<boolean>) {
      state.scrollSync = action.payload;
    },
  },
});

export const macWriteReducer = macWriteSlice.reducer;
export const macWriteActions = macWriteSlice.actions;
export type MacWriteAction = ReturnType<
  (typeof macWriteActions)[keyof typeof macWriteActions]
>;

const selectRawMacWriteState = (rootState: unknown): MacWriteState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, MacWriteModuleState>)[MAC_WRITE_STATE_KEY]
    : undefined;

export const selectMacWriteState = (rootState: unknown): MacWriteState =>
  selectRawMacWriteState(rootState) ?? initialState;
