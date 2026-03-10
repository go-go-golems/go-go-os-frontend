import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { KanbanBoard } from './KanbanBoard';
import { INITIAL_COLUMNS, INITIAL_TASKS } from './sampleData';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import {
  createKanbanStateSeed,
  KANBAN_STATE_KEY,
  kanbanActions,
  kanbanReducer,
} from './kanbanState';
import { KANBAN_EXAMPLE_BOARDS } from './exampleBoards';
import { DEFAULT_KANBAN_TAXONOMY } from './types';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof KanbanBoard> = {
  title: 'RichWidgets/Kanban/Board',
  component: KanbanBoard,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof KanbanBoard>;

function createKanbanStoryStore() {
  return configureStore({
    reducer: {
      [KANBAN_STATE_KEY]: kanbanReducer,
    },
  });
}

type KanbanStoryStore = ReturnType<typeof createKanbanStoryStore>;
type KanbanSeedStore = SeedStore<KanbanStoryStore>;

function renderWithStore(
  seedStore: KanbanSeedStore,
  options: {
    height?: string | number;
  } = {},
) {
  return () => (
    <SeededStoreProvider
      createStore={createKanbanStoryStore}
      seedStore={seedStore}
    >
      <div style={{ height: options.height ?? '100vh' }}>
        <KanbanBoard />
      </div>
    </SeededStoreProvider>
  );
}

function renderSeededStory(
  seed: Parameters<typeof createKanbanStateSeed>[0],
  options: {
    height?: string | number;
  } = {},
) {
  return renderWithStore((store) => {
    store.dispatch(kanbanActions.replaceState(createKanbanStateSeed(seed)));
  }, options);
}

const denseTagTasks = INITIAL_TASKS.map((task, index) => ({
  ...task,
  labels: Array.from(
    new Set([
      ...task.labels,
      index % 2 === 0 ? 'urgent' : 'design',
      index % 3 === 0 ? 'docs' : 'frontend',
    ]),
  ),
}));

export const Default: Story = {
  render: renderSeededStory({}),
  decorators: [fullscreenDecorator],
};

export const Empty: Story = {
  render: renderSeededStory({
    initialTasks: [],
    initialColumns: INITIAL_COLUMNS,
  }),
  decorators: [fullscreenDecorator],
};

export const FewColumns: Story = {
  render: renderSeededStory({
    initialColumns: [
      { id: 'todo', title: 'To Do', icon: '📋' },
      { id: 'progress', title: 'In Progress', icon: '⚡' },
      { id: 'done', title: 'Done', icon: '✅' },
    ],
    initialTasks: INITIAL_TASKS.map((t) => ({
      ...t,
      col: t.col === 'backlog' || t.col === 'review' ? 'todo' : t.col,
    })),
  }),
  decorators: [fullscreenDecorator],
};

export const ManyTasks: Story = {
  render: renderSeededStory({
    initialTasks: [
      ...INITIAL_TASKS,
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `gen-${i}`,
        col: INITIAL_COLUMNS[i % INITIAL_COLUMNS.length].id,
        title: `Generated task ${i + 1}`,
        type: (['bug', 'feature', 'task'] as const)[i % 3],
        labels: [(['backend', 'frontend', 'docs'] as const)[i % 3]],
        priority: (['high', 'medium', 'low'] as const)[i % 3],
        desc: i % 2 === 0 ? `Description for task ${i + 1}` : '',
      })),
    ],
  }),
  decorators: [fullscreenDecorator],
};

export const DenseTags: Story = {
  render: renderSeededStory({
    initialTasks: denseTagTasks,
  }),
  decorators: [fullscreenDecorator],
};

export const SingleLane: Story = {
  render: renderSeededStory({
    initialColumns: [{ id: 'todo', title: 'Inbox', icon: '📥' }],
    initialTasks: INITIAL_TASKS.map((task) => ({
      ...task,
      col: 'todo',
    })),
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxEditingExistingTask: Story = {
  render: renderSeededStory({
    editingTask: INITIAL_TASKS[2],
  }, { height: 620 }),
  decorators: [fixedFrameDecorator(980, 620)],
};

export const ReduxFilteredUrgent: Story = {
  render: renderSeededStory({
    filterType: 'bug',
    searchQuery: 'fix',
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxCollapsedWorkflow: Story = {
  render: renderSeededStory({
    collapsedCols: {
      backlog: true,
      review: true,
    },
    filterPriority: 'high',
  }),
  decorators: [fullscreenDecorator],
};

export const SprintBoard: Story = {
  render: renderSeededStory(KANBAN_EXAMPLE_BOARDS[0].props),
  decorators: [fullscreenDecorator],
};

export const BugTriageBoard: Story = {
  render: renderSeededStory(KANBAN_EXAMPLE_BOARDS[1].props),
  decorators: [fullscreenDecorator],
};

export const PersonalPlannerBoard: Story = {
  render: renderSeededStory(KANBAN_EXAMPLE_BOARDS[2].props),
  decorators: [fullscreenDecorator],
};

export const CustomTaxonomyBoard: Story = {
  render: renderSeededStory({
    initialTaxonomy: {
      issueTypes: [
        { id: 'crash', label: 'Crash', icon: '💥' },
        { id: 'regression', label: 'Regression', icon: '↩️' },
        { id: 'ux', label: 'UX', icon: '🎯' },
      ],
      priorities: DEFAULT_KANBAN_TAXONOMY.priorities,
      labels: [
        { id: 'ios', label: 'iOS', icon: '📱' },
        { id: 'android', label: 'Android', icon: '🤖' },
        { id: 'perf', label: 'Perf', icon: '⚡' },
      ],
    },
    initialColumns: [
      { id: 'reported', title: 'Reported', icon: '📥' },
      { id: 'triage', title: 'Triage', icon: '🔎' },
      { id: 'fixing', title: 'Fixing', icon: '🛠️' },
    ],
    initialTasks: [
      { id: 'c-1', col: 'reported', title: 'Player crashes on startup', type: 'crash', labels: ['ios'], priority: 'high', desc: 'Only on iPhone 14' },
      { id: 'c-2', col: 'triage', title: 'Progress spinner regressed', type: 'regression', labels: ['android', 'perf'], priority: 'medium', desc: 'More visible on low-end devices' },
      { id: 'c-3', col: 'fixing', title: 'Settings affordance unclear', type: 'ux', labels: ['ios'], priority: 'low', desc: '' },
    ],
    initialFilterType: 'crash',
  }),
  decorators: [fullscreenDecorator],
};
