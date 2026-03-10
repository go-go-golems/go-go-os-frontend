---
Title: Bug report analysis
Ticket: OS-21-DOCS-RUNTIME-REGRESSIONS
Status: active
Topics:
    - debugging
    - frontend
    - go-go-os
    - plugins
DocType: analysis
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx
      Note: Home-screen kind chips are miswired to free-text search
    - Path: apps/apps-browser/src/components/doc-browser/DocSearchScreen.tsx
      Note: Search screen now consumes structured initial filters from kind browsing
    - Path: apps/apps-browser/src/domain/docsCatalogStore.ts
      Note: Mount cache invalidation bug lives here
    - Path: packages/hypercard-runtime/src/features/pluginCardRuntime/selectors.ts
      Note: Selector now distinguishes explicit empty access from full-access all mode
    - Path: packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.rerender.test.tsx
      Note: Failing regression test reproduces the projection bug
    - Path: packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
      Note: Runtime domain projection bug lives here
ExternalSources: []
Summary: Root-cause analysis for kind-chip search wiring, docs mount cache invalidation, and runtime full-domain projection regressions.
LastUpdated: 2026-03-10T12:45:24.995924593-04:00
WhatFor: Capture the reported regressions, affected code paths, root causes, and intended fix shape before implementation.
WhenToUse: Read before reviewing or extending the fixes in OS-21.
---



# Bug report analysis

## Scope

This document analyzes three reported regressions across `apps-browser` and `hypercard-runtime`, plus the failing rerender test that reproduces the runtime projection problem in CI.

## Reported issues

### 1. Docs browser kind chips do not use the kind facet

Affected file: `apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx`

Observed behavior:

- `Browse by Kind` chips call `openSearch(kind)`
- the search screen interprets that as free-text query state
- `matchesDocsSearchQuery()` filters kinds only via `query.kinds`
- the free-text haystack does not include `doc.kind`

Result:

- clicking a chip such as `module` may return partial, unrelated, or empty results instead of deterministically showing all docs with `kind === 'module'`

Root cause:

- the UI entry point is wired to the wrong search input channel

Expected fix shape:

- add a navigation path that opens the search screen with structured `kinds` filter state instead of text query state
- cover the behavior with a regression test near the doc-browser/search flow or the reducer/state serializer surface

### 2. Docs catalog store keeps stale mount records when a mount is replaced at the same path

Affected file: `apps/apps-browser/src/domain/docsCatalogStore.ts`

Observed behavior:

- `syncMountPaths()` returns early when the mount path list is unchanged
- registry subscribers still fire when the mount backing a path is replaced
- existing `ready` mount records remain cached
- later `ensureMountLoaded()` short-circuits because the status is already `ready`

Result:

- refreshed or swapped mounts at the same path never reload their summaries

Root cause:

- registry-change invalidation is keyed only by the ordered path list, not by the underlying mount identity/version

Expected fix shape:

- invalidate cached mount/object/search records affected by registry refreshes even when the path list is unchanged
- ensure subsequent `ensureMountLoaded()` calls re-query the registry-backed mount
- add a regression test that re-registers a mount at the same path and verifies the new summaries load

### 3. Runtime host drops projected domains when capabilities allow all domains by default

Affected file: `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`

Observed behavior:

- host projection currently reads `pluginConfig?.capabilities?.domain`
- it only preserves the value when that property is an explicit string array
- `domain: 'all'` and omitted capabilities collapse to `[]`
- `selectProjectedRuntimeDomains(state, [])` returns an empty object

Result:

- VM render/event inputs lose app/domain slices even though authorization policy defaults to full access
- stacks that rely on default/all domain access break at runtime

Root cause:

- projection logic bypasses the normalized capability policy already stored in runtime session state

Expected fix shape:

- derive the projection mode from resolved runtime capabilities, not raw plugin config
- preserve the distinction between explicit allowlists and unrestricted/default access
- keep selector behavior deterministic for both modes

### 4. CI symptom: `PluginCardSessionHost.rerender.test.tsx` times out waiting for `Count: 2`

Affected file: `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.rerender.test.tsx`

Observed behavior:

- the test mounts a stack whose plugin omits explicit domain capabilities
- an `inventory` reducer update changes only projected domain state
- the rendered VM output stays at `Count: 0`

Interpretation:

- this is a direct symptom of issue 3, not an unrelated regression
- when the host projects no domains, domain-only store updates cannot invalidate/render the VM tree

Expected fix shape:

- after fixing projection semantics, keep or strengthen this test as the runtime regression guard

## Constraints

- keep docs browser behavior backward-compatible for existing text search entry points
- avoid broad store cache resets unless they are required to evict stale registry-backed data
- align host projection behavior with `resolveCapabilityPolicy()` and authorization semantics already used elsewhere

## Planned validation

- targeted Vitest coverage for `apps/apps-browser` docs search/store behavior
- targeted Vitest coverage for `packages/hypercard-runtime`
- confirm the previously failing rerender test passes
