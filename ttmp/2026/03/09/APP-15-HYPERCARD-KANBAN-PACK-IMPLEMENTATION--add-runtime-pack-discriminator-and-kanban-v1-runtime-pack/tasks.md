# Tasks

## Ticket Setup

- [x] Create APP-15 implementation ticket workspace
- [x] Add APP-15 implementation diary
- [x] Add a living runtime-pack implementation playbook
- [x] Relate APP-14 design doc, runtime files, and Kanban widget files to APP-15 docs
- [x] Run `docmgr doctor --ticket APP-15-HYPERCARD-KANBAN-PACK-IMPLEMENTATION --stale-after 30`

## Slice 1: Artifact Discriminator And Projection

- [x] Add `runtime.pack` metadata support to the `hypercard.card.v2` artifact parser
- [x] Persist `packId` in artifact state alongside `runtimeCardId` and `runtimeCardCode`
- [x] Update artifact projection middleware to register runtime cards with `packId`
- [x] Extend runtime artifact tests for discriminator parsing and projection
- [x] Commit slice 1 code and record the result in the diary

## Slice 2: Runtime-Pack Registry And Host Selection

- [x] Add a runtime-pack registry in `hypercard-runtime`
- [x] Register `kanban.v1` as the first concrete pack
- [x] Make runtime session loading/bootstrap choose helper injection by `packId`
- [x] Make host rendering/validation choose pack renderer by `packId`
- [x] Add runtime tests for pack selection and fallback failures
- [x] Commit slice 2 code and record the result in the diary

## Slice 3: Kanban Refactor For Pack Rendering

- [x] Extract Kanban view parts needed by the pack renderer
- [x] Keep `KanbanBoard.tsx` as a thin assembly wrapper over extracted pieces
- [x] Add `kanban.v1` renderer/helpers that reuse extracted view parts instead of duplicating UI logic
- [x] Ensure pack event routing maps back to semantic Kanban actions only
- [x] Add Storybook stories for every new Kanban view part introduced by the refactor
- [x] Verify the stories in Storybook, using Playwright against port `6007` if needed
- [x] Commit slice 3 code and record the result in the diary

## Slice 4: Prompt Policy And End-To-End Cutover

- [x] Update prompt policy to require `runtime.pack: kanban.v1` for Kanban-targeting cards
- [x] Update any authoring/examples/tests that should emit the new metadata
- [x] Validate runtime package tests, Kanban/rich-widget typecheck, and Storybook/story validation
- [x] Check completed tasks off and summarize outcomes in changelog and diary
- [x] Commit slice 4 code and docs in focused commits

## Slice 5: `wesen-os` Kanban VM Shortcut

- [x] Add concrete `kanban.v1` VM demo cards to the `os-launcher` stack so they run as real VM sessions
- [x] Add an app-layer `wesen-os` shortcut module that opens those demo cards through `PluginCardSessionHost`
- [x] Update launcher coverage/tests so the new shortcut is part of the host app contract
- [x] Validate the shortcut path with targeted `os-launcher` tests and a runtime smoke pass
- [x] Record the shortcut architecture tradeoff in the APP-15 diary and playbook
- [x] Commit slice 5 code and docs in focused commits
