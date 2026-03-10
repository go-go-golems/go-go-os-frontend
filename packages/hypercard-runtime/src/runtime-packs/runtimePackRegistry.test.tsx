import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { KANBAN_V1_PACK_ID, DEFAULT_RUNTIME_PACK_ID, listRuntimePacks, renderRuntimeTree, validateRuntimeTree } from './runtimePackRegistry';

describe('runtimePackRegistry', () => {
  it('registers the baseline and kanban packs', () => {
    expect(listRuntimePacks()).toEqual(expect.arrayContaining([DEFAULT_RUNTIME_PACK_ID, KANBAN_V1_PACK_ID]));
  });

  it('validates and renders kanban.v1 trees', () => {
    const tree = validateRuntimeTree(KANBAN_V1_PACK_ID, {
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
          kind: 'kanban.highlights',
          props: {
            items: [{ id: 'total', label: 'Total', value: 1, tone: 'accent' }],
          },
        },
        {
          kind: 'kanban.filters',
          props: {
            filterType: null,
            filterPriority: null,
          },
        },
        {
          kind: 'kanban.board',
          props: {
            columns: [{ id: 'todo', title: 'To Do', icon: '📋' }],
            tasks: [
              {
                id: 'task-1',
                col: 'todo',
                title: 'Write tests',
                desc: 'Add runtime pack tests',
                type: 'task',
                labels: ['docs'],
                priority: 'high',
              },
            ],
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
    });

    expect(tree.kind).toBe('kanban.page');

    const markup = renderToStaticMarkup(
      <>{renderRuntimeTree(KANBAN_V1_PACK_ID, tree, () => {})}</>,
    );
    expect(markup).toContain('Write tests');
    expect(markup).toContain('To Do');
    expect(markup).toContain('Docs Board');
  });

  it('rejects unknown runtime packs', () => {
    expect(() => validateRuntimeTree('missing.v1', { kind: 'panel', children: [] })).toThrow(/unknown runtime pack/i);
  });
});
