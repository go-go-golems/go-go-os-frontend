import type { Meta, StoryObj } from '@storybook/react';
import { Sparkline } from './Sparkline';

const meta: Meta<typeof Sparkline> = {
  title: 'RichWidgets/Primitives/Sparkline',
  component: Sparkline,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Sparkline>;

export const Default: Story = {
  args: {
    data: [3, 7, 2, 9, 4, 11, 6, 8, 1, 5, 10, 3, 7, 2, 9, 4, 11, 6, 8, 1, 5, 10, 3, 7, 2, 9, 4, 11, 6, 8],
    width: 200,
    height: 32,
  },
};

export const Flat: Story = {
  args: {
    data: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    width: 160,
    height: 32,
  },
};

export const Spike: Story = {
  args: {
    data: [1, 1, 1, 1, 20, 1, 1, 1, 1, 1],
    width: 160,
    height: 32,
  },
};

export const Ascending: Story = {
  args: {
    data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    width: 200,
    height: 40,
  },
};

export const SingleValue: Story = {
  args: {
    data: [5],
    width: 40,
    height: 20,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    width: 160,
    height: 32,
  },
};

export const Wide: Story = {
  args: {
    data: Array.from({ length: 60 }, () => Math.floor(Math.random() * 20)),
    width: 400,
    height: 48,
  },
};
