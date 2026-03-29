import { describe, expect, it } from 'vitest';
import { applyActionVisibility, isActionVisible, isContextCommandAllowed } from './contextActionVisibility';
import type { DesktopActionEntry } from './types';

function action(id: string, overrides: Partial<Extract<DesktopActionEntry, { id: string }>> = {}): DesktopActionEntry {
  return {
    id,
    label: id,
    commandId: `cmd.${id}`,
    ...overrides,
  };
}

describe('contextActionVisibility', () => {
  it('keeps actions visible when no visibility policy is provided', () => {
    const entry = action('open');
    expect(isActionVisible(entry, {})).toBe(true);
  });

  it('filters by allowed profile list', () => {
    const entries = [
      action('allowed', { visibility: { allowedProfiles: ['agent'] } }),
      action('hidden', { visibility: { allowedProfiles: ['admin'] } }),
    ];

    const visible = applyActionVisibility(entries, { profile: 'agent' });
    expect(visible).toEqual([entries[0]]);
  });

  it('disables unauthorized actions when policy is disable', () => {
    const entries = [
      action('open'),
      action('admin-export', {
        visibility: { allowedRoles: ['admin'], unauthorized: 'disable' },
      }),
    ];

    const visible = applyActionVisibility(entries, { roles: ['operator'] });
    expect(visible).toEqual([
      entries[0],
      {
        ...entries[1],
        disabled: true,
      },
    ]);
  });

  it('normalizes separators after filtering hidden entries', () => {
    const entries: DesktopActionEntry[] = [
      { separator: true },
      action('visible-a'),
      { separator: true },
      action('hidden', { visibility: { allowedProfiles: ['admin'] } }),
      { separator: true },
      action('visible-b'),
      { separator: true },
    ];

    const visible = applyActionVisibility(entries, { profile: 'agent' });
    expect(visible).toEqual([
      action('visible-a'),
      { separator: true },
      action('visible-b'),
    ]);
  });

  it('supports custom predicate visibility checks', () => {
    const entries = [
      action('predicate', {
        visibility: {
          when: (context) => context.registry === 'default',
        },
      }),
    ];
    expect(applyActionVisibility(entries, { registry: 'default' })).toEqual(entries);
    expect(applyActionVisibility(entries, { registry: 'enterprise' })).toEqual([]);
  });

  it('guards command invocation when target action is hidden or disabled', () => {
    const entries = applyActionVisibility(
      [
        action('open'),
        action('export', { visibility: { allowedRoles: ['admin'], unauthorized: 'disable' } }),
      ],
      { roles: ['operator'] },
    );

    expect(isContextCommandAllowed(entries, 'cmd.open')).toBe(true);
    expect(isContextCommandAllowed(entries, 'cmd.export')).toBe(false);
    expect(isContextCommandAllowed(entries, 'cmd.missing')).toBe(false);
  });
});
