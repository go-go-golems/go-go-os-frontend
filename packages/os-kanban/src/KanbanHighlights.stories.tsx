import type { Meta, StoryObj } from '@storybook/react';
import { KanbanHighlights } from './KanbanHighlights';
import '@go-go-golems/os-kanban/theme';

const meta: Meta<typeof KanbanHighlights> = {
  title: 'RichWidgets/Kanban/Highlights',
  component: KanbanHighlights,
};

export default meta;
type Story = StoryObj<typeof KanbanHighlights>;

export const Default: Story = {
  args: {
    items: [
      { id: 'open', label: 'Open', value: 7, caption: 'Across all lanes', tone: 'accent' },
      { id: 'blocked', label: 'Blocked', value: 2, caption: 'Need owner attention', tone: 'warning', progress: 0.35 },
      { id: 'velocity', label: 'Velocity', value: '18 pts', caption: 'Last 5 days', tone: 'success', trend: [6, 7, 5, 8, 9, 10, 12] },
    ],
  },
};

export const DenseCommandCenter: Story = {
  args: {
    items: [
      { id: 'sev1', label: 'SEV-1', value: 1, caption: 'Customer-facing outage', tone: 'danger', trend: [1, 1, 2, 3, 2, 1] },
      { id: 'mitigation', label: 'Mitigation', value: '74%', caption: 'Rollback and queue drain', tone: 'warning', progress: 0.74 },
      { id: 'sla', label: 'SLA Risk', value: '12m', caption: 'Before the next breach', tone: 'danger' },
      { id: 'owners', label: 'Owners', value: 4, caption: 'Platform + Support synced', tone: 'neutral' },
    ],
  },
};
