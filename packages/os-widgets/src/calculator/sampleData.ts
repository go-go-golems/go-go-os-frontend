import type { CellData, CalcAction } from './types';
import { cellId } from './types';

/** Default spreadsheet with a quarterly financial summary. */
export function createSampleCells(): Record<string, CellData> {
  const c: Record<string, CellData> = {};
  const data: string[][] = [
    ['', 'Q1', 'Q2', 'Q3', 'Q4', 'Total'],
    ['Revenue', '1200', '1450', '1380', '1600', '=SUM(B2:E2)'],
    ['Expenses', '800', '920', '870', '950', '=SUM(B3:E3)'],
    ['Profit', '=B2-B3', '=C2-C3', '=D2-D3', '=E2-E3', '=SUM(B4:E4)'],
    ['', '', '', '', '', ''],
    [
      'Margin %',
      '=B4/B2*100',
      '=C4/C2*100',
      '=D4/D2*100',
      '=E4/E2*100',
      '=F4/F2*100',
    ],
  ];
  data.forEach((row, r) =>
    row.forEach((val, col) => {
      if (val)
        c[cellId(r, col)] = {
          raw: val,
          fmt:
            r === 5
              ? 'percent'
              : r >= 1 && r <= 3 && col >= 1 && col <= 5
                ? 'number'
                : 'plain',
          bold: r === 0,
          italic: false,
          align: col === 0 ? 'left' : 'right',
        };
    }),
  );
  return c;
}

/** Command palette actions. */
export const CALC_ACTIONS: CalcAction[] = [
  { id: 'bold', label: 'Bold', icon: '\uD835\uDC01', shortcut: 'Ctrl+B', cat: 'format' },
  { id: 'italic', label: 'Italic', icon: '\uD835\uDC3C', shortcut: 'Ctrl+I', cat: 'format' },
  { id: 'align-left', label: 'Align Left', icon: '\u2AF7', cat: 'format' },
  { id: 'align-center', label: 'Align Center', icon: '\u2AFF', cat: 'format' },
  { id: 'align-right', label: 'Align Right', icon: '\u2AF8', cat: 'format' },
  { id: 'fmt-number', label: 'Format: Number', icon: '#0', cat: 'format' },
  { id: 'fmt-currency', label: 'Format: Currency', icon: '$', cat: 'format' },
  { id: 'fmt-percent', label: 'Format: Percent', icon: '%', cat: 'format' },
  { id: 'fmt-plain', label: 'Format: Plain', icon: 'Aa', cat: 'format' },
  { id: 'insert-row', label: 'Insert Row Below', icon: '\u2795\u2193', cat: 'edit' },
  { id: 'insert-col', label: 'Insert Column Right', icon: '\u2795\u2192', cat: 'edit' },
  { id: 'delete-row', label: 'Delete Row', icon: '\uD83D\uDDD1\uFE0F\u2193', cat: 'edit' },
  { id: 'delete-col', label: 'Delete Column', icon: '\uD83D\uDDD1\uFE0F\u2192', cat: 'edit' },
  { id: 'clear-cell', label: 'Clear Cell(s)', icon: '\u232B', shortcut: 'Delete', cat: 'edit' },
  { id: 'copy', label: 'Copy', icon: '\uD83D\uDCCB', shortcut: 'Ctrl+C', cat: 'edit' },
  { id: 'paste', label: 'Paste', icon: '\uD83D\uDCCC', shortcut: 'Ctrl+V', cat: 'edit' },
  { id: 'select-all', label: 'Select All', icon: '\u2B1B', shortcut: 'Ctrl+A', cat: 'edit' },
  { id: 'sum-insert', label: 'Insert SUM', icon: '\u03A3', cat: 'function' },
  { id: 'avg-insert', label: 'Insert AVERAGE', icon: 'x\u0304', cat: 'function' },
  { id: 'min-insert', label: 'Insert MIN', icon: '\u2193', cat: 'function' },
  { id: 'max-insert', label: 'Insert MAX', icon: '\u2191', cat: 'function' },
  { id: 'count-insert', label: 'Insert COUNT', icon: '#', cat: 'function' },
  { id: 'if-insert', label: 'Insert IF', icon: '?', cat: 'function' },
  { id: 'find', label: 'Find & Replace', icon: '\uD83D\uDD0D', shortcut: 'Ctrl+F', cat: 'view' },
  { id: 'export', label: 'Export as CSV', icon: '\uD83D\uDCBE', cat: 'file' },
];
