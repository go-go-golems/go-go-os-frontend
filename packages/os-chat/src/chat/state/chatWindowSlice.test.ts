import { describe, expect, it } from 'vitest';
import { chatWindowReducer, chatWindowSlice } from './chatWindowSlice';

const actions = chatWindowSlice.actions;

function reduce(input: Parameters<typeof chatWindowReducer>[1][]) {
  let state = chatWindowReducer(undefined, { type: '__test__/init' });
  for (const action of input) {
    state = chatWindowReducer(state, action);
  }
  return state;
}

describe('chatWindowSlice', () => {
  it('tracks window conversation mapping and awaiting baseline', () => {
    const state = reduce([
      actions.setWindowConversation({ windowId: 'window:1', convId: 'conv-1' }),
      actions.beginAwaitingAi({ windowId: 'window:1', convId: 'conv-1', baselineIndex: 3 }),
    ]);

    expect(state.byWindowId['window:1']).toEqual({
      convId: 'conv-1',
      awaiting: {
        baselineIndex: 3,
      },
    });
  });

  it('resets awaiting state when window conversation changes', () => {
    const state = reduce([
      actions.beginAwaitingAi({ windowId: 'window:1', convId: 'conv-1', baselineIndex: 2 }),
      actions.setWindowConversation({ windowId: 'window:1', convId: 'conv-2' }),
    ]);

    expect(state.byWindowId['window:1']).toEqual({
      convId: 'conv-2',
      awaiting: null,
    });
  });

  it('can clear awaiting and window state', () => {
    const state = reduce([
      actions.beginAwaitingAi({ windowId: 'window:1', convId: 'conv-1', baselineIndex: 1 }),
      actions.clearAwaitingAi({ windowId: 'window:1' }),
      actions.clearWindowState({ windowId: 'window:1' }),
    ]);

    expect(state.byWindowId['window:1']).toBeUndefined();
  });
});
