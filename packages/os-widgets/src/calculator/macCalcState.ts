import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  DEFAULT_COL_W,
  EMPTY_CELL,
  NUM_COLS,
  NUM_ROWS,
  cellId,
  type CellData,
  type CellRange,
  type ClipboardData,
} from './types';
import { createSampleCells } from './sampleData';

export const MAC_CALC_STATE_KEY = 'app_rw_mac_calc' as const;

export interface MacCalcSelection {
  r: number;
  c: number;
}

export interface MacCalcStateSeed {
  initialCells?: Record<string, CellData>;
  clipboard?: ClipboardData | null;
  sel?: MacCalcSelection;
  selRange?: CellRange | null;
  isDragging?: boolean;
  dragStart?: MacCalcSelection | null;
  editing?: boolean;
  editVal?: string;
  showFind?: boolean;
  findQuery?: string;
  showPalette?: boolean;
  colWidths?: number[];
}

export interface MacCalcState {
  initialized: boolean;
  cells: Record<string, CellData>;
  clipboard: ClipboardData | null;
  sel: MacCalcSelection;
  selRange: CellRange | null;
  isDragging: boolean;
  dragStart: MacCalcSelection | null;
  editing: boolean;
  editVal: string;
  showFind: boolean;
  findQuery: string;
  showPalette: boolean;
  colWidths: number[];
}

type MacCalcModuleState = MacCalcState | undefined;
type MacCalcStateInput = MacCalcStateSeed | MacCalcState | undefined;

function clampSelection(sel?: MacCalcSelection): MacCalcSelection {
  return {
    r: Math.max(0, Math.min(NUM_ROWS - 1, sel?.r ?? 0)),
    c: Math.max(0, Math.min(NUM_COLS - 1, sel?.c ?? 0)),
  };
}

function normalizeColumnWidths(colWidths?: number[]): number[] {
  const widths = Array(NUM_COLS).fill(DEFAULT_COL_W) as number[];
  if (!colWidths) {
    return widths;
  }
  for (let index = 0; index < Math.min(colWidths.length, NUM_COLS); index += 1) {
    widths[index] = Math.max(40, colWidths[index] ?? DEFAULT_COL_W);
  }
  return widths;
}

export function createMacCalcStateSeed(
  seed: MacCalcStateSeed = {},
): MacCalcState {
  return {
    initialized: true,
    cells: seed.initialCells ?? createSampleCells(),
    clipboard: seed.clipboard ?? null,
    sel: clampSelection(seed.sel),
    selRange: seed.selRange ?? null,
    isDragging: seed.isDragging ?? false,
    dragStart: seed.dragStart ? clampSelection(seed.dragStart) : null,
    editing: seed.editing ?? false,
    editVal: seed.editVal ?? '',
    showFind: seed.showFind ?? false,
    findQuery: seed.findQuery ?? '',
    showPalette: seed.showPalette ?? false,
    colWidths: normalizeColumnWidths(seed.colWidths),
  };
}

function materializeMacCalcState(seed: MacCalcStateInput): MacCalcState {
  if (seed && typeof seed === 'object' && 'cells' in seed && 'colWidths' in seed) {
    return {
      ...seed,
      cells: { ...seed.cells },
      clipboard: seed.clipboard
        ? {
            ...seed.clipboard,
            data: Object.fromEntries(
              Object.entries(seed.clipboard.data).map(([key, value]) => [key, { ...value }]),
            ),
          }
        : null,
      sel: clampSelection(seed.sel),
      selRange: seed.selRange ? { ...seed.selRange } : null,
      dragStart: seed.dragStart ? clampSelection(seed.dragStart) : null,
      colWidths: normalizeColumnWidths(seed.colWidths),
    };
  }

  return createMacCalcStateSeed(seed);
}

const initialState: MacCalcState = {
  ...createMacCalcStateSeed(),
  initialized: false,
};

export const macCalcSlice = createSlice({
  name: 'macCalc',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<MacCalcStateInput>) {
      if (state.initialized) {
        return;
      }
      return materializeMacCalcState(action.payload);
    },
    replaceState(_state, action: PayloadAction<MacCalcStateInput>) {
      return materializeMacCalcState(action.payload);
    },
    setCells(state, action: PayloadAction<Record<string, CellData>>) {
      state.cells = action.payload;
    },
    setSelection(state, action: PayloadAction<MacCalcSelection>) {
      state.sel = clampSelection(action.payload);
    },
    setSelectionRange(state, action: PayloadAction<CellRange | null>) {
      state.selRange = action.payload;
    },
    startDrag(state, action: PayloadAction<MacCalcSelection>) {
      state.isDragging = true;
      state.dragStart = clampSelection(action.payload);
    },
    endDrag(state) {
      state.isDragging = false;
      state.dragStart = null;
    },
    setEditing(state, action: PayloadAction<boolean>) {
      state.editing = action.payload;
    },
    setEditValue(state, action: PayloadAction<string>) {
      state.editVal = action.payload;
    },
    startEdit(
      state,
      action: PayloadAction<MacCalcSelection & { val: string }>,
    ) {
      state.sel = clampSelection(action.payload);
      state.editing = true;
      state.editVal = action.payload.val;
    },
    commitEdit(state) {
      if (!state.editing) {
        return;
      }
      const key = cellId(state.sel.r, state.sel.c);
      const existing = state.cells[key] ?? EMPTY_CELL;
      state.cells = {
        ...state.cells,
        [key]: { ...existing, raw: state.editVal },
      };
      state.editing = false;
    },
    navigate(state, action: PayloadAction<{ dr: number; dc: number }>) {
      let cells = state.cells;
      if (state.editing) {
        const key = cellId(state.sel.r, state.sel.c);
        const existing = state.cells[key] ?? EMPTY_CELL;
        cells = {
          ...state.cells,
          [key]: { ...existing, raw: state.editVal },
        };
      }

      state.cells = cells;
      state.editing = false;
      state.sel = clampSelection({
        r: state.sel.r + action.payload.dr,
        c: state.sel.c + action.payload.dc,
      });
      state.selRange = null;
    },
    togglePalette(state) {
      state.showPalette = !state.showPalette;
    },
    showPalette(state) {
      state.showPalette = true;
    },
    hidePalette(state) {
      state.showPalette = false;
    },
    toggleFind(state) {
      state.showFind = !state.showFind;
    },
    hideFind(state) {
      state.showFind = false;
      state.findQuery = '';
    },
    setFindQuery(state, action: PayloadAction<string>) {
      state.findQuery = action.payload;
    },
    setClipboard(state, action: PayloadAction<ClipboardData | null>) {
      state.clipboard = action.payload;
    },
    resizeColumn(state, action: PayloadAction<{ col: number; width: number }>) {
      const widths = [...state.colWidths];
      widths[action.payload.col] = Math.max(40, action.payload.width);
      state.colWidths = widths;
    },
  },
});

export const macCalcReducer = macCalcSlice.reducer;
export const macCalcActions = macCalcSlice.actions;
export type MacCalcAction = ReturnType<
  (typeof macCalcActions)[keyof typeof macCalcActions]
>;

const selectRawMacCalcState = (rootState: unknown): MacCalcState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, MacCalcModuleState>)[MAC_CALC_STATE_KEY]
    : undefined;

export const selectMacCalcState = createSelector(
  [selectRawMacCalcState],
  (state) => state ?? initialState,
);
