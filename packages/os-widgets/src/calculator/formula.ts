import type { CellData } from './types';
import { cellId, parseRef } from './types';

/**
 * Evaluate a spreadsheet formula (=SUM, =AVERAGE, etc.) or return raw value.
 * Supports: SUM, AVERAGE, MIN, MAX, COUNT, ABS, SQRT, ROUND, POWER, IF, CONCAT
 * and arithmetic with cell references.
 */
export function evaluateFormula(
  expr: string,
  cells: Record<string, CellData>,
  visited: Set<string> = new Set(),
): string | number {
  if (!expr.startsWith('=')) return expr;
  const formula = expr.slice(1).trim();

  const resolveCell = (ref: string): string | number => {
    const upper = ref.toUpperCase();
    if (visited.has(upper)) return '#CIRC!';
    visited.add(upper);
    const p = parseRef(upper);
    if (!p) return '#REF!';
    const raw = cells[upper]?.raw || '';
    if (!raw) return 0;
    if (raw.startsWith('=')) {
      return evaluateFormula(raw, cells, new Set(visited));
    }
    const n = parseFloat(raw);
    return isNaN(n) ? raw : n;
  };

  const resolveRange = (rangeStr: string): (string | number)[] => {
    const [startRef, endRef] = rangeStr.split(':');
    const s = parseRef(startRef.toUpperCase());
    const e = parseRef(endRef.toUpperCase());
    if (!s || !e) return [];
    const vals: (string | number)[] = [];
    for (let r = Math.min(s.r, e.r); r <= Math.max(s.r, e.r); r++) {
      for (let c = Math.min(s.c, e.c); c <= Math.max(s.c, e.c); c++) {
        const v = resolveCell(cellId(r, c));
        if (
          typeof v === 'number' ||
          (typeof v === 'string' && !v.startsWith('#'))
        )
          vals.push(v);
      }
    }
    return vals;
  };

  try {
    let processed = formula;

    const fnReplace = (
      name: string,
      fn: (vals: (string | number)[]) => string | number,
    ) => {
      const regex = new RegExp(`${name}\\(([^)]+)\\)`, 'gi');
      processed = processed.replace(regex, (_, args: string) => {
        const parts = args.split(',').map((a) => a.trim());
        const allVals: (string | number)[] = [];
        parts.forEach((p) => {
          if (p.includes(':')) {
            allVals.push(...resolveRange(p));
          } else {
            const ref = parseRef(p.toUpperCase());
            if (ref) allVals.push(resolveCell(p.toUpperCase()));
            else {
              const n = parseFloat(p);
              allVals.push(isNaN(n) ? p : n);
            }
          }
        });
        return String(fn(allVals));
      });
    };

    fnReplace('SUM', (vals) =>
      vals.reduce((a: number, b) => (typeof b === 'number' ? a + b : a), 0),
    );
    fnReplace('AVERAGE', (vals) => {
      const nums = vals.filter((v): v is number => typeof v === 'number');
      return nums.length
        ? nums.reduce((a, b) => a + b, 0) / nums.length
        : 0;
    });
    fnReplace('MIN', (vals) =>
      Math.min(...vals.filter((v): v is number => typeof v === 'number')),
    );
    fnReplace('MAX', (vals) =>
      Math.max(...vals.filter((v): v is number => typeof v === 'number')),
    );
    fnReplace('COUNT', (vals) =>
      vals.filter((v): v is number => typeof v === 'number').length,
    );
    fnReplace('ABS', (vals) =>
      Math.abs(typeof vals[0] === 'number' ? vals[0] : 0),
    );
    fnReplace('SQRT', (vals) =>
      Math.sqrt(typeof vals[0] === 'number' ? vals[0] : 0),
    );

    // ROUND(value, decimals)
    processed = processed.replace(
      /ROUND\(([^,)]+),\s*([^)]+)\)/gi,
      (_, vExpr: string, dExpr: string) => {
        const v = parseRef(vExpr.trim().toUpperCase())
          ? resolveCell(vExpr.trim().toUpperCase())
          : parseFloat(vExpr);
        const d = parseFloat(dExpr);
        return typeof v === 'number'
          ? v.toFixed(isNaN(d) ? 0 : d)
          : '#VAL!';
      },
    );

    // POWER(base, exp)
    processed = processed.replace(
      /POWER\(([^,)]+),\s*([^)]+)\)/gi,
      (_, bExpr: string, eExpr: string) => {
        const b = parseRef(bExpr.trim().toUpperCase())
          ? resolveCell(bExpr.trim().toUpperCase())
          : parseFloat(bExpr);
        const exp = parseRef(eExpr.trim().toUpperCase())
          ? resolveCell(eExpr.trim().toUpperCase())
          : parseFloat(eExpr);
        return String(
          Math.pow(
            typeof b === 'number' ? b : 0,
            typeof exp === 'number' ? exp : 0,
          ),
        );
      },
    );

    // IF(cond, trueVal, falseVal)
    processed = processed.replace(
      /IF\(([^,]+),\s*([^,]+),\s*([^)]+)\)/gi,
      (_, cond: string, t: string, f: string) => {
        let condStr = cond.trim();
        condStr = condStr.replace(/\b([A-Z]\d+)\b/gi, (m) => {
          const v = resolveCell(m.toUpperCase());
          return typeof v === 'string' ? `"${v}"` : String(v);
        });
        try {
          return new Function(`"use strict"; return (${condStr})`)()
            ? t.trim()
            : f.trim();
        } catch {
          return '#ERR!';
        }
      },
    );

    // CONCAT
    processed = processed.replace(
      /CONCAT\(([^)]+)\)/gi,
      (_, args: string) => {
        return `"${args
          .split(',')
          .map((a) => {
            const t = a.trim();
            const ref = parseRef(t.toUpperCase());
            if (ref) return String(resolveCell(t.toUpperCase()));
            return t.replace(/"/g, '');
          })
          .join('')}"`;
      },
    );

    // Replace remaining cell references
    processed = processed.replace(/\b([A-Z]\d+)\b/gi, (m) => {
      const v = resolveCell(m.toUpperCase());
      if (typeof v === 'string' && v.startsWith('#')) return `"${v}"`;
      return typeof v === 'string' ? `"${v}"` : String(v);
    });

    const result = new Function(`"use strict"; return (${processed})`)();
    if (typeof result === 'number' && !isFinite(result)) return '#DIV/0!';
    return result;
  } catch {
    return '#ERR!';
  }
}
