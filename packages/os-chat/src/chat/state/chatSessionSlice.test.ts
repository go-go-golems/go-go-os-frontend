import { describe, expect, it } from 'vitest';
import { chatSessionReducer, chatSessionSlice } from './chatSessionSlice';

const actions = chatSessionSlice.actions;

function reduce(input: Parameters<typeof chatSessionReducer>[1][]) {
  let state = chatSessionReducer(undefined, { type: '__test__/init' });
  for (const action of input) {
    state = chatSessionReducer(state, action);
  }
  return state;
}

describe('chatSessionSlice', () => {
  it('keeps state scoped per conversation id', () => {
    const state = reduce([
      actions.setConnectionStatus({ convId: 'a', status: 'connected' }),
      actions.setConnectionStatus({ convId: 'b', status: 'error' }),
      actions.setIsStreaming({ convId: 'a', isStreaming: true }),
    ]);

    expect(state.byConvId.a?.connectionStatus).toBe('connected');
    expect(state.byConvId.a?.isStreaming).toBe(true);
    expect(state.byConvId.b?.connectionStatus).toBe('error');
    expect(state.byConvId.b?.isStreaming).toBe(false);
  });

  it('tracks stream start, token updates, and clears errors on restart', () => {
    const state = reduce([
      actions.setStreamError({ convId: 'stream-1', error: 'network' }),
      actions.markStreamStart({ convId: 'stream-1', streamStartTime: 123 }),
      actions.updateStreamTokens({ convId: 'stream-1', streamOutputTokens: 12.9 }),
      actions.setStreamError({ convId: 'stream-1', error: 'timeout' }),
      actions.markStreamStart({ convId: 'stream-1', streamStartTime: 456 }),
      actions.updateStreamTokens({ convId: 'stream-1', streamOutputTokens: -5 }),
    ]);

    expect(state.byConvId['stream-1']?.streamStartTime).toBe(456);
    expect(state.byConvId['stream-1']?.streamOutputTokens).toBe(0);
    expect(state.byConvId['stream-1']?.lastError).toBeNull();
    expect(state.byConvId['stream-1']?.currentError).toBeNull();
  });

  it('resets and clears a conversation session', () => {
    const state = reduce([
      actions.setModelName({ convId: 'r1', modelName: 'gpt-test' }),
      actions.addConversationUsage({ convId: 'r1', inputTokens: 120, outputTokens: 45 }),
      actions.setConnectionStatus({ convId: 'r1', status: 'connected' }),
      actions.resetSession({ convId: 'r1' }),
      actions.clearConversationSession({ convId: 'r1' }),
    ]);

    expect(state.byConvId.r1).toBeUndefined();
  });

  it('accumulates conversation usage totals', () => {
    const state = reduce([
      actions.addConversationUsage({ convId: 'u1', inputTokens: 100.7, outputTokens: 12.2, cachedTokens: 9 }),
      actions.addConversationUsage({ convId: 'u1', inputTokens: -5, outputTokens: 8, cachedTokens: 1 }),
    ]);

    expect(state.byConvId.u1?.conversationInputTokens).toBe(100);
    expect(state.byConvId.u1?.conversationOutputTokens).toBe(20);
    expect(state.byConvId.u1?.conversationCachedTokens).toBe(10);
  });

  it('supports structured error current/history state', () => {
    const state = reduce([
      actions.setError({
        convId: 'e1',
        error: {
          kind: 'ws_error',
          stage: 'connect',
          message: 'socket refused',
          source: 'unit',
          recoverable: true,
        },
      }),
      actions.pushError({
        convId: 'e1',
        error: {
          kind: 'http_error',
          stage: 'send',
          message: 'chat request failed (500)',
          source: 'unit',
          status: 500,
        },
      }),
      actions.clearError({ convId: 'e1' }),
    ]);

    expect(state.byConvId.e1?.lastError).toBeNull();
    expect(state.byConvId.e1?.currentError).toBeNull();
    expect(state.byConvId.e1?.errorHistory).toHaveLength(1);
    expect(state.byConvId.e1?.errorHistory[0].kind).toBe('http_error');
  });

  it('caps error history to the most recent 20 entries', () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      actions.pushError({
        convId: 'e2',
        error: {
          kind: 'runtime_error',
          stage: 'stream',
          message: `err-${i}`,
          source: 'unit',
        },
      })
    );
    const state = reduce(many);

    expect(state.byConvId.e2?.errorHistory).toHaveLength(20);
    expect(state.byConvId.e2?.errorHistory[0].message).toBe('err-5');
    expect(state.byConvId.e2?.errorHistory[19].message).toBe('err-24');
  });
});
