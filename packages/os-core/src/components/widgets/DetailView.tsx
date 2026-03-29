import type { CSSProperties } from 'react';
import { Fragment } from 'react';
import type { ActionConfig, ComputedFieldConfig, FieldConfig } from '../../types';
import { Btn } from './Btn';
import { FieldRow } from './FieldRow';

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

export function DetailView<T extends Record<string, unknown>>({
  record,
  fields,
  computed,
  edits,
  onEdit,
  actions,
  onAction,
  fieldHighlight,
}: DetailViewProps<T>) {
  const current = { ...record, ...edits } as T;

  return (
    <div data-part="detail-view">
      <div data-part="field-grid">
        {fields.map((f) => {
          const val = current[f.id as keyof T] as unknown;
          const highlight = fieldHighlight?.(f.id, val, current);
          return <FieldRow key={f.id} field={f} value={val} onChange={(v) => onEdit(f.id, v)} style={highlight} />;
        })}
        {computed?.map((cf) => (
          <Fragment key={cf.id}>
            <span data-part="field-label">{cf.label}:</span>
            <span data-part="field-value">{cf.compute(current)}</span>
          </Fragment>
        ))}
      </div>
      {actions && (
        <div data-part="button-group">
          {actions.map((a) => (
            <Btn key={a.label} variant={a.variant} onClick={() => onAction?.(a.action)}>
              {a.label}
            </Btn>
          ))}
        </div>
      )}
    </div>
  );
}
