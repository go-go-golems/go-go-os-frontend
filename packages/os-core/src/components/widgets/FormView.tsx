import type { FieldConfig } from '../../types';
import { Btn } from './Btn';
import { FieldRow } from './FieldRow';

export interface FormViewProps {
  fields: FieldConfig[];
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
  onSubmit: (values: Record<string, unknown>) => void;
  submitResult?: string | null;
  submitLabel?: string;
  submitVariant?: 'default' | 'primary' | 'danger';
}

export function isMissingRequiredValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  if (typeof value === 'number') {
    return Number.isNaN(value);
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

export function FormView({
  fields,
  values,
  onChange,
  onSubmit,
  submitResult,
  submitLabel,
  submitVariant,
}: FormViewProps) {
  function handleSubmit() {
    if (fields.some((f) => f.required && isMissingRequiredValue(values[f.id]))) return;
    onSubmit(values);
  }

  return (
    <div data-part="form-view">
      <div data-part="field-grid">
        {fields.map((f) => (
          <FieldRow key={f.id} field={f} value={values[f.id]} onChange={(v) => onChange(f.id, v)} />
        ))}
      </div>
      <div data-part="button-group">
        <Btn variant={submitVariant ?? 'primary'} onClick={handleSubmit}>
          {submitLabel ?? 'Submit'}
        </Btn>
        {submitResult && <span data-part="field-value">{submitResult}</span>}
      </div>
    </div>
  );
}
