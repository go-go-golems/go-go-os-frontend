import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { createWindow } from './storyFixtures';
import { WindowTitleBar } from './WindowTitleBar';

interface TitleBarHarnessProps {
  title: string;
  icon?: string;
  focused: boolean;
}

function TitleBarHarness({ title, icon, focused }: TitleBarHarnessProps) {
  const [closeCount, setCloseCount] = useState(0);
  const [dragCount, setDragCount] = useState(0);

  return (
    <div style={{ width: 360, border: '2px solid #000', background: '#fff' }}>
      <WindowTitleBar
        title={title}
        icon={icon}
        focused={focused}
        onClose={() => setCloseCount((value) => value + 1)}
        onPointerDown={() => setDragCount((value) => value + 1)}
      />
      <div style={{ padding: 8, fontSize: 11 }}>
        close: {closeCount} · pointer down: {dragCount}
      </div>
    </div>
  );
}

const meta = {
  title: 'Engine/Shell/Windowing/WindowTitleBar',
  component: TitleBarHarness,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TitleBarHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Focused: Story = {
  args: {
    title: 'Inventory',
    icon: '📦',
    focused: true,
  },
};

export const Unfocused: Story = {
  args: {
    title: 'Sales',
    icon: '📈',
    focused: false,
  },
};

export const LongTitle: Story = {
  args: {
    title: createWindow({
      id: 'window:reporting',
      title: 'Quarterly Revenue and Forecast Review Workspace',
    }).title,
    icon: '📊',
    focused: true,
  },
};
