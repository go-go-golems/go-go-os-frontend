import { useCallback, useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { getCurrentProfile, listProfiles } from './profileApi';
import type { ChatProfileListItem } from './profileTypes';
import {
  selectAvailableProfiles,
  selectCurrentProfileSelection,
  selectProfileError,
  selectProfileLoading,
  type ChatStateSlice,
} from '../state/selectors';
import { chatProfilesSlice } from '../state/profileSlice';

type ProfilesStoreState = ChatStateSlice & Record<string, unknown>;

export interface UseProfilesResult {
  profiles: ReturnType<typeof selectAvailableProfiles>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseProfilesOptions {
  enabled?: boolean;
  scopeKey?: string;
}

function normalize(value: string | null | undefined): string {
  return String(value ?? '').trim();
}

export function resolveSelectionAfterProfileRefresh(
  profiles: ChatProfileListItem[],
  selected: { profile?: string; registry?: string },
  registryHint?: string,
  persistedProfileHint?: string
): { profile: string | null; registry: string | null } | null {
  const selectedProfile = normalize(selected.profile);
  const selectedRegistry = normalize(selected.registry);
  const resolvedRegistry = normalize(registryHint) || selectedRegistry;
  const persistedProfile = normalize(persistedProfileHint);

  if (selectedProfile) {
    const hasSelected = profiles.some((item) => normalize(item.slug) === selectedProfile);
    if (hasSelected) {
      const nextRegistry = resolvedRegistry || null;
      if (nextRegistry === (selectedRegistry || null)) {
        return null;
      }
      return { profile: selectedProfile, registry: nextRegistry };
    }
  }

  if (persistedProfile) {
    const hasPersisted = profiles.some((item) => normalize(item.slug) === persistedProfile);
    if (hasPersisted) {
      return { profile: persistedProfile, registry: resolvedRegistry || null };
    }
  }

  const fallback = profiles.find((item) => item.is_default) ?? profiles[0];
  if (!fallback?.slug) {
    return { profile: null, registry: resolvedRegistry || null };
  }
  return { profile: normalize(fallback.slug), registry: resolvedRegistry || null };
}

export function useProfiles(
  basePrefix = '',
  registry?: string,
  options: UseProfilesOptions = {}
): UseProfilesResult {
  const enabled = options.enabled ?? true;
  const scopeKey = String(options.scopeKey ?? '').trim() || undefined;
  const dispatch = useDispatch();
  const profiles = useSelector((state: ProfilesStoreState) => selectAvailableProfiles(state));
  const loading = useSelector((state: ProfilesStoreState) => selectProfileLoading(state));
  const error = useSelector((state: ProfilesStoreState) => selectProfileError(state));
  const selected = useSelector(
    (state: ProfilesStoreState) => selectCurrentProfileSelection(state, scopeKey),
    shallowEqual
  );

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }
    dispatch(chatProfilesSlice.actions.setProfileLoading(true));
    dispatch(chatProfilesSlice.actions.setProfileError(null));
    try {
      const resolvedRegistry = String(registry ?? selected.registry ?? '').trim();
      const nextProfiles = await listProfiles(resolvedRegistry || undefined, { basePrefix });
      dispatch(chatProfilesSlice.actions.setAvailableProfiles(nextProfiles));
      dispatch(chatProfilesSlice.actions.setProfileLoading(false));
      let persistedProfile: string | undefined;
      if (!normalize(selected.profile)) {
        try {
          const payload = await getCurrentProfile({ basePrefix });
          persistedProfile = normalize(payload.slug || payload.profile);
        } catch {
          persistedProfile = undefined;
        }
      }
      const nextSelection = resolveSelectionAfterProfileRefresh(
        nextProfiles,
        selected,
        resolvedRegistry,
        persistedProfile
      );
      if (nextSelection) {
        dispatch(chatProfilesSlice.actions.setSelectedProfile({ ...nextSelection, scopeKey }));
      }
    } catch (err) {
      dispatch(chatProfilesSlice.actions.setProfileLoading(false));
      dispatch(
        chatProfilesSlice.actions.setProfileError(err instanceof Error ? err.message : String(err))
      );
    }
  }, [basePrefix, dispatch, enabled, registry, scopeKey, selected.profile, selected.registry]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  return { profiles, loading, error, refresh };
}
