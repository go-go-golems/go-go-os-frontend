---
Title: Diary
Ticket: OS-21-DOCS-RUNTIME-REGRESSIONS
Status: active
Topics:
    - debugging
    - frontend
    - go-go-os
    - plugins
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/apps-browser/src/components/doc-browser/DocBrowserContext.tsx
      Note: Diary tracks structured search-state normalization
    - Path: apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx
      Note: Diary tracks the kind-chip fix
    - Path: apps/apps-browser/src/components/doc-browser/DocSearchScreen.tsx
      Note: Diary tracks the keyed search-screen remount behavior
    - Path: apps/apps-browser/src/domain/docsCatalogStore.test.ts
      Note: Diary tracks the same-path mount replacement regression test
    - Path: apps/apps-browser/src/domain/docsCatalogStore.ts
      Note: Diary tracks the mount invalidation fix
    - Path: packages/hypercard-runtime/src/features/pluginCardRuntime/selectors.ts
      Note: Diary tracks full-access projected-domain selector semantics
    - Path: packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.rerender.test.tsx
      Note: Diary tracks the omitted-vs-all rerender coverage
    - Path: packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
      Note: Diary tracks the projected-domain fix
ExternalSources: []
Summary: Chronological OS-21 implementation log covering ticket setup, code fixes, verification, and review notes.
LastUpdated: 2026-03-10T12:45:24.980374169-04:00
WhatFor: Chronological implementation diary for OS-21, including commands, failures, reasoning, and review guidance.
WhenToUse: Use when reviewing how the fixes were developed and validated.
---



# Diary

## Goal

Capture the exact implementation sequence for OS-21 so a reviewer can reconstruct the reasoning, commands, failures, and validation steps without diff archaeology.

## Context

The work started from three review comments and one failing CI test:

- docs browser kind browsing used free-text search instead of structured kind filtering
- docs mount replacement at the same path left stale cached summaries in the catalog store
- runtime host projection ignored `domain: 'all'` and omitted capabilities
- `PluginCardSessionHost.rerender.test.tsx` failed because domain-only updates did not rerender the VM

## Step 1: Create the ticket and write the initial bug analysis

I set up a dedicated `docmgr` ticket before touching code so the fixes would be tied to explicit root-cause statements rather than only to line comments. The first pass separated three underlying bugs from one test symptom, which made the implementation boundary clearer.

This step also established the initial review map: the docs-browser issues live in the UI navigation and registry cache layers, while the runtime regression is a capability-policy mismatch between host projection and runtime authorization.

### Prompt Context

**User prompt (verbatim):** "Address these issues in a new docmgr ticket, writing a bug report analysis document first, then tasks, then working on them and committing at the end. Keep a detailed diary:


apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx
      <TopicChips topics={topics} />
      <DocTypeChips docTypes={docTypes} />
      <ChipRow title=\"Browse by Topic\" items={topics} onClick={openTopicBrowser} />
      <ChipRow title=\"Browse by Kind\" items={kinds} onClick={(kind) => openSearch(kind)} />
@chatgpt-codex-connector
chatgpt-codex-connector bot
now

P2 Badge Use kind facet when opening search from kind chips

The \"Browse by Kind\" chip currently calls openSearch(kind), which only sets a free-text query; however matchesDocsSearchQuery filters by kind only through query.kinds, and its text haystack does not include doc.kind. In practice, clicking a kind chip (like module) can return unrelated/empty results instead of all docs of that kind. Wire this action to the kind filter path so kind browsing is deterministic.

Useful? React with 👍 / 👎.
@wesen


---


packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
Comment on lines +123 to +124
    const keys = pluginConfig?.capabilities?.domain;
    return Array.isArray(keys) ? keys.filter((key): key is string => typeof key === 'string' && key.length > 0) : [];
@chatgpt-codex-connector
chatgpt-codex-connector bot
1 minute ago

P1 Badge Respect domain: \"all\" when projecting runtime slices

This logic only keeps domain keys when capabilities.domain is an array, and falls back to [] otherwise; with domain: 'all' (or omitted capabilities), selectProjectedRuntimeDomains receives an empty allowlist and returns no projected domains. That removes app/domain state from VM render/event inputs even though runtime policy treats these configs as fully allowed, breaking stacks that rely on default/all domain access.

Useful? React with 👍 / 👎.
@wesen


---


apps/apps-browser/src/domain/docsCatalogStore.ts
Comment on lines +92 to +93
    if (same) {
      return;
@chatgpt-codex-connector
chatgpt-codex-connector bot
1 minute ago

P2 Badge Reload mounts when a mount is replaced at same path

When the registry notifies but mount paths are unchanged, this early return skips any snapshot invalidation. If a docs mount is re-registered at an existing path (for refreshed content/provider swap), the store keeps previous ready records and later ensureMountLoaded short-circuits, so stale docs remain indefinitely. The store should invalidate/reload mount records on registry updates even when the path list is unchanged.

Useful? React with 👍 / 👎.
@wesen"

**Assistant interpretation:** Create a fresh ticket, document the bugs before coding, implement all fixes with regression coverage, keep a detailed diary, and finish with a commit.

**Inferred user intent:** Produce a traceable, review-friendly bugfix bundle that leaves both the code and project documentation in a cleaner state.

**Commit (code):** pending

### What I did
- Read the `docmgr` and `diary` skill instructions to follow the expected workflow.
- Inspected the affected source files and the runtime rerender test.
- Created ticket `OS-21-DOCS-RUNTIME-REGRESSIONS`.
- Added `analysis/01-bug-report-analysis.md` and `reference/01-diary.md`.
- Wrote the initial ticket overview and bug report analysis.

### Why
- The request explicitly required a doc-first workflow and a detailed diary.
- Writing the analysis before editing code reduces the risk of patching symptoms without capturing the actual contract mismatch.

### What worked
- `docmgr ticket create-ticket` and `docmgr doc add` created the expected workspace immediately.
- Existing test files already covered two of the three areas, so the fixes can be guarded without broad new harness work.

### What didn't work
- Attempted to read `packages/hypercard-runtime/src/features/pluginCardRuntime/capabilityPolicy.test.ts`, but the file does not exist.
- Command: `sed -n '1,260p' packages/hypercard-runtime/src/features/pluginCardRuntime/capabilityPolicy.test.ts`
- Error: `sed: can't read packages/hypercard-runtime/src/features/pluginCardRuntime/capabilityPolicy.test.ts: No such file or directory`

### What I learned
- Runtime authorization already normalizes omitted or `'all'` capabilities to full access; only the host projection path diverges.
- The rerender timeout is a symptom of that divergence, not a separate rendering bug.

### What was tricky to build
- The main difficulty at this stage was separating the real bugs from their downstream symptoms. The failing rerender test could have been treated as an independent render invalidation problem, but tracing capability normalization showed it is really the runtime projection allowlist collapsing to empty.

### What warrants a second pair of eyes
- The docs-browser fix may require changing navigation state shape, which can affect existing screen entry points if done too broadly.
- Cache invalidation in `docsCatalogStore` needs to stay targeted enough to avoid unnecessary churn.

### What should be done in the future
- N/A

### Code review instructions
- Start with `analysis/01-bug-report-analysis.md` for the root-cause map.
- Then inspect `apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx`, `apps/apps-browser/src/domain/docsCatalogStore.ts`, and `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`.

### Technical details
- Ticket path: `ttmp/2026/03/10/OS-21-DOCS-RUNTIME-REGRESSIONS--docs-browser-and-runtime-projection-regressions`
- Key commands used:
  - `docmgr ticket create-ticket --ticket OS-21-DOCS-RUNTIME-REGRESSIONS --title "Docs browser and runtime projection regressions" --topics debugging,frontend,hypercard,wesen-os`
  - `docmgr doc add --ticket OS-21-DOCS-RUNTIME-REGRESSIONS --doc-type analysis --title "Bug report analysis"`
  - `docmgr doc add --ticket OS-21-DOCS-RUNTIME-REGRESSIONS --doc-type reference --title "Diary"`

## Step 2: Implement the docs-browser and runtime fixes

I kept the browser and runtime changes deliberately small and contract-focused. The docs-browser fix adds structured search navigation for facet-driven entry points instead of broadening text search semantics, while the runtime fix moves projection onto the same normalized capability policy the reducer already uses for authorization.

The cache invalidation change is intentionally aggressive on registry notifications: it clears cached mount/object/search records and reloads mounted summaries immediately. That avoids stale same-path replacements without inventing a partial identity/version system that the registry does not currently expose.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Implement the three reported fixes without losing the ticket-first workflow.

**Inferred user intent:** Resolve the regressions in a way that is deterministic under review and protected by regression tests.

**Commit (code):** pending final ticket commit

### What I did
- Added `buildDocSearchLocation()` in `DocBrowserContext.tsx` so `openSearch()` can carry either free-text or structured `DocsSearchQuery` state.
- Changed `DocCenterHome.tsx` kind chips to call `openSearch({ kinds: [kind] })`.
- Updated `DocBrowserWindow.tsx` and `DocSearchScreen.tsx` so search screens remount from serialized filter state and preserve structured initial facets.
- Added a reducer-level regression test for structured search location building in `DocBrowserContext.test.ts`.
- Updated `docsCatalogStore.ts` to invalidate cached mount/object/search records on registry notifications and immediately reload mounted summaries.
- Added a same-path mount replacement regression test in `docsCatalogStore.test.ts`.
- Updated `selectProjectedRuntimeDomains()` to distinguish explicit empty allowlists from full-access `'all'` access.
- Updated `PluginCardSessionHost.tsx` to derive projected domain access from normalized runtime capabilities instead of raw plugin config arrays.
- Expanded `PluginCardSessionHost.rerender.test.tsx` to cover both omitted capabilities and `domain: 'all'`.
- Converted the collection header in `DocCenterHome.tsx` from a `div` with `role="button"` to a real `button` while cleaning up lint fallout from the touched files.

### Why
- Kind browsing needed to use the existing structured kind facet instead of changing full-text matching rules.
- Same-path registry replacements cannot be detected from path lists alone, so cache eviction has to happen on the notification itself.
- Runtime projection and runtime authorization should share the same capability normalization rules or they will drift again.

### What worked
- The docs-browser state change stayed localized to the navigation/search entry path.
- The store invalidation test reproduces the stale-cache case directly with a replaced mount at the same path.
- The rerender regression test now protects both default and explicit full-access runtime configurations.

### What didn't work
- Initial Biome verification failed on the touched browser files because the search-screen reset logic confused the exhaustive-deps rule and `DocCenterHome.tsx` still had a semantic-button lint violation.
- Command: `npx biome check apps/apps-browser/src/components/doc-browser/DocBrowserContext.test.ts apps/apps-browser/src/components/doc-browser/DocBrowserContext.tsx apps/apps-browser/src/components/doc-browser/DocBrowserWindow.tsx apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx apps/apps-browser/src/components/doc-browser/DocSearchScreen.tsx apps/apps-browser/src/domain/docsCatalogStore.test.ts apps/apps-browser/src/domain/docsCatalogStore.ts packages/hypercard-runtime/src/features/pluginCardRuntime/selectors.ts packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.rerender.test.tsx packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
- Resolution: keyed the search screen from serialized filter state, converted the collection header to a real button, then ran `npx biome check --write ...` on the touched files.

### What I learned
- Search-screen initialization is easier to keep deterministic by remounting from serialized filter state than by trying to sync prop changes back into local filter state.
- The docs registry needs a mount version or identity concept if it ever wants more selective invalidation than "registry event means cached docs are suspect."

### What was tricky to build
- The tricky part was avoiding accidental behavior changes in the search screen. A naive effect-based sync from navigation props back into local filter state looked compact, but it would have reset user edits whenever a semantically equivalent filter object was recreated. Switching to a keyed remount kept the initialization behavior explicit and lint-clean.

### What warrants a second pair of eyes
- `selectProjectedRuntimeDomains(..., 'all')` now projects every record-valued root slice. That matches the current "full access" interpretation, but it is broader than explicit allowlists and may warrant a future notion of "domain slice" metadata.
- Registry notifications now clear cached doc objects and searches as well as mounts. That is correct for freshness, but it is a tradeoff toward reload certainty over cache retention.

### What should be done in the future
- Consider giving `DocsRegistry` an explicit mount revision or identity token so same-path replacements can invalidate more selectively.
- Consider formalizing which Redux root slices count as runtime-projectable "domains" under full-access policy.

### Code review instructions
- Start with `apps/apps-browser/src/components/doc-browser/DocBrowserContext.tsx`, `apps/apps-browser/src/components/doc-browser/DocBrowserWindow.tsx`, and `apps/apps-browser/src/components/doc-browser/DocSearchScreen.tsx` to review the structured search state path.
- Then inspect `apps/apps-browser/src/domain/docsCatalogStore.ts` and `apps/apps-browser/src/domain/docsCatalogStore.test.ts` for the registry invalidation behavior.
- Finish with `packages/hypercard-runtime/src/features/pluginCardRuntime/selectors.ts`, `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`, and `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.rerender.test.tsx`.

### Technical details
- Main source files changed:
  - `apps/apps-browser/src/components/doc-browser/DocBrowserContext.tsx`
  - `apps/apps-browser/src/components/doc-browser/DocBrowserWindow.tsx`
  - `apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx`
  - `apps/apps-browser/src/components/doc-browser/DocSearchScreen.tsx`
  - `apps/apps-browser/src/domain/docsCatalogStore.ts`
  - `packages/hypercard-runtime/src/features/pluginCardRuntime/selectors.ts`
  - `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
- Main regression tests changed:
  - `apps/apps-browser/src/components/doc-browser/DocBrowserContext.test.ts`
  - `apps/apps-browser/src/domain/docsCatalogStore.test.ts`
  - `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.rerender.test.tsx`

## Step 3: Verify the fixes and close out ticket bookkeeping

After the code changes were stable, I validated the touched browser and runtime surfaces with targeted tests, package-level type checks, and a Biome pass on the touched files. That provided enough confidence to finish the ticket bookkeeping without broadening the verification scope to unrelated workspaces.

The only noisy output left in verification is expected stderr from `runtimeCardRegistry.test.ts`, which is already part of the existing test suite and still exits green. I kept that in the diary so reviewers do not mistake it for a regression introduced by this ticket.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Prove the fixes hold under the local test and typecheck surfaces that cover these regressions, then finalize ticket state and commit.

**Inferred user intent:** Leave behind a bugfix bundle that is easy to review and safe to merge.

**Commit (code):** pending final ticket commit

### What I did
- Ran `npm run test -w @hypercard/apps-browser -- src/components/doc-browser/DocBrowserContext.test.ts src/domain/docsCatalogStore.test.ts`.
- Ran `npm run test -w @hypercard/hypercard-runtime -- src/runtime-host/PluginCardSessionHost.rerender.test.tsx`.
- Ran `npm run typecheck -w @hypercard/hypercard-runtime`.
- Ran `npx tsc -p apps/apps-browser/tsconfig.json --noEmit`.
- Ran `npx biome check ...` on the touched files after formatting cleanup.
- Checked completed docmgr tasks and cleaned the scaffold placeholder task from `tasks.md`.

### Why
- The changed behavior is concentrated in two packages, so targeted verification gives strong signal without paying for unrelated workspace noise.
- Recording the exact command sequence makes the ticket reusable if these regressions recur.

### What worked
- Browser tests passed: 2 files, 8 tests.
- Runtime tests passed: 16 files, 68 tests.
- The previously failing rerender test now passes in both omitted-capability and explicit-`all` scenarios.
- `@hypercard/hypercard-runtime` typecheck and `apps-browser` TypeScript validation both exited with code 0.
- Final Biome check on the touched files exited with code 0.

### What didn't work
- `npm run test -w @hypercard/hypercard-runtime -- src/runtime-host/PluginCardSessionHost.rerender.test.tsx` still prints expected stderr from `runtimeCardRegistry.test.ts` about a mocked `syntax error` card injection failure.
- This is existing test behavior, not a failing assertion; the suite finished with `16 passed (16)` and exit code 0.

### What I learned
- The workspace test script for `@hypercard/hypercard-runtime` still expands to `vitest run src ...`, so targeted file arguments run the full package suite rather than only the requested file. That is acceptable here because the package suite remained green.

### What was tricky to build
- The main sharp edge in verification was interpreting "targeted" runtime testing correctly. The workspace script appends `src` before extra args, so it is broader than it looks from the CLI. I kept the command because it still exercises the relevant rerender surface and shows that the package stays green under the new projection semantics.

### What warrants a second pair of eyes
- If runtime package verification cost becomes an issue, it may be worth adding a narrower script that does not always prepend `src`.

### What should be done in the future
- Consider adding workspace scripts that distinguish "full package suite" from "single-file vitest run" more explicitly.

### Code review instructions
- Re-run the commands in this order:
  - `npm run test -w @hypercard/apps-browser -- src/components/doc-browser/DocBrowserContext.test.ts src/domain/docsCatalogStore.test.ts`
  - `npm run test -w @hypercard/hypercard-runtime -- src/runtime-host/PluginCardSessionHost.rerender.test.tsx`
  - `npm run typecheck -w @hypercard/hypercard-runtime`
  - `npx tsc -p apps/apps-browser/tsconfig.json --noEmit`
  - `npx biome check apps/apps-browser/src/components/doc-browser/DocBrowserContext.test.ts apps/apps-browser/src/components/doc-browser/DocBrowserContext.tsx apps/apps-browser/src/components/doc-browser/DocBrowserWindow.tsx apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx apps/apps-browser/src/components/doc-browser/DocSearchScreen.tsx apps/apps-browser/src/domain/docsCatalogStore.test.ts apps/apps-browser/src/domain/docsCatalogStore.ts packages/hypercard-runtime/src/features/pluginCardRuntime/selectors.ts packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.rerender.test.tsx packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`

### Technical details
- Browser test result: `2 passed (2)` files, `8 passed (8)` tests.
- Runtime test result: `16 passed (16)` files, `68 passed (68)` tests.
- Typecheck commands:
  - `npm run typecheck -w @hypercard/hypercard-runtime`
  - `npx tsc -p apps/apps-browser/tsconfig.json --noEmit`

## Quick Reference

Current implementation targets:

- `apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx`
- `apps/apps-browser/src/domain/docsCatalogStore.ts`
- `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
- `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.rerender.test.tsx`

## Usage Examples

- Read Step 1 before reviewing later diary steps to understand why the failing runtime test is treated as part of the projection fix.
- Use the command list in Step 1 to reproduce the ticket/document scaffolding.

## Related

- `../analysis/01-bug-report-analysis.md`
