import type { Meta, StoryObj } from '@storybook/react';
import { Oscilloscope } from './Oscilloscope';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof Oscilloscope> = {
  title: 'RichWidgets/Oscilloscope',
  component: Oscilloscope,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Oscilloscope>;

export const Default: Story = {
  decorators: [fullscreenDecorator],
};

export const SquareWave: Story = {
  args: {
    initialWaveform: 'square',
  },
  decorators: [fullscreenDecorator],
};

export const Paused: Story = {
  args: {
    autoStart: false,
  },
  decorators: [fullscreenDecorator],
};

export const LargeCanvas: Story = {
  args: {
    canvasWidth: 800,
    canvasHeight: 500,
  },
  decorators: [fullscreenDecorator],
};

export const TriangleWave: Story = {
  args: {
    initialWaveform: 'triangle',
  },
  decorators: [fullscreenDecorator],
};

export const NoiseWave: Story = {
  args: {
    initialWaveform: 'noise',
  },
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  args: {
    canvasWidth: 420,
    canvasHeight: 240,
    initialWaveform: 'sawtooth',
  },
  decorators: [fixedFrameDecorator(760, 420)],
};
