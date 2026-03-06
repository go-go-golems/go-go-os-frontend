import type { Meta, StoryObj } from '@storybook/react';
import { DeepResearch } from './DeepResearch';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof DeepResearch> = {
  title: 'RichWidgets/DeepResearch',
  component: DeepResearch,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof DeepResearch>;

const sourceHeavySteps = [
  {
    type: 'status' as const,
    text: 'Scoping query and identifying primary sources...',
  },
  {
    type: 'source' as const,
    title: 'Technical whitepaper',
    url: 'example.com/whitepaper',
    snippet: 'Primary source with architecture and benchmark details.',
  },
  {
    type: 'source' as const,
    title: 'Release notes',
    url: 'example.com/releases',
    snippet: 'Version timeline and compatibility constraints.',
  },
  {
    type: 'source' as const,
    title: 'Migration guide',
    url: 'example.com/migration',
    snippet: 'Operational guidance on rollout risk and edge cases.',
  },
];

const longTrailSteps = [
  { type: 'status' as const, text: 'Breaking the problem into sub-questions...' },
  { type: 'thinking' as const, text: 'First pass: collect baseline definitions and terminology.' },
  { type: 'source' as const, title: 'Overview memo', url: 'example.com/overview', snippet: 'Context-setting summary of the domain.' },
  { type: 'status' as const, text: 'Comparing implementation variants...' },
  { type: 'thinking' as const, text: 'The tradeoffs cluster around latency, reliability, and migration cost.' },
  { type: 'source' as const, title: 'Benchmark appendix', url: 'example.com/benchmarks', snippet: 'Measured results across representative workloads.' },
  { type: 'status' as const, text: 'Drafting final synthesis...' },
];

export const Default: Story = {
  args: {},
  decorators: [fullscreenDecorator],
};

export const WithResults: Story = {
  args: {
    initialSteps: [
      { type: 'status', text: 'Formulating research plan...' },
      { type: 'status', text: 'Searching: initial query analysis' },
      {
        type: 'source',
        title: 'Wikipedia \u2014 Overview',
        url: 'en.wikipedia.org/wiki/...',
        snippet: 'A comprehensive overview of the topic.',
      },
      {
        type: 'thinking',
        text: 'The initial sources suggest this topic has multiple facets.',
      },
      {
        type: 'source',
        title: 'Nature \u2014 Recent Study',
        url: 'nature.com/articles/...',
        snippet: 'Peer-reviewed research with new findings.',
      },
    ],
  },
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  args: {},
  decorators: [fixedFrameDecorator(700, 400)],
};

export const SourcesOnly: Story = {
  args: {
    initialSteps: sourceHeavySteps,
  },
  decorators: [fullscreenDecorator],
};

export const ResearchTrail: Story = {
  args: {
    initialSteps: longTrailSteps,
  },
  decorators: [fullscreenDecorator],
};
