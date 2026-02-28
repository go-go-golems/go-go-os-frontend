import { describe, expect, it } from 'vitest';
import {
  buildRuntimeCardEditorAppKey,
  decodeRuntimeCardEditorInstanceId,
  encodeRuntimeCardEditorInstanceId,
  HYPERCARD_TOOLS_APP_ID,
} from './runtimeCardRef';

describe('runtime card editor instance id helpers', () => {
  it('roundtrips owner app id and card id', () => {
    const encoded = encodeRuntimeCardEditorInstanceId({
      ownerAppId: 'inventory',
      cardId: 'hello-world-card',
    });
    expect(decodeRuntimeCardEditorInstanceId(encoded)).toEqual({
      ownerAppId: 'inventory',
      cardId: 'hello-world-card',
    });
  });

  it('handles runtime card ids containing reserved url characters', () => {
    const encoded = encodeRuntimeCardEditorInstanceId({
      ownerAppId: 'arc-agi-player',
      cardId: 'card/foo?bar=baz&x=1',
    });
    expect(decodeRuntimeCardEditorInstanceId(encoded)).toEqual({
      ownerAppId: 'arc-agi-player',
      cardId: 'card/foo?bar=baz&x=1',
    });
  });

  it('returns null for non-editor or malformed instance ids', () => {
    expect(decodeRuntimeCardEditorInstanceId('')).toBeNull();
    expect(decodeRuntimeCardEditorInstanceId('editor~inventory')).toBeNull();
    expect(decodeRuntimeCardEditorInstanceId('inspect~inventory~card-1')).toBeNull();
    expect(decodeRuntimeCardEditorInstanceId('editor~%ZZ~card')).toBeNull();
  });

  it('builds app key with hypercard-tools module id', () => {
    const appKey = buildRuntimeCardEditorAppKey({
      ownerAppId: 'inventory',
      cardId: 'helloWorldCard',
    });
    expect(appKey).toMatch(new RegExp(`^${HYPERCARD_TOOLS_APP_ID}:`));
    const instanceId = appKey.replace(`${HYPERCARD_TOOLS_APP_ID}:`, '');
    expect(decodeRuntimeCardEditorInstanceId(instanceId)).toEqual({
      ownerAppId: 'inventory',
      cardId: 'helloWorldCard',
    });
  });

  it('rejects invalid owner app ids', () => {
    expect(() =>
      encodeRuntimeCardEditorInstanceId({
        ownerAppId: 'Inventory',
        cardId: 'helloWorldCard',
      }),
    ).toThrow(/Invalid owner app id/);
  });
});
