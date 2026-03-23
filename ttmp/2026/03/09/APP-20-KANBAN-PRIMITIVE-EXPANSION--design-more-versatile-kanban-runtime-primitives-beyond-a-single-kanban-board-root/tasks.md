# Tasks

## Ticket Setup

- [x] Create APP-20 ticket workspace
- [x] Add APP-20 design doc and investigation diary
- [x] Identify the key runtime-pack, rich-widget, and VM-doc files that define current Kanban behavior

## Analysis

- [x] Document how `kanban.v1` currently exposes only `widgets.kanban.board(...)`
- [x] Document which visual and behavioral pieces are hardcoded inside `KanbanBoardView`
- [x] Document how fixed `TagId` and `Priority` constraints block custom bug/issue taxonomies
- [x] Document why additional example cards alone would not solve the current flexibility problem

## Design

- [x] Propose a more composable Kanban primitive family beyond a single board root
- [x] Propose how header, toolbar, and status bar pieces should split into reusable widgets/submodules
- [x] Propose how custom issue types, bug types, and label systems should be represented declaratively
- [x] Decide whether to version or directly replace the current pack contract
- [x] Define Storybook requirements for every extracted Kanban widget or host submodule

## Deliverables

- [x] Write a detailed intern-facing design/implementation guide with prose, diagrams, pseudocode, API references, and file references
- [x] Record the investigation in the diary and changelog
- [x] Upload the bundle to reMarkable

## Implementation Strategy

- [x] Decide implementation mode: direct cutover with no legacy compatibility layers
- [x] Confirm the current `kanban.v1` runtime helpers, host renderer, and demo cards are internal enough to refactor in place

## Slice 1: Extract Host Widgets From `KanbanBoardView`

- [x] Extract a reusable `KanbanHeaderBar` host widget for title, search, primary actions, and inline controls
- [x] Extract a reusable `KanbanFilterBar` host widget for taxonomy-driven filter chips and clear state
- [x] Extract a reusable `KanbanLaneView` host widget for lane header, counts, collapse toggle, and card list
- [x] Extract a reusable `KanbanStatusBar` host widget for metrics and state badges
- [x] Refactor `KanbanBoardView` to compose those pieces instead of rendering the full shell inline
- [x] Keep `KanbanTaskCard` and `KanbanTaskModal` as focused host pieces with inputs only for semantic data/config

## Slice 2: Storybook Coverage For Extracted Host Widgets

- [x] Add Storybook stories for `KanbanHeaderBar`
- [x] Add Storybook stories for `KanbanFilterBar`
- [x] Add Storybook stories for `KanbanLaneView`
- [x] Add Storybook stories for `KanbanStatusBar`
- [x] Update existing `KanbanBoard`, `KanbanBoardView`, `KanbanTaskCard`, and `KanbanTaskModal` stories to use the new taxonomy/config inputs
- [x] Add at least one Storybook scenario that demonstrates a non-default taxonomy configuration

## Slice 3: Descriptor-Driven Kanban Taxonomy

- [x] Replace fixed `Priority` and `TagId` unions with descriptor-driven ids and metadata
- [x] Introduce reusable Kanban descriptor types for issue kinds, priorities, and other board taxonomies
- [x] Update `KanbanTaskCard` rendering to read labels/icons/colors from descriptors rather than hardcoded maps
- [x] Update `KanbanTaskModal` editing controls to render descriptor-driven issue controls rather than hardcoded tag/priority buttons
- [x] Update the standalone/redux `KanbanBoard` host wrapper and sample data to work with descriptor-driven tasks

## Slice 4: Replace The Runtime-Pack DSL

- [x] Replace the single-root `widgets.kanban.board(...)` contract with a richer structured Kanban page contract
- [x] Add new runtime node shapes for page/header/filter-bar/highlights/board/status composition
- [x] Update the pack validator and renderer in `kanbanV1Pack.tsx` to the new contract without compatibility wrappers
- [x] Update `stack-bootstrap.vm.js` so VM authoring helpers emit the new Kanban node shapes
- [x] Update runtime-pack tests to validate the new tree shape and event wiring

## Slice 5: Rewrite VM Docs And Demo Cards

- [x] Rewrite the Kanban pack docs in `apps/os-launcher/src/domain/vm/docs/kanban-pack.docs.vm.js` to teach the new page-style DSL
- [x] Rewrite the three existing demo cards to the new Kanban shell primitives
- [x] Add at least two additional Kanban VM cards that demonstrate non-default layouts or custom issue taxonomy
- [x] Make the demo set visibly more varied, including a single-lane board and a two-lane board
- [x] Regenerate `kanban.vmmeta.json` / `kanbanVmmeta.generated.ts` after the VM doc/card rewrite

## Slice 6: Validation And Ticket Bookkeeping

- [x] Run targeted runtime-pack tests
- [x] Run targeted Kanban/rich-widget Storybook or Storybook validation
- [x] Smoke-test the `os-launcher` Kanban VM cards in the app
- [x] Update the APP-20 changelog, tasks, and diary with exact commands, outcomes, and commits
