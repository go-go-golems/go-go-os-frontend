import type { Meta, StoryObj } from '@storybook/react';
import { LogViewer } from './LogViewer';
import { generateSampleLogs } from './sampleData';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
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

const serviceLogs = generateSampleLogs(120).map((log) => ({
  ...log,
  service: 'api-gateway',
}));

const denseWarnLogs = generateSampleLogs(180).map((log, index) => ({
  ...log,
  level: index % 4 === 0 ? 'ERROR' : 'WARN',
  service: index % 2 === 0 ? 'scheduler' : 'worker-queue',
}));

export const Default: Story = {
  args: {
    initialLogs: generateSampleLogs(200),
  },
  decorators: [fullscreenDecorator],
};

export const Empty: Story = {
  args: {
    initialLogs: [],
  },
  decorators: [fullscreenDecorator],
};

export const FewEntries: Story = {
  args: {
    initialLogs: generateSampleLogs(10),
  },
  decorators: [fullscreenDecorator],
};

export const ManyEntries: Story = {
  args: {
    initialLogs: generateSampleLogs(1000),
  },
  decorators: [fullscreenDecorator],
};

export const Streaming: Story = {
  args: {
    initialLogs: generateSampleLogs(50),
    streaming: true,
    streamInterval: 500,
  },
  decorators: [fullscreenDecorator],
};

export const ErrorHeavy: Story = {
  args: {
    initialLogs: generateSampleLogs(200).map((log, i) =>
      i % 3 === 0 ? { ...log, level: 'ERROR' as const } : log,
    ),
  },
  decorators: [fullscreenDecorator],
};

export const SingleService: Story = {
  args: {
    initialLogs: serviceLogs,
  },
  decorators: [fullscreenDecorator],
};

export const DenseWarnings: Story = {
  args: {
    initialLogs: denseWarnLogs,
  },
  decorators: [fullscreenDecorator],
};

export const CompactStream: Story = {
  args: {
    initialLogs: generateSampleLogs(40),
    streaming: true,
    streamInterval: 900,
  },
  decorators: [fixedFrameDecorator(780, 420)],
};
