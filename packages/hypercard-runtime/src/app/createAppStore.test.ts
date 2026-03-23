import type { Reducer } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { createAppStore } from './createAppStore';

const stubReducer: Reducer<{ ok: true }> = (state = { ok: true }) => state;

describe('createAppStore', () => {
  it('mounts the core runtime reducer at runtimeSessions', () => {
    const { store } = createAppStore({});
    const state = store.getState() as Record<string, unknown>;

    expect(state).toHaveProperty('runtimeSessions');
    expect(state).not.toHaveProperty('pluginCardRuntime');
  });

  it('rejects domain reducers that collide with reserved core reducer keys', () => {
    expect(() =>
      createAppStore({
        runtimeSessions: stubReducer,
      }),
    ).toThrow(/reserved by engine core reducers/);
  });

  it('keeps the legacy pluginCardRuntime key reserved to prevent silent clobbering', () => {
    expect(() =>
      createAppStore({
        pluginCardRuntime: stubReducer,
      }),
    ).toThrow(/reserved by engine core reducers/);
  });
});
