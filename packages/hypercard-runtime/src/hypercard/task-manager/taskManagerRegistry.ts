import { useSyncExternalStore } from 'react';
import type { TaskManagerRow, TaskManagerSource } from './types';

const registeredSources = new Map<string, TaskManagerSource>();
const listeners = new Set<() => void>();
let registeredSourcesSnapshot: TaskManagerSource[] = [];
let registeredRowsSnapshot: TaskManagerRow[] = [];
const sourceUnsubscribes = new Map<string, () => void>();

function refreshSnapshots() {
  registeredSourcesSnapshot = Array.from(registeredSources.values());
  registeredRowsSnapshot = registeredSourcesSnapshot.flatMap((source) => source.listRows());
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function refreshAndEmit() {
  refreshSnapshots();
  emitChange();
}

export function registerTaskManagerSource(source: TaskManagerSource): void {
  const sourceId = source?.sourceId?.();
  if (!sourceId) {
    return;
  }

  if (registeredSources.get(sourceId) === source) {
    return;
  }

  sourceUnsubscribes.get(sourceId)?.();
  registeredSources.set(sourceId, source);
  sourceUnsubscribes.set(sourceId, source.subscribe(refreshAndEmit));
  refreshAndEmit();
}

export function clearTaskManagerSources(): void {
  if (registeredSources.size === 0) {
    return;
  }
  sourceUnsubscribes.forEach((unsubscribe) => unsubscribe());
  sourceUnsubscribes.clear();
  registeredSources.clear();
  refreshAndEmit();
}

export function listTaskManagerSources(): TaskManagerSource[] {
  return registeredSourcesSnapshot;
}

export function listTaskManagerRows(): TaskManagerRow[] {
  return registeredRowsSnapshot;
}

export async function invokeTaskManagerAction(
  sourceId: string,
  rowId: string,
  actionId: string,
): Promise<void> {
  const source = registeredSources.get(sourceId);
  if (!source) {
    throw new Error(`Unknown task manager source: ${sourceId}`);
  }
  await source.invoke(actionId, rowId);
}

export function subscribeTaskManagerSources(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRegisteredTaskManagerSources(): TaskManagerSource[] {
  return useSyncExternalStore(
    subscribeTaskManagerSources,
    listTaskManagerSources,
    listTaskManagerSources,
  );
}

export function useTaskManagerRows(): TaskManagerRow[] {
  return useSyncExternalStore(
    subscribeTaskManagerSources,
    listTaskManagerRows,
    listTaskManagerRows,
  );
}
