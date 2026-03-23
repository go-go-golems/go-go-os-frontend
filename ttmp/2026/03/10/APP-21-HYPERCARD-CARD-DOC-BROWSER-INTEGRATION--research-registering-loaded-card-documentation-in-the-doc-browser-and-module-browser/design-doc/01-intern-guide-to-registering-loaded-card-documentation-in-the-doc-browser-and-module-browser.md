---
Title: Intern guide to registering loaded card documentation in the doc browser and module browser
Ticket: APP-21-HYPERCARD-CARD-DOC-BROWSER-INTEGRATION
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - documentation
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts
      Note: |-
        Existing generated runtime-pack and card docs metadata
        Existing runtime-pack and card docs metadata source
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/domain/vmmeta.ts
      Note: Current export seam for generated card docs metadata
    - Path: ../../../../../../../wesen-os/cmd/wesen-os-launcher/docs_endpoint.go
      Note: Current aggregate docs endpoint implementation
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-backend/pkg/backendhost/manifest_endpoint.go
      Note: Current manifest docs hints contract
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-backend/pkg/docmw/docmw.go
      Note: |-
        Current backend docs store contract and route mounting model
        Current backend docs store contract that would be projected into the new object format
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/api/appsApi.ts
      Note: |-
        Current backend-only docs API fetch layer
        Current backend docs fetchers that would be replaced by docs object mounts
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/BrowserDetailPanel.tsx
      Note: |-
        Current detail-panel Documentation section driven by reflection docs
        Current detail panel documentation section
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/ModuleBrowserWindow.tsx
      Note: |-
        Current Module Browser toolbar and docs-entry points
        Current Module Browser docs entry points
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocBrowserWindow.tsx
      Note: Current doc-browser screen router
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx
      Note: |-
        Current doc-browser home screen and aggregate docs landing behavior
        Current doc browser home and aggregate docs behavior
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/ModuleDocsScreen.tsx
      Note: Current single-module docs listing contract
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/types.ts
      Note: Current doc browser payload contracts
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/launcher/module.tsx
      Note: |-
        Current doc-browser route builder and command surface
        Current docs route builder and window command surface
ExternalSources: []
Summary: Detailed design and implementation guide for unifying backend module docs and loaded runtime-card docs under a single mounted docs-object model, and for updating the doc browser and Module Browser to consume that model directly.
LastUpdated: 2026-03-10T09:10:00-04:00
WhatFor: Use this guide when implementing first-class runtime-card docs discovery and search in the existing doc browser and Module Browser without carrying compatibility layers.
WhenToUse: Use when planning docs-browser architecture changes, search/index behavior, Module Browser docs affordances, or a unified docs object namespace rooted at /docs/objects.
---


# Intern guide to registering loaded card documentation in the doc browser and module browser

## Executive Summary

The current documentation system in `wesen-os` already has a coherent backend shape for module docs, but runtime-card documentation lives outside that system. Module docs are discoverable because they are served from the backend and indexed through `/api/os/docs`. Runtime-card docs are not discoverable because they live in generated frontend metadata like `kanbanVmmeta.generated.ts` and never enter the doc browser’s data model.

The simplest clean fix is not to bolt “card docs” onto the side of the existing module-docs endpoints. The better model is to treat all documentation as mounted objects in one tree, conceptually like a Plan 9 filesystem:

```text
/docs
  /objects
    /module/<module-id>/<slug>
    /help/<owner>/<slug>
    /pack/<pack-id>/<slug>
    /card/<owner>/<card-id>
  /search
  /index
  /mounts
```

Each mounted provider must expose the same object format. There is no need for a compatibility layer. The current backend module-docs contract and the current frontend runtime-card metadata should be projected into one canonical `DocObject` model, and the doc browser plus Module Browser should consume that model directly.

This ticket therefore recommends a direct cutover:

1. replace the current backend-only docs fetch model with a docs object registry plus an external docs catalog store,
2. mount backend module docs, help docs, pack docs, and card docs into one tree,
3. update doc browser home/search/reader/module screens to query that unified tree through hooks instead of a Redux docs slice,
4. update Module Browser UI to surface mounted-object docs, not just backend reflection docs.

## Problem Statement

The user’s request is not “show another doc page somewhere.” It is to make documentation for loaded cards first-class in the same discovery surfaces that already exist:

- the doc browser
- the Module Browser
- the doc search functionality

Today that does not work for structural reasons.

### Why it does not work today

Backend docs and runtime-card docs do not share a contract:

- backend docs:
  - served from Go
  - modeled as `ModuleDoc`
  - fetched through RTK Query in `appsApi.ts`
  - indexed through `/api/os/docs`
- runtime-card docs:
  - generated from VM files by `vmmeta`
  - stored in frontend TypeScript bundles
  - not fetched through `appsApi.ts`
  - not represented in `ModuleDocDocument`, `OSDocResult`, or manifest docs hints

The current doc browser is therefore blind to loaded-card docs unless it is explicitly rewritten to consume them.

## Current-State Architecture

## Part 1: Current doc browser data flow

The existing doc browser in `apps-browser` is centered on network fetches.

Primary files:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/api/appsApi.ts`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocBrowserWindow.tsx`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/ModuleDocsScreen.tsx`

Current fetchers:

```text
useGetModuleDocsQuery(appId)     -> /api/apps/{id}/docs
useGetModuleDocQuery(appId,slug) -> /api/apps/{id}/docs/{slug}
useGetOSDocsQuery(query)         -> /api/os/docs
useGetHelpDocsQuery()            -> /api/os/help
useGetHelpDocQuery(slug)         -> /api/os/help/{slug}
```

Important consequence:

- the doc browser is currently organized around backend module ids, not around a general “docs object” identity

## Part 2: Current Module Browser docs flow

Primary files:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/ModuleBrowserWindow.tsx`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/BrowserDetailPanel.tsx`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/launcher/module.tsx`

The Module Browser currently knows how to:

- open module docs for a selected backend app
- open the general docs center
- open reflection-linked docs from `reflection.docs[]`

It does **not** know how to:

- enumerate runtime packs
- enumerate loaded cards
- show docs for a loaded card unless those docs are back-linked through backend reflection or doc routes

This is why the Module Browser currently remains a backend-app browser, not a general “object browser” for mounted docs providers.

## Part 3: Current backend docs-store contract

Primary files:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-backend/pkg/docmw/docmw.go`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-backend/pkg/backendhost/manifest_endpoint.go`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/cmd/wesen-os-launcher/docs_endpoint.go`

Current backend doc document shape:

```go
type ModuleDoc struct {
  ModuleID string
  Slug     string
  Title    string
  DocType  string
  Topics   []string
  Summary  string
  SeeAlso  []string
  Order    int
  Content  string
}
```

Current backend discovery shape:

```text
/api/os/apps              -> manifest docs hints
/api/apps/{id}/docs       -> one module TOC
/api/apps/{id}/docs/{slug}
/api/os/docs              -> aggregate search/facets
/api/os/help              -> help docs
```

This is already close to a mount/provider model. Each backend module owns a `DocStore`, and the launcher aggregates those stores. The limitation is that runtime-card docs do not live in this system.

## Part 4: Current runtime-card docs flow

Primary files:

- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vmmeta.ts`
- `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/docs/kanban-pack.docs.vm.js`

The `vmmeta` generator already emits:

- pack docs
- per-symbol DSL docs
- per-card docs
- per-card source

Example categories already present in the generated metadata:

- `docs.by_package["kanban.v1"]`
- `docs.by_symbol["widgets.kanban.page"]`
- `docs.by_symbol["kanbanIncidentCommand"]`

That means the raw documentation data already exists for at least one mounted runtime-card family. The problem is not lack of docs. The problem is lack of registration into the docs browsing/search system.

## Gap Analysis

There are four major gaps.

### Gap 1: identity mismatch

The doc browser thinks in:

- `module_id`
- `slug`

The runtime-card docs generator thinks in:

- `packId`
- `cardId`
- `symbol`

Those identities are similar, but not normalized.

### Gap 2: transport mismatch

The doc browser expects backend HTTP fetches.

The runtime-card docs currently arrive as frontend-generated modules.

### Gap 3: search mismatch

The doc search screen is driven by `/api/os/docs` facets:

- modules
- doc types
- topics

If card docs are added without redesigning the search index, search will either:

- ignore them entirely, or
- wedge them into fake module ids with no clear semantics

### Gap 4: Module Browser mismatch

The Module Browser is built around backend application manifests and reflection documents. Loaded runtime cards are not backend apps, so they do not naturally show up in the current browser columns.

That means APP-21 must design UI changes, not just data changes.

## Design Goal

Every documentation provider should mount into the same conceptual tree and expose the same object format.

We do **not** want:

- separate “module docs” shape
- separate “help docs” shape
- separate “card docs” shape
- compatibility adapters lingering in the UI forever

We **do** want:

- one object format
- one path model
- one search model
- one reader model
- one registry of mounted docs providers

## Proposed Canonical Model

## 1. Canonical object path

Use:

```text
/docs/objects/{kind}/{owner}/{slug}
```

Examples:

```text
/docs/objects/module/inventory/overview
/docs/objects/help/wesen-os/backend-documentation-system
/docs/objects/pack/kanban.v1/widgets.kanban.page
/docs/objects/card/os-launcher/kanbanIncidentCommand
```

Interpretation:

- `kind`
  - broad object class
- `owner`
  - module id, app id, stack id, or pack id
- `slug`
  - stable document/object identifier inside that owner

This is “Plan 9 like” in the sense that the UI can treat docs as mounted readable objects under one tree, rather than as a handful of unrelated RPCs.

## 2. Canonical object contract

```ts
type DocObjectKind = 'module' | 'help' | 'pack' | 'card';

interface DocObjectSummary {
  path: string;
  kind: DocObjectKind;
  owner: string;
  slug: string;
  title: string;
  docType: string;
  topics: string[];
  summary?: string;
  tags?: string[];
  source: 'backend' | 'vmmeta' | 'runtime';
}

interface DocObject extends DocObjectSummary {
  content: string;
  related?: string[];
  metadata?: Record<string, unknown>;
}
```

Important rule:

- every mounted provider must project into this shape before registration

No provider-specific special cases in the UI.

## 3. Mounted provider interface

```ts
interface DocsMount {
  mountPath(): string;
  list(subpath?: string[]): Promise<DocObjectSummary[]>;
  read(subpath: string[]): Promise<DocObject | null>;
  stat?(subpath: string[]): Promise<DocObjectSummary | null>;
  search?(query: DocsSearchQuery): Promise<DocObjectSummary[]>;
}
```

Possible providers:

- `BackendModuleDocsMount`
- `HelpDocsMount`
- `RuntimePackDocsMount`
- `RuntimeCardDocsMount`

Important constraints:

- `mountPath()` is synchronous
- `mountPath()` should be stable for the lifetime of the mounted object
- mounts are plain interface-bearing objects, not class-heavy infrastructure
- all provider-specific data must be projected into `DocObject` / `DocObjectSummary` before leaving the mount

## 4. Registry and external catalog store split

The mounted objects themselves should **not** live in Redux. They are behaviorful, non-serializable objects with methods. The docs browser also no longer needs a dedicated Redux slice. The cleaner model is an external registry plus an external catalog store that caches mount listings, object bodies, and search results for the UI.

Recommended split:

### External registry

Owns:

- mounted provider objects
- mount path lookup
- longest-prefix path resolution
- search fan-out across providers
- change subscriptions

Example:

```ts
interface DocsRegistry {
  register(mount: DocsMount): () => void;
  listMounts(): string[];
  resolve(path: string): { mount: DocsMount; subpath: string[] } | null;
  search(query: DocsSearchQuery): Promise<DocObjectSummary[]>;
  subscribe(listener: () => void): () => void;
}
```

### External docs catalog store

Owns:

- mount summaries
- known docs object summaries by path
- mount loading/error state
- search query cache and result paths
- cached object bodies and loading/error state

This preserves a stable serializable snapshot for the UI while keeping behaviorful mounts out of any reducer tree.

Example:

```ts
interface DocsCatalogStore {
  getSnapshot(): DocsCatalogSnapshot;
  subscribe(listener: () => void): () => void;
  ensureAllMountsLoaded(): Promise<void>;
  ensureMountLoaded(path: DocsMountPath): Promise<void>;
  ensureObjectLoaded(path: DocObjectPath): Promise<void>;
  runSearch(query: DocsSearchQuery): Promise<void>;
}
```

### Why this split is the right one

- mounts are not serializable
- docs browsing/search does not need the global Redux tree to function
- `useSyncExternalStore` is a better fit for this mounted-object runtime
- the pattern already exists elsewhere in the codebase, for example the shared runtime-debug registry that uses an external store plus a projected snapshot
- this keeps the docs runtime local, serializable, and inspectable without forcing the registry itself into RTK Query or reducers

## 5. Direct-cutover rule

No compatibility layer.

That means:

- doc browser screens should stop depending directly on `ModuleDocDocument` and `OSDocResult`
- `appsApi.ts` should stop being the sole docs data source
- the UI should be rewritten to consume the docs-object service/registry instead

The backend can still serve data, but its data must be projected into `DocObject`, not consumed in its old shape across the app.

## Mapping Current Providers Into The New Tree

## Backend module docs

Current:

```text
/api/apps/inventory/docs/overview
```

Projected object path:

```text
/docs/objects/module/inventory/overview
```

## Launcher help docs

Current:

```text
/api/os/help/backend-documentation-system
```

Projected object path:

```text
/docs/objects/help/wesen-os/backend-documentation-system
```

## Runtime-pack symbol docs

Current source:

- `docs.by_package["kanban.v1"]`
- `docs.by_symbol["widgets.kanban.page"]`

Projected object paths:

```text
/docs/objects/pack/kanban.v1/index
/docs/objects/pack/kanban.v1/widgets.kanban.page
```

## Runtime-card docs

Current source:

- `docs.by_symbol["kanbanIncidentCommand"]`

Projected object path:

```text
/docs/objects/card/os-launcher/kanbanIncidentCommand
```

If later runtime-injected cards become documentable, they should still mount here if they can produce the same shape.

## Impact On Doc Browser UI

## Home screen

Current home behavior in `DocCenterHome.tsx`:

- apps mode shows module cards derived from `/api/os/apps` plus `/api/os/docs`
- help mode shows help pages

New home behavior:

- render mounted object collections, not just backend modules
- example sections:
  - Modules
  - Runtime Packs
  - Loaded Cards
  - Help

Possible simplified home layout:

```text
Doc Center Home
  Search Bar
  Mounted Collections
    Modules (inventory, gepa, ...)
    Packs (kanban.v1, ...)
    Cards (os-launcher/kanbanIncidentCommand, ...)
    Help
  Browse by Topic
  Browse by Type
```

## Reader screen

Current reader is module/help specific.

New reader should accept a canonical object path:

```ts
openDocObject('/docs/objects/card/os-launcher/kanbanIncidentCommand');
```

The reader no longer needs to care whether the object came from backend docs or frontend-generated VM metadata.

## Module docs screen

Current `ModuleDocsScreen.tsx` assumes one backend module id.

New model:

- keep the grouped-list visual pattern
- rename the underlying concept from “module docs screen” to something like “object collection screen”
- allow it to show:
  - module docs collection
  - pack docs collection
  - card docs collection for a stack/owner

## Search screen

This is one of the biggest impacts.

Current search works over `/api/os/docs` facets:

- modules
- doc types
- topics

New search must index across all mounted providers.

Recommended facets:

- `kind`
  - module, help, pack, card
- `owner`
  - inventory, wesen-os, kanban.v1, os-launcher
- `docType`
- `topics`
- optional `source`
  - backend, vmmeta, runtime

Search result cards should show:

- object title
- path
- kind badge
- owner badge
- short summary

## Impact On Module Browser UI

APP-21 needs to change the Module Browser intentionally rather than by accident.

## What Module Browser does today

It currently browses:

- backend apps
- reflection APIs
- schemas

and its detail panel can open docs linked from reflection or the selected module’s docs.

## What should change

### Option A: keep columns the same, improve detail panel docs section

This is the smallest UI change.

When a module is selected:

- keep current reflection + module detail behavior
- add mounted docs-object links for any registered objects owned by that module/app/stack

Example:

- select `os-launcher`
- detail panel shows:
  - module docs (if any)
  - runtime-pack docs (`kanban.v1`)
  - runtime-card docs (`kanbanIncidentCommand`, `kanbanSprintBoard`, ...)

This is likely the best first implementation.

### Option B: add a fourth column for docs objects

More explicit, but larger UI change.

Example columns:

- Modules
- APIs
- Schemas
- Docs Objects

This matches some of the older docs-browser design thinking, but it is more work.

### Recommendation

Start with Option A.

Why:

- it preserves the current Module Browser mental model
- it adds card-doc discoverability without redesigning the whole browser
- it keeps the first APP-21 implementation focused on docs-object registration and search

## Direct-Cutover Implementation Plan

## Phase 1: introduce docs object domain types and mount registry

Target files:

- `apps/apps-browser/src/domain/types.ts`
- new docs-object domain module in `apps-browser`
- new docs mount registry module in `apps-browser`

Actions:

- add `DocObjectSummary`, `DocObject`, `DocObjectKind`
- add canonical object-path helpers
- add the `DocsMount` interface with synchronous `mountPath()`
- add external-store registry APIs and snapshot helpers
- stop using backend DTO types as the internal UI model

## Phase 2: add external docs catalog store and hooks

Target files:

- new docs catalog store in `apps-browser`
- new hook layer in `apps-browser`

Actions:

- mirror registered mounts and mounted object summaries into a serializable external snapshot
- add store methods for:
  - refreshing mounts
  - reading one object by path
  - searching across mounts
- add hooks for:
  - index/home state
  - one collection by mount path
  - one object by canonical path
  - mounted-object search
- keep mount objects themselves outside Redux

## Phase 3: add concrete docs mounts/providers

Target files:

- backend provider adapter
- runtime-card provider adapter
- runtime-pack provider adapter
- apps-browser startup/bootstrap files

Actions:

- wrap current backend fetchers as `DocsMount`s
- wrap `vmmeta` exports as runtime-card/pack mounts
- register them at app startup

## Phase 4: rewrite doc browser to consume docs objects

Target files:

- `DocBrowserWindow.tsx`
- `DocCenterHome.tsx`
- `ModuleDocsScreen.tsx`
- `DocReaderScreen.tsx`
- `DocSearchScreen.tsx`

Actions:

- convert each screen to consume docs-object lists and reader lookups
- add kind/owner aware facets in search
- render mounted collections on home

## Phase 5: extend Module Browser detail panel

Target files:

- `ModuleBrowserWindow.tsx`
- `BrowserDetailPanel.tsx`

Actions:

- add mounted docs objects section for selected app/module
- show runtime-pack and runtime-card docs when they belong to the selected owner
- open docs by canonical object path

## Phase 6: optional backend alignment

If later desired, backend can also expose canonical docs-object endpoints. But APP-21 does not need that first.

Important:

- because the user explicitly said compatibility is not needed, do not keep the old frontend docs fetch model alive indefinitely
- once the docs-object registry exists, the UI should move to it directly

## Pseudocode

### Registry bootstrap

```ts
registerDocsMount(
  createBackendModuleDocsMount({
    appId: 'inventory',
  }),
);

registerDocsMount(
  createRuntimePackDocsMount({
    metadata: OS_LAUNCHER_VM_PACK_METADATA,
  }),
);

registerDocsMount(
  createRuntimeCardDocsMount({
    owner: 'os-launcher',
    cards: KANBAN_VM_CARD_META,
    docs: OS_LAUNCHER_VM_PACK_METADATA.docs,
  }),
);
```

### Registry internals

```ts
class DocsRegistry {
  private mounts = new Map<string, DocsMount>();
  private listeners = new Set<() => void>();

  register(mount: DocsMount) {
    const path = mount.mountPath();
    this.mounts.set(path, mount);
    this.emit();
    return () => {
      this.mounts.delete(path);
      this.emit();
    };
  }

  resolve(path: string) {
    return longestPrefixMountMatch(path, this.mounts);
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
```

### External catalog flow

```ts
const docsCatalogStore = createDocsCatalogStore(docsRegistry);

function useDocsMount(mountPath: DocsMountPath) {
  const snapshot = useDocsCatalogSnapshot();
  useEffect(() => {
    void docsCatalogStore.ensureMountLoaded(mountPath);
  }, [mountPath]);
  return snapshot.mounts[mountPath];
}
```

## Risks

## Risk 1: trying to preserve too many old shapes

If the UI keeps consuming:

- `ModuleDocDocument`
- `OSDocResult`
- `vmmeta` docs

all separately, the feature will become harder to extend immediately.

Mitigation:

- direct cutover to one `DocObject` model

## Risk 2: overloading “module” identity

Not every docs owner is a backend app/module.

Mitigation:

- keep `kind` and `owner` distinct
- do not cram card docs into fake backend module ids unless the UX explicitly wants that

## Risk 3: search facet confusion

If card docs and module docs are mixed without new facets, search becomes noisy.

Mitigation:

- add `kind` and `owner` facets
- show badges clearly in result cards

## Open Questions

- Should runtime-card docs for transient artifact-injected cards be persisted anywhere, or only mounted while loaded?
- Should Module Browser eventually gain a dedicated docs column, or is a detail-panel section enough?
- Should `/docs/objects/...` remain a conceptual internal route only, or later become a real HTTP namespace too?

## Validation Strategy

When implemented, validate at four levels.

### Unit

- object-path parsing/building
- docs-object projection from backend docs
- docs-object projection from `vmmeta`
- bootstrap of default mounts for backend module docs and help docs
- owner-based mounted docs rendering in the Module Browser detail panel
- search facet construction across mixed providers

### Component

- `DocCenterHome` renders mixed collections
- `DocSearchScreen` shows pack/card docs and filters them correctly
- `BrowserDetailPanel` shows mounted runtime-card docs for selected owners

### Integration

- launch doc browser and open `/docs/objects/card/os-launcher/kanbanIncidentCommand`
- select `os-launcher` in Module Browser and open a card doc from the detail panel
- search for `kanban` and confirm module docs plus runtime-card docs both appear

### Smoke

- verify backend module docs still appear as docs objects
- verify help docs still appear as docs objects
- verify built-in Kanban card docs appear under the new mounted objects model

## Alternatives Considered

## Alternative A: keep backend module docs as-is and add a second frontend-only card-doc browser

Rejected because it preserves the split the user is trying to remove.

## Alternative B: stuff runtime-card docs into fake module docs endpoints

Rejected because it blurs the ownership model and still treats cards as awkward pseudo-modules.

## Alternative C: use a compatibility shim that converts old endpoints on the fly but keeps old frontend DTOs alive

Rejected because the user explicitly does not want backward compatibility if it adds complexity.

## Recommendation

Use one docs object tree rooted at `/docs/objects/{kind}/{owner}/{slug}`.

Treat documentation as mounted readable objects, conceptually like a small Plan 9-style filesystem:

- each provider mounts a subtree
- each object has one shape
- listing, reading, and searching operate on the shared shape
- UI surfaces consume the shared shape directly

Start by integrating built-in runtime-pack and card docs from `vmmeta`, because that path already has rich metadata and no backend blocker.

## References

- [module.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/launcher/module.tsx)
- [ModuleBrowserWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/ModuleBrowserWindow.tsx)
- [BrowserDetailPanel.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/BrowserDetailPanel.tsx)
- [docsRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsRegistry.ts)
- [docsCatalogStore.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsCatalogStore.ts)
- [docsHooks.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsHooks.ts)
- [DocBrowserWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocBrowserWindow.tsx)
- [DocCenterHome.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx)
- [ModuleDocsScreen.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/ModuleDocsScreen.tsx)
- [appsApi.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/api/appsApi.ts)
- [types.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/types.ts)
- [kanbanVmmeta.generated.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts)
- [vmmeta.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vmmeta.ts)
- [docmw.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-backend/pkg/docmw/docmw.go)
- [manifest_endpoint.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-backend/pkg/backendhost/manifest_endpoint.go)
- [docs_endpoint.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/cmd/wesen-os-launcher/docs_endpoint.go)
