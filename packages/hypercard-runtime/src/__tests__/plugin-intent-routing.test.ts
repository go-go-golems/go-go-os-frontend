import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { notificationsReducer } from '@hypercard/engine';
import { pluginCardRuntimeReducer, registerRuntimeSession } from '../features/pluginCardRuntime';
import { openWindow, windowingReducer } from '@hypercard/engine/desktop-core';
import { dispatchRuntimeAction } from '../runtime-host/pluginIntentRouting';

function inventoryReducer(state = { events: [] as unknown[] }, action: { type: string; payload?: unknown }) {
  if (action.type === 'inventory/reserve-item') {
    return {
      ...state,
      events: [...state.events, action.payload],
    };
  }

  return state;
}

describe('dispatchRuntimeAction', () => {
  it('routes domain and system actions to reducers while preserving nav behavior', () => {
    const sessionId = 'session-routing';
    const windowId = 'window:home:session-routing';

    const store = configureStore({
      reducer: {
        pluginCardRuntime: pluginCardRuntimeReducer,
        windowing: windowingReducer,
        notifications: notificationsReducer,
        inventory: inventoryReducer,
      },
    });

    store.dispatch(
      openWindow({
        id: windowId,
        title: 'Home',
        bounds: { x: 100, y: 30, w: 420, h: 340 },
        content: {
          kind: 'card',
          card: {
            stackId: 'inventory',
            cardId: 'home',
            cardSessionId: sessionId,
          },
        },
      }),
    );

    store.dispatch(
      registerRuntimeSession({
        sessionId,
        stackId: 'inventory',
        status: 'ready',
        capabilities: {
          domain: ['inventory'],
          system: ['nav.go', 'nav.back', 'notify.show', 'window.close'],
        },
      }),
    );

    dispatchRuntimeAction(
      {
        type: 'inventory/reserve-item',
        payload: { sku: 'A-1' },
      },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'home',
        windowId,
      },
    );

    dispatchRuntimeAction(
      {
        type: 'nav.go',
        payload: { cardId: 'detail', param: 'A-1' },
      },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'home',
        windowId,
      },
    );

    dispatchRuntimeAction(
      { type: 'nav.back' },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'detail',
        windowId,
      },
    );

    dispatchRuntimeAction(
      {
        type: 'notify.show',
        payload: { message: 'Reserved A-1' },
      },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'home',
        windowId,
      },
    );

    let state = store.getState();

    expect(state.inventory.events).toEqual([{ sku: 'A-1' }]);
    expect(state.windowing.sessions[sessionId].nav).toEqual([{ card: 'home' }]);
    expect(state.notifications.toast).toBe('Reserved A-1');

    dispatchRuntimeAction(
      { type: 'window.close' },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'home',
        windowId,
      },
    );

    state = store.getState();

    expect(state.windowing.windows[windowId]).toBeUndefined();
    expect(state.windowing.sessions[sessionId]).toBeUndefined();
  });

  it('does not route denied system actions to downstream reducers', () => {
    const sessionId = 'session-denied';
    const windowId = 'window:home:session-denied';

    const store = configureStore({
      reducer: {
        pluginCardRuntime: pluginCardRuntimeReducer,
        windowing: windowingReducer,
        notifications: notificationsReducer,
        inventory: inventoryReducer,
      },
    });

    store.dispatch(
      openWindow({
        id: windowId,
        title: 'Home',
        bounds: { x: 100, y: 30, w: 420, h: 340 },
        content: {
          kind: 'card',
          card: {
            stackId: 'inventory',
            cardId: 'home',
            cardSessionId: sessionId,
          },
        },
      }),
    );

    store.dispatch(
      registerRuntimeSession({
        sessionId,
        stackId: 'inventory',
        status: 'ready',
        capabilities: {
          system: ['nav.go'],
        },
      }),
    );

    dispatchRuntimeAction(
      { type: 'window.close' },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'home',
        windowId,
      },
    );

    const state = store.getState();

    expect(state.windowing.windows[windowId]).toBeDefined();
    const deniedEntry = state.pluginCardRuntime.timeline.find((entry) => entry.actionType === 'window.close');
    expect(deniedEntry?.outcome).toBe('denied');
  });

  it('emits canonical domain action type and runtime correlation metadata', () => {
    const sessionId = 'session-domain';
    const windowId = 'window:domain:session-domain';
    const observedActions: Array<{ type?: string; meta?: Record<string, unknown> }> = [];

    const store = configureStore({
      reducer: {
        pluginCardRuntime: pluginCardRuntimeReducer,
        windowing: windowingReducer,
        notifications: notificationsReducer,
        inventory: inventoryReducer,
      },
      middleware: (getDefault) =>
        getDefault().concat((_) => (next) => (action) => {
          if (typeof action === 'object' && action && 'type' in action) {
            observedActions.push(action as { type?: string; meta?: Record<string, unknown> });
          }
          return next(action);
        }),
    });

    store.dispatch(
      registerRuntimeSession({
        sessionId,
        stackId: 'domain-demo',
        status: 'ready',
        capabilities: {
          domain: ['domain-demo'],
        },
      }),
    );

    dispatchRuntimeAction(
      {
        type: 'domain-demo/command.request',
        payload: {
          op: 'create-session',
          requestId: 'req-routing',
          args: {},
        },
      },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'home',
        windowId,
      },
    );

    const actions = store.getState().pluginCardRuntime.timeline;
    const applied = actions.find((entry) => entry.actionType === 'domain-demo/command.request');
    expect(applied?.outcome).toBe('applied');

    const emitted = observedActions.find((action) => action.type === 'domain-demo/command.request');
    expect(emitted?.meta).toEqual(
      expect.objectContaining({
        source: 'plugin-runtime',
        sessionId,
        runtimeSessionId: sessionId,
        cardId: 'home',
        windowId,
      }),
    );
  });
});
