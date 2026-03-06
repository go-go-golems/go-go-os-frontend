import type { Meta, StoryObj } from '@storybook/react';
import { MacCalc } from './MacCalc';
import { createSampleCells } from './sampleData';
import { cellId } from './types';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof MacCalc> = {
  title: 'RichWidgets/MacCalc',
  component: MacCalc,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MacCalc>;

const formulaGrid = createSampleCells();
const denseCells = {
  ...createSampleCells(),
  ...Object.fromEntries(
    Array.from({ length: 12 }, (_, rowOffset) =>
      Array.from({ length: 5 }, (_, colOffset) => [
        cellId(rowOffset + 8, colOffset + 1),
        {
          raw: String((rowOffset + 2) * (colOffset + 3) * 11),
          fmt: 'number' as const,
          bold: false,
          italic: false,
          align: 'right' as const,
        },
      ]),
    ).flat(),
  ),
  [cellId(8, 0)]: { raw: 'April', fmt: 'plain', bold: true, italic: false, align: 'left' },
  [cellId(9, 0)]: { raw: 'May', fmt: 'plain', bold: true, italic: false, align: 'left' },
  [cellId(10, 0)]: { raw: 'June', fmt: 'plain', bold: true, italic: false, align: 'left' },
  [cellId(11, 0)]: { raw: 'July', fmt: 'plain', bold: true, italic: false, align: 'left' },
  [cellId(12, 0)]: { raw: 'August', fmt: 'plain', bold: true, italic: false, align: 'left' },
  [cellId(13, 0)]: { raw: 'September', fmt: 'plain', bold: true, italic: false, align: 'left' },
  [cellId(14, 0)]: { raw: 'October', fmt: 'plain', bold: true, italic: false, align: 'left' },
};

export const Default: Story = {
  args: {},
  decorators: [fullscreenDecorator],
};

export const Empty: Story = {
  args: {
    initialCells: {},
  },
  decorators: [fullscreenDecorator],
};

export const FormulaGrid: Story = {
  args: {
    initialCells: formulaGrid,
  },
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  args: {},
  decorators: [fixedFrameDecorator(700, 400)],
};

export const DenseSheet: Story = {
  args: {
    initialCells: denseCells,
  },
  decorators: [fullscreenDecorator],
};
