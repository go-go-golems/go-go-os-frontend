import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { WindowResizeHandle } from './WindowResizeHandle';

function ResizeHandleHarness() {
  const [pointerDownCount, setPointerDownCount] = useState(0);

  return (
    <div
      style={{
        width: 260,
        height: 180,
        position: 'relative',
        border: '2px solid #000',
        background: '#fff',
      }}
    >
      <div style={{ padding: 10, fontSize: 11 }}>Pointer down count: {pointerDownCount}</div>
      <WindowResizeHandle onPointerDown={() => setPointerDownCount((value) => value + 1)} />
    </div>
  );
}

const meta = {
  title: 'Engine/Shell/Windowing/WindowResizeHandle',
  component: ResizeHandleHarness,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ResizeHandleHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interactive: Story = {
  render: () => <ResizeHandleHarness />,
};
