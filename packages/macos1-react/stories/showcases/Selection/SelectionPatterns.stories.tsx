import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RadioButton } from '../../../src/primitives/RadioButton';
import { Checkbox } from '../../../src/primitives/Checkbox';
import { SelectableList } from '../../../src/primitives/SelectableList';
import { SelectableDataTable } from '../../../src/primitives/SelectableDataTable';
import { ImageChoiceGrid } from '../../../src/primitives/ImageChoiceGrid';
import type { SelectableListItem } from '../../../src/primitives/SelectableList';
import type { ColumnConfig } from '../../../src/primitives/types';
import type { ImageChoiceItem } from '../../../src/primitives/ImageChoiceGrid';

// ── Style constants ──

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const DEMO_BOX_STYLE: React.CSSProperties = {
  padding: 16,
  background: '#fff',
  border: '2px solid #000',
  marginBottom: 16,
  position: 'relative' as const,
};

// ── Fixture data ──

const WAREHOUSE_ITEMS: ImageChoiceItem[] = [
  { id: 'wh-a', src: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#6f8db0"/><text x="10" y="66" font-size="20" fill="white" font-family="sans-serif">WH-A</text></svg>'), label: 'Warehouse A' },
  { id: 'wh-b', src: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#8b6fae"/><text x="10" y="66" font-size="20" fill="white" font-family="sans-serif">WH-B</text></svg>'), label: 'Warehouse B' },
  { id: 'wh-c', src: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#6faa7e"/><text x="10" y="66" font-size="20" fill="white" font-family="sans-serif">WH-C</text></svg>'), label: 'Warehouse C' },
  { id: 'wh-d', src: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#b07c63"/><text x="10" y="66" font-size="20" fill="white" font-family="sans-serif">WH-D</text></svg>'), label: 'Warehouse D', disabled: true },
  { id: 'wh-e', src: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#4f7a7d"/><text x="10" y="66" font-size="20" fill="white" font-family="sans-serif">WH-E</text></svg>'), label: 'Warehouse E' },
  { id: 'wh-f', src: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#9a6a8f"/><text x="10" y="66" font-size="20" fill="white" font-family="sans-serif">WH-E</text></svg>'), label: 'Warehouse F', badge: 'new' },
];

const TEAM_QUEUE_ITEMS: SelectableListItem[] = [
  { id: 'q-marketing', label: 'Marketing', description: 'Creative briefs and campaigns', icon: 'M', meta: '5' },
  { id: 'q-eng', label: 'Engineering', description: 'Feature development and bug fixes', icon: 'E', meta: '12' },
  { id: 'q-ops', label: 'Operations', description: 'Process and tooling improvements', icon: 'O', meta: '3' },
  { id: 'q-support', label: 'Support', description: 'Customer tickets and escalations', icon: 'S', meta: '8' },
  { id: 'q-design', label: 'Design', description: 'UI/UX reviews and assets', icon: 'D', meta: '2' },
];

type Item = {
  id: string;
  sku: string;
  name: string;
  qty: number;
  owner: string;
  [key: string]: unknown;
};

const ITEM_ROWS: Item[] = [
  { id: '1', sku: 'A-100', name: 'Drill Set', qty: 14, owner: 'Mia' },
  { id: '2', sku: 'A-120', name: 'Bolt Pack', qty: 2, owner: 'Noah' },
  { id: '3', sku: 'A-130', name: 'Saw Blade', qty: 0, owner: 'Aria' },
  { id: '4', sku: 'A-145', name: 'Wrench Kit', qty: 9, owner: 'Liam' },
  { id: '5', sku: 'A-188', name: 'Shop Gloves', qty: 3, owner: 'Eli' },
];

const ITEM_COLUMNS: ColumnConfig<Item>[] = [
  { key: 'sku', label: 'SKU', width: 90 },
  { key: 'name', label: 'Name', width: '1fr' },
  {
    key: 'qty',
    label: 'Qty',
    width: 50,
    align: 'right' as const,
    cellState: (v) => (Number(v) === 0 ? 'error' : Number(v) <= 3 ? 'warning' : undefined),
  },
  { key: 'owner', label: 'Owner', width: 70 },
];

// ── SelectionPatterns component ──

function SelectionPatternsInner() {
  // Radio state
  const [shipping, setShipping] = useState('standard');

  // Checkbox state
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifySMS, setNotifySMS] = useState(true);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // SelectableList state
  const [queueSel, setQueueSel] = useState<string[]>(['q-eng']);

  // SelectableDataTable state
  const [tableSel, setTableSel] = useState<string[]>(['1', '3']);

  // ImageChoiceGrid state
  const [warehouseSel, setWarehouseSel] = useState<string[]>(['wh-a']);

  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'var(--hc-font-family, Geneva, sans-serif)',
        fontSize: 12,
        width: 560,
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
        Selection Patterns
      </h1>

      {/* ── RadioButton (shipping method) ── */}
      <div style={SECTION_LABEL_STYLE}>RadioButton (single choice)</div>
      <div style={{ ...DEMO_BOX_STYLE, minHeight: 80 }}>
        <div style={{ fontSize: 11, marginBottom: 8 }}>Select shipping method:</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <RadioButton label="Standard (5-7 days)" selected={shipping === 'standard'} onChange={() => setShipping('standard')} />
          <RadioButton label="Express (2-3 days)" selected={shipping === 'express'} onChange={() => setShipping('express')} />
          <RadioButton label="Overnight" selected={shipping === 'overnight'} onChange={() => setShipping('overnight')} />
        </div>
        <div style={{ fontSize: 10, color: '#666', marginTop: 8 }}>
          Selected: {shipping}
        </div>
      </div>

      {/* ── Checkbox (notifications + terms) ── */}
      <div style={SECTION_LABEL_STYLE}>Checkbox (multi-choice / toggle)</div>
      <div style={{ ...DEMO_BOX_STYLE, minHeight: 80 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Checkbox
            label="Notify via email"
            checked={notifyEmail}
            onChange={setNotifyEmail}
          />
          <Checkbox
            label="Notify via SMS"
            checked={notifySMS}
            onChange={setNotifySMS}
          />
          <div style={{ height: 1, background: '#ddd', margin: '4px 0' }} />
          <Checkbox
            label="I agree to the terms and conditions"
            checked={termsAgreed}
            onChange={setTermsAgreed}
          />
        </div>
      </div>

      {/* ── SelectableList (team queue assignment) ── */}
      <div style={SECTION_LABEL_STYLE}>SelectableList (single / multi select)</div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {/* Single select */}
        <div>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Assign to:</div>
          <div style={{ width: 200 }}>
            <SelectableList
              items={TEAM_QUEUE_ITEMS}
              selectedIds={queueSel.slice(0, 1)}
              onSelectionChange={(ids) => setQueueSel(ids)}
              mode="single"
              searchable
            />
          </div>
        </div>
        {/* Multi select */}
        <div>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Also notify:</div>
          <div style={{ width: 200 }}>
            <SelectableList
              items={TEAM_QUEUE_ITEMS}
              selectedIds={queueSel}
              onSelectionChange={setQueueSel}
              mode="multiple"
              searchable
            />
          </div>
        </div>
      </div>

      {/* ── SelectableDataTable (item assignment) ── */}
      <div style={SECTION_LABEL_STYLE}>SelectableDataTable (row selection)</div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
          Select items to archive: {tableSel.length > 0 ? tableSel.join(', ') : 'none'}
        </div>
        <SelectableDataTable
          items={ITEM_ROWS}
          columns={ITEM_COLUMNS}
          rowKey="id"
          mode="multiple"
          selectedIds={tableSel}
          onSelectionChange={setTableSel}
        />
      </div>

      {/* ── ImageChoiceGrid (warehouse selection) ── */}
      <div style={SECTION_LABEL_STYLE}>ImageChoiceGrid (visual picker)</div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
          Primary warehouse:{' '}
          {WAREHOUSE_ITEMS.find((w) => w.id === warehouseSel[0])?.label ?? 'none'}
        </div>
        <ImageChoiceGrid
          items={WAREHOUSE_ITEMS}
          selectedIds={warehouseSel}
          onSelectionChange={setWarehouseSel}
          mode="select"
          columns={3}
        />
      </div>
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Showcases/Selection/SelectionPatterns',
  component: SelectionPatternsInner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Showcase demonstrating selection widgets: RadioButton, Checkbox, SelectableList (single/multi), SelectableDataTable, and ImageChoiceGrid.',
      },
    },
  },
} satisfies Meta<typeof SelectionPatternsInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelectionPatterns: Story = {};
