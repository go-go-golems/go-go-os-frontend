import { useSyncExternalStore } from 'react';
import type { RuntimeBundleDefinition } from '@go-go-golems/os-core';

const registeredStacks = new Map<string, RuntimeBundleDefinition>();
const listeners = new Set<() => void>();
let registeredStacksSnapshot: RuntimeBundleDefinition[] = [];

function refreshSnapshot() {
  registeredStacksSnapshot = Array.from(registeredStacks.values());
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function registerRuntimeDebugStacks(stacks: readonly RuntimeBundleDefinition[]): void {
  let changed = false;
  for (const bundle of stacks) {
    if (!bundle?.id) {
      continue;
    }
    if (registeredStacks.get(bundle.id) === bundle) {
      continue;
    }
    registeredStacks.set(bundle.id, bundle);
    changed = true;
  }
  if (changed) {
    refreshSnapshot();
    emitChange();
  }
}

export function getRegisteredRuntimeDebugStacks(): RuntimeBundleDefinition[] {
  return registeredStacksSnapshot;
}

export function clearRegisteredRuntimeDebugStacks(): void {
  if (registeredStacks.size === 0) {
    return;
  }
  registeredStacks.clear();
  refreshSnapshot();
  emitChange();
}

export function subscribeRuntimeDebugStacks(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRegisteredRuntimeDebugStacks(): RuntimeBundleDefinition[] {
  return useSyncExternalStore(
    subscribeRuntimeDebugStacks,
    getRegisteredRuntimeDebugStacks,
    getRegisteredRuntimeDebugStacks,
  );
}
