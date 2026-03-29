import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface NotificationsState {
  toast: string | null;
}

const initialState: NotificationsState = { toast: null };

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    showToast(state, action: PayloadAction<string>) {
      state.toast = action.payload;
    },
    clearToast(state) {
      state.toast = null;
    },
  },
});

export const { showToast, clearToast } = notificationsSlice.actions;
export const notificationsReducer = notificationsSlice.reducer;
