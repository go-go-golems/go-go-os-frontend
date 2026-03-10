import type { CardStackDefinition } from '@hypercard/engine';
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

const STACK_A: CardStackDefinition = {
  id: 'inventory',
  name: 'Inventory',
  icon: '📦',
  homeCard: 'home',
  plugin: { bundleCode: '' },
  cards: {
    home: {
      id: 'home',
      type: 'report',
      title: 'Inventory Home',
      icon: '🏠',
      ui: {},
    },
  },
};

const STACK_B: CardStackDefinition = {
  id: 'os-launcher',
  name: 'go-go-os Launcher',
  icon: '🖥️',
  homeCard: 'home',
  plugin: { bundleCode: '' },
  cards: {
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

  it('registers stacks by id without duplicating them', () => {
    registerRuntimeDebugStacks([STACK_A, STACK_B]);
    registerRuntimeDebugStacks([STACK_A]);

    expect(getRegisteredRuntimeDebugStacks().map((stack) => stack.id)).toEqual(['inventory', 'os-launcher']);
  });

  it('builds the shared runtime debug window payload', () => {
    const payload = buildRuntimeDebugWindowPayload();

    expect(payload.content.kind).toBe('app');
    expect(payload.content.appKey).toBe(`${HYPERCARD_RUNTIME_DEBUG_APP_ID}:${HYPERCARD_RUNTIME_DEBUG_INSTANCE_ID}`);
    expect(payload.dedupeKey).toBe(`${HYPERCARD_RUNTIME_DEBUG_APP_ID}:${HYPERCARD_RUNTIME_DEBUG_INSTANCE_ID}`);
    expect(payload.title).toBe('Stacks & Cards');
  });
});
