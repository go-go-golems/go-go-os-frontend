import type {
  PluginCardRuntimeState,
  PluginCardRuntimeStateSlice,
  PluginRuntimeSession,
} from './pluginCardRuntimeSlice';

const RUNTIME_PROJECTED_SLICES = new Set(['inventory', 'sales']);
const EMPTY_RUNTIME_OBJECT = Object.freeze({}) as Record<string, unknown>;
const projectedDomainsCache = new WeakMap<object, Record<string, unknown>>();

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
export const selectProjectedRuntimeDomains = (state: unknown): Record<string, unknown> => {
  if (!isRecord(state)) {
    return EMPTY_RUNTIME_OBJECT;
  }

  const cached = projectedDomainsCache.get(state);
  if (cached) {
    return cached;
  }
  const projected = Object.fromEntries(
    Object.entries(state).filter(([key]) => RUNTIME_PROJECTED_SLICES.has(key)),
  );
  projectedDomainsCache.set(state, projected);
  return projected;
};
