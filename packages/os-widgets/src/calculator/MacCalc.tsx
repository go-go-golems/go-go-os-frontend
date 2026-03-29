import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Btn } from '@go-go-golems/os-core';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { CommandPalette } from '../primitives/CommandPalette';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { Separator } from '../primitives/Separator';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import type { CellData, CellRange, ClipboardData, CellFormat } from './types';
import {
  NUM_ROWS,
  NUM_COLS,
  ROW_H,
  HEADER_H,
  ROW_HEADER_W,
  EMPTY_CELL,
  colLabel,
  cellId,
} from './types';
import { evaluateFormula } from './formula';
import { CALC_ACTIONS } from './sampleData';
import {
  createMacCalcStateSeed,
  MAC_CALC_STATE_KEY,
  macCalcActions,
  type MacCalcAction,
  type MacCalcState,
  macCalcReducer,
  selectMacCalcState,
} from './macCalcState';

function FindBar({
  query,
  onFind,
  onReplace,
  onReplaceAll,
  onClose,
  matchCount,
}: {
  query: string;
  onFind: (q: string) => void;
  onReplace: (f: string, r: string) => void;
  onReplaceAll: (f: string, r: string) => void;
  onClose: () => void;
  matchCount: number;
}) {
  const [replace, setReplace] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div data-part={P.calcFindBar}>
      <span style={{ color: 'var(--hc-confirm-selected-bg, #000)' }}>
        {'\uD83D\uDD0D'}
      </span>
      <input
        ref={ref}
        value={query}
        onChange={(event) => onFind(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
        placeholder="Find\u2026"
        data-part={P.calcFindInput}
      />
      <input
        value={replace}
        onChange={(event) => setReplace(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
        placeholder="Replace\u2026"
        data-part={P.calcFindInput}
      />
      <Btn
        onClick={() => onReplace(query, replace)}
        style={{ fontSize: 11 }}
      >
        Replace
      </Btn>
      <Btn
        onClick={() => onReplaceAll(query, replace)}
        style={{ fontSize: 11 }}
      >
        All
      </Btn>
      <span style={{ color: 'var(--hc-color-muted)', fontSize: 11 }}>
        {matchCount > 0 ? `${matchCount}` : query ? '0' : ''}
      </span>
      <div
        onClick={onClose}
        style={{
          marginLeft: 'auto',
          cursor: 'pointer',
          opacity: 0.5,
          fontSize: 15,
        }}
      >
        {'\u2715'}
      </div>
    </div>
  );
}

export interface MacCalcProps {
  initialCells?: Record<string, CellData>;
}

function MacCalcInner({
  state,
  dispatch,
}: {
  state: MacCalcState;
  dispatch: (action: MacCalcAction) => void;
}) {
  const {
    cells,
    clipboard,
    sel,
    selRange,
    isDragging,
    dragStart,
    editing,
    editVal,
    showFind,
    findQuery,
    showPalette,
    colWidths,
  } = state;

  const gridRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const getCell = useCallback(
    (r: number, c: number): CellData => cells[cellId(r, c)] || EMPTY_CELL,
    [cells],
  );

  const setCell = useCallback(
    (r: number, c: number, updates: Partial<CellData>) => {
      const key = cellId(r, c);
      dispatch(
        macCalcActions.setCells({
          ...cells,
          [key]: { ...(cells[key] ?? EMPTY_CELL), ...updates },
        }),
      );
    },
    [cells, dispatch],
  );

  const getCellDisplay = useCallback(
    (r: number, c: number): string => {
      const cell = getCell(r, c);
      if (!cell.raw) {
        return '';
      }
      const value = cell.raw.startsWith('=')
        ? evaluateFormula(cell.raw, cells)
        : cell.raw;
      if (typeof value === 'string' && value.startsWith('#')) {
        return value;
      }
      if (cell.fmt === 'currency' && typeof value === 'number') {
        return `$${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }
      if (cell.fmt === 'percent' && typeof value === 'number') {
        return `${value.toFixed(1)}%`;
      }
      if (cell.fmt === 'number' && typeof value === 'number') {
        return value.toLocaleString();
      }
      return String(value);
    },
    [cells, getCell],
  );

  const getRange = useCallback((): CellRange => {
    if (!selRange) {
      return { r1: sel.r, c1: sel.c, r2: sel.r, c2: sel.c };
    }
    return {
      r1: Math.min(selRange.r1, selRange.r2),
      c1: Math.min(selRange.c1, selRange.c2),
      r2: Math.max(selRange.r1, selRange.r2),
      c2: Math.max(selRange.c1, selRange.c2),
    };
  }, [sel, selRange]);

  const inRange = useCallback(
    (r: number, c: number): boolean => {
      const { r1, c1, r2, c2 } = getRange();
      return r >= r1 && r <= r2 && c >= c1 && c <= c2;
    },
    [getRange],
  );

  const commitEdit = useCallback(() => {
    dispatch(macCalcActions.commitEdit());
  }, [dispatch]);

  const startEdit = useCallback(
    (r: number, c: number, initialVal?: string) => {
      const value =
        initialVal !== undefined ? initialVal : (cells[cellId(r, c)] ?? EMPTY_CELL).raw;
      dispatch(macCalcActions.startEdit({ r, c, val: value }));
      setTimeout(() => editRef.current?.focus(), 0);
    },
    [cells, dispatch],
  );

  const navigate = useCallback(
    (dr: number, dc: number) => {
      dispatch(macCalcActions.navigate({ dr, dc }));
    },
    [dispatch],
  );

  const matchCount = useMemo(() => {
    if (!findQuery) {
      return 0;
    }
    let count = 0;
    const query = findQuery.toLowerCase();
    Object.values(cells).forEach((cell) => {
      if (cell.raw.toLowerCase().includes(query)) {
        count += 1;
      }
    });
    return count;
  }, [cells, findQuery]);

  const handleFind = useCallback(
    (query: string) => dispatch(macCalcActions.setFindQuery(query)),
    [dispatch],
  );

  const handleReplace = useCallback(
    (find: string, replace: string) => {
      if (!find) {
        return;
      }
      const next = { ...cells };
      const findLower = find.toLowerCase();
      for (const key in next) {
        if (next[key].raw.toLowerCase().includes(findLower)) {
          next[key] = {
            ...next[key],
            raw: next[key].raw.replace(
              new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
              replace,
            ),
          };
          break;
        }
      }
      dispatch(macCalcActions.setCells(next));
    },
    [cells, dispatch],
  );

  const handleReplaceAll = useCallback(
    (find: string, replace: string) => {
      if (!find) {
        return;
      }
      const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const next = Object.fromEntries(
        Object.entries(cells).map(([key, value]) => [
          key,
          { ...value, raw: value.raw.replace(regex, replace) },
        ]),
      );
      dispatch(macCalcActions.setCells(next));
    },
    [cells, dispatch],
  );

  const execAction = useCallback(
    (id: string) => {
      const { r1, c1, r2, c2 } = getRange();
      const applyToRange = (fn: (r: number, c: number) => void) => {
        for (let r = r1; r <= r2; r += 1) {
          for (let c = c1; c <= c2; c += 1) {
            fn(r, c);
          }
        }
      };

      switch (id) {
        case 'bold':
          applyToRange((r, c) => setCell(r, c, { bold: !getCell(r, c).bold }));
          break;
        case 'italic':
          applyToRange((r, c) => setCell(r, c, { italic: !getCell(r, c).italic }));
          break;
        case 'align-left':
          applyToRange((r, c) => setCell(r, c, { align: 'left' }));
          break;
        case 'align-center':
          applyToRange((r, c) => setCell(r, c, { align: 'center' }));
          break;
        case 'align-right':
          applyToRange((r, c) => setCell(r, c, { align: 'right' }));
          break;
        case 'fmt-number':
          applyToRange((r, c) => setCell(r, c, { fmt: 'number' as CellFormat }));
          break;
        case 'fmt-currency':
          applyToRange((r, c) => setCell(r, c, { fmt: 'currency' as CellFormat }));
          break;
        case 'fmt-percent':
          applyToRange((r, c) => setCell(r, c, { fmt: 'percent' as CellFormat }));
          break;
        case 'fmt-plain':
          applyToRange((r, c) => setCell(r, c, { fmt: 'plain' as CellFormat }));
          break;
        case 'clear-cell':
          applyToRange((r, c) => setCell(r, c, { raw: '' }));
          break;
        case 'sum-insert':
          startEdit(sel.r, sel.c, '=SUM()');
          break;
        case 'avg-insert':
          startEdit(sel.r, sel.c, '=AVERAGE()');
          break;
        case 'min-insert':
          startEdit(sel.r, sel.c, '=MIN()');
          break;
        case 'max-insert':
          startEdit(sel.r, sel.c, '=MAX()');
          break;
        case 'count-insert':
          startEdit(sel.r, sel.c, '=COUNT()');
          break;
        case 'if-insert':
          startEdit(sel.r, sel.c, '=IF(,, )');
          break;
        case 'find':
          dispatch(macCalcActions.toggleFind());
          break;
        case 'copy': {
          const data: Record<string, CellData> = {};
          applyToRange((r, c) => {
            data[`${r - r1},${c - c1}`] = { ...getCell(r, c) };
          });
          dispatch(
            macCalcActions.setClipboard({
              data,
              rows: r2 - r1 + 1,
              cols: c2 - c1 + 1,
            }),
          );
          break;
        }
        case 'paste': {
          if (!clipboard) {
            break;
          }
          const next = { ...cells };
          for (let dr = 0; dr < clipboard.rows; dr += 1) {
            for (let dc = 0; dc < clipboard.cols; dc += 1) {
              const source = clipboard.data[`${dr},${dc}`];
              if (source) {
                next[cellId(sel.r + dr, sel.c + dc)] = { ...source };
              }
            }
          }
          dispatch(macCalcActions.setCells(next));
          break;
        }
        case 'select-all':
          dispatch(
            macCalcActions.setSelectionRange({
              r1: 0,
              c1: 0,
              r2: NUM_ROWS - 1,
              c2: NUM_COLS - 1,
            }),
          );
          break;
        case 'export': {
          let csv = '';
          for (let r = 0; r < NUM_ROWS; r += 1) {
            const row: string[] = [];
            for (let c = 0; c < NUM_COLS; c += 1) {
              row.push(getCellDisplay(r, c));
            }
            if (row.some((value) => value)) {
              csv += row.join(',') + '\n';
            }
          }
          try {
            navigator.clipboard?.writeText(csv);
          } catch {
            // noop
          }
          break;
        }
      }
    },
    [cells, clipboard, dispatch, getCell, getCellDisplay, getRange, sel, setCell, startEdit],
  );

  const handleGridKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (showPalette) {
        return;
      }
      if (event.key === 'Escape') {
        if (editing) {
          dispatch(macCalcActions.setEditing(false));
          dispatch(macCalcActions.setEditValue(''));
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'p') {
        event.preventDefault();
        dispatch(macCalcActions.showPalette());
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        dispatch(macCalcActions.toggleFind());
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        execAction('bold');
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
        event.preventDefault();
        execAction('italic');
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        execAction('copy');
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        execAction('paste');
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        execAction('select-all');
        return;
      }

      if (editing) {
        if (event.key === 'Enter') {
          event.preventDefault();
          navigate(1, 0);
        } else if (event.key === 'Tab') {
          event.preventDefault();
          navigate(0, event.shiftKey ? -1 : 1);
        }
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          navigate(-1, 0);
          break;
        case 'ArrowDown':
          event.preventDefault();
          navigate(1, 0);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          navigate(0, -1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigate(0, 1);
          break;
        case 'Enter':
          event.preventDefault();
          startEdit(sel.r, sel.c);
          break;
        case 'Tab':
          event.preventDefault();
          navigate(0, event.shiftKey ? -1 : 1);
          break;
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          execAction('clear-cell');
          break;
        case 'F2':
          event.preventDefault();
          startEdit(sel.r, sel.c);
          break;
        default:
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            startEdit(sel.r, sel.c, event.key);
          }
      }
    },
    [dispatch, editing, execAction, navigate, sel, showPalette, startEdit],
  );

  const handleCellMouseDown = useCallback(
    (r: number, c: number, event: React.MouseEvent) => {
      if (event.detail === 2) {
        startEdit(r, c);
        return;
      }
      dispatch(macCalcActions.commitEdit());
      if (event.shiftKey) {
        dispatch(macCalcActions.setSelection({ r, c }));
        dispatch(
          macCalcActions.setSelectionRange({
            r1: sel.r,
            c1: sel.c,
            r2: r,
            c2: c,
          }),
        );
      } else {
        dispatch(macCalcActions.setSelection({ r, c }));
        dispatch(macCalcActions.setSelectionRange(null));
        dispatch(macCalcActions.startDrag({ r, c }));
      }
    },
    [dispatch, sel, startEdit],
  );

  const handleCellMouseEnter = useCallback(
    (r: number, c: number) => {
      if (isDragging && dragStart) {
        dispatch(
          macCalcActions.setSelectionRange({
            r1: dragStart.r,
            c1: dragStart.c,
            r2: r,
            c2: c,
          }),
        );
      }
    },
    [dispatch, dragStart, isDragging],
  );

  useEffect(() => {
    const onMouseUp = () => dispatch(macCalcActions.endDrag());
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [dispatch]);

  useEffect(() => {
    if (!gridRef.current) {
      return;
    }
    const grid = gridRef.current;
    const left = ROW_HEADER_W + colWidths.slice(0, sel.c).reduce((sum, width) => sum + width, 0);
    const top = HEADER_H + sel.r * ROW_H;
    if (left < grid.scrollLeft + ROW_HEADER_W) {
      grid.scrollLeft = left - ROW_HEADER_W;
    }
    if (left + colWidths[sel.c] > grid.scrollLeft + grid.clientWidth) {
      grid.scrollLeft = left + colWidths[sel.c] - grid.clientWidth + 10;
    }
    if (top < grid.scrollTop + HEADER_H) {
      grid.scrollTop = top - HEADER_H;
    }
    if (top + ROW_H > grid.scrollTop + grid.clientHeight) {
      grid.scrollTop = top + ROW_H - grid.clientHeight + 10;
    }
  }, [colWidths, sel]);

  const handleColResizeStart = useCallback(
    (colIndex: number, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = colWidths[colIndex];
      const onMove = (moveEvent: MouseEvent) => {
        const diff = moveEvent.clientX - startX;
        dispatch(
          macCalcActions.resizeColumn({
            col: colIndex,
            width: startWidth + diff,
          }),
        );
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [colWidths, dispatch],
  );

  const totalWidth = ROW_HEADER_W + colWidths.reduce((sum, width) => sum + width, 0);
  const totalHeight = HEADER_H + NUM_ROWS * ROW_H;
  const currentCell = getCell(sel.r, sel.c);
  const formulaDisplay = editing ? editVal : currentCell.raw;

  return (
    <div data-part={P.calculator}>
      <WidgetToolbar>
        <Btn
          onClick={() => execAction('bold')}
          data-state={currentCell.bold ? 'active' : undefined}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\uD835\uDC01'}
        </Btn>
        <Btn
          onClick={() => execAction('italic')}
          data-state={currentCell.italic ? 'active' : undefined}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\uD835\uDC3C'}
        </Btn>
        <Separator />
        <Btn
          onClick={() => execAction('align-left')}
          data-state={currentCell.align === 'left' ? 'active' : undefined}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\u2AF7'}
        </Btn>
        <Btn
          onClick={() => execAction('align-center')}
          data-state={currentCell.align === 'center' ? 'active' : undefined}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\u2AFF'}
        </Btn>
        <Btn
          onClick={() => execAction('align-right')}
          data-state={currentCell.align === 'right' ? 'active' : undefined}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\u2AF8'}
        </Btn>
        <Separator />
        <Btn
          onClick={() => execAction('fmt-plain')}
          data-state={currentCell.fmt === 'plain' ? 'active' : undefined}
          style={{ fontSize: 11, padding: '2px 7px' }}
        >
          Aa
        </Btn>
        <Btn
          onClick={() => execAction('fmt-number')}
          data-state={currentCell.fmt === 'number' ? 'active' : undefined}
          style={{ fontSize: 11, padding: '2px 7px' }}
        >
          #0
        </Btn>
        <Btn
          onClick={() => execAction('fmt-currency')}
          data-state={currentCell.fmt === 'currency' ? 'active' : undefined}
          style={{ fontSize: 11, padding: '2px 7px' }}
        >
          $
        </Btn>
        <Btn
          onClick={() => execAction('fmt-percent')}
          data-state={currentCell.fmt === 'percent' ? 'active' : undefined}
          style={{ fontSize: 11, padding: '2px 7px' }}
        >
          %
        </Btn>
        <Separator />
        <Btn
          onClick={() => execAction('sum-insert')}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\u03A3'}
        </Btn>
        <div style={{ flex: 1 }} />
        <Btn
          onClick={() => dispatch(macCalcActions.toggleFind())}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\uD83D\uDD0D'}
        </Btn>
        <Btn
          onClick={() => dispatch(macCalcActions.showPalette())}
          style={{ fontSize: 11, padding: '2px 7px' }}
        >
          {'\u2318'}P
        </Btn>
      </WidgetToolbar>

      <div data-part={P.calcFormulaBar}>
        <div data-part={P.calcCellRef}>
          {cellId(sel.r, sel.c)}
        </div>
        <span style={{ color: 'var(--hc-color-muted)' }}>
          {'\u0192'}
        </span>
        <input
          value={formulaDisplay}
          onChange={(event) => {
            if (!editing) {
              startEdit(sel.r, sel.c, event.target.value);
            } else {
              dispatch(macCalcActions.setEditValue(event.target.value));
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitEdit();
              gridRef.current?.focus();
            } else if (event.key === 'Escape') {
              dispatch(macCalcActions.setEditing(false));
              dispatch(macCalcActions.setEditValue(''));
              gridRef.current?.focus();
            }
          }}
          onFocus={() => {
            if (!editing) {
              startEdit(sel.r, sel.c);
            }
          }}
          data-part={P.calcFormulaInput}
        />
      </div>

      {showFind && (
        <FindBar
          query={findQuery}
          onFind={handleFind}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          onClose={() => {
            dispatch(macCalcActions.hideFind());
            gridRef.current?.focus();
          }}
          matchCount={matchCount}
        />
      )}

      <div
        data-part={P.calcGrid}
        ref={gridRef}
        tabIndex={0}
        onKeyDown={handleGridKeyDown}
      >
        <div
          data-part={P.calcGridInner}
          style={{ width: totalWidth, height: totalHeight }}
        >
          <div data-part={P.calcColHeaders}>
            <div
              data-part={P.calcCornerCell}
              style={{ width: ROW_HEADER_W, height: HEADER_H }}
            >
              {'\u229E'}
            </div>
            {Array.from({ length: NUM_COLS }, (_, c) => (
              <div
                key={c}
                data-part={P.calcColHeader}
                data-state={sel.c === c ? 'active' : undefined}
                style={{ width: colWidths[c], height: HEADER_H }}
              >
                {colLabel(c)}
                <div
                  onMouseDown={(event) => handleColResizeStart(c, event)}
                  data-part={P.calcColResize}
                />
              </div>
            ))}
          </div>

          {Array.from({ length: NUM_ROWS }, (_, r) => (
            <div
              key={r}
              data-part={P.calcRow}
            >
              <div
                data-part={P.calcRowHeader}
                data-state={sel.r === r ? 'active' : undefined}
                style={{ width: ROW_HEADER_W, height: ROW_H }}
              >
                {r + 1}
              </div>
              {Array.from({ length: NUM_COLS }, (_, c) => {
                const cell = getCell(r, c);
                const display = getCellDisplay(r, c);
                const isSelected = sel.r === r && sel.c === c;
                const isInRange = inRange(r, c) && !isSelected;
                const isError = typeof display === 'string' && display.startsWith('#');
                const isMatch =
                  findQuery && cell.raw.toLowerCase().includes(findQuery.toLowerCase());

                return (
                  <div
                    key={c}
                    onMouseDown={(event) => handleCellMouseDown(r, c, event)}
                    onMouseEnter={() => handleCellMouseEnter(r, c)}
                    data-part={P.calcCell}
                    data-state={
                      isSelected
                        ? 'selected'
                        : isInRange
                          ? 'in-range'
                          : isMatch
                            ? 'match'
                            : undefined
                    }
                    style={{
                      width: colWidths[c],
                      height: ROW_H,
                      justifyContent:
                        cell.align === 'center'
                          ? 'center'
                          : cell.align === 'right'
                            ? 'flex-end'
                            : 'flex-start',
                      fontWeight: cell.bold ? 'bold' : 'normal',
                      fontStyle: cell.italic ? 'italic' : 'normal',
                      color: isError ? 'var(--hc-color-error, #880000)' : undefined,
                    }}
                  >
                    {isSelected && editing ? (
                      <input
                        ref={editRef}
                        data-part={P.calcCellEdit}
                        value={editVal}
                        onChange={(event) =>
                          dispatch(macCalcActions.setEditValue(event.target.value))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            navigate(1, 0);
                            gridRef.current?.focus();
                          } else if (event.key === 'Tab') {
                            event.preventDefault();
                            navigate(0, event.shiftKey ? -1 : 1);
                            gridRef.current?.focus();
                          } else if (event.key === 'Escape') {
                            dispatch(macCalcActions.setEditing(false));
                            dispatch(macCalcActions.setEditValue(''));
                            gridRef.current?.focus();
                          }
                        }}
                        onBlur={commitEdit}
                        style={{ textAlign: cell.align || 'left' }}
                      />
                    ) : (
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                          textAlign: cell.align || 'left',
                        }}
                      >
                        {display}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <WidgetStatusBar>
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ fontWeight: 'bold' }}>
            {cellId(sel.r, sel.c)}
          </span>
          {selRange &&
            (() => {
              const { r1, c1, r2, c2 } = getRange();
              if (r1 === r2 && c1 === c2) {
                return null;
              }
              const values: number[] = [];
              for (let r = r1; r <= r2; r += 1) {
                for (let c = c1; c <= c2; c += 1) {
                  const display = getCellDisplay(r, c);
                  const numeric = parseFloat(display.replace(/[$%,]/g, ''));
                  if (!isNaN(numeric)) {
                    values.push(numeric);
                  }
                }
              }
              return values.length > 0 ? (
                <>
                  <span>
                    {'\u03A3'}{' '}
                    {values
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span>
                    x{'\u0304'}{' '}
                    {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)}
                  </span>
                  <span># {values.length}</span>
                </>
              ) : null;
            })()}
          <span>
            {currentCell.raw.startsWith('=')
              ? 'Formula'
              : getCellDisplay(sel.r, sel.c)
                ? 'Value'
                : 'Empty'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span>{currentCell.fmt}</span>
        </div>
      </WidgetStatusBar>

      {showPalette && (
        <CommandPalette
          items={CALC_ACTIONS}
          onSelect={(id) => {
            dispatch(macCalcActions.hidePalette());
            execAction(id);
            setTimeout(() => gridRef.current?.focus(), 0);
          }}
          onClose={() => {
            dispatch(macCalcActions.hidePalette());
            gridRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}

function StandaloneMacCalc({ initialCells }: MacCalcProps) {
  const [state, dispatch] = useReducer(
    macCalcReducer,
    createMacCalcStateSeed({ initialCells }),
  );

  return (
    <MacCalcInner
      state={state}
      dispatch={dispatch}
    />
  );
}

function ConnectedMacCalc({ initialCells }: MacCalcProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectMacCalcState);

  useEffect(() => {
    reduxDispatch(
      macCalcActions.initializeIfNeeded({
        initialCells,
      }),
    );
  }, [initialCells, reduxDispatch]);

  const effectiveState = state.initialized
    ? state
    : createMacCalcStateSeed({ initialCells });

  const dispatch = useCallback(
    (action: MacCalcAction) => {
      reduxDispatch(action);
    },
    [reduxDispatch],
  );

  return (
    <MacCalcInner
      state={effectiveState}
      dispatch={dispatch}
    />
  );
}

export function MacCalc({ initialCells }: MacCalcProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    MAC_CALC_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedMacCalc initialCells={initialCells} />;
  }

  return <StandaloneMacCalc initialCells={initialCells} />;
}
