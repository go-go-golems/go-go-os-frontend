import type { Meta, StoryObj } from '@storybook/react';
import { ControlRoom } from './ControlRoom';
import { fixedFrameDecorator } from '../storybook/frameDecorators';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof ControlRoom> = {
  title: 'RichWidgets/ControlRoom',
  component: ControlRoom,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof ControlRoom>;

export const Default: Story = {
  args: {},
  decorators: [fixedFrameDecorator(960, 700)],
};

export const Compact: Story = {
  args: {},
  decorators: [fixedFrameDecorator(720, 500)],
};

export const FastTick: Story = {
  args: {
    tickInterval: 200,
  },
  decorators: [fixedFrameDecorator(960, 700)],
};

export const SlowTick: Story = {
  args: {
    tickInterval: 900,
  },
  decorators: [fixedFrameDecorator(960, 700)],
};

export const WideConsole: Story = {
  args: {},
  decorators: [fixedFrameDecorator(1200, 760)],
};
