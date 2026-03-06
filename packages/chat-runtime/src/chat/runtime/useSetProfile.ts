import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { chatProfilesSlice } from '../state/profileSlice';

export interface UseSetProfileOptions {
  scopeKey?: string;
}

export function useSetProfile(_basePrefix = '', options: UseSetProfileOptions = {}) {
  const dispatch = useDispatch();
  const scopeKey = String(options.scopeKey ?? '').trim() || undefined;

  return useCallback(
    async (profile: string | null) => {
      const normalized = String(profile ?? '').trim();
      dispatch(chatProfilesSlice.actions.setProfileError(null));
      if (!normalized) {
        dispatch(
          chatProfilesSlice.actions.setSelectedProfile({
            profile: null,
            scopeKey,
          })
        );
        return;
      }
      dispatch(
        chatProfilesSlice.actions.setSelectedProfile({
          profile: normalized,
          scopeKey,
        })
      );
    },
    [dispatch, scopeKey]
  );
}
