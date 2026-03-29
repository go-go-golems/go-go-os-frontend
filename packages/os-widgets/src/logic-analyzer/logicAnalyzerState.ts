import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  CHANNEL_COLORS,
  CHANNEL_NAMES,
  type Channel,
  type Protocol,
  type TriggerEdge,
} from './types';

export const LOGIC_ANALYZER_STATE_KEY = 'app_rw_logic_analyzer' as const;

export interface LogicAnalyzerStateSeed {
  autoStart?: boolean;
  initialChannelCount?: number;
  channels?: readonly Channel[];
  speed?: number;
  zoom?: number;
  showGrid?: boolean;
  showEdges?: boolean;
  protocol?: Protocol;
  triggerCh?: number;
  triggerEdge?: TriggerEdge;
  busView?: boolean;
}

export interface LogicAnalyzerState {
  initialized: boolean;
  running: boolean;
  channels: Channel[];
  speed: number;
  zoom: number;
  showGrid: boolean;
  showEdges: boolean;
  protocol: Protocol;
  triggerCh: number;
  triggerEdge: TriggerEdge;
  busView: boolean;
}

type LogicAnalyzerModuleState = LogicAnalyzerState | undefined;
type LogicAnalyzerStateInput = LogicAnalyzerStateSeed | LogicAnalyzerState | undefined;

function cloneChannel(channel: Channel): Channel {
  return { ...channel };
}

function createDefaultChannels(initialChannelCount = 6): Channel[] {
  return CHANNEL_NAMES.map((name, index) => ({
    name,
    enabled: index < initialChannelCount,
    color: CHANNEL_COLORS[index],
  }));
}

export function createLogicAnalyzerStateSeed(
  seed: LogicAnalyzerStateSeed = {},
): LogicAnalyzerState {
  return {
    initialized: true,
    running: seed.autoStart ?? true,
    channels: (seed.channels ?? createDefaultChannels(seed.initialChannelCount)).map(cloneChannel),
    speed: seed.speed ?? 1,
    zoom: seed.zoom ?? 1,
    showGrid: seed.showGrid ?? true,
    showEdges: seed.showEdges ?? true,
    protocol: seed.protocol ?? 'None',
    triggerCh: seed.triggerCh ?? 0,
    triggerEdge: seed.triggerEdge ?? 'rising',
    busView: seed.busView ?? false,
  };
}

function materializeLogicAnalyzerState(seed: LogicAnalyzerStateInput): LogicAnalyzerState {
  if (seed && typeof seed === 'object' && 'channels' in seed && 'running' in seed) {
    return {
      ...seed,
      channels: seed.channels.map(cloneChannel),
    };
  }
  return createLogicAnalyzerStateSeed(seed);
}

const initialState: LogicAnalyzerState = {
  ...createLogicAnalyzerStateSeed(),
  initialized: false,
};

export const logicAnalyzerSlice = createSlice({
  name: 'logicAnalyzer',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<LogicAnalyzerStateInput>) {
      if (state.initialized) return;
      return materializeLogicAnalyzerState(action.payload);
    },
    replaceState(_state, action: PayloadAction<LogicAnalyzerStateInput>) {
      return materializeLogicAnalyzerState(action.payload);
    },
    setRunning(state, action: PayloadAction<boolean>) {
      state.running = action.payload;
    },
    toggleRunning(state) {
      state.running = !state.running;
    },
    toggleChannel(state, action: PayloadAction<number>) {
      const channel = state.channels[action.payload];
      if (channel) {
        channel.enabled = !channel.enabled;
      }
    },
    setChannels(state, action: PayloadAction<Channel[]>) {
      state.channels = action.payload.map(cloneChannel);
    },
    setSpeed(state, action: PayloadAction<number>) {
      state.speed = action.payload;
    },
    setZoom(state, action: PayloadAction<number>) {
      state.zoom = action.payload;
    },
    setShowGrid(state, action: PayloadAction<boolean>) {
      state.showGrid = action.payload;
    },
    setShowEdges(state, action: PayloadAction<boolean>) {
      state.showEdges = action.payload;
    },
    setProtocol(state, action: PayloadAction<Protocol>) {
      state.protocol = action.payload;
    },
    setTriggerCh(state, action: PayloadAction<number>) {
      state.triggerCh = action.payload;
    },
    setTriggerEdge(state, action: PayloadAction<TriggerEdge>) {
      state.triggerEdge = action.payload;
    },
    setBusView(state, action: PayloadAction<boolean>) {
      state.busView = action.payload;
    },
    resetToDefaults(state, action: PayloadAction<LogicAnalyzerStateSeed | undefined>) {
      return materializeLogicAnalyzerState(action.payload);
    },
  },
});

export const logicAnalyzerReducer = logicAnalyzerSlice.reducer;
export const logicAnalyzerActions = logicAnalyzerSlice.actions;
export type LogicAnalyzerAction = ReturnType<
  (typeof logicAnalyzerActions)[keyof typeof logicAnalyzerActions]
>;

const selectRawLogicAnalyzerState = (rootState: unknown): LogicAnalyzerState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, LogicAnalyzerModuleState>)[LOGIC_ANALYZER_STATE_KEY]
    : undefined;

export const selectLogicAnalyzerState = (rootState: unknown): LogicAnalyzerState =>
  selectRawLogicAnalyzerState(rootState) ?? initialState;
