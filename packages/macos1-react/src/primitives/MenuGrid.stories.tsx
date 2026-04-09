import type { Meta, StoryObj } from '@storybook/react';
import { MenuGrid } from './MenuGrid';

const meta = {
  title: 'Engine/Widgets/MenuGrid',
  component: MenuGrid,
  args: {
    icon: '📇',
    labels: [{ value: 'Welcome to Shop Inventory' }, { value: 'HyperCard + AI', style: 'muted' }],
    buttons: [
      { label: '📋 Browse Items', action: 'browse', variant: 'default' },
      { label: '⚠️ Low Stock', action: 'lowStock', variant: 'default' },
      { label: '💰 Sales Today', action: 'sales', variant: 'default' },
      { label: '📊 Report', action: 'report', variant: 'default' },
    ],
    onAction: (action: unknown) => alert(JSON.stringify(action)),
  },
} satisfies Meta<typeof MenuGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
