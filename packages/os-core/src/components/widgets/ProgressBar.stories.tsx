import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { ProgressBar } from './ProgressBar';

const meta = {
  title: 'Engine/Widgets/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { value: 0, width: 220 } };
export const Half: Story = { args: { value: 50, width: 220 } };
export const Full: Story = { args: { value: 100, width: 220 } };

export const Animated: Story = {
  args: { value: 0, width: 220 },
  render: () => {
    const [v, setV] = useState(0);
    useEffect(() => {
      const t = setInterval(() => setV((p) => (p >= 100 ? 0 : p + 2)), 150);
      return () => clearInterval(t);
    }, []);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ProgressBar value={v} width={200} />
        <span style={{ fontFamily: 'var(--hc-font-family)', fontSize: 11 }}>Copying files… {Math.round(v)}%</span>
      </div>
    );
  },
};
