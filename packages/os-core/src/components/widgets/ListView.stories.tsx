import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnConfig, FilterConfig } from '../../types';
import { ListView } from './ListView';

type Item = { id: string; name: string; qty: number; price: number; category: string; [key: string]: unknown };

const data: Item[] = [
  { id: '1', name: 'Keychain', qty: 2, price: 9.99, category: 'Accessories' },
  { id: '2', name: 'Mug', qty: 14, price: 24.99, category: 'Kitchen' },
  { id: '3', name: 'Candle', qty: 0, price: 34.99, category: 'Home' },
  { id: '4', name: 'Sticker', qty: 20, price: 4.99, category: 'Merch' },
];

const columns: ColumnConfig<Item>[] = [
  { key: 'id', label: 'ID', width: 40 },
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'qty', label: 'Qty', width: 50 },
  { key: 'price', label: 'Price', width: 60, format: (v) => `$${Number(v).toFixed(2)}` },
  { key: 'category', label: 'Category', width: 90 },
];

const filters: FilterConfig[] = [
  { field: 'category', type: 'select', options: ['All', 'Accessories', 'Kitchen', 'Home', 'Merch'] },
  { field: '_search', type: 'text', placeholder: 'Search…' },
];

const meta = {
  title: 'Engine/Widgets/ListView',
  component: ListView<Item>,
  args: {
    items: data,
    columns,
    filters,
    searchFields: ['name'],
    rowKey: 'id',
    footer: { type: 'sum' as const, field: 'price', label: 'Total', format: (v: number) => `$${v.toFixed(2)}` },
  },
} satisfies Meta<typeof ListView<Item>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { items: [], emptyMessage: 'All stocked up! 🎉' } };
