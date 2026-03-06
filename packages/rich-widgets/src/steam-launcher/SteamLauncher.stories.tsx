import type { Meta, StoryObj } from '@storybook/react';
import { SteamLauncher } from './SteamLauncher';
import { GAMES, FRIENDS } from './sampleData';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof SteamLauncher> = {
  title: 'RichWidgets/SteamLauncher',
  component: SteamLauncher,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof SteamLauncher>;

export const Default: Story = {};

export const Compact: Story = {
  args: { height: 480 },
};

export const FewGames: Story = {
  args: {
    games: GAMES.slice(0, 4),
    friends: FRIENDS.slice(0, 3),
  },
};

export const InstalledLibrary: Story = {
  args: {
    games: GAMES.filter((game) => game.installed),
    friends: FRIENDS,
  },
};

export const OfflineFriends: Story = {
  args: {
    games: GAMES,
    friends: FRIENDS.map((friend) => ({
      ...friend,
      status: 'offline' as const,
      game: null,
    })),
  },
};

export const EmptyLibrary: Story = {
  args: {
    games: [],
    friends: FRIENDS.slice(0, 2),
  },
};
