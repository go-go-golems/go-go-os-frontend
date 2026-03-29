// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { chatSessionReducer } from '../state/chatSessionSlice';
import { chatProfilesReducer, chatProfilesSlice } from '../state/profileSlice';
import { timelineReducer } from '../state/timelineSlice';
import { useConversation } from './useConversation';

const connectMock = vi.fn(async () => undefined);
const disconnectMock = vi.fn(() => undefined);
const sendMock = vi.fn(async () => undefined);

vi.mock('./conversationManager', () => ({
  conversationManager: {
    connect: (...args: unknown[]) => connectMock(...args),
    disconnect: (...args: unknown[]) => disconnectMock(...args),
    send: (...args: unknown[]) => sendMock(...args),
  },
}));

function createStore() {
  return configureStore({
    reducer: {
      timeline: timelineReducer,
      chatSession: chatSessionReducer,
      chatProfiles: chatProfilesReducer,
    },
  });
}

function HookHarness({
  convId,
  profilePolicy,
}: {
  convId: string;
  profilePolicy?: Parameters<typeof useConversation>[2];
}) {
  useConversation(convId, '/api/apps/test', profilePolicy);
  return null;
}

const roots: Root[] = [];
const containers: HTMLElement[] = [];

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  connectMock.mockClear();
  disconnectMock.mockClear();
  sendMock.mockClear();
  for (const root of roots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of containers.splice(0)) {
    container.remove();
  }
});

describe('useConversation profile policy', () => {
  it('does not inherit a global selected profile when policy is none', async () => {
    const store = createStore();
    store.dispatch(chatProfilesSlice.actions.setSelectedProfile({ profile: 'inventory' }));

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(
        <Provider store={store}>
          <HookHarness convId="conv-none" profilePolicy={{ kind: 'none' }} />
        </Provider>,
      );
    });

    expect(connectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        convId: 'conv-none',
        basePrefix: '/api/apps/test',
        profileSelection: undefined,
      }),
    );
  });

  it('uses scoped profile state for selectable chats', async () => {
    const store = createStore();
    store.dispatch(chatProfilesSlice.actions.setSelectedProfile({ profile: 'inventory' }));
    store.dispatch(
      chatProfilesSlice.actions.setSelectedProfile({
        profile: 'planner',
        scopeKey: 'conv:scoped',
      }),
    );

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(
        <Provider store={store}>
          <HookHarness convId="conv-scoped" profilePolicy={{ kind: 'selectable', scopeKey: 'conv:scoped' }} />
        </Provider>,
      );
    });

    expect(connectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        profileSelection: { profile: 'planner', registry: undefined },
      }),
    );
  });
});
