import type { Meta, StoryObj } from '@storybook/react';
import { StreamLauncher } from './StreamLauncher';
import { STREAMS } from './sampleData';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof StreamLauncher> = {
  title: 'RichWidgets/StreamLauncher',
  component: StreamLauncher,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof StreamLauncher>;

export const Default: Story = {};

export const Compact: Story = {
  args: { height: 420 },
};

export const FewStreams: Story = {
  args: {
    streams: STREAMS.slice(0, 4),
  },
};

export const LiveOnly: Story = {
  args: {
    streams: STREAMS.filter((stream) => stream.status === 'live'),
  },
};

export const ArchiveOnly: Story = {
  args: {
    streams: STREAMS.filter((stream) => stream.status !== 'live'),
  },
};

export const EmptyLibrary: Story = {
  args: {
    streams: [],
  },
};
