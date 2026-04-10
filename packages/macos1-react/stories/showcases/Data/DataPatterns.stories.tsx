import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DataTable } from '../../../src/primitives/DataTable';
import { ListView } from '../../../src/primitives/ListView';
import { DetailView } from '../../../src/primitives/DetailView';
import { ReportView } from '../../../src/primitives/ReportView';
import { GridBoard } from '../../../src/primitives/GridBoard';
import type { ColumnConfig, FilterConfig } from '../../../src/primitives/ListView';

// ── Style constants ──

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

// ── Fixture data ──

type Item = {
  id: string;
  name: string;
  qty: number;
  price: number;
  category: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  [key: string]: unknown;
};

const INVENTORY: Item[] = [
  { id: '1', name: 'Keychain - Brass', qty: 2, price: 9.99, category: 'Accessories', status: 'low-stock' },
  { id: '2', name: 'Coffee Mug - Ceramic', qty: 14, price: 24.99, category: 'Kitchen', status: 'in-stock' },
  { id: '3', name: 'Scented Candle - Lavender', qty: 0, price: 34.99, category: 'Home', status: 'out-of-stock' },
  { id: '4', name: 'Sticker Pack - Logo', qty: 20, price: 4.99, category: 'Merch', status: 'in-stock' },
  { id: '5', name: 'T-Shirt - Black (M)', qty: 5, price: 29.99, category: 'Apparel', status: 'low-stock' },
  { id: '6', name: 'Notebook - Spiral', qty: 45, price: 12.99, category: 'Office', status: 'in-stock' },
];

const COLUMNS: ColumnConfig<Item>[] = [
  { key: 'id', label: 'ID', width: 40 },
  { key: 'name', label: 'Name', width: '1fr' },
  {
    key: 'qty',
    label: 'Qty',
    width: 50,
    cellState: (v) => (Number(v) === 0 ? 'error' : Number(v) <= 5 ? 'warning' : undefined),
  },
  { key: 'price', label: 'Price', width: 70, format: (v) => `$${Number(v).toFixed(2)}`, align: 'right' },
  {
    key: 'status',
    label: 'Status',
    width: 90,
    format: (v) => {
      const s = String(v);
      if (s === 'out-of-stock') return '❌ Out';
      if (s === 'low-stock') return '⚠️ Low';
      return '✓ OK';
    },
  },
];

const FILTERS: FilterConfig[] = [
  { field: 'category', type: 'select', options: ['All', 'Accessories', 'Kitchen', 'Home', 'Merch', 'Apparel', 'Office'] },
  { field: '_search', type: 'text', placeholder: 'Search…' },
];

// Grid cells
const GRID_CELLS = [
  { value: 'A1', color: '#f9f4d2' },
  { value: 'A2', color: '#d2f9e7' },
  { value: 'A3', color: '#d2e5f9' },
  { value: 'B1', color: '#f9d2dc' },
  { value: 'B2', color: '#f9ecd2' },
  { value: 'B3', color: '#e4f9d2' },
  { value: 'C1', color: '#d2f0f9' },
  { value: 'C2', color: '#f9d2f0' },
  { value: 'C3', color: '#f9f9f9' },
];

// ── DataPatterns component ──

function DataPatternsInner() {
  const [selectedId, setSelectedId] = useState<string | null>('2');
  const selectedItem = INVENTORY.find((i) => i.id === selectedId);

  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'var(--hc-font-family, Geneva, sans-serif)',
        fontSize: 12,
        width: 600,
      }}
    >
      {/* ── Header ── */}
      <h1
        style={{
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: 16,
          borderBottom: '1px solid #ccc',
          paddingBottom: 8,
        }}
      >
        Data Display Patterns
      </h1>

      {/* ── Data Table ── */}
      <div style={SECTION_LABEL_STYLE}>Data Table (selectable)</div>
      <div style={{ marginBottom: 8 }}>
        Click a row to select it and see the detail view below.
      </div>
      <DataTable
        items={INVENTORY}
        columns={COLUMNS}
        rowKey="id"
        onRowClick={(row) => setSelectedId(row.id)}
      />

      {/* ── Selected Item Detail ── */}
      {selectedItem && (
        <div style={{ marginTop: 16 }}>
          <div style={SECTION_LABEL_STYLE}>Detail View (selected: {selectedItem.name})</div>
          <DetailView
            record={selectedItem}
            fields={[
              { id: 'id', label: 'ID', type: 'readonly' },
              { id: 'name', label: 'Name', type: 'readonly' },
              { id: 'category', label: 'Category', type: 'readonly' },
              { id: 'qty', label: 'Quantity', type: 'readonly' },
              { id: 'price', label: 'Price ($)', type: 'readonly' },
            ]}
            computed={[
              {
                id: 'value',
                label: 'Total Value',
                compute: (r) => `$${(Number(r.qty) * Number(r.price)).toFixed(2)}`,
              },
            ]}
            edits={{}}
            onEdit={() => {}}
            actions={[
              { label: '✏️ Edit', variant: 'default', action: 'edit' },
              { label: '🗑 Delete', variant: 'danger', action: 'delete' },
            ]}
            onAction={(a) => alert(`Action: ${a}`)}
          />
        </div>
      )}

      {/* ── List View ── */}
      <div style={{ marginTop: 24 }}>
        <div style={SECTION_LABEL_STYLE}>List View (with filters)</div>
        <ListView
          items={INVENTORY}
          columns={COLUMNS}
          filters={FILTERS}
          searchFields={['name', 'category']}
          rowKey="id"
          footer={{ type: 'sum', field: 'price', label: 'Total Value', format: (v: number) => `$${v.toFixed(2)}` }}
        />
      </div>

      {/* ── Report View ── */}
      <div style={{ marginTop: 24 }}>
        <div style={SECTION_LABEL_STYLE}>Report View</div>
        <ReportView
          sections={[
            { label: 'Total Items', value: String(INVENTORY.length) },
            { label: 'Total Units', value: String(INVENTORY.reduce((acc, i) => acc + i.qty, 0)) },
            {
              label: 'Retail Value',
              value: `$${INVENTORY.reduce((acc, i) => acc + i.qty * i.price, 0).toFixed(2)}`,
            },
            {
              label: 'Out of Stock',
              value: String(INVENTORY.filter((i) => i.status === 'out-of-stock').length),
            },
            {
              label: 'Low Stock',
              value: String(INVENTORY.filter((i) => i.status === 'low-stock').length),
            },
          ]}
        />
      </div>

      {/* ── Grid Board ── */}
      <div style={{ marginTop: 24 }}>
        <div style={SECTION_LABEL_STYLE}>Grid Board</div>
        <GridBoard rows={3} cols={3} cellSize="medium" cells={GRID_CELLS} />
      </div>
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Showcases/Data/DataPatterns',
  component: DataPatternsInner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Showcase demonstrating data display widgets: data tables with row selection, detail views, list views with filters, report views, and grid boards.',
      },
    },
  },
} satisfies Meta<typeof DataPatternsInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DataPatterns: Story = {};
