import type { Meta, StoryObj } from '@storybook/react';
import { ChartView } from './ChartView';
import { SAMPLE_DATASETS } from './sampleData';
import '@hypercard/rich-widgets/theme';

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

export const LineChart: Story = {
  args: {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    initialChartType: 'line',
    title: 'Quarterly Revenue',
  },
};

export const BarChart: Story = {
  args: {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    initialChartType: 'bar',
    title: 'Quarterly Revenue',
  },
};

export const PieChart: Story = {
  args: {
    data: SAMPLE_DATASETS['Disk Usage'],
    initialChartType: 'pie',
    title: 'Disk Usage',
  },
};

export const ScatterChart: Story = {
  args: {
    data: SAMPLE_DATASETS['System Performance'],
    initialChartType: 'scatter',
    title: 'System Performance',
  },
};

export const WithDatasetSwitcher: Story = {
  args: {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    datasets: SAMPLE_DATASETS,
    title: 'Multi-Dataset View',
  },
};

export const BugTracker: Story = {
  args: {
    data: SAMPLE_DATASETS['Bug Tracker'],
    initialChartType: 'bar',
    title: 'Bug Tracker',
  },
};

export const SmallChart: Story = {
  args: {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    initialChartType: 'line',
    width: 320,
    height: 200,
    title: 'Small Chart',
  },
};

export const LargeChart: Story = {
  args: {
    data: SAMPLE_DATASETS['System Performance'],
    initialChartType: 'line',
    width: 800,
    height: 500,
    title: 'Large Chart',
  },
};

export const LimitedTypes: Story = {
  args: {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    availableTypes: ['line', 'bar'],
    title: 'Line & Bar Only',
  },
};

export const EmptyDataset: Story = {
  args: {
    data: EMPTY_DATASET,
    initialChartType: 'line',
    title: 'No Data Loaded',
  },
};

export const DenseDataset: Story = {
  args: {
    data: DENSE_DATASET,
    initialChartType: 'line',
    width: 720,
    height: 360,
    title: 'Regional Throughput',
  },
};
