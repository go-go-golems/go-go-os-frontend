import type { Meta, StoryObj } from '@storybook/react';
import { KanbanBoardView } from './KanbanBoardView';
import { createKanbanStateSeed } from './kanbanState';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { INITIAL_COLUMNS, INITIAL_TASKS } from './sampleData';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof KanbanBoardView> = {
  title: 'RichWidgets/Kanban/BoardView',
  component: KanbanBoardView,
};

export default meta;
type Story = StoryObj<typeof KanbanBoardView>;

function noop() {}

function createArgs(seed: Parameters<typeof createKanbanStateSeed>[0] = {}) {
  return {
    state: createKanbanStateSeed(seed),
    onOpenTaskEditor: noop,
    onCloseTaskEditor: noop,
    onSaveTask: noop,
    onDeleteTask: noop,
    onMoveTask: noop,
    onSearchChange: noop,
    onSetFilterType: noop,
    onSetFilterPriority: noop,
    onClearFilters: noop,
    onToggleCollapsed: noop,
  };
}

export const Default: Story = {
  args: createArgs(),
  decorators: [fullscreenDecorator],
};

export const Filtered: Story = {
  args: createArgs({
    filterType: 'bug',
    searchQuery: 'fix',
  }),
  decorators: [fullscreenDecorator],
};

export const CollapsedWorkflow: Story = {
  args: createArgs({
    collapsedCols: { backlog: true, review: true },
    filterPriority: 'high',
  }),
  decorators: [fullscreenDecorator],
};

export const EditingModalOpen: Story = {
  args: createArgs({
    editingTask: INITIAL_TASKS[2],
  }),
  decorators: [fixedFrameDecorator(980, 620)],
};

export const SingleLane: Story = {
  args: createArgs({
    initialColumns: [{ id: 'todo', title: 'Inbox', icon: '📥' }],
    initialTasks: INITIAL_TASKS.map((task) => ({ ...task, col: 'todo' })),
  }),
  decorators: [fullscreenDecorator],
};
