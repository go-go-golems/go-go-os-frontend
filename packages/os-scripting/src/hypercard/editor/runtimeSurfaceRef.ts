export const HYPERCARD_TOOLS_APP_ID = 'hypercard-tools';

export interface RuntimeSurfaceRef {
  ownerAppId: string;
  surfaceId: string;
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

function assertValidSurfaceId(surfaceId: string): void {
  if (surfaceId.trim().length === 0) {
    throw new Error('Invalid runtime surface id: expected a non-empty surface id.');
  }
}

export function encodeRuntimeSurfaceEditorInstanceId(ref: RuntimeSurfaceRef): string {
  const ownerAppId = clean(ref.ownerAppId);
  const surfaceId = clean(ref.surfaceId);
  if (!ownerAppId) {
    throw new Error('Invalid owner app id: expected a non-empty owner app id.');
  }
  if (!surfaceId) {
    throw new Error('Invalid runtime surface id: expected a non-empty surface id.');
  }
  assertValidOwnerAppId(ownerAppId);
  assertValidSurfaceId(surfaceId);
  return `${INSTANCE_KIND_EDITOR}${INSTANCE_DELIMITER}${encodeURIComponent(ownerAppId)}${INSTANCE_DELIMITER}${encodeURIComponent(surfaceId)}`;
}

export function decodeRuntimeSurfaceEditorInstanceId(instanceId: string): RuntimeSurfaceRef | null {
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
    const surfaceId = clean(decodeURIComponent(parts[2] ?? ''));
    if (!ownerAppId || !surfaceId) {
      return null;
    }
    assertValidOwnerAppId(ownerAppId);
    assertValidSurfaceId(surfaceId);
    return { ownerAppId, surfaceId };
  } catch {
    return null;
  }
}

export function buildRuntimeSurfaceEditorAppKey(ref: RuntimeSurfaceRef): string {
  return `${HYPERCARD_TOOLS_APP_ID}:${encodeRuntimeSurfaceEditorInstanceId(ref)}`;
}
