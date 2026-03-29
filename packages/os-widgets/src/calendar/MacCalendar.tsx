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
import { ModalOverlay } from '../primitives/ModalOverlay';
import { CommandPalette } from '../primitives/CommandPalette';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import type { CalendarEvent, CalendarView } from './types';
import {
  DAYS,
  MONTHS,
  DURATION_OPTIONS,
  sameDay,
  fmtTime,
  mkEventId,
} from './types';
import { EVENT_COLORS, makePaletteActions } from './sampleData';
import {
  createMacCalendarStateSeed,
  deserializeCalendarEvent,
  MAC_CALENDAR_STATE_KEY,
  macCalendarActions,
  type MacCalendarAction,
  type MacCalendarState,
  macCalendarReducer,
  selectMacCalendarState,
  serializeCalendarEvent,
} from './macCalendarState';

function EventModal({
  event,
  eventColors,
  onSave,
  onDelete,
  onClose,
}: {
  event: Partial<CalendarEvent>;
  eventColors: string[];
  onSave: (evt: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const isNew = !event.id;
  const defaultDate = event.date || new Date();
  const [title, setTitle] = useState(event.title || '');
  const [dateStr, setDateStr] = useState(
    `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}-${String(defaultDate.getDate()).padStart(2, '0')}`,
  );
  const [hour, setHour] = useState(event.date ? event.date.getHours() : 9);
  const [minute, setMinute] = useState(event.date ? event.date.getMinutes() : 0);
  const [duration, setDuration] = useState(event.duration || 60);
  const [color, setColor] = useState(event.color ?? 0);

  return (
    <ModalOverlay onClose={onClose}>
      <div
        data-part={P.calModal}
        style={{ width: 400 }}
      >
        <div data-part={P.calModalHeader}>
          <span style={{ fontWeight: 'bold' }}>
            {isNew ? '\uD83D\uDCC5 New Event' : '\u270F\uFE0F Edit Event'}
          </span>
          <span
            onClick={onClose}
            style={{ cursor: 'pointer', opacity: 0.5, fontSize: 18 }}
          >
            {'\u2715'}
          </span>
        </div>
        <div data-part={P.calModalBody}>
          <div>
            <div data-part={P.calFieldLabel}>Title</div>
            <input
              value={title}
              onChange={(event_) => setTitle(event_.target.value)}
              autoFocus
              data-part={P.calFieldInput}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div data-part={P.calFieldLabel}>Date</div>
              <input
                type="date"
                value={dateStr}
                onChange={(event_) => setDateStr(event_.target.value)}
                data-part={P.calFieldInput}
              />
            </div>
            <div>
              <div data-part={P.calFieldLabel}>Time</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <select
                  value={hour}
                  onChange={(event_) => setHour(parseInt(event_.target.value))}
                  data-part={P.calFieldInput}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option
                      key={i}
                      value={i}
                    >
                      {String(i).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span style={{ opacity: 0.5 }}>:</span>
                <select
                  value={minute}
                  onChange={(event_) => setMinute(parseInt(event_.target.value))}
                  data-part={P.calFieldInput}
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option
                      key={m}
                      value={m}
                    >
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <div data-part={P.calFieldLabel}>Duration</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {DURATION_OPTIONS.map((value) => (
                <Btn
                  key={value}
                  onClick={() => setDuration(value)}
                  data-state={duration === value ? 'active' : undefined}
                  style={{ fontSize: 12, padding: '2px 8px' }}
                >
                  {value}m
                </Btn>
              ))}
            </div>
          </div>
          <div>
            <div data-part={P.calFieldLabel}>Color</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {eventColors.map((value, index) => (
                <div
                  key={index}
                  onClick={() => setColor(index)}
                  data-part={P.calColorSwatch}
                  data-state={color === index ? 'active' : undefined}
                  style={{ background: value }}
                />
              ))}
            </div>
          </div>
        </div>
        <div data-part={P.calModalFooter}>
          {!isNew && (
            <Btn
              onClick={() => {
                onDelete(event.id!);
                onClose();
              }}
              style={{ fontSize: 12 }}
            >
              {'\uD83D\uDDD1\uFE0F'} Delete
            </Btn>
          )}
          <div style={{ flex: 1 }} />
          <Btn
            onClick={onClose}
            style={{ fontSize: 12 }}
          >
            Cancel
          </Btn>
          <Btn
            onClick={() => {
              if (!title.trim()) {
                return;
              }
              const [year, month, day] = dateStr.split('-').map(Number);
              onSave({
                id: event.id || mkEventId(),
                title,
                date: new Date(year, month - 1, day, hour, minute),
                duration,
                color,
              });
              onClose();
            }}
            data-state="active"
            style={{ fontSize: 12, fontWeight: 'bold' }}
          >
            {isNew ? 'Create' : 'Save'}
          </Btn>
        </div>
      </div>
    </ModalOverlay>
  );
}

function MonthView({
  year,
  month,
  events,
  eventColors,
  onDayClick,
  onEventClick,
  today,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  eventColors: string[];
  onDayClick: (date: Date) => void;
  onEventClick: (ev: CalendarEvent) => void;
  today: Date;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { day: number; current: boolean; date: Date }[] = [];
  for (let i = firstDay - 1; i >= 0; i -= 1) {
    cells.push({
      day: daysInPrev - i,
      current: false,
      date: new Date(year, month - 1, daysInPrev - i),
    });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, current: true, date: new Date(year, month, day) });
  }
  while (cells.length < 42) {
    const day = cells.length - firstDay - daysInMonth + 1;
    cells.push({ day, current: false, date: new Date(year, month + 1, day) });
  }

  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div data-part={P.calBody}>
      <div data-part={P.calDayHeaders}>
        {DAYS.map((day, index) => (
          <div
            key={day}
            data-part={P.calDayHeader}
            data-state={index === 0 || index === 6 ? 'weekend' : undefined}
          >
            {day}
          </div>
        ))}
      </div>
      <div data-part={P.calWeeks}>
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            data-part={P.calWeekRow}
          >
            {week.map((cell, dayIndex) => {
              const isToday = sameDay(cell.date, today);
              const dayEvents = events.filter((event) => sameDay(event.date, cell.date));
              return (
                <div
                  key={dayIndex}
                  onClick={() => onDayClick(cell.date)}
                  data-part={P.calDayCell}
                  data-state={
                    isToday ? 'today' : dayIndex === 0 || dayIndex === 6 ? 'weekend' : undefined
                  }
                  data-current={cell.current ? '' : undefined}
                >
                  <div data-part={P.calDayNumber}>
                    {isToday && <span data-part={P.calTodayDot} />}
                    <span data-muted={!cell.current ? '' : undefined}>{cell.day}</span>
                  </div>
                  <div data-part={P.calDayEvents}>
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={(event_) => {
                          event_.stopPropagation();
                          onEventClick(event);
                        }}
                        data-part={P.calEventChip}
                        style={{ background: eventColors[event.color % eventColors.length] }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: 10, opacity: 0.5 }}>
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const HOUR_HEIGHT = 52;

function WeekView({
  weekStart,
  events,
  eventColors,
  onTimeClick,
  onEventClick,
  today,
}: {
  weekStart: Date;
  events: CalendarEvent[];
  eventColors: string[];
  onTimeClick: (date: Date) => void;
  onEventClick: (ev: CalendarEvent) => void;
  today: Date;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * HOUR_HEIGHT;
    }
  }, [weekStart]);

  const now = new Date();
  const nowDay = days.findIndex((date) => sameDay(date, now));
  const nowOffset = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;

  return (
    <div data-part={P.calBody}>
      <div data-part={P.calDayHeaders}>
        <div data-part={P.calTimeGutterHeader} />
        {days.map((date, index) => {
          const isToday = sameDay(date, today);
          return (
            <div
              key={index}
              data-part={P.calDayHeader}
              data-state={isToday ? 'today' : index === 0 || index === 6 ? 'weekend' : undefined}
            >
              <div style={{ fontSize: 12 }}>{DAYS[index]}</div>
              <div style={{ fontSize: 18 }}>{date.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div
        ref={scrollRef}
        data-part={P.calTimeGrid}
      >
        <div
          style={{
            display: 'flex',
            height: 24 * HOUR_HEIGHT,
            position: 'relative',
          }}
        >
          <div data-part={P.calTimeGutter}>
            {hours.map((hour) => (
              <div
                key={hour}
                data-part={P.calTimeLabel}
                style={{ height: HOUR_HEIGHT }}
              >
                {fmtTime(hour, 0)}
              </div>
            ))}
          </div>
          {days.map((day, dayIndex) => {
            const dayEvents = events.filter((event) => sameDay(event.date, day));
            const isToday = sameDay(day, today);
            return (
              <div
                key={dayIndex}
                data-part={P.calWeekDayCol}
                data-state={isToday ? 'today' : undefined}
                onClick={(event_) => {
                  const rect = event_.currentTarget.getBoundingClientRect();
                  const y = event_.clientY - rect.top + (scrollRef.current?.scrollTop || 0);
                  const clickHour = Math.floor(y / HOUR_HEIGHT);
                  const minute = Math.round(((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 4) * 15;
                  const clickDate = new Date(day);
                  clickDate.setHours(clickHour, minute >= 60 ? 0 : minute);
                  onTimeClick(clickDate);
                }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    data-part={P.calHourSlot}
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
                {dayEvents.map((event) => {
                  const top = (event.date.getHours() + event.date.getMinutes() / 60) * HOUR_HEIGHT;
                  const height = Math.max(20, (event.duration / 60) * HOUR_HEIGHT);
                  return (
                    <div
                      key={event.id}
                      onClick={(event_) => {
                        event_.stopPropagation();
                        onEventClick(event);
                      }}
                      data-part={P.calWeekEvent}
                      style={{
                        top,
                        height,
                        background: eventColors[event.color % eventColors.length],
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {event.title}
                      </div>
                      {height > 30 && (
                        <div style={{ opacity: 0.7, fontSize: 11 }}>
                          {fmtTime(event.date.getHours(), event.date.getMinutes())}
                        </div>
                      )}
                    </div>
                  );
                })}
                {dayIndex === nowDay && (
                  <div
                    data-part={P.calNowLine}
                    style={{ top: nowOffset }}
                  >
                    <div data-part={P.calNowDot} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export interface MacCalendarProps {
  initialEvents?: CalendarEvent[];
  initialView?: CalendarView;
  eventColors?: string[];
}

function MacCalendarInner({
  state,
  dispatch,
  eventColors,
}: {
  state: MacCalendarState;
  dispatch: (action: MacCalendarAction) => void;
  eventColors: string[];
}) {
  const todayDate = new Date();
  const events = useMemo(() => state.events.map(deserializeCalendarEvent), [state.events]);
  const view = state.view;
  const currentDate = useMemo(() => new Date(state.currentDateMs), [state.currentDateMs]);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const weekStart = useMemo(() => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - date.getDay());
    date.setHours(0, 0, 0, 0);
    return date;
  }, [currentDate]);

  const editEvent = useMemo<Partial<CalendarEvent> | null>(() => {
    if (state.editingEventId) {
      return events.find((event) => event.id === state.editingEventId) ?? null;
    }
    if (state.draftDateMs != null) {
      return { date: new Date(state.draftDateMs) };
    }
    return null;
  }, [events, state.draftDateMs, state.editingEventId]);

  const navigateMonth = useCallback(
    (dir: number) => {
      dispatch(macCalendarActions.setCurrentDateMs(new Date(year, month + dir, 1).getTime()));
    },
    [dispatch, month, year],
  );

  const navigateWeek = useCallback(
    (dir: number) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + dir * 7);
      dispatch(macCalendarActions.setCurrentDateMs(date.getTime()));
    },
    [dispatch, weekStart],
  );

  const goToday = useCallback(() => {
    dispatch(macCalendarActions.setCurrentDateMs(new Date().getTime()));
  }, [dispatch]);

  const handleSave = useCallback(
    (event: CalendarEvent) => {
      dispatch(macCalendarActions.saveEvent(serializeCalendarEvent(event)));
      dispatch(macCalendarActions.closeEditor());
    },
    [dispatch],
  );

  const handleDelete = useCallback(
    (id: string) => {
      dispatch(macCalendarActions.deleteEvent(id));
      dispatch(macCalendarActions.closeEditor());
    },
    [dispatch],
  );

  const execAction = useCallback(
    (id: string) => {
      switch (id) {
        case 'new-event':
          dispatch(macCalendarActions.openNewEvent(new Date().getTime()));
          break;
        case 'today':
          goToday();
          break;
        case 'month-view':
          dispatch(macCalendarActions.setView('month'));
          break;
        case 'week-view':
          dispatch(macCalendarActions.setView('week'));
          break;
        case 'prev':
          view === 'month' ? navigateMonth(-1) : navigateWeek(-1);
          break;
        case 'next':
          view === 'month' ? navigateMonth(1) : navigateWeek(1);
          break;
      }
    },
    [dispatch, goToday, navigateMonth, navigateWeek, view],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (editEvent || state.paletteOpen) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        dispatch(macCalendarActions.setPaletteOpen(true));
      } else if (event.key === 'n') {
        dispatch(macCalendarActions.openNewEvent(new Date().getTime()));
      } else if (event.key === 't') {
        goToday();
      } else if (event.key === 'm') {
        dispatch(macCalendarActions.setView('month'));
      } else if (event.key === 'w') {
        dispatch(macCalendarActions.setView('week'));
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        view === 'month' ? navigateMonth(-1) : navigateWeek(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        view === 'month' ? navigateMonth(1) : navigateWeek(1);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dispatch, editEvent, goToday, navigateMonth, navigateWeek, state.paletteOpen, view]);

  const headerText =
    view === 'month'
      ? `${MONTHS[month]} ${year}`
      : `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} \u2013 ${(() => {
          const end = new Date(weekStart);
          end.setDate(end.getDate() + 6);
          return `${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
        })()}`;

  const paletteActions = makePaletteActions(view);

  return (
    <div data-part={P.calendar}>
      <WidgetToolbar>
        <Btn
          onClick={() => (view === 'month' ? navigateMonth(-1) : navigateWeek(-1))}
          style={{ fontSize: 14, padding: '2px 8px' }}
        >
          {'\u25C0'}
        </Btn>
        <Btn
          onClick={goToday}
          style={{ fontSize: 12, padding: '3px 10px' }}
        >
          Today
        </Btn>
        <Btn
          onClick={() => (view === 'month' ? navigateMonth(1) : navigateWeek(1))}
          style={{ fontSize: 14, padding: '2px 8px' }}
        >
          {'\u25B6'}
        </Btn>
        <span data-part={P.calHeaderText}>{headerText}</span>
        <div style={{ flex: 1 }} />
        <div data-part={P.calViewToggle}>
          <Btn
            onClick={() => dispatch(macCalendarActions.setView('month'))}
            data-state={view === 'month' ? 'active' : undefined}
            style={{ fontSize: 12, padding: '3px 10px' }}
          >
            {'\uD83D\uDCC6'} Month
          </Btn>
          <Btn
            onClick={() => dispatch(macCalendarActions.setView('week'))}
            data-state={view === 'week' ? 'active' : undefined}
            style={{ fontSize: 12, padding: '3px 10px' }}
          >
            {'\uD83D\uDCCB'} Week
          </Btn>
        </div>
        <Btn
          onClick={() =>
            dispatch(
              macCalendarActions.openNewEvent(
                new Date(year, month, todayDate.getDate(), 9, 0).getTime(),
              ),
            )
          }
          data-state="active"
          style={{ fontSize: 12, fontWeight: 'bold', padding: '3px 10px' }}
        >
          {'\u2795'} New
        </Btn>
        <Btn
          onClick={() => dispatch(macCalendarActions.setPaletteOpen(true))}
          style={{ fontSize: 12, padding: '2px 7px', opacity: 0.6 }}
        >
          {'\u2318'}P
        </Btn>
      </WidgetToolbar>

      {view === 'month' ? (
        <MonthView
          year={year}
          month={month}
          events={events}
          eventColors={eventColors}
          today={todayDate}
          onDayClick={(date) =>
            dispatch(
              macCalendarActions.openNewEvent(
                new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0).getTime(),
              ),
            )
          }
          onEventClick={(event) => dispatch(macCalendarActions.editExistingEvent(event.id))}
        />
      ) : (
        <WeekView
          weekStart={weekStart}
          events={events}
          eventColors={eventColors}
          today={todayDate}
          onTimeClick={(date) => dispatch(macCalendarActions.openNewEvent(date.getTime()))}
          onEventClick={(event) => dispatch(macCalendarActions.editExistingEvent(event.id))}
        />
      )}

      <WidgetStatusBar>
        <div style={{ display: 'flex', gap: 14 }}>
          <span>{events.length} events</span>
          <span>{events.filter((event) => sameDay(event.date, todayDate)).length} today</span>
        </div>
        <span>
          N = new {'\u00B7'} T = today {'\u00B7'} M/W = view {'\u00B7'} {'\u2190\u2192'} = navigate
        </span>
      </WidgetStatusBar>

      {editEvent && (
        <EventModal
          event={editEvent}
          eventColors={eventColors}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => dispatch(macCalendarActions.closeEditor())}
        />
      )}

      {state.paletteOpen && (
        <CommandPalette
          items={paletteActions}
          onSelect={(id) => {
            dispatch(macCalendarActions.setPaletteOpen(false));
            execAction(id);
          }}
          onClose={() => dispatch(macCalendarActions.setPaletteOpen(false))}
          footer={false}
        />
      )}
    </div>
  );
}

function StandaloneMacCalendar(props: MacCalendarProps) {
  const [state, dispatch] = useReducer(
    macCalendarReducer,
    createMacCalendarStateSeed({
      initialEvents: props.initialEvents,
      initialView: props.initialView,
    }),
  );

  return (
    <MacCalendarInner
      state={state}
      dispatch={dispatch}
      eventColors={props.eventColors ?? EVENT_COLORS}
    />
  );
}

function ConnectedMacCalendar(props: MacCalendarProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectMacCalendarState);

  useEffect(() => {
    reduxDispatch(
      macCalendarActions.initializeIfNeeded({
        initialEvents: props.initialEvents,
        initialView: props.initialView,
      }),
    );
  }, [props.initialEvents, props.initialView, reduxDispatch]);

  const effectiveState = state.initialized
    ? state
    : createMacCalendarStateSeed({
        initialEvents: props.initialEvents,
        initialView: props.initialView,
      });

  const dispatch = useCallback(
    (action: MacCalendarAction) => {
      reduxDispatch(action);
    },
    [reduxDispatch],
  );

  return (
    <MacCalendarInner
      state={effectiveState}
      dispatch={dispatch}
      eventColors={props.eventColors ?? EVENT_COLORS}
    />
  );
}

export function MacCalendar(props: MacCalendarProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    MAC_CALENDAR_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedMacCalendar {...props} />;
  }

  return <StandaloneMacCalendar {...props} />;
}
