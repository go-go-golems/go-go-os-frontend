/**
 * Global registry of runtime card definitions that need to be injected
 * into plugin sessions after bundle loading.
 *
 * Flow:
 * 1. Chat receives card.v2 event → calls registerRuntimeCard(cardId, code, packId)
 * 2. PluginCardSessionHost finishes loadRuntimeBundle → calls injectPendingCards(service, sessionId)
 * 3. injectPendingCards iterates the registry, calls service.defineRuntimeSurface() for each
 */

export interface RuntimeCardDefinition {
  cardId: string;
  code: string;
  packId?: string;
  registeredAt: number;
}

export interface RuntimeCardInjectionFailure {
  cardId: string;
  error: string;
}

export interface RuntimeCardInjectionResult {
  injected: string[];
  failed: RuntimeCardInjectionFailure[];
}

const registry = new Map<string, RuntimeCardDefinition>();
const listeners = new Set<() => void>();

/** Register a runtime card definition for injection into future sessions. */
export function registerRuntimeCard(cardId: string, code: string, packId?: string): void {
  registry.set(cardId, {
    cardId,
    code,
    packId: typeof packId === 'string' && packId.trim().length > 0 ? packId.trim() : undefined,
    registeredAt: Date.now(),
  });
  listeners.forEach((fn) => fn());
}

/** Remove a runtime card definition. */
export function unregisterRuntimeCard(cardId: string): void {
  registry.delete(cardId);
  listeners.forEach((fn) => fn());
}

/** Get all pending runtime card definitions. */
export function getPendingRuntimeCards(): RuntimeCardDefinition[] {
  return Array.from(registry.values());
}

/** Check if a specific card is registered. */
export function hasRuntimeCard(cardId: string): boolean {
  return registry.has(cardId);
}

/** Subscribe to registry changes. Returns unsubscribe function. */
export function onRegistryChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Clear all registered cards (for testing). */
export function clearRuntimeCardRegistry(): void {
  registry.clear();
  listeners.forEach((fn) => fn());
}

/**
 * Inject all pending runtime cards into a session.
 * Returns the list of card IDs that were successfully injected.
 */
export function injectPendingCards(
  service: { defineRuntimeSurface(sessionId: string, surfaceId: string, code: string, packId?: string): unknown },
  sessionId: string,
): string[] {
  return injectPendingCardsWithReport(service, sessionId).injected;
}

export function injectPendingCardsWithReport(
  service: { defineRuntimeSurface(sessionId: string, surfaceId: string, code: string, packId?: string): unknown },
  sessionId: string,
): RuntimeCardInjectionResult {
  const injected: string[] = [];
  const failed: RuntimeCardInjectionFailure[] = [];
  for (const def of registry.values()) {
    try {
      service.defineRuntimeSurface(sessionId, def.cardId, def.code, def.packId);
      injected.push(def.cardId);
    } catch (err) {
      console.error(`[runtimeCardRegistry] Failed to inject card ${def.cardId} into ${sessionId}:`, err);
      failed.push({
        cardId: def.cardId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { injected, failed };
}
