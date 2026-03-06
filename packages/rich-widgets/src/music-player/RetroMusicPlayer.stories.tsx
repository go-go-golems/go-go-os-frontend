import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { RetroMusicPlayer } from './RetroMusicPlayer';
import { PLAYLISTS, getTracksForPlaylist } from './sampleData';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import {
  createMusicPlayerStateSeed,
  MUSIC_PLAYER_STATE_KEY,
  musicPlayerActions,
  musicPlayerReducer,
} from './musicPlayerState';
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

function createMusicPlayerStoryStore() {
  return configureStore({
    reducer: {
      [MUSIC_PLAYER_STATE_KEY]: musicPlayerReducer,
    },
  });
}

type MusicPlayerStoryStore = ReturnType<typeof createMusicPlayerStoryStore>;
type MusicPlayerSeedStore = SeedStore<MusicPlayerStoryStore>;

function renderWithStore(
  seedStore: MusicPlayerSeedStore,
  options: { height?: string | number } = {},
) {
  return () => (
    <SeededStoreProvider createStore={createMusicPlayerStoryStore} seedStore={seedStore}>
      <div style={{ height: options.height ?? '100vh' }}>
        <RetroMusicPlayer />
      </div>
    </SeededStoreProvider>
  );
}

function renderSeededStory(
  seed: Parameters<typeof createMusicPlayerStateSeed>[0],
  options: { height?: string | number } = {},
) {
  return renderWithStore((store) => {
    store.dispatch(musicPlayerActions.replaceState(createMusicPlayerStateSeed(seed)));
  }, options);
}

const extendedPlaylists = [
  ...PLAYLISTS,
  ...PLAYLISTS.slice(0, 4).map((playlist, index) => ({
    ...playlist,
    id: `${playlist.id}-extra-${index}`,
    name: `${playlist.name} Archive ${index + 1}`,
    count: playlist.count + (index + 1) * 14,
  })),
];

const discoverTracks = getTracksForPlaylist('discover');

export const Default: Story = {
  render: renderSeededStory({}),
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  render: renderSeededStory({}),
  decorators: [fixedFrameDecorator(700, 500)],
};

export const FewPlaylists: Story = {
  render: renderSeededStory({
    initialPlaylists: PLAYLISTS.slice(0, 3),
  }),
  decorators: [fullscreenDecorator],
};

export const SinglePlaylist: Story = {
  render: renderSeededStory({
    initialPlaylists: [PLAYLISTS[0]],
  }),
  decorators: [fullscreenDecorator],
};

export const ExpandedLibrary: Story = {
  render: renderSeededStory({
    initialPlaylists: extendedPlaylists,
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxPlayingQueue: Story = {
  render: renderSeededStory({
    selectedPlaylistId: 'discover',
    currentTrack: discoverTracks[1],
    trackIdx: 1,
    playing: true,
    elapsed: 95,
    showQueue: true,
    shuffle: true,
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxGridView: Story = {
  render: renderSeededStory({
    selectedPlaylistId: 'discover',
    view: 'grid',
    showEq: false,
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxSearchResults: Story = {
  render: renderSeededStory({
    selectedPlaylistId: 'discover',
    searchTerm: 'neon',
    liked: {
      'Neon Pulse-Synthwave Collective': true,
    },
  }),
  decorators: [fullscreenDecorator],
};
