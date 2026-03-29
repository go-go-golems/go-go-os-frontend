import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { INITIAL_BLOCKS, INITIAL_WIRES } from './sampleData';
import type { BlockInstance, Wire } from './types';

export const SYSTEM_MODELER_STATE_KEY = 'app_rw_system_modeler' as const;

export interface SystemModelerStateSeed {
  initialBlocks?: readonly BlockInstance[];
  initialWires?: readonly Wire[];
  selectedBlockId?: string | null;
  showParams?: string | null;
  simTime?: string;
  simRunning?: boolean;
  simProgress?: number;
  showPalette?: boolean;
}

export interface SystemModelerState {
  initialized: boolean;
  blocks: BlockInstance[];
  wires: Wire[];
  selectedBlockId: string | null;
  showParams: string | null;
  simTime: string;
  simRunning: boolean;
  simProgress: number;
  showPalette: boolean;
}

type SystemModelerModuleState = SystemModelerState | undefined;
type SystemModelerStateInput = SystemModelerStateSeed | SystemModelerState | undefined;

function cloneBlock(block: BlockInstance): BlockInstance {
  return { ...block };
}

function cloneWire(wire: Wire): Wire {
  return { ...wire };
}

export function createSystemModelerStateSeed(
  seed: SystemModelerStateSeed = {},
): SystemModelerState {
  return {
    initialized: true,
    blocks: (seed.initialBlocks ?? INITIAL_BLOCKS).map(cloneBlock),
    wires: (seed.initialWires ?? INITIAL_WIRES).map(cloneWire),
    selectedBlockId: seed.selectedBlockId ?? null,
    showParams: seed.showParams ?? null,
    simTime: seed.simTime ?? '10.0',
    simRunning: seed.simRunning ?? false,
    simProgress: Math.max(0, Math.min(100, seed.simProgress ?? 0)),
    showPalette: seed.showPalette ?? true,
  };
}

function materializeSystemModelerState(seed: SystemModelerStateInput): SystemModelerState {
  if (seed && typeof seed === 'object' && 'blocks' in seed && 'wires' in seed) {
    return {
      ...seed,
      blocks: seed.blocks.map(cloneBlock),
      wires: seed.wires.map(cloneWire),
      simProgress: Math.max(0, Math.min(100, seed.simProgress)),
    };
  }
  return createSystemModelerStateSeed(seed);
}

const initialState: SystemModelerState = {
  ...createSystemModelerStateSeed(),
  initialized: false,
};

export const systemModelerSlice = createSlice({
  name: 'systemModeler',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<SystemModelerStateInput>) {
      if (state.initialized) return;
      return materializeSystemModelerState(action.payload);
    },
    replaceState(_state, action: PayloadAction<SystemModelerStateInput>) {
      return materializeSystemModelerState(action.payload);
    },
    setSelectedBlockId(state, action: PayloadAction<string | null>) {
      state.selectedBlockId = action.payload;
    },
    moveBlock(
      state,
      action: PayloadAction<{ blockId: string; x: number; y: number }>,
    ) {
      const block = state.blocks.find((item) => item.id === action.payload.blockId);
      if (block) {
        block.x = Math.max(0, action.payload.x);
        block.y = Math.max(0, action.payload.y);
      }
    },
    addBlock(state, action: PayloadAction<BlockInstance>) {
      state.blocks.push(cloneBlock(action.payload));
    },
    addWire(state, action: PayloadAction<Wire>) {
      const exists = state.wires.some(
        (wire) => wire.to === action.payload.to && wire.toPort === action.payload.toPort,
      );
      if (!exists) {
        state.wires.push(cloneWire(action.payload));
      }
    },
    deleteWire(state, action: PayloadAction<string>) {
      state.wires = state.wires.filter((wire) => wire.id !== action.payload);
    },
    deleteSelectedBlock(state) {
      if (!state.selectedBlockId) return;
      state.blocks = state.blocks.filter((block) => block.id !== state.selectedBlockId);
      state.wires = state.wires.filter(
        (wire) => wire.from !== state.selectedBlockId && wire.to !== state.selectedBlockId,
      );
      state.selectedBlockId = null;
    },
    clearModel(state) {
      state.blocks = [];
      state.wires = [];
      state.selectedBlockId = null;
    },
    setShowParams(state, action: PayloadAction<string | null>) {
      state.showParams = action.payload;
    },
    setSimTime(state, action: PayloadAction<string>) {
      state.simTime = action.payload;
    },
    startSimulation(state) {
      state.simRunning = true;
      state.simProgress = 0;
    },
    stopSimulation(state) {
      state.simRunning = false;
    },
    setSimProgress(state, action: PayloadAction<number>) {
      state.simProgress = Math.max(0, Math.min(100, action.payload));
      if (state.simProgress >= 100) {
        state.simRunning = false;
      }
    },
    setShowPalette(state, action: PayloadAction<boolean>) {
      state.showPalette = action.payload;
    },
  },
});

export const systemModelerReducer = systemModelerSlice.reducer;
export const systemModelerActions = systemModelerSlice.actions;
export type SystemModelerAction = ReturnType<
  (typeof systemModelerActions)[keyof typeof systemModelerActions]
>;

const selectRawSystemModelerState = (rootState: unknown): SystemModelerState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, SystemModelerModuleState>)[SYSTEM_MODELER_STATE_KEY]
    : undefined;

export const selectSystemModelerState = (rootState: unknown): SystemModelerState =>
  selectRawSystemModelerState(rootState) ?? initialState;
