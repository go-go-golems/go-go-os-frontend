import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSemHandlers } from '../sem/semRegistry';
import {
  ensureChatModulesRegistered,
  resetChatModulesRegistrationForTest,
} from '../runtime/registerChatModules';
import { STARTER_SUGGESTIONS_ENTITY_ID } from '../state/suggestions';
import { chatSessionSlice } from '../state/chatSessionSlice';
import { timelineSlice } from '../state/timelineSlice';
import { WsManager } from './wsManager';

class MockWebSocket {
  public onopen: (() => void) | null = null;
  public onclose: (() => void) | null = null;
  public onerror: (() => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  emitOpen() {
    this.onopen?.();
  }

  emitMessage(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  close() {
    this.onclose?.();
  }
}

function createStore() {
  return configureStore({
    reducer: {
      timeline: timelineSlice.reducer,
      chatSession: chatSessionSlice.reducer,
    },
  });
}

describe('wsManager', () => {
  beforeEach(() => {
    clearSemHandlers();
    resetChatModulesRegistrationForTest();
    ensureChatModulesRegistered();
  });

  it('dispatches SEM frames into timeline entities after connect', async () => {
    const store = createStore();
    const manager = new WsManager();
    const sockets: MockWebSocket[] = [];

    const connectPromise = manager.connect({
      convId: 'conv-live',
      dispatch: store.dispatch,
      hydrate: false,
      wsFactory: (url) => {
        const socket = new MockWebSocket(url);
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
      location: { protocol: 'http:', host: 'localhost' },
    });

    expect(sockets).toHaveLength(1);
    sockets[0].emitOpen();
    await connectPromise;

    sockets[0].emitMessage({
      sem: true,
      event: {
        type: 'timeline.upsert',
        id: 'msg-1',
        data: {
          convId: 'conv-live',
          version: '1',
          entity: {
            id: 'msg-1',
            kind: 'message',
            createdAtMs: '1',
            updatedAtMs: '1',
            props: {
              role: 'assistant',
              content: 'hello',
              streaming: true,
            },
          },
        },
      },
    });

    const state = store.getState();
    expect(state.chatSession.byConvId['conv-live'].connectionStatus).toBe('connected');
    expect(state.timeline.byConvId['conv-live'].order).toEqual(['msg-1']);
    expect(state.timeline.byConvId['conv-live'].byId['msg-1'].kind).toBe('message');

    manager.disconnect();
  });

  it('builds websocket URL with optional profile selection query params', async () => {
    const store = createStore();
    const manager = new WsManager();
    const sockets: MockWebSocket[] = [];

    const connectPromise = manager.connect({
      convId: 'conv-profile',
      dispatch: store.dispatch,
      profileSelection: {
        profile: 'agent',
        registry: 'default',
      },
      hydrate: false,
      wsFactory: (url) => {
        const socket = new MockWebSocket(url);
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
      location: { protocol: 'https:', host: 'chat.local' },
    });

    expect(sockets).toHaveLength(1);
    expect(sockets[0].url).toBe('wss://chat.local/ws?conv_id=conv-profile&profile=agent&registry=default');
    sockets[0].emitOpen();
    await connectPromise;
    manager.disconnect();
  });

  it('buffers frames during hydrate and replays them after snapshot apply', async () => {
    const store = createStore();
    const manager = new WsManager();
    const sockets: MockWebSocket[] = [];

    let resolveFetch!: (response: unknown) => void;
    const fetchPromise = new Promise<unknown>((resolve) => {
      resolveFetch = resolve as (response: unknown) => void;
    });
    const fetchImpl = vi.fn(() => fetchPromise as Promise<Response>);

    const connectPromise = manager.connect({
      convId: 'conv-hydrate',
      dispatch: store.dispatch,
      wsFactory: (url) => {
        const socket = new MockWebSocket(url);
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
      fetchImpl,
      location: { protocol: 'http:', host: 'localhost' },
    });

    expect(sockets).toHaveLength(1);
    sockets[0].emitOpen();

    // Arrives before hydrate completes -> should be buffered.
    sockets[0].emitMessage({
      sem: true,
      event: {
        type: 'timeline.upsert',
        id: 'msg-buffered',
        seq: 1,
        data: {
          convId: 'conv-hydrate',
          version: '1',
          entity: {
            id: 'msg-buffered',
            kind: 'message',
            createdAtMs: '1',
            updatedAtMs: '1',
            props: {
              role: 'assistant',
              content: 'buffered',
              streaming: true,
            },
          },
        },
      },
    });

    resolveFetch({
      ok: true,
      json: async () => ({
        convId: 'conv-hydrate',
        version: '1',
        serverTimeMs: '0',
        entities: [],
      }),
    });

    await connectPromise;

    const state = store.getState();
    expect(fetchImpl).toHaveBeenCalledWith('/api/timeline?conv_id=conv-hydrate');
    expect(state.timeline.byConvId['conv-hydrate'].order).toEqual(['msg-buffered']);

    manager.disconnect();
  });

  it('hydrates by merging snapshot without clearing existing timeline order', async () => {
    const store = createStore();
    const manager = new WsManager();
    const sockets: MockWebSocket[] = [];

    store.dispatch(
      timelineSlice.actions.addEntity({
        convId: 'conv-focus',
        entity: {
          id: STARTER_SUGGESTIONS_ENTITY_ID,
          kind: 'suggestions',
          createdAt: 10,
          version: 1,
          props: { source: 'starter', items: ['Summarize today sales'], consumedAt: 20 },
        },
      })
    );
    store.dispatch(
      timelineSlice.actions.addEntity({
        convId: 'conv-focus',
        entity: {
          id: 'user-1',
          kind: 'message',
          createdAt: 11,
          version: 1,
          props: { role: 'user', content: 'Summarize today sales' },
        },
      })
    );
    store.dispatch(
      timelineSlice.actions.addEntity({
        convId: 'conv-focus',
        entity: {
          id: 'assistant-1',
          kind: 'message',
          createdAt: 12,
          version: 1,
          props: { role: 'assistant', content: 'Initial summary' },
        },
      })
    );

    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        convId: 'conv-focus',
        version: '99',
        serverTimeMs: '0',
        entities: [
          {
            id: 'assistant-1',
            kind: 'message',
            createdAtMs: '12',
            updatedAtMs: '13',
            props: { role: 'assistant', content: 'Hydrated summary' },
          },
          {
            id: 'status-1',
            kind: 'status',
            createdAtMs: '14',
            updatedAtMs: '14',
            props: { text: 'Updating widget' },
          },
        ],
      }),
    }));

    const connectPromise = manager.connect({
      convId: 'conv-focus',
      dispatch: store.dispatch,
      wsFactory: (url) => {
        const socket = new MockWebSocket(url);
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
      fetchImpl: fetchImpl as unknown as typeof fetch,
      location: { protocol: 'http:', host: 'localhost' },
    });

    expect(sockets).toHaveLength(1);
    sockets[0].emitOpen();
    await connectPromise;

    const conv = store.getState().timeline.byConvId['conv-focus'];
    expect(conv.order).toEqual([STARTER_SUGGESTIONS_ENTITY_ID, 'user-1', 'assistant-1', 'status-1']);
    expect(conv.byId[STARTER_SUGGESTIONS_ENTITY_ID]).toBeDefined();
    expect(conv.byId['assistant-1'].props).toEqual({
      role: 'assistant',
      content: 'Hydrated summary',
    });
    expect(fetchImpl).toHaveBeenCalledWith('/api/timeline?conv_id=conv-focus');

    manager.disconnect();
  });

  it('traces strict-mode style reconnect lifecycle with hydrate and buffered replay', async () => {
    const store = createStore();
    const manager = new WsManager();
    const sockets: MockWebSocket[] = [];
    const phases: string[] = [];

    const firstConnect = manager.connect({
      convId: 'conv-remount',
      dispatch: store.dispatch,
      hydrate: false,
      onLifecycle: (event) => phases.push(event.phase),
      wsFactory: (url) => {
        const socket = new MockWebSocket(url);
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
      location: { protocol: 'http:', host: 'localhost' },
    });

    expect(sockets).toHaveLength(1);
    sockets[0].emitOpen();
    await firstConnect;
    manager.disconnect();

    let resolveFetch!: (response: unknown) => void;
    const fetchPromise = new Promise<unknown>((resolve) => {
      resolveFetch = resolve as (response: unknown) => void;
    });
    const fetchImpl = vi.fn(() => fetchPromise as Promise<Response>);

    const secondConnect = manager.connect({
      convId: 'conv-remount',
      dispatch: store.dispatch,
      onLifecycle: (event) => phases.push(event.phase),
      wsFactory: (url) => {
        const socket = new MockWebSocket(url);
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
      fetchImpl,
      location: { protocol: 'http:', host: 'localhost' },
    });

    expect(sockets).toHaveLength(2);
    sockets[1].emitOpen();
    sockets[1].emitMessage({
      sem: true,
      event: {
        type: 'timeline.upsert',
        id: 'msg-remount',
        seq: 7,
        data: {
          convId: 'conv-remount',
          version: '2',
          entity: {
            id: 'msg-remount',
            kind: 'message',
            createdAtMs: '10',
            updatedAtMs: '10',
            props: {
              role: 'assistant',
              content: 'hydrated after remount',
              streaming: true,
            },
          },
        },
      },
    });

    resolveFetch({
      ok: true,
      json: async () => ({
        convId: 'conv-remount',
        version: '2',
        serverTimeMs: '0',
        entities: [],
      }),
    });

    await secondConnect;

    expect(fetchImpl).toHaveBeenCalledWith('/api/timeline?conv_id=conv-remount');
    expect(store.getState().timeline.byConvId['conv-remount'].order).toEqual(['msg-remount']);
    expect(phases.slice(0, 5)).toEqual([
      'connect.begin',
      'ws.open',
      'disconnect',
      'connect.begin',
      'ws.open',
    ]);
    const hydrateStartIndex = phases.indexOf('hydrate.start');
    const bufferedIndex = phases.indexOf('frame.buffered');
    const snapshotIndex = phases.indexOf('hydrate.snapshot.applied');
    const replayBeginIndex = phases.indexOf('replay.begin');
    const replayCompleteIndex = phases.indexOf('replay.complete');
    const hydrateCompleteIndex = phases.indexOf('hydrate.complete');
    expect(hydrateStartIndex).toBeGreaterThan(4);
    expect(bufferedIndex).toBeGreaterThan(4);
    expect(snapshotIndex).toBeGreaterThan(Math.max(hydrateStartIndex, bufferedIndex));
    expect(replayBeginIndex).toBeGreaterThan(snapshotIndex);
    expect(replayCompleteIndex).toBeGreaterThan(replayBeginIndex);
    expect(hydrateCompleteIndex).toBeGreaterThan(replayCompleteIndex);

    manager.disconnect();
    expect(phases[phases.length - 1]).toBe('disconnect');
  });
});
