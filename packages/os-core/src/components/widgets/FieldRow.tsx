import type { CSSProperties } from 'react';
import type { FieldConfig } from '../../types';

export interface FieldRowProps {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  style?: CSSProperties;
}

export function FieldRow({ field, value, onChange, style }: FieldRowProps) {
  const { id, label, type, options, step, placeholder, required } = field;

  const labelEl = (
    <span key={`${id}l`} data-part="field-label">
      {label ?? id}:
    </span>
  );

  if (type === 'readonly' || type === 'label') {
    return (
      <>
        {labelEl}
        <span data-part="field-value" style={style}>
          {String(value ?? '')}
        </span>
      </>
    );
  }

  if (type === 'tags') {
    return (
      <>
        {labelEl}
        <span data-part="field-value" style={style}>
          {Array.isArray(value) ? (value as string[]).join(', ') : String(value ?? '')}
        </span>
      </>
    );
  }

  if (type === 'select') {
    return (
      <>
        {labelEl}
        <select
          data-part="field-select"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          style={{ padding: '2px 4px', ...style }}
        >
          {options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </>
    );
  }

  if (type === 'boolean') {
    return (
      <>
        {labelEl}
        <input
          data-part="field-checkbox"
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          style={style}
        />
      </>
    );
  }

  return (
    <>
      {labelEl}
      <input
        data-part="field-input"
        type={type === 'number' ? 'number' : 'text'}
        value={String(value ?? '')}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        step={step}
        placeholder={placeholder}
        required={required}
        style={style}
      />
    </>
  );
}
