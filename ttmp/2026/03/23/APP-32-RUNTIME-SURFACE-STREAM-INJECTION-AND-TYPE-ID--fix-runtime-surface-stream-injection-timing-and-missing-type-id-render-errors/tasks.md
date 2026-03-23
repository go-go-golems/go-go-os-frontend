# Tasks

## Phase A: Current-State Investigation

- [x] Confirm where streamed `hypercard.card.update` events become timeline entities.
- [x] Confirm where hypercard card timeline entities are projected into runtime-surface artifacts.
- [x] Confirm where runtime surfaces are registered and injected into live runtime sessions.
- [x] Confirm where the `Runtime surface type id is required` error is thrown.
- [x] Confirm whether a default runtime surface type already exists elsewhere in the runtime stack.

## Phase B: Ticket Design And Evidence

- [x] Create the APP-32 ticket workspace.
- [x] Write a focused design/implementation note for the two bugs.
- [x] Keep an investigation diary with exact findings and file references.
- [x] Relate the key runtime files to the ticket docs.

## Phase C: Stream Injection Timing Fix

- [x] Decide the concrete completion gate for runtime-surface registration.
- [x] Update artifact projection so streaming `hypercard.card.update` entities do not register/inject incomplete code.
- [x] Preserve timeline preview behavior so streaming cards still render in chat while the code is incomplete.
- [x] Add or update tests proving runtime-surface registration happens only once the card status is final.

## Phase D: Explicit PackId Contract

- [x] Make `runtime.pack` mandatory in the inventory runtime-card prompt and examples, including ordinary `ui.card.v1` cards.
- [x] Tighten artifact extraction/projection so runtime surfaces are only considered executable when `packId` is present.
- [x] Make runtime surface registration and dynamic definition require a non-empty `packId`.
- [x] Remove implicit missing-pack defaulting from the runtime bootstrap/runtime metadata path.
- [x] Update runtime bundle fixtures and tests so built-in surfaces declare their pack ids explicitly.
- [x] Add or update tests proving opened artifact sessions render only when a concrete `packId` is present.

## Phase E: Validation

- [x] Run focused frontend tests for hypercard artifact projection and runtime host behavior.
- [x] Run the relevant inventory frontend tests covering projected chat artifacts.
- [x] Record exact validation commands and results in the diary.

## Phase F: Ticket Bookkeeping

- [x] Update the diary after each implementation slice.
- [x] Update the changelog as phases land.
- [x] Validate ticket frontmatter after the docs are updated.
