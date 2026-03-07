import { describe, expect, it } from 'vitest';
import { chatProfilesReducer, chatProfilesSlice } from './profileSlice';

const actions = chatProfilesSlice.actions;

function reduce(input: Parameters<typeof chatProfilesReducer>[1][]) {
  let state = chatProfilesReducer(undefined, { type: '__test__/init' });
  for (const action of input) {
    state = chatProfilesReducer(state, action);
  }
  return state;
}

describe('profileSlice', () => {
  it('tracks available profiles and loading/error state', () => {
    const state = reduce([
      actions.setProfileLoading(true),
      actions.setAvailableProfiles([
        { slug: 'default', display_name: 'Default', is_default: true },
        { slug: 'agent', display_name: 'Agent' },
      ]),
      actions.setProfileLoading(false),
      actions.setProfileError(null),
    ]);

    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.availableProfiles.map((p) => p.slug)).toEqual(['default', 'agent']);
  });

  it('tracks selected profile', () => {
    const state = reduce([
      actions.setSelectedProfile({ profile: 'agent', registry: 'default' }),
      actions.clearSelectedProfile(),
    ]);

    expect(state.selectedProfile).toBeNull();
    expect(state.selectedRegistry).toBeNull();
  });

  it('tracks scoped profile selection independently', () => {
    const state = reduce([
      actions.setSelectedProfile({ profile: 'global-default' }),
      actions.setSelectedProfile({
        profile: 'inventory-specialist',
        registry: 'ops',
        scopeKey: 'conv:abc',
      }),
      actions.clearScopedProfile({ scopeKey: 'conv:abc' }),
    ]);

    expect(state.selectedProfile).toBe('global-default');
    expect(state.selectedByScope['conv:abc']).toBeUndefined();
  });
});
