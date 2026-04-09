import type { ReactNode } from 'react';
export interface SelectableListItem {
    id: string;
    label: string;
    description?: string;
    icon?: ReactNode;
    meta?: string;
    keywords?: string[];
    disabled?: boolean;
}
export type SelectableListInputItem = string | SelectableListItem;
export type SelectableListSelectionMode = 'single' | 'multiple';
export interface SelectableListProps {
    items: SelectableListInputItem[];
    selectedIds: string[];
    onSelectionChange: (selectedIds: string[]) => void;
    mode?: SelectableListSelectionMode;
    searchable?: boolean;
    searchPlaceholder?: string;
    searchText?: string;
    onSearchTextChange?: (value: string) => void;
    onSubmit?: (selectedIds: string[]) => void;
    height?: number | string;
    width?: number | string;
    emptyMessage?: string;
}
export declare function normalizeSelectableListItems(items: SelectableListInputItem[]): SelectableListItem[];
export declare function nextSelection(current: string[], id: string, mode: SelectableListSelectionMode, disabled?: boolean): string[];
export declare function SelectableList({ items, selectedIds, onSelectionChange, mode, searchable, searchPlaceholder, searchText, onSearchTextChange, onSubmit, height, width, emptyMessage, }: SelectableListProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SelectableList.d.ts.map