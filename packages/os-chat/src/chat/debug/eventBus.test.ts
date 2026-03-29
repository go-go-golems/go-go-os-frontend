import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearConversationEventHistory,
  emitConversationEvent,
  getConversationEvents,
  subscribeConversationEvents,
  type EventLogEntry,
} from './eventBus';
import type { SemEnvelope } from '../sem/semRegistry';

function envelope(type: string, id: string, data: Record<string, unknown> = {}): SemEnvelope {
  return {
    sem: true,
    event: { type, id, data },
  };
}

describe('eventBus', () => {
  beforeEach(() => {
    clearConversationEventHistory('bus-test-1');
    clearConversationEventHistory('bus-iso-1');
    clearConversationEventHistory('bus-iso-2');
    clearConversationEventHistory('bus-unsub');
    clearConversationEventHistory('bus-family');
    clearConversationEventHistory('bus-history');
    clearConversationEventHistory('bus-clear');
  });

  it('delivers events to subscribers', () => {
    const received: EventLogEntry[] = [];
    const unsub = subscribeConversationEvents('bus-test-1', (e) => received.push(e));

    emitConversationEvent('bus-test-1', envelope('llm.start', 'e1'));

    expect(received).toHaveLength(1);
    expect(received[0].eventType).toBe('llm.start');
    expect(received[0].family).toBe('llm');
    expect(received[0].summary).toBe('inference started');
    unsub();
  });

  it('isolates conversations', () => {
    const received: EventLogEntry[] = [];
    const unsub = subscribeConversationEvents('bus-iso-1', (e) => received.push(e));

    emitConversationEvent('bus-iso-2', envelope('tool.start', 't1', { name: 'lookup' }));

    expect(received).toHaveLength(0);
    unsub();
  });

  it('stops delivering after unsubscribe', () => {
    const received: EventLogEntry[] = [];
    const unsub = subscribeConversationEvents('bus-unsub', (e) => received.push(e));

    emitConversationEvent('bus-unsub', envelope('llm.delta', 'd1'));
    expect(received).toHaveLength(1);

    unsub();
    emitConversationEvent('bus-unsub', envelope('llm.final', 'f1'));
    expect(received).toHaveLength(1);
  });

  it('classifies event families correctly', () => {
    const received: EventLogEntry[] = [];
    const unsub = subscribeConversationEvents('bus-family', (e) => received.push(e));

    const types = ['tool.start', 'hypercard.ready', 'timeline.upsert', 'ws.error', 'custom.thing'];
    for (const type of types) {
      emitConversationEvent('bus-family', envelope(type, `id-${type}`));
    }

    expect(received.map((e) => e.family)).toEqual(['tool', 'hypercard', 'timeline', 'ws', 'other']);
    unsub();
  });

  it('retains emitted events for late viewers even when no subscriber is present', () => {
    emitConversationEvent('bus-history', envelope('llm.start', 'h1'));
    emitConversationEvent('bus-history', envelope('llm.delta', 'h2', { delta: 'abc', cumulative: 'abc' }));

    const history = getConversationEvents('bus-history');
    expect(history).toHaveLength(2);
    expect(history[0].eventType).toBe('llm.start');
    expect(history[1].eventType).toBe('llm.delta');
  });

  it('can clear retained event history by conversation', () => {
    emitConversationEvent('bus-clear', envelope('tool.start', 'c1', { name: 'lookup' }));
    expect(getConversationEvents('bus-clear')).toHaveLength(1);

    clearConversationEventHistory('bus-clear');
    expect(getConversationEvents('bus-clear')).toHaveLength(0);
  });

  it('caps retained history to bounded size', () => {
    for (let i = 0; i < 1010; i += 1) {
      emitConversationEvent('bus-history', envelope('llm.delta', `cap-${i}`, { delta: 'a', cumulative: 'a' }));
    }

    const history = getConversationEvents('bus-history');
    expect(history).toHaveLength(1000);
    expect(history[0].eventId).toBe('cap-10');
    expect(history[999].eventId).toBe('cap-1009');
  });
});
