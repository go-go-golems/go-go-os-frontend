import { describe, expect, it } from 'vitest';
import {
  createStreamLauncherStateSeed,
  streamLauncherActions,
  streamLauncherReducer,
} from './streamLauncherState';

describe('streamLauncherState', () => {
  it('creates a normalized seed', () => {
    const state = createStreamLauncherStateSeed({
      category: '🎵 Music',
      playerVolume: 4,
      playerProgress: -1,
      showChat: false,
    });

    expect(state).toMatchObject({
      initialized: true,
      category: '🎵 Music',
      playerVolume: 1,
      playerProgress: 0,
      showChat: false,
    });
  });

  it('opens streams and updates player controls', () => {
    const seeded = createStreamLauncherStateSeed();
    const opened = streamLauncherReducer(
      seeded,
      streamLauncherActions.openStream('s3'),
    );
    const updated = streamLauncherReducer(
      streamLauncherReducer(
        opened,
        streamLauncherActions.setPlayerVolume(0.42),
      ),
      streamLauncherActions.toggleChat(),
    );

    expect(updated).toMatchObject({
      activeStreamId: 's3',
      playerPlaying: true,
      playerVolume: 0.42,
      showChat: false,
    });
  });
});
