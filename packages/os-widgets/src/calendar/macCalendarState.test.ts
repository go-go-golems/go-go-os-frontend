import { describe, expect, it } from 'vitest';
import {
  createMacCalendarStateSeed,
  deserializeCalendarEvent,
  macCalendarActions,
  macCalendarReducer,
  serializeCalendarEvent,
} from './macCalendarState';

describe('macCalendarState', () => {
  it('initializes seeded view and opens seeded modal state', () => {
    let state = macCalendarReducer(undefined, { type: 'unknown' });
    expect(state.initialized).toBe(false);

    state = macCalendarReducer(
      state,
      macCalendarActions.initializeIfNeeded({
        initialView: 'week',
        paletteOpen: true,
        draftDate: new Date(2026, 2, 6, 9, 0),
      }),
    );

    expect(state.initialized).toBe(true);
    expect(state.view).toBe('week');
    expect(state.paletteOpen).toBe(true);
    expect(state.draftDateMs).not.toBeNull();
  });

  it('saves and deletes events', () => {
    let state = macCalendarReducer(
      undefined,
      macCalendarActions.replaceState(createMacCalendarStateSeed({ initialEvents: [] })),
    );

    const event = serializeCalendarEvent({
      id: 'evt-test',
      title: 'Architecture Review',
      date: new Date(2026, 2, 6, 14, 0),
      duration: 60,
      color: 2,
    });

    state = macCalendarReducer(state, macCalendarActions.saveEvent(event));
    expect(state.events).toHaveLength(1);
    expect(deserializeCalendarEvent(state.events[0]).title).toBe('Architecture Review');

    state = macCalendarReducer(state, macCalendarActions.deleteEvent('evt-test'));
    expect(state.events).toHaveLength(0);
  });
});
