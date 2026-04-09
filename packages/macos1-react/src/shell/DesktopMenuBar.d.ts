import type { DesktopCommandInvocation, DesktopMenuSection } from './types';
export interface DesktopMenuBarProps {
    sections: DesktopMenuSection[];
    activeMenuId: string | null;
    onActiveMenuChange?: (menuId: string | null) => void;
    onCommand?: (commandId: string, menuId: string, invocation: DesktopCommandInvocation) => void;
}
export declare function DesktopMenuBar({ sections, activeMenuId, onActiveMenuChange, onCommand }: DesktopMenuBarProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DesktopMenuBar.d.ts.map