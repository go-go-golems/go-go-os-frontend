import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { PARTS } from '../parts/parts';
function isSeparator(entry) {
    return typeof entry !== 'string' && 'separator' in entry;
}
function isActionEntry(entry) {
    return typeof entry !== 'string' && !isSeparator(entry);
}
export function ContextMenu({ x, y, items, onSelect, onAction, onClose }) {
    const ref = useRef(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    // Clamp menu position to stay within the viewport
    const [pos, setPos] = useState({ left: x, top: y });
    useEffect(() => {
        if (!ref.current)
            return;
        const rect = ref.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let left = x;
        let top = y;
        if (left + rect.width > vw - 8)
            left = vw - rect.width - 8;
        if (top + rect.height > vh - 8)
            top = vh - rect.height - 8;
        if (left < 8)
            left = 8;
        if (top < 8)
            top = 8;
        setPos({ left, top });
    }, [x, y]);
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target))
                onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);
    useEffect(() => {
        const handler = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);
    // Determine if any item has a checkmark or shortcut for layout columns
    const hasChecks = items.some((e) => isActionEntry(e) && e.checked !== undefined);
    const hasShortcuts = items.some((e) => isActionEntry(e) && e.shortcut);
    return (_jsx("div", { "data-part": PARTS.contextMenu, ref: ref, role: "menu", style: { left: pos.left, top: pos.top }, tabIndex: -1, "data-has-checks": hasChecks || undefined, "data-has-shortcuts": hasShortcuts || undefined, children: items.map((entry, i) => isSeparator(entry) ? (_jsx("div", { "data-part": PARTS.contextMenuSeparator, role: "separator" }, `sep-${i}`)) : isActionEntry(entry) ? (_jsxs("button", { type: "button", "data-part": PARTS.contextMenuItem, role: "menuitem", disabled: entry.disabled, "aria-checked": entry.checked ? true : undefined, "data-state": activeIndex === i ? 'active' : undefined, onMouseEnter: () => setActiveIndex(i), onMouseLeave: () => setActiveIndex(-1), onClick: () => {
                if (entry.disabled)
                    return;
                if (onAction) {
                    onAction(entry);
                }
                else if (entry.commandId) {
                    onSelect(entry.commandId);
                }
                onClose();
            }, children: [_jsx("span", { "data-part": PARTS.contextMenuItemCheck, children: entry.checked ? '✓' : '' }), _jsx("span", { "data-part": PARTS.contextMenuItemLabel, children: entry.label }), entry.shortcut ? (_jsx("span", { "data-part": PARTS.contextMenuItemShortcut, children: entry.shortcut })) : null] }, entry.id)) : (_jsxs("button", { "data-part": PARTS.contextMenuItem, type: "button", role: "menuitem", "data-state": activeIndex === i ? 'active' : undefined, onMouseEnter: () => setActiveIndex(i), onMouseLeave: () => setActiveIndex(-1), onClick: () => {
                onSelect(entry);
                onClose();
            }, children: [hasChecks ? _jsx("span", { "data-part": PARTS.contextMenuItemCheck }) : null, _jsx("span", { "data-part": PARTS.contextMenuItemLabel, children: entry })] }, `${entry}-${i}`))) }));
}
//# sourceMappingURL=ContextMenu.js.map