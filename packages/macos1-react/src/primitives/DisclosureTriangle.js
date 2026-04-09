import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { PARTS } from '../parts/parts';
export function DisclosureTriangle({ label, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);
    return (_jsxs("div", { "data-part": PARTS.disclosureTriangle, "data-state": open ? 'open' : undefined, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }, onClick: () => setOpen((o) => !o), "aria-expanded": open, children: [_jsx("span", { "data-part": PARTS.disclosureTriangleArrow, children: "\u25B6" }), _jsx("span", { children: label })] }), _jsx("div", { "data-part": PARTS.disclosureTriangleContent, children: children })] }));
}
//# sourceMappingURL=DisclosureTriangle.js.map