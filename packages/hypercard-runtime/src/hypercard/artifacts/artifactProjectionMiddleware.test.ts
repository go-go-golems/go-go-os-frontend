import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it } from 'vitest';
import { timelineSlice, type TimelineEntity } from '@hypercard/chat-runtime';
import { clearRuntimeCardRegistry, hasRuntimeCard } from '../../plugin-runtime';
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
    clearRuntimeCardRegistry();
  });

  it('projects artifacts from snapshot entities and registers runtime cards', async () => {
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
    expect(artifact.runtimeCardId).toBe('runtime-low-stock');
    expect(artifact.injectionStatus).toBe('pending');
    expect(hasRuntimeCard('runtime-low-stock')).toBe(true);
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
    expect(artifact.runtimeCardId).toBe('runtimeInventoryStatus');
  });
});
