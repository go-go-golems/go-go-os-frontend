import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import { LogicAnalyzer } from './LogicAnalyzer';
import {
  createLogicAnalyzerStateSeed,
  logicAnalyzerActions,
  logicAnalyzerReducer,
  LOGIC_ANALYZER_STATE_KEY,
} from './logicAnalyzerState';
import '@go-go-golems/os-widgets/theme';

const meta: Meta<typeof LogicAnalyzer> = {
  title: 'RichWidgets/LogicAnalyzer',
  component: LogicAnalyzer,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof LogicAnalyzer>;

function createLogicAnalyzerStoryStore() {
  return configureStore({
    reducer: {
      [LOGIC_ANALYZER_STATE_KEY]: logicAnalyzerReducer,
    },
  });
}

type LogicAnalyzerStoryStore = ReturnType<typeof createLogicAnalyzerStoryStore>;
type LogicAnalyzerSeedStore = SeedStore<LogicAnalyzerStoryStore>;

function renderWithStore(seedStore: LogicAnalyzerSeedStore, props?: ComponentProps<typeof LogicAnalyzer>) {
  return () => (
    <SeededStoreProvider createStore={createLogicAnalyzerStoryStore} seedStore={seedStore}>
      <LogicAnalyzer {...props} />
    </SeededStoreProvider>
  );
}

function renderSeededStory(
  seed: Parameters<typeof createLogicAnalyzerStateSeed>[0],
  props?: ComponentProps<typeof LogicAnalyzer>,
) {
  return renderWithStore((store) => {
    store.dispatch(logicAnalyzerActions.replaceState(createLogicAnalyzerStateSeed(seed)));
  }, props);
}

export const Default: Story = {
  render: renderSeededStory({}),
  decorators: [fullscreenDecorator],
};

export const Paused: Story = {
  render: renderSeededStory({
    autoStart: false,
  }),
  decorators: [fullscreenDecorator],
};

export const AllChannels: Story = {
  render: renderSeededStory({
    initialChannelCount: 8,
    protocol: 'SPI',
  }),
  decorators: [fullscreenDecorator],
};

export const TwoChannels: Story = {
  render: renderSeededStory({
    initialChannelCount: 2,
    triggerCh: 1,
  }),
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  render: renderSeededStory({ initialChannelCount: 4, zoom: 1.8 }, { canvasWidth: 400, canvasHeight: 220 }),
  decorators: [fixedFrameDecorator(760, 400)],
};

export const SingleChannel: Story = {
  render: renderSeededStory({
    initialChannelCount: 1,
    showEdges: false,
  }),
  decorators: [fullscreenDecorator],
};

export const WideCanvas: Story = {
  render: renderSeededStory({
    initialChannelCount: 8,
    busView: true,
    protocol: 'UART',
  }, { canvasWidth: 860, canvasHeight: 360 }),
  decorators: [fullscreenDecorator],
};
