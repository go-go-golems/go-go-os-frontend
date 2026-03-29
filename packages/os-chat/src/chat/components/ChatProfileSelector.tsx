import { useCurrentProfile } from '../runtime/useCurrentProfile';
import { useProfiles } from '../runtime/useProfiles';
import { useSetProfile } from '../runtime/useSetProfile';
import { resolveProfileSelectionChange, resolveProfileSelectorValue } from './profileSelectorState';

export interface ChatProfileSelectorProps {
  convId: string;
  basePrefix?: string;
  scopeKey?: string;
  label?: string;
}

export function ChatProfileSelector({
  convId,
  basePrefix = '',
  scopeKey,
  label = 'Profile',
}: ChatProfileSelectorProps) {
  const { profiles, loading: profilesLoading, error: profileError } = useProfiles(
    basePrefix,
    { scopeKey }
  );
  const currentProfile = useCurrentProfile(scopeKey);
  const setProfile = useSetProfile(basePrefix, { scopeKey });

  const selectedProfileValue = resolveProfileSelectorValue(
    profiles,
    currentProfile
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <label htmlFor={`chat-profile-${convId}`} style={{ fontSize: 11, opacity: 0.8 }}>
        {label}
      </label>
      <select
        id={`chat-profile-${convId}`}
        value={selectedProfileValue}
        onChange={(event) => {
          const nextProfile = resolveProfileSelectionChange(event.target.value, profiles);
          if (nextProfile) {
            void setProfile(nextProfile);
            return;
          }
          void setProfile(null);
        }}
        disabled={profilesLoading}
        style={{ fontSize: 11, padding: '1px 4px', maxWidth: 180 }}
      >
        {profilesLoading ? <option value="">Loading…</option> : null}
        {!profilesLoading && profiles.length === 0 ? <option value="">No profiles</option> : null}
        {profiles.map((profile) => (
          <option
            key={`${profile.registry ?? 'default'}:${profile.slug}`}
            value={JSON.stringify({ profile: profile.slug, registry: profile.registry })}
          >
            {(profile.display_name?.trim() || profile.slug)
              + (profile.registry ? ` [${profile.registry}]` : '')
              + (profile.is_default ? ' (default)' : '')}
          </option>
        ))}
      </select>
      {profileError ? (
        <span style={{ fontSize: 10, color: '#b45309' }} title={profileError}>
          profile error
        </span>
      ) : null}
    </div>
  );
}
