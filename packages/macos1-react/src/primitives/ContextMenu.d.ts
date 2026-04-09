export interface ContextMenuActionEntry {
    id: string;
    label: string;
    commandId?: string;
    shortcut?: string;
    disabled?: boolean;
    checked?: boolean;
    payload?: Record<string, unknown>;
}
export type ContextMenuEntry = string | {
    separator: true;
} | ContextMenuActionEntry;
export interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuEntry[];
    /** Backward-compatible string selection callback. */
    onSelect: (item: string) => void;
    onAction?: (entry: ContextMenuActionEntry) => void;
    onClose: () => void;
}
export declare function ContextMenu({ x, y, items, onSelect, onAction, onClose }: ContextMenuProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ContextMenu.d.ts.map