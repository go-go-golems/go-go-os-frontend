import type { Meta, StoryObj } from '@storybook/react';
import { SystemModeler } from './SystemModeler';
import { INITIAL_BLOCKS, INITIAL_WIRES } from './sampleData';
import { fixedFrameDecorator } from '../storybook/frameDecorators';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof SystemModeler> = {
  title: 'RichWidgets/SystemModeler',
  component: SystemModeler,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof SystemModeler>;

const denseBlocks = [
  ...INITIAL_BLOCKS,
  { id: 'b4', type: 'sum', label: 'Sum', emoji: '➕', x: 260, y: 260, w: 100, h: 60, inputs: 2, outputs: 1 },
  { id: 'b5', type: 'gain', label: 'Gain 2', emoji: '✖️', x: 470, y: 260, w: 100, h: 60, inputs: 1, outputs: 1 },
  { id: 'b6', type: 'scope', label: 'Scope B', emoji: '📺', x: 670, y: 260, w: 110, h: 60, inputs: 1, outputs: 0 },
];

const denseWires = [
  ...INITIAL_WIRES,
  { id: 'w3', from: 'b1', fromPort: 0, to: 'b4', toPort: 0 },
  { id: 'w4', from: 'b2', fromPort: 0, to: 'b4', toPort: 1 },
  { id: 'w5', from: 'b4', fromPort: 0, to: 'b5', toPort: 0 },
  { id: 'w6', from: 'b5', fromPort: 0, to: 'b6', toPort: 0 },
];

export const Default: Story = {
  args: {},
  decorators: [fixedFrameDecorator(960, 600)],
};

export const Compact: Story = {
  args: {},
  decorators: [fixedFrameDecorator(700, 440)],
};

export const EmptyCanvas: Story = {
  args: {
    initialBlocks: [],
    initialWires: [],
  },
  decorators: [fixedFrameDecorator(960, 600)],
};

export const DenseCanvas: Story = {
  args: {
    initialBlocks: denseBlocks,
    initialWires: denseWires,
  },
  decorators: [fixedFrameDecorator(1100, 680)],
};

export const SignalChain: Story = {
  args: {
    initialBlocks: INITIAL_BLOCKS,
    initialWires: INITIAL_WIRES,
  },
  decorators: [fixedFrameDecorator(960, 600)],
};
