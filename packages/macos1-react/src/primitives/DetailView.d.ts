import type { CSSProperties } from 'react';
import type { ActionConfig, ComputedFieldConfig, FieldConfig } from './types';
export interface DetailViewProps<T = Record<string, unknown>> {
    record: T;
    fields: FieldConfig[];
    computed?: ComputedFieldConfig<T>[];
    edits: Record<string, unknown>;
    onEdit: (id: string, value: unknown) => void;
    actions?: ActionConfig[];
    onAction?: (action: unknown) => void;
    fieldHighlight?: (fieldId: string, value: unknown, record: T) => CSSProperties | undefined;
}
export declare function DetailView<T extends Record<string, unknown>>({ record, fields, computed, edits, onEdit, actions, onAction, fieldHighlight, }: DetailViewProps<T>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DetailView.d.ts.map