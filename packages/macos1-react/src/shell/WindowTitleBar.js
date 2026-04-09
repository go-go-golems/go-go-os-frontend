import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PARTS } from '../parts/parts';
export function shouldPrefixWindowIcon(title, icon) {
    if (!icon) {
        return false;
    }
    return !title.trimStart().startsWith(icon);
}
export function WindowTitleBar({ title, icon, focused, onClose, onPointerDown, onContextMenu }) {
    const prefixIcon = shouldPrefixWindowIcon(title, icon) ? `${icon} ` : '';
    return (_jsxs("div", { "data-part": PARTS.windowingWindowTitleBar, "data-state": focused ? 'focused' : undefined, onPointerDown: onPointerDown, onContextMenu: onContextMenu, children: [_jsx("button", { type: "button", "data-part": PARTS.windowingCloseButton, "aria-label": `Close ${title}`, onClick: (event) => {
                    event.stopPropagation();
                    onClose?.();
                } }), _jsxs("div", { "data-part": PARTS.windowingWindowTitle, children: [prefixIcon, title] })] }));
}
//# sourceMappingURL=WindowTitleBar.js.map