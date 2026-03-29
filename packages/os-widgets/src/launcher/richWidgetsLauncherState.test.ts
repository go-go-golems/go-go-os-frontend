import { describe, expect, it } from 'vitest';
import {
  richWidgetsLauncherActions,
  richWidgetsLauncherReducer,
} from './richWidgetsLauncherState';

describe('richWidgetsLauncherState', () => {
  it('tracks launch stats per app id', () => {
    let state = richWidgetsLauncherReducer(undefined, { type: 'unknown' });

    state = richWidgetsLauncherReducer(
      state,
      richWidgetsLauncherActions.markLaunched({
        appId: 'log-viewer',
        reason: 'icon',
      }),
    );
    state = richWidgetsLauncherReducer(
      state,
      richWidgetsLauncherActions.markLaunched({
        appId: 'log-viewer',
        reason: 'startup',
      }),
    );
    state = richWidgetsLauncherReducer(
      state,
      richWidgetsLauncherActions.markLaunched({
        appId: 'mac-calc',
        reason: 'menu',
      }),
    );

    expect(state.byAppId['log-viewer']).toEqual({
      launchCount: 2,
      lastLaunchReason: 'startup',
    });
    expect(state.byAppId['mac-calc']).toEqual({
      launchCount: 1,
      lastLaunchReason: 'menu',
    });
  });
});
