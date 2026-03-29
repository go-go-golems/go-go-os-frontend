import { Component, type ErrorInfo, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { PARTS } from '../../../parts';
import { DesktopWindowScopeProvider } from './desktopMenuRuntime';
import type { DesktopWindowDef } from './types';
import type { ContentMinSize } from './useContentMinSize';
import { WindowSurface } from './WindowSurface';

export interface WindowLayerProps {
  /** Windows should be pre-sorted by z-index (lowest first). */
  windows: DesktopWindowDef[];
  renderWindowBody?: (window: DesktopWindowDef) => ReactNode;
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

interface WindowRenderErrorBoundaryProps {
  windowId: string;
  title: string;
  children?: ReactNode;
}

interface WindowRenderErrorBoundaryState {
  error: string | null;
}

class WindowRenderErrorBoundary extends Component<
  WindowRenderErrorBoundaryProps,
  WindowRenderErrorBoundaryState
> {
  state: WindowRenderErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): WindowRenderErrorBoundaryState {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('[WindowRenderErrorBoundary] Window body crashed', {
      windowId: this.props.windowId,
      title: this.props.title,
      error,
      errorInfo,
    });
  }

  componentDidUpdate(prevProps: WindowRenderErrorBoundaryProps) {
    if (this.state.error && prevProps.windowId !== this.props.windowId) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <section
          style={{
            padding: 12,
            display: 'grid',
            gap: 8,
            color: '#7f1d1d',
            background: '#fff7f7',
            height: '100%',
            alignContent: 'start',
          }}
        >
          <strong>Window render error</strong>
          <span>{this.props.title}</span>
          <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{this.state.error}</code>
        </section>
      );
    }

    return this.props.children;
  }
}

export function WindowLayer({
  windows,
  renderWindowBody,
  onFocusWindow,
  onCloseWindow,
  onWindowDragStart,
  onWindowResizeStart,
  onWindowContextMenu,
  onContentMinSize,
}: WindowLayerProps) {
  return (
    <section data-part={PARTS.windowingWindowLayer} aria-label="Window layer">
      {windows.map((window) => (
        <WindowSurface
          key={window.id}
          window={window}
          onFocusWindow={onFocusWindow}
          onCloseWindow={onCloseWindow}
          onWindowDragStart={onWindowDragStart}
          onWindowResizeStart={onWindowResizeStart}
          onWindowContextMenu={onWindowContextMenu}
          onContentMinSize={onContentMinSize}
        >
          <WindowRenderErrorBoundary windowId={window.id} title={window.title}>
            <DesktopWindowScopeProvider windowId={window.id}>
              {renderWindowBody?.(window)}
            </DesktopWindowScopeProvider>
          </WindowRenderErrorBoundary>
        </WindowSurface>
      ))}
    </section>
  );
}
