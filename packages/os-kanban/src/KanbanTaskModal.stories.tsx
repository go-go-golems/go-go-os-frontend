import type { Meta, StoryObj } from '@storybook/react';
import { KanbanTaskModal } from './KanbanTaskModal';
import { fixedFrameDecorator } from '../storybook/frameDecorators';
import { INITIAL_COLUMNS, INITIAL_TASKS } from './sampleData';
import { DEFAULT_KANBAN_TAXONOMY } from './types';
import '@go-go-golems/os-kanban/theme';

const meta: Meta<typeof KanbanTaskModal> = {
  title: 'RichWidgets/Kanban/TaskModal',
  component: KanbanTaskModal,
  decorators: [fixedFrameDecorator(920, 620)],
};

export default meta;
type Story = StoryObj<typeof KanbanTaskModal>;

export const NewTask: Story = {
  args: {
    task: { col: 'todo' },
    columns: INITIAL_COLUMNS,
    taxonomy: DEFAULT_KANBAN_TAXONOMY,
    onSave: () => {},
    onDelete: () => {},
    onClose: () => {},
  },
};

export const EditExistingTask: Story = {
  args: {
    task: INITIAL_TASKS[1],
    columns: INITIAL_COLUMNS,
    taxonomy: DEFAULT_KANBAN_TAXONOMY,
    onSave: () => {},
    onDelete: () => {},
    onClose: () => {},
  },
};
