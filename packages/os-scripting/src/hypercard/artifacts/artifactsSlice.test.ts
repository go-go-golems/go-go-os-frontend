import { describe, expect, it } from 'vitest';
import { artifactsReducer, markRuntimeSurfaceInjectionResults, upsertArtifact } from './artifactsSlice';

function reduce(actions: Parameters<typeof artifactsReducer>[1][]) {
  let state = artifactsReducer(undefined, { type: '__test__/init' });
  for (const action of actions) {
    state = artifactsReducer(state, action);
  }
  return state;
}

describe('artifactsSlice', () => {
  it('stores artifacts keyed by artifact id', () => {
    const state = reduce([
      upsertArtifact({
        id: 'inventory-summary',
        title: 'Inventory Summary',
        template: 'reportViewer',
        source: 'card',
        data: { totalSkus: 10 },
        updatedAt: 5,
      }),
    ]);

    expect(Object.keys(state.byId)).toEqual(['inventory-summary']);
    expect(state.byId['inventory-summary']?.template).toBe('reportViewer');
    expect(state.byId['inventory-summary']?.data).toEqual({ totalSkus: 10 });
  });

  it('merges later upserts while preserving previous fields', () => {
    const state = reduce([
      upsertArtifact({
        id: 'low-stock-items',
        title: 'Low Stock Items',
        template: 'reportViewer',
        source: 'card',
        data: { items: [{ sku: 'A-1001' }] },
        updatedAt: 10,
      }),
      upsertArtifact({
        id: 'low-stock-items',
        source: 'widget',
        updatedAt: 20,
      }),
    ]);

    expect(state.byId['low-stock-items']?.title).toBe('Low Stock Items');
    expect(state.byId['low-stock-items']?.template).toBe('reportViewer');
    expect(state.byId['low-stock-items']?.data).toEqual({ items: [{ sku: 'A-1001' }] });
    expect(state.byId['low-stock-items']?.source).toBe('widget');
    expect(state.byId['low-stock-items']?.updatedAt).toBe(20);
  });

  it('marks injection outcomes by runtime surface id', () => {
    const state = reduce([
      upsertArtifact({
        id: 'artifact-1',
        title: 'Artifact 1',
        source: 'card',
        runtimeSurfaceId: 'runtime-ok',
        runtimeSurfaceCode: 'code-ok',
        updatedAt: 10,
      }),
      upsertArtifact({
        id: 'artifact-2',
        title: 'Artifact 2',
        source: 'card',
        runtimeSurfaceId: 'runtime-bad',
        runtimeSurfaceCode: 'code-bad',
        updatedAt: 10,
      }),
      markRuntimeSurfaceInjectionResults({
        injectedSurfaceIds: ['runtime-ok'],
        failed: [{ surfaceId: 'runtime-bad', error: 'syntax error' }],
        updatedAt: 99,
      }),
    ]);

    expect(state.byId['artifact-1']?.injectionStatus).toBe('injected');
    expect(state.byId['artifact-1']?.injectionError).toBeUndefined();
    expect(state.byId['artifact-1']?.updatedAt).toBe(99);

    expect(state.byId['artifact-2']?.injectionStatus).toBe('failed');
    expect(state.byId['artifact-2']?.injectionError).toBe('syntax error');
    expect(state.byId['artifact-2']?.updatedAt).toBe(99);
  });

  it('persists pack id alongside runtime surface metadata', () => {
    const state = reduce([
      upsertArtifact({
        id: 'artifact-pack',
        title: 'Artifact Pack',
        source: 'card',
        runtimeSurfaceId: 'runtime-pack',
        runtimeSurfaceCode: 'code-pack',
        packId: 'kanban.v1',
        updatedAt: 10,
      }),
      upsertArtifact({
        id: 'artifact-pack',
        source: 'card',
        updatedAt: 20,
      }),
    ]);

    expect(state.byId['artifact-pack']?.packId).toBe('kanban.v1');
    expect(state.byId['artifact-pack']?.runtimeSurfaceId).toBe('runtime-pack');
  });

  it('only marks runtime surfaces pending once projection queued them for injection', () => {
    const state = reduce([
      upsertArtifact({
        id: 'artifact-streaming',
        title: 'Streaming Artifact',
        source: 'card',
        runtimeSurfaceId: 'runtime-streaming',
        runtimeSurfaceCode: 'code-streaming',
        packId: 'ui.card.v1',
        updatedAt: 10,
      }),
      upsertArtifact({
        id: 'artifact-streaming',
        source: 'card',
        runtimeSurfaceId: 'runtime-streaming',
        runtimeSurfaceCode: 'code-streaming',
        packId: 'ui.card.v1',
        queueForInjection: true,
        updatedAt: 20,
      }),
    ]);

    expect(state.byId['artifact-streaming']?.injectionStatus).toBe('pending');
    expect(state.byId['artifact-streaming']?.updatedAt).toBe(20);
  });
});
