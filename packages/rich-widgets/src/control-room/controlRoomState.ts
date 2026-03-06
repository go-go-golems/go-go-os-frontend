import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LogLine, SwitchState, SwitchKey } from './types';

export const CONTROL_ROOM_STATE_KEY = 'app_rw_control_room' as const;

export interface ControlRoomStateSeed {
  tick?: number;
  running?: boolean;
  switches?: Partial<SwitchState>;
  knobVal?: number;
  knob2?: number;
  logs?: readonly LogLine[];
  scopeData?: readonly number[];
}

export interface ControlRoomState {
  initialized: boolean;
  tick: number;
  running: boolean;
  switches: SwitchState;
  knobVal: number;
  knob2: number;
  logs: LogLine[];
  scopeData: number[];
}

type ControlRoomModuleState = ControlRoomState | undefined;
type ControlRoomStateInput = ControlRoomStateSeed | ControlRoomState | undefined;

function cloneLogLine(line: LogLine): LogLine {
  return { ...line };
}

export function createControlRoomStateSeed(
  seed: ControlRoomStateSeed = {},
): ControlRoomState {
  return {
    initialized: true,
    tick: seed.tick ?? 0,
    running: seed.running ?? true,
    switches: {
      main: true,
      aux: false,
      pump: true,
      alarm: false,
      ...(seed.switches ?? {}),
    },
    knobVal: seed.knobVal ?? 65,
    knob2: seed.knob2 ?? 30,
    logs: (seed.logs ?? []).map(cloneLogLine),
    scopeData: [...(seed.scopeData ?? [])],
  };
}

function materializeControlRoomState(seed: ControlRoomStateInput): ControlRoomState {
  if (seed && typeof seed === 'object' && 'switches' in seed && 'logs' in seed) {
    return {
      ...seed,
      switches: { ...seed.switches },
      logs: seed.logs.map(cloneLogLine),
      scopeData: [...seed.scopeData],
    };
  }
  return createControlRoomStateSeed(seed);
}

const initialState: ControlRoomState = {
  ...createControlRoomStateSeed(),
  initialized: false,
};

export const controlRoomSlice = createSlice({
  name: 'controlRoom',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<ControlRoomStateInput>) {
      if (state.initialized) return;
      return materializeControlRoomState(action.payload);
    },
    replaceState(_state, action: PayloadAction<ControlRoomStateInput>) {
      return materializeControlRoomState(action.payload);
    },
    tick(state) {
      state.tick += 1;
    },
    setRunning(state, action: PayloadAction<boolean>) {
      state.running = action.payload;
    },
    toggleSwitch(state, action: PayloadAction<SwitchKey>) {
      state.switches[action.payload] = !state.switches[action.payload];
    },
    setKnobVal(state, action: PayloadAction<number>) {
      state.knobVal = action.payload;
    },
    setKnob2(state, action: PayloadAction<number>) {
      state.knob2 = action.payload;
    },
    appendLog(state, action: PayloadAction<LogLine>) {
      state.logs = [...state.logs.slice(-30), cloneLogLine(action.payload)];
    },
    appendScopeSample(state, action: PayloadAction<number>) {
      state.scopeData = [...state.scopeData, action.payload].slice(-100);
    },
    resetToDefaults(state, action: PayloadAction<ControlRoomStateSeed | undefined>) {
      return materializeControlRoomState(action.payload);
    },
  },
});

export const controlRoomReducer = controlRoomSlice.reducer;
export const controlRoomActions = controlRoomSlice.actions;
export type ControlRoomAction = ReturnType<
  (typeof controlRoomActions)[keyof typeof controlRoomActions]
>;

const selectRawControlRoomState = (rootState: unknown): ControlRoomState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, ControlRoomModuleState>)[CONTROL_ROOM_STATE_KEY]
    : undefined;

export const selectControlRoomState = (rootState: unknown): ControlRoomState =>
  selectRawControlRoomState(rootState) ?? initialState;
