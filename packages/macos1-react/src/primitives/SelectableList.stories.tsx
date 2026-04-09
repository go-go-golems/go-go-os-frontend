import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SelectableList, type SelectableListItem } from './SelectableList';

const ITEMS: SelectableListItem[] = [
  { id: 'inv-low', label: 'Low Inventory', description: 'Items below threshold', icon: 'L', meta: '12' },
  { id: 'inv-back', label: 'Backorders', description: 'Customer waiting list', icon: 'B', meta: '4' },
  { id: 'inv-new', label: 'New SKUs', description: 'Recently added stock', icon: 'N', meta: '7' },
  { id: 'inv-arch', label: 'Archive', description: 'Legacy items', icon: 'A', disabled: true },
  { id: 'inv-season', label: 'Seasonal', description: 'Holiday and event goods', icon: 'S', meta: '22' },
  { id: 'inv-promo', label: 'Promotions', description: 'Discounted sets', icon: 'P', meta: '9' },
];

const LONG_ITEMS: SelectableListItem[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `item-${i + 1}`,
  label: `Inventory group ${i + 1}`,
  description: `Generated row ${i + 1}`,
  meta: String((i + 3) * 2),
}));

const meta = {
  title: 'Engine/Widgets/SelectableList',
  component: SelectableList,
  tags: ['autodocs'],
  args: {
    items: ITEMS,
    selectedIds: ['inv-new'],
    onSelectionChange: () => {},
  },
} satisfies Meta<typeof SelectableList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleSelect: Story = {
  args: {
    mode: 'single',
    searchable: false,
  },
};

export const MultiSelect: Story = {
  args: {
    mode: 'multiple',
    selectedIds: ['inv-low', 'inv-season'],
  },
};

export const Searchable: Story = {
  args: {
    mode: 'single',
    searchable: true,
    searchPlaceholder: 'Find queue...',
  },
};

export const Empty: Story = {
  args: {
    items: [],
    selectedIds: [],
    searchable: true,
    emptyMessage: 'No queues available',
  },
};

export const LongListScrollable: Story = {
  args: {
    items: LONG_ITEMS,
    selectedIds: ['item-8'],
    searchable: true,
    height: 180,
  },
};

export const InteractiveSingle: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = useState<string[]>(['inv-back']);

    return (
      <div style={{ display: 'grid', gap: 8, width: 360 }}>
        <SelectableList items={ITEMS} selectedIds={selectedIds} onSelectionChange={setSelectedIds} mode="single" searchable />
        <div data-part="field-value">Selected: {selectedIds.join(', ') || 'none'}</div>
      </div>
    );
  },
};

export const InteractiveMultipleWithSubmit: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = useState<string[]>(['inv-low', 'inv-new']);
    const [submitted, setSubmitted] = useState<string>('none');

    return (
      <div style={{ display: 'grid', gap: 8, width: 380 }}>
        <SelectableList
          items={ITEMS}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          mode="multiple"
          searchable
          onSubmit={(ids) => setSubmitted(ids.join(', ') || 'none')}
        />
        <div data-part="field-value">Current: {selectedIds.join(', ') || 'none'}</div>
        <div data-part="field-value">Last submit: {submitted}</div>
      </div>
    );
  },
};

export const ControlledSearchText: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState('inv');

    return (
      <div style={{ display: 'grid', gap: 8, width: 360 }}>
        <SelectableList
          items={ITEMS}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          mode="multiple"
          searchable
          searchText={search}
          onSearchTextChange={setSearch}
        />
        <div data-part="field-value">Search: {search}</div>
      </div>
    );
  },
};
