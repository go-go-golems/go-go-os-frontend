import { configureStore, type Reducer } from '@reduxjs/toolkit';
import {
  createReduxPerfMiddleware,
  debugReducer,
  initDiagnostics,
  notificationsReducer,
  startFrameMonitor,
} from '@go-go-golems/os-core';
import { windowingReducer } from '@go-go-golems/os-core/desktop-core';
import type { AppStateKey } from '../contracts/appManifest';
import type { LaunchableAppModule } from '../contracts/launchableAppModule';

export const SHELL_CORE_REDUCER_KEYS = [
  'pluginCardRuntime',
  'runtimeSessions',
  'windowing',
  'notifications',
  'debug',
  'hypercardArtifacts',
] as const;

const ENGINE_CORE_REDUCER_KEYS = new Set<string>(SHELL_CORE_REDUCER_KEYS);

export interface CreateLauncherStoreOptions {
  /** Enable Redux throughput/FPS diagnostics middleware. Default: false. */
  enableReduxDiagnostics?: boolean;
  /** Rolling window duration in ms for diagnostics aggregation. Default: 5000. */
  diagnosticsWindowMs?: number;
  /** Extra reducers shared by the host app and all launched modules. */
  sharedReducers?: Record<string, Reducer>;
}

export function collectModuleReducers(modules: readonly LaunchableAppModule[]): Record<string, Reducer> {
  const seen = new Set<string>();
  const reducers: Record<string, Reducer> = {};

  for (const module of modules) {
    if (!module.state) {
      continue;
    }

    const { stateKey, reducer } = module.state;
    if (ENGINE_CORE_REDUCER_KEYS.has(stateKey)) {
      throw new Error(`App module "${module.manifest.id}" uses reserved reducer key "${stateKey}".`);
    }
    if (seen.has(stateKey)) {
      throw new Error(`Duplicate app reducer key "${stateKey}".`);
    }

    seen.add(stateKey);
    reducers[stateKey] = reducer;
  }

  return reducers;
}

function assertValidReducerKey(key: string, seen: Set<string>): void {
  if (ENGINE_CORE_REDUCER_KEYS.has(key)) {
    throw new Error(`Launcher store reducer key "${key}" is reserved by engine core reducers.`);
  }
  if (seen.has(key)) {
    throw new Error(`Duplicate launcher reducer key "${key}".`);
  }
  seen.add(key);
}

function mergeLauncherReducers(
  moduleReducers: Record<string, Reducer>,
  sharedReducers: Record<string, Reducer>,
): Record<string, Reducer> {
  const merged: Record<string, Reducer> = {};
  const seen = new Set<string>();

  for (const [key, reducer] of Object.entries(sharedReducers)) {
    assertValidReducerKey(key, seen);
    merged[key] = reducer;
  }
  for (const [key, reducer] of Object.entries(moduleReducers)) {
    assertValidReducerKey(key, seen);
    merged[key] = reducer;
  }

  return merged;
}

export function createLauncherStore(modules: readonly LaunchableAppModule[], options: CreateLauncherStoreOptions = {}) {
  const { sharedReducers = {}, enableReduxDiagnostics = false, diagnosticsWindowMs = 5000 } = options;
  const moduleReducers = collectModuleReducers(modules);
  const domainReducers = mergeLauncherReducers(moduleReducers, sharedReducers);

  if (enableReduxDiagnostics) {
    initDiagnostics({ windowMs: diagnosticsWindowMs });
  }

  const perfMiddleware = enableReduxDiagnostics ? createReduxPerfMiddleware({ windowMs: diagnosticsWindowMs }) : null;
  const reducer = {
    windowing: windowingReducer,
    notifications: notificationsReducer,
    debug: debugReducer,
    ...domainReducers,
  };

  function createStore() {
    const store = configureStore({
      reducer,
      middleware: (getDefault) => (perfMiddleware ? getDefault().concat(perfMiddleware) : getDefault()),
    });

    if (enableReduxDiagnostics && typeof requestAnimationFrame !== 'undefined') {
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

export function selectModuleState<TSlice = unknown>(state: unknown, stateKey: AppStateKey): TSlice | undefined {
  if (typeof state !== 'object' || state === null || Array.isArray(state)) {
    return undefined;
  }
  return (state as Record<string, unknown>)[stateKey] as TSlice | undefined;
}

export function createModuleSelector<TSlice = unknown, TResult = TSlice | undefined>(
  stateKey: AppStateKey,
  selector: (slice: TSlice | undefined) => TResult,
) {
  return (state: unknown): TResult => selector(selectModuleState<TSlice>(state, stateKey));
}
