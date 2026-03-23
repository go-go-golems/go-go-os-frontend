import type { Meta, StoryObj } from '@storybook/react';
import { KanbanStatusBar } from './KanbanStatusBar';
import '@hypercard/kanban-runtime/theme';

const meta: Meta<typeof KanbanStatusBar> = {
  title: 'RichWidgets/Kanban/StatusBar',
  component: KanbanStatusBar,
};

export default meta;
type Story = StoryObj<typeof KanbanStatusBar>;

export const Default: Story = {
  args: {
    metrics: [
      { label: 'total', value: 18 },
      { label: 'high', value: 4 },
      { label: 'done', value: 7 },
    ],
  },
};

export const Filtered: Story = {
  args: {
    metrics: [
      { label: 'total', value: 12 },
      { label: 'high', value: 3 },
      { label: 'done', value: 2 },
      { label: 'state', value: 'filtered' },
    ],
  },
};
