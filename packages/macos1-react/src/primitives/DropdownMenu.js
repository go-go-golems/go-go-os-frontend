import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { PARTS } from '../parts/parts';
export function DropdownMenu({ options, selected, onSelect, width = 150 }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target))
                setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);
    const triggerStyle = { width };
    const panelStyle = { width: typeof width === 'number' ? width + 4 : width };
    return (_jsxs("div", { "data-part": PARTS.dropdownMenu, ref: ref, children: [_jsxs("div", { "data-part": PARTS.dropdownMenuTrigger, "data-state": open ? 'open' : undefined, role: "combobox", "aria-expanded": open, "aria-haspopup": "listbox", onClick: () => setOpen((o) => !o), style: triggerStyle, children: [_jsx("span", { children: options[selected] }), _jsx("span", { style: { fontSize: 8, marginLeft: 8 }, children: "\u25BC" })] }), open && (_jsx("div", { "data-part": PARTS.dropdownMenuPanel, role: "listbox", style: panelStyle, children: options.map((opt, i) => (_jsxs("div", { "data-part": PARTS.dropdownMenuItem, "data-state": i === selected ? 'selected' : undefined, role: "option", "aria-selected": i === selected, onClick: () => {
                        onSelect(i);
                        setOpen(false);
                    }, children: [i === selected ? '✓ ' : '\u00A0\u00A0\u00A0', opt] }, `${opt}-${i}`))) }))] }));
}
//# sourceMappingURL=DropdownMenu.js.map