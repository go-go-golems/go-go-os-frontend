import { jsx as _jsx } from "react/jsx-runtime";
import { PARTS } from '../parts/parts';
function sizePx(cellSize) {
    switch (cellSize) {
        case 'small':
            return 44;
        case 'large':
            return 76;
        case 'medium':
        default:
            return 60;
    }
}
function fallbackCellLabel(row, col) {
    return `${row + 1},${col + 1}`;
}
export function GridBoard({ rows, cols, cells = [], selectedIndex, cellSize = 'medium', disabled, onSelect, }) {
    const normalizedRows = Number.isFinite(rows) ? Math.max(1, Math.floor(rows)) : 1;
    const normalizedCols = Number.isFinite(cols) ? Math.max(1, Math.floor(cols)) : 1;
    const edge = sizePx(cellSize);
    return (_jsx("div", { "data-part": PARTS.confirmWidgetBody, children: _jsx("div", { style: {
                display: 'grid',
                gridTemplateColumns: `repeat(${normalizedCols}, ${edge}px)`,
                gap: 4,
            }, children: Array.from({ length: normalizedRows * normalizedCols }).map((_, index) => {
                const row = Math.floor(index / normalizedCols);
                const col = index % normalizedCols;
                const cell = cells[index] ?? {};
                const isDisabled = disabled || cell.disabled === true;
                const isSelected = selectedIndex === index;
                const label = cell.label ?? cell.value ?? fallbackCellLabel(row, col);
                return (_jsx("button", { type: "button", "data-part": PARTS.confirmGridCell, "data-state": isSelected ? 'active' : undefined, disabled: isDisabled, onClick: () => onSelect?.({ row, col, cellIndex: index }), style: {
                        width: edge,
                        height: edge,
                        ...(cell.color ? { background: cell.color } : {}),
                        ...(cell.style ? { borderStyle: cell.style } : {}),
                    }, children: label }, index));
            }) }) }));
}
//# sourceMappingURL=GridBoard.js.map