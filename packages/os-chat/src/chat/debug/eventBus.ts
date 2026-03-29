import type { SemEnvelope } from '../sem/semRegistry';

export interface EventLogEntry {
  id: string;
  timestamp: number;
  eventType: string;
  eventId: string;
  family: string;
  summary: string;
  rawPayload: unknown;
}

type Listener = (entry: EventLogEntry) => void;

const busMap = new Map<string, Set<Listener>>();
const historyMap = new Map<string, EventLogEntry[]>();
const MAX_EVENT_HISTORY = 1000;
let seqCounter = 0;

function nextSeq() {
  seqCounter += 1;
  return `evt-${seqCounter}`;
}

function eventFamily(type: string): string {
  const dot = type.indexOf('.');
  if (dot < 0) return 'other';
  const prefix = type.slice(0, dot);
  if (['llm', 'tool', 'hypercard', 'timeline', 'ws'].includes(prefix)) return prefix;
  return 'other';
}

function summarize(type: string, data: Record<string, unknown>): string {
  if (type === 'llm.delta') {
    const delta = typeof data.delta === 'string' ? data.delta : '';
    const cumulativeLength = typeof data.cumulative === 'string' ? data.cumulative.length : 0;
    if (cumulativeLength > 0) return `+${delta.length} chars (${cumulativeLength} total)`;
    if (delta.length > 0) return `+${delta.length} chars`;
    return 'delta';
  }
  if (type === 'llm.start') return 'inference started';
  if (type === 'llm.final') return 'inference complete';
  if (type === 'tool.start') {
    const name = typeof data.name === 'string' ? data.name : 'tool';
    return `start ${name}`;
  }
  if (type === 'tool.done') return 'tool done';
  if (type === 'tool.result') return 'tool result';
  if (type === 'tool.delta') return 'tool delta';
  if (type.startsWith('hypercard.suggestions')) return 'suggestions';
  if (type === 'timeline.upsert') {
    const entity = data.entity as Record<string, unknown> | undefined;
    const kind = typeof entity?.kind === 'string' ? entity.kind : '';
    return kind ? `upsert ${kind}` : 'upsert';
  }
  if (type === 'ws.error') {
    const message = typeof data.message === 'string' ? data.message : 'error';
    return message.slice(0, 60);
  }
  return type;
}

export function emitConversationEvent(convId: string, envelope: SemEnvelope): void {
  const type = envelope.event?.type ?? 'unknown';
  const eventId = envelope.event?.id ?? '';
  const data = envelope.event?.data;
  const recordData =
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  const entry: EventLogEntry = {
    id: nextSeq(),
    timestamp: Date.now(),
    eventType: type,
    eventId,
    family: eventFamily(type),
    summary: summarize(type, recordData),
    rawPayload: envelope,
  };

  const history = historyMap.get(convId) ?? [];
  history.push(entry);
  if (history.length > MAX_EVENT_HISTORY) {
    history.splice(0, history.length - MAX_EVENT_HISTORY);
  }
  historyMap.set(convId, history);

  const listeners = busMap.get(convId);
  if (!listeners || listeners.size === 0) return;

  for (const listener of listeners) {
    listener(entry);
  }
}

export function subscribeConversationEvents(convId: string, callback: Listener): () => void {
  if (!busMap.has(convId)) {
    busMap.set(convId, new Set());
  }
  busMap.get(convId)?.add(callback);

  return () => {
    busMap.get(convId)?.delete(callback);
    if (busMap.get(convId)?.size === 0) {
      busMap.delete(convId);
    }
  };
}

export function getConversationEvents(convId: string): EventLogEntry[] {
  return [...(historyMap.get(convId) ?? [])];
}

export function clearConversationEventHistory(convId: string): void {
  historyMap.delete(convId);
}
