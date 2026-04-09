import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PARTS } from '../parts/parts';
/** True when every icon has explicit x/y coordinates. */
function hasExplicitPositions(icons) {
    return icons.length > 0 && icons.every((i) => i.x != null && i.y != null);
}
function IconButton({ icon, isSelected, onSelect, onOpen, onContextMenu, }) {
    return (_jsxs("button", { type: "button", "data-part": PARTS.windowingIcon, "data-state": isSelected ? 'selected' : undefined, "aria-pressed": isSelected, "aria-label": icon.label, onClick: onSelect, onDoubleClick: onOpen, onContextMenu: (event) => {
            event.preventDefault();
            onContextMenu?.(event);
        }, onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpen();
            }
        }, children: [_jsx("span", { "data-part": PARTS.windowingIconGlyph, "aria-hidden": "true", children: icon.icon }), _jsx("span", { "data-part": PARTS.windowingIconLabel, children: icon.label })] }));
}
export function DesktopIconLayer({ icons, selectedIconId, onSelectIcon, onOpenIcon, onContextMenuIcon, }) {
    const useAbsolute = hasExplicitPositions(icons);
    return (_jsx("ul", { "data-part": PARTS.windowingIconLayer, "data-layout": useAbsolute ? 'absolute' : 'grid', "aria-label": "Desktop icons", children: icons.map((icon) => {
            const isSelected = selectedIconId === icon.id;
            if (useAbsolute) {
                return (_jsx("li", { style: { position: 'absolute', left: icon.x, top: icon.y }, children: _jsx(IconButton, { icon: icon, isSelected: isSelected, onSelect: () => onSelectIcon?.(icon.id), onOpen: () => onOpenIcon?.(icon.id), onContextMenu: (event) => onContextMenuIcon?.(icon.id, event) }) }, icon.id));
            }
            return (_jsx("li", { children: _jsx(IconButton, { icon: icon, isSelected: isSelected, onSelect: () => onSelectIcon?.(icon.id), onOpen: () => onOpenIcon?.(icon.id), onContextMenu: (event) => onContextMenuIcon?.(icon.id, event) }) }, icon.id));
        }) }));
}
//# sourceMappingURL=DesktopIconLayer.js.map