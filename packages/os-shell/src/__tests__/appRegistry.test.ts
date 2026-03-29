import type { Reducer } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import type { LaunchableAppModule } from '../contracts/launchableAppModule';
import { createAppRegistry } from '../registry/createAppRegistry';

const noopReducer: Reducer = (state = { ok: true }) => state;

function appModule(
  appId: string,
  options: {
    order?: number;
    stateKey?: `app_${string}`;
    iconId?: string;
  } = {},
): LaunchableAppModule {
  return {
    manifest: {
      id: appId,
      name: `App ${appId}`,
      icon: '📦',
      launch: { mode: 'window' },
      desktop: {
        order: options.order,
        id: options.iconId,
      },
    },
    state: options.stateKey
      ? {
          stateKey: options.stateKey,
          reducer: noopReducer,
        }
      : undefined,
    buildLaunchWindow: () => ({
      id: `window:${appId}`,
      title: appId,
      bounds: { x: 0, y: 0, w: 320, h: 240 },
      content: { kind: 'app', appKey: `${appId}:default` },
    }),
    renderWindow: () => null,
  };
}

describe('createAppRegistry', () => {
  it('sorts modules deterministically by desktop order then id', () => {
    const registry = createAppRegistry([
      appModule('todo', { order: 3 }),
      appModule('inventory', { order: 1 }),
      appModule('crm', { order: 3 }),
    ]);

    expect(registry.list().map((module) => module.manifest.id)).toEqual(['inventory', 'crm', 'todo']);
  });

  it('fails when manifest ids collide', () => {
    expect(() => createAppRegistry([appModule('inventory'), appModule('inventory')])).toThrow(
      /Duplicate app manifest id/,
    );
  });

  it('fails when module state keys collide', () => {
    expect(() =>
      createAppRegistry([
        appModule('inventory', { stateKey: 'app_main' }),
        appModule('todo', { stateKey: 'app_main' }),
      ]),
    ).toThrow(/Duplicate app state key/);
  });

  it('indexes modules by app id', () => {
    const inventory = appModule('inventory');
    const registry = createAppRegistry([inventory]);

    expect(registry.has('inventory')).toBe(true);
    expect(registry.get('inventory')).toBe(inventory);
    expect(registry.get('missing')).toBeUndefined();
  });
});
