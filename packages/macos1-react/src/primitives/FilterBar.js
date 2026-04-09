import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
export function FilterBar({ filters, values, onChange }) {
    return (_jsx(_Fragment, { children: filters.map((f) => {
            if (f.type === 'select') {
                return (_jsx("select", { "data-part": "field-select", style: { padding: '2px 4px' }, value: values[f.field] ?? 'All', onChange: (e) => onChange(f.field, e.target.value), children: f.options?.map((o) => (_jsx("option", { value: o, children: o }, o))) }, f.field));
            }
            return (_jsx("input", { "data-part": "field-input", style: { flex: 1, minWidth: 80 }, placeholder: f.placeholder, value: values[f.field] ?? '', onChange: (e) => onChange(f.field, e.target.value) }, f.field));
        }) }));
}
//# sourceMappingURL=FilterBar.js.map