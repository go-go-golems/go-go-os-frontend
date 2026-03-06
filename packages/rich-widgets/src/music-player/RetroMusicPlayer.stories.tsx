import type { Meta, StoryObj } from '@storybook/react';
import { RetroMusicPlayer } from './RetroMusicPlayer';
import { PLAYLISTS } from './sampleData';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof RetroMusicPlayer> = {
  title: 'RichWidgets/RetroMusicPlayer',
  component: RetroMusicPlayer,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof RetroMusicPlayer>;

const extendedPlaylists = [
  ...PLAYLISTS,
  ...PLAYLISTS.slice(0, 4).map((playlist, index) => ({
    ...playlist,
    id: `${playlist.id}-extra-${index}`,
    name: `${playlist.name} Archive ${index + 1}`,
    count: playlist.count + (index + 1) * 14,
  })),
];

export const Default: Story = {
  args: {},
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  args: {},
  decorators: [fixedFrameDecorator(700, 500)],
};

export const FewPlaylists: Story = {
  args: {
    initialPlaylists: PLAYLISTS.slice(0, 3),
  },
  decorators: [fullscreenDecorator],
};

export const SinglePlaylist: Story = {
  args: {
    initialPlaylists: [PLAYLISTS[0]],
  },
  decorators: [fullscreenDecorator],
};

export const ExpandedLibrary: Story = {
  args: {
    initialPlaylists: extendedPlaylists,
  },
  decorators: [fullscreenDecorator],
};
