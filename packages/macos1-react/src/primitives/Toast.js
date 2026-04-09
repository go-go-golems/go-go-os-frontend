import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
export function Toast({ message, onDone, duration = 1800 }) {
    useEffect(() => {
        const t = setTimeout(onDone, duration);
        return () => clearTimeout(t);
    }, [onDone, duration]);
    return _jsx("div", { "data-part": "toast", children: message });
}
//# sourceMappingURL=Toast.js.map