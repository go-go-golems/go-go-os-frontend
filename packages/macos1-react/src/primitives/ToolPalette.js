import { jsx as _jsx } from "react/jsx-runtime";
import { PARTS } from '../parts/parts';
export function ToolPalette({ tools, selected, onSelect, columns }) {
    const style = columns != null ? { ['--hc-tool-columns']: columns } : undefined;
    return (_jsx("div", { "data-part": PARTS.toolPalette, role: "toolbar", "aria-label": "Tool palette", style: style, children: tools.map((t, i) => (_jsx("div", { "data-part": PARTS.toolPaletteItem, "data-state": selected === i ? 'selected' : undefined, role: "radio", "aria-checked": selected === i, "aria-label": t.label, title: t.label, onClick: () => onSelect(i), children: t.icon }, `${t.label}-${i}`))) }));
}
//# sourceMappingURL=ToolPalette.js.map