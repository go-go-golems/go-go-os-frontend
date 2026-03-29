import { describe, expect, it } from 'vitest';
import { formatAppKey, isAppKeyForApp, parseAppKey } from '../runtime/appKey';

describe('app key runtime helpers', () => {
  it('formats and parses app keys', () => {
    const appKey = formatAppKey('inventory', 'conv-123');

    expect(appKey).toBe('inventory:conv-123');
    expect(parseAppKey(appKey)).toEqual({
      appId: 'inventory',
      instanceId: 'conv-123',
    });
  });

  it('rejects invalid app key shapes', () => {
    expect(() => parseAppKey('inventory')).toThrow(/Invalid app key/);
    expect(() => parseAppKey('Inventory:conv-1')).toThrow(/Invalid app id/);
    expect(() => parseAppKey('inventory:')).toThrow(/instance id/);
  });

  it('checks app ownership by app key', () => {
    expect(isAppKeyForApp('inventory:conv-1', 'inventory')).toBe(true);
    expect(isAppKeyForApp('todo:main', 'inventory')).toBe(false);
    expect(isAppKeyForApp('bad-key', 'inventory')).toBe(false);
  });
});
