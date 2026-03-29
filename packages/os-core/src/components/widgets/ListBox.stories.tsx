import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ListBox } from './ListBox';

const ITEMS = ['System Folder', 'MacPaint', 'MacWrite', 'Finder', 'Scrapbook', 'Note Pad', 'Calculator'];

const meta = {
  title: 'Engine/Widgets/ListBox',
  component: ListBox,
  tags: ['autodocs'],
} satisfies Meta<typeof ListBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { items: ITEMS, selected: 2, onSelect: () => {} },
};

export const WithSelection: Story = {
  args: { items: ITEMS, selected: 0, onSelect: () => {} },
  render: () => {
    const [sel, setSel] = useState(0);
    return <ListBox items={ITEMS} selected={sel} onSelect={setSel} />;
  },
};

export const Empty: Story = {
  args: { items: [], selected: -1, onSelect: () => {} },
};

export const Tall: Story = {
  args: {
    items: [...ITEMS, 'Alarm Clock', 'Key Caps', 'Control Panel', 'Puzzle', 'Chooser'],
    selected: 3,
    onSelect: () => {},
    height: 140,
  },
};
