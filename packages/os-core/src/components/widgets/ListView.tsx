import { useState } from 'react';
import type { ActionConfig, ColumnConfig, FilterConfig, FooterConfig, RowKeyFn } from '../../types';
import { Btn } from './Btn';
import { DataTable } from './DataTable';
import { FilterBar } from './FilterBar';

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

export function ListView<T extends Record<string, unknown>>({
  items: rawItems,
  columns,
  rowKey,
  filters,
  searchFields,
  toolbar,
  footer,
  emptyMessage,
  onRowClick,
  onAction,
  preFilter,
}: ListViewProps<T>) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Apply pre-filter
  let items = preFilter ? preFilter(rawItems) : [...rawItems];

  // Apply user filters
  for (const [key, val] of Object.entries(filterValues)) {
    if (!val || val === 'All') continue;
    if (key === '_search' && searchFields) {
      const lower = val.toLowerCase();
      items = items.filter((i) =>
        searchFields.some((f) =>
          String(i[f as keyof T] ?? '')
            .toLowerCase()
            .includes(lower),
        ),
      );
    } else {
      items = items.filter((i) => String(i[key as keyof T]) === val);
    }
  }

  // Footer aggregation
  let footerText: string | null = null;
  if (footer) {
    const vals = items.map((i) => Number(i[footer.field as keyof T] ?? 0));
    let result = 0;
    switch (footer.type) {
      case 'sum':
        result = vals.reduce((a, b) => a + b, 0);
        break;
      case 'count':
        result = vals.length;
        break;
      case 'avg':
        result = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        break;
      case 'min':
        result = vals.length ? Math.min(...vals) : 0;
        break;
      case 'max':
        result = vals.length ? Math.max(...vals) : 0;
        break;
    }
    footerText = `${footer.label}: ${footer.format ? footer.format(result) : result.toFixed(2)}`;
  }

  return (
    <div data-part="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {(filters || toolbar) && (
        <div data-part="filter-bar" style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
          {filters && (
            <FilterBar
              filters={filters}
              values={filterValues}
              onChange={(f, v) => setFilterValues((p) => ({ ...p, [f]: v }))}
            />
          )}
          {toolbar?.map((b) => (
            <Btn key={b.label} variant={b.variant} onClick={() => onAction?.(b.action)}>
              {b.label}
            </Btn>
          ))}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <DataTable
          items={items}
          columns={columns}
          rowKey={rowKey}
          onRowClick={onRowClick}
          emptyMessage={emptyMessage}
        />
      </div>
      {footerText && <div data-part="table-footer">{footerText}</div>}
      <div data-part="status-bar">
        {items.length} row{items.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
