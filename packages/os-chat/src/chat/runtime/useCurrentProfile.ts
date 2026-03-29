import { shallowEqual, useSelector } from 'react-redux';
import { selectCurrentProfileSelection, type ChatStateSlice } from '../state/selectors';

type CurrentProfileStoreState = ChatStateSlice & Record<string, unknown>;

export function useCurrentProfile(scopeKey?: string) {
  return useSelector(
    (state: CurrentProfileStoreState) => selectCurrentProfileSelection(state, scopeKey),
    shallowEqual
  );
}
