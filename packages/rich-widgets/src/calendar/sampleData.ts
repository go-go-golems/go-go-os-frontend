import type { CalendarEvent, PaletteAction } from './types';

const today = new Date();

export const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Team Standup',
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
    duration: 30,
    color: 0,
  },
  {
    id: 'evt-2',
    title: 'Design Review',
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
    duration: 60,
    color: 1,
  },
  {
    id: 'evt-3',
    title: 'Lunch with Alex',
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0),
    duration: 60,
    color: 2,
  },
  {
    id: 'evt-4',
    title: 'Sprint Planning',
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0),
    duration: 90,
    color: 3,
  },
  {
    id: 'evt-5',
    title: '1:1 with Manager',
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 15, 30),
    duration: 30,
    color: 4,
  },
  {
    id: 'evt-6',
    title: 'Deploy v2.4',
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 16, 0),
    duration: 45,
    color: 0,
  },
  {
    id: 'evt-7',
    title: 'Coffee Chat',
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 11, 0),
    duration: 30,
    color: 2,
  },
  {
    id: 'evt-8',
    title: 'Board Meeting',
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 9, 0),
    duration: 120,
    color: 1,
  },
];

export const EVENT_COLORS = [
  'var(--hc-color-muted, #C0C0C0)',
  'var(--hc-color-border, #A0A0A0)',
  'var(--hc-color-alt, #D8D8D8)',
  'var(--hc-color-row-odd, #B8B8B8)',
  'var(--hc-color-row-even, #909090)',
];

export function makePaletteActions(view: 'month' | 'week'): PaletteAction[] {
  return [
    { id: 'new-event', label: 'New Event', icon: '\uD83D\uDCC5', shortcut: 'N' },
    { id: 'today', label: 'Go to Today', icon: '\uD83D\uDCCC', shortcut: 'T' },
    { id: 'month-view', label: 'Month View', icon: '\uD83D\uDCC6', shortcut: 'M' },
    { id: 'week-view', label: 'Week View', icon: '\uD83D\uDCCB', shortcut: 'W' },
    {
      id: 'prev',
      label: view === 'month' ? 'Previous Month' : 'Previous Week',
      icon: '\u2B05\uFE0F',
    },
    {
      id: 'next',
      label: view === 'month' ? 'Next Month' : 'Next Week',
      icon: '\u27A1\uFE0F',
    },
  ];
}
