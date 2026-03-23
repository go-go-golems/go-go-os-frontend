import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import INVENTORY_STACK from '../plugin-runtime/fixtures/inventory-stack.vm.js?raw';
import { clearRuntimePackages, registerRuntimePackage } from '../runtime-packages';
import { clearRuntimeSurfaceTypes, registerRuntimeSurfaceType } from '../runtime-packs';
import { BROKER_OWNED_RUNTIME_SESSION } from '../runtime-session-manager';
import { TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE, TEST_UI_RUNTIME_PACKAGE } from '../testRuntimeUi';
import { createRuntimeBroker } from './runtimeBroker';

describe('runtimeBroker', () => {
  beforeEach(() => {
    clearRuntimePackages();
    clearRuntimeSurfaceTypes();
    registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);
  });

  afterEach(() => {
    clearRuntimePackages();
    clearRuntimeSurfaceTypes();
  });

  it('spawns a runtime session and exposes a live handle plus summary', async () => {
    const broker = createRuntimeBroker();

    const handle = await broker.spawnSession({
      stackId: 'inventory',
      sessionId: 'inventory@repl',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });

    expect(handle.getBundleMeta().surfaces).toEqual(['lowStock']);
    expect(broker.listSessions()).toEqual([
      expect.objectContaining({
        sessionId: 'inventory@repl',
        stackId: 'inventory',
        packageIds: ['ui'],
        surfaces: ['lowStock'],
        origin: 'spawned',
        writable: true,
        ownership: BROKER_OWNED_RUNTIME_SESSION,
      }),
    ]);

    const tree = handle.renderSurface('lowStock', {
      filters: { filter: 'all' },
      draft: { limit: 2 },
    }) as { kind?: string };
    expect(tree.kind).toBe('panel');

    broker.clear();
    expect(broker.listSessions()).toEqual([]);
  });

  it('emits registry updates when sessions are spawned and disposed', async () => {
    const broker = createRuntimeBroker();
    const listener = vi.fn();
    const unsubscribe = broker.subscribe(listener);

    await broker.spawnSession({
      stackId: 'inventory',
      sessionId: 'inventory@notify',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });
    expect(listener).toHaveBeenCalledTimes(1);

    expect(broker.disposeSession('inventory@notify')).toBe(true);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    broker.clear();
  });

  it('rejects duplicate session ids', async () => {
    const broker = createRuntimeBroker();

    await broker.spawnSession({
      stackId: 'inventory',
      sessionId: 'inventory@dupe',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });

    await expect(
      broker.spawnSession({
        stackId: 'inventory',
        sessionId: 'inventory@dupe',
        packageIds: ['ui'],
        bundleCode: INVENTORY_STACK,
      }),
    ).rejects.toThrow(/already exists/i);

    broker.clear();
  });
});
