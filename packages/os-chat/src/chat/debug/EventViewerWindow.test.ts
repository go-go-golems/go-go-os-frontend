import { describe, expect, it } from 'vitest';
import {
  buildVisibleEventsYamlExport,
  filterVisibleEntries,
  isNearBottom,
  isEntryHiddenByEventType,
} from './EventViewerWindow';
import type { EventLogEntry } from './eventBus';

describe('EventViewerWindow auto-scroll threshold', () => {
  it('treats exact bottom as near-bottom', () => {
    expect(
      isNearBottom({
        scrollTop: 700,
        clientHeight: 300,
        scrollHeight: 1000,
      }),
    ).toBe(true);
  });

  it('treats positions within the threshold as near-bottom', () => {
    expect(
      isNearBottom({
        scrollTop: 672,
        clientHeight: 300,
        scrollHeight: 1000,
      }),
    ).toBe(true);
  });

  it('treats positions beyond the threshold as not near-bottom', () => {
    expect(
      isNearBottom({
        scrollTop: 667,
        clientHeight: 300,
        scrollHeight: 1000,
      }),
    ).toBe(false);
  });

  it('supports custom thresholds', () => {
    expect(
      isNearBottom({
        scrollTop: 650,
        clientHeight: 300,
        scrollHeight: 1000,
        thresholdPx: 60,
      }),
    ).toBe(true);

    expect(
      isNearBottom({
        scrollTop: 650,
        clientHeight: 300,
        scrollHeight: 1000,
        thresholdPx: 40,
      }),
    ).toBe(false);
  });
});

describe('EventViewerWindow event-type visibility filters', () => {
  it('hides only selected delta event kinds', () => {
    expect(
      isEntryHiddenByEventType('llm.delta', {
        hideLlmDelta: true,
        hideThinkingDelta: false,
      }),
    ).toBe(true);
    expect(
      isEntryHiddenByEventType('llm.thinking.delta', {
        hideLlmDelta: true,
        hideThinkingDelta: false,
      }),
    ).toBe(false);
    expect(
      isEntryHiddenByEventType('llm.thinking.delta', {
        hideLlmDelta: false,
        hideThinkingDelta: true,
      }),
    ).toBe(true);
  });

  it('filters visible entries by family and event-type toggles', () => {
    const entries: EventLogEntry[] = [
      {
        id: 'e1',
        timestamp: 1700000000001,
        eventType: 'llm.delta',
        eventId: 'evt-1',
        family: 'llm',
        summary: 'delta',
        rawPayload: { event: { type: 'llm.delta' } },
      },
      {
        id: 'e2',
        timestamp: 1700000000002,
        eventType: 'llm.thinking.delta',
        eventId: 'evt-2',
        family: 'llm',
        summary: 'thinking delta',
        rawPayload: { event: { type: 'llm.thinking.delta' } },
      },
      {
        id: 'e3',
        timestamp: 1700000000003,
        eventType: 'tool.result',
        eventId: 'evt-3',
        family: 'tool',
        summary: 'tool',
        rawPayload: { event: { type: 'tool.result' } },
      },
    ];

    const filters: Record<string, boolean> = {
      llm: true,
      tool: true,
      hypercard: true,
      timeline: true,
      ws: true,
      other: true,
    };

    const visible = filterVisibleEntries(entries, filters, {
      hideLlmDelta: true,
      hideThinkingDelta: false,
    });
    expect(visible.map((entry) => entry.id)).toEqual(['e2', 'e3']);

    const visibleNoLlmFamily = filterVisibleEntries(
      entries,
      { ...filters, llm: false },
      { hideLlmDelta: false, hideThinkingDelta: false },
    );
    expect(visibleNoLlmFamily.map((entry) => entry.id)).toEqual(['e3']);
  });
});

describe('EventViewerWindow YAML export', () => {
  it('builds a file name and yaml payload for visible events', () => {
    const visibleEntries: EventLogEntry[] = [
      {
        id: 'ev-1',
        timestamp: 1700000001234,
        eventType: 'tool.result',
        eventId: 'evt-result',
        family: 'tool',
        summary: 'tool result',
        rawPayload: {
          sem: true,
          event: { type: 'tool.result', id: 'evt-result', data: { ok: true } },
        },
      },
    ];

    const out = buildVisibleEventsYamlExport('conv-abc', visibleEntries, Date.UTC(2026, 1, 21, 12, 30, 0));
    expect(out.fileName).toMatch(/^events-conv-abc-2026-02-21T12-30-00-000Z\.yaml$/);
    expect(out.yaml).toContain('conversationId: conv-abc');
    expect(out.yaml).toContain('eventCount: 1');
    expect(out.yaml).toContain('eventType: tool.result');
    expect(out.yaml).toContain('summary: tool result');
  });
});
