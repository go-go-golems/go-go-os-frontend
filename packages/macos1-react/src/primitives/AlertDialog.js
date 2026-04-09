import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { PARTS } from '../parts/parts';
import { Btn } from './Btn';
const ICONS = {
    stop: '✋',
    caution: '⚠️',
    note: '🖥️',
};
export function AlertDialog({ type, message, onOK, actions }) {
    const rawId = useId();
    const messageId = `alert-msg-${rawId.replace(/:/g, '')}`;
    const resolvedActions = actions && actions.length > 0 ? actions : [{ label: 'OK', onClick: onOK ?? (() => { }), isDefault: true }];
    return (_jsx("div", { "data-part": PARTS.alertDialog, "data-variant": type, role: "alertdialog", "aria-modal": "true", "aria-describedby": messageId, children: _jsxs("div", { children: [_jsx("div", { "data-part": PARTS.alertDialogIcon, children: ICONS[type] }), _jsxs("div", { children: [_jsx("div", { id: messageId, "data-part": PARTS.alertDialogMessage, children: message }), _jsx("div", { style: { textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }, children: resolvedActions.map((a) => (_jsx(Btn, { isDefault: a.isDefault, onClick: a.onClick, children: a.label }, a.label))) })] })] }) }));
}
//# sourceMappingURL=AlertDialog.js.map