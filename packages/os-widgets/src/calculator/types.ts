export type CellFormat = 'plain' | 'number' | 'currency' | 'percent';
export type CellAlign = 'left' | 'center' | 'right';

export interface CellData {
  raw: string;
  fmt: CellFormat;
  bold: boolean;
  italic: boolean;
  align: CellAlign;
}

export interface CellRange {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

export interface CalcAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  cat: string;
}

export interface ClipboardData {
  data: Record<string, CellData>;
  rows: number;
  cols: number;
}

export const NUM_ROWS = 50;
export const NUM_COLS = 26;
export const DEFAULT_COL_W = 88;
export const ROW_H = 26;
export const HEADER_H = 28;
export const ROW_HEADER_W = 42;

export const colLabel = (c: number): string => String.fromCharCode(65 + c);
export const cellId = (r: number, c: number): string => `${colLabel(c)}${r + 1}`;
export const parseRef = (ref: string): { r: number; c: number } | null => {
  const m = ref.match(/^([A-Z])(\d+)$/);
  if (!m) return null;
  return { r: parseInt(m[2]) - 1, c: m[1].charCodeAt(0) - 65 };
};

export const EMPTY_CELL: CellData = {
  raw: '',
  fmt: 'plain',
  bold: false,
  italic: false,
  align: 'left',
};
