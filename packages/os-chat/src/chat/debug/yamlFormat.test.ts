import { describe, expect, it } from 'vitest';
import { toYaml } from './yamlFormat';

describe('toYaml', () => {
  it('formats scalars', () => {
    expect(toYaml(null)).toBe('null');
    expect(toYaml(42)).toBe('42');
    expect(toYaml(true)).toBe('true');
    expect(toYaml('hello')).toBe('hello');
  });

  it('quotes ambiguous strings', () => {
    expect(toYaml('true')).toBe('"true"');
    expect(toYaml('123')).toBe('"123"');
    expect(toYaml('')).toBe('""');
  });

  it('formats flat objects', () => {
    const result = toYaml({ name: 'Running Shoes', qty: 2 });
    expect(result).toBe('name: Running Shoes\nqty: 2');
  });

  it('formats nested objects', () => {
    const result = toYaml({ item: { sku: 'ABC', qty: 5 } });
    expect(result).toBe('item:\n  sku: ABC\n  qty: 5');
  });

  it('formats arrays of scalars', () => {
    const result = toYaml(['a', 'b', 'c']);
    expect(result).toBe('- a\n- b\n- c');
  });

  it('formats arrays of objects', () => {
    const result = toYaml([{ sku: 'A', qty: 1 }, { sku: 'B', qty: 2 }]);
    expect(result).toContain('- sku: A');
    expect(result).toContain('  qty: 1');
    expect(result).toContain('- sku: B');
  });

  it('handles empty containers', () => {
    expect(toYaml([])).toBe('[]');
    expect(toYaml({})).toBe('{}');
  });

  it('respects indentation', () => {
    const result = toYaml({ a: 1 }, 2);
    expect(result).toBe('    a: 1');
  });
});
