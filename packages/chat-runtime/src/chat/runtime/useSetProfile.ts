import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { chatProfilesSlice } from '../state/profileSlice';

export interface UseSetProfileOptions {
  scopeKey?: string;
  registry?: string;
}

type NextProfileSelection = string | null | { profile: string | null; registry?: string | null };

export function useSetProfile(_basePrefix = '', options: UseSetProfileOptions = {}) {
  const dispatch = useDispatch();
  const scopeKey = String(options.scopeKey ?? '').trim() || undefined;
  const registry = String(options.registry ?? '').trim() || undefined;

  return useCallback(
    async (selection: NextProfileSelection) => {
      const explicitProfile = typeof selection === 'object' && selection !== null
        ? selection.profile
        : selection;
      const explicitRegistry = typeof selection === 'object' && selection !== null
        ? String(selection.registry ?? '').trim() || undefined
        : undefined;
      const normalized = String(explicitProfile ?? '').trim();
      const nextRegistry = explicitRegistry ?? registry;
      dispatch(chatProfilesSlice.actions.setProfileError(null));
      if (!normalized) {
        dispatch(
          chatProfilesSlice.actions.setSelectedProfile({
            profile: null,
            registry: nextRegistry,
            scopeKey,
          })
        );
        return;
      }
      dispatch(
        chatProfilesSlice.actions.setSelectedProfile({
          profile: normalized,
          registry: nextRegistry,
          scopeKey,
        })
      );
    },
    [dispatch, registry, scopeKey]
  );
}
