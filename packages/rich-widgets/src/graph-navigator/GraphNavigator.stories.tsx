import type { Meta, StoryObj } from '@storybook/react';
import { GraphNavigator } from './GraphNavigator';
import { SAMPLE_EDGES, SAMPLE_NODES } from './sampleData';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
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

const denseNodes = [
  ...SAMPLE_NODES,
  ...Array.from({ length: 8 }, (_, index) => ({
    id: `dx-${index}`,
    label: `Service ${index + 1}`,
    type: index % 2 === 0 ? 'Project' : 'Company',
    props: {
      region: ['us-east', 'us-west', 'eu-central'][index % 3],
      owner: `Team ${index + 1}`,
      priority: ['P0', 'P1', 'P2'][index % 3],
    },
  })),
];

const denseEdges = [
  ...SAMPLE_EDGES,
  ...Array.from({ length: 8 }, (_, index) => ({
    source: SAMPLE_NODES[index % SAMPLE_NODES.length].id,
    target: `dx-${index}`,
    label: index % 2 === 0 ? 'DEPENDS_ON' : 'OWNS',
  })),
];

export const Default: Story = {
  args: {},
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  args: {},
  decorators: [fixedFrameDecorator(800, 500)],
};

export const Empty: Story = {
  args: {
    initialNodes: [],
    initialEdges: [],
  },
  decorators: [fullscreenDecorator],
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
  decorators: [fullscreenDecorator],
};

export const DenseGraph: Story = {
  args: {
    initialNodes: denseNodes,
    initialEdges: denseEdges,
  },
  decorators: [fullscreenDecorator],
};

export const CompanyProjectMap: Story = {
  args: {
    initialNodes: SAMPLE_NODES.filter((node) => node.type !== 'Person'),
    initialEdges: SAMPLE_EDGES.filter((edge) =>
      ['n3', 'n4', 'n5', 'n8', 'n9', 'n12'].includes(edge.source) ||
      ['n3', 'n4', 'n5', 'n8', 'n9', 'n12'].includes(edge.target),
    ),
  },
  decorators: [fullscreenDecorator],
};
