import type { Meta, StoryObj } from '@storybook/react';
import { LogViewer } from './LogViewer';
import { generateSampleLogs } from './sampleData';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof LogViewer> = {
  title: 'RichWidgets/LogViewer',
  component: LogViewer,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof LogViewer>;

export const Default: Story = {
  args: {
    initialLogs: generateSampleLogs(200),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  args: {
    initialLogs: [],
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const FewEntries: Story = {
  args: {
    initialLogs: generateSampleLogs(10),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const ManyEntries: Story = {
  args: {
    initialLogs: generateSampleLogs(1000),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const Streaming: Story = {
  args: {
    initialLogs: generateSampleLogs(50),
    streaming: true,
    streamInterval: 500,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const ErrorHeavy: Story = {
  args: {
    initialLogs: generateSampleLogs(200).map((log, i) =>
      i % 3 === 0 ? { ...log, level: 'ERROR' as const } : log,
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};
