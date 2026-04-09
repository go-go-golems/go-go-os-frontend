import { jsx as _jsx } from "react/jsx-runtime";
import { PARTS } from '../parts/parts';
export function WindowResizeHandle({ onPointerDown }) {
    return (_jsx("button", { type: "button", "data-part": PARTS.windowingResizeHandle, "aria-label": "Resize window", onPointerDown: onPointerDown }));
}
//# sourceMappingURL=WindowResizeHandle.js.map