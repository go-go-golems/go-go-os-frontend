import type { Meta, StoryObj } from '@storybook/react';
import { SteamLauncher } from './SteamLauncher';
import { GAMES, FRIENDS } from './sampleData';

const meta: Meta<typeof SteamLauncher> = {
  title: 'Rich Widgets/SteamLauncher',
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
