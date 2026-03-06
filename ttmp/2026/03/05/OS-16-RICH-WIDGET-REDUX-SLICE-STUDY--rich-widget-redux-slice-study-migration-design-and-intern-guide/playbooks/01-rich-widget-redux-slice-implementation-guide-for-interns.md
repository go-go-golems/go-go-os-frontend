---
Title: Rich widget Redux slice implementation guide for interns
Ticket: OS-16-RICH-WIDGET-REDUX-SLICE-STUDY
Status: active
Topics:
    - frontend
    - widgets
    - storybook
    - state-management
    - architecture
DocType: playbooks
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-05T20:24:43.259450524-05:00
WhatFor: ""
WhenToUse: ""
---

# Rich widget Redux slice implementation guide for interns

This guide explains how the rich-widget package fits into the launcher store, how to decide whether a widget needs Redux at all, and how to add a slice without breaking Storybook or launcher integration.

The intended audience is a new intern who can read TypeScript and React but does not yet know how this desktop frontend is assembled.

## 1. Mental Model of the System

Start with the package boundaries:

- `packages/rich-widgets/src` contains the composite desktop widgets.
- `packages/desktop-os/src/contracts/launchableAppModule.ts:9` defines how an app module exposes reducer state to the launcher.
- `packages/desktop-os/src/store/createLauncherStore.ts:14` collects reducers from all modules into one global launcher store.
- `packages/rich-widgets/src/launcher/modules.tsx:80` is the place where a widget module declares its `manifest`, optional `state`, and `renderWindow`.
- `packages/rich-widgets/src/storybook/seededStore.tsx:1` is the current shared helper for seeded Redux stories.

### Architecture diagram

```text
Rich widget component
   |
   +--> local transient state (hover, drag ghost, timer handles, DOM-only effects)
   |
   +--> Redux slice (only if the state is durable / story-worthy / externally meaningful)
           |
           v
   LaunchableAppModule.state
           |
           v
   collectModuleReducers()
           |
           v
   createLauncherStore()
           |
           v
   global launcher store
           |
           +--> widget selectors/hooks
           +--> Storybook SeededStoreProvider
           +--> future launcher observers/badges/commands
```

## 2. What Belongs in Redux vs. Local State

Use this checklist in order.

### Keep state local when

- it only matters during a single pointer gesture;
- it is derived from DOM or canvas hover location;
- it is an animation counter or timer handle;
- it is an in-progress form draft inside a modal that has not been committed yet;
- putting it in Redux would create a stream of noisy actions with no external consumer.

Examples:
- `dragging` and temporary connection previews in `NodeEditor`
- `scanY` in `YouTubeRetro`
- EQ bar animation in `RetroMusicPlayer`
- `cursorPos` hover in `LogicAnalyzer`

### Use a seed prop or local reducer when

- the state matters for Storybook but is still completely widget-scoped;
- the widget is still heavily component-local and not yet worth wiring into the launcher store;
- the state can be reconstructed from props at mount time.

Examples:
- compact vs. fullscreen state
- selected seed data for fixture stories
- preview-only mode in `MacWrite`

### Use Redux when

- the state is the widget’s durable document or session model;
- a reopened window should come back in a recognizable state;
- the state should be inspectable from Storybook without brittle UI automation;
- other desktop features may eventually observe or react to it.

Examples:
- task entities and filters in `KanbanBoard`
- event records and selected calendar view in `MacCalendar`
- spreadsheet cells and active selection in `MacCalc`
- active video, search/category state, and user comments in `YouTubeRetro`

## 3. The Recommended Store Pattern

### Step 1: choose a unique state key

Do **not** reuse one package-wide key per widget. `collectModuleReducers()` rejects duplicate keys.

Use:

```text
app_rw_log_viewer
app_rw_kanban
app_rw_mac_calendar
app_rw_mac_calc
```

The key must match `app_${string}` from `packages/desktop-os/src/contracts/appManifest.ts:1`.

### Step 2: co-locate the slice next to the widget

Recommended file layout:

```text
packages/rich-widgets/src/<widget>/
  <Widget>.tsx
  <Widget>.stories.tsx
  <widget>Slice.ts
  selectors.ts          # optional; add once selectors grow
  types.ts
  sampleData.ts
```

### Step 3: split “document/session state” from “local transient state”

Before writing the slice, make two lists:

```text
Redux:
- entities / records
- selected durable item
- current view / active tab
- filters and searches worth preserving
- queue / playback / progress / session lifecycle

Local:
- drag ghost positions
- hover coordinates
- timer ids and requestAnimationFrame handles
- modal draft inputs until save/submit
- canvas cursor or scanline animation
```

If you cannot explain why a field belongs in Redux, leave it local for the first pass.

## 4. Migration Recipe

### 4.1 Start with a state inventory

Example: `MacCalc` in `packages/rich-widgets/src/calculator/MacCalc.tsx:27`

```text
Current reducer state:
- cells
- clipboard
- selection / range
- editing / editVal
- showFind / findQuery
- showPalette
- columnWidths

Likely Redux:
- cells
- clipboard
- selection / range
- showFind / findQuery
- showPalette
- columnWidths

Keep local:
- editVal
- active drag anchor
```

### 4.2 Define the slice state in domain language

Bad:

```ts
interface WidgetState {
  a: string | null;
  b: boolean;
  c: number[];
}
```

Good:

```ts
interface MacCalcSliceState {
  document: {
    cells: Record<string, CellData>;
    columnWidths: number[];
    clipboard: ClipboardData | null;
  };
  selection: {
    active: { r: number; c: number };
    range: CellRange | null;
  };
  ui: {
    showFind: boolean;
    findQuery: string;
    showPalette: boolean;
  };
}
```

### 4.3 Create reducers around business events, not widget plumbing

Avoid reducers like `setBooleanFlagX`.

Prefer:

```ts
selectCell({ r, c })
setSelectionRange(range)
replaceCells(changes)
openFind()
closeFind()
setFindQuery(query)
showPalette()
hidePalette()
```

### 4.4 Wire the module into the launcher store

In `packages/rich-widgets/src/launcher/modules.tsx:80`:

```ts
export const macCalcModule: LaunchableAppModule = {
  ...widget('mac-calc', 'MacCalc', '🧮', 110, 880, 600, () => <MacCalc />),
  state: {
    stateKey: 'app_rw_mac_calc',
    reducer: macCalcReducer,
  },
};
```

### 4.5 Replace local ownership incrementally

Do not rewrite the entire component at once. Move the durable state in slices one cluster at a time.

Recommended order inside a widget:

1. entities / document state
2. selected item / active view
3. filters / search
4. session progress / status
5. leave local effects and animation last

### 4.6 Update Storybook immediately

Every slice migration should end with seeded stories.

Example:

```tsx
const seedSelectedConversation: SeedStore<AppStore> = (store) => {
  store.dispatch(chatBrowserActions.selectConversation(4));
  store.dispatch(chatBrowserActions.setQuickFilter('coding'));
  store.dispatch(chatBrowserActions.openAdvancedSearch());
};

export const SearchPanelOpen: Story = {
  render: () => (
    <SeededStoreProvider createStore={createStore} seedStore={seedSelectedConversation}>
      <ChatBrowser />
    </SeededStoreProvider>
  ),
};
```

If you finish the slice but do not add seeded stories, you are leaving the payoff unrealized.

## 5. Widget-by-Widget Notes

### LogViewer

- Use Redux for entries, selected row, filters, and view prefs.
- Keep scroll-to-bottom behavior local.
- Good first migration because the current state is already close to slice-friendly.

Suggested shape:

```ts
interface LogViewerSliceState {
  entries: LogEntry[];
  filters: {
    search: string;
    levels: LogLevel[];
    service: string;
  };
  selection: {
    selectedId: number | null;
  };
  ui: {
    streaming: boolean;
    compactMode: boolean;
    wrapLines: boolean;
  };
}
```

### ChartView

- Keep local for now.
- `data` already comes from props, and the remaining state is presentation-level (`chartType`, `datasetKey`, tooltip hover).
- If this widget later gains saved dashboards or user-authored chart configs, revisit Redux then.

### MacWrite

- Keep local for now.
- The durable “document” concept exists, but there is no package-wide document model yet.
- Do not invent a half-finished Redux document just to replace `useState`.
- If a real document model is added later, make that a dedicated write-editor ticket.

### KanbanBoard

- Strong Redux candidate.
- Normalize tasks by ID and store column order explicitly.
- Keep modal draft fields local until save.

### MacRepl

- Defer full Redux.
- If we later need reproducible sessions or launcher-observable command history, move `lines`, `aliases`, and `envVars`.
- Keep autocomplete suggestion and completion cursor local.

### NodeEditor

- Strong Redux candidate for the graph document.
- `nodes`, `connections`, `selected`, and `viewport` belong in slice state.
- Drag offsets and temporary wire previews stay local.

### Oscilloscope

- Keep local for now.
- It is mostly a live instrument-control surface plus canvas effects.
- The only future Redux candidate is a saved preset/profile system.

### LogicAnalyzer

- Partial candidate.
- Channel configuration, trigger settings, protocol mode, and zoom could justify a slice later.
- Cursor position and live frame drawing remain local.

### MacCalendar

- Strong Redux candidate.
- Events, current date, current view, active edit target, and palette visibility all have clear story and persistence value.
- Modal field drafts should stay local to the modal component until committed.

### GraphNavigator

- Partial candidate.
- The query/filter/selected-node/query-log set is a good slice boundary.
- The force-layout positions and pan/drag mechanics should remain local for now.

### MacCalc

- Strong Redux candidate.
- The reducer state already describes most of the future slice.
- Keep only in-progress edit text and drag anchors local.

### DeepResearch

- Strong Redux candidate.
- Query, steps, progress, report, and session settings are exactly the kind of deterministic state Storybook wants.
- Interval handles and scroll effects stay local.

### GameFinder

- Strong Redux candidate.
- Library data, install state, selected game, view/filter/sort/search, and launch overlay all benefit from a slice.
- Install/launch timers stay in effects.

### RetroMusicPlayer

- Strong Redux candidate.
- Playlist selection, playback mode, queue visibility, view mode, search term, volume, liked tracks, and repeat/shuffle all fit naturally.
- Equalizer bar animation remains local.

### StreamLauncher

- Strong Redux candidate.
- Category, active stream, search, sort, and player state are all story-worthy.
- Thumbnail canvas animation remains local.

### SteamLauncher

- Strong Redux candidate.
- Tab, selected game, friend drawer, filters, installing map, and launching game are all durable session state.

### YouTubeRetro

- Strong Redux candidate.
- View/home vs. watch mode, selected video, search/category filters, likes/subscriptions, and user comments all fit.
- Scanline animation and playback timer loop remain local.

### ChatBrowser

- Strong Redux candidate.
- Selected conversation, quick filter, advanced search params, results, and panel visibility should move first.

### SystemModeler

- Strong Redux candidate.
- Blocks, wires, selection, open dialog target, sim settings, sim progress, and palette visibility should move.
- Live wiring previews remain local.

### ControlRoom

- Partial candidate.
- If it becomes a real control surface for shared simulation state, move switch positions, knob values, and alarm/session presets.
- Keep generated logs and scope buffers local until a real backend exists.

## 6. Common Mistakes

- **Mistake:** moving modal form drafts into Redux on day one  
  **Why it hurts:** you create noisy state and make the component harder to reason about  
  **Fix:** keep the draft local; dispatch on save

- **Mistake:** creating one mega reducer key for the whole package  
  **Why it hurts:** it fights the launcher reducer contract  
  **Fix:** give each migrated widget its own `app_rw_<widget>` key

- **Mistake:** skipping seeded stories after slice migration  
  **Why it hurts:** you lose the fastest validation path  
  **Fix:** add at least `Default`, `Empty`, and one seeded scenario that would have been impossible before

- **Mistake:** storing animation counters in Redux  
  **Why it hurts:** action spam, no persistence value  
  **Fix:** keep RAF/timer-driven values local

## 7. Suggested First Week for an Intern

Day 1:
- read `packages/desktop-os/src/contracts/launchableAppModule.ts:9`
- read `packages/desktop-os/src/store/createLauncherStore.ts:14`
- read `packages/rich-widgets/src/launcher/modules.tsx:80`
- read `packages/rich-widgets/src/storybook/seededStore.tsx:1`

Day 2:
- migrate `LogViewer`
- add seeded stories for filters + selected log row

Day 3:
- migrate `MacCalc`
- add seeded stories for find/palette/selection states

Day 4:
- migrate `MacCalendar`
- add seeded stories for month/week/editing contexts

Day 5:
- write short retrospective:
  - what belonged in Redux
  - what stayed local
  - what Storybook exposed

## 8. API Reference

- `LaunchableAppModule.state` → `packages/desktop-os/src/contracts/launchableAppModule.ts:24`
- `collectModuleReducers()` → `packages/desktop-os/src/store/createLauncherStore.ts:14`
- `createLauncherStore()` → `packages/desktop-os/src/store/createLauncherStore.ts:71`
- `selectModuleState()` → `packages/desktop-os/src/store/createLauncherStore.ts:78`
- current launcher analytics slice → `packages/rich-widgets/src/launcher/richWidgetsLauncherState.ts:1`
- Storybook seeded provider → `packages/rich-widgets/src/storybook/seededStore.tsx:1`
- Storybook frame helpers → `packages/rich-widgets/src/storybook/frameDecorators.tsx:1`

## 9. Final Rule

Do not ask “can I replace this hook with Redux?”

Ask:

```text
What is the durable state model of this widget?
Who needs to read it?
How will Storybook seed it?
What should still stay local after the durable model moves?
```

If you answer those questions first, the slice shape becomes obvious.
