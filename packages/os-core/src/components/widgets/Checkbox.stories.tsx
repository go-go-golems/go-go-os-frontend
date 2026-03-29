import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Engine/Widgets/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = { args: { label: 'Bold', checked: false, onChange: () => {} } };
export const Checked: Story = { args: { label: 'Bold', checked: true, onChange: () => {} } };
export const Disabled: Story = { args: { label: 'Unavailable', checked: false, onChange: () => {}, disabled: true } };

export const Group: Story = {
  args: { label: '', checked: false, onChange: () => {} },
  render: () => {
    const [vals, setVals] = useState([true, false, true]);
    const labels = ['Bold', 'Italic', 'Underline'];
    return (
      <div>
        {labels.map((l, i) => (
          <Checkbox
            key={l}
            label={l}
            checked={vals[i]}
            onChange={() => setVals((v) => v.map((x, j) => (j === i ? !x : x)))}
          />
        ))}
      </div>
    );
  },
};
