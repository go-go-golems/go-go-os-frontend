import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Btn } from './Btn';
export function MenuGrid({ icon, labels, buttons, onAction }) {
    return (_jsxs("div", { "data-part": "card", style: {
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            height: '100%',
            justifyContent: 'center',
        }, children: [icon && _jsx("div", { style: { fontSize: 32 }, children: icon }), labels?.map((l, i) => (_jsx("div", { style: {
                    fontSize: l.style === 'muted' ? 11 : 16,
                    color: l.style === 'muted' ? 'var(--hc-color-muted, #777)' : 'inherit',
                    fontWeight: l.style === 'muted' ? 'normal' : 'bold',
                    textAlign: 'center',
                }, children: l.value }, i))), _jsx("div", { "data-part": "menu-grid", children: buttons.map((b) => (_jsx(Btn, { variant: b.variant, onClick: () => onAction(b.action), style: { width: '100%', textAlign: 'left' }, children: b.label }, b.label))) })] }));
}
//# sourceMappingURL=MenuGrid.js.map