import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useState } from 'react';
import type { ContentMinSize } from './useContentMinSize';
import { createWindow } from './storyFixtures';
import type { DesktopWindowDef } from './types';
import { useWindowInteractionController } from './useWindowInteractionController';
import { WindowSurface } from './WindowSurface';

/**
 * Demonstrates content-derived minimum window size.
 *
 * The window body contains a toolbar with fixed-width elements (min-width: 140px
 * title area + 140px search input + button + separators). The useContentMinSize
 * hook measures the intrinsic minimum and feeds it back to the interaction
 * controller, preventing the window from being resized below the content floor.
 */

interface ContentMinSizeHarnessProps {
  window: DesktopWindowDef;
  toolbarMinWidth?: number;
  inputWidth?: number;
}

function ContentMinSizeHarness({
  window: initialWindow,
  toolbarMinWidth = 140,
  inputWidth = 140,
}: ContentMinSizeHarnessProps) {
  const [window, setWindow] = useState(initialWindow);
  const [measuredMin, setMeasuredMin] = useState<ContentMinSize | null>(null);

  const moveWindow = useCallback((_id: string, next: { x: number; y: number }) => {
    setWindow((prev) => ({ ...prev, x: next.x, y: next.y }));
  }, []);

  const resizeWindow = useCallback((_id: string, next: { width: number; height: number }) => {
    setWindow((prev) => ({ ...prev, width: next.width, height: next.height }));
  }, []);

  const focusWindow = useCallback(() => {
    setWindow((prev) => ({ ...prev, focused: true }));
  }, []);

  const getMinSizeForWindow = useCallback(() => {
    if (!measuredMin) return undefined;
    return { minWidth: measuredMin.minW, minHeight: measuredMin.minH };
  }, [measuredMin]);

  const { beginMove, beginResize } = useWindowInteractionController({
    getWindowById: () => window,
    onMoveWindow: moveWindow,
    onResizeWindow: resizeWindow,
    onFocusWindow: focusWindow,
    constraints: { minX: 0, minY: 0, minWidth: 180, minHeight: 120 },
    getMinSizeForWindow,
  });

  const handleContentMinSize = useCallback((_windowId: string, size: ContentMinSize) => {
    setMeasuredMin(size);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#c0c0c0' }}>
      <WindowSurface
        window={window}
        onFocusWindow={focusWindow}
        onCloseWindow={() => setWindow((prev) => ({ ...prev, width: 0, height: 0 }))}
        onWindowDragStart={beginMove}
        onWindowResizeStart={beginResize}
        onContentMinSize={handleContentMinSize}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#e8e8e8', borderBottom: '1px solid #ccc' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: toolbarMinWidth }}>
            <span style={{ fontWeight: 'bold', fontSize: 10 }}>Release Cutline / Q2</span>
            <span style={{ fontSize: 9, opacity: 0.65 }}>Launch gates, blockers, and rollout checks.</span>
          </div>
          <span style={{ width: 1, height: 16, background: '#999' }} />
          <button style={{ fontSize: 10, fontWeight: 'bold', whiteSpace: 'nowrap' }}>+ Add Gate</button>
          <span style={{ width: 1, height: 16, background: '#999' }} />
          <input
            placeholder="Search..."
            style={{ width: inputWidth, fontSize: 10, padding: '2px 4px' }}
          />
        </div>
        <div style={{ padding: 10 }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.4 }}>
            Try resizing this window smaller. The content minimum is measured
            automatically from the toolbar&apos;s fixed-width elements.
          </p>
          <div style={{ fontSize: 11, color: '#666', marginTop: 8, fontFamily: 'monospace' }}>
            Size: {window.width}x{window.height}
            {measuredMin ? ` | Min: ${measuredMin.minW}x${measuredMin.minH}` : ' | Measuring...'}
          </div>
        </div>
      </WindowSurface>
    </div>
  );
}

const meta = {
  title: 'Engine/Shell/Windowing/ContentMinSize',
  component: ContentMinSizeHarness,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ContentMinSizeHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToolbarWithFixedWidths: Story = {
  args: {
    window: createWindow({
      id: 'window:kanban',
      title: 'Release Cutline',
      icon: '📋',
      x: 80,
      y: 40,
      width: 600,
      height: 300,
      zIndex: 1,
      focused: true,
    }),
    toolbarMinWidth: 140,
    inputWidth: 140,
  },
};

export const NarrowToolbar: Story = {
  args: {
    window: createWindow({
      id: 'window:narrow',
      title: 'Narrow Toolbar',
      icon: '📏',
      x: 80,
      y: 40,
      width: 400,
      height: 250,
      zIndex: 1,
      focused: true,
    }),
    toolbarMinWidth: 80,
    inputWidth: 80,
  },
};

export const WideToolbar: Story = {
  args: {
    window: createWindow({
      id: 'window:wide',
      title: 'Wide Toolbar',
      icon: '📐',
      x: 80,
      y: 40,
      width: 800,
      height: 300,
      zIndex: 1,
      focused: true,
    }),
    toolbarMinWidth: 200,
    inputWidth: 200,
  },
};
