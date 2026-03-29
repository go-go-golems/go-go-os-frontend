import type { FilterConfig } from '../../types';

export interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function FilterBar({ filters, values, onChange }: FilterBarProps) {
  return (
    <>
      {filters.map((f) => {
        if (f.type === 'select') {
          return (
            <select
              key={f.field}
              data-part="field-select"
              style={{ padding: '2px 4px' }}
              value={values[f.field] ?? 'All'}
              onChange={(e) => onChange(f.field, e.target.value)}
            >
              {f.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          );
        }
        return (
          <input
            key={f.field}
            data-part="field-input"
            style={{ flex: 1, minWidth: 80 }}
            placeholder={f.placeholder}
            value={values[f.field] ?? ''}
            onChange={(e) => onChange(f.field, e.target.value)}
          />
        );
      })}
    </>
  );
}
