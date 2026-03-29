import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import { STREAMS } from './sampleData';
import { StreamLauncher } from './StreamLauncher';
import {
  createStreamLauncherStateSeed,
  streamLauncherActions,
  streamLauncherReducer,
  STREAM_LAUNCHER_STATE_KEY,
} from './streamLauncherState';
import '@go-go-golems/os-widgets/theme';

const meta: Meta<typeof StreamLauncher> = {
  title: 'RichWidgets/StreamLauncher',
  component: StreamLauncher,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof StreamLauncher>;

function createStreamLauncherStoryStore() {
  return configureStore({
    reducer: {
      [STREAM_LAUNCHER_STATE_KEY]: streamLauncherReducer,
    },
  });
}

type StreamLauncherStoryStore = ReturnType<typeof createStreamLauncherStoryStore>;
type StreamLauncherSeedStore = SeedStore<StreamLauncherStoryStore>;

function renderWithStore(
  seedStore: StreamLauncherSeedStore,
  options: { height?: string | number } = {},
) {
  return () => (
    <SeededStoreProvider
      createStore={createStreamLauncherStoryStore}
      seedStore={seedStore}
    >
      <div style={{ height: options.height ?? '100vh' }}>
        <StreamLauncher />
      </div>
    </SeededStoreProvider>
  );
}

function renderSeededStory(
  seed: Parameters<typeof createStreamLauncherStateSeed>[0],
  options: { height?: string | number } = {},
) {
  return renderWithStore((store) => {
    store.dispatch(
      streamLauncherActions.replaceState(createStreamLauncherStateSeed(seed)),
    );
  }, options);
}

const archiveOnlyStreams = STREAMS.filter((stream) => stream.status !== 'live');

export const Default: Story = {
  render: renderSeededStory({}),
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  render: renderSeededStory({}, { height: 420 }),
  decorators: [fixedFrameDecorator(960, 420)],
};

export const FewStreams: Story = {
  render: renderSeededStory({
    initialStreams: STREAMS.slice(0, 4),
  }),
  decorators: [fullscreenDecorator],
};

export const LiveOnly: Story = {
  render: renderSeededStory({
    initialStreams: STREAMS.filter((stream) => stream.status === 'live'),
  }),
  decorators: [fullscreenDecorator],
};

export const ArchiveOnly: Story = {
  render: renderSeededStory({
    initialStreams: archiveOnlyStreams,
    category: '📼 Archive',
  }),
  decorators: [fullscreenDecorator],
};

export const EmptyLibrary: Story = {
  render: renderSeededStory({
    initialStreams: [],
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxPlayerOpen: Story = {
  render: renderSeededStory({
    activeStreamId: 's3',
    playerPlaying: true,
    playerProgress: 0.61,
    playerVolume: 0.42,
    showChat: true,
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxSearchResults: Story = {
  render: renderSeededStory({
    category: '🎨 Creative',
    search: 'pixel',
    sortBy: 'title',
  }),
  decorators: [fullscreenDecorator],
};
