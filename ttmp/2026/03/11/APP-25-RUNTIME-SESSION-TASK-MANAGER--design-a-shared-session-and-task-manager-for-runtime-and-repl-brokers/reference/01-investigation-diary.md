---
Title: Investigation diary
Ticket: APP-25-RUNTIME-SESSION-TASK-MANAGER
Status: active
Topics:
  - frontend
  - runtime
  - repl
  - debug
  - architecture
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/RuntimeSurfaceDebugWindow.tsx
    Note: Current window that shows why operator views and authoring/debug views should be split.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/debug/jsSessionDebugRegistry.ts
    Note: Current external registry for broker-owned JS session sources.
  - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/jsSessionBroker.ts
    Note: Current plain JS broker that should map into the future task manager.
Summary: Investigation diary for designing a shared task-manager style window that can aggregate runtime-surface sessions, plain JS sessions, and future task sources without collapsing their models.
LastUpdated: 2026-03-11T19:25:00-04:00
WhatFor: Preserve the reasoning behind introducing a task manager instead of continuing to overload Stacks & Cards.
WhenToUse: Use when implementing APP-25 or when deciding where a new broker/task source should surface in operator tooling.
---

# Investigation diary

## Goal

Create a new ticket for a general session/task manager and make the design explicit enough that a new
intern can build it without flattening incompatible session systems into one fake reducer.

## Step 1: Reconfirm the current split

The new `JS Sessions` section in `Stacks & Cards` proved something useful:

- operators do want to see plain JS sessions and runtime-surface sessions side by side
- but those systems still do not belong to the same underlying state model

That means the immediate fix was good, but it also surfaced the need for a more general operator
window.

## Step 2: Reconfirm why Redux is not the answer

The user explicitly asked earlier whether docs or sessions really needed Redux if we already had an
external sync store pattern.

That same conclusion applies here.

`JsSessionBroker` owns:

- live handles
- methods
- subscriptions

Those are not Redux-shaped. The future task manager therefore needs the same broad pattern as the
docs provider system:

- external source objects
- UI-facing summaries
- subscriptions into view state

## Step 3: Name the right abstraction

The important design move was not naming a universal session type. That would be the wrong goal.

The important move was naming a universal operator-source interface.

That is why this ticket uses:

- `TaskManagerSource`
- `TaskManagerRow`
- `TaskManagerAction`

The source owns the real semantics. The row is only a summary object for the UI.

## Step 4: Bound the scope

This ticket is deliberately not trying to solve:

- attach mode
- tool execution pipelines
- full process/task orchestration

It only needs to make the architecture capable of those things later.

The first implementation should stay narrow:

- runtime-surface session source
- JS session source
- one task manager window
- minimal operator actions

That is enough to validate the model without overbuilding it.

## Step 5: Build the summary-model foundation first

I started with the lowest-risk part of the design: the generic source and row model.

The concrete files are now:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/task-manager/types.ts`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/task-manager/taskManagerRegistry.ts`

This proved the key architectural point from the design doc:

- source objects stay behaviorful and external
- rows are plain summaries
- the registry only flattens, subscribes, and routes actions back to the owning source

That kept the implementation out of Redux entirely.

## Step 6: Build the first real sources

After the model was in place, I added the two initial adapters:

- `runtimeSessionSource.ts`
- `jsSessionSource.ts`

The runtime-session adapter currently derives rows from:

- `runtimeSessions.sessions`
- windowing navigation state
- runtime debug bundle metadata

and exposes:

- `open`
- `inspect`

The JS-session adapter derives rows from `JsSessionBroker` summaries and exposes:

- `focus`
- `reset`
- `dispose`

This was the right order because it let me validate the external-source pattern before spending time
on any window UI.

## Step 7: Validate the source layer in isolation

I ran focused tests before building the UI:

- `taskManagerRegistry.test.tsx`
- `runtimeSessionSource.test.tsx`
- `jsSessionSource.test.tsx`

Those tests were important because the whole ticket depends on source independence:

- heterogeneous sources can coexist
- row lists stay stable through subscriptions
- row actions route back to the owning source instead of the window trying to know too much

That foundation is now in place, so the next slice is the actual Task Manager window and `wesen-os`
integration.

## Step 8: Build the window as a separate operator view

The next implementation checkpoint was the actual shared window:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/task-manager/TaskManagerWindow.tsx`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/task-manager/taskManagerApp.tsx`

I deliberately kept it distinct from `Stacks & Cards`:

- source counts and summary text at the top
- explicit search, kind, and status controls
- one mixed table for operator summaries
- no source-code/editor assumptions in the UI itself

That kept the window aligned with the ticket goal: a general operator surface, not another runtime
authoring/debug pane.

## Step 9: Register sources from the host wrapper, not the window package

The `wesen-os` wrapper is now:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/taskManagerModule.tsx`

This wrapper owns:

- the runtime-session source built over the live Redux store
- the JS-session source built over the existing `JS_SESSION_BROKER`
- source registration and cleanup

That was the important ownership decision. `hypercard-runtime` owns the generic window and generic
source abstractions. `wesen-os` owns the concrete source wiring for the launcher app.

## Step 10: Validate in both tests and the browser

I added focused coverage for:

- empty task-manager window state
- mixed runtime/JS rows
- row-action routing
- launcher-module payload/render behavior
- source registration on mount

Then I ran a live browser smoke on `http://localhost:5173` and confirmed:

- the new `Task Manager` icon opens a dedicated window
- a spawned JS session from `JavaScript REPL` appears in the task manager
- opening Inventory `Low Stock` creates a runtime-session row in the task manager

That means APP-25 now has a working end-to-end first slice rather than only architecture docs.

## Step 11: Reduce the `Stacks & Cards` overlap

Once the Task Manager was working, the next question was whether `Stacks & Cards` should still keep
its temporary full `JS Sessions` operator table.

I decided the answer was no.

That table had served its purpose as a bridge, but once Task Manager existed it was duplicating the
same operator role in the wrong window.

So I changed `RuntimeSurfaceDebugWindow.tsx` to:

- keep the JS-session count visible
- explain that JS sessions are broker-owned and managed elsewhere
- offer a direct `Open Task Manager` action

That kept `Stacks & Cards` focused on:

- bundle and surface inspection
- runtime-surface registry state
- built-in source editing
- runtime-session-specific debugging

instead of turning it into a second task manager.

## Step 12: Make the navigation explicit in both directions

After the split, the operator/navigation model became:

- runtime rows in Task Manager:
  - `Open`
  - `Inspect` -> `Stacks & Cards`
- JS rows in Task Manager:
  - `Focus` -> `JavaScript REPL`
  - `Reset`
  - `Dispose`
- `Stacks & Cards`:
  - `Open Task Manager`

This was the right point to stop. The tooling now has a clear division of labor instead of one
window continuously accreting unrelated responsibilities.
