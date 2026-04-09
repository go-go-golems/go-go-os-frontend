import type { MouseEvent, PointerEvent } from 'react';
export interface WindowTitleBarProps {
    title: string;
    icon?: string;
    focused?: boolean;
    onClose?: () => void;
    onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
    onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
}
export declare function shouldPrefixWindowIcon(title: string, icon?: string): boolean;
export declare function WindowTitleBar({ title, icon, focused, onClose, onPointerDown, onContextMenu }: WindowTitleBarProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=WindowTitleBar.d.ts.map