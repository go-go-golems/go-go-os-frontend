import { describe, expect, it } from 'vitest';
import { validateUINode } from './uiSchema';

describe('validateUINode', () => {
  it('accepts a valid panel tree', () => {
    const node = validateUINode({
      kind: 'panel',
      children: [
        { kind: 'text', text: 'hello' },
        {
          kind: 'button',
          props: {
            label: 'Click',
            onClick: { handler: 'clicked', args: { id: 1 } },
          },
        },
      ],
    });

    expect(node.kind).toBe('panel');
  });

  it('rejects unsupported kinds', () => {
    expect(() => validateUINode({ kind: 'unknown' })).toThrow(/not supported/i);
  });

  it('rejects counter nodes after DSL scope reduction', () => {
    expect(() =>
      validateUINode({
        kind: 'counter',
        props: {
          value: 1,
        },
      })
    ).toThrow(/not supported/i);
  });

  it('rejects input without string value', () => {
    expect(() =>
      validateUINode({
        kind: 'input',
        props: { value: 42 },
      })
    ).toThrow(/value must be a string/i);
  });

  it('accepts dropdown, selectableTable, and gridBoard nodes', () => {
    const dropdown = validateUINode({
      kind: 'dropdown',
      props: {
        options: ['A', 'B', 'C'],
        selected: 1,
        onSelect: { handler: 'pick' },
      },
    });
    expect(dropdown.kind).toBe('dropdown');

    const selectable = validateUINode({
      kind: 'selectableTable',
      props: {
        headers: ['ID', 'Name'],
        rows: [
          ['1', 'alpha'],
          ['2', 'beta'],
        ],
        selectedRowKeys: ['2'],
        mode: 'multiple',
        onSelectionChange: { handler: 'setRows' },
      },
    });
    expect(selectable.kind).toBe('selectableTable');

    const gridBoard = validateUINode({
      kind: 'gridBoard',
      props: {
        rows: 3,
        cols: 3,
        cellSize: 'small',
        onSelect: { handler: 'pickCell' },
      },
    });
    expect(gridBoard.kind).toBe('gridBoard');
  });

  it('rejects dropdown with non-string options', () => {
    expect(() =>
      validateUINode({
        kind: 'dropdown',
        props: {
          options: ['A', 2],
          selected: 0,
        },
      })
    ).toThrow(/options must be a string\[]/i);
  });

  it('rejects selectableTable with invalid mode', () => {
    expect(() =>
      validateUINode({
        kind: 'selectableTable',
        props: {
          headers: ['ID'],
          rows: [['1']],
          mode: 'invalid',
        },
      })
    ).toThrow(/mode must be single\|multiple/i);
  });

  it('rejects gridBoard with invalid dimensions', () => {
    expect(() =>
      validateUINode({
        kind: 'gridBoard',
        props: {
          rows: 0,
          cols: 2,
        },
      })
    ).toThrow(/rows must be a positive number/i);
  });
});
