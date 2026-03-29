import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { WaveformType } from './types';

export const OSCILLOSCOPE_STATE_KEY = 'app_rw_oscilloscope' as const;

export interface OscilloscopeStateSeed {
  waveform?: WaveformType;
  frequency?: number;
  amplitude?: number;
  timebase?: number;
  offsetY?: number;
  running?: boolean;
  showGrid?: boolean;
  showCrosshair?: boolean;
  channel2?: boolean;
  ch2Freq?: number;
  ch2Amp?: number;
  phosphor?: boolean;
  triggerLevel?: number;
  thickness?: number;
}

export interface OscilloscopeState {
  initialized: boolean;
  waveform: WaveformType;
  frequency: number;
  amplitude: number;
  timebase: number;
  offsetY: number;
  running: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
  channel2: boolean;
  ch2Freq: number;
  ch2Amp: number;
  phosphor: boolean;
  triggerLevel: number;
  thickness: number;
}

type OscilloscopeModuleState = OscilloscopeState | undefined;
type OscilloscopeStateInput = OscilloscopeStateSeed | OscilloscopeState | undefined;

export function createOscilloscopeStateSeed(
  seed: OscilloscopeStateSeed = {},
): OscilloscopeState {
  return {
    initialized: true,
    waveform: seed.waveform ?? 'sine',
    frequency: seed.frequency ?? 2.5,
    amplitude: seed.amplitude ?? 80,
    timebase: seed.timebase ?? 1,
    offsetY: seed.offsetY ?? 0,
    running: seed.running ?? true,
    showGrid: seed.showGrid ?? true,
    showCrosshair: seed.showCrosshair ?? true,
    channel2: seed.channel2 ?? false,
    ch2Freq: seed.ch2Freq ?? 5,
    ch2Amp: seed.ch2Amp ?? 40,
    phosphor: seed.phosphor ?? true,
    triggerLevel: seed.triggerLevel ?? 0,
    thickness: seed.thickness ?? 2,
  };
}

function materializeOscilloscopeState(seed: OscilloscopeStateInput): OscilloscopeState {
  if (seed && typeof seed === 'object' && 'initialized' in seed) {
    return { ...seed };
  }
  return createOscilloscopeStateSeed(seed);
}

const initialState: OscilloscopeState = {
  ...createOscilloscopeStateSeed(),
  initialized: false,
};

export const oscilloscopeSlice = createSlice({
  name: 'oscilloscope',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<OscilloscopeStateInput>) {
      if (state.initialized) return;
      return materializeOscilloscopeState(action.payload);
    },
    replaceState(_state, action: PayloadAction<OscilloscopeStateInput>) {
      return materializeOscilloscopeState(action.payload);
    },
    setWaveform(state, action: PayloadAction<WaveformType>) {
      state.waveform = action.payload;
    },
    setFrequency(state, action: PayloadAction<number>) {
      state.frequency = action.payload;
    },
    setAmplitude(state, action: PayloadAction<number>) {
      state.amplitude = action.payload;
    },
    setTimebase(state, action: PayloadAction<number>) {
      state.timebase = action.payload;
    },
    setOffsetY(state, action: PayloadAction<number>) {
      state.offsetY = action.payload;
    },
    setRunning(state, action: PayloadAction<boolean>) {
      state.running = action.payload;
    },
    setShowGrid(state, action: PayloadAction<boolean>) {
      state.showGrid = action.payload;
    },
    setShowCrosshair(state, action: PayloadAction<boolean>) {
      state.showCrosshair = action.payload;
    },
    setChannel2(state, action: PayloadAction<boolean>) {
      state.channel2 = action.payload;
    },
    setCh2Freq(state, action: PayloadAction<number>) {
      state.ch2Freq = action.payload;
    },
    setCh2Amp(state, action: PayloadAction<number>) {
      state.ch2Amp = action.payload;
    },
    setPhosphor(state, action: PayloadAction<boolean>) {
      state.phosphor = action.payload;
    },
    setTriggerLevel(state, action: PayloadAction<number>) {
      state.triggerLevel = action.payload;
    },
    setThickness(state, action: PayloadAction<number>) {
      state.thickness = action.payload;
    },
    resetToDefaults(state, action: PayloadAction<OscilloscopeStateSeed | undefined>) {
      return materializeOscilloscopeState(action.payload);
    },
  },
});

export const oscilloscopeReducer = oscilloscopeSlice.reducer;
export const oscilloscopeActions = oscilloscopeSlice.actions;
export type OscilloscopeAction = ReturnType<
  (typeof oscilloscopeActions)[keyof typeof oscilloscopeActions]
>;

const selectRawOscilloscopeState = (rootState: unknown): OscilloscopeState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, OscilloscopeModuleState>)[OSCILLOSCOPE_STATE_KEY]
    : undefined;

export const selectOscilloscopeState = (rootState: unknown): OscilloscopeState =>
  selectRawOscilloscopeState(rootState) ?? initialState;
