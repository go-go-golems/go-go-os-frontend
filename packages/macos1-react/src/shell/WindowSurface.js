import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useCallback } from 'react';
import { PARTS } from '../parts/parts';
import { useContentMinSize } from './useContentMinSize';
import { WindowResizeHandle } from './WindowResizeHandle';
import { WindowTitleBar } from './WindowTitleBar';
const WindowBody = memo(function WindowBody({ children, onMinSize }) {
    const ref = useContentMinSize(onMinSize);
    return (_jsx("div", { ref: ref, "data-part": PARTS.windowingWindowBody, children: children }));
});
function WindowSurfaceBase({ window, children, onFocusWindow, onCloseWindow, onWindowDragStart, onWindowResizeStart, onWindowContextMenu, onContentMinSize, }) {
    const handleMinSize = useCallback((size) => onContentMinSize?.(window.id, size), [onContentMinSize, window.id]);
    return (_jsxs("section", { "data-part": PARTS.windowingWindow, "data-state": window.focused ? 'focused' : undefined, "data-variant": window.isDialog ? 'dialog' : undefined, role: "dialog", "aria-modal": window.isDialog ?? false, "aria-label": window.title, style: {
            left: window.x,
            top: window.y,
            width: window.width,
            height: window.height,
            zIndex: window.zIndex,
        }, onPointerDown: (event) => {
            if (event.button !== 0)
                return;
            onFocusWindow?.(window.id);
        }, onContextMenu: (event) => {
            if (event.defaultPrevented)
                return;
            event.preventDefault();
            onFocusWindow?.(window.id);
            onWindowContextMenu?.(window.id, event, 'surface');
        }, children: [_jsx(WindowTitleBar, { title: window.title, icon: window.icon, focused: window.focused, onClose: window.isDialog ? undefined : () => onCloseWindow?.(window.id), onPointerDown: window.isDialog ? undefined : (event) => onWindowDragStart?.(window.id, event), onContextMenu: (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onFocusWindow?.(window.id);
                    onWindowContextMenu?.(window.id, event, 'title-bar');
                } }), _jsx(WindowBody, { onMinSize: handleMinSize, children: children }), window.isResizable !== false && !window.isDialog ? (_jsx(WindowResizeHandle, { onPointerDown: (event) => onWindowResizeStart?.(window.id, event) })) : null] }));
}
function areWindowSurfacePropsEqual(prev, next) {
    return (prev.children === next.children &&
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
        prev.window.isResizable === next.window.isResizable);
}
export const WindowSurface = memo(WindowSurfaceBase, areWindowSurfacePropsEqual);
//# sourceMappingURL=WindowSurface.js.map