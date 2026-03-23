---
Title: SystemModeler Widget Decomposition and DSL Port Analysis
Ticket: SYSTEM-MODELER-PORT
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
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/system-modeler/SystemModeler.tsx:Main monolithic widget (322 lines)
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/system-modeler/types.ts:Block types, wire types, interaction state
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/system-modeler/systemModelerState.ts:Redux state slice (164 lines)
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/system-modeler/SystemModelerSvg.tsx:SVG block and wire rendering (149 lines)
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/system-modeler/SystemModelerDialogs.tsx:Parameter and simulation dialogs (112 lines)
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/system-modeler/SystemModelerPalette.tsx:Block palette component (28 lines)
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/system-modeler/systemModelerGeometry.ts:Port position calculation (14 lines)
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/docs/widget-dsl-porting-playbook.md:Reference porting playbook
ExternalSources: []
Summary: Complete decomposition analysis of the SystemModeler widget for porting to the HyperCard widget DSL runtime system, following the updated porting playbook.
LastUpdated: 2026-03-10T10:07:22.21424941-04:00
WhatFor: Guide the implementation of the SystemModeler runtime pack port
WhenToUse: Before and during SystemModeler DSL port implementation
---

# SystemModeler Widget Decomposition and DSL Port Analysis

## Executive Summary

This document analyzes the SystemModeler widget (`rich-widgets/src/system-modeler/`) -- a visual block-diagram editor with SVG canvas, interactive wiring, block palette, parameter dialogs, and simulation. It applies the updated Widget DSL Porting Playbook to determine whether and how to port this widget to the HyperCard runtime pack system.

SystemModeler is a substantially different animal from LogViewer or Kanban. It is interaction-heavy: drag-to-move, drag-to-wire, click-to-select, keyboard delete, modal parameter editing, and a fake simulation loop. These are all host-only mechanics. The question is whether there is enough VM-authorable structure left after removing all of that.

The answer is: yes, but the VM/host boundary is drawn very differently here. The VM authors the *model topology* (which blocks exist, how they are wired, what parameters they have) and the *page structure* (toolbar configuration, palette categories, status metrics). The host owns all canvas interaction, SVG rendering, geometry, drag/drop, wiring, dialogs, and simulation.

Proposed pack ID: `systemModeler.v1`

## Phase 1: Does SystemModeler Deserve a Pack?

### Evaluation Against Playbook Criteria

| Criterion | Answer | Notes |
|---|---|---|
| Domain-specific enough that generic `ui.*` nodes are too weak? | Yes | Block types, wire topology, port configurations, simulation parameters -- these are domain concepts |
| Stable semantic model? | Yes | BlockInstance, Wire, BlockTypeDef are well-defined and serializable |
| Reusable host subareas? | Partially | Canvas, palette, toolbar, status bar are regions, but the canvas is the dominant one |
| Browser/DOM mechanics stay on host? | Very much yes | Drag, wiring, SVG geometry, keyboard shortcuts, mouse tracking, modal overlays -- massive host surface |
| Authored examples benefit from structure? | Yes | A control systems modeler vs an audio signal chain vs a data pipeline -- same editor, different block vocabularies |

**Verdict: SystemModeler qualifies, but with a very different VM/host split than Kanban or LogViewer.**

The VM surface is primarily about *defining the model* (block vocabulary, initial topology, parameter schemas) and *composing the page* (which toolbar actions are available, what the palette shows, what status metrics to display). The host owns the entire interactive editing experience.

## Phase 2: Current Widget Audit

### Source Files

| File | Lines | Purpose |
|---|---|---|
| `SystemModeler.tsx` | 322 | Main component: canvas, interactions, 3-tier arch |
| `types.ts` | 76 | BlockTypeDef, BlockInstance, Wire, DragState, WiringState |
| `systemModelerState.ts` | 164 | Redux slice with 15 actions |
| `systemModelerGeometry.ts` | 14 | Port position calculation |
| `SystemModelerSvg.tsx` | 149 | SvgBlock, SvgPort, SvgWire components |
| `SystemModelerDialogs.tsx` | 112 | ParamsDialog, SimParamsDialog |
| `SystemModelerPalette.tsx` | 28 | PaletteSection component |
| `SystemModeler.stories.tsx` | 100 | 5 Storybook stories |
| `sampleData.ts` | 12 | Demo blocks and wires |
| `systemModelerState.test.ts` | 64 | State management tests |

**Total: ~1,041 lines across 10 files.**

### Current Architecture

Same 3-tier pattern as LogViewer:

```text
SystemModeler (smart wrapper -- detects Redux)
  -> ConnectedSystemModeler (Redux-backed)
  -> StandaloneSystemModeler (local useReducer)
  -> SystemModelerFrame (state + dispatch interface)
```

But unlike LogViewer's `LogViewerFrame` which takes a clean model+callbacks split, `SystemModelerFrame` takes raw `state` and `dispatch` -- it manages its own local interaction state (`dragging`, `wiring`) and generates actions directly. This is more tightly coupled.

### Visual Regions

```text
+------------------------------------------------------------------+
|  TOOLBAR                                                          |
|  [Run] [Stop] | [Delete] [New] [Params] ...  [Palette] t=10.0s  |
+------------------------------------------------------------------+
|  CANVAS (SVG)                                    |  PALETTE       |
|                                                  |  (200px, opt.) |
|    +--------+     +--------+     +--------+      |                |
|    | Sine   |---->| Gain   |---->| Scope  |      |  Sources       |
|    |   ≈️   |     |   ✖️   |     |   📺   |      |    Sine Wave   |
|    +--------+     +--------+     +--------+      |    Step Input  |
|                                                  |    Constant    |
|                                                  |  Math Ops      |
|                                                  |    Gain        |
|                                                  |    Sum         |
|                                                  |    ...         |
|                                                  |  Routing       |
|                                                  |    ...         |
+------------------------------------------------------------------+
|  [PROGRESS OVERLAY -- when simulating]                            |
|  ⏳ Simulating model... 45%  [████████░░░░░░░░]                  |
+------------------------------------------------------------------+
|  STATUS BAR                                                       |
|  3 blocks | 2 wires | ✅ Ready                                   |
+------------------------------------------------------------------+
```

### Feature Inventory

```text
Feature                              Belongs Where
-----------------------------------  ------------------------------------------
Block type definitions               Layer 1 - domain model
Wire topology                        Layer 1 - domain model
Block parameter schemas              Layer 1 - domain model
Port geometry calculation            Layer 1 - domain model (pure math)
Sample/initial data                  Layer 1 - domain model (demo support)
SVG block rendering                  Layer 2 - host only
SVG wire rendering (Bezier)          Layer 2 - host only
SVG port rendering                   Layer 2 - host only
Canvas grid background               Layer 2 - host only
Block drag interaction               Layer 2 - host only
Wire drawing interaction             Layer 2 - host only
Block selection                      Layer 2 - host only
Keyboard shortcuts (Delete)          Layer 2 - host only
Block palette UI                     Layer 2 - host primitive
Toolbar UI                           Layer 2 - host primitive
Status bar                           Layer 2 - host primitive (shared)
Parameter dialog                     Layer 2 - host only (modal)
Simulation params dialog             Layer 2 - host only (modal)
Progress overlay                     Layer 2 - host only
Simulation timer loop                Layer 2 - host only (timer)
DSL nodes                            Layer 3 - pack
VM demo cards                        Layer 4 - authored examples
```

### Key Observation: The Host Surface Is Enormous

Compare the host-only list above with Kanban (drag/drop, modals) or LogViewer (auto-scroll, streaming timer). SystemModeler has far more host-only mechanics. The entire canvas interaction system -- block dragging, wire drawing, mouse tracking, port hit detection, keyboard shortcuts, SVG rendering, Bezier curve computation -- is host-owned.

This is not a problem. It is actually the point. The VM should not be doing any of that. The VM's job is to define *what* the modeler shows and how it is structured, not *how* the user interacts with it.

## Phase 3: Domain State Extraction

### Current State Shape

```typescript
interface SystemModelerState {
  initialized: boolean;
  blocks: BlockInstance[];
  wires: Wire[];
  selectedBlockId: string | null;
  showParams: string | null;      // block ID, 'sim', or null
  simTime: string;                // "10.0"
  simRunning: boolean;
  simProgress: number;            // 0-100
  showPalette: boolean;
}
```

### What the VM Should See

The VM authors the *topology definition* and *page configuration*. It does not manage interaction state.

```typescript
// What the VM sees in semantic state
interface SystemModelerSemanticState {
  model: {
    blocks: BlockInstance[];
    wires: Wire[];
  };
  simulation: {
    time: string;
    running: boolean;
    progress: number;
  };
  selectedBlockId: string | null;
}
```

Notably absent from VM state:
- `showParams` -- host-only modal state
- `showPalette` -- host-only view toggle
- `dragging` -- host-only interaction state
- `wiring` -- host-only interaction state

### What the VM Defines (Not State, But Configuration)

This is where SystemModeler differs most from LogViewer. The VM's primary job is not reading/filtering existing data -- it is *defining the vocabulary* of what blocks are available and how the editor behaves.

```typescript
// VM defines the block vocabulary
interface BlockVocabulary {
  categories: Array<{
    title: string;
    blocks: BlockTypeDef[];
  }>;
}

// VM defines simulation config
interface SimulationConfig {
  defaultTime: string;
  solvers?: string[];
}
```

### Actions the VM Can Dispatch

```text
Action                  Payload                           Notes
----------------------  --------------------------------  ---------------------------------
addBlock                { blockType: BlockTypeDef }       Add a block (host chooses position)
deleteBlock             { blockId: string }               Remove block and its wires
clearModel              {}                                Reset to empty canvas
addWire                 { wire: Wire }                    Connect two blocks
deleteWire              { wireId: string }                Remove connection
selectBlock             { blockId: string | null }        Select/deselect
startSimulation         {}                                Begin sim
stopSimulation          {}                                Stop sim
setSimTime              { time: string }                  Configure sim duration
```

### Domain Types (Already Clean)

```typescript
interface BlockTypeDef {
  type: string;
  label: string;
  emoji: string;
  inputs: number;
  outputs: number;
  width: number;
  height: number;
  category: 'source' | 'math' | 'routing';
}

interface BlockInstance {
  id: string;
  type: string;
  label: string;
  emoji: string;
  x: number; y: number;
  w: number; h: number;
  inputs: number;
  outputs: number;
}

interface Wire {
  id: string;
  from: string;
  fromPort: number;
  to: string;
  toPort: number;
}
```

These are well-factored. `BlockTypeDef` is already descriptor-driven (each block type is a data object, not a hardcoded union). The block vocabulary is defined by arrays (`SOURCE_BLOCKS`, `MATH_BLOCKS`, `ROUTING_BLOCKS`) which can vary per card.

## Phase 3b: Where Derived Data Is Computed

Following the updated playbook guidance:

- **Port geometry** (`getPortPos`) -- host-only. The VM never needs to know pixel positions.
- **Bezier wire paths** -- host-only. Pure SVG rendering.
- **Block/wire counts for status bar** -- trivial, can go either way. Recommend host-side since it is just `.length`.
- **Filtered/selected block lookup** -- host-side. Cheap but DOM-related.

Everything computational in SystemModeler is either trivial or purely rendering-related. No large-collection filtering concern like LogViewer.

**Time-driven behavior:** The simulation progress timer (80ms interval incrementing by 5%) is host-only. The VM can start/stop simulation and read progress, but the timer lifecycle is host-managed.

## Phase 4: Host Primitive Decomposition

### Starting Point Assessment

SystemModeler is already partially decomposed:

- `SystemModelerSvg.tsx` -- SvgBlock, SvgPort, SvgWire (149 lines, already extracted)
- `SystemModelerDialogs.tsx` -- ParamsDialog, SimParamsDialog (112 lines, already extracted)
- `SystemModelerPalette.tsx` -- PaletteSection (28 lines, already extracted)
- `systemModelerGeometry.ts` -- getPortPos (14 lines, already extracted)

What remains in `SystemModelerFrame` is primarily the canvas interaction orchestration (drag, wire, mouse events) and the page layout composition. The sub-components are already separate files.

### Proposed Host Primitives

#### Canvas Region (keep as single primitive)

The SVG canvas with all its interaction state is one inseparable host primitive. Splitting drag handling from wire handling from block rendering would create artificial boundaries -- they all operate on the same SVG element and share mouse event handlers.

##### 1. SystemModelerCanvas

**Purpose:** SVG canvas with blocks, wires, drag interaction, wire drawing, selection.

**Props:**
```typescript
interface SystemModelerCanvasProps {
  blocks: BlockInstance[];
  wires: Wire[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onMoveBlock: (blockId: string, x: number, y: number) => void;
  onAddWire: (wire: Wire) => void;
  onDeleteWire: (wireId: string) => void;
  onDeleteSelectedBlock: () => void;
  onShowBlockParams: (blockId: string) => void;
}
```

**Extracts from:** Lines 100-246 of SystemModeler.tsx (the canvas div and SVG). Absorbs all drag/wire local state (`useState<DragState>`, `useState<WiringState>`) and mouse event handlers. Uses existing `SvgBlock`, `SvgPort`, `SvgWire` internally.

**Host-only mechanics retained:**
- All mouse event handling (mousedown, mousemove, mouseup)
- Drag state management
- Wire drawing state management
- Keyboard shortcuts (Delete/Backspace)
- SVG coordinate calculation via `getBoundingClientRect`
- Port geometry via `getPortPos`

#### Toolbar Region (2 primitives)

##### 2. SystemModelerToolbarActions

**Purpose:** Domain action buttons (Run, Stop, Delete, New, Params).

**Props:**
```typescript
interface SystemModelerToolbarActionsProps {
  simRunning: boolean;
  hasSelection: boolean;
  onRun: () => void;
  onStop: () => void;
  onDelete: () => void;
  onClear: () => void;
  onShowSimParams: () => void;
}
```

**Extracts from:** Lines 184-191 (the action buttons in the toolbar).

##### 3. SystemModelerSimStatus

**Purpose:** Simulation time/progress display and palette toggle.

**Props:**
```typescript
interface SystemModelerSimStatusProps {
  simRunning: boolean;
  simProgress: number;
  simTime: string;
  showPalette: boolean;
  onTogglePalette: () => void;
}
```

**Extracts from:** Lines 192-198 (the right side of the toolbar).

#### Palette (1 primitive, already extracted)

##### 4. SystemModelerPalette (already exists as PaletteSection)

Needs light refactoring to accept the category structure as props rather than importing constants.

**Props:**
```typescript
interface SystemModelerPaletteProps {
  categories: Array<{
    title: string;
    blocks: BlockTypeDef[];
  }>;
  onAddBlock: (blockType: BlockTypeDef) => void;
}
```

#### Progress Overlay (1 primitive)

##### 5. SystemModelerProgressOverlay

**Purpose:** Simulation progress display with progress bar.

**Props:**
```typescript
interface SystemModelerProgressOverlayProps {
  progress: number;
  max: number;
}
```

**Extracts from:** Lines 261-266 (the progress overlay div). Uses shared `ProgressBar` primitive.

#### Dialogs (already extracted)

##### 6. ParamsDialog (already exists)

Needs refactoring to accept parameter schema as props rather than hardcoding per block type.

**Revised props:**
```typescript
interface ParamsDialogProps {
  block: BlockInstance;
  parameterSchema: Array<{ label: string; key: string; defaultValue: string; unit?: string }>;
  onClose: () => void;
  onSave: (params: Record<string, string>) => void;
}
```

##### 7. SimParamsDialog (already exists)

Already clean. Props are explicit.

#### Status Bar (1 primitive)

##### 8. SystemModelerStatusBar

**Purpose:** Block count, wire count, simulation status.

**Props:**
```typescript
interface SystemModelerStatusBarProps {
  metrics: Array<{ label: string; value: string | number }>;
  simStatus: 'ready' | 'running';
}
```

### Primitives Already Available (Reuse)

- `WidgetToolbar` -- container shell
- `WidgetStatusBar` -- container shell
- `ProgressBar` -- progress fill bar
- `Separator` -- visual divider
- `ModalOverlay` -- dialog backdrop (from `@hypercard/engine`)

### Storybook Requirements Per Primitive

| Primitive | Required Stories |
|---|---|
| SystemModelerCanvas | Empty canvas, Few blocks no wires, Dense model with wires, Block selected, During wire drawing |
| SystemModelerToolbarActions | Idle, Sim running, Block selected, No selection |
| SystemModelerSimStatus | Idle with time, Running with progress |
| SystemModelerPalette | Standard 3 categories, Custom single category, Many blocks |
| SystemModelerProgressOverlay | 0%, 50%, 100% |
| ParamsDialog | Gain block, Source block, Delay block |
| SystemModelerStatusBar | Empty, Populated, Simulating |

## Phase 5: DSL Node Design

### The Central Design Question

SystemModeler's VM surface is different from LogViewer or Kanban. In those widgets, the VM primarily *reads existing data* and *composes a view* of it. In SystemModeler, the VM primarily *defines a vocabulary* and *configures an editor*.

The node tree describes: what blocks are available, how the page is structured, what toolbar actions exist, what status metrics to show.

The pack actually has **two DSLs** that compose together:

1. **Page DSL** -- what the editor UI looks like (toolbar, canvas, palette, status bar).
2. **Model DSL** -- what the block graph contains (blocks, wires, topology).

The page DSL says "render a canvas here with this palette." The model DSL says "the canvas should contain these blocks wired this way." They are sibling concerns within the same `systemModeler.page(...)` composition.

### Proposed Node Set

```text
Page DSL (editor structure):
systemModeler.page              -- root composition node
systemModeler.toolbar           -- top bar container
systemModeler.toolbarActions    -- domain action buttons (run/stop/delete/etc.)
systemModeler.simStatus         -- time/progress display
systemModeler.canvas            -- SVG editing canvas (mostly host-owned)
systemModeler.palette           -- block palette container
systemModeler.paletteCategory   -- one category of blocks in the palette
systemModeler.progress          -- simulation progress overlay
systemModeler.status            -- bottom status bar

Model DSL (graph topology):
systemModeler.model             -- topology container (seed or managed)
systemModeler.block             -- a block instance on the canvas
systemModeler.wire              -- a connection between two blocks
```

Twelve nodes total. The page DSL and model DSL compose as siblings inside `page`. The `canvas` node is a rendering surface; the `model` node is the data that populates it.

### Node Specifications

#### `systemModeler.page(...children)`

Root composition node.

```javascript
widgets.systemModeler.page(
  widgets.systemModeler.toolbar(
    widgets.systemModeler.toolbarActions({...}),
    widgets.systemModeler.simStatus({...}),
  ),
  widgets.systemModeler.canvas({...}),
  widgets.systemModeler.model(                          // Model DSL
    { mode: 'seed' },
    widgets.systemModeler.block({ id: 'sine1', type: 'sine', x: 100, y: 80 }),
    widgets.systemModeler.block({ id: 'gain1', type: 'gain', x: 280, y: 80 }),
    widgets.systemModeler.wire({ from: 'sine1', fromPort: 0, to: 'gain1', toPort: 0 }),
  ),
  widgets.systemModeler.palette(
    widgets.systemModeler.paletteCategory({...}),
    widgets.systemModeler.paletteCategory({...}),
  ),
  widgets.systemModeler.progress({...}),
  widgets.systemModeler.status({...}),
)
```

#### `systemModeler.toolbar(...children)`

Layout container for the top bar. Accepts `toolbarActions` and `simStatus`.

#### `systemModeler.toolbarActions(props)`

Configures which action buttons are available.

**Props:**
```javascript
{
  actions: [
    { id: 'run', label: 'Run', icon: '▶', onAction: { handler: 'startSim' } },
    { id: 'stop', label: 'Stop', icon: '⏹', onAction: { handler: 'stopSim' } },
    { id: 'delete', label: 'Delete', icon: '🗑️', onAction: { handler: 'deleteSelected' } },
    { id: 'new', label: 'New', onAction: { handler: 'clearModel' } },
    { id: 'params', label: 'Params', icon: '⚙️', onAction: { handler: 'showSimParams' } },
  ],
  simRunning: state.simulation.running,
}
```

This is a **flexible sub-element** in the playbook's updated terminology. The list of toolbar actions is not domain-specific in shape (it is `{ label, icon, handler }[]`), but it lives inside a domain container. A data-pipeline modeler might have different actions (Deploy, Validate, Export) than a control-systems modeler (Run, Stop, Step).

#### `systemModeler.simStatus(props)`

Displays simulation time or progress.

**Props:**
```javascript
{
  simRunning: state.simulation.running,
  simProgress: state.simulation.progress,
  simTime: state.simulation.time,
  showPalette: state.showPalette,
  onTogglePalette: { handler: 'togglePalette' },
}
```

#### `systemModeler.canvas(props)`

Marker node for the SVG editing canvas. The host owns all interaction. The VM provides minimal configuration.

**Props:**
```javascript
{
  // The VM does not pass blocks/wires here -- the host reads them from semantic state.
  // The canvas node is primarily a structural marker.
  gridSize: 20,       // optional: customize grid spacing
  snapToGrid: false,   // optional: enable grid snapping
}
```

This is the most host-dominated node in the system. The host reads `state.model.blocks` and `state.model.wires` directly from semantic state. The VM card defined the initial topology; the user modifies it through interaction; the host renders it.

#### `systemModeler.palette(...children)`

Container for the block palette sidebar. Accepts `paletteCategory` children.

Can be omitted for a fixed-vocabulary modeler where the user cannot add new blocks.

#### `systemModeler.paletteCategory(props)`

One category of blocks in the palette.

**Props:**
```javascript
{
  title: 'Sources',
  blocks: [
    { type: 'sine', label: 'Sine Wave', emoji: '≈️', inputs: 0, outputs: 1, width: 120, height: 60 },
    { type: 'step', label: 'Step Input', emoji: '📋', inputs: 0, outputs: 1, width: 120, height: 60 },
    { type: 'constant', label: 'Constant', emoji: '🔢', inputs: 0, outputs: 1, width: 110, height: 60 },
  ],
}
```

This is where the VM defines the block vocabulary. Different cards provide different block sets. A control systems card offers Sine/Step/Gain/Integrator. An audio processing card might offer Oscillator/Filter/Mixer/Output. A data pipeline card might offer Source/Transform/Join/Sink.

The block type definitions are **descriptor-driven** per the playbook's guidance -- each is a data object, not a hardcoded type.

#### `systemModeler.progress(props)`

Simulation progress overlay. Can be omitted if simulation is not supported.

**Props:**
```javascript
{
  progress: state.simulation.progress,
  label: 'Simulating model...',
}
```

Only rendered when simulation is running. The host manages visibility based on `state.simulation.running`.

#### `systemModeler.status(props)`

Bottom status bar.

**Props:**
```javascript
{
  metrics: [
    { label: 'blocks', value: state.model.blocks.length },
    { label: 'wires', value: state.model.wires.length },
  ],
  simStatus: state.simulation.running ? 'running' : 'ready',
}
```

### Model DSL: Programmatic Topology

The model DSL is a second compositional layer within the same pack. It lets VM cards programmatically define and manage the block graph instead of relying solely on user interaction.

#### `systemModeler.model(props, ...children)`

Container for the model topology. Accepts `block` and `wire` children. The first argument is a props object with a `mode` field.

**Props:**
```javascript
{
  mode: 'seed',      // or 'managed'
}
```

**Two reconciliation modes:**

**Seed mode (`mode: 'seed'`).** The model node provides the initial state only. On first render, the host materializes the blocks and wires on the canvas. After that, user interaction owns the topology. Subsequent renders ignore the model node. This is like `defaultValue` in React -- it seeds the canvas, then lets go.

Good for: "start the user with this signal chain, let them modify it freely."

**Managed mode (`mode: 'managed'`).** The model node is authoritative every render. The host reconciles the declared topology with the current canvas state:

- Blocks in the model but not on the canvas are added.
- Blocks on the canvas but not in the model are removed.
- Wire topology is synced to match the declared wires.
- User-dragged positions can be tracked as offsets relative to declared positions (the host remembers where the user dragged things, even as the model definition changes).

User edits (drag, wire, delete) dispatch to VM handlers, which update semantic state, which changes what the next `render()` returns.

Good for: "generate a topology from data, keep it in sync as data changes."

#### `systemModeler.block(props)`

A block instance on the canvas.

**Props:**
```javascript
{
  id: 'gain1',              // stable identifier (required, must be unique within model)
  type: 'gain',             // references a BlockTypeDef from the palette vocabulary (required)
  x: 280,                   // canvas position (optional in managed mode -- host auto-layouts)
  y: 80,
  label: 'Gain x3',         // override default label from block type (optional)
  params: {                  // block parameters, keys match BlockTypeDef.params schema (optional)
    gain: '3.0',
  },
}
```

The `type` field references a block type defined in the palette categories. The host resolves `type: 'gain'` against the vocabulary to get dimensions, port counts, emoji, and parameter schema. If the type is not in the vocabulary, the validator rejects it.

When `x` and `y` are omitted (managed mode), the host either auto-layouts blocks or preserves user-dragged positions from previous renders.

#### `systemModeler.wire(props)`

A connection between two blocks.

**Props:**
```javascript
{
  from: 'sine1',      // source block ID (required, must match a block in this model)
  fromPort: 0,        // output port index on source block (required)
  to: 'gain1',        // target block ID (required, must match a block in this model)
  toPort: 0,          // input port index on target block (required)
}
```

Wire IDs are host-generated. The validator checks that:
- Referenced block IDs exist in the model's children.
- Port indices are within range for the referenced blocks' port counts (resolved via vocabulary).
- No duplicate wires to the same target port.

#### Model DSL Composition Examples

**Seed a PID controller template, let user customize:**
```javascript
sm.model(
  { mode: 'seed' },
  sm.block({ id: 'setpoint', type: 'constant', x: 50, y: 120, params: { value: '1.0' } }),
  sm.block({ id: 'error', type: 'sum', x: 200, y: 120 }),
  sm.block({ id: 'pid', type: 'gain', x: 340, y: 120, label: 'PID', params: { gain: '2.5' } }),
  sm.block({ id: 'plant', type: 'transferFn', x: 500, y: 120, label: 'Plant' }),
  sm.block({ id: 'scope', type: 'scope', x: 680, y: 120 }),
  sm.wire({ from: 'setpoint', fromPort: 0, to: 'error', toPort: 0 }),
  sm.wire({ from: 'error', fromPort: 0, to: 'pid', toPort: 0 }),
  sm.wire({ from: 'pid', fromPort: 0, to: 'plant', toPort: 0 }),
  sm.wire({ from: 'plant', fromPort: 0, to: 'scope', toPort: 0 }),
  sm.wire({ from: 'plant', fromPort: 0, to: 'error', toPort: 1 }),  // feedback loop
)
```

**Generate a signal chain from data (managed):**
```javascript
sm.model(
  { mode: 'managed' },
  ...state.chain.map((type, i) =>
    sm.block({ id: `s${i}`, type, x: 100 + i * 180, y: 100 })
  ),
  ...state.chain.slice(0, -1).map((_, i) =>
    sm.wire({ from: `s${i}`, fromPort: 0, to: `s${i+1}`, toPort: 0 })
  ),
)
```

**Build a data pipeline from config (managed):**
```javascript
sm.model(
  { mode: 'managed' },
  ...state.pipeline.nodes.map(node =>
    sm.block({ id: node.id, type: node.type, params: node.config })
  ),
  ...state.pipeline.edges.map(edge =>
    sm.wire({ from: edge.source, fromPort: edge.sourcePort,
              to: edge.target, toPort: edge.targetPort })
  ),
)
```

#### How the Two DSLs Interact

| Concern | Page DSL | Model DSL |
|---|---|---|
| Purpose | Editor structure | Graph content |
| Nodes | `toolbar`, `canvas`, `palette`, `status`, etc. | `model`, `block`, `wire` |
| Variation axis | Which actions, which palette categories | Which blocks, how wired, what params |
| Host role | Render the editor chrome | Materialize/reconcile the graph on the canvas |
| Reconciliation | N/A (declarative UI, re-rendered each cycle) | Seed (once) or managed (every render) |
| User interaction | Through toolbar/palette clicks | Through canvas drag/wire/delete |

The `canvas` node is a rendering surface. The `model` node is the data. They do not nest inside each other -- they are siblings inside `page`. The renderer connects them: it reads the model definition, materializes it on the canvas, and manages reconciliation based on the mode.

### What The Host Owns (Not In DSL)

The host surface is the largest of any widget we have ported:

- Entire SVG canvas rendering (blocks, wires, ports, grid)
- Block drag-and-drop (mousedown/mousemove/mouseup cycle)
- Wire drawing (port-to-port drag)
- Wire Bezier curve computation
- Port position geometry
- Block selection state and visual highlighting
- Keyboard shortcuts (Delete/Backspace)
- Canvas coordinate transformation (client to SVG)
- Modal dialog lifecycle (open/close/focus)
- Parameter dialog form state
- Simulation timer loop (80ms interval)
- Progress overlay visibility
- Palette toggle state
- Block ID generation
- Random block placement on add
- Wire duplicate prevention

### Optional Children and Layout Adaptation

Following the playbook's guidance on omission-as-opt-out:

- **No `palette`:** Render canvas full-width. User cannot add new blocks (fixed topology).
- **No `progress`:** No simulation overlay. Simulation actions in toolbar can still exist, but no visual feedback beyond status bar.
- **No `simStatus`:** Toolbar shows only action buttons. Time display is hidden.
- **No `toolbarActions`:** Empty toolbar (unusual but valid for a read-only view of a model).

## Phase 6: VM Helper Surface

### `stack-bootstrap.vm.js` Additions

```javascript
const __systemModelerWidgets = {
  // Container nodes
  page(...children) {
    return { kind: 'systemModeler.page', children: children.flat().filter(Boolean) };
  },
  toolbar(...children) {
    return { kind: 'systemModeler.toolbar', children: children.flat().filter(Boolean) };
  },
  palette(...children) {
    return { kind: 'systemModeler.palette', children: children.flat().filter(Boolean) };
  },

  // Model DSL (topology)
  model(...args) {
    const hasProps = args.length > 0 && args[0] && typeof args[0] === 'object' && !args[0].kind;
    const props = hasProps ? safeObject(args[0]) : {};
    const children = (hasProps ? args.slice(1) : args).flat().filter(Boolean);
    return { kind: 'systemModeler.model', props, children };
  },
  block(props = {}) {
    return { kind: 'systemModeler.block', props: safeObject(props) };
  },
  wire(props = {}) {
    return { kind: 'systemModeler.wire', props: safeObject(props) };
  },

  // Page DSL leaf nodes
  toolbarActions(props = {}) {
    return { kind: 'systemModeler.toolbarActions', props: safeObject(props) };
  },
  simStatus(props = {}) {
    return { kind: 'systemModeler.simStatus', props: safeObject(props) };
  },
  canvas(props = {}) {
    return { kind: 'systemModeler.canvas', props: safeObject(props) };
  },
  paletteCategory(props = {}) {
    return { kind: 'systemModeler.paletteCategory', props: safeObject(props) };
  },
  progress(props = {}) {
    return { kind: 'systemModeler.progress', props: safeObject(props) };
  },
  status(props = {}) {
    return { kind: 'systemModeler.status', props: safeObject(props) };
  },
};

// In createPackHelpers:
if (packId === 'systemModeler.v1') {
  return { widgets: { systemModeler: __systemModelerWidgets } };
}
```

## Phase 7: Pack Validator and Renderer

### Validator

Container-child rules:
- `page` accepts: `toolbar`, `canvas`, `model`, `palette`, `progress`, `status`
- `toolbar` accepts: `toolbarActions`, `simStatus`
- `palette` accepts: `paletteCategory`
- `model` accepts: `block`, `wire`

Required vs optional:
- `page` requires `canvas` (the minimal useful modeler is just a canvas)
- `toolbar`, `model`, `palette`, `progress`, `status` are all optional at page level
- Within `toolbar`: both `toolbarActions` and `simStatus` are optional
- Within `palette`: at least one `paletteCategory` is required
- Within `model`: at least one `block` is required (a model with only wires is invalid)

Model-specific validation:
- Every `wire.from` and `wire.to` must reference a `block.id` within the same `model`
- Port indices must be within range (resolved against the block's type from the palette vocabulary)
- No duplicate wires to the same target port
- `model.mode` must be `'seed'` or `'managed'`
- Block IDs must be unique within the model

### Renderer

```typescript
function renderSystemModelerTree(tree: SystemModelerPageNode, runtime: RuntimeContext) {
  const toolbar = findChild(tree, 'systemModeler.toolbar');
  const canvas = findChild(tree, 'systemModeler.canvas');
  const model = findChild(tree, 'systemModeler.model');
  const palette = findChild(tree, 'systemModeler.palette');
  const progress = findChild(tree, 'systemModeler.progress');
  const status = findChild(tree, 'systemModeler.status');

  // Reconcile model DSL with canvas state
  const reconciledState = model
    ? reconcileModel(model, runtime.state, palette)
    : runtime.state;

  return (
    <SystemModelerPageShell>
      {toolbar && renderToolbar(toolbar, runtime)}
      <div data-part="sm-body">
        {canvas && <SystemModelerCanvas {...mapCanvasProps(canvas, reconciledState, runtime)} />}
        {palette && renderPalette(palette, runtime)}
      </div>
      {progress && reconciledState.simulation.running && (
        <SystemModelerProgressOverlay {...mapProgressProps(progress)} />
      )}
      {status && <SystemModelerStatusBar {...mapStatusProps(status)} />}
      {/* Dialogs are host-managed, not DSL nodes */}
    </SystemModelerPageShell>
  );
}

function reconcileModel(
  model: SystemModelerModelNode,
  currentState: SystemModelerSemanticState,
  palette: SystemModelerPaletteNode | null,
): SystemModelerSemanticState {
  const mode = model.props.mode ?? 'seed';
  if (mode === 'seed' && currentState.modelSeeded) {
    // Already seeded -- ignore model node, use current state
    return currentState;
  }
  // Extract blocks and wires from model children
  const declaredBlocks = model.children.filter(c => c.kind === 'systemModeler.block');
  const declaredWires = model.children.filter(c => c.kind === 'systemModeler.wire');
  // Resolve block types against palette vocabulary
  const vocabulary = palette ? extractVocabulary(palette) : {};
  const blocks = declaredBlocks.map(b => resolveBlock(b, vocabulary, currentState));
  const wires = declaredWires.map(w => resolveWire(w));
  // Return reconciled state
  return { ...currentState, model: { blocks, wires }, modelSeeded: true };
}
```

### Key Renderer Responsibilities

1. **Wire handler refs to runtime events.** Toolbar action handlers, palette add-block handler.
2. **Reconcile model DSL with canvas state.** On each render, apply the model DSL's reconciliation mode (seed or managed) to determine what blocks and wires the canvas should display.
3. **Resolve block types against vocabulary.** Block nodes reference types by string ID. The renderer resolves them against the palette's block type definitions to get dimensions, ports, emoji, and parameter schemas.
4. **Manage all interaction state internally.** Drag, wiring, selection highlighting, dialog open/close, simulation timer.
5. **Manage dialogs as host-only UI.** Parameter dialogs and simulation params dialogs are not DSL nodes. They are host-managed modals triggered by user interaction.
6. **Track user position overrides in managed mode.** When a managed model re-declares block positions, the host preserves user-dragged offsets so blocks do not snap back on every render.
7. **Optional children.** Adapt layout when palette is absent (canvas full-width), model is absent (empty canvas, user builds from scratch), or toolbar is absent.

## Phase 8: Example VM Cards

### Card 1: Control Systems Modeler (Full Featured)

Standard Simulink-style modeler with all block categories, simulation, and full toolbar.

```javascript
defineCard(
  'systemModelerControlSystems',
  ({ widgets }) => ({
    render({ state }) {
      const sm = widgets.systemModeler;
      const model = state.app_system_modeler;

      return sm.page(
        sm.toolbar(
          sm.toolbarActions({
            actions: [
              { id: 'run', label: 'Run', icon: '▶', onAction: { handler: 'startSim' } },
              { id: 'stop', label: 'Stop', icon: '⏹', onAction: { handler: 'stopSim' } },
              { id: 'delete', label: 'Delete', icon: '🗑️', onAction: { handler: 'deleteSelected' } },
              { id: 'new', label: 'New', onAction: { handler: 'clearModel' } },
              { id: 'params', label: 'Params', icon: '⚙️', onAction: { handler: 'showSimParams' } },
            ],
            simRunning: model.simulation.running,
          }),
          sm.simStatus({
            simRunning: model.simulation.running,
            simProgress: model.simulation.progress,
            simTime: model.simulation.time,
            onTogglePalette: { handler: 'togglePalette' },
          }),
        ),
        sm.canvas({}),
        sm.palette(
          sm.paletteCategory({
            title: 'Sources',
            blocks: [
              { type: 'sine', label: 'Sine Wave', emoji: '≈️', inputs: 0, outputs: 1, width: 120, height: 60 },
              { type: 'step', label: 'Step Input', emoji: '📋', inputs: 0, outputs: 1, width: 120, height: 60 },
              { type: 'constant', label: 'Constant', emoji: '🔢', inputs: 0, outputs: 1, width: 110, height: 60 },
            ],
          }),
          sm.paletteCategory({
            title: 'Math Operations',
            blocks: [
              { type: 'gain', label: 'Gain', emoji: '✖️', inputs: 1, outputs: 1, width: 100, height: 60 },
              { type: 'sum', label: 'Sum', emoji: '➕', inputs: 2, outputs: 1, width: 80, height: 70 },
              { type: 'integrator', label: 'Integrator', emoji: '∫', inputs: 1, outputs: 1, width: 90, height: 60 },
            ],
          }),
          sm.paletteCategory({
            title: 'Routing & Sinks',
            blocks: [
              { type: 'scope', label: 'Scope', emoji: '📺', inputs: 1, outputs: 0, width: 110, height: 60 },
              { type: 'mux', label: 'Mux', emoji: '🔀', inputs: 2, outputs: 1, width: 80, height: 70 },
              { type: 'delay', label: 'Delay', emoji: '⏱️', inputs: 1, outputs: 1, width: 100, height: 60 },
            ],
          }),
        ),
        model.simulation.running && sm.progress({
          progress: model.simulation.progress,
          label: 'Simulating model...',
        }),
        sm.status({
          metrics: [
            { label: 'blocks', value: model.model.blocks.length },
            { label: 'wires', value: model.model.wires.length },
          ],
          simStatus: model.simulation.running ? 'running' : 'ready',
        }),
      );
    },
    handlers: systemModelerHandlers(modelById('systemModelerControlSystems')),
  }),
  'systemModeler.v1',
);
```

### Card 2: Data Pipeline Builder (Custom Vocabulary, No Simulation)

A simpler modeler for building data pipelines. No simulation support -- omits `progress` and sim-related toolbar actions. Different block vocabulary entirely.

```javascript
defineCard(
  'systemModelerDataPipeline',
  ({ widgets }) => ({
    render({ state }) {
      const sm = widgets.systemModeler;
      const model = state.app_data_pipeline;

      return sm.page(
        sm.toolbar(
          sm.toolbarActions({
            actions: [
              { id: 'validate', label: 'Validate', icon: '✅', onAction: { handler: 'validate' } },
              { id: 'deploy', label: 'Deploy', icon: '🚀', onAction: { handler: 'deploy' } },
              { id: 'delete', label: 'Delete', icon: '🗑️', onAction: { handler: 'deleteSelected' } },
              { id: 'new', label: 'New', onAction: { handler: 'clearModel' } },
            ],
          }),
          // No simStatus -- no simulation
        ),
        sm.canvas({}),
        sm.palette(
          sm.paletteCategory({
            title: 'Sources',
            blocks: [
              { type: 'kafka', label: 'Kafka Topic', emoji: '📨', inputs: 0, outputs: 1, width: 130, height: 60 },
              { type: 'postgres', label: 'PostgreSQL', emoji: '🐘', inputs: 0, outputs: 1, width: 130, height: 60 },
              { type: 's3', label: 'S3 Bucket', emoji: '🪣', inputs: 0, outputs: 1, width: 120, height: 60 },
            ],
          }),
          sm.paletteCategory({
            title: 'Transforms',
            blocks: [
              { type: 'filter', label: 'Filter', emoji: '🔍', inputs: 1, outputs: 1, width: 100, height: 60 },
              { type: 'map', label: 'Map', emoji: '🗺️', inputs: 1, outputs: 1, width: 90, height: 60 },
              { type: 'join', label: 'Join', emoji: '🔗', inputs: 2, outputs: 1, width: 90, height: 70 },
              { type: 'aggregate', label: 'Aggregate', emoji: '📊', inputs: 1, outputs: 1, width: 120, height: 60 },
            ],
          }),
          sm.paletteCategory({
            title: 'Sinks',
            blocks: [
              { type: 'dashboard', label: 'Dashboard', emoji: '📈', inputs: 1, outputs: 0, width: 120, height: 60 },
              { type: 'alert', label: 'Alert', emoji: '🚨', inputs: 1, outputs: 0, width: 100, height: 60 },
              { type: 'export', label: 'CSV Export', emoji: '📄', inputs: 1, outputs: 0, width: 120, height: 60 },
            ],
          }),
        ),
        // No progress -- no simulation
        sm.status({
          metrics: [
            { label: 'nodes', value: model.model.blocks.length },
            { label: 'edges', value: model.model.wires.length },
          ],
          simStatus: 'ready',
        }),
      );
    },
    handlers: dataPipelineHandlers(modelById('systemModelerDataPipeline')),
  }),
  'systemModeler.v1',
);
```

### Card 3: PID Controller Template (Seed Mode Model)

A card that seeds the canvas with a complete PID feedback controller, then lets the user modify it freely. Demonstrates the model DSL in seed mode.

```javascript
defineCard(
  'systemModelerPidTemplate',
  ({ widgets }) => ({
    render({ state }) {
      const sm = widgets.systemModeler;
      const model = state.app_pid_template;

      return sm.page(
        sm.toolbar(
          sm.toolbarActions({
            actions: [
              { id: 'run', label: 'Run', icon: '▶', onAction: { handler: 'startSim' } },
              { id: 'stop', label: 'Stop', icon: '⏹', onAction: { handler: 'stopSim' } },
              { id: 'delete', label: 'Delete', icon: '🗑️', onAction: { handler: 'deleteSelected' } },
            ],
            simRunning: model.simulation.running,
          }),
          sm.simStatus({
            simRunning: model.simulation.running,
            simProgress: model.simulation.progress,
            simTime: model.simulation.time,
            onTogglePalette: { handler: 'togglePalette' },
          }),
        ),
        sm.canvas({}),
        sm.model(
          { mode: 'seed' },
          sm.block({ id: 'setpoint', type: 'constant', x: 50, y: 120, params: { value: '1.0' } }),
          sm.block({ id: 'error', type: 'sum', x: 200, y: 120 }),
          sm.block({ id: 'pid', type: 'gain', x: 340, y: 120, label: 'PID', params: { gain: '2.5' } }),
          sm.block({ id: 'plant', type: 'transferFn', x: 500, y: 120, label: 'Plant' }),
          sm.block({ id: 'scope', type: 'scope', x: 680, y: 120 }),
          sm.wire({ from: 'setpoint', fromPort: 0, to: 'error', toPort: 0 }),
          sm.wire({ from: 'error', fromPort: 0, to: 'pid', toPort: 0 }),
          sm.wire({ from: 'pid', fromPort: 0, to: 'plant', toPort: 0 }),
          sm.wire({ from: 'plant', fromPort: 0, to: 'scope', toPort: 0 }),
          sm.wire({ from: 'plant', fromPort: 0, to: 'error', toPort: 1 }),  // feedback loop
        ),
        sm.palette(
          sm.paletteCategory({
            title: 'Sources',
            blocks: [
              { type: 'constant', label: 'Constant', emoji: '🔢', inputs: 0, outputs: 1, width: 110, height: 60 },
              { type: 'step', label: 'Step Input', emoji: '📋', inputs: 0, outputs: 1, width: 120, height: 60 },
            ],
          }),
          sm.paletteCategory({
            title: 'Control',
            blocks: [
              { type: 'gain', label: 'Gain', emoji: '✖️', inputs: 1, outputs: 1, width: 100, height: 60 },
              { type: 'sum', label: 'Sum', emoji: '➕', inputs: 2, outputs: 1, width: 80, height: 70 },
              { type: 'integrator', label: 'Integrator', emoji: '∫', inputs: 1, outputs: 1, width: 90, height: 60 },
              { type: 'transferFn', label: 'Transfer Fn', emoji: '📈', inputs: 1, outputs: 1, width: 130, height: 60 },
              { type: 'scope', label: 'Scope', emoji: '📺', inputs: 1, outputs: 0, width: 110, height: 60 },
            ],
          }),
        ),
        model.simulation.running && sm.progress({
          progress: model.simulation.progress,
          label: 'Simulating PID response...',
        }),
        sm.status({
          metrics: [
            { label: 'blocks', value: model.model.blocks.length },
            { label: 'wires', value: model.model.wires.length },
          ],
          simStatus: model.simulation.running ? 'running' : 'ready',
        }),
      );
    },
    handlers: systemModelerHandlers(modelById('systemModelerPidTemplate')),
  }),
  'systemModeler.v1',
);
```

### Card 4: Dynamic Pipeline Builder (Managed Mode Model)

A card where the topology is driven by a config object in semantic state. Adding/removing stages updates the graph. Demonstrates the model DSL in managed mode with programmatic topology generation.

```javascript
defineCard(
  'systemModelerDynamicPipeline',
  ({ widgets }) => ({
    render({ state }) {
      const sm = widgets.systemModeler;
      const pipeline = state.app_dynamic_pipeline;

      return sm.page(
        sm.toolbar(
          sm.toolbarActions({
            actions: [
              { id: 'addStage', label: '+ Stage', icon: '➕', onAction: { handler: 'addStage' } },
              { id: 'validate', label: 'Validate', icon: '✅', onAction: { handler: 'validate' } },
              { id: 'deploy', label: 'Deploy', icon: '🚀', onAction: { handler: 'deploy' } },
            ],
          }),
        ),
        sm.canvas({}),
        sm.model(
          { mode: 'managed' },
          ...pipeline.stages.map((stage, i) =>
            sm.block({
              id: stage.id,
              type: stage.type,
              x: 80 + i * 180,
              y: 100,
              label: stage.name,
              params: stage.config,
            })
          ),
          ...pipeline.stages.slice(0, -1).map((stage, i) =>
            sm.wire({
              from: stage.id,
              fromPort: 0,
              to: pipeline.stages[i + 1].id,
              toPort: 0,
            })
          ),
        ),
        // No palette -- topology is managed programmatically
        sm.status({
          metrics: [
            { label: 'stages', value: pipeline.stages.length },
            { label: 'status', value: pipeline.validated ? 'valid' : 'draft' },
          ],
          simStatus: 'ready',
        }),
      );
    },
    handlers: {
      addStage({ dispatch }) {
        dispatch('addPipelineStage', { type: 'filter', name: 'New Stage' });
      },
      validate({ dispatch }) {
        dispatch('validatePipeline');
      },
      deploy({ dispatch }) {
        dispatch('deployPipeline');
      },
    },
  }),
  'systemModeler.v1',
);
```

### Card 5: Read-Only Model Viewer (Seed Model, No Editing)

A minimal viewer for displaying a fixed model. No palette, no toolbar, no editing. Uses seed mode to populate the canvas with a pre-defined graph. Proves that the model DSL works without any editing infrastructure.

```javascript
defineCard(
  'systemModelerReadOnly',
  ({ widgets }) => ({
    render({ state }) {
      const sm = widgets.systemModeler;

      return sm.page(
        sm.canvas({}),
        sm.model(
          { mode: 'seed' },
          sm.block({ id: 'in', type: 'sine', x: 50, y: 100 }),
          sm.block({ id: 'amp', type: 'gain', x: 220, y: 100, label: 'Amplify' }),
          sm.block({ id: 'out', type: 'scope', x: 400, y: 100 }),
          sm.wire({ from: 'in', fromPort: 0, to: 'amp', toPort: 0 }),
          sm.wire({ from: 'amp', fromPort: 0, to: 'out', toPort: 0 }),
        ),
        sm.status({
          metrics: [
            { label: 'blocks', value: 3 },
            { label: 'wires', value: 2 },
          ],
          simStatus: 'ready',
        }),
      );
    },
    handlers: {},
  }),
  'systemModeler.v1',
);
```

### Structural Variation Summary

| Feature | ControlSystems | DataPipeline | PidTemplate | DynamicPipeline | ReadOnly |
|---|---|---|---|---|---|
| `toolbarActions` | Run/Stop/Delete/New/Params | Validate/Deploy/Delete/New | Run/Stop/Delete | +Stage/Validate/Deploy | Omitted |
| `simStatus` | Yes | Omitted | Yes | Omitted | Omitted |
| `canvas` | Yes | Yes | Yes | Yes | Yes |
| `model` | None (user builds) | None (user builds) | Seed (PID template) | Managed (from config) | Seed (fixed graph) |
| `palette` | 3 categories | 3 categories | 2 categories | Omitted | Omitted |
| `progress` | Yes | Omitted | Yes | Omitted | Omitted |
| `status` | blocks/wires | nodes/edges | blocks/wires | stages/status | blocks/wires |
| Handlers | Full editing + sim | Editing + deploy | Editing + sim | Add/validate/deploy | None |

## Phase 9: What Makes SystemModeler Different

### Comparison With Previous Ports

| Aspect | Kanban | LogViewer | SystemModeler |
|---|---|---|---|
| VM's primary job | Compose view of data | Configure filters over data | Define vocabulary and editor structure |
| Host-only surface | Moderate (drag, modals) | Small (scroll, timer) | Enormous (entire canvas interaction) |
| Data flow | VM builds column/task trees | Host filters entries | User creates topology through interaction |
| Block vocabulary | N/A | Fixed (log levels) | Card-authorable (the main variation axis) |
| Interaction complexity | Drag cards between lanes | Click rows, toggle filters | Drag blocks, draw wires, edit params, simulate |
| State mutability | Cards move between columns | Logs append, filters change | Blocks placed, wired, moved, deleted freely |
| DSL emphasis | Page composition | Filter configuration | Vocabulary definition + topology definition |
| Second DSL | N/A | N/A | Model DSL (block/wire topology with seed/managed reconciliation) |

### The Block Vocabulary Is The DSL's Power

In LogViewer, the card variation comes from choosing which sidebar sections to include and what detail fields to show. In SystemModeler, the card variation comes primarily from *what blocks are available*. The palette categories and their block type definitions are the main thing the VM author controls.

This is analogous to Kanban's taxonomy (which issue types, priorities, and labels are available), but more central to the widget's identity. A SystemModeler with audio blocks is a fundamentally different tool from one with control systems blocks, even though the canvas, wiring, and interaction are identical.

### Parameter Schemas Need Attention

Currently, `ParamsDialog` hardcodes parameter fields per block type (`gain` gets a "Gain" field, `source` gets "Amplitude" and "Frequency"). For the DSL port, parameter schemas should be part of the `BlockTypeDef`:

```typescript
interface BlockTypeDef {
  type: string;
  label: string;
  emoji: string;
  inputs: number;
  outputs: number;
  width: number;
  height: number;
  category: string;
  params?: Array<{
    key: string;
    label: string;
    defaultValue: string;
    unit?: string;
  }>;
}
```

This makes parameter editing fully vocabulary-driven. The host renders the dialog generically from the schema; the VM author defines what parameters each block type has.

## Phase 10: Implementation Sequence

### Step 1: Extend BlockTypeDef with Parameter Schema

Add `params` field to `BlockTypeDef`. Refactor `ParamsDialog` to render from schema instead of hardcoded switch.

### Step 2: Extract Host Primitives (Layer 2)

1. Create `SystemModelerCanvas.tsx` (absorbs drag/wire state from SystemModelerFrame)
2. Create `SystemModelerToolbarActions.tsx`
3. Create `SystemModelerSimStatus.tsx`
4. Refactor `SystemModelerPalette.tsx` to accept categories as props
5. Create `SystemModelerProgressOverlay.tsx`
6. Create `SystemModelerStatusBar.tsx`
7. Refactor `SystemModelerFrame` to compose these primitives
8. Verify all existing Storybook stories still pass

### Step 3: Add Primitive Stories

One story file per primitive.

### Step 4: Add VM Helpers (Layer 3 - Bootstrap)

Add `systemModeler` helpers to `stack-bootstrap.vm.js`.

### Step 5: Implement Pack (Layer 3 - Renderer)

Create `systemModelerV1Pack.tsx` with validator and renderer.

### Step 6: Author Demo Cards (Layer 4)

- `systemModelerControlSystems.vm.js`
- `systemModelerDataPipeline.vm.js`
- `systemModelerReadOnly.vm.js`

### Step 7: Pack Docs and Metadata

- `apps/os-launcher/src/domain/vm/docs/systemmodeler-pack.docs.vm.js`
- `apps/os-launcher/src/domain/generated/systemModelerVmmeta.generated.ts`
- Update `apps/os-launcher/src/domain/vmmeta.ts`

### Step 8: Validate Per Layer

- Storybook checks for all primitives
- Pack validator tests (valid and invalid node trees)
- Pack renderer tests (component tree, handler wiring)
- VM demo card tests (card evaluation, node tree validity)
- Integration smoke (drag, wire, simulate round-trip)

## Appendix: Risks and Open Questions

### Risk 1: Canvas Interaction and VM Handlers

The canvas generates many actions (moveBlock, addWire, deleteWire, selectBlock). These are all triggered by host interaction, not VM handlers. The pack renderer needs to wire canvas callbacks directly to Redux dispatch rather than going through the VM handler round-trip.

This is fine architecturally (the playbook says "host owns interaction"), but it means the renderer has a hybrid dispatch path: some actions come from VM handlers (toolbar buttons), others come from host-internal callbacks (canvas events).

### Risk 2: Block ID Generation

Currently, `SystemModelerFrame` generates block IDs with a local counter (`blk_1`, `blk_2`). In the pack renderer, ID generation needs to be deterministic or host-managed. The VM should not generate IDs.

### Risk 3: Dialog State Management

`showParams` is a mixed concern: it is state (which dialog is open) but it is UI-only (the VM never needs to know a dialog is open). The pack renderer should manage dialog state internally rather than exposing it through semantic state.

### Resolved: Initial Topology Via Model DSL

The model DSL resolves the earlier open question about how the canvas gets its initial topology. Rather than passing topology through `canvas` props or reading purely from semantic state, the `systemModeler.model(...)` node provides a declarative topology definition with explicit reconciliation semantics (seed vs managed). This is cleaner than either alternative because the reconciliation mode is a first-class concept rather than an implicit behavior.

### Open Question: Simulation as a Separate Concern?

The simulation system (run/stop/progress/timer) could be factored into its own concern separate from the block editor. A future port might want a modeler without simulation, or simulation without a modeler. For now, keeping them together in one pack is simpler.
