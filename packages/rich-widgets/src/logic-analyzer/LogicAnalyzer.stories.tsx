import type { Meta, StoryObj } from '@storybook/react';
import { LogicAnalyzer } from './LogicAnalyzer';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof LogicAnalyzer> = {
  title: 'RichWidgets/LogicAnalyzer',
  component: LogicAnalyzer,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof LogicAnalyzer>;

export const Default: Story = {
  args: {},
  decorators: [fullscreenDecorator],
};

export const Paused: Story = {
  args: {
    autoStart: false,
  },
  decorators: [fullscreenDecorator],
};

export const AllChannels: Story = {
  args: {
    initialChannelCount: 8,
  },
  decorators: [fullscreenDecorator],
};

export const TwoChannels: Story = {
  args: {
    initialChannelCount: 2,
  },
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  args: {
    canvasWidth: 400,
    canvasHeight: 220,
    initialChannelCount: 4,
  },
  decorators: [fixedFrameDecorator(760, 400)],
};

export const SingleChannel: Story = {
  args: {
    initialChannelCount: 1,
  },
  decorators: [fullscreenDecorator],
};

export const WideCanvas: Story = {
  args: {
    canvasWidth: 860,
    canvasHeight: 360,
    initialChannelCount: 8,
  },
  decorators: [fullscreenDecorator],
};
