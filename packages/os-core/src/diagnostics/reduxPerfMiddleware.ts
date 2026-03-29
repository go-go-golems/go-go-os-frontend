import type { Middleware } from '@reduxjs/toolkit';
import { pushPerfEvent } from './diagnosticsStore';
import type { ReduxPerfEvent } from './types';

export interface ReduxPerfMiddlewareOptions {
  /** Rolling window in ms (reserved for future sampling logic). Default 5000. */
  windowMs?: number;
}

/**
 * Redux middleware that times every dispatch and writes a `ReduxPerfEvent`
 * into the module-level diagnostics store.
 *
 * **Does not dispatch any Redux actions** — avoids the observer effect
 * of polluting the store it's trying to measure.
 *
 * Captures:
 * - action type
 * - reducer duration (ms)
 * - whether root state reference changed (state-change detection)
 */
export function createReduxPerfMiddleware(
  _opts: ReduxPerfMiddlewareOptions = {},
): Middleware {
  const middleware: Middleware = (storeApi) => (next) => (action) => {
    const prevState = storeApi.getState();
    const start = performance.now();
    const result = next(action);
    const end = performance.now();
    const nextState = storeApi.getState();

    const actionType =
      action && typeof action === 'object' && 'type' in action
        ? (action as { type: string }).type
        : 'unknown';

    const event: ReduxPerfEvent = {
      ts: Date.now(),
      type: actionType,
      durationMs: end - start,
      changed: prevState !== nextState,
    };

    pushPerfEvent(event);

    return result;
  };

  return middleware;
}
