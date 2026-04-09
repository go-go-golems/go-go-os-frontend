import { type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import type { DesktopWindowDef } from './types';
import type { ContentMinSize } from './useContentMinSize';
export interface WindowLayerProps {
    /** Windows should be pre-sorted by z-index (lowest first). */
    windows: DesktopWindowDef[];
    renderWindowBody?: (window: DesktopWindowDef) => ReactNode;
    onFocusWindow?: (windowId: string) => void;
    onCloseWindow?: (windowId: string) => void;
    onWindowDragStart?: (windowId: string, event: PointerEvent<HTMLDivElement>) => void;
    onWindowResizeStart?: (windowId: string, event: PointerEvent<HTMLButtonElement>) => void;
    onWindowContextMenu?: (windowId: string, event: MouseEvent<HTMLElement>, source: 'surface' | 'title-bar') => void;
    onContentMinSize?: (windowId: string, size: ContentMinSize) => void;
}
export declare function WindowLayer({ windows, renderWindowBody, onFocusWindow, onCloseWindow, onWindowDragStart, onWindowResizeStart, onWindowContextMenu, onContentMinSize, }: WindowLayerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=WindowLayer.d.ts.map