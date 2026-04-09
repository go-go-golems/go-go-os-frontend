import { jsx as _jsx } from "react/jsx-runtime";
export function Btn({ children, active, isDefault, variant, style, ...rest }) {
    const state = isDefault ? 'default' : active ? 'active' : undefined;
    return (_jsx("button", { "data-part": "btn", "data-state": state, "data-variant": variant !== 'default' ? variant : undefined, style: style, ...rest, children: children }));
}
//# sourceMappingURL=Btn.js.map