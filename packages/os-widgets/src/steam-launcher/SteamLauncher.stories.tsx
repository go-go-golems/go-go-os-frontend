import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import { FRIENDS, GAMES } from './sampleData';
import { SteamLauncher } from './SteamLauncher';
import {
  createSteamLauncherStateSeed,
  steamLauncherActions,
  steamLauncherReducer,
  STEAM_LAUNCHER_STATE_KEY,
} from './steamLauncherState';
import '@go-go-golems/os-widgets/theme';

const meta: Meta<typeof SteamLauncher> = {
  title: 'RichWidgets/SteamLauncher',
  component: SteamLauncher,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof SteamLauncher>;

function createSteamLauncherStoryStore() {
  return configureStore({
    reducer: {
      [STEAM_LAUNCHER_STATE_KEY]: steamLauncherReducer,
    },
  });
}

type SteamLauncherStoryStore = ReturnType<typeof createSteamLauncherStoryStore>;
type SteamLauncherSeedStore = SeedStore<SteamLauncherStoryStore>;

function renderWithStore(
  seedStore: SteamLauncherSeedStore,
  options: { height?: string | number } = {},
) {
  return () => (
    <SeededStoreProvider
      createStore={createSteamLauncherStoryStore}
      seedStore={seedStore}
    >
      <div style={{ height: options.height ?? '100vh' }}>
        <SteamLauncher />
      </div>
    </SeededStoreProvider>
  );
}

function renderSeededStory(
  seed: Parameters<typeof createSteamLauncherStateSeed>[0],
  options: { height?: string | number } = {},
) {
  return renderWithStore((store) => {
    store.dispatch(
      steamLauncherActions.replaceState(createSteamLauncherStateSeed(seed)),
    );
  }, options);
}

export const Default: Story = {
  render: renderSeededStory({}),
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  render: renderSeededStory({}, { height: 480 }),
  decorators: [fixedFrameDecorator(980, 480)],
};

export const FewGames: Story = {
  render: renderSeededStory({
    initialGames: GAMES.slice(0, 4),
    initialFriends: FRIENDS.slice(0, 3),
  }),
  decorators: [fullscreenDecorator],
};

export const InstalledLibrary: Story = {
  render: renderSeededStory({
    initialGames: GAMES.filter((game) => game.installed),
  }),
  decorators: [fullscreenDecorator],
};

export const OfflineFriends: Story = {
  render: renderSeededStory({
    initialFriends: FRIENDS.map((friend) => ({
      ...friend,
      status: 'offline' as const,
      game: null,
    })),
  }),
  decorators: [fullscreenDecorator],
};

export const EmptyLibrary: Story = {
  render: renderSeededStory({
    initialGames: [],
    initialFriends: FRIENDS.slice(0, 2),
    showFriends: false,
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxInstalling: Story = {
  render: renderSeededStory({
    selectedGameId: 5,
    installing: { 5: true },
    activeTab: 'downloads',
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxLaunching: Story = {
  render: renderSeededStory({
    selectedGameId: 1,
    launchingGameId: 1,
  }),
  decorators: [fullscreenDecorator],
};
