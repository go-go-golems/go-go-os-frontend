import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { FormView } from './FormView';
function inferFieldType(node) {
    if (node.readOnly) {
        return 'readonly';
    }
    if (Array.isArray(node.enum) && node.enum.length > 0) {
        return 'select';
    }
    if (node.type === 'number' || node.type === 'integer') {
        return 'number';
    }
    if (node.type === 'boolean') {
        return 'boolean';
    }
    return 'text';
}
export function schemaToFieldConfigs(schema) {
    const required = new Set(schema.required ?? []);
    const properties = schema.properties ?? {};
    return Object.entries(properties).map(([id, node]) => {
        const fieldType = inferFieldType(node);
        return {
            id,
            label: node.title ?? id,
            placeholder: node.description,
            type: fieldType,
            required: required.has(id),
            defaultValue: fieldType === 'select' && node.default !== undefined
                ? String(node.default)
                : fieldType === 'number' && node.default !== undefined
                    ? Number(node.default)
                    : fieldType === 'boolean' && node.default !== undefined
                        ? Boolean(node.default)
                        : node.default,
            options: fieldType === 'select' ? node.enum?.map((value) => String(value)) : undefined,
        };
    });
}
export function coerceSchemaValues(schema, value) {
    const properties = schema.properties ?? {};
    const next = { ...value };
    for (const [id, node] of Object.entries(properties)) {
        const raw = value[id];
        if (raw === undefined || raw === null || raw === '') {
            continue;
        }
        if (node.type === 'number' || node.type === 'integer') {
            next[id] = typeof raw === 'number' ? raw : Number(raw);
            continue;
        }
        if (node.type === 'boolean') {
            if (typeof raw === 'boolean') {
                next[id] = raw;
            }
            else {
                next[id] = String(raw).toLowerCase() === 'true';
            }
        }
    }
    return next;
}
export function SchemaFormRenderer({ schema, value, onValueChange, onSubmit, submitLabel, submitVariant, submitResult, }) {
    const fields = useMemo(() => schemaToFieldConfigs(schema), [schema]);
    const initialValue = useMemo(() => {
        const defaults = fields.reduce((acc, field) => {
            if (field.defaultValue !== undefined) {
                acc[field.id] = field.defaultValue;
            }
            return acc;
        }, {});
        return {
            ...defaults,
            ...(value ?? {}),
        };
    }, [fields, value]);
    const [internalValues, setInternalValues] = useState(initialValue);
    const resolvedValue = value ?? internalValues;
    useEffect(() => {
        if (onValueChange === undefined) {
            setInternalValues(initialValue);
        }
    }, [initialValue, onValueChange]);
    const updateValue = (next) => {
        onValueChange?.(next);
        if (onValueChange === undefined) {
            setInternalValues(next);
        }
    };
    return (_jsx(FormView, { fields: fields, values: resolvedValue, onChange: (id, fieldValue) => updateValue({ ...resolvedValue, [id]: fieldValue }), onSubmit: (currentValue) => onSubmit(coerceSchemaValues(schema, currentValue)), submitLabel: submitLabel, submitVariant: submitVariant, submitResult: submitResult }));
}
//# sourceMappingURL=SchemaFormRenderer.js.map