# Tasks

## Documentation And Framing

- [x] Create APP-14 ticket workspace
- [x] Create the APP-14 design doc and implementation diary
- [x] Relate APP-07, APP-11, HyperCard runtime files, and Kanban widget files to the APP-14 docs
- [x] Run `docmgr doctor --ticket APP-14-RICH-WIDGET-DSL-PACKS --stale-after 30`

## Design Slice 1: Map The Existing Architecture

- [x] Trace the current inference-time and runtime-time seams from APP-07 and APP-11 that constrain rich widget DSL design
- [x] Audit the current `KanbanBoard` composition, reducer, launcher wiring, and reusable primitives
- [x] Document which current Kanban concerns are pure domain state, which are reusable React view parts, and which are host-only behaviors

## Design Slice 2: Define The Rich Widget Runtime Pack Model

- [x] Define the recommended runtime-pack contract for rich widgets: prompt pack, artifact kind, bootstrap modules, renderer, validators, and capabilities
- [x] Explain why raw React components and raw async APIs must not be injected directly into QuickJS
- [x] Define the VM-facing helper surface for rich widgets, including `widgets`, `format`, and future `effects`
- [x] Define the event and action-routing contract for widget-oriented DSL nodes under the post-APP-11 `dispatch(action)` model

## Design Slice 3: Kanban Refactor And DSL Case Study

- [x] Define the target Kanban split into domain state, view parts, and runtime-pack renderer adapters
- [x] Propose the concrete Kanban file decomposition for `go-go-os-frontend/packages/rich-widgets/src/kanban`
- [x] Define the VM-facing Kanban DSL nodes and helper APIs, including how cards, columns, toolbar controls, and modal editors are represented
- [x] Show how Kanban interactions map back into reducer actions without leaking React internals into the VM
- [x] Document which base primitives should be reused directly versus wrapped behind Kanban-specific pack helpers

## Design Slice 4: Implementation Plan

- [x] Write a phased implementation plan that starts with Kanban refactoring before adding broader rich-widget packs
- [x] Define required renderer, schema, prompt-policy, artifact, and test changes across `go-go-os-frontend` and app repos
- [x] Include validation strategy for Storybook, reducer tests, runtime tests, and VM-pack integration tests
- [x] Record follow-up implementation tasks that should become future code tickets

## Immediate Follow-up Implementation Tasks

- [ ] Add explicit `runtime.pack` metadata to the `hypercard.card.v2` artifact envelope
- [ ] Persist `packId` in frontend artifact projection alongside `runtimeCardId` and `runtimeCardCode`
- [ ] Add a runtime-pack registry and register `kanban.v1` as the first concrete pack
- [ ] Make runtime bootstrap helper injection and host renderer selection depend on `packId`
- [ ] Update prompt policy to require `runtime.pack: kanban.v1` for Kanban-targeting cards
- [ ] Keep `hypercard.card.v2` as the shared artifact kind unless a second pack proves the envelope needs to fork

## Ticket Bookkeeping

- [x] Record the ticket rationale and case-study findings in the APP-14 diary
- [x] Summarize the new guide and Kanban refactor scope in the APP-14 changelog
- [x] Commit the APP-14 docs in a focused ticket-only commit
