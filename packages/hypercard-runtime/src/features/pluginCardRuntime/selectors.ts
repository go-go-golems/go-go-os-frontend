import type { CapabilitySet } from './capabilityPolicy';
import type {
  PluginCardRuntimeState,
  PluginCardRuntimeStateSlice,
  PluginRuntimeSession,
} from './pluginCardRuntimeSlice';

const EMPTY_RUNTIME_OBJECT = Object.freeze({}) as Record<string, unknown>;
const projectedDomainsCache = new WeakMap<object, Map<string, Record<string, unknown>>>();
const ALL_PROJECTED_DOMAINS_CACHE_KEY = '__all__';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const selectPluginCardRuntimeState = (state: PluginCardRuntimeStateSlice): PluginCardRuntimeState =>
  state.pluginCardRuntime;

export const selectRuntimeSession = (
  state: PluginCardRuntimeStateSlice,
  sessionId: string
): PluginRuntimeSession | undefined => state.pluginCardRuntime.sessions[sessionId];

export const selectRuntimeSessionState = (
  state: PluginCardRuntimeStateSlice,
  sessionId: string
): Record<string, unknown> => state.pluginCardRuntime.sessions[sessionId]?.sessionState ?? EMPTY_RUNTIME_OBJECT;

export const selectRuntimeCardState = (
  state: PluginCardRuntimeStateSlice,
  sessionId: string,
  cardId: string
): Record<string, unknown> => state.pluginCardRuntime.sessions[sessionId]?.cardState[cardId] ?? EMPTY_RUNTIME_OBJECT;

export const selectRuntimeTimeline = (state: PluginCardRuntimeStateSlice) => state.pluginCardRuntime.timeline;

export const selectPendingDomainIntents = (state: PluginCardRuntimeStateSlice) =>
  state.pluginCardRuntime.pendingDomainIntents;

export const selectPendingSystemIntents = (state: PluginCardRuntimeStateSlice) =>
  state.pluginCardRuntime.pendingSystemIntents;

export const selectPendingNavIntents = (state: PluginCardRuntimeStateSlice) =>
  state.pluginCardRuntime.pendingNavIntents;

/**
 * Returns the app slices that the runtime host currently projects into VM-facing state.
 * The result is intended to be consumed with `useSelector(..., shallowEqual)` so callers
 * rerender only when relevant slice references change.
 */
export const selectProjectedRuntimeDomains = (
  state: unknown,
  allowedSlices: CapabilitySet = [],
): Record<string, unknown> => {
  if (!isRecord(state)) {
    return EMPTY_RUNTIME_OBJECT;
  }

  if (Array.isArray(allowedSlices) && allowedSlices.length === 0) {
    return EMPTY_RUNTIME_OBJECT;
  }

  const cacheKey = allowedSlices === 'all' ? ALL_PROJECTED_DOMAINS_CACHE_KEY : allowedSlices.join('\u0000');
  const cachedByState = projectedDomainsCache.get(state);
  const cached = cachedByState?.get(cacheKey);
  if (cached) {
    return cached;
  }

  const projected = Object.fromEntries(
    (allowedSlices === 'all' ? Object.keys(state) : allowedSlices)
      .filter((key) => isRecord(state[key]))
      .map((key) => [key, state[key]]),
  );
  const nextCache = cachedByState ?? new Map<string, Record<string, unknown>>();
  nextCache.set(cacheKey, projected);
  projectedDomainsCache.set(state, nextCache);
  return projected;
};
