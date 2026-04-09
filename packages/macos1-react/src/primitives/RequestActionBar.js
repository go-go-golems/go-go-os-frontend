import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { PARTS } from '../parts/parts';
import { Btn } from './Btn';
export function RequestActionBar({ primaryLabel, secondaryLabel, onPrimary, onSecondary, commentEnabled, commentPlaceholder, commentValue, onCommentChange, busy, primaryDisabled, secondaryDisabled, }) {
    const [internalComment, setInternalComment] = useState('');
    const resolvedComment = commentValue ?? internalComment;
    const setComment = (value) => {
        onCommentChange?.(value);
        if (onCommentChange === undefined) {
            setInternalComment(value);
        }
    };
    return (_jsxs("div", { "data-part": PARTS.confirmActionBar, children: [commentEnabled && (_jsx("textarea", { "data-part": PARTS.fieldInput, value: resolvedComment, placeholder: commentPlaceholder ?? 'Optional comment', onChange: (event) => setComment(event.target.value), rows: 3, disabled: busy })), _jsxs("div", { "data-part": PARTS.confirmActionButtons, children: [onSecondary && (_jsx(Btn, { variant: "default", onClick: () => onSecondary(resolvedComment), disabled: busy || secondaryDisabled, children: secondaryLabel ?? 'Cancel' })), _jsx(Btn, { variant: "primary", onClick: () => onPrimary(resolvedComment), disabled: busy || primaryDisabled, children: busy ? 'Working...' : (primaryLabel ?? 'Confirm') })] })] }));
}
//# sourceMappingURL=RequestActionBar.js.map