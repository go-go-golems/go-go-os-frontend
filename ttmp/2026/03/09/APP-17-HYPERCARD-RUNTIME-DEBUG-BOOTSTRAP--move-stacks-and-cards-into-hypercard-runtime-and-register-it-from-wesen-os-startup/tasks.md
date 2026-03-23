# Tasks

## Ticket Setup

- [x] Create APP-17 ticket workspace
- [x] Add APP-17 design doc and implementation diary
- [x] Relate the key inventory, runtime, and wesen-os bootstrap files to the ticket docs
- [x] Run `docmgr doctor --ticket APP-17-HYPERCARD-RUNTIME-DEBUG-BOOTSTRAP --stale-after 30`

## Analysis

- [x] Capture the current ownership split between inventory, `hypercard-runtime`, and `wesen-os`
- [x] Document the current residual inventory coupling inside `RuntimeCardDebugWindow`
- [x] Explain why the component move is mostly done already while the launcher/routing move is not
- [x] Define the desired boundary between package-owned debug UI and app-owned registration

## Design

- [x] Specify the target public API for a reusable Stacks and Cards registration helper or launcher-module factory
- [x] Specify how `ownerAppId`, stack list, and window identity should be passed explicitly
- [x] Specify how `wesen-os` startup should register the debug entry so it is globally available
- [x] Specify how inventory should consume the shared debug module after the extraction
- [x] Specify how code-editor ownership should stop being hardcoded to inventory

## Implementation Guide

- [x] Write a detailed intern guide with prose, diagrams, pseudocode, and file references
- [x] Add a phase-by-phase implementation plan with rollback points and review checkpoints
- [x] Record the design step in the diary and changelog

## Implementation

- [x] Slice 1: Make `RuntimeCardDebugWindow` app-agnostic by accepting explicit `ownerAppId`
- [x] Slice 1: Add multi-stack selection support and registered-stack fallback inside `RuntimeCardDebugWindow`
- [x] Slice 1: Update the shared Storybook story to exercise registry-backed stack selection
- [x] Slice 2: Add `runtimeDebugRegistry.ts` in `hypercard-runtime` for host-owned stack registration
- [x] Slice 2: Add `runtimeDebugApp.tsx` in `hypercard-runtime` for shared window payloads and runtime debug app rendering
- [x] Slice 2: Re-export the runtime debug helpers from `packages/hypercard-runtime/src/hypercard/index.ts`
- [x] Slice 3: Re-export `inventoryStack` from `@hypercard/inventory/launcher` so host apps can register inventory alongside their own stack
- [x] Slice 3: Remove inventory-owned runtime debug command and bespoke window route glue
- [x] Slice 3: Launch the shared runtime debug app from inventory via `app.launch.hypercard-runtime-debug`
- [x] Slice 4: Add `apps/os-launcher/src/app/runtimeDebugModule.tsx` as the thin host wrapper for the shared runtime debug app
- [x] Slice 4: Register inventory and `os-launcher` stacks from `wesen-os` startup via `registerRuntimeDebugStacks(...)`
- [x] Slice 4: Add the runtime debug launcher module to `apps/os-launcher/src/app/modules.tsx`
- [x] Slice 5: Add package tests for runtime debug registry dedupe and window payload construction
- [x] Slice 5: Add `os-launcher` tests covering runtime debug launcher registration and render wiring

## Validation

- [x] Run `npx vitest run src/hypercard/debug/runtimeDebugRegistry.test.tsx` in `packages/hypercard-runtime`
- [x] Run `npm run typecheck -w packages/hypercard-runtime` in `workspace-links/go-go-os-frontend`
- [x] Run `npx tsc --build tsconfig.json` in `workspace-links/go-go-app-inventory/apps/inventory`
- [x] Record the pre-existing `os-launcher` Vitest linked-package `.js` import failures
- [x] Record the pre-existing `os-launcher` TypeScript failures caused by linked `@hypercard/rich-widgets` errors
- [x] Add `Open` actions for predefined stack cards in the shared `Stacks & Cards` table
- [x] Add session-level action buttons that resolve running plugin sessions back to built-in stack-card source when available
- [x] Verify in `wesen-os` that `Stacks & Cards` can launch `inventory` cards and open/edit running `os-launcher` Kanban cards

## Deferred Follow-Up

- [x] Defer built-in VM source display in `Stacks & Cards` until the post-APP-17 source-view work
