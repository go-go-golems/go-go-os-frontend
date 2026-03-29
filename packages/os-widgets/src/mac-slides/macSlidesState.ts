import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const MAC_SLIDES_STATE_KEY = 'app_rw_mac_slides' as const;

export interface MacSlidesStateSeed {
  initialMarkdown?: string;
  initialSlide?: number;
  paletteOpen?: boolean;
  presentationOpen?: boolean;
}

export interface MacSlidesState {
  initialized: boolean;
  markdown: string;
  currentSlide: number;
  paletteOpen: boolean;
  presentationOpen: boolean;
}

type MacSlidesModuleState = MacSlidesState | undefined;
type MacSlidesStateInput = MacSlidesStateSeed | MacSlidesState | undefined;

function normalizeSlideIndex(index?: number): number {
  if (typeof index !== 'number' || Number.isNaN(index)) {
    return 0;
  }
  return Math.max(0, Math.floor(index));
}

export function createMacSlidesStateSeed(
  seed: MacSlidesStateSeed = {},
): MacSlidesState {
  return {
    initialized: true,
    markdown: seed.initialMarkdown ?? '',
    currentSlide: normalizeSlideIndex(seed.initialSlide),
    paletteOpen: seed.paletteOpen ?? false,
    presentationOpen: seed.presentationOpen ?? false,
  };
}

function materializeMacSlidesState(seed: MacSlidesStateInput): MacSlidesState {
  if (seed && typeof seed === 'object' && 'markdown' in seed && 'currentSlide' in seed) {
    return {
      ...seed,
      currentSlide: normalizeSlideIndex(seed.currentSlide),
    };
  }

  return createMacSlidesStateSeed(seed);
}

const initialState: MacSlidesState = {
  ...createMacSlidesStateSeed(),
  initialized: false,
};

export const macSlidesSlice = createSlice({
  name: 'macSlides',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<MacSlidesStateInput>) {
      if (state.initialized) {
        return;
      }
      return materializeMacSlidesState(action.payload);
    },
    replaceState(_state, action: PayloadAction<MacSlidesStateInput>) {
      return materializeMacSlidesState(action.payload);
    },
    setMarkdown(state, action: PayloadAction<string>) {
      state.markdown = action.payload;
    },
    setCurrentSlide(state, action: PayloadAction<number>) {
      state.currentSlide = normalizeSlideIndex(action.payload);
    },
    setPaletteOpen(state, action: PayloadAction<boolean>) {
      state.paletteOpen = action.payload;
    },
    setPresentationOpen(state, action: PayloadAction<boolean>) {
      state.presentationOpen = action.payload;
    },
  },
});

export const macSlidesReducer = macSlidesSlice.reducer;
export const macSlidesActions = macSlidesSlice.actions;
export type MacSlidesAction = ReturnType<
  (typeof macSlidesActions)[keyof typeof macSlidesActions]
>;

const selectRawMacSlidesState = (rootState: unknown): MacSlidesState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, MacSlidesModuleState>)[MAC_SLIDES_STATE_KEY]
    : undefined;

export const selectMacSlidesState = (rootState: unknown): MacSlidesState =>
  selectRawMacSlidesState(rootState) ?? initialState;
