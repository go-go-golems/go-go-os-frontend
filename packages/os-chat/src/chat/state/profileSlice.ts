import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatProfileListItem } from '../runtime/profileTypes';

export interface ScopedProfileSelection {
  profile: string | null;
  registry: string | null;
}

export interface ChatProfilesState {
  availableProfiles: ChatProfileListItem[];
  selectedProfile: string | null;
  selectedRegistry: string | null;
  selectedByScope: Record<string, ScopedProfileSelection>;
  loading: boolean;
  error: string | null;
}

const initialState: ChatProfilesState = {
  availableProfiles: [],
  selectedProfile: null,
  selectedRegistry: null,
  selectedByScope: {},
  loading: false,
  error: null,
};

export const chatProfilesSlice = createSlice({
  name: 'chatProfiles',
  initialState,
  reducers: {
    setAvailableProfiles(state, action: PayloadAction<ChatProfileListItem[]>) {
      state.availableProfiles = action.payload;
    },
    setProfileLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setProfileError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      if (action.payload) {
        state.loading = false;
      }
    },
    setSelectedProfile(
      state,
      action: PayloadAction<{ profile: string | null; registry?: string | null; scopeKey?: string | null }>
    ) {
      const scopeKey = String(action.payload.scopeKey ?? '').trim();
      if (scopeKey) {
        state.selectedByScope[scopeKey] = {
          profile: action.payload.profile,
          registry: action.payload.registry ?? null,
        };
        return;
      }
      state.selectedProfile = action.payload.profile;
      state.selectedRegistry = action.payload.registry ?? null;
    },
    clearSelectedProfile(state) {
      state.selectedProfile = null;
      state.selectedRegistry = null;
      state.selectedByScope = {};
    },
    clearScopedProfile(state, action: PayloadAction<{ scopeKey: string }>) {
      const scopeKey = String(action.payload.scopeKey ?? '').trim();
      if (!scopeKey) {
        return;
      }
      delete state.selectedByScope[scopeKey];
    },
  },
});

export const chatProfilesReducer = chatProfilesSlice.reducer;
