import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function DataTable({ items, columns, rowKey, onRowClick, emptyMessage, }) {
    const tpl = columns.map((c) => (typeof c.width === 'number' ? `${c.width}px` : (c.width ?? '1fr'))).join(' ');
    const keyFor = (row, i) => {
        if (typeof rowKey === 'function')
            return rowKey(row, i);
        if (typeof rowKey === 'string')
            return String(row[rowKey]);
        return String(row.id ?? i);
    };
    return (_jsxs("div", { "data-part": "data-table", children: [_jsx("div", { "data-part": "table-header", style: { display: 'grid', gridTemplateColumns: tpl }, children: columns.map((c) => (_jsx("span", { style: { textAlign: c.align }, children: c.label ?? c.key }, c.key))) }), items.length === 0 && _jsx("div", { "data-part": "table-empty", children: emptyMessage ?? 'No items' }), items.map((row, i) => (_jsx("div", { "data-part": "table-row", style: {
                    display: 'grid',
                    gridTemplateColumns: tpl,
                    cursor: onRowClick ? 'pointer' : 'default',
                }, onClick: () => onRowClick?.(row), children: columns.map((c) => {
                    const raw = row[c.key];
                    const state = c.cellState?.(raw, row);
                    const style = c.cellStyle?.(raw, row);
                    const rendered = c.renderCell ? c.renderCell(raw, row) : c.format ? c.format(raw, row) : String(raw ?? '');
                    return (_jsx("span", { "data-part": "table-cell", "data-state": state, style: {
                            textAlign: c.align,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            ...style,
                        }, children: rendered }, c.key));
                }) }, keyFor(row, i))))] }));
}
//# sourceMappingURL=DataTable.js.map