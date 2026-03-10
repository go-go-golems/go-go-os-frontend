import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import type { ArtifactSource } from './artifactsSlice';
import { recordField, stringField, structuredRecordFromUnknown } from '@hypercard/chat-runtime';

export interface ArtifactUpsert {
  id: string;
  title?: string;
  template?: string;
  data?: Record<string, unknown>;
  source: ArtifactSource;
  runtimeCardId?: string;
  runtimeCardCode?: string;
  packId?: string;
}

export function normalizeArtifactId(raw: unknown): string | undefined {
  if (typeof raw !== 'string') {
    return undefined;
  }

  let value = raw.trim();
  if (!value) {
    return undefined;
  }

  for (let i = 0; i < 2; i += 1) {
    const isDoubleQuoted = value.startsWith('"') && value.endsWith('"');
    const isSingleQuoted = value.startsWith("'") && value.endsWith("'");
    if (value.length > 1 && (isDoubleQuoted || isSingleQuoted)) {
      value = value.slice(1, -1).trim();
      continue;
    }
    break;
  }

  return value || undefined;
}

function artifactFromStructured(record: Record<string, unknown>): ArtifactUpsert | undefined {
  const payload = recordField(record, 'data');
  const artifact = payload ? recordField(payload, 'artifact') : undefined;
  const artifactId = normalizeArtifactId(artifact ? stringField(artifact, 'id') : undefined);
  if (!artifactId) {
    return undefined;
  }
  return {
    id: artifactId,
    title: stringField(record, 'title'),
    data: artifact ? recordField(artifact, 'data') : undefined,
    source: 'card',
  };
}

function cardFieldsFromStructured(record: Record<string, unknown>): {
  runtimeCardId?: string;
  runtimeCardCode?: string;
  packId?: string;
} {
  const payload = recordField(record, 'data');
  const card = payload ? recordField(payload, 'card') : undefined;
  const runtime = payload ? recordField(payload, 'runtime') : undefined;
  if (!card) {
    return {
      packId: runtime ? stringField(runtime, 'pack') : undefined,
    };
  }
  return {
    runtimeCardId: stringField(card, 'id'),
    runtimeCardCode: stringField(card, 'code'),
    packId: runtime ? stringField(runtime, 'pack') : undefined,
  };
}

function artifactFromCardResult(resultRecord: Record<string, unknown>): ArtifactUpsert | undefined {
  const upsert = artifactFromStructured(resultRecord);
  if (!upsert) {
    return undefined;
  }
  return {
    ...upsert,
    ...cardFieldsFromStructured(resultRecord),
  };
}

function artifactFromTimelineCardProps(props: Record<string, unknown>): ArtifactUpsert | undefined {
  const resultRecord =
    structuredRecordFromUnknown(props.result) ??
    structuredRecordFromUnknown(props.resultRaw) ??
    props;
  return artifactFromCardResult(resultRecord);
}

export function extractArtifactUpsertFromSem(
  type: string | undefined,
  data: Record<string, unknown>,
): ArtifactUpsert | undefined {
  if (!type) {
    return undefined;
  }

  if (type === 'hypercard.card.v2') {
    return artifactFromCardResult(data);
  }

  if (type !== 'timeline.upsert') {
    return undefined;
  }

  const entity = recordField(data, 'entity');
  if (!entity) {
    return undefined;
  }

  const entityKind = stringField(entity, 'kind');
  if (entityKind !== 'hypercard.card.v2') {
    return undefined;
  }

  const props = recordField(entity, 'props');
  if (!props) {
    return undefined;
  }

  return artifactFromTimelineCardProps(props);
}

export function extractArtifactUpsertFromTimelineEntity(
  entityKind: string | undefined,
  props: unknown,
): ArtifactUpsert | undefined {
  if (String(entityKind || '') !== 'hypercard.card.v2') {
    return undefined;
  }
  if (!props || typeof props !== 'object' || Array.isArray(props)) {
    return undefined;
  }
  return artifactFromTimelineCardProps(props as Record<string, unknown>);
}

function sanitizeArtifactKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function buildArtifactOpenWindowPayload(input: {
  artifactId: string;
  template?: string;
  title?: string;
  stackId?: string;
  runtimeCardId?: string;
}): OpenWindowPayload | undefined {
  const artifactId = normalizeArtifactId(input.artifactId);
  if (!artifactId) {
    return undefined;
  }
  const runtimeCardId = cleanString(input.runtimeCardId);
  if (!runtimeCardId) {
    return undefined;
  }
  const safeKey = sanitizeArtifactKey(artifactId);
  const title = input.title?.trim() || `Artifact ${artifactId}`;
  const stackId = cleanString(input.stackId) ?? 'inventory';

  return {
    id: `window:artifact:${safeKey}`,
    title,
    icon: '🃏',
    bounds: { x: 220, y: 50, w: 520, h: 420 },
    content: {
      kind: 'card',
      card: {
        stackId,
        cardId: runtimeCardId,
        cardSessionId: `artifact-session:${safeKey}`,
        param: artifactId,
      },
    },
    dedupeKey: `artifact:${artifactId}`,
  };
}
