import { memo, type MouseEvent, type PointerEvent, type ReactNode, useCallback } from 'react';
import { PARTS } from '../../../parts';
import type { DesktopWindowDef } from './types';
import { type ContentMinSize, useContentMinSize } from './useContentMinSize';
import { WindowResizeHandle } from './WindowResizeHandle';
import { WindowTitleBar } from './WindowTitleBar';

export interface WindowSurfaceProps {
  window: DesktopWindowDef;
  children?: ReactNode;
  onFocusWindow?: (windowId: string) => void;
  onCloseWindow?: (windowId: string) => void;
  onWindowDragStart?: (windowId: string, event: PointerEvent<HTMLDivElement>) => void;
  onWindowResizeStart?: (windowId: string, event: PointerEvent<HTMLButtonElement>) => void;
  onWindowContextMenu?: (
    windowId: string,
    event: MouseEvent<HTMLElement>,
    source: 'surface' | 'title-bar',
  ) => void;
  onContentMinSize?: (windowId: string, size: ContentMinSize) => void;
}

interface WindowBodyProps {
  children?: ReactNode;
  onMinSize?: (size: ContentMinSize) => void;
}

const WindowBody = memo(function WindowBody({ children, onMinSize }: WindowBodyProps) {
  const ref = useContentMinSize(onMinSize);
  return (
    <div ref={ref} data-part={PARTS.windowingWindowBody}>
      {children}
    </div>
  );
});

function WindowSurfaceBase({
  window,
  children,
  onFocusWindow,
  onCloseWindow,
  onWindowDragStart,
  onWindowResizeStart,
  onWindowContextMenu,
  onContentMinSize,
}: WindowSurfaceProps) {
  const handleMinSize = useCallback(
    (size: ContentMinSize) => onContentMinSize?.(window.id, size),
    [onContentMinSize, window.id],
  );

  return (
    <section
      data-part={PARTS.windowingWindow}
      data-state={window.focused ? 'focused' : undefined}
      data-variant={window.isDialog ? 'dialog' : undefined}
      role="dialog"
      aria-modal={window.isDialog ?? false}
      aria-label={window.title}
      style={{
        left: window.x,
        top: window.y,
        width: window.width,
        height: window.height,
        zIndex: window.zIndex,
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        onFocusWindow?.(window.id);
      }}
      onContextMenu={(event) => {
        if (event.defaultPrevented) return;
        event.preventDefault();
        onFocusWindow?.(window.id);
        onWindowContextMenu?.(window.id, event, 'surface');
      }}
    >
      <WindowTitleBar
        title={window.title}
        icon={window.icon}
        focused={window.focused}
        onClose={window.isDialog ? undefined : () => onCloseWindow?.(window.id)}
        onPointerDown={window.isDialog ? undefined : (event) => onWindowDragStart?.(window.id, event)}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onFocusWindow?.(window.id);
          onWindowContextMenu?.(window.id, event, 'title-bar');
        }}
      />
      <WindowBody onMinSize={handleMinSize}>{children}</WindowBody>
      {window.isResizable !== false && !window.isDialog ? (
        <WindowResizeHandle onPointerDown={(event) => onWindowResizeStart?.(window.id, event)} />
      ) : null}
    </section>
  );
}

function areWindowSurfacePropsEqual(prev: WindowSurfaceProps, next: WindowSurfaceProps): boolean {
  return (
    prev.children === next.children &&
    prev.onFocusWindow === next.onFocusWindow &&
    prev.onCloseWindow === next.onCloseWindow &&
    prev.onWindowDragStart === next.onWindowDragStart &&
    prev.onWindowResizeStart === next.onWindowResizeStart &&
    prev.onWindowContextMenu === next.onWindowContextMenu &&
    prev.onContentMinSize === next.onContentMinSize &&
    prev.window.id === next.window.id &&
    prev.window.title === next.window.title &&
    prev.window.icon === next.window.icon &&
    prev.window.x === next.window.x &&
    prev.window.y === next.window.y &&
    prev.window.width === next.window.width &&
    prev.window.height === next.window.height &&
    prev.window.zIndex === next.window.zIndex &&
    prev.window.focused === next.window.focused &&
    prev.window.isDialog === next.window.isDialog &&
    prev.window.isResizable === next.window.isResizable
  );
}

export const WindowSurface = memo(WindowSurfaceBase, areWindowSurfacePropsEqual);
