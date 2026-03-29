import type { Meta, StoryObj } from '@storybook/react';
import { KanbanTaskCard } from './KanbanTaskCard';
import { DEFAULT_KANBAN_TAXONOMY } from './types';
import '@go-go-golems/os-kanban/theme';

const meta: Meta<typeof KanbanTaskCard> = {
  title: 'RichWidgets/Kanban/TaskCard',
  component: KanbanTaskCard,
  decorators: [
    (Story) => (
      <div style={{ width: 260, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof KanbanTaskCard>;

export const Default: Story = {
  args: {
    task: {
      id: 'task-1',
      col: 'todo',
      title: 'Refactor board view',
      desc: 'Split KanbanBoard into reusable host-rendered pieces.',
      type: 'feature',
      labels: ['design', 'frontend'],
      priority: 'medium',
    },
    taxonomy: DEFAULT_KANBAN_TAXONOMY,
    onEdit: () => {},
  },
};

export const HighPriority: Story = {
  args: {
    task: {
      id: 'task-2',
      col: 'review',
      title: 'Validate runtime pack',
      desc: 'Confirm kanban.v1 path renders and emits semantic actions.',
      type: 'bug',
      labels: ['urgent', 'docs'],
      priority: 'high',
    },
    taxonomy: DEFAULT_KANBAN_TAXONOMY,
    onEdit: () => {},
  },
};
