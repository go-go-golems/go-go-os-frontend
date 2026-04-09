// Window scope context for desktop shell
// Provides window-level scoping for shell components
import { createContext, type ReactNode, useContext } from 'react';

const DesktopWindowScopeContext = createContext<string | null>(null);

export interface DesktopWindowScopeProviderProps {
  windowId: string;
  children: ReactNode;
}

/**
 * Provides window-level scoping for desktop shell components.
 * Use this to wrap window content so that shell components
 * can access the window ID via useDesktopWindowId().
 */
export function DesktopWindowScopeProvider({ windowId, children }: DesktopWindowScopeProviderProps) {
  return (
    <DesktopWindowScopeContext.Provider value={windowId}>
      {children}
    </DesktopWindowScopeContext.Provider>
  );
}

/**
 * Hook to get the current window ID from the scope context.
 * Returns null if not inside a DesktopWindowScopeProvider.
 */
export function useDesktopWindowId(): string | null {
  return useContext(DesktopWindowScopeContext);
}
