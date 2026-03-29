import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chatSessionSlice } from '../state/chatSessionSlice';
import { ASSISTANT_SUGGESTIONS_ENTITY_ID, readSuggestionsEntityProps } from '../state/suggestions';
import { timelineSlice } from '../state/timelineSlice';
import {
  clearSemHandlers,
  handleSem,
  registerDefaultSemHandlers,
  registerSem,
  type SemContext,
} from './semRegistry';

function createStore() {
  return configureStore({
    reducer: {
      timeline: timelineSlice.reducer,
      chatSession: chatSessionSlice.reducer,
    },
  });
}

describe('semRegistry', () => {
  beforeEach(() => {
    clearSemHandlers();
  });

  it('registers a handler and threads SemContext through handleSem', () => {
    const handler = vi.fn();
    registerSem('custom.event', handler);

    const dispatch = vi.fn();
    const ctx: SemContext = { convId: 'conv-custom', dispatch };

    handleSem(
      {
        sem: true,
        event: {
          type: 'custom.event',
          id: 'evt-1',
        },
      },
      ctx
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'custom.event', id: 'evt-1' }),
      expect.objectContaining({ convId: 'conv-custom', dispatch })
    );
  });

  it('routes timeline.upsert entities into conversation-scoped timeline state', () => {
    const store = createStore();
    registerDefaultSemHandlers();

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'msg-1',
          data: {
            convId: 'conv-1',
            version: '1',
            entity: {
              id: 'msg-1',
              kind: 'message',
              createdAtMs: '1',
              updatedAtMs: '1',
              props: {
                role: 'assistant',
                content: 'Assistant text',
                streaming: true,
              },
            },
          },
        },
      },
      { convId: 'conv-1', dispatch: store.dispatch }
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'msg-1',
          data: {
            convId: 'conv-2',
            version: '1',
            entity: {
              id: 'msg-1',
              kind: 'message',
              createdAtMs: '1',
              updatedAtMs: '1',
              props: {
                role: 'thinking',
                content: 'Thinking text',
                streaming: true,
              },
            },
          },
        },
      },
      { convId: 'conv-2', dispatch: store.dispatch }
    );

    const state = store.getState().timeline;

    expect(state.byConvId['conv-1'].order).toEqual(['msg-1']);
    expect(state.byConvId['conv-1'].byId['msg-1'].props).toEqual({
      role: 'assistant',
      content: 'Assistant text',
      streaming: true,
    });

    expect(state.byConvId['conv-2'].order).toEqual(['msg-1']);
    expect(state.byConvId['conv-2'].byId['msg-1'].props).toEqual({
      role: 'thinking',
      content: 'Thinking text',
      streaming: true,
    });
  });

  it('does not create message rows for empty llm/thinking streams', () => {
    const store = createStore();
    registerDefaultSemHandlers();

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.start',
          id: 'msg-empty',
          data: {
            role: 'assistant',
          },
        },
      },
      { convId: 'conv-empty', dispatch: store.dispatch }
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.delta',
          id: 'msg-empty',
          data: {
            cumulative: '',
          },
        },
      },
      { convId: 'conv-empty', dispatch: store.dispatch }
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.final',
          id: 'msg-empty',
          data: {
            text: '',
          },
        },
      },
      { convId: 'conv-empty', dispatch: store.dispatch }
    );

    const state = store.getState().timeline;
    expect(state.byConvId['conv-empty']).toBeUndefined();
  });

  it('does not clear extension handlers when registering defaults', () => {
    const extensionHandler = vi.fn();
    registerSem('hypercard.widget.start', extensionHandler);
    registerDefaultSemHandlers();

    handleSem(
      {
        sem: true,
        event: {
          type: 'hypercard.widget.start',
          id: 'evt-widget',
        },
      },
      { convId: 'conv-1', dispatch: vi.fn() }
    );

    expect(extensionHandler).toHaveBeenCalledTimes(1);
  });

  it('suppresses empty timeline.upsert message placeholders until text exists', () => {
    const store = createStore();
    registerDefaultSemHandlers();

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'msg-upsert',
          data: {
            convId: 'conv-upsert',
            version: '1',
            entity: {
              id: 'msg-upsert',
              kind: 'message',
              createdAtMs: '1',
              updatedAtMs: '1',
              props: {
                role: 'assistant',
                content: '',
                streaming: true,
              },
            },
          },
        },
      },
      { convId: 'conv-upsert', dispatch: store.dispatch }
    );

    expect(store.getState().timeline.byConvId['conv-upsert']).toBeUndefined();

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'msg-upsert',
          data: {
            convId: 'conv-upsert',
            version: '2',
            entity: {
              id: 'msg-upsert',
              kind: 'message',
              createdAtMs: '1',
              updatedAtMs: '2',
              props: {
                role: 'assistant',
                content: 'hello',
                streaming: true,
              },
            },
          },
        },
      },
      { convId: 'conv-upsert', dispatch: store.dispatch }
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'msg-upsert',
          data: {
            convId: 'conv-upsert',
            version: '3',
            entity: {
              id: 'msg-upsert',
              kind: 'message',
              createdAtMs: '1',
              updatedAtMs: '3',
              props: {
                role: 'assistant',
                content: '',
                streaming: false,
              },
            },
          },
        },
      },
      { convId: 'conv-upsert', dispatch: store.dispatch }
    );

    const entity = store.getState().timeline.byConvId['conv-upsert'].byId['msg-upsert'];
    expect(entity.props).toEqual({
      role: 'assistant',
      content: 'hello',
      streaming: false,
    });
  });

  it('clears emitted state when terminal timeline updates include text', () => {
    const store = createStore();
    registerDefaultSemHandlers();

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'msg-reuse',
          data: {
            convId: 'conv-reuse',
            version: '1',
            entity: {
              id: 'msg-reuse',
              kind: 'message',
              createdAtMs: '1',
              updatedAtMs: '1',
              props: {
                role: 'assistant',
                content: 'done',
                streaming: false,
              },
            },
          },
        },
      },
      { convId: 'conv-reuse', dispatch: store.dispatch }
    );

    store.dispatch(timelineSlice.actions.clearConversation({ convId: 'conv-reuse' }));
    expect(store.getState().timeline.byConvId['conv-reuse']).toBeUndefined();

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'msg-reuse',
          data: {
            convId: 'conv-reuse',
            version: '2',
            entity: {
              id: 'msg-reuse',
              kind: 'message',
              createdAtMs: '2',
              updatedAtMs: '2',
              props: {
                role: 'assistant',
                content: '',
                streaming: false,
              },
            },
          },
        },
      },
      { convId: 'conv-reuse', dispatch: store.dispatch }
    );

    expect(store.getState().timeline.byConvId['conv-reuse']).toBeUndefined();
  });

  it('updates model/streaming stats and conversation token totals from llm metadata', () => {
    const store = createStore();
    registerDefaultSemHandlers();

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.start',
          id: 'msg-meta',
          data: {
            id: 'msg-meta',
            role: 'assistant',
          },
          metadata: {
            model: 'gpt-5-mini',
          },
        },
      },
      { convId: 'conv-meta', dispatch: store.dispatch }
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.delta',
          id: 'msg-meta',
          data: {
            id: 'msg-meta',
            cumulative: 'hello world',
          },
          metadata: {
            model: 'gpt-5-mini',
            usage: {
              outputTokens: 3,
            },
          },
        },
      },
      { convId: 'conv-meta', dispatch: store.dispatch }
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.final',
          id: 'msg-meta',
          data: {
            id: 'msg-meta',
            text: 'hello world',
          },
          metadata: {
            model: 'gpt-5-mini',
            durationMs: '2500',
            usage: {
              inputTokens: 11,
              outputTokens: 5,
              cachedTokens: 2,
            },
          },
        },
      },
      { convId: 'conv-meta', dispatch: store.dispatch }
    );

    const session = store.getState().chatSession.byConvId['conv-meta'];
    expect(session?.modelName).toBe('gpt-5-mini');
    expect(session?.isStreaming).toBe(false);
    expect(session?.streamOutputTokens).toBe(5);
    expect(session?.conversationInputTokens).toBe(11);
    expect(session?.conversationOutputTokens).toBe(5);
    expect(session?.turnStats).toEqual(
      expect.objectContaining({
        inputTokens: 11,
        outputTokens: 5,
        cachedTokens: 2,
        durationMs: 2500,
        tps: 2,
      })
    );
  });

  it('restores assistant suggestions visibility when backend sends a new block', () => {
    const store = createStore();
    registerDefaultSemHandlers();

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: ASSISTANT_SUGGESTIONS_ENTITY_ID,
          data: {
            convId: 'conv-suggestions',
            version: '10',
            entity: {
              id: ASSISTANT_SUGGESTIONS_ENTITY_ID,
              kind: 'suggestions',
              createdAtMs: '1000',
              updatedAtMs: '1000',
              props: {
                source: 'assistant',
                consumedAt: null,
                items: ['Open card'],
              },
            },
          },
        },
      },
      { convId: 'conv-suggestions', dispatch: store.dispatch }
    );

    store.dispatch(
      timelineSlice.actions.consumeSuggestions({
        convId: 'conv-suggestions',
        entityId: ASSISTANT_SUGGESTIONS_ENTITY_ID,
        consumedAt: 1234,
      })
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: ASSISTANT_SUGGESTIONS_ENTITY_ID,
          data: {
            convId: 'conv-suggestions',
            version: '11',
            entity: {
              id: ASSISTANT_SUGGESTIONS_ENTITY_ID,
              kind: 'suggestions',
              createdAtMs: '1000',
              updatedAtMs: '1100',
              props: {
                source: 'assistant',
                consumedAt: null,
                items: ['Open latest card'],
              },
            },
          },
        },
      },
      { convId: 'conv-suggestions', dispatch: store.dispatch }
    );

    const entity = store.getState().timeline.byConvId['conv-suggestions'].byId[ASSISTANT_SUGGESTIONS_ENTITY_ID];
    expect(readSuggestionsEntityProps(entity)).toEqual({
      source: 'assistant',
      items: ['Open latest card'],
      consumedAt: undefined,
    });
  });
});
