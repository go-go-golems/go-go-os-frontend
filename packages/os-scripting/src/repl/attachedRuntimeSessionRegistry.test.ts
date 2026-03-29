import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearAttachedRuntimeSessions,
  getAttachedRuntimeSession,
  listAttachedRuntimeSessions,
} from './attachedRuntimeSessionRegistry';
import INVENTORY_STACK from '../plugin-runtime/fixtures/inventory-stack.vm.js?raw';
import { DEFAULT_RUNTIME_SESSION_MANAGER } from '../runtime-session-manager';
import { clearRuntimePackages, registerRuntimePackage } from '../runtime-packages';
import { clearRuntimeSurfaceTypes, registerRuntimeSurfaceType } from '../runtime-packs';
import { TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE, TEST_UI_RUNTIME_PACKAGE } from '../testRuntimeUi';
import { ATTACHED_READ_ONLY_RUNTIME_SESSION } from '../runtime-session-manager/runtimeOwnership';

beforeEach(() => {
  clearRuntimePackages();
  clearRuntimeSurfaceTypes();
  registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
  registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);
});

afterEach(() => {
  DEFAULT_RUNTIME_SESSION_MANAGER.clear();
  clearAttachedRuntimeSessions();
  clearRuntimePackages();
  clearRuntimeSurfaceTypes();
});

describe('attachedRuntimeSessionRegistry', () => {
  it('derives attached runtime sessions from manager-owned sessions with attached views', async () => {
    const handle = await DEFAULT_RUNTIME_SESSION_MANAGER.ensureSession({
      bundleId: 'inventory',
      sessionId: 'inventory@live',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });
    const releaseView = handle.attachView('window:inventory@live');

    expect(listAttachedRuntimeSessions()).toHaveLength(1);
    expect(getAttachedRuntimeSession('inventory@live')?.summary.origin).toBe('attached');
    expect(getAttachedRuntimeSession('inventory@live')?.summary.ownership).toEqual(ATTACHED_READ_ONLY_RUNTIME_SESSION);
    expect(getAttachedRuntimeSession('inventory@live')?.handle.renderSurface('lowStock', { filters: {}, draft: {} })).toBeTruthy();

    releaseView();
    expect(listAttachedRuntimeSessions()).toEqual([]);
  });
});
