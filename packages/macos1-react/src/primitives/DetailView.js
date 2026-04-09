import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from 'react';
import { Btn } from './Btn';
import { FieldRow } from './FieldRow';
export function DetailView({ record, fields, computed, edits, onEdit, actions, onAction, fieldHighlight, }) {
    const current = { ...record, ...edits };
    return (_jsxs("div", { "data-part": "detail-view", children: [_jsxs("div", { "data-part": "field-grid", children: [fields.map((f) => {
                        const val = current[f.id];
                        const highlight = fieldHighlight?.(f.id, val, current);
                        return _jsx(FieldRow, { field: f, value: val, onChange: (v) => onEdit(f.id, v), style: highlight }, f.id);
                    }), computed?.map((cf) => (_jsxs(Fragment, { children: [_jsxs("span", { "data-part": "field-label", children: [cf.label, ":"] }), _jsx("span", { "data-part": "field-value", children: cf.compute(current) })] }, cf.id)))] }), actions && (_jsx("div", { "data-part": "button-group", children: actions.map((a) => (_jsx(Btn, { variant: a.variant, onClick: () => onAction?.(a.action), children: a.label }, a.label))) }))] }));
}
//# sourceMappingURL=DetailView.js.map