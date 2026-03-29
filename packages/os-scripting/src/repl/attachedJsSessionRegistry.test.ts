import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearAttachedJsSessions,
  getAttachedJsSession,
  listAttachedJsSessions,
} from './attachedJsSessionRegistry';
import INVENTORY_STACK from '../plugin-runtime/fixtures/inventory-stack.vm.js?raw';
import { DEFAULT_RUNTIME_SESSION_MANAGER } from '../runtime-session-manager';
import { clearRuntimePackages, registerRuntimePackage } from '../runtime-packages';
import { clearRuntimeSurfaceTypes, registerRuntimeSurfaceType } from '../runtime-packs';
import { TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE, TEST_UI_RUNTIME_PACKAGE } from '../testRuntimeUi';

beforeEach(() => {
  clearRuntimePackages();
  clearRuntimeSurfaceTypes();
  registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
  registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);
});

afterEach(() => {
  DEFAULT_RUNTIME_SESSION_MANAGER.clear();
  clearAttachedJsSessions();
  clearRuntimePackages();
  clearRuntimeSurfaceTypes();
});

describe('attachedJsSessionRegistry', () => {
  it('derives attached JS sessions from manager-owned sessions with attached views', async () => {
    const handle = await DEFAULT_RUNTIME_SESSION_MANAGER.ensureSession({
      bundleId: 'inventory',
      sessionId: 'session-1',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });
    const releaseView = handle.attachView('window:inventory@live');

    expect(getAttachedJsSession('session-1')?.summary.title).toBe('Inventory');
    expect(listAttachedJsSessions().map((entry) => entry.summary.sessionId)).toEqual(['session-1']);
    expect(getAttachedJsSession('session-1')?.handle.inspectGlobals()).toContain('ui');

    releaseView();
    expect(getAttachedJsSession('session-1')).toBeNull();
  });
});
