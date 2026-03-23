---
Title: MacCalendar Widget Decomposition and DSL Port Analysis
Ticket: CALENDAR-PORT
Status: active
Topics:
    - frontend
    - runtime
    - widget-dsl
    - hypercard
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/docs/widget-dsl-porting-playbook.md:The master porting playbook
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/calendar/MacCalendar.tsx:Main calendar component (802 lines)
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/calendar/macCalendarState.ts:Redux state slice with serialized events
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/calendar/types.ts:CalendarEvent, CalendarView, utility functions
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/calendar/sampleData.ts:Initial events and color palette
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/theme/calendar.css:Calendar CSS theme (295 lines)
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx:Reference pack implementation
ExternalSources: []
Summary: Detailed decomposition of the MacCalendar widget for porting to the HyperCard widget DSL runtime, including page composition DSL and event content DSL with seed/managed reconciliation.
LastUpdated: 2026-03-10T11:13:05.499875965-04:00
WhatFor: Guide the implementation of the MacCalendar pack
WhenToUse: When implementing the calendar.v1 pack or authoring calendar VM cards
---

# MacCalendar Widget Decomposition and DSL Port Analysis

## 1. Widget Overview

MacCalendar is a full-featured calendar widget (802 lines) with month and week views, event CRUD through a modal dialog, keyboard shortcuts, and a command palette. It follows the same 3-tier architecture as other rich widgets: `MacCalendar` (auto-detects Redux) -> `Connected/Standalone` -> `MacCalendarInner` (state + dispatch).

### Source Files

| File | Lines | Purpose |
|------|-------|---------|
| `MacCalendar.tsx` | 802 | Main component: EventModal, MonthView, WeekView, MacCalendarInner |
| `macCalendarState.ts` | 151 | Redux slice: 10 actions, serialization helpers |
| `types.ts` | 57 | CalendarEvent, CalendarView, DAYS, MONTHS, utilities |
| `sampleData.ts` | 89 | 8 initial events, 5 event colors, palette action generator |
| `calendar.css` | 295 | Full calendar theme using design tokens |

### Key Types

```typescript
type CalendarView = 'month' | 'week';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  duration: number;   // minutes
  color: number;      // index into eventColors array
}
```

### Architecture

```
MacCalendar (Redux auto-detect)
  ├── ConnectedMacCalendar (Redux dispatch + selector)
  │     └── MacCalendarInner (state + dispatch + eventColors)
  └── StandaloneMacCalendar (useReducer)
        └── MacCalendarInner (state + dispatch + eventColors)
```

### State Shape

```typescript
interface MacCalendarState {
  initialized: boolean;
  events: StoredCalendarEvent[];    // date serialized as dateMs
  view: CalendarView;               // 'month' | 'week'
  currentDateMs: number;            // navigation anchor
  editingEventId: string | null;    // which event is in the modal
  draftDateMs: number | null;       // date for new event
  paletteOpen: boolean;             // command palette visibility
}
```

### Redux Actions (10 total)

| Action | Purpose |
|--------|---------|
| `initializeIfNeeded` | Lazy init from seed |
| `replaceState` | Full state replacement |
| `setView` | Switch month/week |
| `setCurrentDateMs` | Navigate to date |
| `openNewEvent` | Open modal for new event at date |
| `editExistingEvent` | Open modal for existing event |
| `closeEditor` | Close the event modal |
| `saveEvent` | Create or update event |
| `deleteEvent` | Remove event by ID |
| `setPaletteOpen` / `togglePalette` | Command palette control |


## 2. Component Decomposition

### 2.1 EventModal (lines 39-208)

A modal dialog for creating and editing events. Contains:
- Title input field
- Date picker (HTML date input)
- Time selectors (hour 0-23, minute in 15-min increments)
- Duration buttons (15, 30, 45, 60, 90, 120 minutes)
- Color swatch picker (5 colors)
- Footer with Delete (edit only), Cancel, Create/Save buttons

**Host-only mechanics:** The entire modal is host-owned. The VM configures whether the modal is open and what event is being edited, but the form state (title text, date string, hour/minute selects, selected duration, selected color) lives entirely in React `useState`. The modal uses the shared `ModalOverlay` primitive.

### 2.2 MonthView (lines 210-316)

A 6-week grid showing the current month plus overflow days from adjacent months.

- **Day headers** row (Sun-Sat, with weekend styling)
- **Week rows** (6 rows x 7 days)
- Each **day cell** contains: day number, today dot indicator, up to 3 event chips, "+N more" overflow
- Event chips show title with color background
- Clicking a day opens the new-event modal
- Clicking an event chip opens the edit modal

**Host-only mechanics:** Grid computation (first day of month, days in month, cell generation) is pure host math. Event filtering per day (`events.filter(e => sameDay(e.date, cell.date))`) happens on every render.

### 2.3 WeekView (lines 320-468)

A 7-column time grid with 24 hour rows.

- **Day headers** with day name and date number
- **Time gutter** (left column with hour labels, 52px per hour)
- **Day columns** with hourly slot grid lines
- **Event blocks** positioned absolutely: `top = (hours + minutes/60) * 52px`, `height = (duration/60) * 52px`
- **Now line** with red dot on today's column
- Clicking a time slot opens new-event modal at that time
- Auto-scrolls to 8:00 AM on navigation

**Host-only mechanics:** All positioning math, scroll behavior, now-line tracking. The time grid is entirely a rendering concern.

### 2.4 MacCalendarInner (lines 476-731)

The orchestrator component:

- **Toolbar**: back/today/forward navigation, header text (month name or week range), view toggle (month/week), new event button, command palette button
- **View body**: renders MonthView or WeekView based on `state.view`
- **Status bar**: event count, today count, keyboard shortcut hints
- **Event modal** (conditional, when editing/creating)
- **Command palette** (conditional, when open)
- **Keyboard shortcuts**: N (new), T (today), M/W (view), arrows (navigate), Ctrl+Shift+P (palette)

### 2.5 Shared Primitives Used

| Primitive | Source | Used For |
|-----------|--------|----------|
| `WidgetToolbar` | `primitives/WidgetToolbar` | Top toolbar container |
| `WidgetStatusBar` | `primitives/WidgetStatusBar` | Bottom status bar |
| `ModalOverlay` | `primitives/ModalOverlay` | Event modal backdrop |
| `CommandPalette` | `primitives/CommandPalette` | Command palette overlay |
| `Btn` | `@hypercard/engine` | All interactive buttons |


## 3. Host vs VM Boundary Analysis

### VM Owns (semantic state and composition)

- Which view to show (month vs week)
- Navigation date
- Event data (via content DSL -- see Section 6)
- Whether the toolbar, status bar, and views are present
- Event colors (the palette)
- Which toolbar actions to include
- Status bar content

### Host Owns (rendering and interaction)

- Month grid computation (day cells, week rows, overflow days)
- Week time grid layout (hour heights, event positioning, scroll)
- Now-line tracking and rendering
- Event modal form state (title, date, time, duration, color inputs)
- Modal overlay lifecycle
- Command palette rendering and filtering
- Keyboard shortcut handling
- Click-to-create event flow (day click -> openNewEvent, time slot click -> openNewEvent)
- Event chip rendering and overflow ("X more")
- Date formatting, time formatting
- Auto-scroll to 8 AM in week view

### Key Boundary Decision: Event Modal

The event modal is entirely host-owned. The VM should not describe form fields or input elements. The VM's role is:
1. Signal "open modal for event X" or "open modal for new event at date Y"
2. Receive the completed event back via a save handler

This is the correct boundary because:
- Form state (validation, partial inputs, local edits) is transient UI state
- The modal's internal layout is a rendering detail
- The VM only needs to know the final result


## 4. Page Composition DSL Design

### Pack ID: `calendar.v1`
### Widget accessor: `widgets.calendar.*`

### 4.1 DSL Node Inventory

| # | Node | DSL Method | Props | Purpose |
|---|------|-----------|-------|---------|
| 1 | `page` | `widgets.calendar.page(...)` | `{ view }` | Root container, selects month/week |
| 2 | `toolbar` | `widgets.calendar.toolbar(...)` | `{ title }` | Top toolbar with navigation |
| 3 | `nav` | `widgets.calendar.nav(...)` | `{ onPrev, onNext, onToday }` | Back/Today/Forward buttons |
| 4 | `viewToggle` | `widgets.calendar.viewToggle(...)` | `{ view, onMonth, onWeek }` | Month/Week switch buttons |
| 5 | `toolbarActions` | `widgets.calendar.toolbarActions(...)` | none | Right-side toolbar buttons |
| 6 | `newEventButton` | `widgets.calendar.newEventButton(...)` | `{ onClick }` | Create event button |
| 7 | `monthView` | `widgets.calendar.monthView(...)` | `{ year, month, onDayClick, onEventClick }` | Month grid rendering |
| 8 | `weekView` | `widgets.calendar.weekView(...)` | `{ weekStartMs, onTimeClick, onEventClick }` | Week time grid rendering |
| 9 | `status` | `widgets.calendar.status(...)` | `{ items }` | Bottom status bar |
| 10 | `eventModal` | `widgets.calendar.eventModal(...)` | `{ onSave, onDelete, onClose }` | Event editor configuration |
| 11 | `colorPalette` | `widgets.calendar.colorPalette(...)` | `{ colors }` | Event color definitions |

### 4.2 Rationale for Each Node

**`page`** -- Root container. The `view` prop tells the host which view is active, but the host reads it from the presence of `monthView` or `weekView` children. `view` is declarative ("I want month view") rather than the host inferring from children, because the page might want both views defined but only one active.

**`toolbar`** -- Container for navigation and actions. `title` is the formatted header text (e.g., "March 2026" or "Mar 8 -- Mar 14, 2026"). The VM computes this string because it is a semantic label, not a rendering detail.

**`nav`** -- Navigation buttons are a distinct concept from the toolbar. Authors can omit nav to make a static calendar. The handlers (`onPrev`, `onNext`, `onToday`) let the VM control navigation logic.

**`viewToggle`** -- Separate from nav because an author might want navigation but no view switching (e.g., a week-only calendar). `view` tells the host which button to highlight. Handlers let the VM switch views.

**`toolbarActions`** -- Container for right-side actions. Children are `newEventButton` and any custom buttons. Separating this lets authors add custom toolbar items.

**`newEventButton`** -- Explicit node rather than a prop on toolbar because authors might want to restyle, reposition, or omit the create button.

**`monthView`** -- The month grid. `year` and `month` are integers. The host computes all grid cells, day headers, event placement. Events are read from semantic state, not passed as props (performance: avoids serializing the full event list through the DSL on every render).

**`weekView`** -- The time grid. `weekStartMs` is a timestamp for the Sunday of the displayed week. Same event-reading pattern as monthView.

**`status`** -- Status bar items. `items` is an array of label strings (e.g., `["8 events", "3 today"]`). Authors can customize what stats to show.

**`eventModal`** -- Not a visual description of the modal form -- just configuration that the host's event modal is active and wired up. `onSave` receives the completed event. `onDelete` and `onClose` are handler refs.

**`colorPalette`** -- Defines the available event colors. Separate from eventModal because colors also affect event chips in both views. `colors` is an array of CSS color strings.

### 4.3 Example Card: Standard Calendar

```javascript
const card = {
  render(state) {
    const w = widgets.calendar;
    const now = new Date(state.currentDateMs);
    const year = now.getFullYear();
    const month = now.getMonth();

    return w.page({ view: state.view },
      w.toolbar({ title: formatMonthYear(year, month) },
        w.nav({
          onPrev: handlers.navigatePrev,
          onNext: handlers.navigateNext,
          onToday: handlers.goToday,
        }),
        w.viewToggle({
          view: state.view,
          onMonth: handlers.setMonthView,
          onWeek: handlers.setWeekView,
        }),
        w.toolbarActions(
          w.newEventButton({ onClick: handlers.openNewEvent }),
        ),
      ),
      state.view === 'month'
        ? w.monthView({
            year,
            month,
            onDayClick: handlers.onDayClick,
            onEventClick: handlers.onEventClick,
          })
        : w.weekView({
            weekStartMs: getWeekStart(state.currentDateMs),
            onTimeClick: handlers.onTimeClick,
            onEventClick: handlers.onEventClick,
          }),
      w.status({ items: [`${state.eventCount} events`, `${state.todayCount} today`] }),
      w.eventModal({
        onSave: handlers.saveEvent,
        onDelete: handlers.deleteEvent,
        onClose: handlers.closeEditor,
      }),
      w.colorPalette({ colors: ['#C0C0C0', '#A0A0A0', '#D8D8D8', '#B8B8B8', '#909090'] }),
    );
  },
};
```

### 4.4 Example Card: Week-Only Dashboard

```javascript
const card = {
  render(state) {
    const w = widgets.calendar;
    return w.page({ view: 'week' },
      w.toolbar({ title: formatWeekRange(state.currentDateMs) },
        w.nav({
          onPrev: handlers.navigatePrev,
          onNext: handlers.navigateNext,
          onToday: handlers.goToday,
        }),
        // No viewToggle -- week only
      ),
      w.weekView({
        weekStartMs: getWeekStart(state.currentDateMs),
        onTimeClick: handlers.onTimeClick,
        onEventClick: handlers.onEventClick,
      }),
      w.status({ items: [`Week of ${formatDate(state.currentDateMs)}`] }),
      w.eventModal({
        onSave: handlers.saveEvent,
        onDelete: handlers.deleteEvent,
        onClose: handlers.closeEditor,
      }),
    );
  },
};
```

### 4.5 Example Card: Read-Only Month Display

```javascript
const card = {
  render(state) {
    const w = widgets.calendar;
    return w.page({ view: 'month' },
      w.toolbar({ title: `${MONTHS[state.month]} ${state.year}` },
        w.nav({
          onPrev: handlers.navigatePrev,
          onNext: handlers.navigateNext,
          onToday: handlers.goToday,
        }),
        // No viewToggle, no new event button
      ),
      w.monthView({
        year: state.year,
        month: state.month,
        onEventClick: handlers.onEventClick,
        // No onDayClick -- clicking a day does nothing
      }),
      w.status({ items: [`${state.eventCount} events this month`] }),
      // No eventModal -- events are read-only, clicking shows detail
    );
  },
};
```


## 5. Host-Only Mechanics Catalog

These are mechanics that exist entirely in the host renderer and are never exposed to the VM through the DSL.

### 5.1 Month Grid Computation

The host computes the 6x7 cell grid: first day of month, days in previous month for leading cells, current month days, trailing days from next month. This is pure calendar math. The VM only provides `year` and `month`.

### 5.2 Week Time Grid Layout

The host computes hour slot heights (52px), event positioning (`top = (hours + minutes/60) * 52`), event block heights (`duration/60 * 52`), and the time gutter labels. The VM only provides `weekStartMs`.

### 5.3 Auto-Scroll

Week view auto-scrolls to 8:00 AM when the navigation date changes. This is a scroll behavior concern owned by the host.

### 5.4 Now-Line

The red "now" indicator in week view is host-driven. It reads `new Date()` and computes its position. No VM involvement.

### 5.5 Event Modal Form State

All internal modal state (title input, date picker value, hour/minute selects, duration selection, color selection) is transient React `useState`. The VM receives only the final saved event.

### 5.6 Command Palette

The command palette rendering, filtering, and keyboard interaction are host-owned. The VM can define palette actions (as an extension point) but the palette UI itself is a host mechanic.

### 5.7 Keyboard Shortcuts

Shortcut handling (N, T, M, W, arrows, Ctrl+Shift+P) is host-owned. The host maps shortcuts to the same handlers the VM wired up in the DSL nodes.

### 5.8 Event Chip Rendering

Event chips in month view (with color, overflow "X more") and event blocks in week view (with absolute positioning) are rendering details. The host reads events from semantic state and renders them.

### 5.9 Date Formatting

`fmtTime`, `fmtDate`, month/year header text formatting are host utilities. However, the toolbar `title` prop is VM-computed because the VM controls the header label as a semantic string.


## 6. Event Content DSL Design

Analogous to SystemModeler's model DSL for blocks and wires, MacCalendar needs an event DSL for programmatically managing calendar events from VM cards.

### 6.1 Purpose

The event DSL lets VM card authors:
- Pre-populate a calendar with events
- Dynamically generate events from data (e.g., meetings from an API, deadlines from a project plan)
- Control event properties (title, date, duration, color)
- Choose whether the VM or the user owns the event set

### 6.2 DSL Nodes

| # | Node | DSL Method | Props | Purpose |
|---|------|-----------|-------|---------|
| 1 | `events` | `widgets.calendar.events(...)` | `{ mode }` | Event collection root |
| 2 | `event` | `widgets.calendar.event(...)` | `{ id, title, dateMs, duration, color }` | Single event definition |

### 6.3 Reconciliation Modes

The `events` root node supports two reconciliation modes, following the pattern established by the SystemModeler model DSL:

#### Seed Mode (`mode: 'seed'`)

- Events are applied **once** when the calendar initializes (or when the event set has not been seeded yet).
- After seeding, the user owns the event list: they can create, edit, and delete events freely.
- Subsequent renders that return the same `events(...)` node are **ignored** -- the host does not re-apply.
- Use case: "Start with these meetings, then let the user modify."

#### Managed Mode (`mode: 'managed'`)

- The VM's event list is **authoritative on every render**.
- The host reconciles: events not in the VM's list are removed, new events are added, changed events are updated.
- User edits are overwritten on the next render cycle.
- Use case: "Show exactly these events from the API, always in sync."

#### Reconciliation Rules

| Scenario | Seed | Managed |
|----------|------|---------|
| VM adds event | Applied once at init | Added on every render |
| VM removes event | N/A (VM no longer involved) | Removed on next render |
| VM changes event props | N/A | Updated on next render |
| User creates event | Persists | Removed on next render |
| User edits event | Persists | Overwritten on next render |
| User deletes event | Persists | Re-added on next render |

### 6.4 Event Node Props

```typescript
interface EventNodeProps {
  id: string;           // Stable identifier for reconciliation
  title: string;        // Event title
  dateMs: number;       // Start time as epoch milliseconds
  duration: number;     // Duration in minutes
  color?: number;       // Color index (0-based, into colorPalette)
}
```

**Why `dateMs` instead of a Date object?** The VM runs in QuickJS. Date objects do not serialize cleanly across the VM/host boundary. Millisecond timestamps are primitive values that cross without friction. The host converts to Date internally.

**Why `color` is an index, not a CSS string?** The VM should not know about CSS. It references colors by index into the `colorPalette` node's `colors` array. This keeps the VM/host boundary clean.

### 6.5 Example: Seeded Team Calendar

```javascript
const card = {
  render(state) {
    const w = widgets.calendar;
    return w.page({ view: state.view },
      w.toolbar({ title: state.headerText },
        w.nav({ onPrev: handlers.prev, onNext: handlers.next, onToday: handlers.today }),
        w.viewToggle({ view: state.view, onMonth: handlers.month, onWeek: handlers.week }),
        w.toolbarActions(
          w.newEventButton({ onClick: handlers.newEvent }),
        ),
      ),
      state.view === 'month'
        ? w.monthView({ year: state.year, month: state.month,
            onDayClick: handlers.dayClick, onEventClick: handlers.eventClick })
        : w.weekView({ weekStartMs: state.weekStartMs,
            onTimeClick: handlers.timeClick, onEventClick: handlers.eventClick }),
      w.events({ mode: 'seed' },
        w.event({ id: 'standup', title: 'Daily Standup',
          dateMs: todayAt(9, 0), duration: 30, color: 0 }),
        w.event({ id: 'review', title: 'Design Review',
          dateMs: todayAt(14, 0), duration: 60, color: 1 }),
        w.event({ id: 'retro', title: 'Sprint Retro',
          dateMs: fridayAt(15, 0), duration: 90, color: 3 }),
      ),
      w.status({ items: [`${state.eventCount} events`] }),
      w.eventModal({ onSave: handlers.save, onDelete: handlers.del, onClose: handlers.close }),
      w.colorPalette({ colors: ['#C0C0C0', '#A0A0A0', '#D8D8D8', '#B8B8B8', '#909090'] }),
    );
  },
};
```

After initialization, the user can add "Lunch with Alex" or delete "Design Review" -- the VM's seed is no longer consulted.

### 6.6 Example: Managed API-Driven Calendar

```javascript
const card = {
  render(state) {
    const w = widgets.calendar;
    // state.meetings comes from an API fetch stored in semantic state
    const meetingEvents = state.meetings.map(m =>
      w.event({
        id: m.id,
        title: m.subject,
        dateMs: m.startTimeMs,
        duration: m.durationMinutes,
        color: m.isRecurring ? 1 : 0,
      })
    );

    return w.page({ view: 'week' },
      w.toolbar({ title: `Meetings: ${state.weekLabel}` },
        w.nav({ onPrev: handlers.prev, onNext: handlers.next, onToday: handlers.today }),
      ),
      w.weekView({
        weekStartMs: state.weekStartMs,
        onEventClick: handlers.eventClick,
        // No onTimeClick -- can't create events in managed mode
      }),
      w.events({ mode: 'managed' }, ...meetingEvents),
      w.status({ items: [`${state.meetings.length} meetings this week`] }),
      // No eventModal -- managed mode, no user editing
    );
  },
};
```

The event list updates every render cycle. If the API returns a new meeting, it appears. If a meeting is cancelled, it disappears.

### 6.7 Example: Recurring Events Generator

```javascript
const card = {
  render(state) {
    const w = widgets.calendar;
    // Generate recurring standup events for the visible month
    const standups = [];
    const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(state.year, state.month, d);
      const dow = date.getDay();
      if (dow >= 1 && dow <= 5) { // weekdays only
        standups.push(
          w.event({
            id: `standup-${state.year}-${state.month}-${d}`,
            title: 'Daily Standup',
            dateMs: date.setHours(9, 0, 0, 0),
            duration: 15,
            color: 0,
          })
        );
      }
    }

    return w.page({ view: state.view },
      w.toolbar({ title: state.headerText },
        w.nav({ onPrev: handlers.prev, onNext: handlers.next, onToday: handlers.today }),
        w.viewToggle({ view: state.view, onMonth: handlers.month, onWeek: handlers.week }),
      ),
      state.view === 'month'
        ? w.monthView({ year: state.year, month: state.month,
            onDayClick: handlers.dayClick, onEventClick: handlers.eventClick })
        : w.weekView({ weekStartMs: state.weekStartMs,
            onTimeClick: handlers.timeClick, onEventClick: handlers.eventClick }),
      w.events({ mode: 'seed' }, ...standups),
      w.status({ items: [`${standups.length} standups generated`] }),
      w.eventModal({ onSave: handlers.save, onDelete: handlers.del, onClose: handlers.close }),
    );
  },
};
```


## 7. Variation Axis Analysis

What actually changes between different calendar cards?

### 7.1 Primary Variation: View Configuration

Some cards are month-only, some week-only, some offer both. The DSL handles this naturally: include `monthView`, `weekView`, or both with a conditional.

### 7.2 Secondary Variation: Event Source

- **Seed with sample data** -- team calendars, personal calendars
- **Managed from external data** -- meeting sync, project deadlines, shift schedules
- **Seed with generated recurring events** -- standup templates, maintenance windows

### 7.3 Tertiary Variation: Interactivity Level

- **Full CRUD** -- eventModal + newEventButton + onDayClick/onTimeClick + onEventClick
- **Edit-only** -- eventModal + onEventClick (no creation)
- **Read-only** -- no eventModal, events are display-only
- **Mixed** -- managed events are read-only, but user can add overlay events (future extension)

### 7.4 Quaternary Variation: Toolbar Customization

- Which navigation buttons to show
- Whether to include view toggle
- Custom toolbar actions (export, filter by color, etc.)
- Custom status bar content

### 7.5 Non-Varying Constants (Host-Owned)

These do **not** vary between cards:
- Grid layout algorithm (both views)
- Event positioning math
- Now-line
- Auto-scroll behavior
- Modal form layout
- Keyboard shortcuts
- Color swatch rendering
- Day/time formatting


## 8. Pack Renderer Design Notes

### 8.1 Node Tree Shape

The validator should accept:

```
page
  ├── toolbar (optional)
  │     ├── nav (optional)
  │     ├── viewToggle (optional)
  │     └── toolbarActions (optional)
  │           └── newEventButton (optional)
  ├── monthView (optional, but at least one view required)
  ├── weekView (optional, but at least one view required)
  ├── status (optional)
  ├── eventModal (optional)
  ├── events (optional)
  │     └── event* (zero or more)
  └── colorPalette (optional)
```

### 8.2 Validation Rules

1. Root must be `page`.
2. At least one of `monthView` or `weekView` must be present.
3. If `page.view` is `'month'`, `monthView` should be present. If `'week'`, `weekView` should be present.
4. `event` nodes can only appear as children of `events`.
5. Each `event` must have `id`, `title`, `dateMs`, and `duration`.
6. `colorPalette.colors` must be an array of strings if present.
7. `events.mode` must be `'seed'` or `'managed'`.

### 8.3 Renderer Responsibilities

The pack renderer:
1. Reads the node tree from the VM.
2. Extracts `events` children and handles reconciliation (seed vs managed).
3. Maps `monthView`/`weekView` props to the host `MonthView`/`WeekView` components.
4. Wires handler refs from DSL nodes to Redux actions.
5. Reads the full event list from Redux state (not from DSL props) for rendering.
6. Manages `eventModal` open/close state via Redux.
7. Passes `colorPalette.colors` to both the event modal and the view components.

### 8.4 Event Data Flow

```
VM card render
  └── events({ mode: 'seed' }, event(...), event(...))
        │
        ▼
Pack renderer (reconciliation)
  └── Dispatches Redux actions: saveEvent, deleteEvent
        │
        ▼
Redux slice (macCalendarState)
  └── state.events: StoredCalendarEvent[]
        │
        ▼
Host primitives (MonthView, WeekView)
  └── Read events from Redux selector, render chips/blocks
```

For managed mode, this cycle runs on every render. For seed mode, it runs once.

### 8.5 Handler Mapping

| DSL Handler | Redux Action |
|-------------|-------------|
| `nav.onPrev` | `setCurrentDateMs(computePrev())` |
| `nav.onNext` | `setCurrentDateMs(computeNext())` |
| `nav.onToday` | `setCurrentDateMs(Date.now())` |
| `viewToggle.onMonth` | `setView('month')` |
| `viewToggle.onWeek` | `setView('week')` |
| `newEventButton.onClick` | `openNewEvent(dateMs)` |
| `monthView.onDayClick` | `openNewEvent(dayMs)` |
| `monthView.onEventClick` | `editExistingEvent(id)` |
| `weekView.onTimeClick` | `openNewEvent(timeMs)` |
| `weekView.onEventClick` | `editExistingEvent(id)` |
| `eventModal.onSave` | `saveEvent(serialized)` |
| `eventModal.onDelete` | `deleteEvent(id)` |
| `eventModal.onClose` | `closeEditor()` |


## 9. Comparison with Prior Port Analyses

### vs. LogViewer

| Aspect | LogViewer | MacCalendar |
|--------|-----------|-------------|
| Layout | 3-column (sidebar, main, detail) | Single panel with view switching |
| Data volume | Thousands of log entries | Moderate event count |
| Content DSL | N/A (logs come from host/streaming) | Events DSL with seed/managed |
| Host computation | Filtering, sparkline bucketing | Grid math, event positioning |
| Modal | N/A | EventModal for CRUD |
| Views | Single table view | Month + Week (mutually exclusive) |

### vs. SystemModeler

| Aspect | SystemModeler | MacCalendar |
|--------|---------------|-------------|
| Canvas | SVG block diagram | CSS grid/time grid |
| Content DSL | Model DSL (blocks + wires) | Events DSL (events) |
| Content nodes | 3 (model, block, wire) | 2 (events, event) |
| Reconciliation | seed/managed | seed/managed (same pattern) |
| Interaction | Drag, wiring, port mouse | Click to create, modal edit |
| Simulation | Yes (timer-driven) | No (static display) |

### Pattern Confirmed

The two-DSL pattern (page composition + content data) works cleanly for MacCalendar. This is the third widget where the pattern holds:
1. **Kanban** -- page DSL only (cards are the content, managed by VM natively)
2. **SystemModeler** -- page DSL + model DSL (blocks/wires)
3. **MacCalendar** -- page DSL + events DSL

The content DSL with seed/managed reconciliation is becoming a standard pattern for widgets that manage domain object collections.


## 10. Open Questions and Future Considerations

### 10.1 Multi-Day Events

The current `CalendarEvent` type has a single `date` and `duration`. Events that span multiple days (conferences, vacations) would need either:
- A very large `duration` (host renders across days)
- Explicit `startDateMs` + `endDateMs` (breaking change to event node props)

Recommendation: defer. The current model works for typical calendar use cases.

### 10.2 Recurring Events in Managed Mode

If the VM generates recurring events in managed mode, it must generate all instances for the visible range. This means the VM needs to know the visible date range, which it already has via `state.currentDateMs` + `state.view`.

### 10.3 Color Palette Extension

The current design uses numeric indices. If a card needs more than the palette's colors, it either extends the palette or wraps around. This is simple and predictable.

### 10.4 Custom Event Chip Content

The current event chip shows only the title. Future cards might want to show time, duration, icons, or other metadata. This could be addressed via a future `eventChip` sub-node, but should not be designed until there is a concrete use case. Follow the playbook rule: do not design at step 3 when you are at step 1.

### 10.5 Command Palette Integration

The command palette is currently host-owned with a fixed action set. A future extension could let VM cards define custom palette actions. This is straightforward: add a `paletteActions` node that takes `{ items: [{ id, label, icon, shortcut }] }`. Defer until needed.
