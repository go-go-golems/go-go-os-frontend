import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChartType } from './types';

export const CHART_VIEW_STATE_KEY = 'app_rw_chart_view' as const;

export interface ChartViewStateSeed {
  chartType?: ChartType;
  datasetKey?: string;
}

export interface ChartViewState {
  initialized: boolean;
  chartType: ChartType;
  datasetKey: string;
}

type ChartViewModuleState = ChartViewState | undefined;
type ChartViewStateInput = ChartViewStateSeed | ChartViewState | undefined;

export function createChartViewStateSeed(
  seed: ChartViewStateSeed = {},
): ChartViewState {
  return {
    initialized: true,
    chartType: seed.chartType ?? 'line',
    datasetKey: seed.datasetKey ?? '',
  };
}

function materializeChartViewState(seed: ChartViewStateInput): ChartViewState {
  if (seed && typeof seed === 'object' && 'initialized' in seed) {
    return { ...seed };
  }
  return createChartViewStateSeed(seed);
}

const initialState: ChartViewState = {
  ...createChartViewStateSeed(),
  initialized: false,
};

export const chartViewSlice = createSlice({
  name: 'chartView',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<ChartViewStateInput>) {
      if (state.initialized) return;
      return materializeChartViewState(action.payload);
    },
    replaceState(_state, action: PayloadAction<ChartViewStateInput>) {
      return materializeChartViewState(action.payload);
    },
    setChartType(state, action: PayloadAction<ChartType>) {
      state.chartType = action.payload;
    },
    setDatasetKey(state, action: PayloadAction<string>) {
      state.datasetKey = action.payload;
    },
  },
});

export const chartViewReducer = chartViewSlice.reducer;
export const chartViewActions = chartViewSlice.actions;
export type ChartViewAction = ReturnType<
  (typeof chartViewActions)[keyof typeof chartViewActions]
>;

const selectRawChartViewState = (rootState: unknown): ChartViewState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, ChartViewModuleState>)[CHART_VIEW_STATE_KEY]
    : undefined;

export const selectChartViewState = (rootState: unknown): ChartViewState =>
  selectRawChartViewState(rootState) ?? initialState;
