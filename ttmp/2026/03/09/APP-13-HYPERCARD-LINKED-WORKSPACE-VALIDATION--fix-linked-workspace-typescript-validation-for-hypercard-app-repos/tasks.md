# Tasks

## Investigation

- [ ] Reproduce the ARC AGI player `tsc --build` failure and capture the minimal error set for `TS6059` and `?raw` module resolution
- [ ] Compare ARC tsconfig settings against the working SQLite app tsconfig and identify the smallest safe contract difference
- [ ] Trace how `*?raw` declarations are provided in linked packages today and why ARC does not see them during app-local builds

## Fix Plan

- [ ] Remove or relax the ARC app `rootDir` constraint so linked package source references do not immediately fail targeted builds
- [ ] Add the correct project references and path coverage so app-local `tsc --build` follows the intended linked-package graph
- [ ] Fix raw-import declaration visibility for linked HyperCard runtime package builds
- [ ] Re-run targeted validation for ARC and at least one other linked HyperCard app to confirm the pattern is robust

## Ticket Hygiene

- [ ] Record the final validation strategy and any tsconfig tradeoffs in the changelog
- [ ] Relate the relevant app/package tsconfig and raw-import files to this ticket
