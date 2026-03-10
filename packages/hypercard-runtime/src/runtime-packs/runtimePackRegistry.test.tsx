import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { KANBAN_V1_PACK_ID, DEFAULT_RUNTIME_PACK_ID, listRuntimePacks, renderRuntimeTree, validateRuntimeTree } from './runtimePackRegistry';

describe('runtimePackRegistry', () => {
  it('registers the baseline and kanban packs', () => {
    expect(listRuntimePacks()).toEqual(expect.arrayContaining([DEFAULT_RUNTIME_PACK_ID, KANBAN_V1_PACK_ID]));
  });

  it('validates and renders kanban.v1 trees', () => {
    const tree = validateRuntimeTree(KANBAN_V1_PACK_ID, {
      kind: 'kanban.board',
      props: {
        columns: [{ id: 'todo', title: 'To Do', icon: '📋' }],
        tasks: [
          {
            id: 'task-1',
            col: 'todo',
            title: 'Write tests',
            desc: 'Add runtime pack tests',
            tags: ['docs'],
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

    expect(tree.kind).toBe('kanban.board');

    const markup = renderToStaticMarkup(
      <>{renderRuntimeTree(KANBAN_V1_PACK_ID, tree, () => {})}</>,
    );
    expect(markup).toContain('Write tests');
    expect(markup).toContain('To Do');
  });

  it('rejects unknown runtime packs', () => {
    expect(() => validateRuntimeTree('missing.v1', { kind: 'panel', children: [] })).toThrow(/unknown runtime pack/i);
  });
});
