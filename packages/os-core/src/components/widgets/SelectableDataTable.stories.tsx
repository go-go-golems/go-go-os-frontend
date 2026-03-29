import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { ColumnConfig } from '../../types';
import { SelectableDataTable } from './SelectableDataTable';

type QueueRow = {
  id: string;
  sku: string;
  name: string;
  qty: number;
  status: 'ok' | 'warning' | 'critical';
  owner: string;
  [key: string]: unknown;
};

const BASE_ROWS: QueueRow[] = [
  { id: '1', sku: 'A-100', name: 'Drill Set', qty: 14, status: 'ok', owner: 'Mia' },
  { id: '2', sku: 'A-120', name: 'Bolt Pack', qty: 2, status: 'warning', owner: 'Noah' },
  { id: '3', sku: 'A-130', name: 'Saw Blade', qty: 0, status: 'critical', owner: 'Aria' },
  { id: '4', sku: 'A-145', name: 'Wrench Kit', qty: 9, status: 'ok', owner: 'Liam' },
  { id: '5', sku: 'A-188', name: 'Shop Gloves', qty: 3, status: 'warning', owner: 'Eli' },
];

const LARGE_ROWS: QueueRow[] = Array.from({ length: 28 }).map((_, index) => ({
  id: String(index + 1),
  sku: `SKU-${String(index + 100).padStart(3, '0')}`,
  name: `Generated Item ${index + 1}`,
  qty: (index * 3) % 17,
  status: index % 9 === 0 ? 'critical' : index % 5 === 0 ? 'warning' : 'ok',
  owner: ['Mia', 'Noah', 'Aria', 'Liam'][index % 4],
}));

const COLUMNS: ColumnConfig<QueueRow>[] = [
  { key: 'sku', label: 'SKU', width: 90 },
  { key: 'name', label: 'Name', width: '1.4fr' },
  {
    key: 'qty',
    label: 'Qty',
    width: 60,
    align: 'right',
    cellState: (value) => (Number(value) <= 0 ? 'error' : Number(value) <= 3 ? 'warning' : undefined),
  },
  { key: 'status', label: 'Status', width: 90 },
  { key: 'owner', label: 'Owner', width: 80 },
];

const meta = {
  title: 'Engine/Widgets/SelectableDataTable',
  component: SelectableDataTable<QueueRow>,
  tags: ['autodocs'],
  args: {
    items: BASE_ROWS,
    columns: COLUMNS,
    rowKey: 'id',
    selectedRowKeys: ['2'],
    onSelectionChange: () => {},
  },
} satisfies Meta<typeof SelectableDataTable<QueueRow>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleSelect: Story = {
  args: {
    mode: 'single',
  },
};

export const MultiSelect: Story = {
  args: {
    mode: 'multiple',
    selectedRowKeys: ['2', '5'],
  },
};

export const Searchable: Story = {
  args: {
    searchable: true,
    searchPlaceholder: 'Filter rows...',
  },
};

export const Empty: Story = {
  args: {
    items: [],
    selectedRowKeys: [],
    emptyMessage: 'No matching records',
  },
};

export const LargeDataset: Story = {
  args: {
    items: LARGE_ROWS,
    selectedRowKeys: ['4', '10', '20'],
    mode: 'multiple',
    searchable: true,
  },
};

export const InteractiveSingle: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>(['1']);
    const [lastClicked, setLastClicked] = useState<string>('none');

    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <SelectableDataTable
          items={BASE_ROWS}
          columns={COLUMNS}
          rowKey="id"
          selectedRowKeys={selected}
          onSelectionChange={setSelected}
          onRowClick={(row) => setLastClicked(String(row.name))}
          mode="single"
        />
        <div data-part="field-value">Selected key: {selected[0] ?? 'none'}</div>
        <div data-part="field-value">Last clicked: {lastClicked}</div>
      </div>
    );
  },
};

export const InteractiveMultipleSearch: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>(['2', '3']);
    const [searchText, setSearchText] = useState('a');

    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <SelectableDataTable
          items={BASE_ROWS}
          columns={COLUMNS}
          rowKey="id"
          selectedRowKeys={selected}
          onSelectionChange={setSelected}
          mode="multiple"
          searchable
          searchText={searchText}
          onSearchTextChange={setSearchText}
          searchFields={['sku', 'name', 'owner']}
        />
        <div data-part="field-value">Selected keys: {selected.join(', ') || 'none'}</div>
      </div>
    );
  },
};
