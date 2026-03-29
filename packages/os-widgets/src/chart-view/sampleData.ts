import type { ChartDataset } from './types';

export const SAMPLE_DATASETS: Record<string, ChartDataset> = {
  'Quarterly Revenue': {
    labels: ["Q1 '90", "Q2 '90", "Q3 '90", "Q4 '90", "Q1 '91", "Q2 '91"],
    series: [
      { name: 'Hardware', values: [42, 55, 48, 72, 63, 81] },
      { name: 'Software', values: [28, 34, 41, 38, 52, 59] },
      { name: 'Services', values: [15, 18, 22, 25, 28, 35] },
    ],
  },
  'System Performance': {
    labels: ['10ms', '20ms', '50ms', '100ms', '200ms', '500ms', '1s'],
    series: [
      { name: 'Macintosh IIci', values: [95, 91, 82, 68, 45, 22, 10] },
      { name: 'Macintosh LC', values: [88, 80, 65, 48, 30, 12, 5] },
      { name: 'Macintosh Plus', values: [60, 50, 35, 20, 10, 4, 1] },
    ],
  },
  'Disk Usage': {
    labels: ['System', 'Apps', 'Documents', 'Graphics', 'Fonts', 'Other'],
    series: [{ name: 'Usage', values: [12, 28, 18, 24, 8, 10] }],
  },
  'Bug Tracker': {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [
      { name: 'Opened', values: [23, 31, 18, 42, 27, 15] },
      { name: 'Closed', values: [12, 28, 22, 35, 30, 25] },
    ],
  },
};

export const DATASET_NAMES = Object.keys(SAMPLE_DATASETS);
