import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { ASSISTANT_SUGGESTIONS_ENTITY_ID, STARTER_SUGGESTIONS_ENTITY_ID } from './suggestions';
import { timelineSlice } from './timelineSlice';

function createStore() {
  return configureStore({
    reducer: {
      timeline: timelineSlice.reducer,
    },
  });
}

describe('timelineSlice', () => {
  it('upserts entities and scopes them by conversation', () => {
    const store = createStore();

    store.dispatch(
      timelineSlice.actions.upsertEntity({
        convId: 'conv-a',
        entity: {
          id: 'entity-1',
          kind: 'message',
          createdAt: 100,
          props: { content: 'hello' },
        },
      })
    );

    store.dispatch(
      timelineSlice.actions.upsertEntity({
        convId: 'conv-a',
        entity: {
          id: 'entity-1',
          kind: 'message',
          createdAt: 999,
          updatedAt: 200,
          props: { streaming: true },
        },
      })
    );

    store.dispatch(
      timelineSlice.actions.upsertEntity({
        convId: 'conv-b',
        entity: {
          id: 'entity-1',
          kind: 'tool_call',
          createdAt: 300,
          props: { name: 'lookup' },
        },
      })
    );

    const state = store.getState().timeline;

    expect(state.byConvId['conv-a'].order).toEqual(['entity-1']);
    expect(state.byConvId['conv-a'].byId['entity-1'].createdAt).toBe(100);
    expect(state.byConvId['conv-a'].byId['entity-1'].props).toEqual({
      content: 'hello',
      streaming: true,
    });

    expect(state.byConvId['conv-b'].order).toEqual(['entity-1']);
    expect(state.byConvId['conv-b'].byId['entity-1'].kind).toBe('tool_call');
    expect(state.byConvId['conv-b'].byId['entity-1'].props).toEqual({ name: 'lookup' });
  });

  it('applies version gating and ignores stale updates', () => {
    const store = createStore();

    store.dispatch(
      timelineSlice.actions.upsertEntity({
        convId: 'conv-version',
        entity: {
          id: 'entity-versioned',
          kind: 'status',
          createdAt: 1,
          version: 2,
          props: { status: 'new' },
        },
      })
    );

    store.dispatch(
      timelineSlice.actions.upsertEntity({
        convId: 'conv-version',
        entity: {
          id: 'entity-versioned',
          kind: 'status',
          createdAt: 2,
          version: 1,
          props: { status: 'stale' },
        },
      })
    );

    store.dispatch(
      timelineSlice.actions.upsertEntity({
        convId: 'conv-version',
        entity: {
          id: 'entity-versioned',
          kind: 'status',
          createdAt: 3,
          updatedAt: 99,
          props: { detail: 'merge-on-stable-version' },
        },
      })
    );

    const entity = store.getState().timeline.byConvId['conv-version'].byId['entity-versioned'];

    expect(entity.version).toBe(2);
    expect(entity.createdAt).toBe(1);
    expect(entity.updatedAt).toBe(99);
    expect(entity.props).toEqual({
      status: 'new',
      detail: 'merge-on-stable-version',
    });
  });

  it('rekeys entities within one conversation and preserves merged props', () => {
    const store = createStore();

    store.dispatch(
      timelineSlice.actions.addEntity({
        convId: 'conv-rekey',
        entity: {
          id: 'from-id',
          kind: 'tool_call',
          createdAt: 10,
          props: { from: true, first: 'alpha' },
        },
      })
    );

    store.dispatch(
      timelineSlice.actions.addEntity({
        convId: 'conv-rekey',
        entity: {
          id: 'to-id',
          kind: 'tool_result',
          createdAt: 11,
          props: { to: true, second: 'beta' },
        },
      })
    );

    store.dispatch(
      timelineSlice.actions.rekeyEntity({
        convId: 'conv-rekey',
        fromId: 'from-id',
        toId: 'to-id',
      })
    );

    const conv = store.getState().timeline.byConvId['conv-rekey'];
    const merged = conv.byId['to-id'];

    expect(conv.byId['from-id']).toBeUndefined();
    expect(conv.order).toEqual(['to-id']);
    expect(merged.kind).toBe('tool_result');
    expect(merged.props).toEqual({
      from: true,
      first: 'alpha',
      to: true,
      second: 'beta',
    });
  });

  it('upserts, replaces, and consumes suggestion entities with version gating', () => {
    const store = createStore();

    store.dispatch(
      timelineSlice.actions.upsertSuggestions({
        convId: 'conv-suggestions',
        entityId: ASSISTANT_SUGGESTIONS_ENTITY_ID,
        source: 'assistant',
        suggestions: ['Open card', 'Show margin'],
        replace: false,
        version: 2,
      })
    );

    store.dispatch(
      timelineSlice.actions.upsertSuggestions({
        convId: 'conv-suggestions',
        entityId: ASSISTANT_SUGGESTIONS_ENTITY_ID,
        source: 'assistant',
        suggestions: ['open card', 'Review sales'],
        replace: false,
        version: 2,
      })
    );

    store.dispatch(
      timelineSlice.actions.upsertSuggestions({
        convId: 'conv-suggestions',
        entityId: ASSISTANT_SUGGESTIONS_ENTITY_ID,
        source: 'assistant',
        suggestions: ['stale'],
        replace: true,
        version: 1,
      })
    );

    store.dispatch(
      timelineSlice.actions.upsertSuggestions({
        convId: 'conv-suggestions',
        entityId: STARTER_SUGGESTIONS_ENTITY_ID,
        source: 'starter',
        suggestions: ['Show status', 'Show status'],
        replace: true,
      })
    );

    store.dispatch(
      timelineSlice.actions.consumeSuggestions({
        convId: 'conv-suggestions',
        entityId: STARTER_SUGGESTIONS_ENTITY_ID,
        consumedAt: 123,
      })
    );

    const conv = store.getState().timeline.byConvId['conv-suggestions'];
    const assistant = conv.byId[ASSISTANT_SUGGESTIONS_ENTITY_ID];
    const starter = conv.byId[STARTER_SUGGESTIONS_ENTITY_ID];

    expect(assistant.version).toBe(2);
    expect(assistant.props).toEqual({
      source: 'assistant',
      items: ['Open card', 'Show margin', 'Review sales'],
    });
    expect(starter.props).toEqual({
      source: 'starter',
      items: ['Show status'],
      consumedAt: 123,
    });
  });

  it('clears consumed suggestions when a new suggestion block is upserted', () => {
    const store = createStore();

    store.dispatch(
      timelineSlice.actions.upsertSuggestions({
        convId: 'conv-refresh',
        entityId: ASSISTANT_SUGGESTIONS_ENTITY_ID,
        source: 'assistant',
        suggestions: ['old suggestion'],
        replace: true,
        version: 1,
      })
    );

    store.dispatch(
      timelineSlice.actions.consumeSuggestions({
        convId: 'conv-refresh',
        entityId: ASSISTANT_SUGGESTIONS_ENTITY_ID,
        consumedAt: 321,
      })
    );

    store.dispatch(
      timelineSlice.actions.upsertSuggestions({
        convId: 'conv-refresh',
        entityId: ASSISTANT_SUGGESTIONS_ENTITY_ID,
        source: 'assistant',
        suggestions: ['new suggestion'],
        replace: true,
        version: 2,
      })
    );

    const assistant = store.getState().timeline.byConvId['conv-refresh'].byId[ASSISTANT_SUGGESTIONS_ENTITY_ID];
    expect(assistant.props).toEqual({
      source: 'assistant',
      items: ['new suggestion'],
    });
  });

  it('merges snapshots without reordering existing timeline entities', () => {
    const store = createStore();

    store.dispatch(
      timelineSlice.actions.addEntity({
        convId: 'conv-merge',
        entity: {
          id: STARTER_SUGGESTIONS_ENTITY_ID,
          kind: 'suggestions',
          createdAt: 1,
          version: 1,
          props: { source: 'starter', items: ['Show status'] },
        },
      })
    );

    store.dispatch(
      timelineSlice.actions.addEntity({
        convId: 'conv-merge',
        entity: {
          id: 'user-1',
          kind: 'message',
          createdAt: 2,
          version: 1,
          props: { role: 'user', content: 'hello' },
        },
      })
    );

    store.dispatch(
      timelineSlice.actions.addEntity({
        convId: 'conv-merge',
        entity: {
          id: 'assistant-1',
          kind: 'message',
          createdAt: 3,
          version: 1,
          props: { role: 'assistant', content: 'initial' },
        },
      })
    );

    store.dispatch(
      timelineSlice.actions.mergeSnapshot({
        convId: 'conv-merge',
        entities: [
          {
            id: 'assistant-1',
            kind: 'message',
            createdAt: 3,
            version: 2,
            props: { role: 'assistant', content: 'updated from snapshot' },
          },
          {
            id: 'status-1',
            kind: 'status',
            createdAt: 4,
            version: 2,
            props: { text: 'done' },
          },
        ],
      })
    );

    const conv = store.getState().timeline.byConvId['conv-merge'];
    expect(conv.order).toEqual([STARTER_SUGGESTIONS_ENTITY_ID, 'user-1', 'assistant-1', 'status-1']);
    expect(conv.byId[STARTER_SUGGESTIONS_ENTITY_ID]).toBeDefined();
    expect(conv.byId['assistant-1'].props).toEqual({
      role: 'assistant',
      content: 'updated from snapshot',
    });
  });
});
