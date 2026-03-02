import type { Meta, StoryObj } from '@storybook/react';
import { StreamLauncher } from './StreamLauncher';
import { STREAMS } from './sampleData';

const meta: Meta<typeof StreamLauncher> = {
  title: 'Rich Widgets/StreamLauncher',
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
