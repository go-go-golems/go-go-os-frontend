import { describe, expect, it } from 'vitest';
import type { ConversationTimelineState, TimelineEntity } from '../state/timelineSlice';
import {
  buildConversationYamlForCopy,
  buildEntityYamlForCopy,
  buildTimelineDebugSnapshot,
  buildTimelineYamlExport,
  sanitizeForExport,
} from './timelineDebugModel';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEntity(id: string, kind: string, props: unknown = {}): TimelineEntity {
  return { id, kind, createdAt: 1700000000000, updatedAt: 1700000001000, version: 1, props };
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

// ---------------------------------------------------------------------------
// sanitizeForExport
// ---------------------------------------------------------------------------

describe('sanitizeForExport', () => {
  it('passes through plain JSON values', () => {
    expect(sanitizeForExport(null)).toBe(null);
    expect(sanitizeForExport(42)).toBe(42);
    expect(sanitizeForExport('hello')).toBe('hello');
    expect(sanitizeForExport(true)).toBe(true);
    expect(sanitizeForExport(undefined)).toBe(undefined);
  });

  it('converts Date to ISO string', () => {
    const d = new Date('2026-02-21T12:00:00Z');
    expect(sanitizeForExport(d)).toBe('2026-02-21T12:00:00.000Z');
  });

  it('converts BigInt to labeled string', () => {
    expect(sanitizeForExport(BigInt(42))).toBe('[BigInt: 42]');
  });

  it('converts functions to labeled string', () => {
    function myFunc() {}
    expect(sanitizeForExport(myFunc)).toBe('[Function: myFunc]');
    expect(sanitizeForExport(() => {})).toMatch(/\[Function:/);
  });

  it('handles circular references', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    const result = sanitizeForExport(obj) as Record<string, unknown>;
    expect(result.a).toBe(1);
    expect(result.self).toBe('[Circular]');
  });

  it('respects max depth', () => {
    let nested: unknown = 'leaf';
    for (let i = 0; i < 30; i++) {
      nested = { child: nested };
    }
    const result = JSON.stringify(sanitizeForExport(nested));
    expect(result).toContain('[max depth]');
  });

  it('sanitizes arrays recursively', () => {
    const input = [1, BigInt(2), 'three'];
    const result = sanitizeForExport(input) as unknown[];
    expect(result).toEqual([1, '[BigInt: 2]', 'three']);
  });

  it('converts RegExp and Error', () => {
    expect(sanitizeForExport(/abc/gi)).toBe('/abc/gi');
    expect(sanitizeForExport(new Error('boom'))).toBe('[Error: boom]');
  });

  it('converts symbols', () => {
    expect(sanitizeForExport(Symbol('test'))).toBe('[Symbol: Symbol(test)]');
  });
});

// ---------------------------------------------------------------------------
// buildTimelineDebugSnapshot
// ---------------------------------------------------------------------------

describe('buildTimelineDebugSnapshot', () => {
  it('creates snapshot from empty conversation', () => {
    const convState = makeConvState([]);
    const snap = buildTimelineDebugSnapshot('conv-1', convState, Date.UTC(2026, 1, 21, 12, 0, 0));
    expect(snap.conversationId).toBe('conv-1');
    expect(snap.exportedAt).toBe('2026-02-21T12:00:00.000Z');
    expect(snap.summary.entityCount).toBe(0);
    expect(snap.summary.orderCount).toBe(0);
    expect(snap.summary.kinds).toEqual({});
    expect(snap.timeline.order).toEqual([]);
    expect(snap.timeline.entities).toEqual([]);
  });

  it('creates snapshot with mixed entity kinds', () => {
    const entities = [
      makeEntity('msg-1', 'message', { content: 'hello' }),
      makeEntity('msg-2', 'message', { content: 'world' }),
      makeEntity('tool-1', 'tool_call', { name: 'search' }),
    ];
    const convState = makeConvState(entities);
    const snap = buildTimelineDebugSnapshot('conv-2', convState);

    expect(snap.summary.entityCount).toBe(3);
    expect(snap.summary.orderCount).toBe(3);
    expect(snap.summary.kinds).toEqual({ message: 2, tool_call: 1 });
    expect(snap.timeline.entities).toHaveLength(3);
    expect(snap.timeline.entities[0].orderIndex).toBe(0);
    expect(snap.timeline.entities[2].orderIndex).toBe(2);
  });

  it('handles missing entity in order (orphan id)', () => {
    const convState: ConversationTimelineState = {
      byId: {},
      order: ['ghost-id'],
    };
    const snap = buildTimelineDebugSnapshot('conv-3', convState);
    expect(snap.timeline.entities).toHaveLength(1);
    expect(snap.timeline.entities[0].kind).toBe('<missing>');
  });

  it('sanitizes entity props', () => {
    const entities = [makeEntity('e1', 'message', { fn: () => 'nope', date: new Date('2026-01-01T00:00:00Z') })];
    const snap = buildTimelineDebugSnapshot('conv-4', makeConvState(entities));
    const props = snap.timeline.entities[0].props as Record<string, unknown>;
    expect(typeof props.fn).toBe('string');
    expect(props.date).toBe('2026-01-01T00:00:00.000Z');
  });
});

// ---------------------------------------------------------------------------
// Clipboard and export helpers
// ---------------------------------------------------------------------------

describe('buildEntityYamlForCopy', () => {
  it('produces YAML with entity fields', () => {
    const snap = buildTimelineDebugSnapshot('conv-x', makeConvState([makeEntity('e1', 'message', { text: 'hi' })]));
    const entity = snap.timeline.entities[0];
    const yaml = buildEntityYamlForCopy(entity, 'conv-x');
    expect(yaml).toContain('conversationId: conv-x');
    expect(yaml).toContain('id: e1');
    expect(yaml).toContain('kind: message');
    expect(yaml).toContain('text: hi');
  });

  it('omits conversationId when not provided', () => {
    const snap = buildTimelineDebugSnapshot('conv-y', makeConvState([makeEntity('e2', 'tool_call')]));
    const yaml = buildEntityYamlForCopy(snap.timeline.entities[0]);
    expect(yaml).not.toContain('conversationId');
  });
});

describe('buildConversationYamlForCopy', () => {
  it('produces YAML with full snapshot structure', () => {
    const snap = buildTimelineDebugSnapshot(
      'conv-z',
      makeConvState([makeEntity('e1', 'message')]),
      Date.UTC(2026, 1, 21, 12, 0, 0),
    );
    const yaml = buildConversationYamlForCopy(snap);
    expect(yaml).toContain('conversationId: conv-z');
    expect(yaml).toContain('entityCount: 1');
    expect(yaml).toContain('message: 1');
  });
});

describe('buildTimelineYamlExport', () => {
  it('generates file name and yaml content', () => {
    const snap = buildTimelineDebugSnapshot('conv-abc', makeConvState([]), Date.UTC(2026, 1, 21, 12, 30, 0));
    const out = buildTimelineYamlExport(snap);
    expect(out.fileName).toMatch(/^timeline-conv-abc-2026-02-21T12-30-00-000Z\.yaml$/);
    expect(out.yaml).toContain('conversationId: conv-abc');
  });

  it('sanitizes conversation id in filename', () => {
    const snap = buildTimelineDebugSnapshot('conv/with spaces!', makeConvState([]), Date.UTC(2026, 0, 1));
    const out = buildTimelineYamlExport(snap);
    expect(out.fileName).not.toMatch(/[/ !]/);
    expect(out.fileName).toContain('conv-with-spaces');
  });
});
