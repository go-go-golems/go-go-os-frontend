import type { Meta, StoryObj } from '@storybook/react';
import { ReportView } from './ReportView';

const meta = {
  title: 'Engine/Widgets/ReportView',
  component: ReportView,
  args: {
    sections: [
      { label: 'Total Items', value: '10' },
      { label: 'Total Units', value: '59' },
      { label: 'Retail Value', value: '$1,234.56' },
      { label: 'Out of Stock', value: '2' },
    ],
  },
} satisfies Meta<typeof ReportView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
