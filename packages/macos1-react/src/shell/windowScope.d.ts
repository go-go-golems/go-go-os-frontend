import { type ReactNode } from 'react';
export interface DesktopWindowScopeProviderProps {
    windowId: string;
    children: ReactNode;
}
/**
 * Provides window-level scoping for desktop shell components.
 * Use this to wrap window content so that shell components
 * can access the window ID via useDesktopWindowId().
 */
export declare function DesktopWindowScopeProvider({ windowId, children }: DesktopWindowScopeProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * Hook to get the current window ID from the scope context.
 * Returns null if not inside a DesktopWindowScopeProvider.
 */
export declare function useDesktopWindowId(): string | null;
//# sourceMappingURL=windowScope.d.ts.map