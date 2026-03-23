import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  QuickJSRuntimeService,
  clearRuntimePackages,
  clearRuntimeSurfaceTypes,
  listRuntimePackages,
  listRuntimeSurfaceTypes,
  registerRuntimePackage,
  registerRuntimeSurfaceType,
  renderRuntimeSurfaceTree,
  validateRuntimeSurfaceTree,
} from '@hypercard/hypercard-runtime';
import { UI_CARD_V1_RUNTIME_SURFACE_TYPE, UI_RUNTIME_PACKAGE } from '../../ui-runtime/src';
import { KANBAN_RUNTIME_PACKAGE, KANBAN_V1_RUNTIME_SURFACE_TYPE } from './runtimeRegistration';

const KANBAN_RUNTIME_BUNDLE = `
defineRuntimeBundle(({ ui }) => ({
  id: 'kanban-demo',
  title: 'Kanban Demo',
  packageIds: ['ui', 'kanban'],
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
        title: 'Kanban Demo',
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

describe('kanban runtime definitions', () => {
  beforeEach(() => {
    clearRuntimePackages();
    clearRuntimeSurfaceTypes();
    registerRuntimePackage(UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(UI_CARD_V1_RUNTIME_SURFACE_TYPE);
  });

  it('registers the external kanban runtime package and surface type', () => {
    registerRuntimePackage(KANBAN_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(KANBAN_V1_RUNTIME_SURFACE_TYPE);

    expect(listRuntimePackages()).toEqual(expect.arrayContaining(['ui', 'kanban']));
    expect(listRuntimeSurfaceTypes()).toEqual(expect.arrayContaining(['ui.card.v1', 'kanban.v1']));
  });

  it('validates and renders kanban.v1 trees after explicit registration', () => {
    registerRuntimePackage(KANBAN_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(KANBAN_V1_RUNTIME_SURFACE_TYPE);

    const tree = validateRuntimeSurfaceTree('kanban.v1', {
      kind: 'kanban.page',
      children: [
        {
          kind: 'kanban.taxonomy',
          props: {
            issueTypes: [{ id: 'task', label: 'Task', icon: '🧩' }],
            priorities: [{ id: 'high', label: 'High', icon: '▲' }],
            labels: [{ id: 'docs', label: 'Docs', icon: '📚' }],
          },
        },
        {
          kind: 'kanban.header',
          props: {
            title: 'Docs Board',
            searchQuery: '',
          },
        },
        {
          kind: 'kanban.board',
          props: {
            columns: [{ id: 'todo', title: 'To Do', icon: '📋' }],
            tasks: [],
            editingTask: null,
            collapsedCols: {},
          },
        },
        {
          kind: 'kanban.status',
          props: {
            metrics: [{ label: 'total', value: 1 }],
          },
        },
      ],
    }) as { kind: string };

    expect(tree.kind).toBe('kanban.page');
    const markup = renderToStaticMarkup(<>{renderRuntimeSurfaceTree('kanban.v1', tree, () => {})}</>);
    expect(markup).toContain('Docs Board');
  });

  it('loads a kanban runtime bundle only after explicit host registration', async () => {
    const service = new QuickJSRuntimeService();

    await expect(
      service.loadRuntimeBundle('kanban-demo', 'kanban-demo@missing', ['ui', 'kanban'], KANBAN_RUNTIME_BUNDLE)
    ).rejects.toThrow(/unknown runtime package/i);

    registerRuntimePackage(UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(UI_CARD_V1_RUNTIME_SURFACE_TYPE);
    registerRuntimePackage(KANBAN_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(KANBAN_V1_RUNTIME_SURFACE_TYPE);

    const bundle = await service.loadRuntimeBundle('kanban-demo', 'kanban-demo@one', ['ui', 'kanban'], KANBAN_RUNTIME_BUNDLE);
    expect(bundle.surfaces).toEqual(expect.arrayContaining(['home', 'board']));

    const rawTree = service.renderRuntimeSurface('kanban-demo@one', 'board', {});
    const tree = validateRuntimeSurfaceTree('kanban.v1', rawTree) as { kind: string };
    expect(tree.kind).toBe('kanban.page');

    service.disposeSession('kanban-demo@one');
  });
});
