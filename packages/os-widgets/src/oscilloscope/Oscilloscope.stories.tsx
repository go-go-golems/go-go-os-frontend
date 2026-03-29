import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import { Oscilloscope } from './Oscilloscope';
import {
  createOscilloscopeStateSeed,
  oscilloscopeActions,
  oscilloscopeReducer,
  OSCILLOSCOPE_STATE_KEY,
} from './oscilloscopeState';
import '@go-go-golems/os-widgets/theme';

const meta: Meta<typeof Oscilloscope> = {
  title: 'RichWidgets/Oscilloscope',
  component: Oscilloscope,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Oscilloscope>;

function createOscilloscopeStoryStore() {
  return configureStore({
    reducer: {
      [OSCILLOSCOPE_STATE_KEY]: oscilloscopeReducer,
    },
  });
}

type OscilloscopeStoryStore = ReturnType<typeof createOscilloscopeStoryStore>;
type OscilloscopeSeedStore = SeedStore<OscilloscopeStoryStore>;

function renderWithStore(seedStore: OscilloscopeSeedStore, props?: ComponentProps<typeof Oscilloscope>) {
  return () => (
    <SeededStoreProvider createStore={createOscilloscopeStoryStore} seedStore={seedStore}>
      <Oscilloscope {...props} />
    </SeededStoreProvider>
  );
}

function renderSeededStory(
  seed: Parameters<typeof createOscilloscopeStateSeed>[0],
  props?: ComponentProps<typeof Oscilloscope>,
) {
  return renderWithStore((store) => {
    store.dispatch(oscilloscopeActions.replaceState(createOscilloscopeStateSeed(seed)));
  }, props);
}

export const Default: Story = {
  render: renderSeededStory({}),
  decorators: [fullscreenDecorator],
};

export const SquareWave: Story = {
  render: renderSeededStory({ waveform: 'square' }),
  decorators: [fullscreenDecorator],
};

export const Paused: Story = {
  render: renderSeededStory({ running: false }),
  decorators: [fullscreenDecorator],
};

export const LargeCanvas: Story = {
  render: renderSeededStory({}, { canvasWidth: 800, canvasHeight: 500 }),
  decorators: [fullscreenDecorator],
};

export const TriangleWave: Story = {
  render: renderSeededStory({ waveform: 'triangle' }),
  decorators: [fullscreenDecorator],
};

export const NoiseWave: Story = {
  render: renderSeededStory({ waveform: 'noise', phosphor: false, thickness: 3 }),
  decorators: [fullscreenDecorator],
};

export const DualChannel: Story = {
  render: renderSeededStory({
    waveform: 'sawtooth',
    channel2: true,
    ch2Freq: 7.5,
    ch2Amp: 60,
    triggerLevel: 18,
  }),
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  render: renderSeededStory({ waveform: 'sawtooth' }, { canvasWidth: 420, canvasHeight: 240 }),
  decorators: [fixedFrameDecorator(760, 420)],
};
