import { jsx as _jsx } from "react/jsx-runtime";
// Window scope context for desktop shell
// Provides window-level scoping for shell components
import { createContext, useContext } from 'react';
const DesktopWindowScopeContext = createContext(null);
/**
 * Provides window-level scoping for desktop shell components.
 * Use this to wrap window content so that shell components
 * can access the window ID via useDesktopWindowId().
 */
export function DesktopWindowScopeProvider({ windowId, children }) {
    return (_jsx(DesktopWindowScopeContext.Provider, { value: windowId, children: children }));
}
/**
 * Hook to get the current window ID from the scope context.
 * Returns null if not inside a DesktopWindowScopeProvider.
 */
export function useDesktopWindowId() {
    return useContext(DesktopWindowScopeContext);
}
//# sourceMappingURL=windowScope.js.map