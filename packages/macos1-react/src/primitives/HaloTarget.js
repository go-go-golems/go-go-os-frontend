import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { PARTS } from '../parts/parts';
const DEFAULT_HANDLES = [
    { id: 'delete', position: 'top-left', color: '#e22', icon: '✕', label: 'Delete' },
    { id: 'inspect', position: 'top-center', color: '#28f', icon: '🔍', label: 'Inspect' },
    { id: 'duplicate', position: 'top-right', color: '#2a2', icon: '📋', label: 'Duplicate' },
    { id: 'rotate', position: 'middle-left', color: '#f80', icon: '🔄', label: 'Rotate' },
    { id: 'resize', position: 'middle-right', color: '#a3f', icon: '↔️', label: 'Resize' },
    { id: 'browse', position: 'bottom-left', color: '#0bb', icon: '👁️', label: 'Browse' },
    { id: 'grab', position: 'bottom-center', color: '#f5a', icon: '✋', label: 'Grab' },
    { id: 'debug', position: 'bottom-right', color: '#cb0', icon: '📐', label: 'Debug' },
];
const POSITION_STYLES = {
    'top-left': { left: '-12px', top: '-12px' },
    'top-center': { left: 'calc(50% - 10px)', top: '-12px' },
    'top-right': { left: 'calc(100% - 8px)', top: '-12px' },
    'middle-left': { left: '-12px', top: 'calc(50% - 10px)' },
    'middle-right': { left: 'calc(100% - 8px)', top: 'calc(50% - 10px)' },
    'bottom-left': { left: '-12px', top: 'calc(100% - 8px)' },
    'bottom-center': { left: 'calc(50% - 10px)', top: 'calc(100% - 8px)' },
    'bottom-right': { left: 'calc(100% - 8px)', top: 'calc(100% - 8px)' },
};
export function HaloTarget({ label, children, handles, onHandle }) {
    const [showHalo, setShowHalo] = useState(false);
    const resolvedHandles = handles ?? DEFAULT_HANDLES;
    return (_jsxs("div", { "data-part": PARTS.haloTarget, onMouseEnter: () => setShowHalo(true), onMouseLeave: () => setShowHalo(false), children: [showHalo && (_jsxs(_Fragment, { children: [_jsx("div", { "data-part": PARTS.haloBorder }), resolvedHandles.map((h) => (_jsx("div", { "data-part": PARTS.haloHandle, title: h.label, style: {
                            ...POSITION_STYLES[h.position],
                            background: h.color,
                        }, onClick: () => onHandle?.(h.id), children: h.icon }, h.id))), _jsx("div", { "data-part": PARTS.haloLabel, children: label })] })), _jsx("div", { style: { position: 'relative', zIndex: 5 }, children: children })] }));
}
//# sourceMappingURL=HaloTarget.js.map