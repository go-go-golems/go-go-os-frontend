import type { Meta, StoryObj } from '@storybook/react';
import { YouTubeRetro } from './YouTubeRetro';
import { VIDEOS } from './sampleData';

const meta: Meta<typeof YouTubeRetro> = {
  title: 'Rich Widgets/YouTubeRetro',
  component: YouTubeRetro,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof YouTubeRetro>;

export const Default: Story = {};

export const Compact: Story = {
  args: { height: 480 },
};

export const FewVideos: Story = {
  args: {
    videos: VIDEOS.slice(0, 4),
  },
};
