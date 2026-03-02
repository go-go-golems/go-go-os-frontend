import { useState, useRef, useEffect, useMemo } from 'react';
import { Btn } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';
import type { CalendarEvent, CalendarView, PaletteAction } from './types';
import {
  DAYS,
  MONTHS,
  DURATION_OPTIONS,
  sameDay,
  fmtTime,
  mkEventId,
} from './types';
import { INITIAL_EVENTS, EVENT_COLORS, makePaletteActions } from './sampleData';

// ── Palette ─────────────────────────────────────────────────────────
function Palette({
  actions,
  onSelect,
  onClose,
}: {
  actions: PaletteAction[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return actions.filter((a) => a.label.toLowerCase().includes(q)).slice(0, 14);
  }, [query, actions]);

  useEffect(() => {
    setIdx(0);
  }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && filtered[idx]) {
      e.preventDefault();
      onSelect(filtered[idx].id);
    }
  };

  return (
    <div
      data-part={RICH_PARTS.calModalOverlay}
      onClick={onClose}
      style={{ paddingTop: 40, alignItems: 'flex-start' }}
    >
      <div
        data-part={RICH_PARTS.calModal}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 400 }}
      >
        <div data-part={RICH_PARTS.calPaletteSearch}>
          <span style={{ fontSize: 15, opacity: 0.4 }}>{'\uD83D\uDD0D'}</span>
          <input
            ref={ref}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search\u2026"
            data-part={RICH_PARTS.calPaletteInput}
          />
          <kbd data-part={RICH_PARTS.calKbd}>esc</kbd>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {filtered.map((a, i) => (
            <div
              key={a.id}
              onClick={() => onSelect(a.id)}
              onMouseEnter={() => setIdx(i)}
              data-part={RICH_PARTS.calPaletteItem}
              data-state={i === idx ? 'active' : undefined}
            >
              <span style={{ width: 22, textAlign: 'center', fontSize: 14 }}>
                {a.icon}
              </span>
              <span style={{ flex: 1, fontSize: 16 }}>{a.label}</span>
              {a.shortcut && (
                <span style={{ fontSize: 12, opacity: 0.5 }}>{a.shortcut}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Event Modal ─────────────────────────────────────────────────────
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
  const defDate = event.date || new Date();
  const [title, setTitle] = useState(event.title || '');
  const [dateStr, setDateStr] = useState(
    `${defDate.getFullYear()}-${String(defDate.getMonth() + 1).padStart(2, '0')}-${String(defDate.getDate()).padStart(2, '0')}`,
  );
  const [hour, setHour] = useState(event.date ? event.date.getHours() : 9);
  const [minute, setMinute] = useState(event.date ? event.date.getMinutes() : 0);
  const [duration, setDuration] = useState(event.duration || 60);
  const [color, setColor] = useState(event.color ?? 0);

  return (
    <div data-part={RICH_PARTS.calModalOverlay} onClick={onClose}>
      <div
        data-part={RICH_PARTS.calModal}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 400 }}
      >
        <div data-part={RICH_PARTS.calModalHeader}>
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
        <div data-part={RICH_PARTS.calModalBody}>
          <div>
            <div data-part={RICH_PARTS.calFieldLabel}>Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              data-part={RICH_PARTS.calFieldInput}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div data-part={RICH_PARTS.calFieldLabel}>Date</div>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                data-part={RICH_PARTS.calFieldInput}
              />
            </div>
            <div>
              <div data-part={RICH_PARTS.calFieldLabel}>Time</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <select
                  value={hour}
                  onChange={(e) => setHour(parseInt(e.target.value))}
                  data-part={RICH_PARTS.calFieldInput}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span style={{ opacity: 0.5 }}>:</span>
                <select
                  value={minute}
                  onChange={(e) => setMinute(parseInt(e.target.value))}
                  data-part={RICH_PARTS.calFieldInput}
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <div data-part={RICH_PARTS.calFieldLabel}>Duration</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {DURATION_OPTIONS.map((d) => (
                <Btn
                  key={d}
                  onClick={() => setDuration(d)}
                  data-state={duration === d ? 'active' : undefined}
                  style={{ fontSize: 12, padding: '2px 8px' }}
                >
                  {d}m
                </Btn>
              ))}
            </div>
          </div>
          <div>
            <div data-part={RICH_PARTS.calFieldLabel}>Color</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {eventColors.map((c, i) => (
                <div
                  key={i}
                  onClick={() => setColor(i)}
                  data-part={RICH_PARTS.calColorSwatch}
                  data-state={color === i ? 'active' : undefined}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <div data-part={RICH_PARTS.calModalFooter}>
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
          <Btn onClick={onClose} style={{ fontSize: 12 }}>
            Cancel
          </Btn>
          <Btn
            onClick={() => {
              if (!title.trim()) return;
              const [y, mo, d] = dateStr.split('-').map(Number);
              onSave({
                id: event.id || mkEventId(),
                title,
                date: new Date(y, mo - 1, d, hour, minute),
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
    </div>
  );
}

// ── Month View ──────────────────────────────────────────────────────
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
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({
      day: daysInPrev - i,
      current: false,
      date: new Date(year, month - 1, daysInPrev - i),
    });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, current: true, date: new Date(year, month, d) });
  while (cells.length < 42) {
    const d = cells.length - firstDay - daysInMonth + 1;
    cells.push({ day: d, current: false, date: new Date(year, month + 1, d) });
  }

  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div data-part={RICH_PARTS.calBody}>
      <div data-part={RICH_PARTS.calDayHeaders}>
        {DAYS.map((d, i) => (
          <div
            key={d}
            data-part={RICH_PARTS.calDayHeader}
            data-state={i === 0 || i === 6 ? 'weekend' : undefined}
          >
            {d}
          </div>
        ))}
      </div>
      <div data-part={RICH_PARTS.calWeeks}>
        {weeks.map((week, wi) => (
          <div key={wi} data-part={RICH_PARTS.calWeekRow}>
            {week.map((cell, di) => {
              const isToday = sameDay(cell.date, today);
              const dayEvents = events.filter((e) => sameDay(e.date, cell.date));
              return (
                <div
                  key={di}
                  onClick={() => onDayClick(cell.date)}
                  data-part={RICH_PARTS.calDayCell}
                  data-state={
                    isToday
                      ? 'today'
                      : di === 0 || di === 6
                        ? 'weekend'
                        : undefined
                  }
                  data-current={cell.current ? '' : undefined}
                >
                  <div data-part={RICH_PARTS.calDayNumber}>
                    {isToday && <span data-part={RICH_PARTS.calTodayDot} />}
                    <span data-muted={!cell.current ? '' : undefined}>
                      {cell.day}
                    </span>
                  </div>
                  <div data-part={RICH_PARTS.calDayEvents}>
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(ev);
                        }}
                        data-part={RICH_PARTS.calEventChip}
                        style={{
                          background:
                            eventColors[ev.color % eventColors.length],
                        }}
                      >
                        {ev.title}
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

// ── Week View ───────────────────────────────────────────────────────
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
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 8 * HOUR_HEIGHT;
  }, [weekStart]);

  const now = new Date();
  const nowDay = days.findIndex((d) => sameDay(d, now));
  const nowOffset = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;

  return (
    <div data-part={RICH_PARTS.calBody}>
      <div data-part={RICH_PARTS.calDayHeaders}>
        <div data-part={RICH_PARTS.calTimeGutterHeader} />
        {days.map((d, i) => {
          const isT = sameDay(d, today);
          return (
            <div
              key={i}
              data-part={RICH_PARTS.calDayHeader}
              data-state={
                isT ? 'today' : i === 0 || i === 6 ? 'weekend' : undefined
              }
            >
              <div style={{ fontSize: 12 }}>{DAYS[i]}</div>
              <div style={{ fontSize: 18 }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div ref={scrollRef} data-part={RICH_PARTS.calTimeGrid}>
        <div
          style={{
            display: 'flex',
            height: 24 * HOUR_HEIGHT,
            position: 'relative',
          }}
        >
          <div data-part={RICH_PARTS.calTimeGutter}>
            {hours.map((h) => (
              <div
                key={h}
                data-part={RICH_PARTS.calTimeLabel}
                style={{ height: HOUR_HEIGHT }}
              >
                {fmtTime(h, 0)}
              </div>
            ))}
          </div>
          {days.map((day, di) => {
            const dayEvents = events.filter((e) => sameDay(e.date, day));
            const isT = sameDay(day, today);
            return (
              <div
                key={di}
                data-part={RICH_PARTS.calWeekDayCol}
                data-state={isT ? 'today' : undefined}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y =
                    e.clientY -
                    rect.top +
                    (scrollRef.current?.scrollTop || 0);
                  const clickHour = Math.floor(y / HOUR_HEIGHT);
                  const min =
                    Math.round(((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 4) * 15;
                  const clickDate = new Date(day);
                  clickDate.setHours(clickHour, min >= 60 ? 0 : min);
                  onTimeClick(clickDate);
                }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    data-part={RICH_PARTS.calHourSlot}
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
                {dayEvents.map((ev) => {
                  const top =
                    (ev.date.getHours() + ev.date.getMinutes() / 60) *
                    HOUR_HEIGHT;
                  const height = Math.max(
                    20,
                    (ev.duration / 60) * HOUR_HEIGHT,
                  );
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev);
                      }}
                      data-part={RICH_PARTS.calWeekEvent}
                      style={{
                        top,
                        height,
                        background:
                          eventColors[ev.color % eventColors.length],
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
                        {ev.title}
                      </div>
                      {height > 30 && (
                        <div style={{ opacity: 0.7, fontSize: 11 }}>
                          {fmtTime(ev.date.getHours(), ev.date.getMinutes())}
                        </div>
                      )}
                    </div>
                  );
                })}
                {di === nowDay && (
                  <div
                    data-part={RICH_PARTS.calNowLine}
                    style={{ top: nowOffset }}
                  >
                    <div data-part={RICH_PARTS.calNowDot} />
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

// ── Props ────────────────────────────────────────────────────────────
export interface MacCalendarProps {
  initialEvents?: CalendarEvent[];
  initialView?: CalendarView;
  eventColors?: string[];
}

// ── Main Component ──────────────────────────────────────────────────
export function MacCalendar({
  initialEvents = INITIAL_EVENTS,
  initialView = 'month',
  eventColors = EVENT_COLORS,
}: MacCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [view, setView] = useState<CalendarView>(initialView);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editEvent, setEditEvent] = useState<Partial<CalendarEvent> | null>(
    null,
  );
  const [showPalette, setShowPalette] = useState(false);

  const todayDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const navigateMonth = (dir: number) =>
    setCurrentDate(new Date(year, month + dir, 1));
  const navigateWeek = (dir: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  const handleSave = (evt: CalendarEvent) => {
    setEvents((prev) => {
      const exists = prev.find((e) => e.id === evt.id);
      if (exists) return prev.map((e) => (e.id === evt.id ? evt : e));
      return [...prev, evt];
    });
  };
  const handleDelete = (id: string) =>
    setEvents((prev) => prev.filter((e) => e.id !== id));

  const actions = makePaletteActions(view);

  const execAction = (id: string) => {
    switch (id) {
      case 'new-event':
        setEditEvent({ date: new Date() });
        break;
      case 'today':
        goToday();
        break;
      case 'month-view':
        setView('month');
        break;
      case 'week-view':
        setView('week');
        break;
      case 'prev':
        view === 'month' ? navigateMonth(-1) : navigateWeek(-1);
        break;
      case 'next':
        view === 'month' ? navigateMonth(1) : navigateWeek(1);
        break;
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (editEvent || showPalette) return;
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'p'
      ) {
        e.preventDefault();
        setShowPalette(true);
      } else if (e.key === 'n')
        setEditEvent({ date: new Date() });
      else if (e.key === 't') goToday();
      else if (e.key === 'm') setView('month');
      else if (e.key === 'w') setView('week');
      else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        view === 'month' ? navigateMonth(-1) : navigateWeek(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        view === 'month' ? navigateMonth(1) : navigateWeek(1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editEvent, showPalette, view, year, month]);

  const headerText =
    view === 'month'
      ? `${MONTHS[month]} ${year}`
      : `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} \u2013 ${(() => {
          const e = new Date(weekStart);
          e.setDate(e.getDate() + 6);
          return `${MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
        })()}`;

  return (
    <div data-part={RICH_PARTS.calendar}>
      {/* ── Toolbar ── */}
      <div data-part={RICH_PARTS.calToolbar}>
        <Btn
          onClick={() =>
            view === 'month' ? navigateMonth(-1) : navigateWeek(-1)
          }
          style={{ fontSize: 14, padding: '2px 8px' }}
        >
          {'\u25C0'}
        </Btn>
        <Btn onClick={goToday} style={{ fontSize: 12, padding: '3px 10px' }}>
          Today
        </Btn>
        <Btn
          onClick={() =>
            view === 'month' ? navigateMonth(1) : navigateWeek(1)
          }
          style={{ fontSize: 14, padding: '2px 8px' }}
        >
          {'\u25B6'}
        </Btn>
        <span data-part={RICH_PARTS.calHeaderText}>{headerText}</span>
        <div style={{ flex: 1 }} />
        <div data-part={RICH_PARTS.calViewToggle}>
          <Btn
            onClick={() => setView('month')}
            data-state={view === 'month' ? 'active' : undefined}
            style={{ fontSize: 12, padding: '3px 10px' }}
          >
            {'\uD83D\uDCC6'} Month
          </Btn>
          <Btn
            onClick={() => setView('week')}
            data-state={view === 'week' ? 'active' : undefined}
            style={{ fontSize: 12, padding: '3px 10px' }}
          >
            {'\uD83D\uDCCB'} Week
          </Btn>
        </div>
        <Btn
          onClick={() =>
            setEditEvent({
              date: new Date(year, month, todayDate.getDate(), 9, 0),
            })
          }
          data-state="active"
          style={{ fontSize: 12, fontWeight: 'bold', padding: '3px 10px' }}
        >
          {'\u2795'} New
        </Btn>
        <Btn
          onClick={() => setShowPalette(true)}
          style={{ fontSize: 12, padding: '2px 7px', opacity: 0.6 }}
        >
          {'\u2318'}P
        </Btn>
      </div>

      {/* ── Calendar Body ── */}
      {view === 'month' ? (
        <MonthView
          year={year}
          month={month}
          events={events}
          eventColors={eventColors}
          today={todayDate}
          onDayClick={(date) =>
            setEditEvent({
              date: new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                9,
                0,
              ),
            })
          }
          onEventClick={(ev) => setEditEvent(ev)}
        />
      ) : (
        <WeekView
          weekStart={weekStart}
          events={events}
          eventColors={eventColors}
          today={todayDate}
          onTimeClick={(date) => setEditEvent({ date })}
          onEventClick={(ev) => setEditEvent(ev)}
        />
      )}

      {/* ── Status Bar ── */}
      <div data-part={RICH_PARTS.calStatusBar}>
        <div style={{ display: 'flex', gap: 14 }}>
          <span>{events.length} events</span>
          <span>
            {events.filter((e) => sameDay(e.date, todayDate)).length} today
          </span>
        </div>
        <span>
          N = new {'\u00B7'} T = today {'\u00B7'} M/W = view {'\u00B7'}{' '}
          {'\u2190\u2192'} = navigate
        </span>
      </div>

      {/* ── Event Modal ── */}
      {editEvent && (
        <EventModal
          event={editEvent}
          eventColors={eventColors}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditEvent(null)}
        />
      )}

      {/* ── Command Palette ── */}
      {showPalette && (
        <Palette
          actions={actions}
          onSelect={(id) => {
            setShowPalette(false);
            execAction(id);
          }}
          onClose={() => setShowPalette(false)}
        />
      )}
    </div>
  );
}
