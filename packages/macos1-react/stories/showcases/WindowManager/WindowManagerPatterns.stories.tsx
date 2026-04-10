import type { Meta, StoryObj } from '@storybook/react';
import { useState, useRef, useCallback } from 'react';
import { WindowLayer } from '../../../src/shell/WindowLayer';
import { WindowResizeHandle } from '../../../src/shell/WindowResizeHandle';
import { createWindow } from '../../../src/shell/storyFixtures';
import type { DesktopWindowDef } from '../../../src/shell/types';

// ── Style constants ──

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

// ── Initial windows ──

const INITIAL_WINDOWS: DesktopWindowDef[] = [
  createWindow({
    id: 'window:inventory',
    title: 'Inventory',
    icon: '📦',
    x: 80,
    y: 60,
    width: 300,
    height: 240,
    zIndex: 1,
    focused: false,
  }),
  createWindow({
    id: 'window:sales',
    title: 'Sales Dashboard',
    icon: '📈',
    x: 220,
    y: 100,
    width: 320,
    height: 220,
    zIndex: 2,
    focused: true,
  }),
  createWindow({
    id: 'window:settings',
    title: 'Settings',
    icon: '⚙️',
    x: 360,
    y: 80,
    width: 280,
    height: 200,
    zIndex: 3,
    isDialog: true,
  }),
];

// ── Window body renderers ──

const INVENTORY_BODY = () => (
  <div style={{ padding: 12, fontSize: 11 }}>
    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Inventory Summary</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div>Total SKUs: <strong>2,847</strong></div>
      <div>Low Stock: <strong style={{ color: '#c07000' }}>23</strong></div>
      <div>Out of Stock: <strong style={{ color: '#c00' }}>4</strong></div>
      <div>Total Value: <strong>$142,880</strong></div>
    </div>
    <div style={{ marginTop: 12, fontSize: 10, color: '#888' }}>
      Click to bring window to front
    </div>
  </div>
);

const SALES_BODY = () => (
  <div style={{ padding: 12, fontSize: 11 }}>
    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>📈 Sales Dashboard</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div>Today: <strong>$3,240</strong></div>
      <div>This Week: <strong>$18,910</strong></div>
      <div>This Month: <strong>$71,500</strong></div>
    </div>
    <div style={{ marginTop: 8, fontSize: 10, color: '#888' }}>
      [Sparkline chart would render here]
    </div>
  </div>
);

const SETTINGS_BODY = () => (
  <div style={{ padding: 12, fontSize: 11 }}>
    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>⚙️ Preferences</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div>Theme: <strong>Snow</strong></div>
      <div>Font: <strong>Geneva</strong></div>
      <div>Auto-save: <strong>5 min</strong></div>
    </div>
  </div>
);

const WINDOW_BODIES: Record<string, () => React.ReactElement> = {
  'window:inventory': INVENTORY_BODY,
  'window:sales': SALES_BODY,
  'window:settings': SETTINGS_BODY,
};

// ── WindowManagerPatterns component ──

function WindowManagerPatternsInner() {
  const [windows, setWindows] = useState<DesktopWindowDef[]>(INITIAL_WINDOWS);
  const [lastEvents, setLastEvents] = useState<string[]>([]);
  const dragState = useRef<{ windowId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeState = useRef<{ windowId: string; startX: number; startY: number; origW: number; origH: number } | null>(null);

  const log = (msg: string) => setLastEvents((prev) => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev.slice(0, 4)]);

  const focusWindow = useCallback((windowId: string) => {
    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.zIndex));
      return prev.map((w) => (w.id === windowId ? { ...w, zIndex: maxZ + 1, focused: true } : { ...w, focused: false })););
    });
  }, []);

  const closeWindow = useCallback((windowId: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== windowId));
    log(`Closed: ${windowId}`);
  }, []);

  const handleDragStart = useCallback(
    (windowId: string, event: React.PointerEvent<HTMLDivElement>) => {
      focusWindow(windowId);
      const win = windows.find((w) => w.id === windowId);
      if (!win) return;
      dragState.current = { windowId, startX: event.clientX, startY: event.clientY, origX: win.x, origY: win.y };
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
      log(`Drag start: ${windowId}`);
    },
    [focusWindow, windows],
  );

  const handleDragMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const { windowId, startX, startY, origX, origY } = dragState.current;
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId ? { ...w, x: origX + event.clientX - startX, y: origY + event.clientY - startY } : w,
      ),
    );
  }, []);

  const handleDragEnd = useCallback((windowId: string) => {
    dragState.current = null;
    log(`Drag end: ${windowId}`);
  }, []);

  const handleResizeStart = useCallback(
    (windowId: string, event: React.PointerEvent<HTMLButtonElement>) => {
      focusWindow(windowId);
      const win = windows.find((w) => w.id === windowId);
      if (!win) return;
      resizeState.current = { windowId, startX: event.clientX, startY: event.clientY, origW: win.width, origH: win.height };
      event.target.setPointerCapture(event.pointerId);
      log(`Resize start: ${windowId}`);
    },
    [focusWindow, windows],
  );

  const handleResizeMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!resizeState.current) return;
    const { windowId, startX, startY, origW, origH } = resizeState.current;
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId
          ? { ...w, width: Math.max(200, origW + event.clientX - startX), height: Math.max(120, origH + event.clientY - startY) }
          : w,
      ),
    );
  }, []);

  const handleResizeEnd = useCallback((windowId: string) => {
    resizeState.current = null;
    log(`Resize end: ${windowId}`);
  }, []);

  return (
    <div
      style={{
        fontFamily: 'var(--hc-font-family, Geneva, sans-serif)',
        fontSize: 12,
        width: '100%',
      }}
    >
      {/* ── Header ── */}
      <h1
        style={{
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: 12,
          borderBottom: '1px solid #ccc',
          paddingBottom: 8,
          padding: '0 16px 8px',
        }}
      >
        Window Manager Patterns
      </h1>

      <div style={{ padding: '0 16px', display: 'flex', gap: 16 }}>
        {/* ── Main area ── */}
        <div style={{ flex: 1 }}>
          <div style={SECTION_LABEL_STYLE}>WindowLayer (click windows to focus, drag title bars, resize corners)</div>
          <div
            style={{
              position: 'relative',
              height: 400,
              background: '#bfc8d8',
              border: '2px solid #7f8899',
              overflow: 'hidden',
            }}
            onPointerMove={(e) => { handleDragMove(e); handleResizeMove(e as unknown as React.PointerEvent<HTMLButtonElement>); }}
          >
            <WindowLayer
              windows={windows}
              renderWindowBody={(w) => {
                const renderer = WINDOW_BODIES[w.id];
                return renderer ? renderer() : <div style={{ padding: 12 }}>Window: {w.title}</div>;
              }}
              onFocusWindow={focusWindow}
              onCloseWindow={closeWindow}
              onWindowDragStart={handleDragStart}
              onWindowResizeStart={handleResizeStart}
            />

            {/* Event log overlay */}
            <div
              style={{
                position: 'absolute',
                left: 8,
                bottom: 8,
                fontSize: 9,
                color: '#283040',
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid #7f8899',
                padding: '4px 6px',
                zIndex: 1000,
                fontFamily: 'monospace',
                maxWidth: 280,
              }}
            >
              <div style={{ color: '#666', marginBottom: 2 }}>Events:</div>
              {lastEvents.map((ev, i) => (
                <div key={i} style={{ opacity: 1 - i * 0.15 }}>{ev}</div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div style={{ width: 200 }}>
          <div style={SECTION_LABEL_STYLE}>Controls</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => {
                const id = `window:new-${Date.now()}`;
                const maxZ = Math.max(...windows.map((w) => w.zIndex), 0);
                setWindows((prev) => [
                  ...prev,
                  createWindow({
                    id,
                    title: 'New Window',
                    icon: '🪟',
                    x: 100 + Math.random() * 60,
                    y: 60 + Math.random() * 60,
                    zIndex: maxZ + 1,
                    focused: true,
                  }),
                ]);
                log(`Opened: ${id}`);
              }}
              style={{ padding: '5px 8px' }}
            >
              + Open Window
            </button>
            <button
              onClick={() => {
                setWindows((prev) => {
                  const maxZ = Math.max(...prev.map((w) => w.zIndex), 0);
                  return prev.map((w) => ({ ...w, zIndex: w.id === prev[prev.length - 1]?.id ? maxZ + 1 : w.zIndex - 1 }));
                });
              }}
              style={{ padding: '5px 8px' }}
            >
            ↕ Tile
            </button>
            <button
              onClick={() => {
                setWindows((prev) => {
                  const maxZ = Math.max(...prev.map((w) => w.zIndex), 0);
                  return prev.map((w, i) => ({
                    ...w,
                    x: 60 + i * 60,
                    y: 40 + i * 30,
                    zIndex: i + 1,
                    focused: i === prev.length - 1,
                  }));
                });
              }}
              style={{ padding: '5px 8px' }}
            >
              [Tile]
            </button>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={SECTION_LABEL_STYLE}>Open Windows ({windows.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {windows.map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    padding: '3px 6px',
                    background: w.focused ? '#ddd' : 'transparent',
                    border: '1px solid ' + (w.focused ? '#888' : 'transparent'),
                    cursor: 'pointer',
                  }}
                  onClick={() => focusWindow(w.id)}
                >
                  <span>{w.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.title}</span>
                  {!w.isDialog && (
                    <button
                      onClick={(e) => { e.stopPropagation(); closeWindow(w.id); }}
                      style={{ padding: '1px 4px', fontSize: 9, lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── WindowResizeHandle standalone ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={SECTION_LABEL_STYLE}>WindowResizeHandle (standalone)</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {(['ne', 'se', 'sw', 'nw'] as const).map((pos) => (
            <div
              key={pos}
              style={{
                width: 80,
                height: 60,
                border: '2px solid #000',
                background: '#fff',
                position: 'relative',
              }}
            >
              <WindowResizeHandle position={pos} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Showcases/WindowManager/WindowManagerPatterns',
  component: WindowManagerPatternsInner,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Showcase demonstrating the full WindowLayer + WindowSurface window management system: multi-window focus, drag, resize, open/close, tile, and cascade.',
      },
    },
  },
} satisfies Meta<typeof WindowManagerPatternsInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WindowManagerPatterns: Story = {};
