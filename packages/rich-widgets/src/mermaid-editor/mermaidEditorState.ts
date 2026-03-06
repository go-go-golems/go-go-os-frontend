import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_MERMAID_PRESET } from './sampleData';
import type { MermaidPresetId } from './types';

export const MERMAID_EDITOR_STATE_KEY = 'app_rw_mermaid_editor' as const;

export interface MermaidEditorStateSeed {
  code?: string;
  presetId?: MermaidPresetId;
  splitPos?: number;
  zoom?: number;
  showAbout?: boolean;
}

export interface MermaidEditorState {
  initialized: boolean;
  code: string;
  presetId: MermaidPresetId;
  splitPos: number;
  zoom: number;
  showAbout: boolean;
}

type MermaidEditorModuleState = MermaidEditorState | undefined;
type MermaidEditorStateInput =
  | MermaidEditorStateSeed
  | MermaidEditorState
  | undefined;

export function createMermaidEditorStateSeed(
  seed: MermaidEditorStateSeed = {},
): MermaidEditorState {
  return {
    initialized: true,
    code: seed.code ?? DEFAULT_MERMAID_PRESET.code,
    presetId: seed.presetId ?? DEFAULT_MERMAID_PRESET.id,
    splitPos: seed.splitPos ?? 0.42,
    zoom: seed.zoom ?? 1,
    showAbout: seed.showAbout ?? false,
  };
}

function materializeMermaidEditorState(
  seed: MermaidEditorStateInput,
): MermaidEditorState {
  if (seed && typeof seed === 'object' && 'code' in seed && 'presetId' in seed) {
    return { ...seed };
  }
  return createMermaidEditorStateSeed(seed);
}

const initialState: MermaidEditorState = {
  ...createMermaidEditorStateSeed(),
  initialized: false,
};

export const mermaidEditorSlice = createSlice({
  name: 'mermaidEditor',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<MermaidEditorStateInput>) {
      if (state.initialized) return;
      return materializeMermaidEditorState(action.payload);
    },
    replaceState(_state, action: PayloadAction<MermaidEditorStateInput>) {
      return materializeMermaidEditorState(action.payload);
    },
    setCode(state, action: PayloadAction<string>) {
      state.code = action.payload;
    },
    setPresetId(state, action: PayloadAction<MermaidPresetId>) {
      state.presetId = action.payload;
    },
    setSplitPos(state, action: PayloadAction<number>) {
      state.splitPos = Math.max(0.2, Math.min(0.8, action.payload));
    },
    setZoom(state, action: PayloadAction<number>) {
      state.zoom = Math.max(0.3, Math.min(3, action.payload));
    },
    setShowAbout(state, action: PayloadAction<boolean>) {
      state.showAbout = action.payload;
    },
  },
});

export const mermaidEditorReducer = mermaidEditorSlice.reducer;
export const mermaidEditorActions = mermaidEditorSlice.actions;

const selectRawMermaidEditorState = (
  rootState: unknown,
): MermaidEditorState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, MermaidEditorModuleState>)[
        MERMAID_EDITOR_STATE_KEY
      ]
    : undefined;

export const selectMermaidEditorState = (rootState: unknown): MermaidEditorState =>
  selectRawMermaidEditorState(rootState) ?? initialState;
