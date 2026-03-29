import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type LaunchReason = 'icon' | 'menu' | 'command' | 'startup';

export interface RichWidgetLaunchStats {
  launchCount: number;
  lastLaunchReason: LaunchReason | null;
}

export interface RichWidgetsLauncherState {
  byAppId: Record<string, RichWidgetLaunchStats>;
}

const initialState: RichWidgetsLauncherState = {
  byAppId: {},
};

export const richWidgetsLauncherStateSlice = createSlice({
  name: 'richWidgetsLauncher',
  initialState,
  reducers: {
    markLaunched(
      state,
      action: PayloadAction<{ appId: string; reason: LaunchReason }>,
    ) {
      const { appId, reason } = action.payload;
      const current = state.byAppId[appId];
      if (!current) {
        state.byAppId[appId] = { launchCount: 1, lastLaunchReason: reason };
        return;
      }
      current.launchCount += 1;
      current.lastLaunchReason = reason;
    },
  },
});

export const richWidgetsLauncherReducer = richWidgetsLauncherStateSlice.reducer;
export const richWidgetsLauncherActions = richWidgetsLauncherStateSlice.actions;
