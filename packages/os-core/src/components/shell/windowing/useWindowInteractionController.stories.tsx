import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useState } from 'react';
import type { DesktopWindowDef } from './types';
import { useWindowInteractionController, type WindowInteractionConstraints } from './useWindowInteractionController';
import { WindowSurface } from './WindowSurface';

// ── Interactive demo ──

interface InteractionDemoProps {
  constraints?: WindowInteractionConstraints;
  initialWindows?: DesktopWindowDef[];
}

const DEFAULT_WINDOWS: DesktopWindowDef[] = [
  { id: 'a', title: 'Window A', icon: '📦', x: 40, y: 40, width: 320, height: 220, zIndex: 1, focused: true },
  { id: 'b', title: 'Window B', icon: '📊', x: 200, y: 120, width: 280, height: 200, zIndex: 2, focused: false },
];

function buildDenseWindows(count: number): DesktopWindowDef[] {
  return Array.from({ length: count }, (_, idx) => {
    const col = idx % 5;
    const row = Math.floor(idx / 5);
    return {
      id: `dense-${idx + 1}`,
      title: `Dense ${idx + 1}`,
      icon: '🪟',
      x: 20 + col * 180 + (row % 2) * 16,
      y: 20 + row * 130,
      width: 260,
      height: 180,
      zIndex: idx + 1,
      focused: idx === count - 1,
    };
  });
}

function InteractionDemo({ constraints, initialWindows }: InteractionDemoProps) {
  const [windows, setWindows] = useState<DesktopWindowDef[]>(initialWindows ?? DEFAULT_WINDOWS);

  const getWindowById = useCallback((id: string) => windows.find((w) => w.id === id), [windows]);

  const onMoveWindow = useCallback((id: string, next: { x: number; y: number }) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x: next.x, y: next.y } : w)));
  }, []);

  const onResizeWindow = useCallback((id: string, next: { width: number; height: number }) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, width: next.width, height: next.height } : w)));
  }, []);

  const onFocusWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.zIndex));
      return prev.map((w) => (w.id === id ? { ...w, zIndex: maxZ + 1, focused: true } : { ...w, focused: false }));
    });
  }, []);

  const onCloseWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const { beginMove, beginResize } = useWindowInteractionController({
    getWindowById,
    onMoveWindow,
    onResizeWindow,
    onFocusWindow,
    constraints,
  });

  const sorted = [...windows].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#c0c0c0' }}>
      {/* Status bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          right: 8,
          padding: '4px 8px',
          background: '#fff',
          border: '1px solid #000',
          fontFamily: 'monospace',
          fontSize: 11,
          zIndex: 9999,
        }}
      >
        {windows.map((w) => (
          <span key={w.id} style={{ marginRight: 16 }}>
            {w.title}: ({w.x}, {w.y}) {w.width}×{w.height} z={w.zIndex} {w.focused ? '★' : ''}
          </span>
        ))}
      </div>

      {sorted.map((w) => (
        <WindowSurface
          key={w.id}
          window={w}
          onFocusWindow={onFocusWindow}
          onCloseWindow={onCloseWindow}
          onWindowDragStart={beginMove}
          onWindowResizeStart={beginResize}
        >
          <div style={{ padding: 10 }}>
            <p style={{ margin: 0, fontSize: 13 }}>
              Drag the title bar to move. Drag the resize handle (bottom-right corner) to resize.
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: '#666' }}>
              Constraints: minX={constraints?.minX ?? 0}, minY={constraints?.minY ?? 0}, minWidth=
              {constraints?.minWidth ?? 220}, minHeight={constraints?.minHeight ?? 140}
            </p>
          </div>
        </WindowSurface>
      ))}
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Engine/Shell/Windowing/UseWindowInteractionController',
  component: InteractionDemo,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof InteractionDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──

/** Two overlapping windows — drag and resize freely */
export const DefaultConstraints: Story = {
  args: {},
};

/** Tight constraints: min 300×200, can't go above y=50 */
export const TightConstraints: Story = {
  args: {
    constraints: { minX: 0, minY: 50, minWidth: 300, minHeight: 200 },
  },
};

/** Single small window */
export const SingleWindow: Story = {
  args: {
    initialWindows: [
      {
        id: 'solo',
        title: 'Solo Window',
        icon: '🪟',
        x: 100,
        y: 60,
        width: 400,
        height: 280,
        zIndex: 1,
        focused: true,
      },
    ],
  },
};

/** Four windows for stress testing focus and z-order */
export const FourWindows: Story = {
  args: {
    initialWindows: [
      { id: 'a', title: 'Alpha', icon: '🔴', x: 30, y: 30, width: 280, height: 200, zIndex: 1, focused: false },
      { id: 'b', title: 'Beta', icon: '🟢', x: 160, y: 70, width: 280, height: 200, zIndex: 2, focused: false },
      { id: 'c', title: 'Gamma', icon: '🔵', x: 290, y: 110, width: 280, height: 200, zIndex: 3, focused: false },
      { id: 'd', title: 'Delta', icon: '🟡', x: 420, y: 150, width: 280, height: 200, zIndex: 4, focused: true },
    ],
  },
};

/** No constraints at all — windows can be dragged off-screen */
export const NoConstraints: Story = {
  args: {
    constraints: { minX: -9999, minY: -9999, minWidth: 50, minHeight: 50 },
    initialWindows: [
      {
        id: 'free',
        title: 'Free Movement',
        icon: '🌊',
        x: 80,
        y: 60,
        width: 340,
        height: 240,
        zIndex: 1,
        focused: true,
      },
    ],
  },
};

/** 20-window density harness for drag profiling and interaction stress checks. */
export const TwentyWindowDensityHarness: Story = {
  args: {
    constraints: { minX: 0, minY: 0, minWidth: 220, minHeight: 140 },
    initialWindows: buildDenseWindows(20),
  },
};
