export interface NotificationsStateSlice {
  notifications: { toast: string | null };
}

export const selectToast = (state: NotificationsStateSlice) => state.notifications.toast;
