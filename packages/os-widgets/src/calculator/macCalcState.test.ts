import { describe, expect, it } from 'vitest';
import { createSampleCells } from './sampleData';
import {
  createMacCalcStateSeed,
  macCalcActions,
  macCalcReducer,
} from './macCalcState';

describe('macCalcState', () => {
  it('initializes from seeded cells and opens seeded UI state', () => {
    const seededCells = createSampleCells();

    let state = macCalcReducer(undefined, { type: 'unknown' });
    expect(state.initialized).toBe(false);

    state = macCalcReducer(
      state,
      macCalcActions.initializeIfNeeded({
        initialCells: seededCells,
        showFind: true,
        findQuery: 'profit',
        showPalette: true,
      }),
    );

    expect(state.initialized).toBe(true);
    expect(Object.keys(state.cells)).toHaveLength(Object.keys(seededCells).length);
    expect(state.showFind).toBe(true);
    expect(state.findQuery).toBe('profit');
    expect(state.showPalette).toBe(true);
  });

  it('commits edits and navigates selection', () => {
    let state = macCalcReducer(
      undefined,
      macCalcActions.replaceState(
        createMacCalcStateSeed({
          initialCells: {},
        }),
      ),
    );

    state = macCalcReducer(
      state,
      macCalcActions.startEdit({ r: 0, c: 0, val: '42' }),
    );
    state = macCalcReducer(state, macCalcActions.commitEdit());
    expect(state.cells.A1?.raw).toBe('42');

    state = macCalcReducer(
      state,
      macCalcActions.navigate({ dr: 1, dc: 2 }),
    );
    expect(state.sel).toEqual({ r: 1, c: 2 });
    expect(state.selRange).toBeNull();
  });
});
