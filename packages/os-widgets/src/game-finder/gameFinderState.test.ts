import { describe, expect, it } from 'vitest';
import {
  createGameFinderStateSeed,
  gameFinderActions,
  gameFinderReducer,
} from './gameFinderState';

describe('gameFinderState', () => {
  it('creates a normalized seed', () => {
    const state = createGameFinderStateSeed({
      view: 'detail',
      selectedGameId: 'g2',
      filter: 'installed',
      sortBy: 'rating',
      search: 'bolo',
      installingId: 'g5',
    });

    expect(state).toMatchObject({
      initialized: true,
      view: 'detail',
      selectedGameId: 'g2',
      filter: 'installed',
      sortBy: 'rating',
      search: 'bolo',
      installingId: 'g5',
    });
  });

  it('marks a game installed and clears the install flag', () => {
    const seeded = createGameFinderStateSeed({
      installingId: 'g6',
    });

    const updated = gameFinderReducer(
      seeded,
      gameFinderActions.markInstalled('g6'),
    );

    expect(updated.installingId).toBeNull();
    expect(updated.games.find((game) => game.id === 'g6')?.installed).toBe(true);
  });
});
