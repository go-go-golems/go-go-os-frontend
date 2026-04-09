import { jsx as _jsx } from "react/jsx-runtime";
import { PARTS } from '../parts/parts';
export function ListBox({ items, selected, onSelect, height = 90, width = 160 }) {
    const style = { height, width };
    return (_jsx("div", { "data-part": PARTS.listBox, role: "listbox", style: style, children: items.map((item, i) => (_jsx("div", { "data-part": PARTS.listBoxItem, "data-state": selected === i ? 'selected' : undefined, role: "option", "aria-selected": selected === i, onClick: () => onSelect(i), children: item }, `${item}-${i}`))) }));
}
//# sourceMappingURL=ListBox.js.map