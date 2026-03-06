import type { Meta, StoryObj } from '@storybook/react';
import { KanbanBoard } from './KanbanBoard';
import { INITIAL_COLUMNS, INITIAL_TASKS } from './sampleData';
import { fullscreenDecorator } from '../storybook/frameDecorators';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof KanbanBoard> = {
  title: 'RichWidgets/KanbanBoard',
  component: KanbanBoard,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof KanbanBoard>;

const denseTagTasks = INITIAL_TASKS.map((task, index) => ({
  ...task,
  tags: Array.from(
    new Set([
      ...task.tags,
      index % 2 === 0 ? 'urgent' : 'design',
      index % 3 === 0 ? 'docs' : 'feature',
    ]),
  ),
}));

export const Default: Story = {
  decorators: [fullscreenDecorator],
};

export const Empty: Story = {
  args: {
    initialTasks: [],
    initialColumns: INITIAL_COLUMNS,
  },
  decorators: [fullscreenDecorator],
};

export const FewColumns: Story = {
  args: {
    initialColumns: [
      { id: 'todo', title: 'To Do', icon: '📋' },
      { id: 'progress', title: 'In Progress', icon: '⚡' },
      { id: 'done', title: 'Done', icon: '✅' },
    ],
    initialTasks: INITIAL_TASKS.map((t) => ({
      ...t,
      col: t.col === 'backlog' || t.col === 'review' ? 'todo' : t.col,
    })),
  },
  decorators: [fullscreenDecorator],
};

export const ManyTasks: Story = {
  args: {
    initialTasks: [
      ...INITIAL_TASKS,
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `gen-${i}`,
        col: INITIAL_COLUMNS[i % INITIAL_COLUMNS.length].id,
        title: `Generated task ${i + 1}`,
        tags: [(['bug', 'feature', 'docs'] as const)[i % 3]],
        priority: (['high', 'medium', 'low'] as const)[i % 3],
        desc: i % 2 === 0 ? `Description for task ${i + 1}` : '',
      })),
    ],
  },
  decorators: [fullscreenDecorator],
};

export const DenseTags: Story = {
  args: {
    initialTasks: denseTagTasks,
  },
  decorators: [fullscreenDecorator],
};

export const SingleLane: Story = {
  args: {
    initialColumns: [{ id: 'todo', title: 'Inbox', icon: '📥' }],
    initialTasks: INITIAL_TASKS.map((task) => ({
      ...task,
      col: 'todo',
    })),
  },
  decorators: [fullscreenDecorator],
};
