/**
 * Timeline debug snapshot model and export helpers.
 *
 * Builds a structured, serializable snapshot from Redux timeline state
 * for display in the TimelineDebugWindow and for clipboard/YAML export.
 */

import type { ConversationTimelineState, TimelineEntity } from '../state/timelineSlice';
import { toYaml } from './yamlFormat';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimelineDebugEntitySnapshot {
  id: string;
  orderIndex: number;
  kind: string;
  createdAt: number;
  updatedAt: number | null;
  version: number | null;
  props: unknown;
}

export interface TimelineDebugSummary {
  entityCount: number;
  orderCount: number;
  kinds: Record<string, number>;
}

export interface TimelineDebugSnapshot {
  conversationId: string;
  exportedAt: string;
  summary: TimelineDebugSummary;
  timeline: {
    order: string[];
    entities: TimelineDebugEntitySnapshot[];
  };
}

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

const MAX_DEPTH = 24;

/**
 * Deep-clone a value into a plain JSON-safe structure.
 * Handles cycles, Date, BigInt, functions, and other non-JSON types.
 */
export function sanitizeForExport(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[max depth]';

  if (value === null || value === undefined) return value;

  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'string':
      return value;
    case 'bigint':
      return `[BigInt: ${value.toString()}]`;
    case 'function':
      return `[Function: ${value.name || 'anonymous'}]`;
    case 'symbol':
      return `[Symbol: ${value.toString()}]`;
    default:
      break;
  }

  if (typeof value !== 'object') return String(value);

  if (value instanceof Date) return value.toISOString();
  if (value instanceof RegExp) return value.toString();
  if (value instanceof Error) return `[Error: ${value.message}]`;

  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForExport(item, seen, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = sanitizeForExport(val, seen, depth + 1);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Snapshot building
// ---------------------------------------------------------------------------

function buildSummary(convState: ConversationTimelineState): TimelineDebugSummary {
  const kinds: Record<string, number> = {};
  for (const id of convState.order) {
    const entity = convState.byId[id];
    if (entity) {
      kinds[entity.kind] = (kinds[entity.kind] ?? 0) + 1;
    }
  }
  return {
    entityCount: Object.keys(convState.byId).length,
    orderCount: convState.order.length,
    kinds,
  };
}

function entityToSnapshot(entity: TimelineEntity, orderIndex: number): TimelineDebugEntitySnapshot {
  return {
    id: entity.id,
    orderIndex,
    kind: entity.kind,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt ?? null,
    version: entity.version ?? null,
    props: sanitizeForExport(entity.props),
  };
}

export function buildTimelineDebugSnapshot(
  conversationId: string,
  convState: ConversationTimelineState,
  exportedAtMs = Date.now(),
): TimelineDebugSnapshot {
  const entities: TimelineDebugEntitySnapshot[] = convState.order.map((id, index) => {
    const entity = convState.byId[id];
    if (!entity) {
      return {
        id,
        orderIndex: index,
        kind: '<missing>',
        createdAt: 0,
        updatedAt: null,
        version: null,
        props: null,
      };
    }
    return entityToSnapshot(entity, index);
  });

  return {
    conversationId,
    exportedAt: new Date(exportedAtMs).toISOString(),
    summary: buildSummary(convState),
    timeline: {
      order: [...convState.order],
      entities,
    },
  };
}

// ---------------------------------------------------------------------------
// Clipboard / export helpers
// ---------------------------------------------------------------------------

export function buildEntityYamlForCopy(entity: TimelineDebugEntitySnapshot, conversationId?: string): string {
  const doc: Record<string, unknown> = {
    ...(conversationId ? { conversationId } : {}),
    id: entity.id,
    orderIndex: entity.orderIndex,
    kind: entity.kind,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    version: entity.version,
    props: entity.props,
  };
  return toYaml(doc);
}

export function buildConversationYamlForCopy(snapshot: TimelineDebugSnapshot): string {
  return toYaml(snapshot as unknown as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// File export
// ---------------------------------------------------------------------------

function toFileSafeSegment(value: string): string {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'conversation';
}

export interface TimelineYamlExport {
  fileName: string;
  yaml: string;
}

export function buildTimelineYamlExport(snapshot: TimelineDebugSnapshot): TimelineYamlExport {
  const timestamp = snapshot.exportedAt.replace(/[:.]/g, '-');
  const fileName = `timeline-${toFileSafeSegment(snapshot.conversationId)}-${timestamp}.yaml`;
  const yaml = buildConversationYamlForCopy(snapshot);
  return { fileName, yaml };
}
