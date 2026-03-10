import { afterEach, describe, expect, it } from 'vitest';
import COLUMN_STACK from './fixtures/column-stack.vm.js?raw';
import DYNAMIC_CARD from './fixtures/dynamic-card.vm.js?raw';
import INVENTORY_STACK from './fixtures/inventory-stack.vm.js?raw';
import KANBAN_CARD from './fixtures/kanban-card.vm.js?raw';
import LOOP_STACK from './fixtures/loop-stack.vm.js?raw';
import PATCHED_LOW_STOCK_HANDLER from './fixtures/patched-low-stock-handler.vm.js?raw';
import PATCHED_LOW_STOCK_RENDER from './fixtures/patched-low-stock-render.vm.js?raw';
import { QuickJSCardRuntimeService } from './runtimeService';
import { validateRuntimeTree } from '../runtime-packs';

describe('QuickJSCardRuntimeService', () => {
  const services: QuickJSCardRuntimeService[] = [];

  afterEach(() => {
    for (const service of services) {
      for (const sessionId of service.health().sessions) {
        service.disposeSession(sessionId);
      }
    }
    services.length = 0;
  });

  it('loads stack bundle and renders a valid tree', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    const bundle = await service.loadStackBundle('inventory', 'inventory@one', INVENTORY_STACK);
    expect(bundle.cards).toEqual(['lowStock']);

    const tree = service.renderCard('inventory@one', 'lowStock', {
      filters: { filter: 'all' },
      draft: { limit: 3 },
    });
    expect(tree.kind).toBe('panel');
  });

  it('returns generic runtime actions from handlers', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    await service.loadStackBundle('inventory', 'inventory@one', INVENTORY_STACK);

    const actions = service.eventCard(
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
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    await service.loadStackBundle('inventory', 'inventory@one', INVENTORY_STACK);
    expect(service.disposeSession('inventory@one')).toBe(true);
    expect(service.disposeSession('inventory@one')).toBe(false);
    expect(() => service.renderCard('inventory@one', 'lowStock', {})).toThrow(/not found/i);
  });

  it('supports multiple sessions from one stack bundle', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    await service.loadStackBundle('inventory', 'inventory@one', INVENTORY_STACK);
    await service.loadStackBundle('inventory', 'inventory@two', INVENTORY_STACK);

    const firstTree = service.renderCard('inventory@one', 'lowStock', {
      filters: { filter: 'all' },
      draft: { limit: 1 },
    });
    const secondTree = service.renderCard('inventory@two', 'lowStock', {
      filters: { filter: 'low-stock' },
      draft: { limit: 7 },
    });

    expect(firstTree.kind).toBe('panel');
    expect(secondTree.kind).toBe('panel');
    expect(service.health().sessions).toEqual(expect.arrayContaining(['inventory@one', 'inventory@two']));
  });

  it('supports ui.column render output', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    await service.loadStackBundle('column-demo', 'column-demo@one', COLUMN_STACK);
    const tree = service.renderCard('column-demo@one', 'main', {});

    expect(tree.kind).toBe('column');
  });

  it('interrupts infinite render loops with timeout', async () => {
    const service = new QuickJSCardRuntimeService({ renderTimeoutMs: 10 });
    services.push(service);

    await service.loadStackBundle('loop', 'loop@one', LOOP_STACK);

    expect(() => service.renderCard('loop@one', 'loop', {})).toThrow(/interrupted/i);
  });

  it('supports defining cards and patching render/handlers at runtime', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    await service.loadStackBundle('inventory', 'inventory@dynamic', INVENTORY_STACK);

    const withDynamicCard = service.defineCard('inventory@dynamic', 'onDemand', DYNAMIC_CARD);
    expect(withDynamicCard.cards).toContain('onDemand');

    const dynamicTree = service.renderCard('inventory@dynamic', 'onDemand', { draft: { name: 'Backorder' } });
    expect(dynamicTree.kind).toBe('panel');

    const dynamicActions = service.eventCard('inventory@dynamic', 'onDemand', 'back', {}, {});
    expect(dynamicActions).toEqual([
      {
        type: 'nav.back',
      },
    ]);

    service.defineCardRender('inventory@dynamic', 'lowStock', PATCHED_LOW_STOCK_RENDER);
    const patchedTree = service.renderCard('inventory@dynamic', 'lowStock', {
      filters: { filter: 'all' },
      draft: { limit: 9 },
    });
    expect(patchedTree.kind).toBe('panel');
    expect((patchedTree as { children?: Array<{ kind?: string; text?: string }> }).children?.[0]?.text).toContain(
      'Patched limit: 9'
    );

    service.defineCardHandler('inventory@dynamic', 'lowStock', 'patchedNotify', PATCHED_LOW_STOCK_HANDLER);
    const patchedActions = service.eventCard(
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

  it('supports kanban.v1 dynamic cards', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    await service.loadStackBundle('inventory', 'inventory@kanban', INVENTORY_STACK);

    const bundle = service.defineCard('inventory@kanban', 'sprintBoard', KANBAN_CARD, 'kanban.v1');
    expect(bundle.cards).toContain('sprintBoard');

    const rawTree = service.renderCard('inventory@kanban', 'sprintBoard', {
      app_kanban: {
        columns: [{ id: 'todo', title: 'To Do', icon: '📋' }],
        tasks: [
          {
            id: 'task-1',
            col: 'todo',
            title: 'Ship pack registry',
            desc: 'Validate kanban.v1 render path',
            tags: ['feature'],
            priority: 'high',
          },
        ],
        editingTask: null,
        filterTag: null,
        filterPriority: null,
        searchQuery: '',
        collapsedCols: {},
      },
    });
    const tree = validateRuntimeTree('kanban.v1', rawTree);
    expect(tree.kind).toBe('kanban.board');

    const actions = service.eventCard(
      'inventory@kanban',
      'sprintBoard',
      'moveTask',
      { id: 'task-1', col: 'done' },
      {},
    );
    expect(actions).toEqual([
      {
        type: 'kanban/move-task',
        payload: { id: 'task-1', col: 'done' },
      },
    ]);
  });

  it('rejects unknown runtime packs during card definition', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    await service.loadStackBundle('inventory', 'inventory@bad-pack', INVENTORY_STACK);

    expect(() =>
      service.defineCard('inventory@bad-pack', 'broken', KANBAN_CARD, 'missing.v1')
    ).toThrow(/unknown runtime pack/i);
  });
});
