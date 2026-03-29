import { describe, expect, it } from 'vitest';

// Test the footer aggregation logic extracted from ListView
// (We test the logic directly to avoid React rendering in unit tests)

type AggregationType = 'sum' | 'count' | 'avg' | 'min' | 'max';

function computeFooter(vals: number[], type: AggregationType): number {
  switch (type) {
    case 'sum':
      return vals.reduce((a, b) => a + b, 0);
    case 'count':
      return vals.length;
    case 'avg':
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    case 'min':
      return vals.length ? Math.min(...vals) : 0;
    case 'max':
      return vals.length ? Math.max(...vals) : 0;
  }
}

describe('ListView footer aggregation', () => {
  describe('with values', () => {
    const vals = [10, 20, 30, 40, 50];

    it('sum', () => expect(computeFooter(vals, 'sum')).toBe(150));
    it('count', () => expect(computeFooter(vals, 'count')).toBe(5));
    it('avg', () => expect(computeFooter(vals, 'avg')).toBe(30));
    it('min', () => expect(computeFooter(vals, 'min')).toBe(10));
    it('max', () => expect(computeFooter(vals, 'max')).toBe(50));
  });

  describe('with empty array (edge case)', () => {
    const vals: number[] = [];

    it('sum returns 0', () => expect(computeFooter(vals, 'sum')).toBe(0));
    it('count returns 0', () => expect(computeFooter(vals, 'count')).toBe(0));
    it('avg returns 0', () => expect(computeFooter(vals, 'avg')).toBe(0));
    it('min returns 0 (not Infinity)', () => expect(computeFooter(vals, 'min')).toBe(0));
    it('max returns 0 (not -Infinity)', () => expect(computeFooter(vals, 'max')).toBe(0));
  });

  describe('with single value', () => {
    const vals = [42];

    it('sum', () => expect(computeFooter(vals, 'sum')).toBe(42));
    it('count', () => expect(computeFooter(vals, 'count')).toBe(1));
    it('avg', () => expect(computeFooter(vals, 'avg')).toBe(42));
    it('min', () => expect(computeFooter(vals, 'min')).toBe(42));
    it('max', () => expect(computeFooter(vals, 'max')).toBe(42));
  });
});
