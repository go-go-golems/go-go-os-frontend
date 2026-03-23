import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it } from 'vitest';
import { timelineSlice, type TimelineEntity } from '@hypercard/chat-runtime';
import { clearRuntimeSurfaceRegistry, hasRuntimeSurface } from '../../plugin-runtime';
import { createArtifactProjectionMiddleware } from './artifactProjectionMiddleware';
import { hypercardArtifactsReducer } from './artifactsSlice';

function createStore() {
  const artifactProjection = createArtifactProjectionMiddleware();
  return configureStore({
    reducer: {
      timeline: timelineSlice.reducer,
      hypercardArtifacts: hypercardArtifactsReducer,
    },
    middleware: (getDefault) => getDefault().concat(artifactProjection.middleware),
  });
}

function flushListeners() {
  return Promise.resolve();
}

describe('artifactProjectionMiddleware', () => {
  beforeEach(() => {
    clearRuntimeSurfaceRegistry();
  });

  it('projects artifacts from snapshot entities and registers runtime surfaces', async () => {
    const store = createStore();
    const entities: TimelineEntity[] = [
      {
        id: 'evt-card:result',
        kind: 'hypercard.card.v2',
        createdAt: 2,
        props: {
          result: {
            title: 'Low Stock Card',
            data: {
              artifact: {
                id: 'low-stock-drilldown',
                data: { threshold: 5 },
              },
              runtime: {
                pack: 'kanban.v1',
              },
              card: {
                id: 'runtime-low-stock',
                code: '({ ui }) => ({ render() { return ui.text("hi"); } })',
              },
            },
          },
        },
      },
    ];

    store.dispatch(timelineSlice.actions.applySnapshot({ convId: 'conv-1', entities }));
    await flushListeners();

    const artifact = store.getState().hypercardArtifacts.byId['low-stock-drilldown'];
    expect(artifact).toBeDefined();
    expect(artifact.runtimeSurfaceId).toBe('runtime-low-stock');
    expect(artifact.packId).toBe('kanban.v1');
    expect(artifact.injectionStatus).toBe('pending');
    expect(hasRuntimeSurface('runtime-low-stock')).toBe(true);
  });

  it('projects artifacts from mergeSnapshot entities for first-class card kinds', async () => {
    const store = createStore();
    const entities: TimelineEntity[] = [
      {
        id: 'evt-card:result',
        kind: 'hypercard.card.v2',
        createdAt: 3,
        props: {
          result: {
            title: 'Current Inventory Status',
            data: {
              artifact: {
                id: 'inventory-status-current',
                data: { totalSkus: 14 },
              },
              runtime: {
                pack: 'ui.card.v1',
              },
              card: {
                id: 'runtimeInventoryStatus',
                code: '({ ui }) => ({ render() { return ui.text("status"); } })',
              },
            },
          },
        },
      },
    ];

    store.dispatch(timelineSlice.actions.mergeSnapshot({ convId: 'conv-2', entities }));
    await flushListeners();

    const artifact = store.getState().hypercardArtifacts.byId['inventory-status-current'];
    expect(artifact).toBeDefined();
    expect(artifact.title).toBe('Current Inventory Status');
    expect(artifact.source).toBe('card');
    expect(artifact.runtimeSurfaceId).toBe('runtimeInventoryStatus');
    expect(artifact.packId).toBe('ui.card.v1');
  });

  it('does not register or queue runtime surfaces while a card entity is still streaming', async () => {
    const store = createStore();

    store.dispatch(
      timelineSlice.actions.upsertEntity({
        convId: 'conv-3',
        entity: {
          id: 'evt-card:streaming',
          kind: 'hypercard.card.v2',
          createdAt: 4,
          props: {
            status: 'streaming',
            result: {
              title: 'Streaming Card',
              data: {
                artifact: {
                  id: 'artifact-streaming',
                },
                runtime: {
                  pack: 'ui.card.v1',
                },
                card: {
                  id: 'runtimeStreamingCard',
                  code: '({ ui }) => ({ render() { return ui.text("partial"); } })',
                },
              },
            },
          },
        },
      }),
    );
    await flushListeners();

    const streamingArtifact = store.getState().hypercardArtifacts.byId['artifact-streaming'];
    expect(streamingArtifact).toBeDefined();
    expect(streamingArtifact.runtimeSurfaceId).toBe('runtimeStreamingCard');
    expect(streamingArtifact.injectionStatus).toBeUndefined();
    expect(hasRuntimeSurface('runtimeStreamingCard')).toBe(false);

    store.dispatch(
      timelineSlice.actions.upsertEntity({
        convId: 'conv-3',
        entity: {
          id: 'evt-card:streaming',
          kind: 'hypercard.card.v2',
          createdAt: 4,
          updatedAt: 5,
          props: {
            status: 'success',
            result: {
              title: 'Streaming Card',
              data: {
                artifact: {
                  id: 'artifact-streaming',
                },
                runtime: {
                  pack: 'ui.card.v1',
                },
                card: {
                  id: 'runtimeStreamingCard',
                  code: '({ ui }) => ({ render() { return ui.text("final"); } })',
                },
              },
            },
          },
        },
      }),
    );
    await flushListeners();

    const finalArtifact = store.getState().hypercardArtifacts.byId['artifact-streaming'];
    expect(finalArtifact.runtimeSurfaceId).toBe('runtimeStreamingCard');
    expect(finalArtifact.injectionStatus).toBe('pending');
    expect(hasRuntimeSurface('runtimeStreamingCard')).toBe(true);
  });
});
