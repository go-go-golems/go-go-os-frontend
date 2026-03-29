import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import COLUMN_STACK from './fixtures/column-stack.vm.js?raw';
import DYNAMIC_CARD from './fixtures/dynamic-card.vm.js?raw';
import INVENTORY_STACK from './fixtures/inventory-stack.vm.js?raw';
import LOOP_STACK from './fixtures/loop-stack.vm.js?raw';
import PATCHED_LOW_STOCK_HANDLER from './fixtures/patched-low-stock-handler.vm.js?raw';
import PATCHED_LOW_STOCK_RENDER from './fixtures/patched-low-stock-render.vm.js?raw';
import { QuickJSRuntimeService } from './runtimeService';
import { clearRuntimePackages, registerRuntimePackage } from '../runtime-packages';
import { clearRuntimeSurfaceTypes, registerRuntimeSurfaceType } from '../runtime-packs';
import { TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE, TEST_UI_RUNTIME_PACKAGE } from '../testRuntimeUi';

describe('QuickJSRuntimeService', () => {
  const services: QuickJSRuntimeService[] = [];

  beforeEach(() => {
    clearRuntimePackages();
    clearRuntimeSurfaceTypes();
    registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);
  });

  afterEach(() => {
    for (const service of services) {
      for (const sessionId of service.health().sessions) {
        service.disposeSession(sessionId);
      }
    }
    services.length = 0;
  });

  it('loads stack bundle and renders a valid tree', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    const bundle = await service.loadRuntimeBundle('inventory', 'inventory@one', ['ui'], INVENTORY_STACK);
    expect(bundle.surfaces).toEqual(['lowStock']);

    const tree = service.renderRuntimeSurface('inventory@one', 'lowStock', {
      filters: { filter: 'all' },
      draft: { limit: 3 },
    });
    expect(tree.kind).toBe('panel');
  });

  it('fails bundle load when required runtime packages were not registered', async () => {
    clearRuntimePackages();
    clearRuntimeSurfaceTypes();

    const service = new QuickJSRuntimeService();
    services.push(service);

    await expect(service.loadRuntimeBundle('inventory', 'inventory@missing', ['ui'], INVENTORY_STACK)).rejects.toThrow(
      /unknown runtime package/i
    );
  });

  it('returns generic runtime actions from handlers', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    await service.loadRuntimeBundle('inventory', 'inventory@one', ['ui'], INVENTORY_STACK);

    const actions = service.eventRuntimeSurface(
      'inventory@one',
      'lowStock',
      'reserve',
      { sku: 'A-1' },
      { filters: { filter: 'all' }, draft: { limit: 5 } }
    );

    expect(actions).toEqual([
      {
        type: 'draft.set',
        payload: { path: 'lastSku', value: 'A-1' },
      },
      {
        type: 'filters.set',
        payload: { path: 'filter', value: 'low-stock' },
      },
      {
        type: 'inventory/reserve-item',
        payload: { sku: 'A-1' },
      },
      {
        type: 'notify.show',
        payload: { level: 'info', message: 'reserved' },
      },
    ]);
  });

  it('disposes runtime sessions and rejects further renders', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    await service.loadRuntimeBundle('inventory', 'inventory@one', ['ui'], INVENTORY_STACK);
    expect(service.disposeSession('inventory@one')).toBe(true);
    expect(service.disposeSession('inventory@one')).toBe(false);
    expect(() => service.renderRuntimeSurface('inventory@one', 'lowStock', {})).toThrow(/not found/i);
  });

  it('supports multiple sessions from one stack bundle', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    await service.loadRuntimeBundle('inventory', 'inventory@one', ['ui'], INVENTORY_STACK);
    await service.loadRuntimeBundle('inventory', 'inventory@two', ['ui'], INVENTORY_STACK);

    const firstTree = service.renderRuntimeSurface('inventory@one', 'lowStock', {
      filters: { filter: 'all' },
      draft: { limit: 1 },
    });
    const secondTree = service.renderRuntimeSurface('inventory@two', 'lowStock', {
      filters: { filter: 'low-stock' },
      draft: { limit: 7 },
    });

    expect(firstTree.kind).toBe('panel');
    expect(secondTree.kind).toBe('panel');
    expect(service.health().sessions).toEqual(expect.arrayContaining(['inventory@one', 'inventory@two']));
  });

  it('supports ui.column render output', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    await service.loadRuntimeBundle('column-demo', 'column-demo@one', ['ui'], COLUMN_STACK);
    const tree = service.renderRuntimeSurface('column-demo@one', 'main', {});

    expect(tree.kind).toBe('column');
  });

  it('evaluates plain JS and inspects globals inside a live runtime session', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    await service.loadRuntimeBundle('inventory', 'inventory@js', ['ui'], INVENTORY_STACK);

    expect(service.evaluateSessionJs('inventory@js', 'globalThis.answer = 41')).toEqual({
      value: 41,
      valueType: 'number',
      logs: [],
    });

    expect(service.evaluateSessionJs('inventory@js', 'console.log("hello"); answer + 1')).toEqual({
      value: 42,
      valueType: 'number',
      logs: ['hello'],
    });

    expect(service.getSessionGlobalNames('inventory@js')).toContain('answer');
    expect(service.getSessionGlobalNames('inventory@js')).toContain('console');
  });

  it('interrupts infinite render loops with timeout', async () => {
    const service = new QuickJSRuntimeService({ renderTimeoutMs: 10 });
    services.push(service);

    await service.loadRuntimeBundle('loop', 'loop@one', ['ui'], LOOP_STACK);

    expect(() => service.renderRuntimeSurface('loop@one', 'loop', {})).toThrow(/interrupted/i);
  });

  it('supports defining cards and patching render/handlers at runtime', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    await service.loadRuntimeBundle('inventory', 'inventory@dynamic', ['ui'], INVENTORY_STACK);

    const withDynamicCard = service.defineRuntimeSurface('inventory@dynamic', 'onDemand', DYNAMIC_CARD, 'ui.card.v1');
    expect(withDynamicCard.surfaces).toContain('onDemand');

    const dynamicTree = service.renderRuntimeSurface('inventory@dynamic', 'onDemand', { draft: { name: 'Backorder' } });
    expect(dynamicTree.kind).toBe('panel');

    const dynamicActions = service.eventRuntimeSurface('inventory@dynamic', 'onDemand', 'back', {}, {});
    expect(dynamicActions).toEqual([
      {
        type: 'nav.back',
      },
    ]);

    service.defineRuntimeSurfaceRender('inventory@dynamic', 'lowStock', PATCHED_LOW_STOCK_RENDER);
    const patchedTree = service.renderRuntimeSurface('inventory@dynamic', 'lowStock', {
      filters: { filter: 'all' },
      draft: { limit: 9 },
    });
    expect(patchedTree.kind).toBe('panel');
    expect((patchedTree as { children?: Array<{ kind?: string; text?: string }> }).children?.[0]?.text).toContain(
      'Patched limit: 9'
    );

    service.defineRuntimeSurfaceHandler('inventory@dynamic', 'lowStock', 'patchedNotify', PATCHED_LOW_STOCK_HANDLER);
    const patchedActions = service.eventRuntimeSurface(
      'inventory@dynamic',
      'lowStock',
      'patchedNotify',
      {},
      {}
    );
    expect(patchedActions).toEqual([
      {
        type: 'notify.show',
        payload: { level: 'info', message: 'patched-handler' },
      },
    ]);
  });

  it('rejects unknown runtime surface types during surface definition', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    await service.loadRuntimeBundle('inventory', 'inventory@bad-pack', ['ui'], INVENTORY_STACK);

    expect(() =>
      service.defineRuntimeSurface('inventory@bad-pack', 'broken', DYNAMIC_CARD, 'missing.v1')
    ).toThrow(/unknown runtime surface type/i);
  });

  it('rejects missing runtime surface types during surface definition', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    await service.loadRuntimeBundle('inventory', 'inventory@missing-pack', ['ui'], INVENTORY_STACK);

    expect(() =>
      service.defineRuntimeSurface('inventory@missing-pack', 'broken', DYNAMIC_CARD, '')
    ).toThrow(/packid is required/i);
  });

  it('rejects bundle loads when declared package ids do not match installed packages', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);
    registerRuntimePackage({
      packageId: 'demo',
      version: '1.0.0',
      installPrelude: '',
      surfaceTypes: [],
    });

    await expect(
      service.loadRuntimeBundle('inventory', 'inventory@mismatch', ['ui', 'demo'], INVENTORY_STACK)
    ).rejects.toThrow(/packageIds mismatch/i);
  });
});
