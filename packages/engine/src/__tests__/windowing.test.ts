import { describe, expect, it } from 'vitest';
import {
  selectActiveMenuId,
  selectDesktopContextMenu,
  selectFocusedWindow,
  selectFocusedWindowId,
  selectSelectedIconId,
  selectSessionCurrentNav,
  selectSessionNavDepth,
  selectWindowById,
  selectWindowCount,
  selectWindowsByZ,
  selectWindowsInOrder,
} from '../desktop/core/state/selectors';
import type { OpenWindowPayload } from '../desktop/core/state/types';
import {
  clearDesktopTransient,
  closeDesktopContextMenu,
  closeWindow,
  focusWindow,
  moveWindow,
  openWindow,
  resizeWindow,
  updateWindowMinSize,
  sessionNavBack,
  sessionNavGo,
  sessionNavHome,
  setDesktopContextMenu,
  setActiveMenu,
  setSelectedIcon,
  windowingReducer,
} from '../desktop/core/state/windowingSlice';

// ── Helpers ──

function reduce(...actions: Array<{ type: string }>) {
  let state = windowingReducer(undefined, { type: '@@INIT' });
  for (const action of actions) {
    state = windowingReducer(state, action as ReturnType<typeof openWindow>);
  }
  return state;
}

const cardWindow = (id: string, cardId: string, overrides?: Partial<OpenWindowPayload>): OpenWindowPayload => ({
  id,
  title: `Window ${id}`,
  bounds: { x: 100, y: 100, w: 300, h: 200 },
  content: {
    kind: 'card',
    card: { stackId: 'test-stack', cardId, cardSessionId: `session-${id}` },
  },
  dedupeKey: cardId,
  ...overrides,
});

const appWindow = (id: string, appKey: string): OpenWindowPayload => ({
  id,
  title: `App ${appKey}`,
  bounds: { x: 150, y: 80, w: 400, h: 300 },
  content: { kind: 'app', appKey },
});

const dialogWindow = (id: string): OpenWindowPayload => ({
  id,
  title: 'About',
  bounds: { x: 200, y: 150, w: 280, h: 180 },
  isDialog: true,
  isResizable: false,
  content: { kind: 'dialog', dialogKey: 'about' },
});

// ── Tests ──

describe('windowingReducer', () => {
  const defaultState = windowingReducer(undefined, { type: '@@INIT' });

  it('initializes with empty state', () => {
    expect(defaultState.desktop.focusedWindowId).toBeNull();
    expect(defaultState.desktop.activeMenuId).toBeNull();
    expect(defaultState.desktop.selectedIconId).toBeNull();
    expect(defaultState.desktop.contextMenu).toBeNull();
    expect(defaultState.desktop.zCounter).toBe(0);
    expect(defaultState.windows).toEqual({});
    expect(defaultState.order).toEqual([]);
    expect(defaultState.sessions).toEqual({});
  });

  // ── openWindow ──

  describe('openWindow', () => {
    it('adds a window and focuses it', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')));

      expect(state.order).toEqual(['w1']);
      expect(state.windows.w1).toBeDefined();
      expect(state.windows.w1.title).toBe('Window w1');
      expect(state.windows.w1.bounds).toEqual({ x: 100, y: 100, w: 300, h: 200 });
      expect(state.desktop.focusedWindowId).toBe('w1');
      expect(state.desktop.zCounter).toBe(1);
      expect(state.windows.w1.z).toBe(1);
    });

    it('assigns incrementing z values', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')), openWindow(cardWindow('w2', 'detail')));

      expect(state.windows.w1.z).toBe(1);
      expect(state.windows.w2.z).toBe(2);
      expect(state.desktop.focusedWindowId).toBe('w2');
    });

    it('applies default minW/minH when not specified', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')));

      expect(state.windows.w1.minW).toBe(180);
      expect(state.windows.w1.minH).toBe(120);
      expect(state.windows.w1.baseMinW).toBe(180);
      expect(state.windows.w1.baseMinH).toBe(120);
    });

    it('uses custom minW/minH when specified', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse', { minW: 250, minH: 200 })));

      expect(state.windows.w1.minW).toBe(250);
      expect(state.windows.w1.minH).toBe(200);
      expect(state.windows.w1.baseMinW).toBe(250);
      expect(state.windows.w1.baseMinH).toBe(200);
    });

    it('bootstraps session nav for card windows', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')));

      expect(state.sessions['session-w1']).toBeDefined();
      expect(state.sessions['session-w1'].nav).toEqual([{ card: 'browse', param: undefined }]);
    });

    it('does not create session for app windows', () => {
      const state = reduce(openWindow(appWindow('w1', 'calculator')));

      expect(Object.keys(state.sessions)).toEqual([]);
    });

    it('dedupes by dedupeKey — focuses existing instead of creating', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        openWindow(cardWindow('w2', 'detail')),
        // Open browse again — should focus w1, not create w3
        openWindow(cardWindow('w3', 'browse')),
      );

      expect(state.order).toEqual(['w1', 'w2']);
      expect(state.windows.w3).toBeUndefined();
      expect(state.desktop.focusedWindowId).toBe('w1');
      // w1 should have highest z now
      expect(state.windows.w1.z).toBeGreaterThan(state.windows.w2.z);
    });

    it('does not dedupe when dedupeKey is absent', () => {
      const state = reduce(
        openWindow({ ...appWindow('w1', 'calc'), dedupeKey: undefined }),
        openWindow({ ...appWindow('w2', 'calc'), dedupeKey: undefined }),
      );

      expect(state.order).toEqual(['w1', 'w2']);
    });

    it('stores dialog flags', () => {
      const state = reduce(openWindow(dialogWindow('d1')));

      expect(state.windows.d1.isDialog).toBe(true);
      expect(state.windows.d1.isResizable).toBe(false);
    });
  });

  // ── focusWindow ──

  describe('focusWindow', () => {
    it('bumps z and sets focusedWindowId', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        openWindow(cardWindow('w2', 'detail')),
        focusWindow('w1'),
      );

      expect(state.desktop.focusedWindowId).toBe('w1');
      expect(state.windows.w1.z).toBe(3);
      expect(state.windows.w2.z).toBe(2);
    });

    it('is a no-op for unknown window id', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')), focusWindow('nonexistent'));

      expect(state.desktop.focusedWindowId).toBe('w1');
    });

    it('increments zCounter on every focus', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        openWindow(cardWindow('w2', 'detail')),
        focusWindow('w1'),
        focusWindow('w2'),
        focusWindow('w1'),
      );

      expect(state.desktop.zCounter).toBe(5);
      expect(state.windows.w1.z).toBe(5);
    });

    it('is a no-op when focusing the already-focused window', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')), focusWindow('w1'));

      expect(state.desktop.focusedWindowId).toBe('w1');
      expect(state.desktop.zCounter).toBe(1);
      expect(state.windows.w1.z).toBe(1);
    });
  });

  // ── closeWindow ──

  describe('closeWindow', () => {
    it('removes the window and its order entry', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        openWindow(cardWindow('w2', 'detail')),
        closeWindow('w1'),
      );

      expect(state.windows.w1).toBeUndefined();
      expect(state.order).toEqual(['w2']);
    });

    it('focuses highest-z remaining window', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        openWindow(cardWindow('w2', 'detail')),
        openWindow(cardWindow('w3', 'report')),
        focusWindow('w2'), // w2 is now top z
        closeWindow('w2'),
      );

      // w3 had z=3, w1 had z=1 — w3 should be focused
      expect(state.desktop.focusedWindowId).toBe('w3');
    });

    it('sets focusedWindowId to null when last window is closed', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')), closeWindow('w1'));

      expect(state.desktop.focusedWindowId).toBeNull();
      expect(state.order).toEqual([]);
    });

    it('cleans up associated card session', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')), closeWindow('w1'));

      expect(state.sessions['session-w1']).toBeUndefined();
    });

    it('does not disturb focus when closing a non-focused window', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        openWindow(cardWindow('w2', 'detail')),
        closeWindow('w1'),
      );

      // w2 was focused (last opened), closing w1 should not change that
      expect(state.desktop.focusedWindowId).toBe('w2');
    });

    it('is a no-op for unknown window id', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')), closeWindow('nonexistent'));

      expect(state.order).toEqual(['w1']);
    });
  });

  // ── moveWindow ──

  describe('moveWindow', () => {
    it('updates window position', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')), moveWindow({ id: 'w1', x: 250, y: 50 }));

      expect(state.windows.w1.bounds.x).toBe(250);
      expect(state.windows.w1.bounds.y).toBe(50);
    });

    it('clamps y to >= 0', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')), moveWindow({ id: 'w1', x: 100, y: -50 }));

      expect(state.windows.w1.bounds.y).toBe(0);
    });

    it('clamps x so at least 40px width remains visible', () => {
      // Window is 300px wide, so min x = -300 + 40 = -260
      const state = reduce(openWindow(cardWindow('w1', 'browse')), moveWindow({ id: 'w1', x: -500, y: 10 }));

      expect(state.windows.w1.bounds.x).toBe(-260);
    });

    it('is a no-op for unknown window id', () => {
      const before = reduce(openWindow(cardWindow('w1', 'browse')));
      const after = windowingReducer(before, moveWindow({ id: 'nonexistent', x: 999, y: 999 }));

      expect(after).toEqual(before);
    });
  });

  // ── resizeWindow ──

  describe('resizeWindow', () => {
    it('updates window dimensions', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')), resizeWindow({ id: 'w1', w: 500, h: 400 }));

      expect(state.windows.w1.bounds.w).toBe(500);
      expect(state.windows.w1.bounds.h).toBe(400);
    });

    it('clamps to minW/minH', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')), resizeWindow({ id: 'w1', w: 50, h: 30 }));

      expect(state.windows.w1.bounds.w).toBe(180); // default minW
      expect(state.windows.w1.bounds.h).toBe(120); // default minH
    });

    it('respects custom minW/minH', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse', { minW: 250, minH: 200 })),
        resizeWindow({ id: 'w1', w: 100, h: 100 }),
      );

      expect(state.windows.w1.bounds.w).toBe(250);
      expect(state.windows.w1.bounds.h).toBe(200);
    });

    it('is a no-op for unknown window id', () => {
      const before = reduce(openWindow(cardWindow('w1', 'browse')));
      const after = windowingReducer(before, resizeWindow({ id: 'nonexistent', w: 999, h: 999 }));

      expect(after).toEqual(before);
    });
  });

  // ── updateWindowMinSize ──

  describe('updateWindowMinSize', () => {
    it('raises minW when measured value exceeds current', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        updateWindowMinSize({ id: 'w1', minW: 354 }),
      );

      expect(state.windows.w1.minW).toBe(354);
      expect(state.windows.w1.minH).toBe(120); // unchanged
    });

    it('raises minH when measured value exceeds current', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        updateWindowMinSize({ id: 'w1', minH: 200 }),
      );

      expect(state.windows.w1.minH).toBe(200);
      expect(state.windows.w1.minW).toBe(180); // unchanged
    });

    it('does not lower minW below base floor', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse', { minW: 300 })),
        updateWindowMinSize({ id: 'w1', minW: 200 }),
      );

      expect(state.windows.w1.minW).toBe(300); // clamped to baseMinW
    });

    it('does not lower minH below base floor', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse', { minH: 250 })),
        updateWindowMinSize({ id: 'w1', minH: 100 }),
      );

      expect(state.windows.w1.minH).toBe(250); // clamped to baseMinH
    });

    it('can shrink minW from a previous measurement down to base floor', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')), // baseMinW = 180
        updateWindowMinSize({ id: 'w1', minW: 500 }), // raised to 500
        updateWindowMinSize({ id: 'w1', minW: 250 }), // shrinks to 250 (above base)
      );

      expect(state.windows.w1.minW).toBe(250);
    });

    it('can shrink minH from a previous measurement down to base floor', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')), // baseMinH = 120
        updateWindowMinSize({ id: 'w1', minH: 400 }), // raised to 400
        updateWindowMinSize({ id: 'w1', minH: 150 }), // shrinks to 150 (above base)
      );

      expect(state.windows.w1.minH).toBe(150);
    });

    it('raises both minW and minH in a single dispatch', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        updateWindowMinSize({ id: 'w1', minW: 400, minH: 300 }),
      );

      expect(state.windows.w1.minW).toBe(400);
      expect(state.windows.w1.minH).toBe(300);
    });

    it('clamps bounds.w up when minW exceeds current width', () => {
      // Window opens at w=300, then content measures minW=354
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        updateWindowMinSize({ id: 'w1', minW: 354 }),
      );

      expect(state.windows.w1.minW).toBe(354);
      expect(state.windows.w1.bounds.w).toBe(354); // clamped up from 300
    });

    it('clamps bounds.h up when minH exceeds current height', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        updateWindowMinSize({ id: 'w1', minH: 250 }),
      );

      expect(state.windows.w1.minH).toBe(250);
      expect(state.windows.w1.bounds.h).toBe(250); // clamped up from 200
    });

    it('does not shrink bounds when minimum decreases', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')), // bounds 300x200
        updateWindowMinSize({ id: 'w1', minW: 400 }), // bounds.w clamped to 400
        updateWindowMinSize({ id: 'w1', minW: 250 }), // minW drops, bounds.w stays 400
      );

      expect(state.windows.w1.minW).toBe(250);
      expect(state.windows.w1.bounds.w).toBe(400); // bounds not shrunk
    });

    it('is a no-op for unknown window id', () => {
      const before = reduce(openWindow(cardWindow('w1', 'browse')));
      const after = windowingReducer(before, updateWindowMinSize({ id: 'nonexistent', minW: 500 }));

      expect(after).toEqual(before);
    });

    it('resizeWindow respects updated minW after content measurement', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        updateWindowMinSize({ id: 'w1', minW: 354 }),
        resizeWindow({ id: 'w1', w: 200, h: 200 }),
      );

      expect(state.windows.w1.bounds.w).toBe(354); // clamped to content-derived min
    });
  });

  // ── Desktop UI state ──

  describe('desktop state', () => {
    it('setActiveMenu', () => {
      const state = reduce(setActiveMenu('file'));
      expect(state.desktop.activeMenuId).toBe('file');

      const state2 = windowingReducer(state, setActiveMenu(null));
      expect(state2.desktop.activeMenuId).toBeNull();
    });

    it('setSelectedIcon', () => {
      const state = reduce(setSelectedIcon('inventory'));
      expect(state.desktop.selectedIconId).toBe('inventory');
    });

    it('clearDesktopTransient clears menu and icon selection', () => {
      const state = reduce(
        setActiveMenu('file'),
        setSelectedIcon('inventory'),
        setDesktopContextMenu({
          x: 100,
          y: 120,
          menuId: 'icon-context',
          windowId: null,
          target: { kind: 'icon', iconId: 'inventory' },
          items: [{ id: 'open', label: 'Open', commandId: 'icon.open.inventory' }],
        }),
        clearDesktopTransient(),
      );

      expect(state.desktop.activeMenuId).toBeNull();
      expect(state.desktop.selectedIconId).toBeNull();
      expect(state.desktop.contextMenu).toBeNull();
    });

    it('setDesktopContextMenu and closeDesktopContextMenu', () => {
      const opened = reduce(
        setDesktopContextMenu({
          x: 40,
          y: 64,
          menuId: 'window-context',
          windowId: 'w1',
          widgetId: 'title-bar',
          target: { kind: 'window', windowId: 'w1', widgetId: 'title-bar' },
          items: [{ id: 'close', label: 'Close Window', commandId: 'window.close-focused' }],
        }),
      );
      expect(opened.desktop.contextMenu).toEqual({
        x: 40,
        y: 64,
        menuId: 'window-context',
        windowId: 'w1',
        widgetId: 'title-bar',
        target: { kind: 'window', windowId: 'w1', widgetId: 'title-bar' },
        items: [{ id: 'close', label: 'Close Window', commandId: 'window.close-focused' }],
      });

      const closed = windowingReducer(opened, closeDesktopContextMenu());
      expect(closed.desktop.contextMenu).toBeNull();
    });
  });

  // ── Session navigation ──

  describe('session navigation', () => {
    it('sessionNavGo pushes onto session stack', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        sessionNavGo({ sessionId: 'session-w1', card: 'detail', param: 'item-1' }),
      );

      expect(state.sessions['session-w1'].nav).toEqual([
        { card: 'browse', param: undefined },
        { card: 'detail', param: 'item-1' },
      ]);
    });

    it('sessionNavBack pops from session stack', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        sessionNavGo({ sessionId: 'session-w1', card: 'detail' }),
        sessionNavBack({ sessionId: 'session-w1' }),
      );

      expect(state.sessions['session-w1'].nav).toEqual([{ card: 'browse', param: undefined }]);
    });

    it('sessionNavBack does not pop last entry', () => {
      const state = reduce(openWindow(cardWindow('w1', 'browse')), sessionNavBack({ sessionId: 'session-w1' }));

      expect(state.sessions['session-w1'].nav).toEqual([{ card: 'browse', param: undefined }]);
    });

    it('sessionNavHome resets to first entry', () => {
      const state = reduce(
        openWindow(cardWindow('w1', 'browse')),
        sessionNavGo({ sessionId: 'session-w1', card: 'detail' }),
        sessionNavGo({ sessionId: 'session-w1', card: 'edit' }),
        sessionNavHome({ sessionId: 'session-w1' }),
      );

      expect(state.sessions['session-w1'].nav).toEqual([{ card: 'browse', param: undefined }]);
    });

    it('session nav actions are no-ops for unknown sessions', () => {
      const before = reduce(openWindow(cardWindow('w1', 'browse')));
      let state = windowingReducer(before, sessionNavGo({ sessionId: 'nonexistent', card: 'x' }));
      expect(state).toEqual(before);

      state = windowingReducer(before, sessionNavBack({ sessionId: 'nonexistent' }));
      expect(state).toEqual(before);

      state = windowingReducer(before, sessionNavHome({ sessionId: 'nonexistent' }));
      expect(state).toEqual(before);
    });
  });
});

// ── Selectors ──

describe('windowing selectors', () => {
  function buildState(...actions: Array<{ type: string }>): WindowingStateSlice {
    let state = windowingReducer(undefined, { type: '@@INIT' });
    for (const action of actions) {
      state = windowingReducer(state, action as ReturnType<typeof openWindow>);
    }
    return { windowing: state };
  }

  const cardWindow = (id: string, cardId: string): OpenWindowPayload => ({
    id,
    title: `Window ${id}`,
    bounds: { x: 100, y: 100, w: 300, h: 200 },
    content: {
      kind: 'card',
      card: { stackId: 'test-stack', cardId, cardSessionId: `session-${id}` },
    },
    dedupeKey: cardId,
  });

  describe('selectWindowsInOrder', () => {
    it('returns windows in insertion order', () => {
      const s = buildState(openWindow(cardWindow('w1', 'browse')), openWindow(cardWindow('w2', 'detail')));

      const result = selectWindowsInOrder(s);
      expect(result.map((w) => w.id)).toEqual(['w1', 'w2']);
    });
  });

  describe('selectWindowsByZ', () => {
    it('returns windows sorted by z ascending', () => {
      const s = buildState(
        openWindow(cardWindow('w1', 'browse')),
        openWindow(cardWindow('w2', 'detail')),
        focusWindow('w1'), // w1 now has highest z
      );

      const result = selectWindowsByZ(s);
      expect(result.map((w) => w.id)).toEqual(['w2', 'w1']);
    });
  });

  describe('selectFocusedWindow', () => {
    it('returns the focused window', () => {
      const s = buildState(openWindow(cardWindow('w1', 'browse')), openWindow(cardWindow('w2', 'detail')));

      expect(selectFocusedWindow(s)?.id).toBe('w2');
    });

    it('returns undefined when no windows', () => {
      const s = buildState();
      expect(selectFocusedWindow(s)).toBeUndefined();
    });
  });

  describe('selectFocusedWindowId / selectActiveMenuId / selectSelectedIconId', () => {
    it('reads desktop state', () => {
      const s = buildState(openWindow(cardWindow('w1', 'browse')), setActiveMenu('file'), setSelectedIcon('inventory'));

      expect(selectFocusedWindowId(s)).toBe('w1');
      expect(selectActiveMenuId(s)).toBe('file');
      expect(selectSelectedIconId(s)).toBe('inventory');
    });
  });

  describe('selectDesktopContextMenu', () => {
    it('reads desktop context-menu state', () => {
      const s = buildState(
        setDesktopContextMenu({
          x: 12,
          y: 18,
          menuId: 'message-context',
          windowId: 'w1',
          target: { kind: 'message', conversationId: 'conv-1', messageId: 'msg-1' },
          items: [{ id: 'copy', label: 'Copy', commandId: 'clipboard.copy-text' }],
        }),
      );
      expect(selectDesktopContextMenu(s)).toEqual({
        x: 12,
        y: 18,
        menuId: 'message-context',
        windowId: 'w1',
        target: { kind: 'message', conversationId: 'conv-1', messageId: 'msg-1' },
        items: [{ id: 'copy', label: 'Copy', commandId: 'clipboard.copy-text' }],
      });
    });
  });

  describe('selectWindowById', () => {
    it('returns window by id', () => {
      const s = buildState(openWindow(cardWindow('w1', 'browse')));
      expect(selectWindowById(s, 'w1')?.title).toBe('Window w1');
    });

    it('returns undefined for unknown id', () => {
      const s = buildState();
      expect(selectWindowById(s, 'nope')).toBeUndefined();
    });
  });

  describe('selectWindowCount', () => {
    it('counts open windows', () => {
      const s = buildState(openWindow(cardWindow('w1', 'browse')), openWindow(cardWindow('w2', 'detail')));
      expect(selectWindowCount(s)).toBe(2);
    });
  });

  describe('selectSessionCurrentNav', () => {
    it('returns top of session nav stack', () => {
      const s = buildState(
        openWindow(cardWindow('w1', 'browse')),
        sessionNavGo({ sessionId: 'session-w1', card: 'detail', param: 'item-1' }),
      );

      expect(selectSessionCurrentNav(s, 'session-w1')).toEqual({ card: 'detail', param: 'item-1' });
    });

    it('returns undefined for unknown session', () => {
      const s = buildState();
      expect(selectSessionCurrentNav(s, 'nonexistent')).toBeUndefined();
    });
  });

  describe('selectSessionNavDepth', () => {
    it('returns stack depth', () => {
      const s = buildState(
        openWindow(cardWindow('w1', 'browse')),
        sessionNavGo({ sessionId: 'session-w1', card: 'detail' }),
      );

      expect(selectSessionNavDepth(s, 'session-w1')).toBe(2);
    });

    it('returns 0 for unknown session', () => {
      const s = buildState();
      expect(selectSessionNavDepth(s, 'nonexistent')).toBe(0);
    });
  });
});
