import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { ToolDef } from './ToolPalette';
import { ToolPalette } from './ToolPalette';

const TOOLS: ToolDef[] = [
  { icon: '✏️', label: 'Pencil' },
  { icon: '🖌️', label: 'Brush' },
  { icon: '🪣', label: 'Fill' },
  { icon: '🔲', label: 'Select' },
  { icon: '✂️', label: 'Lasso' },
  { icon: '📏', label: 'Line' },
  { icon: '⬜', label: 'Rect' },
  { icon: '⭕', label: 'Oval' },
  { icon: '🔤', label: 'Text' },
  { icon: '🧽', label: 'Eraser' },
  { icon: '💨', label: 'Spray' },
  { icon: '🔍', label: 'Zoom' },
];

const meta = {
  title: 'Engine/Widgets/ToolPalette',
  component: ToolPalette,
  tags: ['autodocs'],
} satisfies Meta<typeof ToolPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { tools: TOOLS, selected: 0, onSelect: () => {} },
};

export const ThreeColumns: Story = {
  args: { tools: TOOLS, selected: 2, onSelect: () => {}, columns: 3 },
};

export const Interactive: Story = {
  args: { tools: TOOLS, selected: 0, onSelect: () => {} },
  render: () => {
    const [sel, setSel] = useState(0);
    return <ToolPalette tools={TOOLS} selected={sel} onSelect={setSel} />;
  },
};
