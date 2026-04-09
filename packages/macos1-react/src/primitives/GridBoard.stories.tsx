import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { GridBoard, type GridCell } from './GridBoard';

const DEFAULT_CELLS: GridCell[] = [
  { value: 'A1', color: '#f9f4d2' },
  { value: 'A2', color: '#d2f9e7' },
  { value: 'A3', color: '#d2e5f9' },
  { value: 'B1', color: '#f9d2dc' },
  { value: 'B2', color: '#f4d2f9', disabled: true },
  { value: 'B3', color: '#f9ecd2' },
  { value: 'C1', color: '#e4f9d2' },
  { value: 'C2', color: '#d2f0f9' },
  { value: 'C3', color: '#f9d2f0' },
];

const meta = {
  title: 'Engine/Widgets/GridBoard',
  component: GridBoard,
  tags: ['autodocs'],
  args: {
    rows: 3,
    cols: 3,
    cellSize: 'medium',
    cells: DEFAULT_CELLS,
  },
} satisfies Meta<typeof GridBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {};

export const Small: Story = {
  args: {
    cellSize: 'small',
  },
};

export const Large: Story = {
  args: {
    cellSize: 'large',
  },
};

export const InteractiveSelection: Story = {
  render: () => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(4);
    const [lastSelection, setLastSelection] = useState<string>('row=1 col=1');

    return (
      <div style={{ display: 'grid', gap: 8, width: 280 }}>
        <GridBoard
          rows={3}
          cols={3}
          cells={DEFAULT_CELLS}
          selectedIndex={selectedIndex}
          onSelect={(selection) => {
            setSelectedIndex(selection.cellIndex);
            setLastSelection(`row=${selection.row} col=${selection.col} idx=${selection.cellIndex}`);
          }}
        />
        <div data-part="field-value">Last: {lastSelection}</div>
      </div>
    );
  },
};
