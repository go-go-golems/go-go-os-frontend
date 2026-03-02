import type { Meta, StoryObj } from '@storybook/react';
import { DeepResearch } from './DeepResearch';
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
      <div style={{ height: 400, width: 700 }}>
        <Story />
      </div>
    ),
  ],
};
