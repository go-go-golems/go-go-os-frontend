import { useSyncExternalStore } from 'react';

export interface DragOverlayBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DragInteractionMode = 'move' | 'resize';

export interface DragOverlaySnapshot {
  draftsById: Record<string, DragOverlayBounds>;
  activeWindowId: string | null;
  mode: DragInteractionMode | null;
}

type Listener = () => void;

export interface DragOverlayStore {
  begin: (windowId: string, mode: DragInteractionMode, bounds: DragOverlayBounds) => void;
  update: (windowId: string, bounds: DragOverlayBounds) => void;
  clear: (windowId: string) => void;
  clearAll: () => void;
  pruneMissing: (windowIds: string[]) => void;
  getSnapshot: () => DragOverlaySnapshot;
  subscribe: (listener: Listener) => () => void;
}

const EMPTY_SNAPSHOT: DragOverlaySnapshot = {
  draftsById: {},
  activeWindowId: null,
  mode: null,
};

function sameBounds(a: DragOverlayBounds | undefined, b: DragOverlayBounds): boolean {
  if (!a) return false;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

export function createDragOverlayStore(initial: DragOverlaySnapshot = EMPTY_SNAPSHOT): DragOverlayStore {
  let snapshot = initial;
  const listeners = new Set<Listener>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const setSnapshot = (next: DragOverlaySnapshot) => {
    snapshot = next;
    notify();
  };

  return {
    begin(windowId, mode, bounds) {
      const previous = snapshot.draftsById[windowId];
      if (snapshot.activeWindowId === windowId && snapshot.mode === mode && sameBounds(previous, bounds)) {
        return;
      }
      setSnapshot({
        draftsById: { ...snapshot.draftsById, [windowId]: bounds },
        activeWindowId: windowId,
        mode,
      });
    },
    update(windowId, bounds) {
      const previous = snapshot.draftsById[windowId];
      if (sameBounds(previous, bounds)) return;
      setSnapshot({
        draftsById: { ...snapshot.draftsById, [windowId]: bounds },
        activeWindowId: snapshot.activeWindowId,
        mode: snapshot.mode,
      });
    },
    clear(windowId) {
      if (!snapshot.draftsById[windowId] && snapshot.activeWindowId !== windowId) return;
      const { [windowId]: _removed, ...rest } = snapshot.draftsById;
      const isActive = snapshot.activeWindowId === windowId;
      setSnapshot({
        draftsById: rest,
        activeWindowId: isActive ? null : snapshot.activeWindowId,
        mode: isActive ? null : snapshot.mode,
      });
    },
    clearAll() {
      if (snapshot.activeWindowId === null && Object.keys(snapshot.draftsById).length === 0) return;
      setSnapshot(EMPTY_SNAPSHOT);
    },
    pruneMissing(windowIds) {
      const allowed = new Set(windowIds);
      const nextDrafts: Record<string, DragOverlayBounds> = {};
      let changed = false;

      for (const [windowId, bounds] of Object.entries(snapshot.draftsById)) {
        if (allowed.has(windowId)) {
          nextDrafts[windowId] = bounds;
        } else {
          changed = true;
        }
      }

      if (!changed && (snapshot.activeWindowId === null || allowed.has(snapshot.activeWindowId))) return;
      const activeStillPresent =
        snapshot.activeWindowId !== null && allowed.has(snapshot.activeWindowId) ? snapshot.activeWindowId : null;
      setSnapshot({
        draftsById: nextDrafts,
        activeWindowId: activeStillPresent,
        mode: activeStillPresent ? snapshot.mode : null,
      });
    },
    getSnapshot() {
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const dragOverlayStore = createDragOverlayStore();

export function useDragOverlaySnapshot() {
  return useSyncExternalStore(dragOverlayStore.subscribe, dragOverlayStore.getSnapshot, dragOverlayStore.getSnapshot);
}

