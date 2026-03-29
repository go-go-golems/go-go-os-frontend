import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { DeepResearch } from './DeepResearch';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import {
  createDeepResearchStateSeed,
  DEEP_RESEARCH_STATE_KEY,
  deepResearchActions,
  deepResearchReducer,
} from './deepResearchState';
import '@go-go-golems/os-widgets/theme';

const meta: Meta<typeof DeepResearch> = {
  title: 'RichWidgets/DeepResearch',
  component: DeepResearch,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof DeepResearch>;

function createDeepResearchStoryStore() {
  return configureStore({
    reducer: {
      [DEEP_RESEARCH_STATE_KEY]: deepResearchReducer,
    },
  });
}

type DeepResearchStoryStore = ReturnType<typeof createDeepResearchStoryStore>;
type DeepResearchSeedStore = SeedStore<DeepResearchStoryStore>;

function renderWithStore(
  seedStore: DeepResearchSeedStore,
  options: { height?: string | number } = {},
) {
  return () => (
    <SeededStoreProvider
      createStore={createDeepResearchStoryStore}
      seedStore={seedStore}
    >
      <div style={{ height: options.height ?? '100vh' }}>
        <DeepResearch />
      </div>
    </SeededStoreProvider>
  );
}

function renderSeededStory(
  seed: Parameters<typeof createDeepResearchStateSeed>[0],
  options: { height?: string | number } = {},
) {
  return renderWithStore((store) => {
    store.dispatch(
      deepResearchActions.replaceState(createDeepResearchStateSeed(seed)),
    );
  }, options);
}

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
  render: renderSeededStory({}),
  decorators: [fullscreenDecorator],
};

export const WithResults: Story = {
  render: renderSeededStory({
    query: 'History of cooperative AI systems',
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
    progress: 55,
  }),
  decorators: [fullscreenDecorator],
};

export const Compact: Story = {
  render: renderSeededStory({}),
  decorators: [fixedFrameDecorator(700, 400)],
};

export const SourcesOnly: Story = {
  render: renderSeededStory({
    query: 'Retrieval evaluation techniques',
    initialSteps: sourceHeavySteps,
    progress: 60,
  }),
  decorators: [fullscreenDecorator],
};

export const ResearchTrail: Story = {
  render: renderSeededStory({
    query: 'Model deployment risk register',
    initialSteps: longTrailSteps,
    progress: 82,
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxResearching: Story = {
  render: renderSeededStory({
    query: 'Migration strategy for multi-window widget state',
    initialSteps: longTrailSteps.slice(0, 4),
    isResearching: true,
    progress: 42,
    depthLevel: 'thorough',
    webSearch: true,
    academicOnly: false,
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxReportReady: Story = {
  render: renderSeededStory({
    query: 'Agentic retrieval system design',
    initialSteps: [...sourceHeavySteps, { type: 'done' }],
    progress: 100,
    report: 'Detailed report body.\n\n- Finding one\n- Finding two\n\nConclusion: rollout is viable.',
    depthLevel: 'thorough',
    academicOnly: true,
  }),
  decorators: [fullscreenDecorator],
};
