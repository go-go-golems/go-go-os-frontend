import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RadioButton } from './RadioButton';

const meta = {
  title: 'Engine/Widgets/RadioButton',
  component: RadioButton,
  tags: ['autodocs'],
  argTypes: {
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof RadioButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = { args: { label: '9 point', selected: false, onChange: () => {} } };
export const Selected: Story = { args: { label: '9 point', selected: true, onChange: () => {} } };
export const Disabled: Story = { args: { label: 'Unavailable', selected: false, onChange: () => {}, disabled: true } };

export const Group: Story = {
  args: { label: '', selected: false, onChange: () => {} },
  render: () => {
    const [sel, setSel] = useState(0);
    const labels = ['9 point', '10 point', '12 point'];
    return (
      <div>
        {labels.map((l, i) => (
          <RadioButton key={l} label={l} selected={sel === i} onChange={() => setSel(i)} />
        ))}
      </div>
    );
  },
};
