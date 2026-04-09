import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PARTS } from '../parts/parts';
export function Checkbox({ label, checked, onChange, disabled }) {
    return (_jsxs("div", { "data-part": PARTS.checkbox, "data-state": disabled ? 'disabled' : checked ? 'checked' : undefined, role: "checkbox", "aria-checked": checked, "aria-disabled": disabled, onClick: disabled ? undefined : onChange, children: [_jsx("div", { "data-part": PARTS.checkboxMark, children: checked ? '✕' : '' }), _jsx("span", { children: label })] }));
}
//# sourceMappingURL=Checkbox.js.map