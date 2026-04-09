import type { ColumnConfig, RowKeyFn } from './types';
export interface DataTableProps<T = Record<string, unknown>> {
    items: T[];
    columns: ColumnConfig<T>[];
    rowKey?: string | RowKeyFn<T>;
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
}
export declare function DataTable<T extends Record<string, unknown>>({ items, columns, rowKey, onRowClick, emptyMessage, }: DataTableProps<T>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DataTable.d.ts.map