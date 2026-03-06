import { describe, expect, it } from 'vitest';
import {
  chartViewActions,
  chartViewReducer,
  createChartViewStateSeed,
} from './chartViewState';

describe('chartViewState', () => {
  it('creates seeded state', () => {
    const state = createChartViewStateSeed({
      chartType: 'bar',
      datasetKey: 'Disk Usage',
    });

    expect(state.chartType).toBe('bar');
    expect(state.datasetKey).toBe('Disk Usage');
  });

  it('updates chart type and dataset', () => {
    let state = createChartViewStateSeed();

    state = chartViewReducer(state, chartViewActions.setChartType('scatter'));
    state = chartViewReducer(state, chartViewActions.setDatasetKey('Bug Tracker'));

    expect(state.chartType).toBe('scatter');
    expect(state.datasetKey).toBe('Bug Tracker');
  });
});
