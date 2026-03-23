import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import INVENTORY_STACK from '../plugin-runtime/fixtures/inventory-stack.vm.js?raw';
import { clearRuntimePackages, registerRuntimePackage } from '../runtime-packages';
import { clearRuntimeSurfaceTypes, registerRuntimeSurfaceType } from '../runtime-packs';
import { TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE, TEST_UI_RUNTIME_PACKAGE } from '../testRuntimeUi';
import { WINDOW_OWNED_RUNTIME_SESSION } from './runtimeOwnership';
import { createRuntimeSessionManager } from './runtimeSessionManager';

describe('runtimeSessionManager', () => {
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

  it('ensures a runtime session once and exposes a shared ready handle', async () => {
    const manager = createRuntimeSessionManager();

    const handle = await manager.ensureSession({
      bundleId: 'inventory',
      sessionId: 'inventory@managed',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });

    expect(handle.getBundleMeta().surfaces).toEqual(['lowStock']);
    expect(manager.listSessions()).toEqual([
      expect.objectContaining({
        sessionId: 'inventory@managed',
        bundleId: 'inventory',
        packageIds: ['ui'],
        surfaces: ['lowStock'],
        status: 'ready',
        attachedViewIds: [],
        ownership: WINDOW_OWNED_RUNTIME_SESSION,
      }),
    ]);

    const second = await manager.ensureSession({
      bundleId: 'inventory',
      sessionId: 'inventory@managed',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });
    expect(second.getBundleMeta().surfaces).toEqual(['lowStock']);
  });

  it('tracks attached views without disposing the session on detach', async () => {
    const manager = createRuntimeSessionManager();
    const handle = await manager.ensureSession({
      bundleId: 'inventory',
      sessionId: 'inventory@views',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });

    const releaseA = handle.attachView('window:a');
    const releaseB = handle.attachView('window:b');
    expect(manager.listSessions()[0]?.attachedViewIds).toEqual(['window:a', 'window:b']);

    releaseA();
    expect(manager.listSessions()[0]?.attachedViewIds).toEqual(['window:b']);
    expect(manager.getSession('inventory@views')).not.toBeNull();

    releaseB();
    expect(manager.listSessions()[0]?.attachedViewIds).toEqual([]);
    expect(manager.getSession('inventory@views')).not.toBeNull();
  });

  it('emits updates for load, attach, detach, and explicit dispose', async () => {
    const manager = createRuntimeSessionManager();
    const listener = vi.fn();
    const unsubscribe = manager.subscribe(listener);

    const handle = await manager.ensureSession({
      bundleId: 'inventory',
      sessionId: 'inventory@notify',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });

    const release = handle.attachView('window:notify');
    release();
    expect(handle.dispose()).toBe(true);

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('rejects conflicting ensureSession requests for the same id', async () => {
    const manager = createRuntimeSessionManager();

    await manager.ensureSession({
      bundleId: 'inventory',
      sessionId: 'inventory@dupe',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });

    await expect(
      manager.ensureSession({
        bundleId: 'inventory',
        sessionId: 'inventory@dupe',
        packageIds: ['ui', 'kanban'],
        bundleCode: INVENTORY_STACK,
      }),
    ).rejects.toThrow(/different configuration/i);
  });
});
