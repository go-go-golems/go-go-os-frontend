import type { ActionConfig, ColumnConfig, FilterConfig, FooterConfig, RowKeyFn } from './types';
export interface ListViewProps<T = Record<string, unknown>> {
    items: T[];
    columns: ColumnConfig<T>[];
    rowKey?: string | RowKeyFn<T>;
    filters?: FilterConfig[];
    searchFields?: string[];
    toolbar?: ActionConfig[];
    footer?: FooterConfig;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
    onAction?: (action: unknown) => void;
    preFilter?: (items: T[]) => T[];
}
export declare function ListView<T extends Record<string, unknown>>({ items: rawItems, columns, rowKey, filters, searchFields, toolbar, footer, emptyMessage, onRowClick, onAction, preFilter, }: ListViewProps<T>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ListView.d.ts.map