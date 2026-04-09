import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PARTS } from '../parts/parts';
function nextImageSelection(current, id, mode) {
    if (mode === 'multi') {
        return current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
    }
    return [id];
}
export function ImageChoiceGrid({ items, selectedIds, onSelectionChange, mode = 'select', columns = 3, loading, errorMessage, }) {
    if (loading) {
        return _jsx("div", { "data-part": PARTS.tableEmpty, children: "Loading images..." });
    }
    if (errorMessage) {
        return _jsx("div", { "data-part": PARTS.tableEmpty, children: errorMessage });
    }
    if (items.length === 0) {
        return _jsx("div", { "data-part": PARTS.tableEmpty, children: "No images available" });
    }
    return (_jsx("div", { "data-part": PARTS.confirmWidgetBody, style: {
            gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
        }, children: items.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (_jsxs("button", { type: "button", disabled: item.disabled, "data-part": PARTS.confirmImageCard, "data-state": selected ? 'selected' : undefined, onClick: () => onSelectionChange(nextImageSelection(selectedIds, item.id, mode)), children: [_jsx("img", { src: item.src, alt: item.alt ?? item.label ?? item.id }), _jsx("span", { "data-part": PARTS.confirmProgress, children: item.label ?? item.id }), item.badge && _jsx("span", { "data-part": PARTS.chip, children: item.badge }), mode === 'confirm' && selected && _jsx("span", { "data-part": PARTS.fieldValue, children: "Selected for confirmation" })] }, item.id));
        }) }));
}
//# sourceMappingURL=ImageChoiceGrid.js.map