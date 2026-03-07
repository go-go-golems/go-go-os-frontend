import { useCallback, useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { listProfiles } from './profileApi';
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
  selected: { profile?: string; registry?: string }
): { profile: string | null; registry?: string | null } | null {
  const selectedProfile = normalize(selected.profile);
  const selectedRegistry = normalize(selected.registry) || null;

  if (selectedProfile) {
    const hasSelected = profiles.some((item) => normalize(item.slug) === selectedProfile);
    if (hasSelected) {
      return null;
    }
  }

  const fallback = profiles.find((item) => item.is_default) ?? profiles[0];
  if (!fallback?.slug) {
    return { profile: null, registry: selectedRegistry };
  }
  return { profile: normalize(fallback.slug), registry: selectedRegistry };
}

export function useProfiles(
  basePrefix = '',
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
      const nextProfiles = await listProfiles(undefined, { basePrefix });
      dispatch(chatProfilesSlice.actions.setAvailableProfiles(nextProfiles));
      dispatch(chatProfilesSlice.actions.setProfileLoading(false));
      const nextSelection = resolveSelectionAfterProfileRefresh(nextProfiles, selected);
      if (nextSelection) {
        dispatch(chatProfilesSlice.actions.setSelectedProfile({ ...nextSelection, scopeKey }));
      }
    } catch (err) {
      dispatch(chatProfilesSlice.actions.setProfileLoading(false));
      dispatch(
        chatProfilesSlice.actions.setProfileError(err instanceof Error ? err.message : String(err))
      );
    }
  }, [basePrefix, dispatch, enabled, scopeKey, selected.profile]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  return { profiles, loading, error, refresh };
}
