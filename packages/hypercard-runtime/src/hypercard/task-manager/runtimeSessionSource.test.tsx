import { describe, expect, it, vi } from 'vitest';
import type { RuntimeBundleDefinition } from '@hypercard/engine';
import { createRuntimeSessionTaskManagerSource } from './runtimeSessionSource';
import {
  WINDOW_OWNED_RUNTIME_SESSION,
  type RuntimeSessionManager,
} from '../../runtime-session-manager';

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
    const manager: RuntimeSessionManager = {
      ensureSession: vi.fn() as never,
      getSession: vi.fn() as never,
      getSummary: vi.fn() as never,
      listSessions: () => [
        {
          sessionId: 'session-1',
          bundleId: 'inventory',
          packageIds: ['ui'],
          surfaces: ['home', 'report'],
          surfaceTypes: { home: 'ui.card.v1', report: 'ui.card.v1' },
          title: 'Inventory',
          status: 'ready',
          attachedViewIds: ['window:one'],
          ownership: WINDOW_OWNED_RUNTIME_SESSION,
        },
      ],
      disposeSession: vi.fn(() => true),
      clear: vi.fn(),
      subscribe: () => () => {},
    };

    const source = createRuntimeSessionTaskManagerSource({
      manager,
      bundles: [INVENTORY_BUNDLE],
      ownerAppId: 'hypercard-runtime-debug',
      dispatch: vi.fn(),
      subscribe: () => () => {},
      getState: () => ({
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
          ownership: 'window-owned',
          currentSurface: 'report',
          surfaceCount: '2',
          attachedViews: '1',
        }),
      }),
    ]);
  });

  it('dispatches open and inspect actions', () => {
    const manager: RuntimeSessionManager = {
      ensureSession: vi.fn() as never,
      getSession: vi.fn() as never,
      getSummary: vi.fn() as never,
      listSessions: () => [
        {
          sessionId: 'session-1',
          bundleId: 'inventory',
          packageIds: ['ui'],
          surfaces: ['home'],
          surfaceTypes: { home: 'ui.card.v1' },
          title: 'Inventory',
          status: 'ready',
          attachedViewIds: [],
          ownership: WINDOW_OWNED_RUNTIME_SESSION,
        },
      ],
      disposeSession: vi.fn(() => true),
      clear: vi.fn(),
      subscribe: () => () => {},
    };

    const dispatch = vi.fn();
    const focusJsConsole = vi.fn();
    const source = createRuntimeSessionTaskManagerSource({
      manager,
      bundles: [INVENTORY_BUNDLE],
      ownerAppId: 'hypercard-runtime-debug',
      dispatch,
      focusJsConsole,
      subscribe: () => () => {},
      getState: () => ({
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
    source.invoke('js-console', 'session-1');
    source.invoke('inspect', 'session-1');

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(focusJsConsole).toHaveBeenCalledWith('session-1');
    expect(dispatch.mock.calls[0][0].type).toBe('windowing/openWindow');
    expect(dispatch.mock.calls[0][0].payload.content.kind).toBe('surface');
    expect(dispatch.mock.calls[0][0].payload.content.surface.surfaceId).toBe('home');
    expect(dispatch.mock.calls[1][0].type).toBe('windowing/openWindow');
    expect(dispatch.mock.calls[1][0].payload.content.appKey).toBe('hypercard-runtime-debug:stacks');
  });
});
