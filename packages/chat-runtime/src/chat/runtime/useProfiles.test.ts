import { describe, expect, it } from 'vitest';
import { resolveSelectionAfterProfileRefresh } from './useProfiles';

describe('resolveSelectionAfterProfileRefresh', () => {
  it('selects default profile when no profile is currently selected', () => {
    const next = resolveSelectionAfterProfileRefresh(
      [
        { slug: 'inventory', is_default: true },
        { slug: 'analyst' },
      ],
      {}
    );

    expect(next).toEqual({ profile: 'inventory' });
  });

  it('keeps current selection when it still exists after refresh', () => {
    const next = resolveSelectionAfterProfileRefresh(
      [
        { slug: 'inventory', is_default: true },
        { slug: 'analyst' },
      ],
      { profile: 'analyst' }
    );

    expect(next).toBeNull();
  });

  it('falls back to new default when selected profile was removed by CRUD', () => {
    const next = resolveSelectionAfterProfileRefresh(
      [
        { slug: 'inventory', is_default: false },
        { slug: 'planner', is_default: true },
      ],
      { profile: 'analyst' }
    );

    expect(next).toEqual({ profile: 'planner' });
  });

  it('clears selected profile when no profiles remain', () => {
    const next = resolveSelectionAfterProfileRefresh(
      [],
      { profile: 'analyst' }
    );
    expect(next).toEqual({ profile: null });
  });
});
