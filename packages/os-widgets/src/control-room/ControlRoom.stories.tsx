import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { ControlRoom } from './ControlRoom';
import { fixedFrameDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import {
  CONTROL_ROOM_STATE_KEY,
  controlRoomActions,
  controlRoomReducer,
  createControlRoomStateSeed,
} from './controlRoomState';
import '@go-go-golems/os-widgets/theme';

const meta: Meta<typeof ControlRoom> = {
  title: 'RichWidgets/ControlRoom',
  component: ControlRoom,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof ControlRoom>;

function createControlRoomStoryStore() {
  return configureStore({
    reducer: {
      [CONTROL_ROOM_STATE_KEY]: controlRoomReducer,
    },
  });
}

type ControlRoomStoryStore = ReturnType<typeof createControlRoomStoryStore>;
type ControlRoomSeedStore = SeedStore<ControlRoomStoryStore>;

function renderWithStore(seedStore: ControlRoomSeedStore, props?: ComponentProps<typeof ControlRoom>) {
  return () => (
    <SeededStoreProvider createStore={createControlRoomStoryStore} seedStore={seedStore}>
      <ControlRoom {...props} />
    </SeededStoreProvider>
  );
}

function renderSeededStory(
  seed: Parameters<typeof createControlRoomStateSeed>[0],
  props?: ComponentProps<typeof ControlRoom>,
) {
  return renderWithStore((store) => {
    store.dispatch(controlRoomActions.replaceState(createControlRoomStateSeed(seed)));
  }, props);
}

export const Default: Story = {
  render: renderSeededStory({}),
  decorators: [fixedFrameDecorator(960, 700)],
};

export const Compact: Story = {
  render: renderSeededStory(
    { tick: 14, knobVal: 48, knob2: 62 },
    { tickInterval: 500 },
  ),
  decorators: [fixedFrameDecorator(720, 500)],
};

export const AlarmArmed: Story = {
  render: renderSeededStory({
    tick: 21,
    switches: { aux: true, alarm: true },
    knobVal: 82,
    knob2: 64,
    logs: [
      { time: '00:00:08', msg: 'WARN: Pressure approaching limit', type: 'warn' },
      { time: '00:00:10', msg: 'NET: Packet loss detected (0.2%)', type: 'warn' },
    ],
  }),
  decorators: [fixedFrameDecorator(960, 700)],
};

export const PausedConsole: Story = {
  render: renderSeededStory({
    tick: 35,
    running: false,
    switches: { main: true, pump: true, alarm: false },
    scopeData: Array.from({ length: 80 }, (_, index) => Math.sin(index * 0.2) * 0.6),
    logs: [
      { time: '00:00:12', msg: 'SYS: Checkpoint saved', type: 'ok' },
      { time: '00:00:14', msg: 'THERM: Coolant temp within range', type: 'ok' },
    ],
  }),
  decorators: [fixedFrameDecorator(960, 700)],
};

export const WideConsole: Story = {
  render: renderSeededStory({ tick: 42, knobVal: 75, knob2: 58 }),
  decorators: [fixedFrameDecorator(1200, 760)],
};
