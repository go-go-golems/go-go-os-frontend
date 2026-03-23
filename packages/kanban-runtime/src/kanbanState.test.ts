import { describe, expect, it } from 'vitest';
import {
  createKanbanStateSeed,
  kanbanActions,
  kanbanReducer,
} from './kanbanState';

describe('kanbanState', () => {
  it('creates a normalized seed', () => {
    const state = createKanbanStateSeed({
      initialTasks: [
        {
          id: 'task-1',
          col: 'todo',
          title: 'Test task',
          desc: '',
          type: 'task',
          priority: 'medium',
          labels: ['docs'],
        },
      ],
      editingTask: { col: 'todo', title: 'Draft' },
      filterType: 'task',
      searchQuery: 'draft',
      collapsedCols: { done: true },
    });

    expect(state).toMatchObject({
      initialized: true,
      filterType: 'task',
      searchQuery: 'draft',
      collapsedCols: { done: true },
      editingTask: { col: 'todo', title: 'Draft' },
    });
    expect(state.tasks[0]?.labels).toEqual(['docs']);
  });

  it('upserts tasks and clears filters', () => {
    const seeded = createKanbanStateSeed({
      filterPriority: 'high',
      filterType: 'bug',
      searchQuery: 'fix',
    });

    const updated = kanbanReducer(
      seeded,
      kanbanActions.upsertTask({
        id: 'task-x',
        col: 'progress',
        title: 'Investigate queue spike',
        desc: 'Look at worker pool saturation',
        type: 'bug',
        priority: 'high',
        labels: ['urgent'],
      }),
    );

    const cleared = kanbanReducer(updated, kanbanActions.clearFilters());

    expect(updated.tasks.find((task) => task.id === 'task-x')).toMatchObject({
      col: 'progress',
      priority: 'high',
    });
    expect(cleared).toMatchObject({
      filterType: null,
      filterPriority: null,
      searchQuery: '',
    });
  });
});
