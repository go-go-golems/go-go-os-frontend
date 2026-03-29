import type { Meta, StoryObj } from '@storybook/react';
import { EventViewerWindow } from './EventViewerWindow';
import type { EventLogEntry } from './eventBus';

const meta: Meta<typeof EventViewerWindow> = {
  title: 'ChatRuntime/Debug/EventViewerWindow',
  component: EventViewerWindow,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ width: 760, height: 520, background: '#fff', color: '#333' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof EventViewerWindow>;

let seq = 0;
function makeEntry(type: string, overrides: Partial<EventLogEntry> = {}): EventLogEntry {
  seq += 1;
  const dot = type.indexOf('.');
  const family =
    dot >= 0 && ['llm', 'tool', 'hypercard', 'timeline', 'ws'].includes(type.slice(0, dot))
      ? type.slice(0, dot)
      : 'other';
  return {
    id: `story-evt-${seq}`,
    timestamp: Date.now() - (100 - seq) * 1000,
    eventType: type,
    eventId: `evt-${seq}`,
    family,
    summary: overrides.summary ?? type,
    rawPayload: overrides.rawPayload ?? {
      sem: true,
      event: { type, id: `evt-${seq}`, data: { example: 'payload' } },
    },
    ...overrides,
  };
}

export const Empty: Story = {
  args: {
    conversationId: 'story-empty',
    initialEntries: [],
  },
};

export const MixedEvents: Story = {
  args: {
    conversationId: 'story-mixed',
    initialEntries: [
      makeEntry('llm.start', { summary: 'inference started' }),
      makeEntry('llm.delta', { summary: '+12 chars (12 total)' }),
      makeEntry('tool.start', { summary: 'start inventory.lookup' }),
      makeEntry('tool.result', { summary: 'tool result' }),
      makeEntry('timeline.upsert', { summary: 'upsert hypercard_widget' }),
      makeEntry('hypercard.suggestions.v1', { summary: 'suggestions update' }),
      makeEntry('llm.final', { summary: 'inference complete' }),
    ],
  },
};

export const HighVolume: Story = {
  args: {
    conversationId: 'story-high-volume',
    initialEntries: Array.from({ length: 150 }, (_, i) => {
      const types = ['llm.delta', 'llm.delta', 'tool.start', 'tool.result', 'timeline.upsert'];
      const type = types[i % types.length];
      return makeEntry(type, { summary: `Event ${i + 1}: ${type}` });
    }),
  },
};
