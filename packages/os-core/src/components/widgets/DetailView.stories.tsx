import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { ComputedFieldConfig, FieldConfig } from '../../types';
import { DetailView } from './DetailView';

type Item = { sku: string; name: string; price: number; cost: number; qty: number; [key: string]: unknown };

const record: Item = { sku: 'A-1002', name: 'Keychain - Brass', price: 9.99, cost: 3.25, qty: 2 };

const fields: FieldConfig[] = [
  { id: 'sku', label: 'SKU', type: 'readonly' },
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'price', label: 'Price ($)', type: 'number', step: 0.01 },
  { id: 'qty', label: 'Quantity', type: 'number' },
];

const computed: ComputedFieldConfig<Item>[] = [
  { id: 'margin', label: 'Margin', compute: (r) => `${(((r.price - r.cost) / r.price) * 100).toFixed(1)}%` },
];

function DetailDemo() {
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  return (
    <DetailView
      record={record}
      fields={fields}
      computed={computed}
      edits={edits}
      onEdit={(id, v) => setEdits((p) => ({ ...p, [id]: v }))}
      actions={[
        { label: '✏️ Save', variant: 'primary', action: 'save' },
        { label: '🗑 Delete', variant: 'danger', action: 'delete' },
      ]}
      onAction={(a) => alert(`Action: ${a}`)}
    />
  );
}

const meta = {
  title: 'Engine/Widgets/DetailView',
  component: DetailDemo,
} satisfies Meta<typeof DetailDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
