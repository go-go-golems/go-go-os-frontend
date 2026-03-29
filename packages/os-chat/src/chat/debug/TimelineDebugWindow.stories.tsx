import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { TimelineDebugWindow } from './TimelineDebugWindow';
import { buildTimelineDebugSnapshot, type TimelineDebugSnapshot } from './timelineDebugModel';
import type { ConversationTimelineState, TimelineEntity } from '../state/timelineSlice';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let seq = 0;
function makeEntity(kind: string, propsOverrides: Record<string, unknown> = {}): TimelineEntity {
  seq += 1;
  const id = `${kind}-${seq}`;
  return {
    id,
    kind,
    createdAt: Date.now() - (200 - seq) * 1000,
    updatedAt: Date.now() - (200 - seq) * 500,
    version: seq,
    props: {
      content: `Example ${kind} content #${seq}`,
      ...propsOverrides,
    },
  };
}

function makeConvState(entities: TimelineEntity[]): ConversationTimelineState {
  const byId: Record<string, TimelineEntity> = {};
  const order: string[] = [];
  for (const e of entities) {
    byId[e.id] = e;
    order.push(e.id);
  }
  return { byId, order };
}

function makeSnapshot(convId: string, entities: TimelineEntity[]): TimelineDebugSnapshot {
  return buildTimelineDebugSnapshot(convId, makeConvState(entities));
}

// Minimal Redux store for stories that need it (empty timeline)
function makeMinimalStore() {
  return configureStore({
    reducer: {
      timeline: (_state = { byConvId: {} }) => ({ byConvId: {} }),
      chatSession: (_state = { byConvId: {} }) => ({ byConvId: {} }),
    },
  });
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof TimelineDebugWindow> = {
  title: 'ChatRuntime/Debug/TimelineDebugWindow',
  component: TimelineDebugWindow,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Provider store={makeMinimalStore()}>
        <div style={{ width: 860, height: 520, background: '#fff', color: '#333' }}>
          <Story />
        </div>
      </Provider>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof TimelineDebugWindow>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Empty: Story = {
  args: {
    conversationId: 'story-empty',
    initialSnapshot: makeSnapshot('story-empty', []),
  },
};

export const MixedEntities: Story = {
  args: {
    conversationId: 'story-mixed',
    initialSnapshot: makeSnapshot('story-mixed', [
      makeEntity('message', { role: 'user', content: 'What running shoes do you have?' }),
      makeEntity('message', { role: 'assistant', content: 'Let me check the inventory for you.' }),
      makeEntity('tool_call', { name: 'inventory.lookup', args: { query: 'running shoes' } }),
      makeEntity('tool_result', { toolCallId: 'tool_call-3', result: { items: ['Nike Air', 'Adidas Ultra'] } }),
      makeEntity('hypercard_widget', {
        template: 'product-list',
        title: 'Running Shoes',
        itemId: 'widget-5',
        artifactId: 'art-1',
        status: 'success',
      }),
      makeEntity('message', { role: 'assistant', content: 'Here are the running shoes I found.' }),
      makeEntity('suggestions', { source: 'assistant', items: ['Tell me more about Nike Air', 'Compare prices'] }),
    ]),
  },
};

export const DeeplyNested: Story = {
  args: {
    conversationId: 'story-nested',
    initialSnapshot: makeSnapshot('story-nested', [
      makeEntity('message', {
        role: 'assistant',
        content: 'Complex payload',
        metadata: {
          model: 'claude-opus-4-6',
          usage: { inputTokens: 1200, outputTokens: 450, cacheRead: 800 },
          timing: { firstToken: 120, totalMs: 3400 },
          tags: ['debug', 'test'],
        },
        annotations: [
          { type: 'citation', start: 0, end: 10, source: { url: 'https://example.com' } },
          { type: 'highlight', start: 12, end: 20, color: 'yellow' },
        ],
      }),
    ]),
  },
};

export const HighVolume: Story = {
  args: {
    conversationId: 'story-high-volume',
    initialSnapshot: makeSnapshot(
      'story-high-volume',
      Array.from({ length: 120 }, (_, i) => {
        const kinds = ['message', 'message', 'tool_call', 'tool_result', 'hypercard_widget'];
        const kind = kinds[i % kinds.length];
        return makeEntity(kind, { content: `Entity ${i + 1} of kind ${kind}`, index: i });
      }),
    ),
  },
};

export const SuggestionsOnly: Story = {
  args: {
    conversationId: 'story-suggestions',
    initialSnapshot: makeSnapshot('story-suggestions', [
      makeEntity('suggestions', { source: 'starter', items: ['Hello', 'What can you do?', 'Help me with inventory'] }),
    ]),
  },
};
