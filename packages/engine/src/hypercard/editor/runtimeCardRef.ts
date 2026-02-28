export const HYPERCARD_TOOLS_APP_ID = 'hypercard-tools';

export interface RuntimeCardRef {
  ownerAppId: string;
  cardId: string;
}

const INSTANCE_KIND_EDITOR = 'editor';
const INSTANCE_DELIMITER = '~';
const APP_ID_RE = /^[a-z][a-z0-9-]*$/;

function clean(value: string | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertValidOwnerAppId(ownerAppId: string): void {
  if (!APP_ID_RE.test(ownerAppId)) {
    throw new Error(`Invalid owner app id "${ownerAppId}". Expected /^[a-z][a-z0-9-]*$/.`);
  }
}

function assertValidCardId(cardId: string): void {
  if (cardId.trim().length === 0) {
    throw new Error('Invalid runtime card id: expected a non-empty card id.');
  }
}

export function encodeRuntimeCardEditorInstanceId(ref: RuntimeCardRef): string {
  const ownerAppId = clean(ref.ownerAppId);
  const cardId = clean(ref.cardId);
  if (!ownerAppId) {
    throw new Error('Invalid owner app id: expected a non-empty owner app id.');
  }
  if (!cardId) {
    throw new Error('Invalid runtime card id: expected a non-empty card id.');
  }
  assertValidOwnerAppId(ownerAppId);
  assertValidCardId(cardId);
  return `${INSTANCE_KIND_EDITOR}${INSTANCE_DELIMITER}${encodeURIComponent(ownerAppId)}${INSTANCE_DELIMITER}${encodeURIComponent(cardId)}`;
}

export function decodeRuntimeCardEditorInstanceId(instanceId: string): RuntimeCardRef | null {
  const raw = clean(instanceId);
  if (!raw) {
    return null;
  }
  const parts = raw.split(INSTANCE_DELIMITER);
  if (parts.length !== 3 || parts[0] !== INSTANCE_KIND_EDITOR) {
    return null;
  }

  try {
    const ownerAppId = clean(decodeURIComponent(parts[1] ?? ''));
    const cardId = clean(decodeURIComponent(parts[2] ?? ''));
    if (!ownerAppId || !cardId) {
      return null;
    }
    assertValidOwnerAppId(ownerAppId);
    assertValidCardId(cardId);
    return { ownerAppId, cardId };
  } catch {
    return null;
  }
}

export function buildRuntimeCardEditorAppKey(ref: RuntimeCardRef): string {
  return `${HYPERCARD_TOOLS_APP_ID}:${encodeRuntimeCardEditorInstanceId(ref)}`;
}
