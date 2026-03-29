import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import {
  ingestRuntimeAction,
  runtimeSessionsReducer,
  registerRuntimeSession,
  removeRuntimeSession,
} from '../features/runtimeSessions';

function createStore() {
  return configureStore({
    reducer: {
      runtimeSessions: runtimeSessionsReducer,
    },
  });
}

describe('runtimeSessions reducer', () => {
  it('tracks applied/denied/ignored outcomes and queues routed actions', () => {
    const store = createStore();

    store.dispatch(
      registerRuntimeSession({
        sessionId: 'session-1',
        stackId: 'inventory',
        status: 'ready',
        capabilities: {
          domain: ['inventory'],
          system: ['nav.go'],
        },
      }),
    );

    store.dispatch(
      ingestRuntimeAction({
        sessionId: 'session-1',
        surfaceId: 'lowStock',
        action: {
          type: 'draft.patch',
          payload: { count: 2 },
        },
      }),
    );

    store.dispatch(
      ingestRuntimeAction({
        sessionId: 'session-1',
        surfaceId: 'lowStock',
        action: {
          type: 'draft.unknown-op',
          payload: {},
        },
      }),
    );

    store.dispatch(
      ingestRuntimeAction({
        sessionId: 'session-1',
        surfaceId: 'lowStock',
        action: {
          type: 'billing/charge',
          payload: { id: 'ch_1' },
        },
      }),
    );

    store.dispatch(
      ingestRuntimeAction({
        sessionId: 'session-1',
        surfaceId: 'lowStock',
        action: {
          type: 'inventory/reserve-item',
          payload: { sku: 'A-1' },
        },
      }),
    );

    store.dispatch(
      ingestRuntimeAction({
        sessionId: 'session-1',
        surfaceId: 'lowStock',
        action: {
          type: 'notify.show',
          payload: { message: 'reserved' },
        },
      }),
    );

    store.dispatch(
      ingestRuntimeAction({
        sessionId: 'session-1',
        surfaceId: 'lowStock',
        action: {
          type: 'nav.go',
          payload: { surfaceId: 'detail' },
        },
      }),
    );

    const state = store.getState().runtimeSessions;

    expect(state.sessions['session-1'].surfaceState.lowStock).toEqual({ count: 2 });
    expect(state.pendingDomainIntents).toHaveLength(1);
    expect(state.pendingSystemIntents).toHaveLength(1);
    expect(state.pendingNavIntents).toHaveLength(1);

    const outcomes = state.timeline.map((entry) => ({
      kind: entry.kind,
      actionType: entry.actionType,
      outcome: entry.outcome,
      reason: entry.reason,
    }));

    expect(outcomes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'draft', actionType: 'draft.patch', outcome: 'applied' }),
        expect.objectContaining({ kind: 'draft', actionType: 'draft.unknown-op', outcome: 'ignored' }),
        expect.objectContaining({ kind: 'domain', actionType: 'billing/charge', outcome: 'denied' }),
        expect.objectContaining({ kind: 'domain', actionType: 'inventory/reserve-item', outcome: 'applied' }),
        expect.objectContaining({ kind: 'system', actionType: 'notify.show', outcome: 'denied' }),
        expect.objectContaining({ kind: 'system', actionType: 'nav.go', outcome: 'applied' }),
      ]),
    );
  });

  it('cleans up session-owned pending actions on session removal', () => {
    const store = createStore();

    store.dispatch(
      registerRuntimeSession({
        sessionId: 'session-cleanup',
        stackId: 'inventory',
        capabilities: {
          domain: 'all',
          system: 'all',
        },
      }),
    );

    store.dispatch(
      ingestRuntimeAction({
        sessionId: 'session-cleanup',
        surfaceId: 'home',
        action: {
          type: 'inventory/reserve-item',
        },
      }),
    );

    store.dispatch(
      ingestRuntimeAction({
        sessionId: 'session-cleanup',
        surfaceId: 'home',
        action: {
          type: 'nav.go',
          payload: { surfaceId: 'detail' },
        },
      }),
    );

    let state = store.getState().runtimeSessions;
    expect(state.pendingDomainIntents).toHaveLength(1);
    expect(state.pendingSystemIntents).toHaveLength(1);

    store.dispatch(removeRuntimeSession({ sessionId: 'session-cleanup' }));

    state = store.getState().runtimeSessions;
    expect(state.sessions['session-cleanup']).toBeUndefined();
    expect(state.pendingDomainIntents.find((intent) => intent.sessionId === 'session-cleanup')).toBeUndefined();
    expect(state.pendingSystemIntents.find((intent) => intent.sessionId === 'session-cleanup')).toBeUndefined();
    expect(state.pendingNavIntents.find((intent) => intent.sessionId === 'session-cleanup')).toBeUndefined();
  });

  it('routes nav.* actions to nav queue while keeping all allowed system actions in system queue', () => {
    const store = createStore();

    store.dispatch(
      registerRuntimeSession({
        sessionId: 'session-nav',
        stackId: 'inventory',
        capabilities: {
          system: ['nav.go', 'window.close'],
        },
      }),
    );

    store.dispatch(
      ingestRuntimeAction({
        sessionId: 'session-nav',
        surfaceId: 'home',
        action: {
          type: 'nav.go',
          payload: { surfaceId: 'detail' },
        },
      }),
    );

    store.dispatch(
      ingestRuntimeAction({
        sessionId: 'session-nav',
        surfaceId: 'home',
        action: {
          type: 'window.close',
          payload: { windowId: 'w1' },
        },
      }),
    );

    store.dispatch(
      ingestRuntimeAction({
        sessionId: 'session-nav',
        surfaceId: 'home',
        action: {
          type: 'nav.back',
          payload: {},
        },
      }),
    );

    const state = store.getState().runtimeSessions;

    expect(state.pendingSystemIntents.map((intent) => intent.type)).toEqual(['nav.go', 'window.close']);
    expect(state.pendingNavIntents.map((intent) => intent.type)).toEqual(['nav.go']);

    const deniedNavBack = state.timeline.find((entry) => entry.actionType === 'nav.back');
    expect(deniedNavBack?.outcome).toBe('denied');
    expect(deniedNavBack?.reason).toContain('nav.back');
  });
});
