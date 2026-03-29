import { describe, expect, it } from 'vitest';
import {
  createYouTubeRetroStateSeed,
  youTubeRetroActions,
  youTubeRetroReducer,
} from './youTubeRetroState';

describe('youTubeRetroState', () => {
  it('creates a normalized seed', () => {
    const state = createYouTubeRetroStateSeed({
      view: 'watch',
      currentVideoId: 4,
      playing: true,
      elapsed: -5,
      category: 'music',
    });

    expect(state).toMatchObject({
      initialized: true,
      view: 'watch',
      currentVideoId: 4,
      playing: true,
      elapsed: 0,
      category: 'music',
    });
  });

  it('opens videos and records comments', () => {
    const seeded = createYouTubeRetroStateSeed();
    const opened = youTubeRetroReducer(seeded, youTubeRetroActions.openVideo(1));
    const updated = youTubeRetroReducer(
      youTubeRetroReducer(opened, youTubeRetroActions.setCommentText('Great breakdown')),
      youTubeRetroActions.submitComment(),
    );

    expect(updated).toMatchObject({
      currentVideoId: 1,
      view: 'watch',
      playing: true,
      commentText: '',
    });
    expect(updated.userComments[0]?.text).toBe('Great breakdown');
  });
});
