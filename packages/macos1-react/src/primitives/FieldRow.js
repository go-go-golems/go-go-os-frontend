import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
export function FieldRow({ field, value, onChange, style }) {
    const { id, label, type, options, step, placeholder, required } = field;
    const labelEl = (_jsxs("span", { "data-part": "field-label", children: [label ?? id, ":"] }, `${id}l`));
    if (type === 'readonly' || type === 'label') {
        return (_jsxs(_Fragment, { children: [labelEl, _jsx("span", { "data-part": "field-value", style: style, children: String(value ?? '') })] }));
    }
    if (type === 'tags') {
        return (_jsxs(_Fragment, { children: [labelEl, _jsx("span", { "data-part": "field-value", style: style, children: Array.isArray(value) ? value.join(', ') : String(value ?? '') })] }));
    }
    if (type === 'select') {
        return (_jsxs(_Fragment, { children: [labelEl, _jsx("select", { "data-part": "field-select", value: String(value ?? ''), onChange: (e) => onChange(e.target.value), style: { padding: '2px 4px', ...style }, children: options?.map((o) => (_jsx("option", { value: o, children: o }, o))) })] }));
    }
    if (type === 'boolean') {
        return (_jsxs(_Fragment, { children: [labelEl, _jsx("input", { "data-part": "field-checkbox", type: "checkbox", checked: Boolean(value), onChange: (e) => onChange(e.target.checked), style: style })] }));
    }
    return (_jsxs(_Fragment, { children: [labelEl, _jsx("input", { "data-part": "field-input", type: type === 'number' ? 'number' : 'text', value: String(value ?? ''), onChange: (e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value), step: step, placeholder: placeholder, required: required, style: style })] }));
}
//# sourceMappingURL=FieldRow.js.map