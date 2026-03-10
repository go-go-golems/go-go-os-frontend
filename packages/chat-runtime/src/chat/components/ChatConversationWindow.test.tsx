// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { chatSessionReducer } from '../state/chatSessionSlice';
import { chatWindowReducer } from '../state/chatWindowSlice';
import { timelineReducer, timelineSlice } from '../state/timelineSlice';
import { ensureChatModulesRegistered } from '../runtime/registerChatModules';

vi.mock('@hypercard/engine/desktop-react', async () => {
  const actual = await vi.importActual<object>('@hypercard/engine/desktop-react');
  return {
    ...actual,
    useDesktopWindowId: () => undefined,
    useOpenDesktopContextMenu: () => undefined,
  };
});

vi.mock('../runtime/useConversation', () => ({
  useConversation: () => ({
    send: vi.fn(async () => undefined),
    connectionStatus: 'connected',
    isStreaming: false,
  }),
}));

vi.mock('../runtime/useProfiles', () => ({
  useProfiles: () => ({
    profiles: [],
    loading: false,
    error: null,
    refresh: vi.fn(async () => undefined),
  }),
}));

vi.mock('../runtime/useSetProfile', () => ({
  useSetProfile: () => vi.fn(async () => undefined),
}));

vi.mock('../runtime/contextActions', () => ({
  useRegisterConversationContextActions: () => undefined,
}));

import { ChatConversationWindow } from './ChatConversationWindow';

const roots: Root[] = [];
const containers: HTMLElement[] = [];

function createStore() {
  return configureStore({
    reducer: {
      timeline: timelineReducer,
      chatSession: chatSessionReducer,
      chatWindow: chatWindowReducer,
    },
  });
}

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  if (typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.scrollIntoView !== 'function') {
    HTMLElement.prototype.scrollIntoView = () => undefined;
  }
});

beforeEach(() => {
  ensureChatModulesRegistered();
});

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of containers.splice(0)) {
    container.remove();
  }
});

describe('ChatConversationWindow', () => {
  it('does not inject starter suggestions unless the host provides them explicitly', async () => {
    const store = createStore();
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(
        <Provider store={store}>
          <ChatConversationWindow convId="conv-empty" />
        </Provider>,
      );
    });

    expect(container.textContent).not.toContain('Show current inventory status');

    await act(async () => {
      root.render(
        <Provider store={store}>
          <ChatConversationWindow
            convId="conv-empty"
            starterSuggestions={['Show current inventory status', 'Summarize today sales']}
          />
        </Provider>,
      );
    });

    expect(container.textContent).toContain('Show current inventory status');
  });

  it('renders host-provided timeline renderer overrides for hypercard.card.v2', async () => {
    const store = createStore();
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const root = createRoot(container);
    roots.push(root);

    const CustomCardRenderer = ({ e }: { e: { props: Record<string, unknown> } }) => (
      <div data-test="custom-card">
        custom-card:{String(e.props.title ?? '')}
      </div>
    );

    store.dispatch(
      timelineSlice.actions.upsertEntity({
        convId: 'conv-card',
        entity: {
          id: 'evt-card:result',
          kind: 'hypercard.card.v2',
          createdAt: 1,
          props: {
            title: 'Inventory Drilldown',
          },
        },
      }),
    );

    await act(async () => {
      root.render(
        <Provider store={store}>
          <ChatConversationWindow
            convId="conv-card"
            timelineRenderers={{
              'hypercard.card.v2': CustomCardRenderer as never,
            }}
          />
        </Provider>,
      );
    });

    expect(container.textContent).toContain('custom-card:Inventory Drilldown');
  });

  it('still renders builtin tool_call rows after card cutover changes', async () => {
    const store = createStore();
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const root = createRoot(container);
    roots.push(root);

    store.dispatch(
      timelineSlice.actions.upsertEntity({
        convId: 'conv-tool',
        entity: {
          id: 'tool-call-1',
          kind: 'tool_call',
          createdAt: 2,
          props: {
            name: 'inventory.list_items',
            input: { location: 'warehouse-a' },
            done: false,
          },
        },
      }),
    );

    await act(async () => {
      root.render(
        <Provider store={store}>
          <ChatConversationWindow convId="conv-tool" />
        </Provider>,
      );
    });

    expect(container.textContent).toContain('inventory.list_items');
  });
});
