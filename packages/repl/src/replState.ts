import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { INITIAL_LINES } from './sampleData';
import type { TerminalLine } from './types';

export const MAC_REPL_STATE_KEY = 'app_rw_mac_repl' as const;

export interface MacReplStateSeed {
  initialLines?: readonly TerminalLine[];
  prompt?: string;
  historyStack?: readonly string[];
  historyIndex?: number;
  envVars?: Record<string, string>;
  aliases?: Record<string, string>;
}

export interface MacReplState {
  initialized: boolean;
  lines: TerminalLine[];
  prompt: string;
  historyStack: string[];
  historyIndex: number;
  envVars: Record<string, string>;
  aliases: Record<string, string>;
}

type MacReplModuleState = MacReplState | undefined;
type MacReplStateInput = MacReplStateSeed | MacReplState | undefined;

function cloneLine(line: TerminalLine): TerminalLine {
  return { ...line };
}

export function createMacReplStateSeed(seed: MacReplStateSeed = {}): MacReplState {
  return {
    initialized: true,
    lines: (seed.initialLines ?? INITIAL_LINES).map(cloneLine),
    prompt: seed.prompt ?? '⌘',
    historyStack: [...(seed.historyStack ?? [])],
    historyIndex: seed.historyIndex ?? -1,
    envVars: {
      USER: 'macuser',
      HOME: '/Users/macuser',
      SHELL: '/bin/msh',
      ...(seed.envVars ?? {}),
    },
    aliases: { ...(seed.aliases ?? {}) },
  };
}

function materializeMacReplState(seed: MacReplStateInput): MacReplState {
  if (seed && typeof seed === 'object' && 'lines' in seed && 'envVars' in seed) {
    return {
      ...seed,
      lines: seed.lines.map(cloneLine),
      historyStack: [...seed.historyStack],
      envVars: { ...seed.envVars },
      aliases: { ...seed.aliases },
    };
  }
  return createMacReplStateSeed(seed);
}

const initialState: MacReplState = {
  ...createMacReplStateSeed(),
  initialized: false,
};

export const macReplSlice = createSlice({
  name: 'macRepl',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<MacReplStateInput>) {
      if (state.initialized) return;
      return materializeMacReplState(action.payload);
    },
    replaceState(_state, action: PayloadAction<MacReplStateInput>) {
      return materializeMacReplState(action.payload);
    },
    setLines(state, action: PayloadAction<TerminalLine[]>) {
      state.lines = action.payload.map(cloneLine);
    },
    appendLines(state, action: PayloadAction<TerminalLine[]>) {
      state.lines.push(...action.payload.map(cloneLine));
    },
    setHistoryStack(state, action: PayloadAction<string[]>) {
      state.historyStack = [...action.payload];
    },
    setHistoryIndex(state, action: PayloadAction<number>) {
      state.historyIndex = action.payload;
    },
    setEnvVar(state, action: PayloadAction<{ key: string; value: string }>) {
      state.envVars[action.payload.key] = action.payload.value;
    },
    removeAlias(state, action: PayloadAction<string>) {
      delete state.aliases[action.payload];
    },
    setAlias(state, action: PayloadAction<{ key: string; value: string }>) {
      state.aliases[action.payload.key] = action.payload.value;
    },
  },
});

export const macReplReducer = macReplSlice.reducer;
export const macReplActions = macReplSlice.actions;
export type MacReplAction = ReturnType<
  (typeof macReplActions)[keyof typeof macReplActions]
>;

const selectRawMacReplState = (rootState: unknown): MacReplState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, MacReplModuleState>)[MAC_REPL_STATE_KEY]
    : undefined;

export const selectMacReplState = (rootState: unknown): MacReplState =>
  selectRawMacReplState(rootState) ?? initialState;
