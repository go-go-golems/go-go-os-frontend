import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RatingPicker } from './RatingPicker';

const meta = {
  title: 'Engine/Widgets/RatingPicker',
  component: RatingPicker,
  tags: ['autodocs'],
  args: {
    scale: 5,
    style: 'numbers',
    value: 3,
  },
} satisfies Meta<typeof RatingPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Numbers: Story = {};

export const Stars: Story = {
  args: {
    style: 'stars',
    value: 4,
  },
};

export const Emoji: Story = {
  args: {
    style: 'emoji',
    scale: 7,
    value: 5,
  },
};

export const Slider: Story = {
  args: {
    style: 'slider',
    scale: 10,
    value: 6,
    lowLabel: 'Poor',
    highLabel: 'Excellent',
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState(3);
    return (
      <div style={{ display: 'grid', gap: 8, width: 320 }}>
        <RatingPicker scale={5} style="stars" value={value} onChange={setValue} lowLabel="Low" highLabel="High" />
        <div data-part="field-value">Current: {value}</div>
      </div>
    );
  },
};
