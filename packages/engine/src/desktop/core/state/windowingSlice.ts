import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DesktopContextMenuState, OpenWindowPayload, WindowingState } from './types';

const initialState: WindowingState = {
  desktop: {
    activeMenuId: null,
    selectedIconId: null,
    focusedWindowId: null,
    contextMenu: null,
    zCounter: 0,
  },
  windows: {},
  order: [],
  sessions: {},
};

const windowingSlice = createSlice({
  name: 'windowing',
  initialState,
  reducers: {
    // ── Window lifecycle ──

    /**
     * Open a new window or focus an existing one if dedupeKey matches.
     * If content.kind === 'card' and a cardSessionId is provided, a session
     * nav stack is initialised automatically.
     */
    openWindow(state, action: PayloadAction<OpenWindowPayload>) {
      const spec = action.payload;

      // Dedupe: if a window with matching dedupeKey already exists, focus it
      if (spec.dedupeKey) {
        const existing = Object.values(state.windows).find((w) => w.dedupeKey === spec.dedupeKey);
        if (existing) {
          state.desktop.zCounter += 1;
          existing.z = state.desktop.zCounter;
          state.desktop.focusedWindowId = existing.id;
          return;
        }
      }

      state.desktop.zCounter += 1;
      const baseMinW = spec.minW ?? 180;
      const baseMinH = spec.minH ?? 120;
      const win = {
        id: spec.id,
        title: spec.title,
        icon: spec.icon,
        bounds: spec.bounds,
        z: state.desktop.zCounter,
        minW: baseMinW,
        minH: baseMinH,
        baseMinW,
        baseMinH,
        isDialog: spec.isDialog,
        isResizable: spec.isResizable,
        content: spec.content,
        dedupeKey: spec.dedupeKey,
      };

      state.windows[win.id] = win;
      state.order.push(win.id);
      state.desktop.focusedWindowId = win.id;

      // Bootstrap session nav for card windows
      const sessionId = spec.content.card?.cardSessionId;
      if (spec.content.kind === 'card' && sessionId && !state.sessions[sessionId]) {
        const cardId = spec.content.card?.cardId ?? 'home';
        state.sessions[sessionId] = {
          nav: [{ card: cardId, param: spec.content.card?.param }],
        };
      }
    },

    /** Focus window: bump z, set focusedWindowId. No-op if id not found. */
    focusWindow(state, action: PayloadAction<string>) {
      const win = state.windows[action.payload];
      if (!win) return;
      if (state.desktop.focusedWindowId === win.id) return;

      state.desktop.zCounter += 1;
      win.z = state.desktop.zCounter;
      state.desktop.focusedWindowId = win.id;
    },

    /**
     * Close window and remove it from order.
     * Focus falls to the window with the highest z among remaining.
     * Cleans up the associated card session if one exists.
     */
    closeWindow(state, action: PayloadAction<string>) {
      const win = state.windows[action.payload];
      if (!win) return;

      // Clean up session
      const sessionId = win.content.card?.cardSessionId;
      if (sessionId) {
        delete state.sessions[sessionId];
      }

      delete state.windows[action.payload];
      state.order = state.order.filter((id) => id !== action.payload);

      // Focus fallback: highest z among remaining
      if (state.desktop.focusedWindowId === action.payload) {
        const remaining = Object.values(state.windows);
        if (remaining.length === 0) {
          state.desktop.focusedWindowId = null;
        } else {
          const highest = remaining.reduce((best, w) => (w.z > best.z ? w : best));
          state.desktop.focusedWindowId = highest.id;
        }
      }
    },

    // ── Window geometry ──

    /** Move window to new x, y position. Clamped so title bar stays visible. */
    moveWindow(state, action: PayloadAction<{ id: string; x: number; y: number }>) {
      const win = state.windows[action.payload.id];
      if (!win) return;

      // Clamp: keep at least 40px of width visible and y >= 0
      win.bounds.x = Math.max(-win.bounds.w + 40, action.payload.x);
      win.bounds.y = Math.max(0, action.payload.y);
    },

    /** Resize window with min constraints. */
    resizeWindow(state, action: PayloadAction<{ id: string; w: number; h: number }>) {
      const win = state.windows[action.payload.id];
      if (!win) return;

      win.bounds.w = Math.max(win.minW, action.payload.w);
      win.bounds.h = Math.max(win.minH, action.payload.h);
    },

    /** Update content-derived minimum size. Clamped to base floor but can shrink from previous measurement. */
    updateWindowMinSize(state, action: PayloadAction<{ id: string; minW?: number; minH?: number }>) {
      const win = state.windows[action.payload.id];
      if (!win) return;

      if (action.payload.minW !== undefined) {
        win.minW = Math.max(win.baseMinW, action.payload.minW);
      }
      if (action.payload.minH !== undefined) {
        win.minH = Math.max(win.baseMinH, action.payload.minH);
      }

      // Clamp bounds so a window never stays smaller than the new minimum
      win.bounds.w = Math.max(win.minW, win.bounds.w);
      win.bounds.h = Math.max(win.minH, win.bounds.h);
    },

    // ── Desktop UI state ──

    setActiveMenu(state, action: PayloadAction<string | null>) {
      state.desktop.activeMenuId = action.payload;
    },

    setSelectedIcon(state, action: PayloadAction<string | null>) {
      state.desktop.selectedIconId = action.payload;
    },

    setDesktopContextMenu(state, action: PayloadAction<DesktopContextMenuState | null>) {
      state.desktop.contextMenu = action.payload;
    },

    closeDesktopContextMenu(state) {
      state.desktop.contextMenu = null;
    },

    /** Clear desktop transient state (close menu, deselect icon). */
    clearDesktopTransient(state) {
      state.desktop.activeMenuId = null;
      state.desktop.selectedIconId = null;
      state.desktop.contextMenu = null;
    },

    // ── Per-session navigation ──

    /** Navigate forward in a card session's nav stack. */
    sessionNavGo(state, action: PayloadAction<{ sessionId: string; card: string; param?: string }>) {
      const session = state.sessions[action.payload.sessionId];
      if (!session) return;

      session.nav.push({ card: action.payload.card, param: action.payload.param });
    },

    /** Go back one step in a card session's nav stack. */
    sessionNavBack(state, action: PayloadAction<{ sessionId: string }>) {
      const session = state.sessions[action.payload.sessionId];
      if (!session || session.nav.length <= 1) return;

      session.nav.pop();
    },

    /** Reset a card session's nav stack to its first entry. */
    sessionNavHome(state, action: PayloadAction<{ sessionId: string }>) {
      const session = state.sessions[action.payload.sessionId];
      if (!session || session.nav.length === 0) return;

      session.nav = [session.nav[0]];
    },
  },
});

export const {
  openWindow,
  focusWindow,
  closeWindow,
  moveWindow,
  resizeWindow,
  updateWindowMinSize,
  setActiveMenu,
  setSelectedIcon,
  setDesktopContextMenu,
  closeDesktopContextMenu,
  clearDesktopTransient,
  sessionNavGo,
  sessionNavBack,
  sessionNavHome,
} = windowingSlice.actions;

export const windowingReducer = windowingSlice.reducer;
