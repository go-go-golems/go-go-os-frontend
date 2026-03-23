import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import INVENTORY_STACK from '../plugin-runtime/fixtures/inventory-stack.vm.js?raw';
import { closeWindow, openWindow } from '@hypercard/engine/desktop-core';
import { createAppStore } from './createAppStore';
import { registerRuntimeSession, selectRuntimeSession } from '../features/runtimeSessions';
import {
  BROKER_OWNED_RUNTIME_SESSION,
  DEFAULT_RUNTIME_SESSION_MANAGER,
  type RuntimeSessionManager,
} from '../runtime-session-manager';
import { clearRuntimePackages, registerRuntimePackage } from '../runtime-packages';
import { clearRuntimeSurfaceTypes, registerRuntimeSurfaceType } from '../runtime-packs';
import { TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE, TEST_UI_RUNTIME_PACKAGE } from '../testRuntimeUi';
import { createRuntimeSessionLifecycleMiddleware } from './runtimeSessionLifecycleMiddleware';
import { configureStore } from '@reduxjs/toolkit';
import { debugReducer, notificationsReducer } from '@hypercard/engine';
import { windowingReducer } from '@hypercard/engine/desktop-core';
import { runtimeSessionsReducer } from '../features/runtimeSessions/runtimeSessionsSlice';
import { hypercardArtifactsReducer } from '../hypercard/artifacts/artifactsSlice';

describe('runtimeSessionLifecycleMiddleware', () => {
  async function flushEffects() {
    await Promise.resolve();
    await Promise.resolve();
  }

  beforeEach(() => {
    clearRuntimePackages();
    clearRuntimeSurfaceTypes();
    registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);
  });

  afterEach(() => {
    DEFAULT_RUNTIME_SESSION_MANAGER.clear();
    clearRuntimePackages();
    clearRuntimeSurfaceTypes();
  });

  it('disposes the runtime session only when the last surface window closes', async () => {
    const { createStore } = createAppStore({});
    const store = createStore();

    await DEFAULT_RUNTIME_SESSION_MANAGER.ensureSession({
      bundleId: 'inventory',
      sessionId: 'session-lifecycle',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });

    store.dispatch(
      registerRuntimeSession({
        sessionId: 'session-lifecycle',
        bundleId: 'inventory',
        status: 'ready',
      }),
    );

    store.dispatch(
      openWindow({
        id: 'window:one',
        title: 'One',
        icon: '1',
        bounds: { x: 0, y: 0, w: 300, h: 200 },
        content: {
          kind: 'surface',
          surface: {
            bundleId: 'inventory',
            surfaceId: 'lowStock',
            surfaceSessionId: 'session-lifecycle',
          },
        },
      }),
    );

    store.dispatch(
      openWindow({
        id: 'window:two',
        title: 'Two',
        icon: '2',
        bounds: { x: 20, y: 20, w: 300, h: 200 },
        content: {
          kind: 'surface',
          surface: {
            bundleId: 'inventory',
            surfaceId: 'lowStock',
            surfaceSessionId: 'session-lifecycle',
          },
        },
      }),
    );

    store.dispatch(closeWindow('window:one'));
    await flushEffects();
    expect(DEFAULT_RUNTIME_SESSION_MANAGER.getSession('session-lifecycle')).not.toBeNull();
    expect(selectRuntimeSession(store.getState() as never, 'session-lifecycle')).not.toBeUndefined();

    store.dispatch(closeWindow('window:two'));
    await flushEffects();
    expect(DEFAULT_RUNTIME_SESSION_MANAGER.getSession('session-lifecycle')).toBeNull();
    expect(selectRuntimeSession(store.getState() as never, 'session-lifecycle')).toBeUndefined();
  });

  it('does not dispose a non-window-owned runtime session on last window close', async () => {
    const disposeSession = vi.fn(() => true);
    const manager: RuntimeSessionManager = {
      ensureSession: async () => {
        throw new Error('not used');
      },
      getSession: () => null,
      getSummary: (sessionId) =>
        sessionId === 'session-broker'
          ? {
              sessionId,
              bundleId: 'inventory',
              packageIds: ['ui'],
              surfaces: ['lowStock'],
              surfaceTypes: { lowStock: 'ui.card.v1' },
              title: 'Inventory',
              status: 'ready',
              attachedViewIds: [],
              ownership: BROKER_OWNED_RUNTIME_SESSION,
            }
          : null,
      listSessions: () => [],
      disposeSession,
      clear: () => {},
      subscribe: () => () => {},
    };

    const lifecycle = createRuntimeSessionLifecycleMiddleware({ manager });
    const store = configureStore({
      reducer: {
        runtimeSessions: runtimeSessionsReducer,
        windowing: windowingReducer,
        notifications: notificationsReducer,
        debug: debugReducer,
        hypercardArtifacts: hypercardArtifactsReducer,
      },
      middleware: (getDefault) => getDefault().concat(lifecycle.middleware),
    });

    store.dispatch(
      registerRuntimeSession({
        sessionId: 'session-broker',
        bundleId: 'inventory',
        status: 'ready',
      }),
    );

    store.dispatch(
      openWindow({
        id: 'window:broker',
        title: 'Broker Session',
        icon: 'B',
        bounds: { x: 0, y: 0, w: 300, h: 200 },
        content: {
          kind: 'surface',
          surface: {
            bundleId: 'inventory',
            surfaceId: 'lowStock',
            surfaceSessionId: 'session-broker',
          },
        },
      }),
    );

    store.dispatch(closeWindow('window:broker'));
    await flushEffects();

    expect(selectRuntimeSession(store.getState() as never, 'session-broker')).not.toBeUndefined();
    expect(disposeSession).not.toHaveBeenCalled();
  });
});
