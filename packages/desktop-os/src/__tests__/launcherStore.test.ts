import type { Reducer } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import type { LaunchableAppModule } from '../contracts/launchableAppModule';
import { collectModuleReducers, createLauncherStore, selectModuleState } from '../store/createLauncherStore';

const inventoryReducer: Reducer<{ count: number }> = (state = { count: 1 }) => state;

function moduleWithState(appId: string, stateKey: `app_${string}`): LaunchableAppModule {
  return {
    manifest: {
      id: appId,
      name: appId,
      icon: '📦',
      launch: { mode: 'window' },
    },
    state: {
      stateKey,
      reducer: inventoryReducer,
    },
    buildLaunchWindow: () => ({
      id: `window:${appId}`,
      title: appId,
      bounds: { x: 0, y: 0, w: 320, h: 200 },
      content: { kind: 'app', appKey: `${appId}:default` },
    }),
    renderWindow: () => null,
  };
}

describe('createLauncherStore', () => {
  it('creates one global store with engine reducers plus app reducers', () => {
    const inventoryModule = moduleWithState('inventory', 'app_inventory');
    const launcher = createLauncherStore([inventoryModule]);

    const state = launcher.store.getState() as Record<string, unknown>;
    expect(state).toHaveProperty('windowing');
    expect(state).toHaveProperty('runtimeSessions');
    expect(state).toHaveProperty('notifications');
    expect(state).toHaveProperty('debug');
    expect(state).toHaveProperty('hypercardArtifacts');
    expect(state).toHaveProperty('app_inventory');

    expect(selectModuleState<{ count: number }>(state, 'app_inventory')).toEqual({ count: 1 });
  });

  it('includes shared reducers alongside module reducers', () => {
    const inventoryModule = moduleWithState('inventory', 'app_inventory');
    const sharedReducer: Reducer<{ ready: boolean }> = (state = { ready: true }) => state;
    const launcher = createLauncherStore([inventoryModule], {
      sharedReducers: {
        shared_runtime: sharedReducer,
      },
    });

    const state = launcher.store.getState() as Record<string, unknown>;
    expect(state).toHaveProperty('shared_runtime');
    expect(state).toHaveProperty('app_inventory');
  });

  it('fails on duplicate app reducer keys', () => {
    expect(() =>
      collectModuleReducers([moduleWithState('inventory', 'app_shared'), moduleWithState('todo', 'app_shared')]),
    ).toThrow(/Duplicate app reducer key/);
  });

  it('fails when app reducer key collides with engine core reducer keys', () => {
    expect(() =>
      collectModuleReducers([moduleWithState('inventory', 'app_inventory'), moduleWithState('todo', 'app_todo')]),
    ).not.toThrow();
    expect(() =>
      collectModuleReducers([
        moduleWithState('inventory', 'app_inventory'),
        moduleWithState('todo', 'app_todo'),
        {
          ...moduleWithState('crm', 'app_crm'),
          state: {
            stateKey: 'windowing' as `app_${string}`,
            reducer: inventoryReducer,
          },
        },
      ]),
    ).toThrow(/reserved reducer key/);
  });

  it('fails when shared reducers collide with module reducers', () => {
    expect(() =>
      createLauncherStore([moduleWithState('inventory', 'app_inventory')], {
        sharedReducers: {
          app_inventory: inventoryReducer,
        },
      }),
    ).toThrow(/Duplicate launcher reducer key/);
  });

  it('fails when shared reducers try to override engine core reducer keys', () => {
    expect(() =>
      createLauncherStore([], {
        sharedReducers: {
          runtimeSessions: inventoryReducer,
        },
      }),
    ).toThrow(/reserved by engine core reducers/);
  });

  it('keeps the legacy pluginCardRuntime key reserved', () => {
    expect(() =>
      createLauncherStore([], {
        sharedReducers: {
          pluginCardRuntime: inventoryReducer,
        },
      }),
    ).toThrow(/reserved by engine core reducers/);
  });
});
