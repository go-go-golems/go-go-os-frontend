import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnConfig } from '../../types';
import { DataTable } from './DataTable';

type SampleRow = { id: string; name: string; qty: number; price: number; [key: string]: unknown };

const sampleData: SampleRow[] = [
  { id: '1', name: 'Widget A', qty: 10, price: 9.99 },
  { id: '2', name: 'Widget B', qty: 0, price: 24.99 },
  { id: '3', name: 'Widget C', qty: 3, price: 14.99 },
];

const columns: ColumnConfig<SampleRow>[] = [
  { key: 'id', label: 'ID', width: 40 },
  { key: 'name', label: 'Name', width: '1fr' },
  {
    key: 'qty',
    label: 'Qty',
    width: 50,
    cellState: (v) => (Number(v) === 0 ? 'error' : Number(v) <= 3 ? 'warning' : undefined),
  },
  { key: 'price', label: 'Price', width: 60, format: (v) => `$${Number(v).toFixed(2)}`, align: 'right' },
];

const meta = {
  title: 'Engine/Widgets/DataTable',
  component: DataTable<SampleRow>,
  args: { items: sampleData, columns, rowKey: 'id' },
} satisfies Meta<typeof DataTable<SampleRow>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { items: [], emptyMessage: 'Nothing here 🎉' } };
export const Clickable: Story = { args: { onRowClick: (row: SampleRow) => alert(row.name) } };
