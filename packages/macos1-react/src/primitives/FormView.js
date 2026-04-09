import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Btn } from './Btn';
import { FieldRow } from './FieldRow';
export function isMissingRequiredValue(value) {
    if (value === undefined || value === null) {
        return true;
    }
    if (typeof value === 'string') {
        return value.trim().length === 0;
    }
    if (typeof value === 'number') {
        return Number.isNaN(value);
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    return false;
}
export function FormView({ fields, values, onChange, onSubmit, submitResult, submitLabel, submitVariant, }) {
    function handleSubmit() {
        if (fields.some((f) => f.required && isMissingRequiredValue(values[f.id])))
            return;
        onSubmit(values);
    }
    return (_jsxs("div", { "data-part": "form-view", children: [_jsx("div", { "data-part": "field-grid", children: fields.map((f) => (_jsx(FieldRow, { field: f, value: values[f.id], onChange: (v) => onChange(f.id, v) }, f.id))) }), _jsxs("div", { "data-part": "button-group", children: [_jsx(Btn, { variant: submitVariant ?? 'primary', onClick: handleSubmit, children: submitLabel ?? 'Submit' }), submitResult && _jsx("span", { "data-part": "field-value", children: submitResult })] })] }));
}
//# sourceMappingURL=FormView.js.map