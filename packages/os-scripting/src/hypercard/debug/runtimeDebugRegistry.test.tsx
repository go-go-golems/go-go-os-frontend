import type { RuntimeBundleDefinition } from '@go-go-golems/os-core';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildRuntimeDebugWindowPayload,
  HYPERCARD_RUNTIME_DEBUG_APP_ID,
  HYPERCARD_RUNTIME_DEBUG_INSTANCE_ID,
} from './runtimeDebugApp';
import {
  clearRegisteredRuntimeDebugStacks,
  getRegisteredRuntimeDebugStacks,
  registerRuntimeDebugStacks,
} from './runtimeDebugRegistry';

const STACK_A: RuntimeBundleDefinition = {
  id: 'inventory',
  name: 'Inventory',
  icon: '📦',
  homeSurface: 'home',
  plugin: { packageIds: [], bundleCode: '' },
  surfaces: {
    home: {
      id: 'home',
      type: 'report',
      title: 'Inventory Home',
      icon: '🏠',
      ui: {},
    },
  },
};

const STACK_B: RuntimeBundleDefinition = {
  id: 'os-launcher',
  name: 'go-go-os Launcher',
  icon: '🖥️',
  homeSurface: 'home',
  plugin: { packageIds: [], bundleCode: '' },
  surfaces: {
    home: {
      id: 'home',
      type: 'report',
      title: 'Launcher Home',
      icon: '🏠',
      ui: {},
    },
  },
};

describe('runtime debug registry', () => {
  afterEach(() => {
    clearRegisteredRuntimeDebugStacks();
  });

  it('registers bundles by id without duplicating them', () => {
    registerRuntimeDebugStacks([STACK_A, STACK_B]);
    registerRuntimeDebugStacks([STACK_A]);

    expect(getRegisteredRuntimeDebugStacks().map((bundle) => bundle.id)).toEqual(['inventory', 'os-launcher']);
  });

  it('builds the shared runtime debug window payload', () => {
    const payload = buildRuntimeDebugWindowPayload();

    expect(payload.content.kind).toBe('app');
    expect(payload.content.appKey).toBe(`${HYPERCARD_RUNTIME_DEBUG_APP_ID}:${HYPERCARD_RUNTIME_DEBUG_INSTANCE_ID}`);
    expect(payload.dedupeKey).toBe(`${HYPERCARD_RUNTIME_DEBUG_APP_ID}:${HYPERCARD_RUNTIME_DEBUG_INSTANCE_ID}`);
    expect(payload.title).toBe('Stacks & Cards');
  });
});
