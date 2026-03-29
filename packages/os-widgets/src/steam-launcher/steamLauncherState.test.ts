import { describe, expect, it } from 'vitest';
import {
  createSteamLauncherStateSeed,
  steamLauncherActions,
  steamLauncherReducer,
} from './steamLauncherState';

describe('steamLauncherState', () => {
  it('creates a normalized seed', () => {
    const state = createSteamLauncherStateSeed({
      activeTab: 'downloads',
      selectedGameId: 3,
      showFriends: false,
      filter: 'installed',
    });

    expect(state).toMatchObject({
      initialized: true,
      activeTab: 'downloads',
      selectedGameId: 3,
      showFriends: false,
      filter: 'installed',
    });
  });

  it('marks installs complete and launches games', () => {
    const seeded = createSteamLauncherStateSeed();
    const installing = steamLauncherReducer(
      seeded,
      steamLauncherActions.startInstall(5),
    );
    const installed = steamLauncherReducer(
      installing,
      steamLauncherActions.finishInstall(5),
    );
    const launched = steamLauncherReducer(
      installed,
      steamLauncherActions.startLaunching(1),
    );

    expect(installed.installing[5]).toBe(false);
    expect(installed.games.find((game) => game.id === 5)?.installed).toBe(true);
    expect(launched.launchingGameId).toBe(1);
  });
});
