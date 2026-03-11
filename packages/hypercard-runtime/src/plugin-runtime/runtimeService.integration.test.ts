import { afterEach, describe, expect, it } from 'vitest';
import COLUMN_STACK from './fixtures/column-stack.vm.js?raw';
import DYNAMIC_CARD from './fixtures/dynamic-card.vm.js?raw';
import INVENTORY_STACK from './fixtures/inventory-stack.vm.js?raw';
import KANBAN_CARD from './fixtures/kanban-card.vm.js?raw';
import LOOP_STACK from './fixtures/loop-stack.vm.js?raw';
import PATCHED_LOW_STOCK_HANDLER from './fixtures/patched-low-stock-handler.vm.js?raw';
import PATCHED_LOW_STOCK_RENDER from './fixtures/patched-low-stock-render.vm.js?raw';
import { QuickJSRuntimeService } from './runtimeService';
import { validateRuntimeSurfaceTree } from '../runtime-packs';

const BUILTIN_KANBAN_STACK = `
defineRuntimeBundle(({ ui }) => ({
  id: 'builtin-kanban',
  title: 'Built-in Kanban',
  surfaces: {
    home: {
      render() {
        return ui.text('home');
      },
    },
  },
}));

defineRuntimeSurface('board', ({ widgets }) => ({
  render() {
    return widgets.kanban.page(
      widgets.kanban.taxonomy({
        issueTypes: [{ id: 'task', label: 'Task', icon: '🧩' }],
        priorities: [{ id: 'medium', label: 'Medium', icon: '●' }],
        labels: [{ id: 'docs', label: 'Docs', icon: '📚' }],
      }),
      widgets.kanban.header({
        title: 'Built-in Kanban',
        searchQuery: '',
      }),
      widgets.kanban.board({
        columns: [{ id: 'todo', title: 'To Do', icon: '📋' }],
        tasks: [],
        editingTask: null,
        collapsedCols: {},
      }),
      widgets.kanban.status({
        metrics: [{ label: 'total', value: 0 }],
      }),
    );
  },
}), 'kanban.v1');
`;

describe('QuickJSRuntimeService', () => {
  const services: QuickJSRuntimeService[] = [];

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

    const bundle = await service.loadRuntimeBundle('inventory', 'inventory@one', INVENTORY_STACK);
    expect(bundle.surfaces).toEqual(['lowStock']);

    const tree = service.renderRuntimeSurface('inventory@one', 'lowStock', {
      filters: { filter: 'all' },
      draft: { limit: 3 },
    });
    expect(tree.kind).toBe('panel');
  });

  it('returns generic runtime actions from handlers', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    await service.loadRuntimeBundle('inventory', 'inventory@one', INVENTORY_STACK);

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

    await service.loadRuntimeBundle('inventory', 'inventory@one', INVENTORY_STACK);
    expect(service.disposeSession('inventory@one')).toBe(true);
    expect(service.disposeSession('inventory@one')).toBe(false);
    expect(() => service.renderRuntimeSurface('inventory@one', 'lowStock', {})).toThrow(/not found/i);
  });

  it('supports multiple sessions from one stack bundle', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    await service.loadRuntimeBundle('inventory', 'inventory@one', INVENTORY_STACK);
    await service.loadRuntimeBundle('inventory', 'inventory@two', INVENTORY_STACK);

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

    await service.loadRuntimeBundle('column-demo', 'column-demo@one', COLUMN_STACK);
    const tree = service.renderRuntimeSurface('column-demo@one', 'main', {});

    expect(tree.kind).toBe('column');
  });

  it('interrupts infinite render loops with timeout', async () => {
    const service = new QuickJSRuntimeService({ renderTimeoutMs: 10 });
    services.push(service);

    await service.loadRuntimeBundle('loop', 'loop@one', LOOP_STACK);

    expect(() => service.renderRuntimeSurface('loop@one', 'loop', {})).toThrow(/interrupted/i);
  });

  it('supports defining cards and patching render/handlers at runtime', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    await service.loadRuntimeBundle('inventory', 'inventory@dynamic', INVENTORY_STACK);

    const withDynamicCard = service.defineRuntimeSurface('inventory@dynamic', 'onDemand', DYNAMIC_CARD);
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

  it('supports kanban.v1 dynamic cards', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    await service.loadRuntimeBundle('inventory', 'inventory@kanban', INVENTORY_STACK);

    const bundle = service.defineRuntimeSurface('inventory@kanban', 'sprintBoard', KANBAN_CARD, 'kanban.v1');
    expect(bundle.surfaces).toContain('sprintBoard');

    const rawTree = service.renderRuntimeSurface('inventory@kanban', 'sprintBoard', {
      app_kanban: {
        taxonomy: {
          issueTypes: [{ id: 'feature', label: 'Feature', icon: '✨' }],
          priorities: [{ id: 'high', label: 'High', icon: '▲' }],
          labels: [{ id: 'frontend', label: 'Frontend', icon: '🖼️' }],
        },
        columns: [{ id: 'todo', title: 'To Do', icon: '📋' }],
        tasks: [
          {
            id: 'task-1',
            col: 'todo',
            title: 'Ship pack registry',
            desc: 'Validate kanban.v1 render path',
            type: 'feature',
            labels: ['frontend'],
            priority: 'high',
          },
        ],
        editingTask: null,
        filterType: null,
        filterPriority: null,
        searchQuery: '',
        collapsedCols: {},
      },
    });
    const tree = validateRuntimeSurfaceTree('kanban.v1', rawTree);
    expect(tree.kind).toBe('kanban.page');

    const actions = service.eventRuntimeSurface(
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

  it('reports surface type metadata for built-in runtime bundle surfaces defined with defineRuntimeSurface', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    const bundle = await service.loadRuntimeBundle('builtin-kanban', 'builtin-kanban@one', BUILTIN_KANBAN_STACK);
    expect(bundle.surfaces).toEqual(expect.arrayContaining(['home', 'board']));
    expect(bundle.surfaceTypes).toMatchObject({
      home: 'ui.card.v1',
      board: 'kanban.v1',
    });

    const rawTree = service.renderRuntimeSurface('builtin-kanban@one', 'board', {});
    const tree = validateRuntimeSurfaceTree('kanban.v1', rawTree);
    expect(tree.kind).toBe('kanban.page');
  });

  it('rejects unknown runtime surface types during surface definition', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    await service.loadRuntimeBundle('inventory', 'inventory@bad-pack', INVENTORY_STACK);

    expect(() =>
      service.defineRuntimeSurface('inventory@bad-pack', 'broken', KANBAN_CARD, 'missing.v1')
    ).toThrow(/unknown runtime surface type/i);
  });
});
