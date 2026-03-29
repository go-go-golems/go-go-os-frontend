import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import {
  ChatConversationWindow,
} from './ChatConversationWindow';
import { chatWindowReducer } from '../state/chatWindowSlice';
import { chatSessionReducer } from '../state/chatSessionSlice';
import { timelineReducer } from '../state/timelineSlice';

type Envelope = {
  sem: true;
  event: {
    type: string;
    id: string;
    data?: Record<string, unknown>;
    seq?: number;
  };
};

class StoryWebSocket {
  static instances: StoryWebSocket[] = [];

  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  readonly url: string;

  constructor(url: string) {
    this.url = url;
    StoryWebSocket.instances.push(this);

    setTimeout(() => {
      this.onopen?.();
      this.emit({
        sem: true,
        event: {
          type: 'llm.start',
          id: 'story-msg',
          seq: 1,
          data: { id: 'story-msg', role: 'assistant' },
        },
      });
      this.emit({
        sem: true,
        event: {
          type: 'llm.delta',
          id: 'story-msg',
          seq: 2,
          data: { id: 'story-msg', cumulative: 'Hello from mocked WebSocket timeline.' },
        },
      });
      this.emit({
        sem: true,
        event: {
          type: 'tool.start',
          id: 'story-tool',
          seq: 3,
          data: {
            id: 'story-tool',
            name: 'inventory.lookup',
            input: { sku: 'WA-100' },
          },
        },
      });
      this.emit({
        sem: true,
        event: {
          type: 'tool.result',
          id: 'story-tool',
          seq: 4,
          data: {
            id: 'story-tool',
            result: '{"sku":"WA-100","qty":2}',
          },
        },
      });
      this.emit({
        sem: true,
        event: {
          type: 'llm.final',
          id: 'story-msg',
          seq: 5,
          data: { id: 'story-msg', text: 'Hello from mocked WebSocket timeline.' },
        },
      });
    }, 50);
  }

  close() {
    this.onclose?.();
  }

  private emit(envelope: Envelope) {
    this.onmessage?.({ data: JSON.stringify(envelope) });
  }
}

function createStoryStore() {
  return configureStore({
    reducer: {
      timeline: timelineReducer,
      chatSession: chatSessionReducer,
      chatWindow: chatWindowReducer,
    },
  });
}

function ChatConversationWindowStory() {
  const storeRef = useRef<ReturnType<typeof createStoryStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createStoryStore();
  }

  useEffect(() => {
    const previousWebSocket = window.WebSocket;
    const previousFetch = window.fetch;

    window.WebSocket = StoryWebSocket as unknown as typeof WebSocket;
    window.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/timeline')) {
        return {
          ok: true,
          json: async () => ({
            convId: 'story-conv',
            version: '1',
            serverTimeMs: String(Date.now()),
            entities: [],
          }),
          text: async () => '',
          status: 200,
        } as Response;
      }

      if (url.includes('/chat')) {
        return {
          ok: true,
          json: async () => ({}),
          text: async () => '',
          status: 200,
        } as Response;
      }

      return previousFetch(input);
    }) as typeof fetch;

    return () => {
      window.WebSocket = previousWebSocket;
      window.fetch = previousFetch;
    };
  }, []);

  return (
    <Provider store={storeRef.current}>
      <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
        <ChatConversationWindow
          convId="story-conv"
          title="Chat Conversation Window"
          placeholder="Ask about inventory..."
        />
      </div>
    </Provider>
  );
}

const meta = {
  title: 'ChatRuntime/Components/ChatConversationWindow',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const MockBackend: Story = {
  render: () => <ChatConversationWindowStory />,
};
