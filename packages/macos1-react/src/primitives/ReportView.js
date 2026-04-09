import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Btn } from './Btn';
export function ReportView({ sections, actions, onAction }) {
    return (_jsxs("div", { "data-part": "report-view", children: [_jsx("div", { style: { border: '2px solid var(--hc-color-border, #000)', maxWidth: 400 }, children: sections.map((sec, i) => (_jsxs("div", { "data-part": "report-row", style: {
                        borderBottom: i < sections.length - 1 ? '1px solid #ccc' : 'none',
                        background: i % 2 ? '#f8f8f4' : '#fff',
                    }, children: [_jsx("span", { children: sec.label }), _jsx("span", { style: { fontWeight: 'bold' }, children: sec.value })] }, sec.label))) }), actions && (_jsx("div", { style: { marginTop: 10, display: 'flex', gap: 6 }, children: actions.map((a) => (_jsx(Btn, { variant: a.variant, onClick: () => onAction?.(a.action), children: a.label }, a.label))) }))] }));
}
//# sourceMappingURL=ReportView.js.map