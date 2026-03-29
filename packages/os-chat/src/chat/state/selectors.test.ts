import { describe, expect, it } from 'vitest';
import type { ChatSessionSliceState } from './chatSessionSlice';
import type { ChatWindowSliceState } from './chatWindowSlice';
import {
  selectAvailableProfiles,
  selectConversationCachedTokens,
  selectCurrentProfileSelection,
  selectProfileError,
  selectProfileLoading,
  selectConversationTotalTokens,
  selectRenderableTimelineEntities,
  selectShouldShowPendingAiPlaceholder,
  selectSuggestions,
  type ChatStateSlice,
} from './selectors';
import {
  ASSISTANT_SUGGESTIONS_ENTITY_ID,
  STARTER_SUGGESTIONS_ENTITY_ID,
  SUGGESTIONS_ENTITY_KIND,
} from './suggestions';
import type { TimelineState } from './timelineSlice';

function createState(
  timeline: TimelineState,
  chatSession?: ChatSessionSliceState,
  chatWindow?: ChatWindowSliceState
): ChatStateSlice {
  return {
    timeline,
    chatSession: chatSession ?? { byConvId: {} },
    chatWindow,
  };
}

describe('selectors', () => {
  it('returns starter suggestions only for empty conversations', () => {
    const state = createState({
      byConvId: {
        'conv-1': {
          byId: {
            [STARTER_SUGGESTIONS_ENTITY_ID]: {
              id: STARTER_SUGGESTIONS_ENTITY_ID,
              kind: SUGGESTIONS_ENTITY_KIND,
              createdAt: 1,
              props: { source: 'starter', items: ['Show status', 'Show revenue'] },
            },
          },
          order: [STARTER_SUGGESTIONS_ENTITY_ID],
        },
      },
    });

    expect(selectSuggestions(state, 'conv-1')).toEqual(['Show status', 'Show revenue']);
    expect(selectRenderableTimelineEntities(state, 'conv-1')).toEqual([]);
  });

  it('suppresses starter suggestions once timeline contains renderable entities', () => {
    const state = createState({
      byConvId: {
        'conv-2': {
          byId: {
            [STARTER_SUGGESTIONS_ENTITY_ID]: {
              id: STARTER_SUGGESTIONS_ENTITY_ID,
              kind: SUGGESTIONS_ENTITY_KIND,
              createdAt: 1,
              props: { source: 'starter', items: ['Show status'] },
            },
            'msg-1': {
              id: 'msg-1',
              kind: 'message',
              createdAt: 2,
              props: { content: 'hello' },
            },
          },
          order: [STARTER_SUGGESTIONS_ENTITY_ID, 'msg-1'],
        },
      },
    });

    expect(selectSuggestions(state, 'conv-2')).toEqual([]);
    expect(selectRenderableTimelineEntities(state, 'conv-2').map((entity) => entity.id)).toEqual(['msg-1']);
  });

  it('prefers assistant suggestions over starter suggestions', () => {
    const state = createState({
      byConvId: {
        'conv-3': {
          byId: {
            [STARTER_SUGGESTIONS_ENTITY_ID]: {
              id: STARTER_SUGGESTIONS_ENTITY_ID,
              kind: SUGGESTIONS_ENTITY_KIND,
              createdAt: 1,
              props: { source: 'starter', items: ['starter item'] },
            },
            [ASSISTANT_SUGGESTIONS_ENTITY_ID]: {
              id: ASSISTANT_SUGGESTIONS_ENTITY_ID,
              kind: SUGGESTIONS_ENTITY_KIND,
              createdAt: 2,
              props: { source: 'assistant', items: ['assistant item'] },
            },
          },
          order: [STARTER_SUGGESTIONS_ENTITY_ID, ASSISTANT_SUGGESTIONS_ENTITY_ID],
        },
      },
    });

    expect(selectSuggestions(state, 'conv-3')).toEqual(['assistant item']);
  });

  it('hides consumed starter suggestions', () => {
    const state = createState({
      byConvId: {
        'conv-4': {
          byId: {
            [STARTER_SUGGESTIONS_ENTITY_ID]: {
              id: STARTER_SUGGESTIONS_ENTITY_ID,
              kind: SUGGESTIONS_ENTITY_KIND,
              createdAt: 1,
              props: { source: 'starter', items: ['show status'], consumedAt: 123 },
            },
          },
          order: [STARTER_SUGGESTIONS_ENTITY_ID],
        },
      },
    });

    expect(selectSuggestions(state, 'conv-4')).toEqual([]);
  });

  it('returns conversation total tokens (including cache) from chat session state', () => {
    const state = createState(
      { byConvId: {} },
      {
        byConvId: {
          'conv-tokens': {
            connectionStatus: 'connected',
            isStreaming: false,
            modelName: 'gpt-5-mini',
            turnStats: null,
            conversationInputTokens: 250,
            conversationOutputTokens: 70,
            conversationCachedTokens: 12,
            streamStartTime: null,
            streamOutputTokens: 0,
            lastError: null,
            currentError: null,
            errorHistory: [],
          },
        },
      }
    );

    expect(selectConversationCachedTokens(state, 'conv-tokens')).toBe(12);
    expect(selectConversationTotalTokens(state, 'conv-tokens')).toBe(332);
    expect(selectConversationCachedTokens(state, 'conv-missing')).toBe(0);
    expect(selectConversationTotalTokens(state, 'conv-missing')).toBe(0);
  });

  it('returns profile selectors with safe defaults', () => {
    const state = createState({ byConvId: {} });

    expect(selectAvailableProfiles(state)).toEqual([]);
    expect(selectProfileLoading(state)).toBe(false);
    expect(selectProfileError(state)).toBeNull();
    expect(selectCurrentProfileSelection(state)).toEqual({
      profile: undefined,
      registry: undefined,
    });
  });

  it('returns scoped profile selection when scope key is present', () => {
    const state: ChatStateSlice = {
      timeline: { byConvId: {} },
      chatSession: { byConvId: {} },
      chatProfiles: {
        availableProfiles: [],
        selectedProfile: 'global-profile',
        selectedRegistry: 'default',
        selectedByScope: {
          'conv:abc': {
            profile: 'scoped-profile',
            registry: 'ops',
          },
        },
        loading: false,
        error: null,
      },
    };

    expect(selectCurrentProfileSelection(state, 'conv:abc')).toEqual({
      profile: 'scoped-profile',
      registry: 'ops',
    });
    expect(selectCurrentProfileSelection(state, 'conv:missing')).toEqual({
      profile: undefined,
      registry: undefined,
    });
  });

  it('shows pending placeholder only after user append until AI-side signal appears', () => {
    const windowId = 'window:chat:1';
    const convId = 'conv-pending';
    const stateBeforeUser = createState(
      {
        byConvId: {
          [convId]: {
            byId: {},
            order: [],
          },
        },
      },
      {
        byConvId: {
          [convId]: {
            connectionStatus: 'connected',
            isStreaming: false,
            modelName: null,
            turnStats: null,
            conversationInputTokens: 0,
            conversationOutputTokens: 0,
            conversationCachedTokens: 0,
            streamStartTime: null,
            streamOutputTokens: 0,
            lastError: null,
            currentError: null,
            errorHistory: [],
          },
        },
      },
      {
        byWindowId: {
          [windowId]: {
            convId,
            awaiting: {
              baselineIndex: 0,
            },
          },
        },
      }
    );
    expect(selectShouldShowPendingAiPlaceholder(stateBeforeUser, windowId, convId)).toBe(false);

    const stateWaiting = createState(
      {
        byConvId: {
          [convId]: {
            byId: {
              'user-1': {
                id: 'user-1',
                kind: 'message',
                createdAt: 1,
                props: { role: 'user', content: 'hello' },
              },
            },
            order: ['user-1'],
          },
        },
      },
      stateBeforeUser.chatSession,
      stateBeforeUser.chatWindow
    );
    expect(selectShouldShowPendingAiPlaceholder(stateWaiting, windowId, convId)).toBe(true);

    const stateAfterAiSignal = createState(
      {
        byConvId: {
          [convId]: {
            byId: {
              'user-1': {
                id: 'user-1',
                kind: 'message',
                createdAt: 1,
                props: { role: 'user', content: 'hello' },
              },
              'assistant-1': {
                id: 'assistant-1',
                kind: 'message',
                createdAt: 2,
                props: { role: 'assistant', content: 'Hi' },
              },
            },
            order: ['user-1', 'assistant-1'],
          },
        },
      },
      stateBeforeUser.chatSession,
      stateBeforeUser.chatWindow
    );
    expect(selectShouldShowPendingAiPlaceholder(stateAfterAiSignal, windowId, convId)).toBe(false);
  });
});
