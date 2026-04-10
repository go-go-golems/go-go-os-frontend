import type { Meta, StoryObj } from '@storybook/react';
import { Btn } from '../../../src/primitives/Btn';

// ── Style constants ──

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, auto)',
  gap: 12,
  alignItems: 'center',
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#666',
  textAlign: 'right',
};

// ── ButtonShowcase component ──

function ButtonShowcaseInner() {
  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'var(--hc-font-family, Geneva, sans-serif)',
        fontSize: 12,
        width: 400,
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
        Button Variants
      </h1>

      {/* ── Standard Buttons ── */}
      <div style={SECTION_LABEL_STYLE}>Standard Buttons</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Btn>Default</Btn>
        <Btn isDefault>Default (isDefault)</Btn>
        <Btn variant="primary">Primary</Btn>
        <Btn variant="danger">Danger</Btn>
      </div>

      {/* ── States ── */}
      <div style={SECTION_LABEL_STYLE}>States</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Btn disabled>Disabled</Btn>
        <Btn active>Active</Btn>
        <Btn>With Icon 🚀</Btn>
      </div>

      {/* ── Button Matrix ── */}
      <div style={SECTION_LABEL_STYLE}>Button Matrix</div>
      <div style={GRID_STYLE}>
        <span style={LABEL_STYLE}>Normal</span>
        <Btn>Standard</Btn>
        <Btn variant="primary">Primary</Btn>

        <span style={LABEL_STYLE}>Hover</span>
        <div style={{ fontSize: 9, color: '#888', textAlign: 'center' }}>
          (hover in browser)
        </div>
        <div style={{ fontSize: 9, color: '#888', textAlign: 'center' }}>
          (hover in browser)
        </div>

        <span style={LABEL_STYLE}>Active</span>
        <Btn active>Standard</Btn>
        <Btn active>Primary</Btn>

        <span style={LABEL_STYLE}>Disabled</span>
        <Btn disabled>Standard</Btn>
        <Btn disabled>Primary</Btn>
      </div>

      {/* ── Icon Buttons ── */}
      <div style={SECTION_LABEL_STYLE}>Icon Buttons</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <Btn>✏️</Btn>
        <Btn>🗑</Btn>
        <Btn>📁</Btn>
        <Btn>💾</Btn>
        <Btn>🔍</Btn>
        <Btn>⚙️</Btn>
      </div>

      {/* ── Button Bar ── */}
      <div style={SECTION_LABEL_STYLE}>Button Bar</div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          background: '#f5f5f5',
          borderRadius: 4,
        }}
      >
        <Btn isDefault>OK</Btn>
        <Btn>Apply</Btn>
        <Btn>Cancel</Btn>
        <Btn variant="danger">Reset All</Btn>
      </div>
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Showcases/Controls/ButtonStates',
  component: ButtonShowcaseInner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Showcase demonstrating all button variants and states: standard, primary, danger, disabled, active, and icon buttons.',
      },
    },
  },
} satisfies Meta<typeof ButtonShowcaseInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonStates: Story = {};
