import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PARTS } from '../parts/parts';
export function RadioButton({ label, selected, onChange, disabled }) {
    return (_jsxs("div", { "data-part": PARTS.radioButton, "data-state": disabled ? 'disabled' : selected ? 'selected' : undefined, role: "radio", "aria-checked": selected, "aria-disabled": disabled, onClick: disabled ? undefined : onChange, children: [_jsx("div", { "data-part": PARTS.radioButtonDot }), _jsx("span", { children: label })] }));
}
//# sourceMappingURL=RadioButton.js.map