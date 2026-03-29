import type { Meta, StoryObj } from '@storybook/react';
import { KanbanBoardView } from './KanbanBoardView';
import { createKanbanStateSeed } from './kanbanState';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { INITIAL_COLUMNS, INITIAL_TASKS } from './sampleData';
import '@go-go-golems/os-kanban/theme';

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

export const WithHighlights: Story = {
  args: {
    ...createArgs(),
    title: 'Incident Command',
    subtitle: 'Three-lane ops board with telemetry cards',
    primaryActionLabel: '+ Escalate',
    highlights: [
      { id: 'sev1', label: 'SEV-1', value: 1, caption: 'Customer-facing outage', tone: 'danger', trend: [0, 1, 1, 2, 1] },
      { id: 'mitigation', label: 'Mitigation', value: '74%', caption: 'Rollback in progress', tone: 'warning', progress: 0.74 },
      { id: 'latency', label: 'Latency', value: '182ms', caption: 'API p95', tone: 'accent', trend: [140, 150, 180, 210, 182] },
    ],
  },
  decorators: [fullscreenDecorator],
};
