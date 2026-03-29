import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useState } from 'react';
import { createWindow } from './storyFixtures';
import type { DesktopWindowDef } from './types';
import { useWindowInteractionController } from './useWindowInteractionController';
import { WindowSurface } from './WindowSurface';

interface WindowSurfaceHarnessProps {
  window: DesktopWindowDef;
  content: string;
}

function WindowSurfaceHarness({ window: initialWindow, content }: WindowSurfaceHarnessProps) {
  const [window, setWindow] = useState(initialWindow);

  const moveWindow = useCallback((_id: string, next: { x: number; y: number }) => {
    setWindow((prev) => ({ ...prev, x: next.x, y: next.y }));
  }, []);

  const resizeWindow = useCallback((_id: string, next: { width: number; height: number }) => {
    setWindow((prev) => ({ ...prev, width: next.width, height: next.height }));
  }, []);

  const focusWindow = useCallback(() => {
    setWindow((prev) => ({ ...prev, focused: true }));
  }, []);

  const { beginMove, beginResize } = useWindowInteractionController({
    getWindowById: () => window,
    onMoveWindow: moveWindow,
    onResizeWindow: resizeWindow,
    onFocusWindow: focusWindow,
    constraints: { minX: 0, minY: 0, minWidth: 180, minHeight: 120 },
  });

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#c0c0c0' }}>
      <WindowSurface
        window={window}
        onFocusWindow={focusWindow}
        onCloseWindow={() => setWindow((prev) => ({ ...prev, width: 0, height: 0 }))}
        onWindowDragStart={beginMove}
        onWindowResizeStart={beginResize}
      >
        <div style={{ padding: 10 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 6 }}>{window.title}</div>
          <p style={{ margin: 0, lineHeight: 1.4 }}>{content}</p>
          <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
            ({window.x}, {window.y}) {window.width}×{window.height}
          </div>
        </div>
      </WindowSurface>
    </div>
  );
}

const meta = {
  title: 'Engine/Shell/Windowing/WindowSurface',
  component: WindowSurfaceHarness,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof WindowSurfaceHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FocusedWindow: Story = {
  args: {
    window: createWindow({
      id: 'window:inventory',
      title: 'Inventory',
      icon: '📦',
      x: 120,
      y: 80,
      width: 360,
      height: 240,
      zIndex: 2,
      focused: true,
    }),
    content: 'Focused window — drag the title bar to move, use the corner handle to resize.',
  },
};

export const UnfocusedWindow: Story = {
  args: {
    window: createWindow({
      id: 'window:sales',
      title: 'Sales',
      icon: '📈',
      x: 180,
      y: 100,
      width: 340,
      height: 220,
      zIndex: 1,
      focused: false,
    }),
    content: 'Unfocused state. Click to focus, then drag or resize.',
  },
};

export const TallContent: Story = {
  args: {
    window: createWindow({
      id: 'window:report',
      title: 'Report',
      icon: '📊',
      x: 100,
      y: 60,
      width: 380,
      height: 260,
      zIndex: 1,
      focused: true,
    }),
    content:
      'Longer body content can scroll inside the window surface. The window frame remains stable while body content overflows. Drag the title bar to move this window around.',
  },
};

export const DialogWindow: Story = {
  args: {
    window: createWindow({
      id: 'window:about',
      title: 'About HyperCard Desktop',
      x: 140,
      y: 80,
      width: 320,
      height: 200,
      zIndex: 2,
      focused: true,
      isDialog: true,
    }),
    content: 'Dialog windows have no close box, no drag handle, and no resize handle. They are modal prompts.',
  },
};
