---
Title: Hypothetical API walkthrough for icon folder and window harnesses
Ticket: APP-29-OBJECT-HARNESS-RUNTIME-ARCHITECTURE--design-object-harness-runtime-reorganization-for-hypercard-frontend
Status: active
Topics:
    - frontend
    - architecture
    - runtime
    - documentation
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026/03/12/APP-29-OBJECT-HARNESS-RUNTIME-ARCHITECTURE--design-object-harness-runtime-reorganization-for-hypercard-frontend--design-object-harness-and-runtime-reorganization-for-hypercard-frontend/design-doc/02-intern-q-and-a-on-harnesses-objects-instances-and-activations.md
      Note: Follow-up conceptual clarifications this walkthrough builds on.
    - Path: workspace-links/go-go-os-frontend/packages/engine/src/desktop/core/state/windowingSlice.ts
      Note: Current window host lifecycle reference used to contrast the clean-sheet design.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts
      Note: Current example of a handler-to-operation broker pattern that informs the intent execution split.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Current window-surface-centric host path that the hypothetical design is intentionally decoupled from.
ExternalSources: []
Summary: Standalone hypothetical design walkthrough for an idealized object, icon, folder, and window harness system using handler-to-intent APIs and a simple UI DSL.
LastUpdated: 2026-03-13T00:05:00-04:00
WhatFor: Capture a clean-sheet ideal API for icon, folder, and window harnesses so the design can be refined independent of current implementation constraints.
WhenToUse: Use when refining the target object model, icon and folder harness contracts, class object defaults, or same-window navigation behavior.
---


# Hypothetical API walkthrough for icon folder and window harnesses

## Executive Summary

This document is intentionally hypothetical. It assumes we are designing the ideal system from scratch rather than incrementally adapting the current codebase. The goal is to make the target behavior concrete enough that future design discussions can reference one shared, standalone artifact.

The model in this document is built around three core ideas:

- objects are the primary things in the system,
- harnesses are contracts plus host-side drivers that expose objects in different ways,
- object interactions return intents rather than directly mutating global UI state.

The walkthrough centers on a concrete example:

- the desktop shows an `Inventory` icon,
- clicking it opens a folder view,
- the folder lists child objects that support the icon harness,
- clicking `Home` launches a window,
- that window renders a simple button/text/table DSL,
- navigation inside the window stays within the same live running context unless the object explicitly asks for a new window.

This document also makes one simplification explicit: the folder harness does not need custom per-entry behavior beyond listing objects. It only needs to ask for a list of objects to display, and it renders them if they support the icon harness.

## Problem Statement

If we want a clean object-centric operating environment, we need a way to support at least three distinct presentation and interaction styles:

- icon presentation on a desktop or inside folders,
- folder presentation for containers and namespaces,
- window presentation for interactive live objects.

The architecture problem is that these three presentations should not collapse into one another.

In particular:

- a folder is not a window,
- an icon is not a folder,
- an object should not need to fake a surface or fake a window just to be listed in a folder,
- starting a class-like object should feel like “launching a program,”
- navigating inside an app window should not require spawning new windows for every sub-object.

The system therefore needs a clean set of harness contracts that all follow the same interaction pattern:

1. host calls object handler
2. object returns intents
3. host executes intents

## Architecture Intro

The architecture assumed by this document is:

- `module object`: a container or namespace object such as `inventory`
- `class object`: an object with `instantiate`, such as `inventory.home`
- `instance object`: a live object identity created from a class object
- `activation`: the running execution container for a live instance
- `icon harness`: how an object appears and reacts as an icon
- `folder harness`: how a container object exposes child objects
- `window harness`: how a live instance renders and handles UI interaction
- `runtime`: the executor that evaluates instance logic and window rendering

The most important design choice in this document is this:

- class objects implement the icon harness by default,
- folder harness only lists objects and relies on icon harness support for display and open behavior,
- window harness attaches to a live instance or activation rather than directly to an abstract class object.

That creates a clean progression:

```text
module object -> folder harness -> class object icon -> instantiate -> live instance -> window harness
```

## Proposed Solution

### Object Hierarchy In The Example

The inventory example can be modeled like this:

```text
inventory                      module object
  ├── folder harness
  ├── icon harness
  ├── children:
  │     ├── inventory.home         class object
  │     ├── inventory.products     class object
  │     ├── inventory.suppliers    class object
  │     └── inventory.low-stock    class object
  └── docs / source / metadata
```

And the class objects behave like this:

```text
inventory.home                 class object
  ├── instantiate()
  ├── icon harness (default)
  ├── docs / source / metadata
  └── produces a live instance

inventory.home#instance-1      live instance
  ├── attached to one activation
  ├── supports window harness
  ├── renders UI DSL
  └── handles intents such as button clicks and table row clicks
```

### User Experience Flow

The user flow is:

1. Desktop shows `Inventory` as an icon.
2. User clicks or double-clicks `Inventory`.
3. System opens a folder harness over `inventory`.
4. Folder harness asks for child objects.
5. Folder renders those child objects as icons if they support the icon harness.
6. User clicks `Home`.
7. `Home` icon harness returns an intent to instantiate itself and open a window.
8. System creates a live instance and activation.
9. Window harness attaches.
10. The instance returns a simple UI DSL.
11. Clicking buttons or table rows sends handler calls back to the same instance.
12. Navigation stays in the same window unless the instance returns an intent requesting a second window.

## Core Design Rule

### Folder Harness Rule

The folder harness is deliberately minimal.

It only does this:

- ask the container object for a list of child objects,
- display those child objects if they support the icon harness,
- delegate interaction to the icon harness of the child object.

It does not need custom open logic for each child.

That means the folder harness contract can stay very small.

## Icon Harness

The icon harness answers two questions:

- how should this object look when displayed as an icon?
- what intents should result from icon interactions?

### Suggested Interface

```ts
interface IconViewModel {
  title: string;
  subtitle?: string;
  emoji?: string;
  badge?: string;
  canOpen?: boolean;
  canOpenAsFolder?: boolean;
  canOpenAsWindow?: boolean;
}

interface IconHandleInput {
  action: 'singleClick' | 'doubleClick' | 'contextAction';
  location: 'desktop' | 'folder' | 'search';
  contextActionId?: string;
}

interface HarnessIntent {
  type: string;
  payload?: unknown;
}

interface IconHarness {
  icon_get_view(): IconViewModel;
  icon_handle(input: IconHandleInput): HarnessIntent[];
}
```

### Example: Module Object `inventory`

```ts
const inventoryModule = {
  id: 'inventory',

  icon_get_view() {
    return {
      title: 'Inventory',
      emoji: '📦',
      canOpen: true,
      canOpenAsFolder: true,
      canOpenAsWindow: false,
    };
  },

  icon_handle(input) {
    if (input.action === 'doubleClick') {
      return [
        {
          type: 'object.open-folder',
          payload: { objectId: 'inventory' },
        },
      ];
    }

    if (input.action === 'contextAction' && input.contextActionId === 'open-home') {
      return [
        {
          type: 'object.spawn-window',
          payload: { classObjectId: 'inventory.home' },
        },
      ];
    }

    return [];
  },
};
```

### Example: Class Object `inventory.home`

```ts
const inventoryHomeClass = {
  id: 'inventory.home',

  instantiate(args) {
    return createInventoryHomeInstance(args);
  },

  icon_get_view() {
    return {
      title: 'Home',
      emoji: '🏠',
      canOpen: true,
      canOpenAsWindow: true,
    };
  },

  icon_handle(input) {
    if (input.action === 'doubleClick') {
      return [
        {
          type: 'object.spawn-window',
          payload: {
            classObjectId: 'inventory.home',
            reusePolicy: 'focus-or-create',
          },
        },
      ];
    }

    return [];
  },
};
```

## Folder Harness

The folder harness should be smaller than the icon harness.

It only needs to answer:

- which child objects should be displayed?

### Suggested Interface

```ts
interface FolderChildObjectRef {
  objectId: string;
}

interface FolderViewModel {
  title: string;
  children: FolderChildObjectRef[];
}

interface FolderHarness {
  folder_get_view(): FolderViewModel;
}
```

That is enough because:

- the folder host can resolve each child object,
- the folder host can check whether that child supports the icon harness,
- the folder host can render the child using `icon_get_view()`,
- the folder host can delegate child clicks to `icon_handle()`.

### Example: `inventory` Folder View

```ts
const inventoryModule = {
  id: 'inventory',

  folder_get_view() {
    return {
      title: 'Inventory',
      children: [
        { objectId: 'inventory.home' },
        { objectId: 'inventory.products' },
        { objectId: 'inventory.suppliers' },
        { objectId: 'inventory.low-stock' },
      ],
    };
  },
};
```

### Why This Is Better

This keeps the folder harness from becoming a second startup-semantics system.

The folder host does not need special logic such as:

- “if this child is a class, open window”
- “if this child is a module, open folder”

Instead, the child object itself decides that via its icon harness.

That gives one unified open behavior across:

- desktop icons,
- folder icons,
- search results,
- future launcher palettes.

## Window Harness And UI DSL

The window harness attaches to a live instance or activation, not directly to a class object.

That instance returns a simple UI DSL.

### Minimal UI DSL

```ts
type UiNode =
  | { type: 'page'; title: string; body: UiNode[] }
  | { type: 'text'; text: string }
  | { type: 'button'; id: string; label: string }
  | { type: 'buttonRow'; buttons: { id: string; label: string }[] }
  | { type: 'table'; columns: string[]; rows: string[][]; onRowClick?: string }
  | { type: 'stack'; children: UiNode[] }
  | { type: 'section'; title: string; body: UiNode[] };
```

### Window Harness Target

```ts
interface WindowHarnessTarget {
  render(state: unknown): UiNode;
  handleIntent(intent: WindowIntent, state: unknown): HarnessIntent[];
}

interface WindowIntent {
  type: 'button.click' | 'table.row.click';
  id?: string;
  handler?: string;
  row?: string[];
}
```

### Example: `inventory.home` Instance

```ts
const inventoryHomeInstance = {
  render(state) {
    return {
      type: 'page',
      title: 'Inventory Home',
      body: [
        { type: 'text', text: 'Choose an area' },
        {
          type: 'buttonRow',
          buttons: [
            { id: 'go_products', label: 'Products' },
            { id: 'go_suppliers', label: 'Suppliers' },
            { id: 'go_low_stock', label: 'Low Stock' },
          ],
        },
        {
          type: 'table',
          columns: ['Area', 'Count'],
          rows: [
            ['Products', '1284'],
            ['Suppliers', '42'],
            ['Low Stock', '18'],
          ],
          onRowClick: 'open_area',
        },
      ],
    };
  },

  handleIntent(intent, state) {
    if (intent.type === 'button.click' && intent.id === 'go_products') {
      return [
        {
          type: 'window.navigate',
          payload: { route: 'products' },
        },
      ];
    }

    if (intent.type === 'table.row.click' && intent.handler === 'open_area' && intent.row?.[0]) {
      return [
        {
          type: 'window.navigate',
          payload: { route: intent.row[0].toLowerCase() },
        },
      ];
    }

    return [];
  },
};
```

## Intent Vocabulary

The system only stays clean if intents are explicit.

### Required Intents

#### Open Folder

```ts
{
  type: 'object.open-folder',
  payload: {
    objectId: 'inventory',
  },
}
```

#### Spawn Instance And Open Window

```ts
{
  type: 'object.spawn-window',
  payload: {
    classObjectId: 'inventory.home',
    args: {},
    reusePolicy: 'focus-or-create',
  },
}
```

#### Navigate Within Existing Window

```ts
{
  type: 'window.navigate',
  payload: {
    route: 'products',
  },
}
```

#### Focus Existing Window

```ts
{
  type: 'object.focus-window',
  payload: {
    activationKey: 'inventory.home:main-user',
  },
}
```

### Why These Intents Matter

They keep the object logic declarative.

Objects do not directly:

- open windows,
- mutate desktop state,
- mutate folder state,
- create DOM.

They only request those outcomes.

## Class Objects As Default Icons

This is the most important default behavior in the design.

### Rule

Every class object should implement the icon harness by default.

Why:

- class objects are naturally startable,
- they behave like applications, tools, or documents that can be launched,
- this gives the user a consistent desktop and folder model.

### Default Behavior For Class Objects

- single click selects
- double click instantiates and opens
- context menu can expose:
  - `Open`
  - `Open New`
  - `Show Info`

### Default Implementation Sketch

```ts
function createDefaultClassIconHarness(classObject) {
  return {
    icon_get_view() {
      return {
        title: classObject.getTitle(),
        emoji: classObject.getEmoji?.() ?? '📄',
        canOpen: true,
        canOpenAsWindow: true,
      };
    },

    icon_handle(input) {
      if (input.action === 'doubleClick') {
        return [
          {
            type: 'object.spawn-window',
            payload: {
              classObjectId: classObject.id,
              reusePolicy: 'focus-or-create',
            },
          },
        ];
      }

      return [];
    },
  };
}
```

This means the objects shown inside `Inventory` folder are exactly the class objects such as `inventory.home` and `inventory.products`.

## Full Walkthrough 1: Desktop Icon To Folder

### User Action

The user double-clicks the `Inventory` icon on the desktop.

### Host Flow

```text
desktop host
  -> resolve object inventory
  -> call inventory.icon_handle({ action: 'doubleClick', location: 'desktop' })
  -> receive [object.open-folder]
  -> execute object.open-folder
  -> open folder harness over inventory
```

### Result

A folder opens showing child objects.

## Full Walkthrough 2: Folder To Class Object Icon

### Folder Host Flow

```text
folder host
  -> call inventory.folder_get_view()
  -> receive children:
     inventory.home
     inventory.products
     inventory.suppliers
     inventory.low-stock
  -> resolve each child object
  -> if child supports icon harness:
       render icon via icon_get_view()
```

### Resulting Folder UI

```text
Inventory
  [🏠 Home] [📋 Products] [🏭 Suppliers] [⚠️ Low Stock]
```

## Full Walkthrough 3: Folder Icon To Window

### User Action

The user double-clicks `Home` inside the folder.

### Host Flow

```text
folder host
  -> resolve object inventory.home
  -> call inventory.home.icon_handle({ action: 'doubleClick', location: 'folder' })
  -> receive [object.spawn-window]
  -> execute object.spawn-window
     -> instantiate inventory.home
     -> create activation
     -> attach window harness
     -> open window
```

### Why This Is Clean

The folder did not need to know what `Home` was beyond:

- it is an object,
- it supports the icon harness.

All startup semantics stayed with the object itself.

## Full Walkthrough 4: Window Navigation Within Same Activation

### Initial Window

The `Home` instance renders:

```text
Inventory Home

Choose an area

[Products] [Suppliers] [Low Stock]

+-----------+-------+
| Area      | Count |
+-----------+-------+
| Products  | 1284  |
| Suppliers | 42    |
| Low Stock | 18    |
+-----------+-------+
```

### User Clicks `Products`

```text
window host
  -> call instance.handleIntent({ type: 'button.click', id: 'go_products' }, state)
  -> receive [window.navigate(route='products')]
  -> update route inside same activation/window
  -> call render() again
```

### Updated Window

```text
Products

[Back] [Suppliers] [Low Stock]

+--------+----------------+----------+
| SKU    | Name           | Quantity |
+--------+----------------+----------+
| A-100  | Blue Widget    | 31       |
| A-101  | Red Widget     | 14       |
| A-102  | Green Widget   | 9        |
+--------+----------------+----------+
```

### Key Point

Navigation within the app stays in one window and one activation by default.

That means:

- no unnecessary process churn,
- no unnecessary window churn,
- better mental model for the user,
- state continuity across pages.

## Worked Object Definitions

### Inventory Module Object

```ts
const inventoryModule = {
  id: 'inventory',

  listHarnesses() {
    return ['icon.v1', 'folder.v1'];
  },

  icon_get_view() {
    return {
      title: 'Inventory',
      emoji: '📦',
      canOpenAsFolder: true,
    };
  },

  icon_handle(input) {
    if (input.action === 'doubleClick') {
      return [
        {
          type: 'object.open-folder',
          payload: { objectId: 'inventory' },
        },
      ];
    }
    return [];
  },

  folder_get_view() {
    return {
      title: 'Inventory',
      children: [
        { objectId: 'inventory.home' },
        { objectId: 'inventory.products' },
        { objectId: 'inventory.suppliers' },
        { objectId: 'inventory.low-stock' },
      ],
    };
  },
};
```

### Inventory Home Class Object

```ts
const inventoryHomeClass = {
  id: 'inventory.home',

  listHarnesses() {
    return ['icon.v1'];
  },

  instantiate(args) {
    return createInventoryHomeInstance(args);
  },

  icon_get_view() {
    return {
      title: 'Home',
      emoji: '🏠',
      canOpenAsWindow: true,
    };
  },

  icon_handle(input) {
    if (input.action === 'doubleClick') {
      return [
        {
          type: 'object.spawn-window',
          payload: {
            classObjectId: 'inventory.home',
            reusePolicy: 'focus-or-create',
          },
        },
      ];
    }

    return [];
  },
};
```

### Inventory Home Instance

```ts
function createInventoryHomeInstance() {
  return {
    route: 'home',

    listHarnesses() {
      return ['window.v1'];
    },

    render(state) {
      if (state.route === 'products') {
        return renderProductsPage(state);
      }
      return renderHomePage(state);
    },

    handleIntent(intent, state) {
      if (intent.type === 'button.click' && intent.id === 'go_products') {
        return [
          {
            type: 'window.navigate',
            payload: { route: 'products' },
          },
        ];
      }
      return [];
    },
  };
}
```

## Host Responsibilities

### Desktop Host

Responsible for:

- rendering top-level icons,
- sending icon harness interactions,
- executing intents such as `object.open-folder` and `object.spawn-window`.

### Folder Host

Responsible for:

- asking a container object for child objects,
- filtering or displaying only children that support the icon harness,
- rendering those children as icons,
- delegating clicks back to the child icon harness,
- executing resulting intents.

### Window Host

Responsible for:

- attaching to a live instance or activation,
- calling `render()` to obtain the UI DSL,
- converting UI events into normalized intents,
- sending those intents back to the instance,
- executing returned navigation or window-management intents.

## Design Decisions

### Decision: Folder Harness Only Lists Child Objects

Rationale:

- keeps the folder harness minimal,
- avoids duplicating icon-open behavior,
- ensures open behavior lives with the child object itself.

### Decision: Class Objects Implement Icon Harness By Default

Rationale:

- class objects are naturally launchable,
- this matches desktop metaphors well,
- it allows one uniform open model across desktop, folder, and search results.

### Decision: Navigation Stays In One Window By Default

Rationale:

- better state continuity,
- simpler user mental model,
- fewer windows and activations unless explicitly requested.

### Decision: Objects Return Intents Rather Than Directly Opening UI

Rationale:

- keeps objects declarative,
- centralizes host-side execution and policy,
- makes behavior easier to test.

## Alternatives Considered

### Alternative 1: Folder Harness Returns Full Per-Entry Behavior

Rejected because it duplicates behavior that should already live on child objects through the icon harness.

### Alternative 2: Folder Opens Child Objects Directly Without Using Icon Harness

Rejected because it creates two separate startup paths:

- one for desktop icons,
- one for folder entries.

That would make the system inconsistent.

### Alternative 3: Every Navigation Target Opens A New Window

Rejected because it makes normal application navigation feel fragmented and heavy.

## Implementation Plan

If this design were implemented from scratch, the work would break down like this:

1. Define base object interfaces.
2. Define `icon.v1` harness contract.
3. Define `folder.v1` harness contract with child object listing only.
4. Define `window.v1` harness contract and simple UI DSL.
5. Define system intent vocabulary for opening folders, spawning windows, focusing windows, and in-window navigation.
6. Give all class objects a default icon harness implementation.
7. Build desktop host, folder host, and window host around the same handler-to-intent model.
8. Add reuse policies such as `focus-or-create` for class object startup.

## Open Questions

- Should single-click on a module icon select and double-click open, or should single-click open folders in some contexts?
- Should class objects always default to `focus-or-create`, or should some default to `open-new`?
- Should in-window navigation be modeled as internal route state or as explicit navigation intents only?
- How should search results interact with the same icon harness semantics?

## References

- `01-intern-guide-to-object-harness-runtime-session-surface-and-artifact-architecture-cleanup.md`
- `02-intern-q-and-a-on-harnesses-objects-instances-and-activations.md`
