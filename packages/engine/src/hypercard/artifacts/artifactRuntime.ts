import type { OpenWindowPayload } from '../../desktop/core';
import type { ArtifactSource } from './artifactsSlice';
import { recordField, stringField, structuredRecordFromUnknown } from '../../chat/sem/semHelpers';

export interface ArtifactUpsert {
  id: string;
  title?: string;
  template?: string;
  data?: Record<string, unknown>;
  source: ArtifactSource;
  runtimeCardId?: string;
  runtimeCardCode?: string;
}

export function normalizeArtifactId(raw: unknown): string | undefined {
  if (typeof raw !== 'string') {
    return undefined;
  }

  let value = raw.trim();
  if (!value) {
    return undefined;
  }

  // Handle doubly-wrapped ids such as "\"sales-summary-2026-02-20\"".
  for (let i = 0; i < 2; i += 1) {
    const isDoubleQuoted = value.startsWith('"') && value.endsWith('"');
    const isSingleQuoted = value.startsWith("'") && value.endsWith("'");
    if (value.length > 1 && (isDoubleQuoted || isSingleQuoted)) {
      value = value.slice(1, -1).trim();
      continue;
    }
    break;
  }

  if (!value) {
    return undefined;
  }
  return value;
}

function artifactFromStructured(
  record: Record<string, unknown>,
  source: ArtifactSource,
  template?: string,
): ArtifactUpsert | undefined {
  const payload = recordField(record, 'data');
  const artifact = payload ? recordField(payload, 'artifact') : undefined;
  const artifactId = normalizeArtifactId(artifact ? stringField(artifact, 'id') : undefined);
  if (!artifactId) {
    return undefined;
  }
  return {
    id: artifactId,
    title: stringField(record, 'title'),
    template,
    data: artifact ? recordField(artifact, 'data') : undefined,
    source,
  };
}

function artifactFromTimelineToolResult(
  toolResult: Record<string, unknown>,
  kindHint?: 'widget' | 'card',
): ArtifactUpsert | undefined {
  const effectiveKind: 'widget' | 'card' | undefined = kindHint;
  const resultRecord =
    structuredRecordFromUnknown(toolResult.result) ?? structuredRecordFromUnknown(toolResult.resultRaw);
  if (!effectiveKind || !resultRecord) {
    return undefined;
  }
  if (effectiveKind === 'widget') {
    const template =
      stringField(resultRecord, 'widgetType') ??
      stringField(resultRecord, 'type') ??
      stringField(resultRecord, 'template');
    return artifactFromStructured(resultRecord, 'widget', template);
  }
  if (effectiveKind === 'card') {
    const upsert = artifactFromStructured(resultRecord, 'card', stringField(resultRecord, 'template'));
    if (upsert) {
      const cardData =
        recordField(resultRecord, 'card') ??
        (resultRecord.data ? recordField(resultRecord.data as Record<string, unknown>, 'card') : undefined);
      if (cardData) {
        upsert.runtimeCardId = stringField(cardData, 'id');
        upsert.runtimeCardCode = stringField(cardData, 'code');
      }
    }
    return upsert;
  }
  return undefined;
}

export function extractArtifactUpsertFromSem(
  type: string | undefined,
  data: Record<string, unknown>,
): ArtifactUpsert | undefined {
  if (!type) {
    return undefined;
  }

  if (type === 'hypercard.widget.v1') {
    const template = stringField(data, 'widgetType') ?? stringField(data, 'type') ?? stringField(data, 'template');
    return artifactFromStructured(data, 'widget', template);
  }

  if (type === 'hypercard.card.v2') {
    const upsert = artifactFromStructured(data, 'card');
    if (upsert) {
      // Extract runtime card fields from the payload
      const payload = recordField(data, 'data');
      const cardData = payload ? recordField(payload, 'card') : undefined;
      if (cardData) {
        upsert.runtimeCardId = stringField(cardData, 'id');
        upsert.runtimeCardCode = stringField(cardData, 'code');
      }
    }
    return upsert;
  }

  if (type !== 'timeline.upsert') {
    return undefined;
  }

  const entity = recordField(data, 'entity');
  if (!entity) {
    return undefined;
  }

  const entityKind = stringField(entity, 'kind');
  if (
    entityKind !== 'hypercard.widget.v1' &&
    entityKind !== 'hypercard.card.v2'
  ) {
    return undefined;
  }

  // Legacy V1 projection: entity.toolResult
  // Timeline V2 projection: entity.props
  const toolResult = recordField(entity, 'toolResult') ?? recordField(entity, 'props');
  if (!toolResult) {
    return undefined;
  }
  const hint = entityKind === 'hypercard.widget.v1' ? 'widget' : 'card';
  return artifactFromTimelineToolResult(toolResult, hint);
}

function upsertFromHypercardEntityProps(
  entityKind: string,
  props: Record<string, unknown>,
): ArtifactUpsert | undefined {
  const preferredSource: ArtifactSource = entityKind === 'hypercard_card' ? 'card' : 'widget';
  const rawData = recordField(props, 'rawData');

  if (rawData) {
    const fromRaw = artifactFromStructured(
      rawData,
      preferredSource,
      stringField(rawData, 'widgetType') ?? stringField(rawData, 'type') ?? stringField(rawData, 'template'),
    );
    if (fromRaw) {
      if (preferredSource === 'card') {
        const payload = recordField(rawData, 'data');
        const cardData = payload ? recordField(payload, 'card') : undefined;
        if (cardData) {
          fromRaw.runtimeCardId = stringField(cardData, 'id');
          fromRaw.runtimeCardCode = stringField(cardData, 'code');
        }
      }
      return fromRaw;
    }
  }

  const toolLike = artifactFromTimelineToolResult(props, preferredSource);
  if (toolLike) {
    return toolLike;
  }

  const fallbackId = normalizeArtifactId(stringField(props, 'artifactId'));
  if (!fallbackId) {
    return undefined;
  }

  return {
    id: fallbackId,
    title: stringField(props, 'title'),
    template: stringField(props, 'template'),
    source: preferredSource,
    runtimeCardId: stringField(props, 'runtimeCardId'),
    runtimeCardCode: stringField(props, 'runtimeCardCode'),
  };
}

export function extractArtifactUpsertFromTimelineEntity(
  entityKind: string | undefined,
  props: unknown,
): ArtifactUpsert | undefined {
  const kind = String(entityKind || '');
  if (!kind) {
    return undefined;
  }

  if (!props || typeof props !== 'object' || Array.isArray(props)) {
    return undefined;
  }
  const record = props as Record<string, unknown>;

  if (kind === 'hypercard_widget' || kind === 'hypercard_card') {
    return upsertFromHypercardEntityProps(kind, record);
  }
  if (kind === 'hypercard.widget.v1') {
    return artifactFromTimelineToolResult(record, 'widget');
  }
  if (kind === 'hypercard.card.v2') {
    return artifactFromTimelineToolResult(record, 'card');
  }

  return undefined;
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
  const stackId = cleanString(input.stackId) ?? 'runtime';

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
