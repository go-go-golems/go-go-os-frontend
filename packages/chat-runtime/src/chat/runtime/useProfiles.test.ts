import { describe, expect, it } from 'vitest';
import { resolveSelectionAfterProfileRefresh } from './useProfiles';

describe('resolveSelectionAfterProfileRefresh', () => {
  it('selects default profile when no profile is currently selected', () => {
    const next = resolveSelectionAfterProfileRefresh(
      [
        { slug: 'inventory', registry: 'default', is_default: true },
        { slug: 'analyst', registry: 'default' },
      ],
      {}
    );

    expect(next).toEqual({ profile: 'inventory', registry: 'default' });
  });

  it('keeps current selection when it still exists after refresh', () => {
    const next = resolveSelectionAfterProfileRefresh(
      [
        { slug: 'inventory', registry: 'default', is_default: true },
        { slug: 'analyst', registry: 'default' },
      ],
      { profile: 'analyst', registry: 'default' }
    );

    expect(next).toBeNull();
  });

  it('falls back to new default when selected profile was removed by CRUD', () => {
    const next = resolveSelectionAfterProfileRefresh(
      [
        { slug: 'inventory', registry: 'default', is_default: false },
        { slug: 'planner', registry: 'ops', is_default: true },
      ],
      { profile: 'analyst', registry: 'ops' }
    );

    expect(next).toEqual({ profile: 'planner', registry: 'ops' });
  });

  it('clears selected profile when no profiles remain', () => {
    const next = resolveSelectionAfterProfileRefresh(
      [],
      { profile: 'analyst', registry: 'default' }
    );
    expect(next).toEqual({ profile: null, registry: 'default' });
  });
});
