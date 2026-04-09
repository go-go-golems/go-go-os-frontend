import type { CSSProperties, ReactNode } from 'react';
export interface ColumnConfig<T = Record<string, unknown>> {
    key: string;
    label?: string;
    width?: number | string;
    format?: (value: unknown, row: T) => string;
    cellState?: (value: unknown, row: T) => string | undefined;
    cellStyle?: (value: unknown, row: T) => CSSProperties | undefined;
    renderCell?: (value: unknown, row: T) => ReactNode;
    align?: 'left' | 'right' | 'center';
}
export type FieldType = 'readonly' | 'text' | 'number' | 'boolean' | 'select' | 'tags' | 'label';
export interface FieldConfig {
    id: string;
    label?: string;
    type: FieldType;
    value?: unknown;
    placeholder?: string;
    required?: boolean;
    defaultValue?: unknown;
    step?: number;
    options?: string[];
    style?: string;
}
export interface ComputedFieldConfig<T = Record<string, unknown>> {
    id: string;
    label: string;
    compute: (record: T) => string;
}
export interface FilterConfig {
    field: string;
    type: 'select' | 'text';
    options?: string[];
    placeholder?: string;
}
export interface ActionConfig {
    label: string;
    variant?: 'default' | 'primary' | 'danger';
    action: unknown;
}
export type AggregationType = 'sum' | 'count' | 'avg' | 'min' | 'max';
export interface FooterConfig {
    type: AggregationType;
    field: string;
    label: string;
    format?: (value: number) => string;
}
export type RowKeyFn<T = Record<string, unknown>> = (row: T, index: number) => string;
export interface ReportSection {
    label: string;
    value: string;
}
//# sourceMappingURL=types.d.ts.map