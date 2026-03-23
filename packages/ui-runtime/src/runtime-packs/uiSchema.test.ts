import { describe, expect, it } from 'vitest';
import { validateUINode } from './uiSchema';

describe('validateUINode', () => {
  it('accepts a basic panel tree', () => {
    const node = validateUINode({
      kind: 'panel',
      children: [{ kind: 'text', text: 'Hello runtime surface' }],
    });

    expect(node.kind).toBe('panel');
  });

  it('rejects unsupported node kinds', () => {
    expect(() => validateUINode({ kind: 'unknown' })).toThrow(/not supported/i);
  });

  it('validates button event refs', () => {
    expect(() =>
      validateUINode({
        kind: 'button',
        props: { label: 'Broken', onClick: {} },
      }),
    ).toThrow(/handler/i);
  });

  it('validates dropdown payloads', () => {
    const dropdown = validateUINode({
      kind: 'dropdown',
      props: { options: ['One', 'Two'], selected: 1 },
    });

    expect(dropdown.kind).toBe('dropdown');
  });

  it('validates selectable table payloads', () => {
    const selectable = validateUINode({
      kind: 'selectableTable',
      props: {
        headers: ['SKU'],
        rows: [['A-1']],
        selectedRowKeys: ['A-1'],
      },
    });

    expect(selectable.kind).toBe('selectableTable');
  });

  it('validates gridBoard payloads', () => {
    const gridBoard = validateUINode({
      kind: 'gridBoard',
      props: { rows: 2, cols: 3, cells: [{ label: 'A' }] },
    });

    expect(gridBoard.kind).toBe('gridBoard');
  });
});
