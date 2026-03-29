import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ResearchStep, type DepthLevel } from './types';

export const DEEP_RESEARCH_STATE_KEY = 'app_rw_deep_research' as const;

export interface DeepResearchStateSeed {
  query?: string;
  initialSteps?: readonly ResearchStep[];
  isResearching?: boolean;
  progress?: number;
  report?: string;
  depthLevel?: DepthLevel;
  webSearch?: boolean;
  academicOnly?: boolean;
  runRevision?: number;
}

export interface DeepResearchState {
  initialized: boolean;
  query: string;
  isResearching: boolean;
  steps: ResearchStep[];
  progress: number;
  report: string;
  depthLevel: DepthLevel;
  webSearch: boolean;
  academicOnly: boolean;
  runRevision: number;
}

type DeepResearchModuleState = DeepResearchState | undefined;
type DeepResearchStateInput = DeepResearchStateSeed | DeepResearchState | undefined;

function clampProgress(progress?: number): number {
  if (typeof progress !== 'number' || Number.isNaN(progress)) {
    return 0;
  }

  return Math.max(0, Math.min(100, progress));
}

export function createDeepResearchStateSeed(
  seed: DeepResearchStateSeed = {},
): DeepResearchState {
  return {
    initialized: true,
    query: seed.query ?? '',
    isResearching: seed.isResearching ?? false,
    steps: [...(seed.initialSteps ?? [])],
    progress: clampProgress(seed.progress),
    report: seed.report ?? '',
    depthLevel: seed.depthLevel ?? 'standard',
    webSearch: seed.webSearch ?? true,
    academicOnly: seed.academicOnly ?? false,
    runRevision: seed.runRevision ?? 0,
  };
}

function materializeDeepResearchState(seed: DeepResearchStateInput): DeepResearchState {
  if (seed && typeof seed === 'object' && 'steps' in seed && 'depthLevel' in seed) {
    return {
      ...seed,
      steps: [...seed.steps],
      progress: clampProgress(seed.progress),
    };
  }

  return createDeepResearchStateSeed(seed);
}

const initialState: DeepResearchState = {
  ...createDeepResearchStateSeed(),
  initialized: false,
};

export const deepResearchSlice = createSlice({
  name: 'deepResearch',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<DeepResearchStateInput>) {
      if (state.initialized) {
        return;
      }
      return materializeDeepResearchState(action.payload);
    },
    replaceState(_state, action: PayloadAction<DeepResearchStateInput>) {
      return materializeDeepResearchState(action.payload);
    },
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    setDepthLevel(state, action: PayloadAction<DepthLevel>) {
      state.depthLevel = action.payload;
    },
    setWebSearch(state, action: PayloadAction<boolean>) {
      state.webSearch = action.payload;
    },
    setAcademicOnly(state, action: PayloadAction<boolean>) {
      state.academicOnly = action.payload;
    },
    startResearchRun(state) {
      state.isResearching = true;
      state.steps = [];
      state.report = '';
      state.progress = 0;
      state.runRevision += 1;
    },
    appendStep(state, action: PayloadAction<ResearchStep>) {
      state.steps.push(action.payload);
    },
    setProgress(state, action: PayloadAction<number>) {
      state.progress = clampProgress(action.payload);
    },
    finishResearch(state, action: PayloadAction<string>) {
      state.isResearching = false;
      state.progress = 100;
      state.report = action.payload;
    },
  },
});

export const deepResearchReducer = deepResearchSlice.reducer;
export const deepResearchActions = deepResearchSlice.actions;
export type DeepResearchAction = ReturnType<
  (typeof deepResearchActions)[keyof typeof deepResearchActions]
>;

const selectRawDeepResearchState = (rootState: unknown): DeepResearchState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, DeepResearchModuleState>)[DEEP_RESEARCH_STATE_KEY]
    : undefined;

export const selectDeepResearchState = (rootState: unknown): DeepResearchState =>
  selectRawDeepResearchState(rootState) ?? initialState;
