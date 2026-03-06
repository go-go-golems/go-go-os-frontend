import type { Meta, StoryObj } from '@storybook/react';
import { MacCalendar } from './MacCalendar';
import { INITIAL_EVENTS } from './sampleData';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof MacCalendar> = {
  title: 'RichWidgets/MacCalendar',
  component: MacCalendar,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MacCalendar>;

const denseEvents = [
  ...INITIAL_EVENTS,
  ...Array.from({ length: 16 }, (_, index) => ({
    id: `dense-${index}`,
    title: `Planning block ${index + 1}`,
    date: new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      (index % 10) + 1,
      8 + (index % 8),
      (index % 4) * 15,
    ),
    duration: 30 + (index % 3) * 30,
    color: index % 5,
  })),
];

export const Default: Story = {
  args: {},
  decorators: [fullscreenDecorator],
};

export const WeekView: Story = {
  args: {
    initialView: 'week',
  },
  decorators: [fullscreenDecorator],
};

export const Empty: Story = {
  args: {
    initialEvents: [],
  },
  decorators: [fullscreenDecorator],
};

export const EmptyWeek: Story = {
  args: {
    initialEvents: [],
    initialView: 'week',
  },
  decorators: [fullscreenDecorator],
};

export const DenseMonth: Story = {
  args: {
    initialEvents: denseEvents,
  },
  decorators: [fullscreenDecorator],
};

export const DenseWeek: Story = {
  args: {
    initialEvents: denseEvents,
    initialView: 'week',
  },
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  args: {},
  decorators: [fixedFrameDecorator(600, 400)],
};
