import { CORE_APP_REDUCER_KEYS, type CreateAppStoreOptions, createAppStore } from '@hypercard/hypercard-runtime';
import type { Reducer } from '@reduxjs/toolkit';
import type { AppStateKey } from '../contracts/appManifest';
import type { LaunchableAppModule } from '../contracts/launchableAppModule';

const ENGINE_CORE_REDUCER_KEYS = new Set<string>(CORE_APP_REDUCER_KEYS);

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

export interface CreateLauncherStoreOptions extends CreateAppStoreOptions {
  sharedReducers?: Record<string, Reducer>;
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
  const { sharedReducers = {}, ...storeOptions } = options;
  const moduleReducers = collectModuleReducers(modules);
  const reducers = mergeLauncherReducers(moduleReducers, sharedReducers);
  return createAppStore(reducers, storeOptions);
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
