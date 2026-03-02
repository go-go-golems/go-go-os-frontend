import type { Meta, StoryObj } from '@storybook/react';
import { GraphNavigator } from './GraphNavigator';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof GraphNavigator> = {
  title: 'RichWidgets/GraphNavigator',
  component: GraphNavigator,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof GraphNavigator>;

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

export const Compact: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div style={{ height: 500, width: 800 }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  args: {
    initialNodes: [],
    initialEdges: [],
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const PersonsOnly: Story = {
  args: {
    initialNodes: [
      { id: 'n1', label: 'Alice', type: 'Person', props: { age: 32, role: 'Engineer' } },
      { id: 'n2', label: 'Bob', type: 'Person', props: { age: 28, role: 'Designer' } },
      { id: 'n3', label: 'Carol', type: 'Person', props: { age: 45, role: 'CTO' } },
    ],
    initialEdges: [
      { source: 'n1', target: 'n2', label: 'KNOWS' },
      { source: 'n2', target: 'n3', label: 'REPORTS_TO' },
      { source: 'n3', target: 'n1', label: 'KNOWS' },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};
