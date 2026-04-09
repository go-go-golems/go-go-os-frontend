import type { ColumnConfig, RowKeyFn } from './types';
export type SelectableTableMode = 'single' | 'multiple';
export interface SelectableDataTableProps<T = Record<string, unknown>> {
    items: T[];
    columns: ColumnConfig<T>[];
    rowKey?: string | RowKeyFn<T>;
    selectedRowKeys: string[];
    onSelectionChange: (selectedRowKeys: string[]) => void;
    mode?: SelectableTableMode;
    searchable?: boolean;
    searchText?: string;
    onSearchTextChange?: (value: string) => void;
    searchPlaceholder?: string;
    searchFields?: string[];
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
}
export declare function resolveRowKey<T extends Record<string, unknown>>(row: T, index: number, rowKey?: string | RowKeyFn<T>): string;
export declare function filterRows<T extends Record<string, unknown>>(items: T[], fields: string[], query: string): T[];
export interface IndexedTableRow<T extends Record<string, unknown>> {
    row: T;
    sourceIndex: number;
}
export declare function filterIndexedRows<T extends Record<string, unknown>>(items: T[], fields: string[], query: string): IndexedTableRow<T>[];
export declare function nextTableSelection(current: string[], rowId: string, mode: SelectableTableMode): string[];
export declare function SelectableDataTable<T extends Record<string, unknown>>({ items, columns, rowKey, selectedRowKeys, onSelectionChange, mode, searchable, searchText, onSearchTextChange, searchPlaceholder, searchFields, emptyMessage, onRowClick, }: SelectableDataTableProps<T>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SelectableDataTable.d.ts.map