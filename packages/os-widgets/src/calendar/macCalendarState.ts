import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { EVENT_COLORS, INITIAL_EVENTS } from './sampleData';
import { type CalendarEvent, type CalendarView } from './types';

export const MAC_CALENDAR_STATE_KEY = 'app_rw_mac_calendar' as const;

export interface StoredCalendarEvent extends Omit<CalendarEvent, 'date'> {
  dateMs: number;
}

export interface MacCalendarStateSeed {
  initialEvents?: readonly CalendarEvent[];
  initialView?: CalendarView;
  currentDate?: Date;
  editingEventId?: string | null;
  draftDate?: Date | null;
  paletteOpen?: boolean;
}

export interface MacCalendarState {
  initialized: boolean;
  events: StoredCalendarEvent[];
  view: CalendarView;
  currentDateMs: number;
  editingEventId: string | null;
  draftDateMs: number | null;
  paletteOpen: boolean;
}

type MacCalendarModuleState = MacCalendarState | undefined;
type MacCalendarStateInput = MacCalendarStateSeed | MacCalendarState | undefined;

export function serializeCalendarEvent(event: CalendarEvent): StoredCalendarEvent {
  return {
    ...event,
    dateMs: event.date.getTime(),
  };
}

export function deserializeCalendarEvent(event: StoredCalendarEvent): CalendarEvent {
  return {
    ...event,
    date: new Date(event.dateMs),
  };
}

export function createMacCalendarStateSeed(
  seed: MacCalendarStateSeed = {},
): MacCalendarState {
  return {
    initialized: true,
    events: (seed.initialEvents ?? INITIAL_EVENTS).map(serializeCalendarEvent),
    view: seed.initialView ?? 'month',
    currentDateMs: (seed.currentDate ?? new Date()).getTime(),
    editingEventId: seed.editingEventId ?? null,
    draftDateMs: seed.draftDate ? seed.draftDate.getTime() : null,
    paletteOpen: seed.paletteOpen ?? false,
  };
}

function materializeMacCalendarState(seed: MacCalendarStateInput): MacCalendarState {
  if (seed && typeof seed === 'object' && 'events' in seed && 'currentDateMs' in seed) {
    return {
      ...seed,
      events: seed.events.map((event) => ({ ...event })),
    };
  }

  return createMacCalendarStateSeed(seed);
}

const initialState: MacCalendarState = {
  ...createMacCalendarStateSeed(),
  initialized: false,
};

export const macCalendarSlice = createSlice({
  name: 'macCalendar',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<MacCalendarStateInput>) {
      if (state.initialized) {
        return;
      }
      return materializeMacCalendarState(action.payload);
    },
    replaceState(_state, action: PayloadAction<MacCalendarStateInput>) {
      return materializeMacCalendarState(action.payload);
    },
    setView(state, action: PayloadAction<CalendarView>) {
      state.view = action.payload;
    },
    setCurrentDateMs(state, action: PayloadAction<number>) {
      state.currentDateMs = action.payload;
    },
    openNewEvent(state, action: PayloadAction<number>) {
      state.editingEventId = null;
      state.draftDateMs = action.payload;
    },
    editExistingEvent(state, action: PayloadAction<string>) {
      state.editingEventId = action.payload;
      state.draftDateMs = null;
    },
    closeEditor(state) {
      state.editingEventId = null;
      state.draftDateMs = null;
    },
    saveEvent(state, action: PayloadAction<StoredCalendarEvent>) {
      const next = action.payload;
      const index = state.events.findIndex((event) => event.id === next.id);
      if (index >= 0) {
        state.events[index] = next;
      } else {
        state.events.push(next);
      }
    },
    deleteEvent(state, action: PayloadAction<string>) {
      state.events = state.events.filter((event) => event.id !== action.payload);
      if (state.editingEventId === action.payload) {
        state.editingEventId = null;
      }
    },
    setPaletteOpen(state, action: PayloadAction<boolean>) {
      state.paletteOpen = action.payload;
    },
    togglePalette(state) {
      state.paletteOpen = !state.paletteOpen;
    },
  },
});

export const macCalendarReducer = macCalendarSlice.reducer;
export const macCalendarActions = macCalendarSlice.actions;
export type MacCalendarAction = ReturnType<
  (typeof macCalendarActions)[keyof typeof macCalendarActions]
>;

const selectRawMacCalendarState = (rootState: unknown): MacCalendarState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, MacCalendarModuleState>)[MAC_CALENDAR_STATE_KEY]
    : undefined;

export const selectMacCalendarState = createSelector(
  [selectRawMacCalendarState],
  (state) => state ?? initialState,
);

export const DEFAULT_EVENT_COLORS = EVENT_COLORS;
