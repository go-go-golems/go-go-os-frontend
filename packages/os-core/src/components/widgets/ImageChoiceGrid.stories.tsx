import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ImageChoiceGrid, type ImageChoiceItem } from './ImageChoiceGrid';

function svgData(label: string, fill: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'>
  <rect width='320' height='180' fill='${fill}' />
  <text x='16' y='96' font-size='22' font-family='sans-serif' fill='white'>${label}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const IMAGE_ITEMS: ImageChoiceItem[] = [
  { id: 'img-a', src: svgData('Warehouse A', '#6f8db0'), label: 'Warehouse A', badge: 'primary' },
  { id: 'img-b', src: svgData('Warehouse B', '#8b6fae'), label: 'Warehouse B', badge: 'backup' },
  { id: 'img-c', src: svgData('Warehouse C', '#6faa7e'), label: 'Warehouse C' },
  { id: 'img-d', src: svgData('Warehouse D', '#b07c63'), label: 'Warehouse D', disabled: true },
  { id: 'img-e', src: svgData('Warehouse E', '#4f7a7d'), label: 'Warehouse E' },
  { id: 'img-f', src: svgData('Warehouse F', '#9a6a8f'), label: 'Warehouse F', badge: 'new' },
];

const meta = {
  title: 'Engine/Widgets/ImageChoiceGrid',
  component: ImageChoiceGrid,
  tags: ['autodocs'],
  args: {
    items: IMAGE_ITEMS,
    selectedIds: ['img-a'],
    onSelectionChange: () => {},
  },
} satisfies Meta<typeof ImageChoiceGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelectMode: Story = {
  args: {
    mode: 'select',
  },
};

export const ConfirmMode: Story = {
  args: {
    mode: 'confirm',
    selectedIds: ['img-c'],
  },
};

export const MultiMode: Story = {
  args: {
    mode: 'multi',
    selectedIds: ['img-a', 'img-f'],
  },
};

export const FourColumns: Story = {
  args: {
    mode: 'multi',
    columns: 4,
    selectedIds: ['img-b'],
  },
};

export const LoadingState: Story = {
  args: {
    loading: true,
    selectedIds: [],
  },
};

export const ErrorState: Story = {
  args: {
    errorMessage: 'Image service unavailable',
    selectedIds: [],
  },
};

export const Empty: Story = {
  args: {
    items: [],
    selectedIds: [],
  },
};

export const InteractiveMulti: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = useState<string[]>(['img-a', 'img-e']);
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <ImageChoiceGrid items={IMAGE_ITEMS} selectedIds={selectedIds} onSelectionChange={setSelectedIds} mode="multi" />
        <div data-part="field-value">Selected: {selectedIds.join(', ') || 'none'}</div>
      </div>
    );
  },
};
