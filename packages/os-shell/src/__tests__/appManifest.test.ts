import { describe, expect, it } from 'vitest';
import {
  type AppManifest,
  assertUniqueManifestIds,
  assertUniqueStateKeys,
  assertValidAppId,
  assertValidStateKey,
} from '../contracts/appManifest';

function manifest(id: string): AppManifest {
  return {
    id,
    name: `App ${id}`,
    icon: '📦',
    launch: { mode: 'window' },
  };
}

describe('app manifest validation', () => {
  it('accepts valid app ids', () => {
    expect(() => assertValidAppId('inventory')).not.toThrow();
    expect(() => assertValidAppId('book-tracker')).not.toThrow();
  });

  it('rejects invalid app ids', () => {
    expect(() => assertValidAppId('Inventory')).toThrow(/Invalid app id/);
    expect(() => assertValidAppId('bad app')).toThrow(/Invalid app id/);
  });

  it('accepts valid state keys', () => {
    expect(() => assertValidStateKey('app_inventory')).not.toThrow();
  });

  it('rejects invalid state keys', () => {
    expect(() => assertValidStateKey('inventory')).toThrow(/Invalid app state key/);
    expect(() => assertValidStateKey('app-inventory')).toThrow(/Invalid app state key/);
  });

  it('fails on duplicate manifest ids', () => {
    expect(() => assertUniqueManifestIds([manifest('inventory'), manifest('inventory')])).toThrow(
      /Duplicate app manifest id/,
    );
  });

  it('fails on duplicate state keys', () => {
    expect(() => assertUniqueStateKeys(['app_inventory', 'app_inventory'])).toThrow(/Duplicate app state key/);
  });
});
