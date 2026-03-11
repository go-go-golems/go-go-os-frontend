import { describe, expect, it, vi } from 'vitest';
import type { RuntimeBundleDefinition } from '@hypercard/engine';
import { createRuntimeSessionTaskManagerSource } from './runtimeSessionSource';

const INVENTORY_BUNDLE: RuntimeBundleDefinition = {
  id: 'inventory',
  name: 'Inventory',
  icon: '📦',
  homeSurface: 'home',
  plugin: { packageIds: ['ui'], bundleCode: '' },
  surfaces: {
    home: { id: 'home', type: 'plugin', title: 'Home', icon: '🏠', ui: {} },
    report: { id: 'report', type: 'plugin', title: 'Report', icon: '📊', ui: {} },
  },
};

describe('runtimeSessionTaskManagerSource', () => {
  it('derives runtime-session rows from runtime and windowing state', () => {
    const source = createRuntimeSessionTaskManagerSource({
      bundles: [INVENTORY_BUNDLE],
      ownerAppId: 'hypercard-runtime-debug',
      dispatch: vi.fn(),
      subscribe: () => () => {},
      getState: () => ({
        runtimeSessions: {
          sessions: {
            'session-1': {
              bundleId: 'inventory',
              status: 'ready',
              error: null,
              capabilities: { domain: 'all', system: [] },
              sessionState: {},
              surfaceState: {
                home: {},
                report: {},
              },
            },
          },
        },
        windowing: {
          sessions: {
            'session-1': {
              nav: [{ surface: 'report' }],
            },
          },
        },
      }),
    });

    expect(source.listRows()).toEqual([
      expect.objectContaining({
        id: 'session-1',
        kind: 'runtime-session',
        title: 'Inventory · report',
        details: expect.objectContaining({
          bundleId: 'inventory',
          currentSurface: 'report',
          surfaceCount: '2',
        }),
      }),
    ]);
  });

  it('dispatches open and inspect actions', () => {
    const dispatch = vi.fn();
    const source = createRuntimeSessionTaskManagerSource({
      bundles: [INVENTORY_BUNDLE],
      ownerAppId: 'hypercard-runtime-debug',
      dispatch,
      subscribe: () => () => {},
      getState: () => ({
        runtimeSessions: {
          sessions: {
            'session-1': {
              bundleId: 'inventory',
              status: 'ready',
              error: null,
              capabilities: { domain: 'all', system: [] },
              sessionState: {},
              surfaceState: {
                home: {},
              },
            },
          },
        },
        windowing: {
          sessions: {
            'session-1': {
              nav: [{ surface: 'home' }],
            },
          },
        },
      }),
    });

    source.invoke('open', 'session-1');
    source.invoke('inspect', 'session-1');

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch.mock.calls[0][0].type).toBe('windowing/openWindow');
    expect(dispatch.mock.calls[0][0].payload.content.kind).toBe('surface');
    expect(dispatch.mock.calls[0][0].payload.content.surface.surfaceId).toBe('home');
    expect(dispatch.mock.calls[1][0].type).toBe('windowing/openWindow');
    expect(dispatch.mock.calls[1][0].payload.content.appKey).toBe('hypercard-runtime-debug:stacks');
  });
});
