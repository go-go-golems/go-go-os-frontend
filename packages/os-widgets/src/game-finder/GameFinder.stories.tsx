import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { GameFinder } from './GameFinder';
import { SAMPLE_GAMES } from './sampleData';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import {
  createGameFinderStateSeed,
  GAME_FINDER_STATE_KEY,
  gameFinderActions,
  gameFinderReducer,
} from './gameFinderState';
import '@go-go-golems/os-widgets/theme';

const meta: Meta<typeof GameFinder> = {
  title: 'RichWidgets/GameFinder',
  component: GameFinder,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof GameFinder>;

function createGameFinderStoryStore() {
  return configureStore({
    reducer: {
      [GAME_FINDER_STATE_KEY]: gameFinderReducer,
    },
  });
}

type GameFinderStoryStore = ReturnType<typeof createGameFinderStoryStore>;
type GameFinderSeedStore = SeedStore<GameFinderStoryStore>;

function renderWithStore(
  seedStore: GameFinderSeedStore,
  options: { height?: string | number } = {},
) {
  return () => (
    <SeededStoreProvider createStore={createGameFinderStoryStore} seedStore={seedStore}>
      <div style={{ height: options.height ?? '100vh' }}>
        <GameFinder />
      </div>
    </SeededStoreProvider>
  );
}

function renderSeededStory(
  seed: Parameters<typeof createGameFinderStateSeed>[0],
  options: { height?: string | number } = {},
) {
  return renderWithStore((store) => {
    store.dispatch(gameFinderActions.replaceState(createGameFinderStateSeed(seed)));
  }, options);
}

const installedGames = SAMPLE_GAMES.filter((game) => game.installed);
const backlogGames = SAMPLE_GAMES.filter((game) => !game.installed);
const denseLibrary = [
  ...SAMPLE_GAMES,
  ...SAMPLE_GAMES.slice(0, 4).map((game, index) => ({
    ...game,
    id: `dense-${game.id}-${index}`,
    title: `${game.title} Redux`,
    hours: game.hours + (index + 1) * 12,
  })),
];

export const Default: Story = {
  render: renderSeededStory({}),
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  render: renderSeededStory({}),
  decorators: [fixedFrameDecorator(700, 500)],
};

export const FewGames: Story = {
  render: renderSeededStory({
    initialGames: SAMPLE_GAMES.slice(0, 3),
  }),
  decorators: [fullscreenDecorator],
};

export const InstalledLibrary: Story = {
  render: renderSeededStory({
    initialGames: installedGames,
  }),
  decorators: [fullscreenDecorator],
};

export const BacklogOnly: Story = {
  render: renderSeededStory({
    initialGames: backlogGames,
  }),
  decorators: [fullscreenDecorator],
};

export const DenseLibrary: Story = {
  render: renderSeededStory({
    initialGames: denseLibrary,
  }),
  decorators: [fullscreenDecorator],
};

export const EmptyLibrary: Story = {
  render: renderSeededStory({
    initialGames: [],
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxDetailInstalled: Story = {
  render: renderSeededStory({
    selectedGameId: 'g2',
    view: 'detail',
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxInstalling: Story = {
  render: renderSeededStory({
    selectedGameId: 'g6',
    view: 'detail',
    installingId: 'g6',
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxFilteredBacklog: Story = {
  render: renderSeededStory({
    search: 'prince',
    filter: 'notinstalled',
    sortBy: 'rating',
  }),
  decorators: [fullscreenDecorator],
};
