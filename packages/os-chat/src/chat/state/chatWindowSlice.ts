import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface PendingAiAwaitState {
  baselineIndex: number;
}

export interface ChatWindowConversationState {
  convId: string;
  awaiting: PendingAiAwaitState | null;
}

export interface ChatWindowSliceState {
  byWindowId: Record<string, ChatWindowConversationState>;
}

const initialState: ChatWindowSliceState = {
  byWindowId: {},
};

function normalizeId(value: string): string {
  return String(value ?? '').trim();
}

function ensureWindowState(
  state: ChatWindowSliceState,
  windowId: string,
  convId: string
): ChatWindowConversationState | null {
  const normalizedWindowId = normalizeId(windowId);
  const normalizedConvId = normalizeId(convId);
  if (!normalizedWindowId || !normalizedConvId) {
    return null;
  }
  const current = state.byWindowId[normalizedWindowId];
  if (current && current.convId === normalizedConvId) {
    return current;
  }
  const next: ChatWindowConversationState = {
    convId: normalizedConvId,
    awaiting: null,
  };
  state.byWindowId[normalizedWindowId] = next;
  return next;
}

export const chatWindowSlice = createSlice({
  name: 'chatWindow',
  initialState,
  reducers: {
    setWindowConversation(
      state,
      action: PayloadAction<{
        windowId: string;
        convId: string;
      }>
    ) {
      ensureWindowState(state, action.payload.windowId, action.payload.convId);
    },
    beginAwaitingAi(
      state,
      action: PayloadAction<{
        windowId: string;
        convId: string;
        baselineIndex: number;
      }>
    ) {
      const windowState = ensureWindowState(state, action.payload.windowId, action.payload.convId);
      if (!windowState) return;
      windowState.awaiting = {
        baselineIndex: Math.max(0, action.payload.baselineIndex),
      };
    },
    clearAwaitingAi(
      state,
      action: PayloadAction<{
        windowId: string;
      }>
    ) {
      const windowId = normalizeId(action.payload.windowId);
      if (!windowId) return;
      const windowState = state.byWindowId[windowId];
      if (!windowState || windowState.awaiting === null) return;
      windowState.awaiting = null;
    },
    clearWindowState(
      state,
      action: PayloadAction<{
        windowId: string;
      }>
    ) {
      const windowId = normalizeId(action.payload.windowId);
      if (!windowId) return;
      delete state.byWindowId[windowId];
    },
  },
});

export const chatWindowReducer = chatWindowSlice.reducer;
