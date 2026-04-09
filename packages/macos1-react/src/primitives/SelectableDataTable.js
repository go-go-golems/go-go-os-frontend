import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { PARTS } from '../parts/parts';
export function resolveRowKey(row, index, rowKey) {
    if (typeof rowKey === 'function') {
        return rowKey(row, index);
    }
    if (typeof rowKey === 'string') {
        return String(row[rowKey]);
    }
    return String(row.id ?? index);
}
export function filterRows(items, fields, query) {
    return filterIndexedRows(items, fields, query).map((entry) => entry.row);
}
function rowMatchesFilter(row, fields, normalizedQuery) {
    if (!normalizedQuery) {
        return true;
    }
    return fields.some((field) => String(row[field] ?? '').toLowerCase().includes(normalizedQuery));
}
export function filterIndexedRows(items, fields, query) {
    const normalized = query.trim().toLowerCase();
    return items.reduce((acc, row, sourceIndex) => {
        if (rowMatchesFilter(row, fields, normalized)) {
            acc.push({ row, sourceIndex });
        }
        return acc;
    }, []);
}
export function nextTableSelection(current, rowId, mode) {
    if (mode === 'single') {
        return [rowId];
    }
    return current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId];
}
export function SelectableDataTable({ items, columns, rowKey, selectedRowKeys, onSelectionChange, mode = 'single', searchable, searchText, onSearchTextChange, searchPlaceholder, searchFields, emptyMessage, onRowClick, }) {
    const [internalSearchText, setInternalSearchText] = useState('');
    const resolvedSearch = searchText ?? internalSearchText;
    const resolvedSearchFields = useMemo(() => (searchFields && searchFields.length > 0 ? searchFields : columns.map((column) => column.key)), [columns, searchFields]);
    const filteredRows = useMemo(() => filterIndexedRows(items, resolvedSearchFields, resolvedSearch), [items, resolvedSearchFields, resolvedSearch]);
    const templateColumns = columns
        .map((column) => (typeof column.width === 'number' ? `${column.width}px` : (column.width ?? '1fr')))
        .join(' ');
    const handleSearchChange = (value) => {
        onSearchTextChange?.(value);
        if (onSearchTextChange === undefined) {
            setInternalSearchText(value);
        }
    };
    const handleRowClick = (row, sourceIndex) => {
        const id = resolveRowKey(row, sourceIndex, rowKey);
        const next = nextTableSelection(selectedRowKeys, id, mode);
        onSelectionChange(next);
        onRowClick?.(row);
    };
    return (_jsxs("div", { "data-part": PARTS.confirmWidgetBody, children: [searchable && (_jsx("input", { "data-part": PARTS.fieldInput, type: "text", value: resolvedSearch, onChange: (event) => handleSearchChange(event.target.value), placeholder: searchPlaceholder ?? 'Search rows...' })), _jsxs("div", { "data-part": PARTS.dataTable, children: [_jsx("div", { "data-part": PARTS.tableHeader, style: { display: 'grid', gridTemplateColumns: templateColumns }, children: columns.map((column) => (_jsx("span", { style: { textAlign: column.align }, children: column.label ?? column.key }, column.key))) }), filteredRows.length === 0 && _jsx("div", { "data-part": PARTS.tableEmpty, children: emptyMessage ?? 'No items' }), filteredRows.map(({ row, sourceIndex }) => {
                        const id = resolveRowKey(row, sourceIndex, rowKey);
                        const selected = selectedRowKeys.includes(id);
                        return (_jsx("button", { type: "button", "data-part": PARTS.tableRow, "data-state": selected ? 'selected' : undefined, onClick: () => handleRowClick(row, sourceIndex), style: {
                                display: 'grid',
                                gridTemplateColumns: templateColumns,
                                textAlign: 'left',
                                width: '100%',
                            }, children: columns.map((column) => {
                                const raw = row[column.key];
                                const state = column.cellState?.(raw, row);
                                const style = column.cellStyle?.(raw, row);
                                const rendered = column.renderCell
                                    ? column.renderCell(raw, row)
                                    : column.format
                                        ? column.format(raw, row)
                                        : String(raw ?? '');
                                return (_jsx("span", { "data-part": PARTS.tableCell, "data-state": state, style: {
                                        textAlign: column.align,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        ...style,
                                    }, children: rendered }, column.key));
                            }) }, id));
                    })] })] }));
}
//# sourceMappingURL=SelectableDataTable.js.map