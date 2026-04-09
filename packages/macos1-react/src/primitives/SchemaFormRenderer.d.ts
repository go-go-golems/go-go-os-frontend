import type { FieldConfig } from './types';
export interface JsonSchemaNode {
    type?: string;
    title?: string;
    enum?: unknown[];
    properties?: Record<string, JsonSchemaNode>;
    required?: string[];
    default?: unknown;
    readOnly?: boolean;
    description?: string;
}
export interface SchemaFormRendererProps {
    schema: JsonSchemaNode;
    value?: Record<string, unknown>;
    onValueChange?: (value: Record<string, unknown>) => void;
    onSubmit: (value: Record<string, unknown>) => void;
    submitLabel?: string;
    submitVariant?: 'default' | 'primary' | 'danger';
    submitResult?: string | null;
}
export declare function schemaToFieldConfigs(schema: JsonSchemaNode): FieldConfig[];
export declare function coerceSchemaValues(schema: JsonSchemaNode, value: Record<string, unknown>): Record<string, unknown>;
export declare function SchemaFormRenderer({ schema, value, onValueChange, onSubmit, submitLabel, submitVariant, submitResult, }: SchemaFormRendererProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SchemaFormRenderer.d.ts.map