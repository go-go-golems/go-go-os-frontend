import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import { VIDEOS } from './sampleData';
import { YouTubeRetro } from './YouTubeRetro';
import {
  createYouTubeRetroStateSeed,
  youTubeRetroActions,
  youTubeRetroReducer,
  YOUTUBE_RETRO_STATE_KEY,
} from './youTubeRetroState';
import '@go-go-golems/os-widgets/theme';

const meta: Meta<typeof YouTubeRetro> = {
  title: 'RichWidgets/YouTubeRetro',
  component: YouTubeRetro,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof YouTubeRetro>;

function createYouTubeRetroStoryStore() {
  return configureStore({
    reducer: {
      [YOUTUBE_RETRO_STATE_KEY]: youTubeRetroReducer,
    },
  });
}

type YouTubeRetroStoryStore = ReturnType<typeof createYouTubeRetroStoryStore>;
type YouTubeRetroSeedStore = SeedStore<YouTubeRetroStoryStore>;

function renderWithStore(
  seedStore: YouTubeRetroSeedStore,
  options: { height?: string | number } = {},
) {
  return () => (
    <SeededStoreProvider
      createStore={createYouTubeRetroStoryStore}
      seedStore={seedStore}
    >
      <div style={{ height: options.height ?? '100vh' }}>
        <YouTubeRetro />
      </div>
    </SeededStoreProvider>
  );
}

function renderSeededStory(
  seed: Parameters<typeof createYouTubeRetroStateSeed>[0],
  options: { height?: string | number } = {},
) {
  return renderWithStore((store) => {
    store.dispatch(
      youTubeRetroActions.replaceState(createYouTubeRetroStateSeed(seed)),
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

export const FewVideos: Story = {
  render: renderSeededStory({
    initialVideos: VIDEOS.slice(0, 4),
  }),
  decorators: [fullscreenDecorator],
};

export const TechOnly: Story = {
  render: renderSeededStory({
    category: 'tech',
  }),
  decorators: [fullscreenDecorator],
};

export const MusicOnly: Story = {
  render: renderSeededStory({
    category: 'music',
  }),
  decorators: [fullscreenDecorator],
};

export const EmptyFeed: Story = {
  render: renderSeededStory({
    initialVideos: [],
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxWatchState: Story = {
  render: renderSeededStory({
    view: 'watch',
    currentVideoId: 4,
    playing: true,
    elapsed: 540,
    likedVids: { 4: true },
    subscribed: { SynthwaveRadio: true },
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxSearchResults: Story = {
  render: renderSeededStory({
    searchTerm: 'hypercard',
    searchActive: 'hypercard',
  }),
  decorators: [fullscreenDecorator],
};
