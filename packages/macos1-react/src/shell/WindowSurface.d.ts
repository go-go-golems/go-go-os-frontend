import { type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import type { DesktopWindowDef } from './types';
import { type ContentMinSize } from './useContentMinSize';
export interface WindowSurfaceProps {
    window: DesktopWindowDef;
    children?: ReactNode;
    onFocusWindow?: (windowId: string) => void;
    onCloseWindow?: (windowId: string) => void;
    onWindowDragStart?: (windowId: string, event: PointerEvent<HTMLDivElement>) => void;
    onWindowResizeStart?: (windowId: string, event: PointerEvent<HTMLButtonElement>) => void;
    onWindowContextMenu?: (windowId: string, event: MouseEvent<HTMLElement>, source: 'surface' | 'title-bar') => void;
    onContentMinSize?: (windowId: string, size: ContentMinSize) => void;
}
declare function WindowSurfaceBase({ window, children, onFocusWindow, onCloseWindow, onWindowDragStart, onWindowResizeStart, onWindowContextMenu, onContentMinSize, }: WindowSurfaceProps): import("react/jsx-runtime").JSX.Element;
export declare const WindowSurface: import("react").MemoExoticComponent<typeof WindowSurfaceBase>;
export {};
//# sourceMappingURL=WindowSurface.d.ts.map