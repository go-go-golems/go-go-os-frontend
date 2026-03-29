import { describe, expect, it } from 'vitest';
import {
  resolveProfileSelectionChange,
  resolveProfileSelectorValue,
} from './profileSelectorState';

describe('profileSelectorState', () => {
  const profiles = [
    { slug: 'default', registry: 'default', is_default: true },
    { slug: 'inventory', registry: 'default', is_default: false },
    { slug: 'planner', registry: 'ops', is_default: false },
  ];

  it('supports switching inventory -> default -> inventory', () => {
    let selected = resolveProfileSelectorValue(profiles, { profile: 'inventory', registry: 'default' });
    expect(resolveProfileSelectionChange(selected, profiles)).toEqual({ profile: 'inventory', registry: 'default' });

    selected = JSON.stringify({ profile: 'default', registry: 'default' });
    expect(resolveProfileSelectionChange(selected, profiles)).toEqual({ profile: 'default', registry: 'default' });
    expect(resolveProfileSelectionChange(resolveProfileSelectorValue(profiles, { profile: 'default', registry: 'default' }), profiles)).toEqual({ profile: 'default', registry: 'default' });

    selected = JSON.stringify({ profile: 'inventory', registry: 'default' });
    expect(resolveProfileSelectionChange(selected, profiles)).toEqual({ profile: 'inventory', registry: 'default' });
    expect(resolveProfileSelectionChange(resolveProfileSelectorValue(profiles, { profile: 'inventory', registry: 'default' }), profiles)).toEqual({ profile: 'inventory', registry: 'default' });
  });

  it('allows selecting a profile before first message send', () => {
    const initial = resolveProfileSelectorValue(profiles, {});
    expect(resolveProfileSelectionChange(initial, profiles)).toEqual({ profile: 'default', registry: 'default' });

    const selectedBeforeSend = resolveProfileSelectionChange(JSON.stringify({ profile: 'planner', registry: 'ops' }), profiles);
    expect(selectedBeforeSend).toEqual({ profile: 'planner', registry: 'ops' });
    expect(resolveProfileSelectionChange(resolveProfileSelectorValue(profiles, selectedBeforeSend ?? {}), profiles)).toEqual({ profile: 'planner', registry: 'ops' });
  });

  it('falls back to default when current profile is stale', () => {
    const selected = resolveProfileSelectorValue(profiles, { profile: 'unknown-old-profile', registry: 'default' });
    expect(resolveProfileSelectionChange(selected, profiles)).toEqual({ profile: 'default', registry: 'default' });
  });
});
