export type CalendarView = 'month' | 'week';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  duration: number; // minutes
  color: number; // index into theme.eventColors
}

export interface PaletteAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
}

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function fmtTime(h: number, m: number): string {
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export function fmtDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

let nextId = 100;
export function mkEventId(): string {
  return `evt-${nextId++}`;
}
