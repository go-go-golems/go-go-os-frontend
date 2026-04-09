import type { Meta, StoryObj } from '@storybook/react';
import { Btn } from './Btn';
import { HaloTarget } from './HaloTarget';

const meta = {
  title: 'Engine/Widgets/HaloTarget',
  component: HaloTarget,
  tags: ['autodocs'],
} satisfies Meta<typeof HaloTarget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'a Button',
    children: <Btn>Morph</Btn>,
  },
};

export const AroundText: Story = {
  args: {
    label: 'a StringMorph',
    children: (
      <div
        style={{
          fontFamily: 'var(--hc-font-family)',
          fontSize: 14,
          border: '1px solid #000',
          padding: '4px 10px',
          background: '#fff',
        }}
      >
        Hello World
      </div>
    ),
  },
};

export const CustomHandles: Story = {
  args: {
    label: 'Custom',
    handles: [
      { id: 'delete', position: 'top-left', color: '#e22', icon: '✕', label: 'Delete' },
      { id: 'move', position: 'bottom-center', color: '#28f', icon: '✋', label: 'Move' },
      { id: 'resize', position: 'bottom-right', color: '#2a2', icon: '↔️', label: 'Resize' },
    ],
    children: <Btn variant="primary">Custom Morph</Btn>,
  },
};

export const MultipleTargets: Story = {
  args: { label: '', children: null },
  render: () => (
    <div style={{ display: 'flex', gap: 40, padding: 20 }}>
      <HaloTarget label="a Button">
        <Btn>Button A</Btn>
      </HaloTarget>
      <HaloTarget label="a StringMorph">
        <div
          style={{
            fontFamily: 'var(--hc-font-family)',
            fontSize: 14,
            border: '1px solid #000',
            padding: '4px 10px',
            background: '#fff',
          }}
        >
          Text morph
        </div>
      </HaloTarget>
    </div>
  ),
};
