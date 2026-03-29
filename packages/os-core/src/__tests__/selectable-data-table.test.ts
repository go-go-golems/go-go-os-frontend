import { describe, expect, it } from 'vitest';
import { filterIndexedRows, filterRows, nextTableSelection, resolveRowKey } from '../components/widgets/SelectableDataTable';

describe('SelectableDataTable helpers', () => {
  const rows = [
    { id: '1', name: 'Alpha', status: 'open' },
    { id: '2', name: 'Beta', status: 'closed' },
    { id: '3', name: 'Gamma', status: 'open' },
  ];

  it('filters rows by search fields', () => {
    expect(filterRows(rows, ['name'], 'alp')).toEqual([rows[0]]);
    expect(filterRows(rows, ['status'], 'open')).toEqual([rows[0], rows[2]]);
    expect(filterRows(rows, ['name'], '')).toEqual(rows);
  });

  it('preserves source indices when filtering rows', () => {
    const noIdRows = [{ name: 'Bravo' }, { name: 'Alpha' }, { name: 'Charlie' }];

    const filtered = filterIndexedRows(noIdRows, ['name'], 'alp');

    expect(filtered).toEqual([{ row: noIdRows[1], sourceIndex: 1 }]);
    expect(resolveRowKey(filtered[0].row, filtered[0].sourceIndex)).toBe('1');
  });

  it('resolves row keys using rowKey string, fn, and fallback', () => {
    expect(resolveRowKey(rows[0], 0, 'id')).toBe('1');
    expect(resolveRowKey(rows[0], 0, (row) => `${row.id}:${row.name}`)).toBe('1:Alpha');
    expect(resolveRowKey({ name: 'NoId' }, 7)).toBe('7');
  });

  it('handles single/multiple selection transitions', () => {
    expect(nextTableSelection([], '1', 'single')).toEqual(['1']);
    expect(nextTableSelection(['1'], '2', 'single')).toEqual(['2']);
    expect(nextTableSelection([], '1', 'multiple')).toEqual(['1']);
    expect(nextTableSelection(['1'], '1', 'multiple')).toEqual([]);
  });
});
