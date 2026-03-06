import { describe, expect, it } from 'vitest';
import {
  createMusicPlayerStateSeed,
  musicPlayerActions,
  musicPlayerReducer,
} from './musicPlayerState';

describe('musicPlayerState', () => {
  it('creates a normalized seed', () => {
    const state = createMusicPlayerStateSeed({
      selectedPlaylistId: 'discover',
      showQueue: true,
      searchTerm: 'neon',
      volume: 150,
    });

    expect(state).toMatchObject({
      initialized: true,
      selectedPlaylistId: 'discover',
      showQueue: true,
      searchTerm: 'neon',
      volume: 100,
    });
  });

  it('plays tracks and toggles liked state', () => {
    const seeded = createMusicPlayerStateSeed();
    const track = {
      title: 'Neon Pulse',
      artist: 'Synthwave Collective',
      album: 'Digital Dreams',
      duration: '4:12',
    };

    const updated = musicPlayerReducer(
      musicPlayerReducer(
        seeded,
        musicPlayerActions.playTrack({ track, idx: 2 }),
      ),
      musicPlayerActions.toggleLike('Neon Pulse-Synthwave Collective'),
    );

    expect(updated).toMatchObject({
      currentTrack: track,
      trackIdx: 2,
      playing: true,
      elapsed: 0,
    });
    expect(updated.liked['Neon Pulse-Synthwave Collective']).toBe(true);
  });
});
