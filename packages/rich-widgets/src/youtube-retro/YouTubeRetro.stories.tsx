import type { Meta, StoryObj } from '@storybook/react';
import { YouTubeRetro } from './YouTubeRetro';
import { VIDEOS } from './sampleData';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof YouTubeRetro> = {
  title: 'RichWidgets/YouTubeRetro',
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

export const TechOnly: Story = {
  args: {
    videos: VIDEOS.filter((video) => video.category === 'tech'),
  },
};

export const MusicOnly: Story = {
  args: {
    videos: VIDEOS.filter((video) => video.category === 'music'),
  },
};

export const EmptyFeed: Story = {
  args: {
    videos: [],
  },
};
