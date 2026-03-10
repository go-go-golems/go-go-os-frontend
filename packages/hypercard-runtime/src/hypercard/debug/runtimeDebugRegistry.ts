import { useSyncExternalStore } from 'react';
import type { CardStackDefinition } from '@hypercard/engine';

const registeredStacks = new Map<string, CardStackDefinition>();
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function registerRuntimeDebugStacks(stacks: readonly CardStackDefinition[]): void {
  let changed = false;
  for (const stack of stacks) {
    if (!stack?.id) {
      continue;
    }
    if (registeredStacks.get(stack.id) === stack) {
      continue;
    }
    registeredStacks.set(stack.id, stack);
    changed = true;
  }
  if (changed) {
    emitChange();
  }
}

export function getRegisteredRuntimeDebugStacks(): CardStackDefinition[] {
  return Array.from(registeredStacks.values());
}

export function clearRegisteredRuntimeDebugStacks(): void {
  if (registeredStacks.size === 0) {
    return;
  }
  registeredStacks.clear();
  emitChange();
}

export function subscribeRuntimeDebugStacks(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRegisteredRuntimeDebugStacks(): CardStackDefinition[] {
  return useSyncExternalStore(
    subscribeRuntimeDebugStacks,
    getRegisteredRuntimeDebugStacks,
    getRegisteredRuntimeDebugStacks,
  );
}
