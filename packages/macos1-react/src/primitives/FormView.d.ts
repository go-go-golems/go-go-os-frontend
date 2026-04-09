import type { FieldConfig } from './types';
export interface FormViewProps {
    fields: FieldConfig[];
    values: Record<string, unknown>;
    onChange: (id: string, value: unknown) => void;
    onSubmit: (values: Record<string, unknown>) => void;
    submitResult?: string | null;
    submitLabel?: string;
    submitVariant?: 'default' | 'primary' | 'danger';
}
export declare function isMissingRequiredValue(value: unknown): boolean;
export declare function FormView({ fields, values, onChange, onSubmit, submitResult, submitLabel, submitVariant, }: FormViewProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FormView.d.ts.map