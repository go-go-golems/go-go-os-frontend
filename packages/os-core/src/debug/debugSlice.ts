import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RuntimeDebugEvent } from '../cards/runtime';

const DEFAULT_CAPACITY = 300;

export interface DebugState {
  events: RuntimeDebugEvent[];
  capacity: number;
  collapsed: boolean;
  selectedEventId: number | null;
  filters: {
    kind: string;
    text: string;
  };
}

const initialState: DebugState = {
  events: [],
  capacity: DEFAULT_CAPACITY,
  collapsed: false,
  selectedEventId: null,
  filters: {
    kind: 'all',
    text: '',
  },
};

export const debugSlice = createSlice({
  name: 'debug',
  initialState,
  reducers: {
    ingestEvent(state, action: PayloadAction<RuntimeDebugEvent>) {
      state.events.push(action.payload);
      if (state.events.length > state.capacity) {
        state.events.splice(0, state.events.length - state.capacity);
      }
      state.selectedEventId = action.payload.id;
    },
    clearEvents(state) {
      state.events = [];
      state.selectedEventId = null;
    },
    toggleCollapsed(state) {
      state.collapsed = !state.collapsed;
    },
    selectEvent(state, action: PayloadAction<number>) {
      state.selectedEventId = action.payload;
    },
    setKindFilter(state, action: PayloadAction<string>) {
      state.filters.kind = action.payload;
    },
    setTextFilter(state, action: PayloadAction<string>) {
      state.filters.text = action.payload;
    },
  },
});

export const { ingestEvent, clearEvents, toggleCollapsed, selectEvent, setKindFilter, setTextFilter } =
  debugSlice.actions;

export const debugReducer = debugSlice.reducer;

export interface DebugStateSlice {
  debug: DebugState;
}

export const selectDebugState = (state: DebugStateSlice) => state.debug;

export const selectDebugKinds = createSelector([selectDebugState], (debug) =>
  Array.from(new Set(debug.events.map((event) => event.kind))).sort(),
);

export const selectFilteredDebugEvents = createSelector([selectDebugState], (debug) => {
  const kindFilter = debug.filters.kind;
  const textFilter = debug.filters.text.trim().toLowerCase();

  return debug.events.filter((event) => {
    if (kindFilter !== 'all' && event.kind !== kindFilter) return false;
    if (!textFilter) return true;

    const searchable = [
      event.kind,
      event.cardId,
      event.actionType ?? '',
      event.selectorName ?? '',
      JSON.stringify(event.payload ?? null),
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(textFilter);
  });
});

export const selectSelectedDebugEvent = createSelector([selectDebugState], (debug) => {
  if (debug.selectedEventId == null) return null;
  return debug.events.find((event) => event.id === debug.selectedEventId) ?? null;
});
