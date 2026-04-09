import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DropdownMenu } from './DropdownMenu';

const FONTS = ['Geneva', 'Chicago', 'Monaco', 'New York', 'Athens', 'Cairo'];

const meta = {
  title: 'Engine/Widgets/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: { options: FONTS, selected: 1, onSelect: () => {} },
};

export const Interactive: Story = {
  args: { options: FONTS, selected: 1, onSelect: () => {} },
  render: () => {
    const [sel, setSel] = useState(1);
    return <DropdownMenu options={FONTS} selected={sel} onSelect={setSel} />;
  },
};

export const ManyOptions: Story = {
  args: {
    options: [...FONTS, 'Helvetica', 'Times', 'Courier', 'Palatino', 'Symbol'],
    selected: 0,
    onSelect: () => {},
    width: 180,
  },
};
