# Tasks

## Ticket Setup

- [x] Create APP-21 ticket workspace
- [x] Add APP-21 design doc and investigation diary
- [x] Identify the current doc browser, Module Browser, backend docs-store, and runtime-card metadata files

## Current-State Analysis

- [x] Document how the current doc browser is wired around network-backed module docs endpoints
- [x] Document how the Module Browser currently opens module docs and reflection docs
- [x] Document where runtime-card and runtime-pack docs metadata currently exist
- [x] Document why loaded card docs are not visible in the doc browser today

## Design Decisions

- [x] Decide the canonical docs object path scheme
- [x] Decide that all mounted docs providers must expose one shared object format
- [x] Decide that no compatibility layer is required for the new docs object contract
- [x] Capture the Plan 9 style conceptual model for mounted docs subtrees
- [x] Define how module docs, help docs, pack docs, and card docs map into `/docs/objects/{kind}/{owner}/{slug}`

## Proposed Solution

- [x] Specify a canonical `DocObject` / `DocObjectSummary` contract
- [x] Specify a docs mount/provider interface that backend modules and runtime-card registries can both implement
- [x] Specify that `mountPath()` is a synchronous method on each mounted provider
- [x] Specify that mounted providers remain outside Redux and that docs browsing/search should run from an external catalog store plus hooks
- [x] Specify how the doc browser should query the unified docs tree instead of mixing bespoke fetchers
- [x] Specify how Module Browser should surface doc-object links for mounted runtime-card docs
- [x] Specify how search/listing should work across mounted providers

## Implementation Plan

- [x] Write a detailed intern-facing design and implementation guide
- [x] Include prose, diagrams, pseudocode, API references, and file references
- [x] Include a phased implementation plan with direct-cutover steps
- [x] Include validation and test strategy
- [x] Record the research in the diary and changelog

## Implementation

### Slice 1: docs object types and external registry

- [x] Add canonical docs object/path types to `apps-browser`
- [x] Add `DocsMount` interface with synchronous `mountPath()`
- [x] Add external docs registry with register/unregister, resolve, listMounts, search fan-out, and subscribe
- [x] Add registry tests for mount resolution and stable snapshot behavior

### Slice 2: external docs catalog store

- [x] Add an external docs catalog store for mount summaries, object cache, and search cache
- [x] Add hook helpers that expose index, collection, object, and search state without a Redux docs slice
- [x] Add tests for registry-to-catalog-store behavior

### Slice 3: concrete mounts

- [x] Add backend module docs mount adapter that projects current `/api/apps/{id}/docs` and `/api/os/docs` data into `DocObject`
- [x] Add launcher-help docs mount adapter
- [x] Add `vmmeta` runtime-pack docs mount adapter
- [x] Add `vmmeta` runtime-card docs mount adapter
- [x] Register the initial mounts at apps-browser startup

### Slice 4: doc browser UI cutover

- [x] Rewrite doc browser home to render mounted collections rather than backend-only module docs
- [x] Rewrite the docs listing screen around generic object collections instead of module-only docs
- [x] Rewrite the reader screen to open canonical object paths
- [x] Rewrite search to use mounted-object search results and new `kind` / `owner` facets
- [x] Update doc browser route helpers so canonical object paths are first-class

### Slice 5: Module Browser UI impact

- [x] Add mounted docs-object affordances to Module Browser detail panel
- [ ] Show runtime-pack and runtime-card docs for selected owners when available
- [x] Decide and implement whether a dedicated docs column is needed or whether detail-panel integration is sufficient
- [x] Add tests/stories for Module Browser docs-object rendering and opening behavior

## Delivery

- [x] Run `docmgr doctor --ticket APP-21-HYPERCARD-CARD-DOC-BROWSER-INTEGRATION --stale-after 30`
- [x] Upload the APP-21 bundle to reMarkable
- [ ] Commit the APP-21 ticket docs
