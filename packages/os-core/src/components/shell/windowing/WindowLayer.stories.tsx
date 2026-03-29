import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useMemo, useState } from 'react';
import { createWindow, WINDOWING_WINDOWS } from './storyFixtures';
import type { DesktopWindowDef } from './types';
import { useWindowInteractionController } from './useWindowInteractionController';
import { WindowLayer } from './WindowLayer';

interface WindowLayerHarnessProps {
  initialWindows: DesktopWindowDef[];
}

function WindowLayerHarness({ initialWindows }: WindowLayerHarnessProps) {
  const [windows, setWindows] = useState(initialWindows);

  const focusWindow = useCallback((windowId: string) => {
    setWindows((prev) => {
      const maxZ = prev.length === 0 ? 0 : Math.max(...prev.map((w) => w.zIndex));
      return prev.map((w) =>
        w.id === windowId ? { ...w, focused: true, zIndex: maxZ + 1 } : { ...w, focused: false },
      );
    });
  }, []);

  const closeWindow = useCallback((windowId: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== windowId));
  }, []);

  const moveWindow = useCallback((id: string, next: { x: number; y: number }) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x: next.x, y: next.y } : w)));
  }, []);

  const resizeWindow = useCallback((id: string, next: { width: number; height: number }) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, width: next.width, height: next.height } : w)));
  }, []);

  const { beginMove, beginResize } = useWindowInteractionController({
    getWindowById: (id) => windows.find((w) => w.id === id),
    onMoveWindow: moveWindow,
    onResizeWindow: resizeWindow,
    onFocusWindow: focusWindow,
    constraints: { minX: 0, minY: 0, minWidth: 180, minHeight: 120 },
  });

  const focusedWindow = windows.find((w) => w.focused);
  const orderedWindows = useMemo(() => [...windows].sort((a, b) => a.zIndex - b.zIndex), [windows]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#c0c0c0' }}>
      <WindowLayer
        windows={orderedWindows}
        onFocusWindow={focusWindow}
        onCloseWindow={closeWindow}
        onWindowDragStart={beginMove}
        onWindowResizeStart={beginResize}
        renderWindowBody={(w) => (
          <div style={{ padding: 10 }}>
            <div style={{ fontWeight: 'bold' }}>{w.title}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              ({w.x}, {w.y}) {w.width}×{w.height} z={w.zIndex}
            </div>
            <p style={{ fontSize: 13, margin: '8px 0 0' }}>Drag title bar to move, resize from the corner handle.</p>
          </div>
        )}
      />
      <div
        style={{
          position: 'absolute',
          left: 8,
          bottom: 8,
          fontSize: 11,
          fontFamily: 'monospace',
          background: '#fff',
          border: '1px solid #000',
          padding: '2px 6px',
        }}
      >
        focused: {focusedWindow?.title ?? 'none'} · {windows.length} window(s)
      </div>
    </div>
  );
}

const meta = {
  title: 'Engine/Shell/Windowing/WindowLayer',
  component: WindowLayerHarness,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof WindowLayerHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleWindow: Story = {
  args: {
    initialWindows: [
      createWindow({
        id: 'window:single',
        title: 'Single Window',
        icon: '🪟',
        x: 180,
        y: 120,
        width: 360,
        height: 240,
        zIndex: 1,
        focused: true,
      }),
    ],
  },
};

export const OverlappingSet: Story = {
  args: {
    initialWindows: WINDOWING_WINDOWS,
  },
};

export const UnsortedInputSortedOutput: Story = {
  args: {
    initialWindows: [
      createWindow({ id: 'window:high', title: 'High Z', x: 320, y: 130, zIndex: 9, focused: true }),
      createWindow({ id: 'window:low', title: 'Low Z', x: 120, y: 70, zIndex: 1 }),
      createWindow({ id: 'window:mid', title: 'Mid Z', x: 220, y: 100, zIndex: 5 }),
    ],
  },
};
