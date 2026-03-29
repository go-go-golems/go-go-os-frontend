import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { MacCalc } from './MacCalc';
import { createSampleCells } from './sampleData';
import { cellId } from './types';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import {
  createMacCalcStateSeed,
  MAC_CALC_STATE_KEY,
  macCalcActions,
  macCalcReducer,
} from './macCalcState';
import '@go-go-golems/os-widgets/theme';

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

function createMacCalcStoryStore() {
  return configureStore({
    reducer: {
      [MAC_CALC_STATE_KEY]: macCalcReducer,
    },
  });
}

type MacCalcStoryStore = ReturnType<typeof createMacCalcStoryStore>;
type MacCalcSeedStore = SeedStore<MacCalcStoryStore>;

function renderWithStore(
  seedStore: MacCalcSeedStore,
  height: string | number = '100vh',
) {
  return () => (
    <SeededStoreProvider
      createStore={createMacCalcStoryStore}
      seedStore={seedStore}
    >
      <div style={{ height }}>
        <MacCalc />
      </div>
    </SeededStoreProvider>
  );
}

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

export const ReduxFindResults: Story = {
  render: renderWithStore((store) => {
    store.dispatch(
      macCalcActions.replaceState(
        createMacCalcStateSeed({
          initialCells: denseCells,
          showFind: true,
          findQuery: 'Total',
          sel: { r: 1, c: 5 },
        }),
      ),
    );
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxPaletteOpen: Story = {
  render: renderWithStore((store) => {
    store.dispatch(
      macCalcActions.replaceState(
        createMacCalcStateSeed({
          initialCells: formulaGrid,
          showPalette: true,
          sel: { r: 2, c: 2 },
        }),
      ),
    );
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxEditingFormula: Story = {
  render: renderWithStore((store) => {
    store.dispatch(
      macCalcActions.replaceState(
        createMacCalcStateSeed({
          initialCells: formulaGrid,
          sel: { r: 3, c: 5 },
          editing: true,
          editVal: '=SUM(B4:F4)',
          selRange: { r1: 3, c1: 1, r2: 3, c2: 5 },
        }),
      ),
    );
  }, 420),
  decorators: [fixedFrameDecorator(760, 420)],
};
