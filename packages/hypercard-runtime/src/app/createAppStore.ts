import { configureStore, type Reducer } from '@reduxjs/toolkit';
import {
  createReduxPerfMiddleware,
  debugReducer,
  initDiagnostics,
  notificationsReducer,
  startFrameMonitor,
} from '@hypercard/engine';
import { windowingReducer } from '@hypercard/engine/desktop-core';
import { runtimeSessionsReducer } from '../features/runtimeSessions/runtimeSessionsSlice';
import { createArtifactProjectionMiddleware } from '../hypercard/artifacts/artifactProjectionMiddleware';
import { hypercardArtifactsReducer } from '../hypercard/artifacts/artifactsSlice';
import { createRuntimeSessionLifecycleMiddleware } from './runtimeSessionLifecycleMiddleware';

export const CORE_APP_REDUCER_KEYS = [
  'pluginCardRuntime',
  'runtimeSessions',
  'windowing',
  'notifications',
  'debug',
  'hypercardArtifacts',
] as const;

const CORE_APP_REDUCER_KEY_SET = new Set<string>(CORE_APP_REDUCER_KEYS);

function assertNoReservedDomainReducerKeys(domainReducers: Record<string, Reducer>): void {
  const reservedKeys = Object.keys(domainReducers).filter((key) => CORE_APP_REDUCER_KEY_SET.has(key));
  if (reservedKeys.length === 0) {
    return;
  }

  throw new Error(
    `createAppStore domain reducer keys are reserved by engine core reducers: ${reservedKeys.join(', ')}`,
  );
}

/** Options for `createAppStore`. */
export interface CreateAppStoreOptions {
  /** Enable Redux throughput/FPS diagnostics middleware. Default: false. */
  enableReduxDiagnostics?: boolean;
  /** Rolling window duration in ms for diagnostics aggregation. Default: 5000. */
  diagnosticsWindowMs?: number;
}

/**
 * Creates a Redux store factory pre-wired with all HyperCard engine reducers
 * (runtimeSessions, windowing, notifications, debug).
 *
 * Optionally enables Redux throughput/FPS diagnostics when
 * `options.enableReduxDiagnostics` is true (intended for dev-mode only).
 * Diagnostics data is stored outside of Redux in a module-level store
 * to avoid polluting the dispatch/render cycle it measures.
 *
 * Returns both a singleton store and a createStore() factory for Storybook.
 *
 * @example
 * ```ts
 * const { store, createStore } = createAppStore({
 *   contacts: contactsReducer,
 *   companies: companiesReducer,
 * });
 * ```
 *
 * @example
 * ```ts
 * // With diagnostics enabled (dev mode):
 * const { store, createStore } = createAppStore(
 *   { inventory: inventoryReducer },
 *   { enableReduxDiagnostics: import.meta.env.DEV },
 * );
 * ```
 */
export function createAppStore<T extends Record<string, Reducer>>(
  domainReducers: T,
  options: CreateAppStoreOptions = {},
) {
  const enableDiag = options.enableReduxDiagnostics === true;
  assertNoReservedDomainReducerKeys(domainReducers);

  const reducer = {
    runtimeSessions: runtimeSessionsReducer,
    windowing: windowingReducer,
    notifications: notificationsReducer,
    debug: debugReducer,
    hypercardArtifacts: hypercardArtifactsReducer,
    ...domainReducers,
  };

  // Initialise module-level diagnostics storage when enabled
  if (enableDiag) {
    initDiagnostics({ windowMs: options.diagnosticsWindowMs ?? 5000 });
  }

  const perfMiddleware = enableDiag
    ? createReduxPerfMiddleware({ windowMs: options.diagnosticsWindowMs ?? 5000 })
    : null;

  function createStore() {
    const artifactProjectionMiddleware = createArtifactProjectionMiddleware();
    const runtimeSessionLifecycleMiddleware = createRuntimeSessionLifecycleMiddleware();
    const store = configureStore({
      reducer,
      middleware: (getDefault) =>
        perfMiddleware
          ? getDefault().concat(
              artifactProjectionMiddleware.middleware,
              runtimeSessionLifecycleMiddleware.middleware,
              perfMiddleware,
            )
          : getDefault().concat(
              artifactProjectionMiddleware.middleware,
              runtimeSessionLifecycleMiddleware.middleware,
            ),
    });

    // Start frame monitor when diagnostics are enabled
    if (enableDiag && typeof requestAnimationFrame !== 'undefined') {
      startFrameMonitor();
    }

    return store;
  }

  const store = createStore();

  type AppStore = ReturnType<typeof createStore>;
  type RootState = ReturnType<AppStore['getState']>;
  type AppDispatch = AppStore['dispatch'];

  return {
    store,
    createStore,
  } as {
    store: AppStore;
    createStore: () => AppStore;
    RootState: RootState;
    AppDispatch: AppDispatch;
  };
}
