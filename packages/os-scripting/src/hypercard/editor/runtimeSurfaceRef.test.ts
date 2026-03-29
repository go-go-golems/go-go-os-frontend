import { describe, expect, it } from 'vitest';
import {
  buildRuntimeSurfaceEditorAppKey,
  decodeRuntimeSurfaceEditorInstanceId,
  encodeRuntimeSurfaceEditorInstanceId,
  HYPERCARD_TOOLS_APP_ID,
} from './runtimeSurfaceRef';

describe('runtime surface editor instance id helpers', () => {
  it('roundtrips owner app id and surface id', () => {
    const encoded = encodeRuntimeSurfaceEditorInstanceId({
      ownerAppId: 'inventory',
      surfaceId: 'hello-world-surface',
    });
    expect(decodeRuntimeSurfaceEditorInstanceId(encoded)).toEqual({
      ownerAppId: 'inventory',
      surfaceId: 'hello-world-surface',
    });
  });

  it('handles runtime surface ids containing reserved url characters', () => {
    const encoded = encodeRuntimeSurfaceEditorInstanceId({
      ownerAppId: 'arc-agi-player',
      surfaceId: 'surface/foo?bar=baz&x=1',
    });
    expect(decodeRuntimeSurfaceEditorInstanceId(encoded)).toEqual({
      ownerAppId: 'arc-agi-player',
      surfaceId: 'surface/foo?bar=baz&x=1',
    });
  });

  it('returns null for non-editor or malformed instance ids', () => {
    expect(decodeRuntimeSurfaceEditorInstanceId('')).toBeNull();
    expect(decodeRuntimeSurfaceEditorInstanceId('editor~inventory')).toBeNull();
    expect(decodeRuntimeSurfaceEditorInstanceId('inspect~inventory~card-1')).toBeNull();
    expect(decodeRuntimeSurfaceEditorInstanceId('editor~%ZZ~card')).toBeNull();
  });

  it('builds app key with hypercard-tools module id', () => {
    const appKey = buildRuntimeSurfaceEditorAppKey({
      ownerAppId: 'inventory',
      surfaceId: 'helloWorldSurface',
    });
    expect(appKey).toMatch(new RegExp(`^${HYPERCARD_TOOLS_APP_ID}:`));
    const instanceId = appKey.replace(`${HYPERCARD_TOOLS_APP_ID}:`, '');
    expect(decodeRuntimeSurfaceEditorInstanceId(instanceId)).toEqual({
      ownerAppId: 'inventory',
      surfaceId: 'helloWorldSurface',
    });
  });

  it('rejects invalid owner app ids', () => {
    expect(() =>
      encodeRuntimeSurfaceEditorInstanceId({
        ownerAppId: 'Inventory',
        surfaceId: 'helloWorldSurface',
      }),
    ).toThrow(/Invalid owner app id/);
  });
});
