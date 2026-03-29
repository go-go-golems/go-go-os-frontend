import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const MAC_BROWSER_STATE_KEY = 'app_rw_mac_browser' as const;

export interface MacBrowserStateSeed {
  url?: string;
  inputUrl?: string;
  history?: string[];
  histIdx?: number;
  editing?: boolean;
  editContent?: string;
  customPages?: Record<string, string>;
}

export interface MacBrowserState {
  initialized: boolean;
  url: string;
  inputUrl: string;
  history: string[];
  histIdx: number;
  editing: boolean;
  editContent: string;
  customPages: Record<string, string>;
}

type MacBrowserModuleState = MacBrowserState | undefined;
type MacBrowserStateInput = MacBrowserStateSeed | MacBrowserState | undefined;

export function createMacBrowserStateSeed(
  seed: MacBrowserStateSeed = {},
): MacBrowserState {
  const url = seed.url ?? 'mac://welcome';
  return {
    initialized: true,
    url,
    inputUrl: seed.inputUrl ?? url,
    history: [...(seed.history ?? [url])],
    histIdx: seed.histIdx ?? 0,
    editing: seed.editing ?? false,
    editContent: seed.editContent ?? '',
    customPages: { ...(seed.customPages ?? {}) },
  };
}

function materializeMacBrowserState(seed: MacBrowserStateInput): MacBrowserState {
  if (seed && typeof seed === 'object' && 'initialized' in seed) {
    return {
      ...seed,
      history: [...seed.history],
      customPages: { ...seed.customPages },
    };
  }
  return createMacBrowserStateSeed(seed);
}

const initialState: MacBrowserState = {
  ...createMacBrowserStateSeed(),
  initialized: false,
};

export const macBrowserSlice = createSlice({
  name: 'macBrowser',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<MacBrowserStateInput>) {
      if (state.initialized) return;
      return materializeMacBrowserState(action.payload);
    },
    replaceState(_state, action: PayloadAction<MacBrowserStateInput>) {
      return materializeMacBrowserState(action.payload);
    },
    setInputUrl(state, action: PayloadAction<string>) {
      state.inputUrl = action.payload;
    },
    navigate(state, action: PayloadAction<string>) {
      state.url = action.payload;
      state.inputUrl = action.payload;
      state.editing = false;
      state.history = [...state.history.slice(0, state.histIdx + 1), action.payload];
      state.histIdx += 1;
    },
    goBack(state) {
      if (state.histIdx > 0) {
        state.histIdx -= 1;
        state.url = state.history[state.histIdx] ?? state.url;
        state.inputUrl = state.url;
        state.editing = false;
      }
    },
    goForward(state) {
      if (state.histIdx < state.history.length - 1) {
        state.histIdx += 1;
        state.url = state.history[state.histIdx] ?? state.url;
        state.inputUrl = state.url;
        state.editing = false;
      }
    },
    setEditing(state, action: PayloadAction<boolean>) {
      state.editing = action.payload;
    },
    setEditContent(state, action: PayloadAction<string>) {
      state.editContent = action.payload;
    },
    saveCustomPage(state, action: PayloadAction<{ url: string; content: string }>) {
      state.customPages[action.payload.url] = action.payload.content;
      state.url = action.payload.url;
      state.inputUrl = action.payload.url;
      state.editing = false;
    },
  },
});

export const macBrowserReducer = macBrowserSlice.reducer;
export const macBrowserActions = macBrowserSlice.actions;

const selectRawMacBrowserState = (rootState: unknown): MacBrowserState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, MacBrowserModuleState>)[MAC_BROWSER_STATE_KEY]
    : undefined;

export const selectMacBrowserState = (rootState: unknown): MacBrowserState =>
  selectRawMacBrowserState(rootState) ?? initialState;
