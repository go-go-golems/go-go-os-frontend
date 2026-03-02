import type { Meta, StoryObj } from '@storybook/react';
import { MacCalendar } from './MacCalendar';
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

export const Default: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const WeekView: Story = {
  args: {
    initialView: 'week',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  args: {
    initialEvents: [],
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const EmptyWeek: Story = {
  args: {
    initialEvents: [],
    initialView: 'week',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const Compact: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div style={{ height: 400, width: 600 }}>
        <Story />
      </div>
    ),
  ],
};
