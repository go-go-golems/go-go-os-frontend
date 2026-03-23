---
Title: LogViewer Widget Decomposition and DSL Port Analysis
Ticket: LOG-VIEWER-PORT
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
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/log-viewer/LogViewer.tsx:Main monolithic widget (782 lines)
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/log-viewer/types.ts:Log level types and constants
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/log-viewer/logViewerState.ts:Redux state slice
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/log-viewer/sampleData.ts:Sample log generation
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/docs/widget-dsl-porting-playbook.md:Reference porting playbook
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx:Reference pack implementation
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js:VM helper surface
ExternalSources: []
Summary: Complete decomposition analysis of the LogViewer widget for porting to the HyperCard widget DSL runtime system, following the pattern established by Kanban.
LastUpdated: 2026-03-10T09:31:03.602282165-04:00
WhatFor: Guide the implementation of the LogViewer runtime pack port
WhenToUse: Before and during LogViewer DSL port implementation
---

# LogViewer Widget Decomposition and DSL Port Analysis

## Executive Summary

This document analyzes the existing LogViewer widget (`rich-widgets/src/log-viewer/`) and designs a complete porting plan to the HyperCard widget DSL runtime system, following the Kanban reference implementation and the Widget DSL Porting Playbook.

LogViewer is a strong candidate for a runtime pack because it has a stable domain model (log entries, levels, services, filters), clear visual regions (sidebar, log table, detail panel), host-only mechanics (streaming, auto-scroll, DOM scrolling), and enough structural variation to justify composition-style DSL authoring.

## Phase 1: Does LogViewer Deserve a Pack?

### Evaluation Against Playbook Criteria

| Criterion | Answer | Notes |
|---|---|---|
| Domain-specific enough that generic `ui.*` nodes are too weak? | Yes | Log levels, entries, services, stack traces, streaming -- these are domain concepts, not generic UI |
| Stable semantic model? | Yes | LogEntry, LogLevel, filters, services, metadata fields are well-defined |
| Reusable host subareas? | Yes | Sidebar filters, log table, detail panel, toolbar, status bar, sparkline |
| Browser/DOM mechanics stay on host? | Yes | Auto-scroll, streaming interval, DOM scroll position, sparkline SVG |
| Authored examples benefit from structure? | Yes | Security log viewer vs application debug log vs audit trail -- same widget family, different configurations |

**Verdict: LogViewer qualifies for a runtime pack.**

Proposed pack ID: `logViewer.v1`

## Phase 2: Current Widget Audit

### Source Files

| File | Lines | Purpose |
|---|---|---|
| `LogViewer.tsx` | 782 | Monolithic component with 3 tiers |
| `types.ts` | 36 | LogEntry, LogLevel, level metadata |
| `logViewerState.ts` | 211 | Redux slice with 11 actions |
| `sampleData.ts` | 135 | Demo log generation |
| `LogViewer.stories.tsx` | 182 | 11 Storybook stories |
| `logViewerState.test.ts` | 63 | State management tests |
| `log-viewer.css` | 187 | Theme CSS with 16 data-parts |

**Total: ~1,596 lines across 7 files.**

### Current Architecture

The widget has a 3-tier internal structure that is already partially decomposed:

```text
LogViewer (smart wrapper -- detects Redux)
  -> ConnectedLogViewer (Redux-backed)
  -> StandaloneLogViewer (local state)
  -> LogViewerFrame (pure presentational, model+callbacks)
```

This is good -- the `LogViewerFrame` model/callback separation already resembles what a pack renderer needs. However, LogViewerFrame itself is still a single 500-line render function that mixes all three visual regions inline.

### Visual Regions

```text
+------------------+----------------------------------+------------------+
|    SIDEBAR       |          MAIN AREA               |   DETAIL PANEL   |
|  (180px fixed)   |        (flex grow)                |  (240px fixed)   |
|                  |                                  |                  |
|  Log Levels      |  [Search Bar] [count/total]      |  Level + Time    |
|    TRACE [x]  5  |  ACTIVITY: [sparkline] [range]   |  Message         |
|    DEBUG [x] 12  |                                  |  Fields:         |
|    INFO  [x] 45  |  Lv | Time     | Svc    | Msg    |    Service       |
|    WARN  [x] 18  |  -- | -------- | ------ | ----   |    Request ID    |
|    ERROR [x]  8  |  i  | 14:32:01 | api-gw | ...    |    PID           |
|    FATAL [x]  2  |  w  | 14:32:02 | auth   | ...    |    Host          |
|                  |  E  | 14:32:03 | db     | ...    |    Region        |
|  Services        |  ...                             |    Version       |
|    All services  |                                  |  Stack Trace     |
|    api-gateway   |                                  |  [Copy] [Find]   |
|    auth-service  |  [status bar]                    |                  |
|    db-primary    |                                  |                  |
|                  |                                  |  (or placeholder |
|  [Stream] [Opts] |                                  |   when nothing   |
|  [Clear & Reset] |                                  |   is selected)   |
+------------------+----------------------------------+------------------+
```

### Feature Inventory

```text
Feature                          Belongs Where
-------------------------------  ------------------------------------------
LogEntry types & level defs      Layer 1 - domain model
Log filtering logic              Layer 1 - domain model
Sparkline data bucketing         Layer 1 - domain model (pure computation)
Level counts computation         Layer 1 - domain model
Service discovery                Layer 1 - domain model
Log entry serialization          Layer 1 - domain model
Sample data generation           Layer 1 - domain model (demo support)
Sidebar filter UI                Layer 2 - host primitive
Log table with rows              Layer 2 - host primitive
Detail panel                     Layer 2 - host primitive
Toolbar (search + activity)      Layer 2 - host primitive
Status bar                       Layer 2 - host primitive (already exists)
Sparkline SVG                    Layer 2 - host primitive (already exists)
Auto-scroll DOM behavior         Layer 2 - host only
Streaming interval timer         Layer 2 - host only
Row selection highlighting       Layer 2 - host only
Scroll position tracking         Layer 2 - host only
DSL nodes                        Layer 3 - pack
VM demo cards                    Layer 4 - authored examples
```

## Phase 3: Domain State Extraction

### Current State Shape

The existing `logViewerState.ts` already has a clean serializable state:

```typescript
interface LogViewerState {
  initialized: boolean;
  baselineEntries: StoredLogEntry[];
  entries: StoredLogEntry[];
  search: string;
  levels: LogLevel[];
  serviceFilter: string;
  selectedId: number | null;
  autoScroll: boolean;
  streaming: boolean;
  compactMode: boolean;
  wrapLines: boolean;
}
```

### What Needs To Change For The DSL

The state is already mostly good. Key observations:

1. **`entries` and `baselineEntries`** are host-side storage concerns. The VM should see `state.logs` or `state.app_logviewer.entries`, not worry about baseline vs live.

2. **`levels` as an array** is fine -- the VM provides the level configuration, the host manages the toggling.

3. **`streaming` and `autoScroll`** are host-only view behaviors. The VM can configure whether streaming is *available* but the actual timer and scroll tracking stay host-side.

4. **`compactMode` and `wrapLines`** are view preferences. The VM can set defaults; the host manages toggles.

### Proposed Semantic State for VM Cards

```typescript
// What the VM sees in state
interface LogViewerSemanticState {
  logs: LogEntry[];           // the current log entries
  filters: {
    search: string;
    levels: LogLevel[];       // which levels are enabled
    service: string;          // "All" or specific
  };
  selectedId: number | null;
  streaming: boolean;
  viewOptions: {
    autoScroll: boolean;
    compactMode: boolean;
    wrapLines: boolean;
  };
}
```

### Actions the VM Can Dispatch

```text
Action                  Payload                   Notes
----------------------  ------------------------  ---------------------------------
search                  { query: string }         Update search filter
setLevelFilter          { level, enabled }        Toggle a single level
setServiceFilter        { service: string }       Set service filter
clearFilters            {}                        Reset all filters
selectEntry             { id: number | null }     Select/deselect log entry
toggleStreaming          {}                        Start/stop stream
setViewOption           { key, value }            Toggle compact/wrap/autoscroll
reset                   {}                        Clear to baseline
appendEntry             { entry: LogEntry }       Add new log (from streaming)
```

### Domain Types (Already Clean)

The existing `types.ts` is well-factored:

```typescript
type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogEntry {
  id: number;
  timestamp: Date;
  level: LogLevel;
  service: string;
  message: string;
  requestId: string;
  pid: number;
  stackTrace: string | null;
  metadata: {
    host: string;
    region: string;
    version: string;
  };
}
```

This is already descriptor-compatible. Unlike Kanban (which needed taxonomy refactoring from fixed unions to descriptors), LogViewer's types are stable and ready.

## Phase 4: Host Primitive Decomposition

### Current State

LogViewer is currently one monolithic `LogViewerFrame` function (lines 78-579 in LogViewer.tsx). Everything is rendered inline. It needs to be split into focused host primitives.

### Design Rationale for Granularity

The original analysis proposed 5 coarse primitives (Sidebar, Toolbar, Table, DetailPanel, StatusBar). On review, several of those are still too broad -- they bundle multiple distinct concerns into one component, which creates oversized prop interfaces and limits structural variation between cards.

The revised decomposition follows the playbook's granularity rule: "split when authors should be able to include, omit, or reorder a concept."

### Proposed Host Primitives

#### Sidebar Region (3 primitives)

The sidebar has three distinct concerns: level filtering, service filtering, and view controls. A security audit card might omit service filters (single-service). A read-only viewer might omit controls entirely. These should be independently authorable.

##### 1. LogViewerLevelFilters

**Purpose:** Checkbox list of log levels with per-level counts.

**Props:**
```typescript
interface LogViewerLevelFiltersProps {
  levels: ReadonlySet<LogLevel>;
  levelCounts: Record<LogLevel, number>;
  onToggleLevel: (level: LogLevel) => void;
}
```

**Extracts from:** Lines 214-242 of LogViewer.tsx (the "Log Levels" filter group).

##### 2. LogViewerServiceFilters

**Purpose:** Selectable service list with active indicator.

**Props:**
```typescript
interface LogViewerServiceFiltersProps {
  services: string[];
  serviceFilter: string;
  onSetServiceFilter: (service: string) => void;
}
```

**Extracts from:** Lines 245-267 (the "Services" filter group).

##### 3. LogViewerControls

**Purpose:** Streaming toggle, view option checkboxes, reset button.

**Props:**
```typescript
interface LogViewerControlsProps {
  streaming: boolean;
  autoScroll: boolean;
  compactMode: boolean;
  wrapLines: boolean;
  onToggleStreaming: () => void;
  onSetAutoScroll: (value: boolean) => void;
  onSetCompactMode: (value: boolean) => void;
  onSetWrapLines: (value: boolean) => void;
  onReset: () => void;
}
```

**Extracts from:** Lines 269-307 (the controls area).

#### Toolbar Region (2 primitives)

The toolbar mixes search (interactive, almost always present) with activity display (informational, sometimes omittable). Splitting them lets a minimal card use search without the sparkline.

##### 4. LogViewerSearch

**Purpose:** Search input with filtered/total count display and clear button.

**Props:**
```typescript
interface LogViewerSearchProps {
  search: string;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}
```

**Extracts from:** Lines 311-338 (the search input row).

##### 5. LogViewerActivity

**Purpose:** Sparkline visualization with time range label.

**Props:**
```typescript
interface LogViewerActivityProps {
  sparkData: number[];
  timeRange: { start: Date; end: Date } | null;
}
```

**Extracts from:** Lines 339-352 (the activity row).

**Note:** Uses the existing shared `Sparkline` primitive internally. The sparkline itself stays host-only -- the DSL passes data as `number[]` and the host picks the visualization. If a future pack also needs sparklines, we can promote `Sparkline` to a cross-pack DSL primitive then, but for now it stays a host rendering detail.

#### Main Content (1 primitive)

##### 6. LogViewerTable

**Purpose:** The scrollable log table with header row and log entry rows.

**Props:**
```typescript
interface LogViewerTableProps {
  entries: LogEntry[];
  selectedId: number | null;
  compactMode: boolean;
  wrapLines: boolean;
  autoScroll: boolean;
  onSelectEntry: (id: number | null) => void;
  onAutoScrollChange: (value: boolean) => void;
}
```

**Extracts from:** Lines 355-425 (table header + scrollable row list + empty state).

**Host-only mechanics retained:**
- `useRef` for scroll container
- Auto-scroll effect
- Scroll position tracking for auto-scroll disable
- Row state coloring (selected/error/warning)
- Level emoji rendering
- Timestamp formatting

#### Detail Region (3 primitives)

The detail panel has a host-owned header (level badge + timestamp, derived from the selected entry) and stack trace section, but the metadata fields and action buttons vary by card type. A debug console shows Service/RequestID/PID/Host/Region/Version. A security audit shows User/IP/Action/Policy/Result. The fields and actions should be card-authorable.

##### 7. LogViewerDetailPanel

**Purpose:** Container for detail view of a selected log entry. Shows header (level + timestamp) and stack trace automatically from the entry. Takes field and action children.

**Props:**
```typescript
interface LogViewerDetailPanelProps {
  entry: LogEntry | null;
  children?: React.ReactNode;  // receives rendered detailFields and detailActions
}
```

**Extracts from:** Lines 444-577 (the detail `div`). The header area (lines 447-466), message area (lines 468-489), and stack trace area (lines 525-541) stay host-owned. The fields and actions areas become child slots.

##### 8. LogViewerDetailFields

**Purpose:** Configurable metadata field list for the detail panel.

**Props:**
```typescript
interface LogViewerDetailFieldsProps {
  fields: Array<{ label: string; value: string }>;
}
```

**Extracts from:** Lines 491-523 (the "Fields" section). Currently hardcoded to 6 fields; this makes it card-authorable.

##### 9. LogViewerDetailActions

**Purpose:** Configurable action buttons for the detail panel.

**Props:**
```typescript
interface LogViewerDetailActionsProps {
  actions: Array<{ label: string; onAction: () => void }>;
}
```

**Extracts from:** Lines 543-553 (the action buttons). Currently hardcoded to "Copy JSON" and "Find Similar"; this makes it card-authorable.

#### Status (1 primitive, unchanged)

##### 10. LogViewerStatusBar

**Purpose:** Bottom status bar showing filter state and streaming indicator.

**Props:**
```typescript
interface LogViewerStatusBarProps {
  metrics: Array<{ label: string; value: string | number }>;
  streaming: boolean;
  autoScroll: boolean;
}
```

**Extracts from:** Lines 427-440 (WidgetStatusBar usage). Wraps the existing `WidgetStatusBar` primitive.

### Primitives Already Available (Reuse)

These already exist in `rich-widgets/src/primitives/` and do not need extraction:

- `WidgetToolbar` -- container shell for toolbar content
- `WidgetStatusBar` -- container shell for status bar content
- `Sparkline` -- SVG bar chart (used internally by LogViewerActivity)

### Storybook Requirements Per Primitive

Each new primitive needs stories proving:

| Primitive | Required Stories |
|---|---|
| LogViewerLevelFilters | All levels on, Some levels off, Empty (zero counts) |
| LogViewerServiceFilters | Many services, Single service, All selected |
| LogViewerControls | All options off, Streaming active, All options on |
| LogViewerSearch | No search, Active search with results, Zero results |
| LogViewerActivity | Dense sparkline, Flat sparkline, No data |
| LogViewerTable | Empty, Few entries, Many entries (1000+), With selection, Compact mode, Wrap mode, Mixed levels |
| LogViewerDetailPanel | No selection (placeholder), INFO entry, ERROR with stack trace, FATAL with full metadata |
| LogViewerDetailFields | Standard 6 fields, Custom security fields, Minimal 2 fields |
| LogViewerDetailActions | Default actions, Custom actions, No actions |
| LogViewerStatusBar | Default, Streaming, Auto-scroll, Custom metrics |

## Phase 5: DSL Node Design

### Design Principles (From Playbook)

- Speak domain concepts, not host widget names
- Composition style (multiple children to page), not one mega config object
- Optional areas must be explicit
- Host-only mechanics (scroll, streaming timer, DOM) stay invisible to DSL

### Proposed Node Set

```text
logViewer.page           -- root composition node, takes children
logViewer.sidebar        -- left panel container (takes filter/control children)
logViewer.levelFilters   -- log level checkbox group with counts
logViewer.serviceFilters -- service list with active selection
logViewer.controls       -- streaming toggle, view option checkboxes, reset
logViewer.toolbar        -- top bar container (takes search/activity children)
logViewer.search         -- search input with count display
logViewer.activity       -- sparkline and time range display
logViewer.table          -- main log table
logViewer.detail         -- right panel container (takes fields/actions children)
logViewer.detailFields   -- configurable metadata field list
logViewer.detailActions  -- configurable action buttons
logViewer.status         -- bottom status bar
```

Thirteen nodes. More than Kanban's seven, but each enables a meaningful structural variation between cards. The extra nodes are all composition children -- they do not add depth, just finer authoring control within the same two-level structure.

### Node Specifications

#### `logViewer.page(...children)`

Root composition node. Accepts other logViewer nodes as children.

```javascript
widgets.logViewer.page(
  widgets.logViewer.sidebar(
    widgets.logViewer.levelFilters({...}),
    widgets.logViewer.serviceFilters({...}),
    widgets.logViewer.controls({...}),
  ),
  widgets.logViewer.toolbar(
    widgets.logViewer.search({...}),
    widgets.logViewer.activity({...}),
  ),
  widgets.logViewer.table({...}),
  widgets.logViewer.detail(
    widgets.logViewer.detailFields({...}),
    widgets.logViewer.detailActions({...}),
  ),
  widgets.logViewer.status({...}),
)
```

**Emitted node:**
```json
{ "kind": "logViewer.page", "children": [...] }
```

#### `logViewer.sidebar(...children)`

Layout container for the left panel. Accepts `levelFilters`, `serviceFilters`, and `controls` as children.

```javascript
widgets.logViewer.sidebar(
  widgets.logViewer.levelFilters({...}),
  widgets.logViewer.serviceFilters({...}),
  widgets.logViewer.controls({...}),
)
```

**Emitted node:**
```json
{ "kind": "logViewer.sidebar", "children": [...] }
```

A minimal card could include only `levelFilters` and omit both `serviceFilters` and `controls`.

#### `logViewer.levelFilters(props)`

Configures the log level checkbox group.

**Props:**
```javascript
{
  levels: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
  levelCounts: { TRACE: 5, DEBUG: 12, INFO: 45, WARN: 18, ERROR: 8, FATAL: 2 },
  onToggleLevel: { handler: 'toggleLevel' },
}
```

A security audit card might restrict to `levels: ['WARN', 'ERROR', 'FATAL']`.

#### `logViewer.serviceFilters(props)`

Configures the service filter list.

**Props:**
```javascript
{
  services: ['api-gateway', 'auth-service', 'db-primary'],
  serviceFilter: state.filters.service,
  onSetServiceFilter: { handler: 'setServiceFilter' },
}
```

Can be omitted entirely for a single-service viewer.

#### `logViewer.controls(props)`

Configures streaming, view options, and reset.

**Props:**
```javascript
{
  streaming: state.streaming,
  autoScroll: state.viewOptions.autoScroll,
  compactMode: state.viewOptions.compactMode,
  wrapLines: state.viewOptions.wrapLines,
  onToggleStreaming: { handler: 'toggleStreaming' },
  onSetAutoScroll: { handler: 'setAutoScroll' },
  onSetCompactMode: { handler: 'setCompactMode' },
  onSetWrapLines: { handler: 'setWrapLines' },
  onReset: { handler: 'reset' },
}
```

Can be omitted for a read-only log view with no user-controlled options.

#### `logViewer.toolbar(...children)`

Layout container for the top bar. Accepts `search` and `activity` as children.

```javascript
widgets.logViewer.toolbar(
  widgets.logViewer.search({...}),
  widgets.logViewer.activity({...}),
)
```

A minimal card could include only `search` without the sparkline activity display.

#### `logViewer.search(props)`

Configures the search input with filter count display.

**Props:**
```javascript
{
  query: state.filters.search,
  filteredCount: filteredCount,
  totalCount: totalCount,
  onSearchChange: { handler: 'search' },
  onClear: { handler: 'clearSearch' },
}
```

#### `logViewer.activity(props)`

Configures the sparkline and time range display.

**Props:**
```javascript
{
  sparkData: sparkBuckets,
  timeRange: { start: firstTimestamp, end: lastTimestamp },
}
```

Purely informational. The sparkline SVG rendering is host-only. The VM passes bucketed data as `number[]`; the host chooses the visualization. No handler refs -- this is display-only.

#### `logViewer.table(props)`

Configures the main log table.

**Props:**
```javascript
{
  selectedId: state.selectedId,
  onSelectEntry: { handler: 'selectEntry' },
}
```

**Note:** `entries` are deliberately absent. The host reads entries and filter configuration from semantic state and computes the filtered view internally (see Phase 9). `autoScroll`, `compactMode`, and `wrapLines` are also host-managed -- the host reads these from semantic state set via the `controls` node.

#### `logViewer.detail(...children)`

Container for the right detail panel. The host renders the entry header (level badge + timestamp), message, and stack trace automatically from the selected entry. Takes `detailFields` and `detailActions` as children.

**Props:**
```javascript
{
  entry: selectedEntry,  // or null for placeholder
}
```

**Omission:** If the detail node is absent from the page children, the host renders a two-column layout (sidebar + table only). This is a structural variation that the composition style enables naturally.

#### `logViewer.detailFields(props)`

Configures which metadata fields appear in the detail panel.

**Props:**
```javascript
{
  fields: [
    { label: 'Service', value: entry.service },
    { label: 'Request ID', value: entry.requestId },
    { label: 'PID', value: String(entry.pid) },
    { label: 'Host', value: entry.metadata.host },
    { label: 'Region', value: entry.metadata.region },
    { label: 'Version', value: entry.metadata.version },
  ],
}
```

This is where real card variation happens. A security audit card might show:
```javascript
{
  fields: [
    { label: 'User', value: entry.metadata.user },
    { label: 'IP', value: entry.metadata.sourceIp },
    { label: 'Action', value: entry.metadata.action },
    { label: 'Policy', value: entry.metadata.policy },
  ],
}
```

#### `logViewer.detailActions(props)`

Configures action buttons in the detail panel.

**Props:**
```javascript
{
  actions: [
    { label: 'Copy JSON', onAction: { handler: 'copyJson' } },
    { label: 'Find Similar', onAction: { handler: 'findSimilar' } },
  ],
}
```

Card-authorable. A monitoring card might have `Escalate` and `Create Incident`. An audit card might have `Export` and `Flag for Review`.

#### `logViewer.status(props)`

Configures the bottom status bar.

**Props:**
```javascript
{
  metrics: [
    { label: 'shown', value: filteredCount },
    { label: 'service', value: serviceFilter },
    { label: 'levels', value: activeLevels.join(', ') },
  ],
  streaming: state.streaming,
  autoScroll: state.viewOptions.autoScroll,
}
```

### What The Host Owns (Not In DSL)

These stay purely host-side:

- DOM scroll position and auto-scroll behavior
- Streaming `setInterval` timer management
- Row hover/selection CSS state transitions
- Sparkline SVG rendering (host chooses visualization from `number[]` data)
- Empty state placeholder display
- Stack trace `<pre>` formatting
- Level emoji rendering
- Timestamp formatting (`fmtTime`, `fmtDate`)
- Log filtering computation (see Phase 9)
- Level count aggregation
- Service discovery from entries

## Phase 6: VM Helper Surface

### `stack-bootstrap.vm.js` Additions

```javascript
const __logViewerWidgets = {
  // Container nodes (take children)
  page(...children) {
    return { kind: 'logViewer.page', children: children.flat().filter(Boolean) };
  },
  sidebar(...children) {
    return { kind: 'logViewer.sidebar', children: children.flat().filter(Boolean) };
  },
  toolbar(...children) {
    return { kind: 'logViewer.toolbar', children: children.flat().filter(Boolean) };
  },
  detail(...args) {
    // detail takes optional props object as first arg, then children
    const hasProps = args.length > 0 && args[0] && typeof args[0] === 'object' && !args[0].kind;
    const props = hasProps ? safeObject(args[0]) : {};
    const children = (hasProps ? args.slice(1) : args).flat().filter(Boolean);
    return { kind: 'logViewer.detail', props, children };
  },

  // Leaf nodes (take props only)
  levelFilters(props = {}) {
    return { kind: 'logViewer.levelFilters', props: safeObject(props) };
  },
  serviceFilters(props = {}) {
    return { kind: 'logViewer.serviceFilters', props: safeObject(props) };
  },
  controls(props = {}) {
    return { kind: 'logViewer.controls', props: safeObject(props) };
  },
  search(props = {}) {
    return { kind: 'logViewer.search', props: safeObject(props) };
  },
  activity(props = {}) {
    return { kind: 'logViewer.activity', props: safeObject(props) };
  },
  table(props = {}) {
    return { kind: 'logViewer.table', props: safeObject(props) };
  },
  detailFields(props = {}) {
    return { kind: 'logViewer.detailFields', props: safeObject(props) };
  },
  detailActions(props = {}) {
    return { kind: 'logViewer.detailActions', props: safeObject(props) };
  },
  status(props = {}) {
    return { kind: 'logViewer.status', props: safeObject(props) };
  },
};

// In createPackHelpers:
if (packId === 'logViewer.v1') {
  return { widgets: { logViewer: __logViewerWidgets } };
}
```

### Standard Handler Helpers

Following the Kanban pattern of shared handler utilities:

```javascript
function logViewerHandlers(logsAccessor) {
  return {
    search({ args }) {
      // Update search filter
    },
    toggleLevel({ args }) {
      // Toggle level visibility
    },
    setServiceFilter({ args }) {
      // Set service filter
    },
    clearFilters() {
      // Reset all filters
    },
    selectEntry({ args }) {
      // Select/deselect entry
    },
    toggleStreaming() {
      // Toggle streaming state
    },
    setAutoScroll({ args }) {
      // Update auto-scroll preference
    },
    setCompactMode({ args }) {
      // Update compact mode
    },
    setWrapLines({ args }) {
      // Update wrap lines
    },
    reset() {
      // Reset to baseline
    },
  };
}
```

## Phase 7: Pack Validator and Renderer

### Validator (`logViewerV1Pack.tsx`)

```typescript
// Node type guards -- one per node kind
function assertLogViewerPage(value: unknown, path: string): asserts value is LogViewerPageNode { ... }
function assertLogViewerSidebar(value: unknown, path: string): asserts value is LogViewerSidebarNode { ... }
function assertLogViewerLevelFilters(value: unknown, path: string): asserts value is LogViewerLevelFiltersNode { ... }
function assertLogViewerServiceFilters(value: unknown, path: string): asserts value is LogViewerServiceFiltersNode { ... }
function assertLogViewerControls(value: unknown, path: string): asserts value is LogViewerControlsNode { ... }
function assertLogViewerToolbar(value: unknown, path: string): asserts value is LogViewerToolbarNode { ... }
function assertLogViewerSearch(value: unknown, path: string): asserts value is LogViewerSearchNode { ... }
function assertLogViewerActivity(value: unknown, path: string): asserts value is LogViewerActivityNode { ... }
function assertLogViewerTable(value: unknown, path: string): asserts value is LogViewerTableNode { ... }
function assertLogViewerDetail(value: unknown, path: string): asserts value is LogViewerDetailNode { ... }
function assertLogViewerDetailFields(value: unknown, path: string): asserts value is LogViewerDetailFieldsNode { ... }
function assertLogViewerDetailActions(value: unknown, path: string): asserts value is LogViewerDetailActionsNode { ... }
function assertLogViewerStatus(value: unknown, path: string): asserts value is LogViewerStatusNode { ... }
```

### Validator Rules

Container nodes validate their children's kinds:
- `page` accepts: `sidebar`, `toolbar`, `table`, `detail`, `status`
- `sidebar` accepts: `levelFilters`, `serviceFilters`, `controls`
- `toolbar` accepts: `search`, `activity`
- `detail` accepts: `detailFields`, `detailActions`

Required vs optional:
- `page` requires at least `table` (the minimal useful log viewer)
- `sidebar`, `toolbar`, `detail`, `status` are all optional at the page level
- Within `sidebar`: `levelFilters` is required, `serviceFilters` and `controls` are optional
- Within `toolbar`: `search` is required, `activity` is optional
- Within `detail`: both `detailFields` and `detailActions` are optional

### Renderer

```typescript
function renderLogViewerTree(tree: LogViewerPageNode, runtime: RuntimeContext) {
  const sidebar = findChild(tree, 'logViewer.sidebar');
  const toolbar = findChild(tree, 'logViewer.toolbar');
  const table = findChild(tree, 'logViewer.table');
  const detail = findChild(tree, 'logViewer.detail');
  const status = findChild(tree, 'logViewer.status');

  return (
    <LogViewerPageShell hasDetail={!!detail}>
      {sidebar && renderSidebar(sidebar, runtime)}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {toolbar && renderToolbar(toolbar, runtime)}
        {table && <LogViewerTable {...mapTableProps(table, runtime)} />}
        {status && <LogViewerStatusBar {...mapStatusProps(status, runtime)} />}
      </div>
      {detail && renderDetail(detail, runtime)}
    </LogViewerPageShell>
  );
}

function renderSidebar(node: LogViewerSidebarNode, runtime: RuntimeContext) {
  const levels = findChild(node, 'logViewer.levelFilters');
  const services = findChild(node, 'logViewer.serviceFilters');
  const controls = findChild(node, 'logViewer.controls');
  return (
    <div data-part="lv-sidebar">
      {levels && <LogViewerLevelFilters {...mapLevelFiltersProps(levels, runtime)} />}
      {services && <LogViewerServiceFilters {...mapServiceFiltersProps(services, runtime)} />}
      {controls && <LogViewerControls {...mapControlsProps(controls, runtime)} />}
    </div>
  );
}

function renderToolbar(node: LogViewerToolbarNode, runtime: RuntimeContext) {
  const search = findChild(node, 'logViewer.search');
  const activity = findChild(node, 'logViewer.activity');
  return (
    <WidgetToolbar>
      {search && <LogViewerSearch {...mapSearchProps(search, runtime)} />}
      {activity && <LogViewerActivity {...mapActivityProps(activity)} />}
    </WidgetToolbar>
  );
}

function renderDetail(node: LogViewerDetailNode, runtime: RuntimeContext) {
  const fields = findChild(node, 'logViewer.detailFields');
  const actions = findChild(node, 'logViewer.detailActions');
  return (
    <LogViewerDetailPanel entry={mapEntry(node.props.entry)}>
      {fields && <LogViewerDetailFields {...mapDetailFieldsProps(fields)} />}
      {actions && <LogViewerDetailActions {...mapDetailActionsProps(actions, runtime)} />}
    </LogViewerDetailPanel>
  );
}
```

### Key Renderer Responsibilities

1. **Wire handler refs to runtime events.** Every `{ handler: 'name' }` prop becomes `() => runtime.onEvent('name', args)`.
2. **Manage host-only state.** Auto-scroll tracking, streaming timer, scroll position -- all managed internally by host primitives.
3. **Compute derived data.** Sparkline bucketing, level counts, filtered entries, service discovery -- these can be computed host-side from the raw entries to keep the VM card simpler.
4. **Optional children at both levels.** Page-level: if `detail` is absent, render two-column layout. Container-level: if `serviceFilters` is absent within `sidebar`, skip that group. The renderer handles omissions gracefully at every nesting level.
5. **Layout adaptation.** `LogViewerPageShell` takes a `hasDetail` flag to switch between two-column and three-column CSS grid.

## Phase 8: Example VM Cards

### Card 1: Application Debug Console

Full-featured log viewer with all regions, all controls, standard metadata fields.

```javascript
defineCard(
  'logViewerAppDebug',
  ({ widgets }) => ({
    render({ state }) {
      const lv = widgets.logViewer;
      const logs = state.app_logviewer;
      const selected = findById(logs.entries, logs.selectedId);

      return lv.page(
        lv.sidebar(
          lv.levelFilters({
            levels: ALL_LEVELS,
            levelCounts: countByLevel(logs.entries),
            onToggleLevel: { handler: 'toggleLevel' },
          }),
          lv.serviceFilters({
            services: discoverServices(logs.entries),
            serviceFilter: logs.filters.service,
            onSetServiceFilter: { handler: 'setServiceFilter' },
          }),
          lv.controls({
            streaming: logs.streaming,
            autoScroll: logs.viewOptions.autoScroll,
            compactMode: logs.viewOptions.compactMode,
            wrapLines: logs.viewOptions.wrapLines,
            onToggleStreaming: { handler: 'toggleStreaming' },
            onSetAutoScroll: { handler: 'setAutoScroll' },
            onSetCompactMode: { handler: 'setCompactMode' },
            onSetWrapLines: { handler: 'setWrapLines' },
            onReset: { handler: 'reset' },
          }),
        ),
        lv.toolbar(
          lv.search({
            query: logs.filters.search,
            onSearchChange: { handler: 'search' },
            onClear: { handler: 'clearSearch' },
          }),
          lv.activity({
            sparkData: bucketize(logs.entries, 30),
          }),
        ),
        lv.table({
          selectedId: logs.selectedId,
          onSelectEntry: { handler: 'selectEntry' },
        }),
        selected && lv.detail(
          { entry: selected },
          lv.detailFields({
            fields: [
              { label: 'Service', value: selected.service },
              { label: 'Request ID', value: selected.requestId },
              { label: 'PID', value: String(selected.pid) },
              { label: 'Host', value: selected.metadata.host },
              { label: 'Region', value: selected.metadata.region },
              { label: 'Version', value: selected.metadata.version },
            ],
          }),
          lv.detailActions({
            actions: [
              { label: 'Copy JSON', onAction: { handler: 'copyJson' } },
              { label: 'Find Similar', onAction: { handler: 'findSimilar' } },
            ],
          }),
        ),
        lv.status({
          metrics: [
            { label: 'service', value: logs.filters.service },
          ],
          streaming: logs.streaming,
        }),
      );
    },
    handlers: logViewerHandlers(logsById('logViewerAppDebug')),
  }),
  'logViewer.v1',
);
```

### Card 2: Security Audit Log (No Streaming, No Detail, Restricted Levels)

A simpler variant that omits the detail panel, controls, and service filters. Only WARN/ERROR/FATAL levels are shown. This proves structural flexibility -- both at the page level (no `detail`) and within `sidebar` (no `serviceFilters`, no `controls`).

```javascript
defineCard(
  'logViewerSecurityAudit',
  ({ widgets }) => ({
    render({ state }) {
      const lv = widgets.logViewer;
      const logs = state.app_security_audit;

      return lv.page(
        lv.sidebar(
          lv.levelFilters({
            levels: ['WARN', 'ERROR', 'FATAL'],
            levelCounts: countByLevel(logs.entries),
            onToggleLevel: { handler: 'toggleLevel' },
          }),
          // No serviceFilters -- single-service viewer
          // No controls -- read-only, no streaming
        ),
        lv.toolbar(
          lv.search({
            query: logs.filters.search,
            onSearchChange: { handler: 'search' },
            onClear: { handler: 'clearSearch' },
          }),
          // No activity sparkline -- not needed for audit
        ),
        lv.table({
          selectedId: null,
          onSelectEntry: { handler: 'selectEntry' },
        }),
        // No detail panel -- two-column layout
        lv.status({
          metrics: [
            { label: 'threats', value: countLevel(logs.entries, 'FATAL') },
            { label: 'warnings', value: countLevel(logs.entries, 'WARN') },
          ],
        }),
      );
    },
    handlers: logViewerHandlers(logsById('logViewerSecurityAudit')),
  }),
  'logViewer.v1',
);
```

### Card 3: Compact Stream Monitor

A dense monitoring view with streaming enabled, compact defaults, sparkline activity, and custom detail fields and actions. Demonstrates full composition depth with domain-specific detail panel content.

```javascript
defineCard(
  'logViewerStreamMonitor',
  ({ widgets }) => ({
    render({ state }) {
      const lv = widgets.logViewer;
      const logs = state.app_stream_monitor;
      const selected = findById(logs.entries, logs.selectedId);

      return lv.page(
        lv.sidebar(
          lv.levelFilters({
            levels: ALL_LEVELS,
            levelCounts: countByLevel(logs.entries),
            onToggleLevel: { handler: 'toggleLevel' },
          }),
          lv.serviceFilters({
            services: discoverServices(logs.entries),
            serviceFilter: logs.filters.service,
            onSetServiceFilter: { handler: 'setServiceFilter' },
          }),
          lv.controls({
            streaming: true,
            autoScroll: true,
            compactMode: true,
            wrapLines: false,
            onToggleStreaming: { handler: 'toggleStreaming' },
            onSetAutoScroll: { handler: 'setAutoScroll' },
            onSetCompactMode: { handler: 'setCompactMode' },
            onSetWrapLines: { handler: 'setWrapLines' },
            onReset: { handler: 'reset' },
          }),
        ),
        lv.toolbar(
          lv.search({
            query: logs.filters.search,
            onSearchChange: { handler: 'search' },
            onClear: { handler: 'clearSearch' },
          }),
          lv.activity({
            sparkData: bucketize(logs.entries, 30),
          }),
        ),
        lv.table({
          selectedId: logs.selectedId,
          onSelectEntry: { handler: 'selectEntry' },
        }),
        selected && lv.detail(
          { entry: selected },
          lv.detailFields({
            fields: [
              { label: 'Service', value: selected.service },
              { label: 'Host', value: selected.metadata.host },
              { label: 'Region', value: selected.metadata.region },
            ],
          }),
          lv.detailActions({
            actions: [
              { label: 'Escalate', onAction: { handler: 'escalate' } },
              { label: 'Create Incident', onAction: { handler: 'createIncident' } },
            ],
          }),
        ),
        lv.status({
          metrics: [
            { label: 'eps', value: computeEps(logs.entries) },
            { label: 'errors/min', value: computeErrorRate(logs.entries) },
            { label: 'services', value: discoverServices(logs.entries).length },
          ],
          streaming: logs.streaming,
          autoScroll: logs.viewOptions.autoScroll,
        }),
      );
    },
    handlers: logViewerHandlers(logsById('logViewerStreamMonitor')),
  }),
  'logViewer.v1',
);
```

### Structural Variation Summary

The three cards demonstrate that the refined node set enables real compositional differences:

| Feature | AppDebug | SecurityAudit | StreamMonitor |
|---|---|---|---|
| `levelFilters` | All 6 levels | 3 levels only | All 6 levels |
| `serviceFilters` | Yes | Omitted | Yes |
| `controls` | Yes | Omitted | Yes |
| `search` | Yes | Yes | Yes |
| `activity` (sparkline) | Yes | Omitted | Yes |
| `detail` | Yes | Omitted | Yes |
| `detailFields` | 6 standard fields | N/A | 3 ops fields |
| `detailActions` | Copy/Find | N/A | Escalate/Incident |
| `status` metrics | service | threats/warnings | eps/errors/services |

## Phase 9: Where Computation Lives

### Critical Design Decision: Who Filters?

The Kanban pack pushes most computation to the VM card (the card builds its column/task structure). But LogViewer has a tension: filtering thousands of log entries in QuickJS could be slow.

**Recommended approach:** Hybrid.

- **VM provides:** filter configuration (which levels, which service, search query)
- **Host computes:** filtered entries, sparkline data, level counts, service discovery
- **VM sees:** the filter config and total/filtered counts, but does not iterate entries

This means the `logViewer.table` node receives `entries` as the *full* log set, and the host renderer applies the filters internally. The VM only passes filter state through the sidebar and toolbar nodes.

**Alternative considered:** VM does filtering. Rejected because:
- QuickJS filtering 10,000+ entries per render cycle is expensive
- The host already has optimized memoization (`useMemo`)
- Filter state is already semantic (levels, service, search) -- the VM does not need to see filtered results to compose the UI

### Revised Table Node (Host-Filtered)

```javascript
widgets.logViewer.table({
  // No `entries` prop -- host reads from semantic state directly
  selectedId: state.selectedId,
  onSelectEntry: { handler: 'selectEntry' },
})
```

The host renderer reads `state.logs` and `state.filters` from semantic state and computes the filtered view internally. This keeps the VM card simpler and avoids serializing large arrays through the boundary.

## Phase 10: Implementation Sequence

### Step 1: Extract Host Primitives (Layer 2)

Sidebar region:
1. Create `LogViewerLevelFilters.tsx`
2. Create `LogViewerServiceFilters.tsx`
3. Create `LogViewerControls.tsx`

Toolbar region:
4. Create `LogViewerSearch.tsx`
5. Create `LogViewerActivity.tsx` (uses shared Sparkline internally)

Main content:
6. Create `LogViewerTable.tsx`

Detail region:
7. Create `LogViewerDetailPanel.tsx` (container with header/message/stack trace)
8. Create `LogViewerDetailFields.tsx`
9. Create `LogViewerDetailActions.tsx`

Status:
10. Create `LogViewerStatusBar.tsx` (wraps shared WidgetStatusBar)

Assembly:
11. Refactor `LogViewerFrame` to compose these 10 primitives
12. Verify all existing Storybook stories still pass

### Step 2: Add Primitive Stories

One story file per primitive, covering the cases listed in Phase 4.

### Step 3: Add VM Helpers (Layer 3 - Bootstrap)

Add `logViewer` helpers to `stack-bootstrap.vm.js`.

### Step 4: Implement Pack (Layer 3 - Renderer)

Create `logViewerV1Pack.tsx` with validator and renderer.

### Step 5: Author Demo Cards (Layer 4)

- `logViewerAppDebug.vm.js`
- `logViewerSecurityAudit.vm.js`
- `logViewerStreamMonitor.vm.js`

### Step 6: Pack Docs and Metadata

- `apps/os-launcher/src/domain/vm/docs/logviewer-pack.docs.vm.js`
- `apps/os-launcher/src/domain/generated/logViewerVmmeta.generated.ts`
- Update `apps/os-launcher/src/domain/vmmeta.ts`

### Step 7: Validate

- Storybook checks for all primitives
- Pack validation tests
- Runtime integration smoke
- Typecheck

## Appendix: Differences From Kanban Port

| Aspect | Kanban | LogViewer |
|---|---|---|
| Taxonomy | Needed refactoring (fixed unions to descriptors) | Already clean (LogLevel is stable) |
| State extraction | Required significant rework | Already has clean Redux slice |
| Mono-component split | KanbanBoardView was one big component | LogViewerFrame is one big function -- similar |
| Filtering | VM-side (card computes columns/tasks) | Host-side recommended (performance) |
| Streaming | N/A | New concern -- host-only timer management |
| Host-only mechanics | Drag and drop, modals | Auto-scroll, streaming timer, scroll tracking |
| Number of nodes | 7 (page, taxonomy, header, filters, highlights, board, status) | 13 (page, sidebar, levelFilters, serviceFilters, controls, toolbar, search, activity, table, detail, detailFields, detailActions, status) |
| Nesting depth | 1 level (all children of page) | 2 levels (sidebar/toolbar/detail contain children) |
| Optional areas | highlights, filters, status | detail, status, serviceFilters, controls, activity, detailFields, detailActions |
| Existing Storybook | Had stories but needed expansion | Already has 11 stories (strong starting point) |
| Shared primitives | None reused from elsewhere | Reuses WidgetToolbar, WidgetStatusBar, Sparkline |
