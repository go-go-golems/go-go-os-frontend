import type { Meta, StoryObj } from '@storybook/react';
import { DisclosureTriangle } from '../../../src/primitives/DisclosureTriangle';
import { ToolPalette } from '../../../src/primitives/ToolPalette';
import { MenuGrid } from '../../../src/primitives/MenuGrid';
import { Chip } from '../../../src/primitives/Chip';
import { Separator } from '../../../src/rich/Separator';
import type { ToolDef } from '../../../src/primitives/ToolPalette';

// ── Style constants ──

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

// ── Fixture data ──

const DESIGN_TOOLS: ToolDef[] = [
  { icon: '✏️', label: 'Pencil' },
  { icon: '🖌️', label: 'Brush' },
  { icon: '🪣', label: 'Fill' },
  { icon: '🔲', label: 'Select' },
  { icon: '✂️', label: 'Lasso' },
  { icon: '📏', label: 'Line' },
  { icon: '⬜', label: 'Rect' },
  { icon: '⭕', label: 'Oval' },
];

const EDITING_TOOLS: ToolDef[] = [
  { icon: '📋', label: 'Copy' },
  { icon: '✂️', label: 'Cut' },
  { icon: '📄', label: 'Paste' },
  { icon: '↩️', label: 'Undo' },
  { icon: '↪️', label: 'Redo' },
  { icon: '🗑️', label: 'Delete' },
];

const TAGS = ['Design', 'UI', 'Bug', 'Feature', 'Documentation', 'Research', 'Blocked', 'Ready'];

// ── LayoutPatterns component ──

function LayoutPatternsInner() {
  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'var(--hc-font-family, Geneva, sans-serif)',
        fontSize: 12,
        width: 500,
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
        Layout Patterns
      </h1>

      {/* ── Disclosure Triangles ── */}
      <div style={SECTION_LABEL_STYLE}>Disclosure Triangles (Nested)</div>
      <div
        style={{
          padding: 12,
          background: '#f9f9f9',
          border: '1px solid #ddd',
          marginBottom: 16,
        }}
      >
        <DisclosureTriangle label="System Folder" defaultOpen>
          <div style={{ fontSize: 12, marginBottom: 4 }}>📁 System</div>
          <div style={{ fontSize: 12, marginBottom: 4 }}>📁 Finder</div>
          <DisclosureTriangle label="Extensions" defaultOpen>
            <div style={{ fontSize: 12, marginBottom: 4 }}>⚙️ Chooser</div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>⚙️ ImageWriter</div>
            <div style={{ fontSize: 12 }}>⚙️ QuickTime</div>
          </DisclosureTriangle>
          <DisclosureTriangle label="More...">
            <div style={{ fontSize: 12 }}>📁 Fonts</div>
            <div style={{ fontSize: 12 }}>📁 Preferences</div>
          </DisclosureTriangle>
        </DisclosureTriangle>
        <DisclosureTriangle label="Applications" defaultOpen>
          <div style={{ fontSize: 12, marginBottom: 4 }}>🖥️ MacPaint</div>
          <div style={{ fontSize: 12, marginBottom: 4 }}>📝 MacWrite</div>
          <div style={{ fontSize: 12 }}>📊 MacCalc</div>
        </DisclosureTriangle>
        <DisclosureTriangle label="Documents">
          <div style={{ fontSize: 12 }}>📄 report.pdf</div>
          <div style={{ fontSize: 12 }}>📄 notes.txt</div>
        </DisclosureTriangle>
      </div>

      {/* ── Tool Palette ── */}
      <div style={SECTION_LABEL_STYLE}>Tool Palette</div>
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Drawing Tools</div>
          <ToolPalette tools={DESIGN_TOOLS} selected={0} onSelect={() => {}} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Editing Tools</div>
          <ToolPalette tools={EDITING_TOOLS} selected={0} onSelect={() => {}} />
        </div>
      </div>

      {/* ── Chips / Tags ── */}
      <div style={SECTION_LABEL_STYLE}>Chips / Tags</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 16 }}>
        {TAGS.map((tag, i) => (
          <Chip key={tag}>{tag}{i === 2 ? ' 🔥' : i === 5 ? ' ⏳' : ''}</Chip>
        ))}
      </div>

      {/* ── Separator ── */}
      <div style={SECTION_LABEL_STYLE}>Separator</div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>Above content</div>
        <Separator orientation="horizontal" />
        <div style={{ marginTop: 8 }}>Below content</div>
      </div>

      {/* ── Menu Grid ── */}
      <div style={SECTION_LABEL_STYLE}>Menu Grid</div>
      <MenuGrid
        icon="📇"
        labels={[
          { value: 'Inventory Manager' },
          { value: 'Track items and stock levels', style: 'muted' as const },
        ]}
        buttons={[
          { label: '📦 Browse Items', action: 'browse', variant: 'default' },
          { label: '⚠️ Low Stock', action: 'low', variant: 'default' },
          { label: '📊 View Report', action: 'report', variant: 'default' },
          { label: '➕ Add Item', action: 'add', variant: 'default' },
        ]}
        onAction={(action) => alert(`Action: ${action}`)}
      />
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Showcases/Layout/LayoutPatterns',
  component: LayoutPatternsInner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Showcase demonstrating layout widgets: nested disclosure triangles, tool palettes, tag chips, separators, and menu grids.',
      },
    },
  },
} satisfies Meta<typeof LayoutPatternsInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LayoutPatterns: Story = {};
