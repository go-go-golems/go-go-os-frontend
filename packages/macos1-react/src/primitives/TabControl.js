import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef } from 'react';
import { PARTS } from '../parts/parts';
export function TabControl({ tabs, activeTab, onTabChange, children }) {
    const tabRefs = useRef([]);
    const baseId = useId().replace(/:/g, '');
    const panelId = `tab-panel-${baseId}`;
    const focusAndActivate = (index) => {
        onTabChange(index);
        tabRefs.current[index]?.focus();
    };
    const onTabKeyDown = (event, index) => {
        if (tabs.length === 0) {
            return;
        }
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            focusAndActivate((index + 1) % tabs.length);
            return;
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            focusAndActivate((index - 1 + tabs.length) % tabs.length);
            return;
        }
        if (event.key === 'Home') {
            event.preventDefault();
            focusAndActivate(0);
            return;
        }
        if (event.key === 'End') {
            event.preventDefault();
            focusAndActivate(tabs.length - 1);
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onTabChange(index);
        }
    };
    return (_jsxs("div", { "data-part": PARTS.tabControl, children: [_jsx("div", { "data-part": PARTS.tabBar, role: "tablist", children: tabs.map((tab, i) => (_jsx("div", { id: `tab-${baseId}-${i}`, ref: (node) => {
                        tabRefs.current[i] = node;
                    }, "data-part": PARTS.tab, "data-state": activeTab === i ? 'active' : undefined, role: "tab", "aria-selected": activeTab === i, "aria-controls": panelId, tabIndex: activeTab === i ? 0 : -1, onKeyDown: (event) => onTabKeyDown(event, i), onClick: () => onTabChange(i), children: tab }, `${tab}-${i}`))) }), _jsx("div", { id: panelId, "data-part": "content-area", role: "tabpanel", "aria-labelledby": activeTab >= 0 ? `tab-${baseId}-${activeTab}` : undefined, children: children })] }));
}
//# sourceMappingURL=TabControl.js.map