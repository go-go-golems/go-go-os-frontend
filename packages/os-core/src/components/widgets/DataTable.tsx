import type { ColumnConfig, RowKeyFn } from '../../types';

export interface DataTableProps<T = Record<string, unknown>> {
  items: T[];
  columns: ColumnConfig<T>[];
  rowKey?: string | RowKeyFn<T>;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  items,
  columns,
  rowKey,
  onRowClick,
  emptyMessage,
}: DataTableProps<T>) {
  const tpl = columns.map((c) => (typeof c.width === 'number' ? `${c.width}px` : (c.width ?? '1fr'))).join(' ');

  const keyFor = (row: T, i: number) => {
    if (typeof rowKey === 'function') return rowKey(row, i);
    if (typeof rowKey === 'string') return String(row[rowKey]);
    return String((row as Record<string, unknown>).id ?? i);
  };

  return (
    <div data-part="data-table">
      <div data-part="table-header" style={{ display: 'grid', gridTemplateColumns: tpl }}>
        {columns.map((c) => (
          <span key={c.key} style={{ textAlign: c.align }}>
            {c.label ?? c.key}
          </span>
        ))}
      </div>
      {items.length === 0 && <div data-part="table-empty">{emptyMessage ?? 'No items'}</div>}
      {items.map((row, i) => (
        <div
          key={keyFor(row, i)}
          data-part="table-row"
          style={{
            display: 'grid',
            gridTemplateColumns: tpl,
            cursor: onRowClick ? 'pointer' : 'default',
          }}
          onClick={() => onRowClick?.(row)}
        >
          {columns.map((c) => {
            const raw = row[c.key as keyof T] as unknown;
            const state = c.cellState?.(raw, row);
            const style = c.cellStyle?.(raw, row);
            const rendered = c.renderCell ? c.renderCell(raw, row) : c.format ? c.format(raw, row) : String(raw ?? '');

            return (
              <span
                key={c.key}
                data-part="table-cell"
                data-state={state}
                style={{
                  textAlign: c.align,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  ...style,
                }}
              >
                {rendered}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
