import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Btn } from './Btn';
import { DataTable } from './DataTable';
import { FilterBar } from './FilterBar';
export function ListView({ items: rawItems, columns, rowKey, filters, searchFields, toolbar, footer, emptyMessage, onRowClick, onAction, preFilter, }) {
    const [filterValues, setFilterValues] = useState({});
    // Apply pre-filter
    let items = preFilter ? preFilter(rawItems) : [...rawItems];
    // Apply user filters
    for (const [key, val] of Object.entries(filterValues)) {
        if (!val || val === 'All')
            continue;
        if (key === '_search' && searchFields) {
            const lower = val.toLowerCase();
            items = items.filter((i) => searchFields.some((f) => String(i[f] ?? '')
                .toLowerCase()
                .includes(lower)));
        }
        else {
            items = items.filter((i) => String(i[key]) === val);
        }
    }
    // Footer aggregation
    let footerText = null;
    if (footer) {
        const vals = items.map((i) => Number(i[footer.field] ?? 0));
        let result = 0;
        switch (footer.type) {
            case 'sum':
                result = vals.reduce((a, b) => a + b, 0);
                break;
            case 'count':
                result = vals.length;
                break;
            case 'avg':
                result = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                break;
            case 'min':
                result = vals.length ? Math.min(...vals) : 0;
                break;
            case 'max':
                result = vals.length ? Math.max(...vals) : 0;
                break;
        }
        footerText = `${footer.label}: ${footer.format ? footer.format(result) : result.toFixed(2)}`;
    }
    return (_jsxs("div", { "data-part": "card", style: { display: 'flex', flexDirection: 'column', height: '100%' }, children: [(filters || toolbar) && (_jsxs("div", { "data-part": "filter-bar", style: { display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }, children: [filters && (_jsx(FilterBar, { filters: filters, values: filterValues, onChange: (f, v) => setFilterValues((p) => ({ ...p, [f]: v })) })), toolbar?.map((b) => (_jsx(Btn, { variant: b.variant, onClick: () => onAction?.(b.action), children: b.label }, b.label)))] })), _jsx("div", { style: { flex: 1, overflow: 'auto' }, children: _jsx(DataTable, { items: items, columns: columns, rowKey: rowKey, onRowClick: onRowClick, emptyMessage: emptyMessage }) }), footerText && _jsx("div", { "data-part": "table-footer", children: footerText }), _jsxs("div", { "data-part": "status-bar", children: [items.length, " row", items.length !== 1 ? 's' : ''] })] }));
}
//# sourceMappingURL=ListView.js.map