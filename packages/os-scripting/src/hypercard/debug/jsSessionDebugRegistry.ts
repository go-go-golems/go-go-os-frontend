import { useSyncExternalStore } from 'react';
import type { JsSessionBroker } from '../../repl/jsSessionBroker';

export interface JsSessionDebugSource {
  id: string;
  title: string;
  broker: JsSessionBroker;
}

const registeredSources = new Map<string, JsSessionDebugSource>();
const listeners = new Set<() => void>();
let registeredSourcesSnapshot: JsSessionDebugSource[] = [];

function refreshSnapshot() {
  registeredSourcesSnapshot = Array.from(registeredSources.values());
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function registerJsSessionDebugSource(source: JsSessionDebugSource): void {
  if (!source?.id || !source.broker) {
    return;
  }
  if (registeredSources.get(source.id) === source) {
    return;
  }
  registeredSources.set(source.id, source);
  refreshSnapshot();
  emitChange();
}

export function clearRegisteredJsSessionDebugSources(): void {
  if (registeredSources.size === 0) {
    return;
  }
  registeredSources.clear();
  refreshSnapshot();
  emitChange();
}

export function getRegisteredJsSessionDebugSources(): JsSessionDebugSource[] {
  return registeredSourcesSnapshot;
}

export function subscribeJsSessionDebugSources(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRegisteredJsSessionDebugSources(): JsSessionDebugSource[] {
  return useSyncExternalStore(
    subscribeJsSessionDebugSources,
    getRegisteredJsSessionDebugSources,
    getRegisteredJsSessionDebugSources,
  );
}
