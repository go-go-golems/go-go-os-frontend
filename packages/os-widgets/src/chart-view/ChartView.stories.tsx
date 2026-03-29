import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import { ChartView } from './ChartView';
import { SAMPLE_DATASETS } from './sampleData';
import {
  CHART_VIEW_STATE_KEY,
  chartViewActions,
  chartViewReducer,
  createChartViewStateSeed,
} from './chartViewState';
import '@go-go-golems/os-widgets/theme';

const meta: Meta<typeof ChartView> = {
  title: 'RichWidgets/ChartView',
  component: ChartView,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ChartView>;

const EMPTY_DATASET = {
  labels: ['No data'],
  series: [{ name: 'Usage', values: [0] }],
};

const DENSE_DATASET = {
  labels: Array.from({ length: 12 }, (_, index) => `W${index + 1}`),
  series: [
    { name: 'North', values: [14, 17, 21, 19, 24, 28, 32, 29, 34, 38, 35, 40] },
    { name: 'South', values: [9, 13, 16, 14, 20, 23, 25, 27, 30, 28, 33, 36] },
    { name: 'East', values: [12, 11, 15, 18, 17, 21, 24, 22, 26, 29, 31, 34] },
    { name: 'West', values: [7, 10, 12, 13, 16, 18, 19, 21, 23, 24, 27, 29] },
  ],
};

function createChartViewStoryStore() {
  return configureStore({
    reducer: {
      [CHART_VIEW_STATE_KEY]: chartViewReducer,
    },
  });
}

type ChartViewStoryStore = ReturnType<typeof createChartViewStoryStore>;
type ChartViewSeedStore = SeedStore<ChartViewStoryStore>;

function renderWithStore(seedStore: ChartViewSeedStore, props?: ComponentProps<typeof ChartView>) {
  return () => (
    <SeededStoreProvider createStore={createChartViewStoryStore} seedStore={seedStore}>
      <ChartView {...props} />
    </SeededStoreProvider>
  );
}

function renderSeededStory(
  seed: Parameters<typeof createChartViewStateSeed>[0],
  props?: ComponentProps<typeof ChartView>,
) {
  return renderWithStore((store) => {
    store.dispatch(chartViewActions.replaceState(createChartViewStateSeed(seed)));
  }, props);
}

export const LineChart: Story = {
  render: renderSeededStory({ chartType: 'line' }, {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    title: 'Quarterly Revenue',
  }),
};

export const BarChart: Story = {
  render: renderSeededStory({ chartType: 'bar' }, {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    title: 'Quarterly Revenue',
  }),
};

export const PieChart: Story = {
  render: renderSeededStory({ chartType: 'pie' }, {
    data: SAMPLE_DATASETS['Disk Usage'],
    title: 'Disk Usage',
  }),
};

export const ScatterChart: Story = {
  render: renderSeededStory({ chartType: 'scatter' }, {
    data: SAMPLE_DATASETS['System Performance'],
    title: 'System Performance',
  }),
};

export const WithDatasetSwitcher: Story = {
  render: renderSeededStory({ chartType: 'line', datasetKey: 'Bug Tracker' }, {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    datasets: SAMPLE_DATASETS,
    title: 'Multi-Dataset View',
  }),
};

export const BugTracker: Story = {
  render: renderSeededStory({ chartType: 'bar' }, {
    data: SAMPLE_DATASETS['Bug Tracker'],
    title: 'Bug Tracker',
  }),
};

export const SmallChart: Story = {
  render: renderSeededStory({ chartType: 'line' }, {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    width: 320,
    height: 200,
    title: 'Small Chart',
  }),
};

export const LargeChart: Story = {
  render: renderSeededStory({ chartType: 'line' }, {
    data: SAMPLE_DATASETS['System Performance'],
    width: 800,
    height: 500,
    title: 'Large Chart',
  }),
};

export const LimitedTypes: Story = {
  render: renderSeededStory({ chartType: 'line' }, {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    availableTypes: ['line', 'bar'],
    title: 'Line & Bar Only',
  }),
};

export const EmptyDataset: Story = {
  render: renderSeededStory({ chartType: 'line' }, {
    data: EMPTY_DATASET,
    title: 'No Data Loaded',
  }),
};

export const DenseDataset: Story = {
  render: renderSeededStory({ chartType: 'line' }, {
    data: DENSE_DATASET,
    width: 720,
    height: 360,
    title: 'Regional Throughput',
  }),
};
