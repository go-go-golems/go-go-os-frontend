import { jsx as _jsx } from "react/jsx-runtime";
import { PARTS } from '../parts/parts';
export function ProgressBar({ value, width, label }) {
    const clamped = Math.max(0, Math.min(100, value));
    const outerStyle = width != null ? { width } : undefined;
    return (_jsx("div", { "data-part": PARTS.progressBar, role: "progressbar", "aria-valuenow": clamped, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": label, style: outerStyle, children: _jsx("div", { "data-part": PARTS.progressBarFill, style: { width: `${clamped}%` } }) }));
}
//# sourceMappingURL=ProgressBar.js.map