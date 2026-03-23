---
Title: Implementation diary
Ticket: APP-14-RICH-WIDGET-DSL-PACKS
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Bootstrap helper boundary reviewed while framing injected rich-widget packs
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoard.tsx
      Note: Primary case-study file examined during Kanban decomposition analysis
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/kanbanState.ts
      Note: Reducer layer reviewed for serializable VM-controlled state design
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/launcher/modules.tsx
      Note: Merge-resolved launcher registry that prompted the follow-on rich-widget DSL design discussion
ExternalSources: []
Summary: Diary for the APP-14 design work that maps the current rich-widget architecture, connects it to APP-07 and APP-11 runtime-pack research, and uses Kanban Board as the concrete VM-control case study.
LastUpdated: 2026-03-09T19:32:54.728724092-04:00
WhatFor: Record how the rich-widget DSL-pack question was framed, which files and prior tickets shaped the design, and how the Kanban refactor plan was derived.
WhenToUse: Use when continuing APP-14, reviewing why Kanban was chosen as the case study, or converting this design work into implementation tickets.
---


# Implementation diary

## Goal

Capture the design and planning work for turning rich widgets into VM-controllable runtime packs, with enough implementation detail that another engineer can continue the work without re-deriving the Kanban decomposition or the runtime-pack rationale.

## Step 1: Establish The Ticket And Trace The Existing Runtime-Pack Seams

I started by checking whether this should be an appendix to APP-07 or APP-11, or a new ticket. APP-07 already explains the runtime-pack idea and APP-11 already simplifies the VM boundary, but neither one drills into how a real rich widget should be split so a VM can control it safely. That meant this needed its own follow-on ticket rather than another generic note.

I then re-read the current runtime-pack research and inspected the current rich-widget code, especially the Kanban Board and the launcher wiring. The goal was to make the guide concrete: not "we could maybe expose richer widgets," but "here is exactly how one current rich widget should be decomposed into domain state, reusable React view parts, and a VM-facing DSL pack."

### Prompt Context

**User prompt (verbatim):** "yes, and use the Kanban Board rich widget as a case study of something I want to control with a DSL (reusing the base widgets and handlers, etc...).

C
  Create a detailed analysis / design / implementation / implementation guide that is very detailed for a
  new intern, explaining all the parts of the system needed to understand what it is, with prose
  paragraphs and bullet point sand pseudocode and diagrams and api references and file
    references.
    It should be very clear and detailed."

**Assistant interpretation:** Create a new design ticket and long-form intern guide that explains how the existing HyperCard runtime can control richer widgets, using Kanban Board as the concrete example.

**Inferred user intent:** Move from the generic "runtime packs" idea into a design that is implementable against the current rich-widget codebase and can later drive real refactoring work.

**Commit (code):** `b409ac2` - `Add APP-14 rich widget DSL pack design`

### What I did

- Created APP-14 as a dedicated ticket instead of overloading APP-07 or APP-11.
- Re-read the existing runtime-pack design in APP-07.
- Re-read the simplified VM-boundary design in APP-11.
- Inspected:
  - `packages/rich-widgets/src/kanban/KanbanBoard.tsx`
  - `packages/rich-widgets/src/kanban/kanbanState.ts`
  - `packages/rich-widgets/src/kanban/types.ts`
  - `packages/rich-widgets/src/kanban/sampleData.ts`
  - `packages/rich-widgets/src/primitives/WidgetToolbar.tsx`
  - `packages/rich-widgets/src/primitives/ButtonGroup.tsx`
  - `packages/rich-widgets/src/primitives/SearchBar.tsx`
  - `packages/rich-widgets/src/launcher/modules.tsx`
  - `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
- Expanded the new ticket task list so the design explicitly includes a Kanban refactor plan.

### Why

- APP-07 proves the runtime-pack concept, but it is still mostly platform-level.
- APP-11 gives the runtime the right boundary, but it does not answer how to expose a rich widget without shoving React and local component logic into QuickJS.
- Kanban is a good case study because it already has serializable state, a reducer, and obvious reusable subviews.

### What worked

- The current Kanban widget is better factored than many of the other rich widgets. Its reducer and seed shape already look like something a VM could target.
- APP-07 and APP-11 line up well as prerequisites:
  - APP-07 explains runtime packs and helper-package injection
  - APP-11 explains why the VM must only see semantic `state` plus `dispatch(action)`

### What didn't work

- N/A

### What I learned

- The main missing piece is not another runtime abstraction. It is a view-layer split inside the widget package.
- The current Kanban component still mixes:
  - reducer-driven state updates
  - reusable toolbar/status/card rendering
  - drag-and-drop DOM behavior
  - modal orchestration
- That is exactly why Kanban is a useful case study.

### What was tricky to build

- The tricky part was deciding whether the case study should recommend exposing one giant `widgets.kanban.board(...)` helper or a more granular component family.
- A single giant helper is easier to get working, but it would repeat the same mistake the old runtime API made: too much implicit host structure and not enough reusable surface.
- The guide therefore needs to argue for a layered answer:
  - shared Kanban domain state
  - shared Kanban view parts
  - a pack-level DSL that composes those parts

### What warrants a second pair of eyes

- The eventual implementation will need careful review around drag-and-drop and modal behavior, because those are the two places where DOM-specific mechanics can leak back into the pack design.

### What should be done in the future

- Finish the long-form APP-14 design doc.
- Split the Kanban refactor into implementation slices after the design is reviewed.

### Code review instructions

- Start with the APP-14 design doc once written.
- Then review:
  - `packages/rich-widgets/src/kanban/KanbanBoard.tsx`
  - `packages/rich-widgets/src/kanban/kanbanState.ts`
  - `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`

### Technical details

- Ticket creation:

```bash
docmgr ticket create-ticket \
  --ticket APP-14-RICH-WIDGET-DSL-PACKS \
  --title "Design VM-controlled rich widget DSL packs with Kanban as case study" \
  --topics architecture,frontend,hypercard,wesen-os
```

- Document creation:

```bash
docmgr doc add --ticket APP-14-RICH-WIDGET-DSL-PACKS --doc-type design-doc --title "Intern guide to VM-controlled rich widget DSL packs and Kanban widget migration"
docmgr doc add --ticket APP-14-RICH-WIDGET-DSL-PACKS --doc-type reference --title "Implementation diary"
```

## Step 2: Expand The Scope To Explicit Kanban Refactoring

After the initial ticket framing, the scope tightened further: this should not stop at describing a future DSL. The design needs to treat Kanban as a real refactor target and show how to split the current widget into VM-usable components and host-owned behavior.

That changed the task list materially. Instead of a generic "runtime packs" guide, APP-14 now has to explain the exact Kanban decomposition: which pieces remain domain logic, which become reusable presentational view parts, which remain host-only bridges, and which new DSL nodes/helpers should exist for the VM.

### Prompt Context

**User prompt (verbatim):** "this includes splitting and refactoring the kanban board widgets appropriately as well, to split it into VM usable components and code."

**Assistant interpretation:** Treat the Kanban case study as a real implementation target and include the widget refactor plan directly in the design, not as an optional future note.

**Inferred user intent:** Ensure the design is implementation-oriented and grounded in the current codebase, so the later refactor can proceed in focused slices.

**Commit (code):** N/A

### What I did

- Reframed the design around a concrete three-layer split for Kanban:
  - domain state and actions
  - reusable presentational view parts
  - runtime-pack renderer/DSL helpers
- Updated `tasks.md` so the Kanban refactor is a first-class slice.
- Planned the guide sections around:
  - current Kanban anatomy
  - target runtime-pack model
  - target file decomposition
  - action and renderer contracts

### Why

- Without the explicit Kanban split, the design would still be too abstract and future implementation would drift.
- The user wants reuse of base widgets and handlers, not a separate fake VM-only widget system.

### What worked

- The current Kanban code already suggests a clean split:
  - `kanbanState.ts` is serializable and reducer-driven
  - `TaskCard`, `TaskModal`, and the board sections are visible extraction seams
  - `WidgetToolbar`, `Separator`, and `WidgetStatusBar` are already reusable primitives
- The APP-11 state/action contract makes the VM side much easier to reason about because the DSL can target semantic actions instead of four legacy dispatch helpers.

### What didn't work

- N/A

### What I learned

- The future DSL should not try to "render React." It should emit structured nodes that the host renderer maps onto split Kanban view parts.
- Drag-and-drop is the strongest argument for keeping some behavior host-owned even when the overall board becomes VM-controlled.

### What was tricky to build

- The tricky part is balancing two risks:
  - too little decomposition, which produces one opaque `kanban.board` node that is hard to extend
  - too much decomposition, which forces the VM to micromanage low-level presentational details
- The design therefore needs a middle layer: a Kanban-specific widget family with a few structured nodes and a host renderer that still reuses rich-widget primitives and extracted view components.

### What warrants a second pair of eyes

- The eventual Kanban split should be reviewed for whether `TaskModal` becomes a pack node, a host overlay helper, or both.
- Drag/drop behavior should be reviewed carefully so the DSL event model does not become DOM-shape-dependent.

### What should be done in the future

- Turn the APP-14 implementation plan into one or more code tickets once the design is reviewed.

### Code review instructions

- Review `tasks.md` alongside the design doc to confirm the refactor slices are concrete enough to implement.

### Technical details

- Scope adjustment recorded in `tasks.md` and the APP-14 changelog.

## Step 3: Finalize The Intern Guide And Relate It To Runtime And Kanban Sources

After the scope and structure were clear, I replaced the generic design-doc template with the actual intern guide and then tightened the ticket metadata around it. This step matters because APP-14 is meant to be actionable: another engineer should be able to start from the guide, inspect the linked runtime and Kanban files, and turn the design into implementation tickets without redoing the discovery work.

I treated the guide as the source of truth for this ticket rather than as a rough note. That meant checking that the document does not stop at broad architecture language. It now names the runtime-pack contract, the Kanban file split, the VM-visible node family, the host responsibilities, and the phased implementation order. I then related the relevant files directly to the design doc and diary so `docmgr` search and review flows can find the right code quickly.

### Prompt Context

**User prompt (verbatim):** (same as Step 1 and Step 2)

**Assistant interpretation:** Finish the APP-14 ticket as a detailed implementation-oriented guide, with the Kanban widget explicitly decomposed into VM-usable layers and the ticket metadata kept consistent.

**Inferred user intent:** Produce a durable, intern-usable reference that can drive later code tickets for rich-widget packs instead of leaving the idea as a verbal plan.

**Commit (code):** N/A

### What I did

- Replaced the APP-14 design-doc template with a detailed guide covering:
  - current runtime anatomy
  - runtime-pack contract design
  - Kanban decomposition
  - VM-facing DSL nodes and helper APIs
  - state and action contracts
  - diagrams
  - phased implementation plan and validation strategy
- Related the design doc to:
  - APP-07 design research
  - APP-11 runtime-boundary design
  - `stack-bootstrap.vm.js`
  - `PluginCardSessionHost.tsx`
  - `KanbanBoard.tsx`
  - `kanbanState.ts`
  - `types.ts`
  - `WidgetToolbar.tsx`
- Related the diary to the key runtime and Kanban files that shaped the analysis.
- Updated the task checklist and changelog so the ticket reflects the design work that actually landed.

### Why

- A long-form design doc is much less useful if it is not tied directly to the source files it analyzes.
- The Kanban case study only becomes implementation-ready once the target split, helper surface, and host-owned seams are named explicitly.
- The ticket needs to stand on its own for future implementation work, not depend on memory of this conversation.

### What worked

- The APP-07 and APP-11 research provided a stable base, so APP-14 could focus on making the runtime-pack and widget-splitting strategy concrete instead of re-arguing the whole runtime architecture.
- The current Kanban reducer and type files are already a good match for the proposed serializable domain layer.
- `docmgr doc relate` cleanly connected the guide and diary to the relevant runtime and widget files.

### What didn't work

- N/A

### What I learned

- The most important design move is not "add a bigger widget API." It is creating the middle layer of extracted view parts that both the ordinary launcher and the future runtime-pack renderer can share.
- Kanban is a strong proving ground because it exercises filtering, modals, drag/drop, and board-level summaries without requiring raw browser APIs inside the VM.

### What was tricky to build

- The hardest part of the guide was keeping the Kanban split concrete without over-specifying the final DSL syntax too early.
- If the guide were too abstract, it would not help with implementation. If it were too syntactically rigid, it would lock the future implementation into arbitrary helper signatures before the renderer/schema work exists.
- I handled that by naming the stable architectural pieces:
  - files and layers that should exist
  - node families the renderer should understand
  - semantic action names and state slices
  - validation and test surfaces

### What warrants a second pair of eyes

- The proposed Kanban node family should be reviewed alongside the current `KanbanBoard.tsx` implementation to confirm it is neither too granular nor too opaque.
- The suggested host ownership of drag/drop and modal lifecycle should be reviewed during implementation tickets, because those are the easiest places to accidentally smuggle DOM detail into the VM contract.

### What should be done in the future

- Split the APP-14 implementation plan into focused code tickets:
  - Kanban extraction into view parts
  - rich-widget pack schema and renderer support
  - prompt-pack updates and examples
  - integration tests across runtime and rich widgets

### Code review instructions

- Start with `design-doc/01-intern-guide-to-vm-controlled-rich-widget-dsl-packs-and-kanban-widget-migration.md`.
- Verify the related source files match the proposed split:
  - `packages/rich-widgets/src/kanban/KanbanBoard.tsx`
  - `packages/rich-widgets/src/kanban/kanbanState.ts`
  - `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
- Check `tasks.md` and `changelog.md` to confirm the ticket bookkeeping matches the scope of the guide.

### Technical details

- Related files:

```bash
docmgr doc relate --doc ttmp/.../design-doc/01-intern-guide-to-vm-controlled-rich-widget-dsl-packs-and-kanban-widget-migration.md \
  --file-note "/abs/path/to/KanbanBoard.tsx:Current monolithic Kanban implementation analyzed and proposed for decomposition" \
  --file-note "/abs/path/to/kanbanState.ts:Reducer-backed domain state that anchors the proposed VM-friendly split" \
  --file-note "/abs/path/to/stack-bootstrap.vm.js:Current QuickJS bootstrap boundary that constrains helper injection"
```

- Validation:

```bash
docmgr doctor --ticket APP-14-RICH-WIDGET-DSL-PACKS --stale-after 30
```

- Ticket commit:

```bash
git -C /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server commit -m "Add APP-14 rich widget DSL pack design"
```

## Step 4: Tighten The Design Around `runtime.pack` And `kanban.v1`

After the guide was written, the remaining ambiguity was not about Kanban decomposition. It was about contract selection. The original draft still spoke in terms of a broad rich-widget pack family, which is directionally correct but too vague for implementation. The missing step was to decide how the system should know which pack is active and whether that required a second artifact kind.

I resolved that by tightening the design toward the smallest viable explicit contract. The recommendation is now: keep `hypercard.card.v2` as the envelope, add `runtime.pack` as a discriminator, and make `kanban.v1` the first real pack. That keeps the current projection pipeline mostly intact while making prompt policy, helper injection, validation, and rendering select the same concrete contract.

### Prompt Context

**User prompt (verbatim):** "let's add the discribimator, and make a kanban.v1 pack. update the doc and tasks (if they exists already)"

**Assistant interpretation:** Update APP-14 so the design explicitly uses a pack discriminator and names `kanban.v1` as the first implemented pack, then reflect that direction in the ticket task list.

**Inferred user intent:** Remove the last architectural ambiguity before implementation starts, so the next code tickets can wire one clear discriminator and one concrete pack instead of debating a generic abstraction.

**Commit (code):** N/A

### What I did

- Updated the design doc to say:
  - the artifact should carry explicit `runtime.pack` metadata
  - the first concrete runtime pack should be `kanban.v1`
  - `hypercard.card.v2` can remain the base envelope for now
  - artifact projection should persist pack metadata alongside runtime code
- Updated the implementation plan so Phase 2 is about the discriminator and `kanban.v1` pack contract, not a hypothetical `rich.widgets.v1`.
- Added a new set of unchecked follow-up tasks for:
  - `runtime.pack` metadata
  - artifact projection `packId`
  - runtime-pack registry wiring
  - prompt-policy updates
  - pack-aware bootstrap and renderer selection
- Updated the changelog to capture the design refinement.

### Why

- The generic “rich widget pack” wording was still too broad for implementation.
- The current system already has a working `hypercard.card.v2` projection pipeline, so the cheapest explicit selection mechanism is metadata, not a second artifact pipeline.
- `kanban.v1` is a better first pack name because it makes the contract concrete and reviewable.

### What worked

- The APP-11 boundary simplification still fits cleanly: one projected `state`, one `dispatch(action)`, and the pack only changes helper/renderer/validation selection.
- The current artifact pipeline is narrow enough that storing `packId` next to `runtimeCardId` and `runtimeCardCode` is a straightforward conceptual extension.

### What didn't work

- N/A

### What I learned

- The important abstraction is not “generic widget pack” at the start. It is “explicit pack selection with one concrete contract.”
- Separate artifact kinds are a second-order concern. The first-order concern is making the active contract explicit.

### What was tricky to build

- The tricky part was avoiding a fake simplification. Renaming `rich.widgets.v1` to `kanban.v1` alone would not have been enough.
- The actual architectural change is pairing the concrete pack name with a discriminator field and making the runtime pipeline responsible for honoring it.
- That is why the task list now includes projection and renderer-selection work, not just naming changes in the design doc.

### What warrants a second pair of eyes

- The exact location of `runtime.pack` in the emitted YAML should be reviewed when the implementation ticket starts, especially if there are downstream consumers that assume today’s minimal envelope shape.
- The runtime-pack registry API should be reviewed so it does not grow into another compatibility layer or hidden indirection point.

### What should be done in the future

- Open the implementation ticket that adds `runtime.pack` to artifact projection and wires `kanban.v1` through prompt policy, registry selection, bootstrap helpers, and rendering.

### Code review instructions

- Re-read the “Recommended runtime pack model,” “Decision 5,” and “Phase 2/3/4” sections in the APP-14 design doc.
- Verify that `tasks.md` now contains explicit implementation follow-ups for the discriminator and `kanban.v1`.

### Technical details

- Design choices recorded:

```yaml
runtime:
  pack: kanban.v1
```

- Follow-up task direction:

```text
artifact projection
  -> store runtimeCardId
  -> store runtimeCardCode
  -> store packId
runtime host
  -> choose bootstrap helpers by packId
  -> choose validator/renderer by packId
```

## Related

- `../design-doc/01-intern-guide-to-vm-controlled-rich-widget-dsl-packs-and-kanban-widget-migration.md`
- `../tasks.md`
- `../changelog.md`
