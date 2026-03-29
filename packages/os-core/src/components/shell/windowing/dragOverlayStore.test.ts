import { describe, expect, it } from 'vitest';
import { createDragOverlayStore } from './dragOverlayStore';

describe('dragOverlayStore', () => {
  it('begins interaction with draft bounds and active metadata', () => {
    const store = createDragOverlayStore();
    store.begin('w1', 'move', { x: 10, y: 20, width: 300, height: 200 });

    const snapshot = store.getSnapshot();
    expect(snapshot.activeWindowId).toBe('w1');
    expect(snapshot.mode).toBe('move');
    expect(snapshot.draftsById.w1).toEqual({ x: 10, y: 20, width: 300, height: 200 });
  });

  it('updates existing draft bounds', () => {
    const store = createDragOverlayStore();
    store.begin('w1', 'move', { x: 10, y: 20, width: 300, height: 200 });
    store.update('w1', { x: 50, y: 40, width: 300, height: 200 });

    expect(store.getSnapshot().draftsById.w1).toEqual({ x: 50, y: 40, width: 300, height: 200 });
  });

  it('clears interaction for a window and resets active state', () => {
    const store = createDragOverlayStore();
    store.begin('w1', 'resize', { x: 5, y: 8, width: 310, height: 220 });
    store.clear('w1');

    const snapshot = store.getSnapshot();
    expect(snapshot.draftsById.w1).toBeUndefined();
    expect(snapshot.activeWindowId).toBeNull();
    expect(snapshot.mode).toBeNull();
  });

  it('prunes drafts for missing windows', () => {
    const store = createDragOverlayStore();
    store.begin('w1', 'move', { x: 1, y: 2, width: 200, height: 150 });
    store.begin('w2', 'resize', { x: 3, y: 4, width: 220, height: 170 });
    store.pruneMissing(['w2']);

    const snapshot = store.getSnapshot();
    expect(snapshot.draftsById.w1).toBeUndefined();
    expect(snapshot.draftsById.w2).toEqual({ x: 3, y: 4, width: 220, height: 170 });
    expect(snapshot.activeWindowId).toBe('w2');
    expect(snapshot.mode).toBe('resize');
  });

  it('clears all drafts', () => {
    const store = createDragOverlayStore();
    store.begin('w1', 'move', { x: 0, y: 0, width: 100, height: 100 });
    store.clearAll();

    const snapshot = store.getSnapshot();
    expect(snapshot.activeWindowId).toBeNull();
    expect(snapshot.mode).toBeNull();
    expect(snapshot.draftsById).toEqual({});
  });
});

