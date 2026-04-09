import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import { PARTS } from '../parts/parts';
import { DesktopWindowScopeProvider } from './windowScope';
import { WindowSurface } from './WindowSurface';
class WindowRenderErrorBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error: error instanceof Error ? error.message : String(error) };
    }
    componentDidCatch(error, errorInfo) {
        console.error('[WindowRenderErrorBoundary] Window body crashed', {
            windowId: this.props.windowId,
            title: this.props.title,
            error,
            errorInfo,
        });
    }
    componentDidUpdate(prevProps) {
        if (this.state.error && prevProps.windowId !== this.props.windowId) {
            this.setState({ error: null });
        }
    }
    render() {
        if (this.state.error) {
            return (_jsxs("section", { style: {
                    padding: 12,
                    display: 'grid',
                    gap: 8,
                    color: '#7f1d1d',
                    background: '#fff7f7',
                    height: '100%',
                    alignContent: 'start',
                }, children: [_jsx("strong", { children: "Window render error" }), _jsx("span", { children: this.props.title }), _jsx("code", { style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' }, children: this.state.error })] }));
        }
        return this.props.children;
    }
}
export function WindowLayer({ windows, renderWindowBody, onFocusWindow, onCloseWindow, onWindowDragStart, onWindowResizeStart, onWindowContextMenu, onContentMinSize, }) {
    return (_jsx("section", { "data-part": PARTS.windowingWindowLayer, "aria-label": "Window layer", children: windows.map((window) => (_jsx(WindowSurface, { window: window, onFocusWindow: onFocusWindow, onCloseWindow: onCloseWindow, onWindowDragStart: onWindowDragStart, onWindowResizeStart: onWindowResizeStart, onWindowContextMenu: onWindowContextMenu, onContentMinSize: onContentMinSize, children: _jsx(WindowRenderErrorBoundary, { windowId: window.id, title: window.title, children: _jsx(DesktopWindowScopeProvider, { windowId: window.id, children: renderWindowBody?.(window) }) }) }, window.id))) }));
}
//# sourceMappingURL=WindowLayer.js.map