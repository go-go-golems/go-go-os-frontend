import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ASSISTANT_SUGGESTIONS_ENTITY_ID,
  chatSessionSlice,
  clearSemHandlers,
  ensureChatModulesRegistered,
  handleSem,
  resetChatModulesRegistrationForTest,
  timelineSlice,
} from '@hypercard/chat-runtime';
import { clearRuntimeSurfaceRegistry, hasRuntimeSurface } from '../../plugin-runtime/runtimeSurfaceRegistry';
import { createArtifactProjectionMiddleware } from '../artifacts/artifactProjectionMiddleware';
import { hypercardArtifactsReducer } from '../artifacts/artifactsSlice';

function createStore() {
  const artifactProjection = createArtifactProjectionMiddleware();
  return configureStore({
    reducer: {
      timeline: timelineSlice.reducer,
      chatSession: chatSessionSlice.reducer,
      hypercardArtifacts: hypercardArtifactsReducer,
    },
    middleware: (getDefault) => getDefault().concat(artifactProjection.middleware),
  });
}

describe('hypercard card timeline projection', () => {
  beforeEach(() => {
    clearRuntimeSurfaceRegistry();
    clearSemHandlers();
    resetChatModulesRegistrationForTest();
    ensureChatModulesRegistered();
  });

  it('keeps hypercard.card.v2 as the stored timeline kind and registers a runtime surface', async () => {
    const store = createStore();

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'evt-card',
          data: {
            convId: 'conv-card',
            version: '21',
            entity: {
              id: 'evt-card:result',
              kind: 'hypercard.card.v2',
              createdAtMs: '2100',
              updatedAtMs: '2101',
              props: {
                itemId: 'card-123',
                name: 'Low Stock Card',
                title: 'Low Stock Card',
                data: {
                  artifact: {
                    id: 'artifact-card-1',
                    data: { sku: 'WA-100' },
                  },
                  card: {
                    id: 'runtime-low-stock',
                    code: '({ ui }) => ({ render() { return ui.text("low stock"); } })',
                  },
                },
              },
            },
          },
        },
      },
      { convId: 'conv-card', dispatch: store.dispatch },
    );
    await Promise.resolve();

    const state = store.getState();
    const entity = state.timeline.byConvId['conv-card'].byId['evt-card:result'];
    const artifact = state.hypercardArtifacts.byId['artifact-card-1'];

    expect(entity).toBeDefined();
    expect(entity.kind).toBe('hypercard.card.v2');
    expect(entity.props).toEqual(
      expect.objectContaining({
        title: 'Low Stock Card',
        itemId: 'card-123',
      }),
    );

    expect(artifact).toBeDefined();
    expect(artifact.source).toBe('card');
    expect(hasRuntimeSurface('runtime-low-stock')).toBe(true);
  });

  it('keeps backend suggestions projection disabled by default', () => {
    const store = createStore();

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'evt-card-seed',
          data: {
            convId: 'conv-card',
            version: '21',
            entity: {
              id: 'msg-seed',
              kind: 'message',
              createdAtMs: '2100',
              updatedAtMs: '2101',
              props: {
                role: 'assistant',
                content: 'seed',
              },
            },
          },
        },
      },
      { convId: 'conv-card', dispatch: store.dispatch },
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: ASSISTANT_SUGGESTIONS_ENTITY_ID,
          data: {
            convId: 'conv-card',
            version: '22',
            entity: {
              id: ASSISTANT_SUGGESTIONS_ENTITY_ID,
              kind: 'suggestions',
              createdAtMs: '2200',
              updatedAtMs: '2201',
              props: {
                source: 'assistant',
                consumedAt: null,
                items: ['Open low stock card', 'Show margin report'],
              },
            },
          },
        },
      },
      { convId: 'conv-card', dispatch: store.dispatch },
    );

    const suggestionsEntity = store.getState().timeline.byConvId['conv-card']?.byId[ASSISTANT_SUGGESTIONS_ENTITY_ID];
    expect(suggestionsEntity).toBeUndefined();
  });
});
