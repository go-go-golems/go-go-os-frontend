import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { PARTS } from '../parts/parts';
function isSeparator(entry) {
    return 'separator' in entry && entry.separator === true;
}
export function DesktopMenuBar({ sections, activeMenuId, onActiveMenuChange, onCommand }) {
    const menuBaseId = useId();
    return (_jsx("div", { "data-part": PARTS.windowingMenuBar, role: "menubar", "aria-label": "Desktop menu bar", onKeyDown: (event) => {
            if (event.key === 'Escape') {
                onActiveMenuChange?.(null);
            }
        }, children: sections.map((section) => {
            const isOpen = activeMenuId === section.id;
            const panelId = `${menuBaseId}-${section.id}`;
            return (_jsxs("div", { style: { position: 'relative' }, children: [_jsx("button", { type: "button", "data-part": PARTS.windowingMenuButton, "data-state": isOpen ? 'open' : undefined, role: "menuitem", "aria-haspopup": "menu", "aria-expanded": isOpen, "aria-controls": panelId, onClick: () => onActiveMenuChange?.(isOpen ? null : section.id), onMouseEnter: () => {
                            if (activeMenuId && activeMenuId !== section.id) {
                                onActiveMenuChange?.(section.id);
                            }
                        }, onKeyDown: (event) => {
                            if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onActiveMenuChange?.(section.id);
                            }
                        }, children: section.label }), isOpen ? (_jsx("div", { id: panelId, "data-part": PARTS.windowingMenuPanel, role: "menu", "aria-label": section.label, children: section.items.map((entry, idx) => isSeparator(entry) ? (_jsx("hr", { "data-part": PARTS.windowingMenuSeparator }, `sep-${idx}`)) : (_jsxs("button", { type: "button", "data-part": PARTS.windowingMenuItem, role: "menuitem", disabled: entry.disabled, onClick: () => {
                                onCommand?.(entry.commandId, section.id, { source: 'menu', menuId: section.id });
                                onActiveMenuChange?.(null);
                            }, children: [_jsx("span", { children: entry.label }), entry.shortcut ? _jsx("span", { "data-part": PARTS.windowingMenuShortcut, children: entry.shortcut }) : null] }, entry.id))) })) : null] }, section.id));
        }) }));
}
//# sourceMappingURL=DesktopMenuBar.js.map