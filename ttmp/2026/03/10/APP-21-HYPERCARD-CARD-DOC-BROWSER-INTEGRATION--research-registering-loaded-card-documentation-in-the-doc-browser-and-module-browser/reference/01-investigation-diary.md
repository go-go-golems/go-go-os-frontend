---
Title: Investigation diary
Ticket: APP-21-HYPERCARD-CARD-DOC-BROWSER-INTEGRATION
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - documentation
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts
      Note: |-
        Reviewed as the existing generated runtime-pack and card-doc metadata source
        Reviewed to confirm pack and card docs already exist in frontend metadata
    - Path: ../../../../../../../wesen-os/cmd/wesen-os-launcher/docs_endpoint.go
      Note: |-
        Reviewed as the current aggregate docs endpoint implementation
        Reviewed to confirm the aggregate docs endpoint is still backend-only
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-backend/pkg/docmw/docmw.go
      Note: Reviewed as the current backend doc store format
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/api/appsApi.ts
      Note: Reviewed as the backend-only docs fetch layer
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/BrowserDetailPanel.tsx
      Note: |-
        Reviewed as the current Documentation section in the detail panel
        Reviewed to confirm docs links currently come from reflection
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/ModuleBrowserWindow.tsx
      Note: |-
        Reviewed as the current Module Browser docs-entry seam
        Reviewed to confirm current docs affordances in the browser UI
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx
      Note: Reviewed as the current home and aggregate-docs landing behavior
ExternalSources: []
Summary: Investigation diary for APP-21 covering the current docs-browser/module-browser architecture, the runtime-card docs metadata path, and the recommendation to unify all docs under a mounted docs-object model rooted at /docs/objects.
LastUpdated: 2026-03-10T09:10:00-04:00
WhatFor: Record the evidence, design reasoning, and commands behind APP-21 so another engineer can continue from the current research state without re-mapping the docs system.
WhenToUse: Use when continuing APP-21, reviewing the current docs-browser architecture, or implementing docs-object registration for runtime cards.
---


# Investigation diary

## Goal

Capture the current docs-browser and Module Browser architecture, explain why loaded runtime-card docs are invisible today, and record the design reasoning for a mounted docs-object tree rooted at `/docs/objects/{kind}/{owner}/{slug}`.

## Step 1: Map The Existing Docs Surfaces And The Runtime-Card Metadata Path

The first task was to verify whether loaded-card docs were already close to the doc browser contract or whether they lived in a completely different lane. The answer is the latter. The doc browser is still built around backend module-doc APIs, while the runtime-card docs that now exist for Kanban are emitted into frontend-generated metadata. That architectural split matters more than any individual missing button.

Once I mapped the live files, the important shape became obvious: this is not a “just add one more fetcher” problem. It is an identity problem. Module docs, help docs, pack docs, and card docs are all documentation objects, but the current system does not treat them that way. The right level to fix is the object model, the browsing/search model, and the Module Browser’s docs affordances.

### Prompt Context

**User prompt (verbatim):**

> Make a new ticket docmgr and research what it would take to register the documentation of loaded cards into the doc browser that I think can be accessed through the module browser?
>
> reate a detailed analysis / design / implementation guide that is very detailed for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file
>   references.
>   It should be very clear and detailed. Store in the ticket and the nupload to remarkable.

**Assistant interpretation:** Create a new research/design ticket for integrating loaded runtime-card docs into the existing doc browser and Module Browser, and document the current architecture plus an implementation direction in intern-friendly detail.

**Inferred user intent:** Make runtime-card documentation a first-class discoverable object in the same browsing/search surfaces that already exist for module docs.

**Commit (code):** N/A

### What I did

- Created APP-21 in `openai-app-server` with a design doc and investigation diary.
- Read the current frontend docs surfaces:
  - `apps-browser/src/launcher/module.tsx`
  - `apps-browser/src/components/ModuleBrowserWindow.tsx`
  - `apps-browser/src/components/BrowserDetailPanel.tsx`
  - `apps-browser/src/components/doc-browser/DocBrowserWindow.tsx`
  - `apps-browser/src/components/doc-browser/DocCenterHome.tsx`
  - `apps-browser/src/components/doc-browser/ModuleDocsScreen.tsx`
  - `apps-browser/src/api/appsApi.ts`
  - `apps-browser/src/domain/types.ts`
- Read the current backend docs surfaces:
  - `pkg/docmw/docmw.go`
  - `pkg/backendhost/manifest_endpoint.go`
  - `cmd/wesen-os-launcher/docs_endpoint.go`
- Read the new runtime-card docs metadata path:
  - `apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts`
  - `apps/os-launcher/src/domain/vmmeta.ts`

### Why

- The user specifically linked the problem to the doc browser and Module Browser, so the research needed to trace the actual live browsing/search surfaces.
- The existence of `vmmeta` docs metadata meant there was already a real card-doc source to reason about instead of a hypothetical future one.

### What worked

- The file audit cleanly separated current responsibilities:
  - backend module/help docs: network-backed and indexed
  - runtime-card docs: frontend-generated and not indexed
- That made it possible to propose a concrete unification model instead of a vague “sync them somehow” answer.

### What didn't work

- The current system has no shared object model between module docs and runtime-card docs, so there was no single file or contract I could point to and say “just plug cards in here.” The ticket had to be written from multiple seams rather than one extension point.

### What I learned

- The doc browser is more tightly coupled to backend DTOs than it should be.
- The Module Browser is not really a generic object browser yet; it is still primarily a backend app/reflection browser.
- The generated VM docs path already provides enough metadata richness to support a real docs-browser integration once the registry/search model exists.

### What was tricky to build

- The tricky part was deciding whether to recommend another API shim or a real contract cutover. The user then made that easier by clarifying two strong preferences:
  - use a `/docs` style unified path
  - do not preserve backward compatibility if it complicates things

Those constraints shifted the design from “wrap old APIs” to “introduce one canonical docs-object tree.” The final concept is deliberately Plan 9-like: mounted subtrees, one readable object format, and canonical object paths.

### What warrants a second pair of eyes

- The exact ownership mapping for `owner` in `/docs/objects/{kind}/{owner}/{slug}` needs review:
  - backend module id?
  - stack id?
  - pack id?
  - synthetic owner for help docs?
- The Module Browser UX should be reviewed carefully before implementation. The smallest first step is probably adding a mounted docs section in the detail panel rather than redesigning the whole browser.

### What should be done in the future

- Implement a docs-object registry in `apps-browser` and stop treating backend DTOs as the internal UI model.
- Mount the existing backend docs endpoints into that registry as providers.
- Mount `vmmeta` pack/card docs into the same registry.
- Then update doc browser home/search/reader and Module Browser detail behavior to consume the unified model.

### Code review instructions

- Start with the APP-21 design doc.
- Compare the current fetch-model notes against:
  - [appsApi.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/api/appsApi.ts)
  - [DocCenterHome.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx)
  - [ModuleDocsScreen.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/ModuleDocsScreen.tsx)
- Then compare the runtime-card docs notes against:
  - [kanbanVmmeta.generated.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/generated/kanbanVmmeta.generated.ts)
  - [vmmeta.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vmmeta.ts)

### Technical details

Current docs sources:

```text
backend:
  /api/apps/{id}/docs
  /api/apps/{id}/docs/{slug}
  /api/os/docs
  /api/os/help

frontend:
  vmmeta.generated.ts
```

Recommended canonical path model:

```text
/docs/objects/module/<module-id>/<slug>
/docs/objects/help/<owner>/<slug>
/docs/objects/pack/<pack-id>/<slug>
/docs/objects/card/<owner>/<card-id>
```

Reason for the new model:

- one path scheme
- one object contract
- one search index
- one reader model
- no compatibility clutter

## Related

- [index.md](../index.md)
- [tasks.md](../tasks.md)
- [changelog.md](../changelog.md)
- [01-intern-guide-to-registering-loaded-card-documentation-in-the-doc-browser-and-module-browser.md](../design-doc/01-intern-guide-to-registering-loaded-card-documentation-in-the-doc-browser-and-module-browser.md)

## Step 3: Remove The Redux Docs Slice, Cut The Doc Browser Over To External Stores, And Fix Default Mount Bootstrap

The earlier APP-21 implementation path proved the mounted-provider model, but it still kept a Redux-facing docs projection in the middle. That extra layer was not buying enough. The mounted docs runtime already had a real registry and a serializable snapshot; keeping a second docs-specific Redux slice just duplicated state and made the UI rewrite harder to reason about. The right move was to cut it out entirely and let the doc browser talk to the external catalog store through hooks.

That change also flushed out a real regression immediately: once the doc browser depended only on mounted collections, the old module/help docs disappeared because the bootstrap path for default mounts was broken. `registerDefaultDocsMounts()` was parsing `/api/os/apps` as a bare array instead of `{ apps: [...] }`, so no module mounts were ever registered, and the doc browser quite correctly reported “No docs mount registered for /docs/objects/module/inventory”. Fixing that bug was part of the same slice, because otherwise the no-Redux cutover would have left the app in a visibly regressed state.

### Prompt Context

**User prompt (verbatim):**

> ok, let's kill redux. update your docs and tasks, the continue working.

**Assistant interpretation:** Remove the APP-21 docs-specific Redux projection, rewrite the docs flow around the external registry/catalog-store model, update the ticket docs to match, and keep implementing the remaining UI work.

**Inferred user intent:** Simplify the docs integration architecture so mounted docs behave like a small runtime of their own rather than another Redux-backed subsystem.

**Commit (code):** Pending

### What I did

- Removed the docs-specific Redux slice and registry-sync bridge from `apps-browser`.
- Added the external catalog store and hook layer:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsCatalogStore.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsHooks.ts`
- Rewrote the docs browser around canonical object paths and mounted collections:
  - `DocCenterHome.tsx`
  - `ModuleDocsScreen.tsx`
  - `DocReaderScreen.tsx`
  - `DocSearchScreen.tsx`
  - `TopicBrowserScreen.tsx`
  - `DocBrowserWindow.tsx`
  - `DocBrowserContext.tsx`
  - `docLinkInteraction.ts`
- Updated apps-browser routing and command helpers to use canonical docs object paths and collection paths:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/launcher/module.tsx`
- Updated Module Browser and Get Info doc linking to use canonical object paths:
  - `BrowserDetailPanel.tsx`
  - `ModuleBrowserWindow.tsx`
  - `GetInfoWindow.tsx`
- Fixed the default docs bootstrap bug:
  - `registerDefaultDocsMounts()` now parses `/api/os/apps` as `{ apps: [...] }`
  - default mount registration now runs from a guarded `useEffect` bootstrap instead of render-time fire-and-forget logic
- Added proof/coverage:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/BrowserDetailPanel.test.tsx`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/BrowserDetailPanel.stories.tsx`

### Why

- The docs runtime already had a better source of truth than Redux: the mounted registry plus a serializable external snapshot.
- The user explicitly wanted to “kill redux” for docs, and that simplification is architecturally correct here.
- The UI rewrite becomes clearer once the docs browser reads one mounted-object runtime instead of a reducer tree plus API DTOs plus registry glue.

### What worked

- The no-Redux cutover removed a whole layer of bookkeeping without losing stable snapshots.
- Canonical object paths now drive the docs browser screens and route helpers directly.
- The Browser Detail panel can render owner-matched mounted docs without a docs reducer at all.
- The bootstrap regression was easy to isolate once the doc browser stopped papering over missing mounts with old fetch paths.

### What didn't work

- The first bootstrap implementation after the no-Redux pivot left the default module/help mounts missing. The visible symptom was:

```text
Collection failed to load: No docs mount registered for /docs/objects/module/inventory
```

- Root cause: `registerDefaultDocsMounts()` treated `/api/os/apps` as `AppManifestDocument[]` instead of `AppsManifestResponse`.
- The previous render-time async bootstrap also had poor failure semantics: if the registration failed once, it would silently stay broken until reload.

### What I learned

- External-store architectures become easier to reason about once they stop pretending Redux still owns the domain.
- Mounted docs are a runtime, not just a data fetch path.
- The default module/help mounts are part of the same runtime contract as `vmmeta` pack/card mounts now, so their bootstrap needs the same level of care.

### What was tricky to build

- The sharp edge was not the docs browser rewrite itself; it was bootstrap ordering and failure behavior. Once docs moved off the old fetch paths, the app became sensitive to whether the mount registry was actually populated before the UI queried it. The broken `/api/os/apps` parsing made that visible immediately, and the fix was twofold:
  - correct the response shape
  - move the async bootstrap into a guarded effect with retry-safe bookkeeping instead of triggering it during render

### What warrants a second pair of eyes

- The owner-matching behavior in the Module Browser currently works best for `module/*` and `card/*` mounts whose `owner` equals the selected app id. Pack docs still use pack ids (`kanban.v1`) as owners, so pack-to-app surfacing needs a deliberate mapping decision.
- The external catalog store keeps cached object/mount/search state across the app lifetime. That is fine for now, but cache eviction policy may matter later if mounted sources become much larger.

### What should be done in the future

- Decide whether pack docs should stay pack-owned only or whether packs should advertise an owning app/stack for Module Browser integration.
- Add the docs-source playbook requested by the user so future providers follow the same mount contract.

### Code review instructions

- Start with the no-Redux runtime core:
  - [docsRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsRegistry.ts)
  - [docsCatalogStore.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsCatalogStore.ts)
  - [docsHooks.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsHooks.ts)
- Then review the doc browser cutover:
  - [DocBrowserWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocBrowserWindow.tsx)
  - [DocCenterHome.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx)
  - [ModuleDocsScreen.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/ModuleDocsScreen.tsx)
  - [DocReaderScreen.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocReaderScreen.tsx)
  - [DocSearchScreen.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocSearchScreen.tsx)
- Finish with bootstrap and Module Browser integration:
  - [docsMountAdapters.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsMountAdapters.ts)
  - [module.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/launcher/module.tsx)
  - [BrowserDetailPanel.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/BrowserDetailPanel.tsx)

### Technical details

Validation commands:

```bash
cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser
npm test -- --run \
  src/components/BrowserDetailPanel.test.tsx \
  src/domain/docsMountAdapters.test.ts \
  src/components/doc-browser/DocBrowserContext.test.ts \
  src/components/doc-browser/DocBrowserWindow.test.ts \
  src/domain/docsRegistry.test.ts \
  src/domain/docsCatalogStore.test.ts \
  src/launcher/module.test.tsx

cd /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os
node node_modules/typescript/bin/tsc --noEmit -p workspace-links/go-go-os-frontend/apps/apps-browser/tsconfig.json
```

## Step 2: Add The External Docs Registry And Redux Projection Layer

The implementation started with the boundary decision that the design document already called for: mounted provider objects stay outside Redux, while Redux stores only a serializable projection of those providers. That let me add the registry mechanics without forcing non-serializable mount objects, promises, or behaviorful methods into app state. The pattern is the same one React expects from `useSyncExternalStore`, just with Redux sitting downstream of the external store instead of replacing it.

The first concrete slice added canonical docs-object path types and a `DocsMount` interface. The second slice added a `DocsRegistry` with stable snapshots, longest-prefix path resolution, and search fan-out, then projected that registry into a new `docsExplorer` Redux slice through a startup-attached sync bridge. That keeps the architecture clean: provider objects are mounted once, the registry owns subscribe/unsubscribe and path resolution, and the UI can continue to use normal Redux selectors for mount summaries, selected docs, search state, and cached objects.

### Prompt Context

**User prompt (verbatim):**

> can we make it so that we mount "objects" that support a set of method (interface) that allows them to be doc providers, and we use maybe an external store to mount this into redux, so that we can use the normal redux paths?
>
> I'm not sure how this would all work? Is that how you plan to do it? How does the registry works?
>
> I do actually see you mount with a existly that, a set of methods but they're "classes" more like objects right now. This isnot important yet I think but will be in the future.

**Assistant interpretation:** Implement the first real APP-21 frontend slices around a method-based mounted docs-provider interface, and explain how an external registry plus Redux projection is supposed to work in practice.

**Inferred user intent:** Establish the actual mechanical foundation for mounted docs providers before changing UI screens, so later pack/card/module docs can register into one shared discovery model.

**Commit (code):** Pending

### What I did

- Added canonical docs object contracts in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsObjects.ts`
- Added the method-based mounted provider interface:
  - `DocsMount.mountPath()`
  - `DocsMount.list()`
  - `DocsMount.read()`
  - optional `DocsMount.search()`
- Added the external registry in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsRegistry.ts`
- Added registry tests in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsRegistry.test.ts`
- Added the Redux projection slice in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/features/docsExplorer/docsExplorerSlice.ts`
- Added the registry-to-Redux sync bridge in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/features/docsExplorer/docsRegistrySync.ts`
- Added projection tests in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/features/docsExplorer/docsRegistrySync.test.ts`
- Wired the `docsExplorer` reducer and startup sync into:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/app/store.ts`

### Why

- The user explicitly wanted mounted objects with method interfaces, not another pile of backend DTO fetchers.
- Keeping providers outside Redux preserves serializability and avoids storing behaviorful objects in app state.
- Adding a stable external registry first makes the later concrete mount adapters much simpler.

### What worked

- The `DocsRegistry` shape is small and direct:
  - `register()`
  - `subscribe()`
  - `getMounts()`
  - `listMountPaths()`
  - `resolve()`
  - `search()`
- Stable mount snapshots are cached until the registry changes, so future `useSyncExternalStore` consumers will not loop on fresh array identities.
- The Redux slice now has the right long-term shape for the UI:
  - mount list
  - summaries by path
  - grouped summary paths by mount
  - selected object path
  - object cache
  - search state

### What didn't work

- My first typecheck attempt used the wrong `typescript` binary path from inside `apps/apps-browser`, so Node failed with:

```text
Error: Cannot find module '/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/node_modules/typescript/bin/tsc'
```

- Rerunning the targeted `tsc` from the `wesen-os` root resolved that path issue.

### What I learned

- The external-store model fits APP-21 very naturally:
  - registry as source of truth for provider objects
  - Redux as source of truth for serializable UI state derived from that registry
- The store startup wiring is the right place to attach the sync bridge, not a React component.
- Search fan-out can already work before any UI cutover, because the registry can query mounts directly.

### What was tricky to build

- The sharpest edge was snapshot identity. I had just fixed a similar `useSyncExternalStore` problem in `Stacks & Cards`, so I did not want to repeat it here. If `getMounts()` returns a new array on every call, React will treat each read as a changed snapshot even when the registry is unchanged.
- The fix was to cache the mount snapshot and invalidate it only on actual register/unregister changes.
- The second tricky part was deciding whether the sync bridge should live in React or in store creation. Store creation is cleaner because it keeps registry projection deterministic and testable without mounting a component tree.

### What warrants a second pair of eyes

- The current `search()` fallback for mounts without native search just calls `list()` and filters in memory. That is fine for the first slice, but larger providers may want explicit search support quickly.
- The `docsExplorer` slice currently groups summaries by mount path only. The future UI may also want `kind` and `owner` indexes to avoid recomputing them repeatedly.

### What should be done in the future

- Add concrete mount adapters for:
  - backend module docs
  - help docs
  - `vmmeta` pack docs
  - `vmmeta` card docs
- Register those mounts at apps-browser startup.
- Then cut the doc browser screens over from backend-only fetch DTOs to the new object model.

### Code review instructions

- Start with:
  - [docsObjects.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsObjects.ts)
  - [docsRegistry.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsRegistry.ts)
- Then review the Redux projection pieces:
  - [docsExplorerSlice.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/features/docsExplorer/docsExplorerSlice.ts)
  - [docsRegistrySync.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/features/docsExplorer/docsRegistrySync.ts)
  - [store.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/app/store.ts)
- Validate with:
  - `npm test -- --run src/domain/docsRegistry.test.ts src/features/docsExplorer/docsRegistrySync.test.ts`
  - `node node_modules/typescript/bin/tsc --noEmit -p workspace-links/go-go-os-frontend/apps/apps-browser/tsconfig.json`

### Technical details

External registry model:

```ts
interface DocsMount {
  mountPath(): `/docs/objects/${string}/${string}`;
  list(subpath?: string[]): Promise<DocObjectSummary[]>;
  read(subpath: string[]): Promise<DocObject | null>;
  search?(query: DocsSearchQuery): Promise<DocObjectSummary[]>;
}
```

Sync model:

```text
DocsMount objects
  -> DocsRegistry
  -> registry.subscribe(refresh)
  -> refresh() lists mounts and builds serializable summaries
  -> docsExplorer Redux slice stores those summaries
  -> UI reads docsExplorer via normal selectors
```

## Step 3: Add Concrete Mount Adapters And Register The First Real Providers

With the registry and projection layer in place, the next slice was to prove that the model can carry both old and new documentation sources at once. That meant implementing actual mounted providers instead of leaving the architecture abstract. I added adapters for backend module docs, help docs, and the frontend-generated `vmmeta` docs shape, then registered those mounts at startup from the right layer.

The important boundary here is ownership. `apps-browser` can bootstrap default mounts for backend module docs and help docs because those are generic and discoverable from the existing APIs. But `apps-browser` cannot know anything about `os-launcher`’s generated `vmmeta` metadata. That registration belongs at the app layer. So the pack/card mount factories live in `apps-browser`, and `wesen-os` calls them with `OS_LAUNCHER_VM_PACK_METADATA` during startup.

### Prompt Context

**User prompt (verbatim):** (same as Step 2)

**Assistant interpretation:** Continue APP-21 by turning the abstract registry design into real mounted docs providers, including app-level registration for the `os-launcher` runtime-pack/card docs.

**Inferred user intent:** Prove that the mounted docs-object model is viable with actual current data sources before rewriting the doc browser UI.

**Commit (code):** Pending

### What I did

- Added backend and `vmmeta` mount adapters in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsMountAdapters.ts`
- Added adapter tests in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsMountAdapters.test.ts`
- Registered default backend/help mounts once per registry in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/launcher/module.tsx`
- Added `wesen-os` startup registration for `os-launcher` `vmmeta` pack/card docs in:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/registerAppsBrowserDocs.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/modules.tsx`

### Why

- APP-21 needed real providers, not only contracts, before the UI cutover.
- Backend module docs and help docs were the easiest existing sources to mount because they already have endpoint contracts.
- `vmmeta` pack/card docs were the critical proof that frontend-generated card docs can enter the same registry without going through backend docs endpoints first.

### What worked

- The adapters now cover all four intended source families:
  - module
  - help
  - pack
  - card
- The startup split is clean:
  - `apps-browser` bootstraps generic mounts
  - `wesen-os` registers app-owned `vmmeta` mounts
- Adapter tests passed for:
  - backend module-doc mapping
  - default module/help mount bootstrap
  - `vmmeta` pack/card mapping

### What didn't work

- The first pass of the `vmmeta` adapter types assumed mutable arrays, but the generated metadata object is `readonly`. TypeScript rejected that with:

```text
error TS4104: The type 'readonly string[]' is 'readonly' and cannot be assigned to the mutable type 'string[]'.
```

- The fix was to normalize those arrays with spreads before assigning them into `DocObject.tags` and `DocObject.seeAlso`.
- `apps/os-launcher` typecheck still fails in this workspace, but only because of the existing unrelated `rich-widgets` errors that were already present. The new `vmmeta` registration errors are gone.

### What I learned

- The app-layer registration split was the right call. Trying to make `apps-browser` discover `os-launcher` `vmmeta` directly would have created the wrong dependency direction.
- `vmmeta` is already rich enough to act like a first-class docs provider:
  - pack overview
  - pack DSL symbol docs
  - card docs
  - card source

### What was tricky to build

- The main design edge was deciding where startup registration belongs. It is tempting to stuff everything into the registry bootstrap inside `apps-browser`, but that would force package-level knowledge of app-specific metadata. The clean split is:
  - generic source adapters in the shared package
  - actual app-owned provider registration in the app
- The second edge was making bootstrap idempotent. I used one-time guards so repeated `AppsBrowserHost` mounts or repeated `modules.tsx` evaluation do not keep re-registering the same providers.

### What warrants a second pair of eyes

- The current default module-doc bootstrap fetches `/api/os/apps` once and registers mounts for docs-available apps. If mounted apps can change dynamically at runtime, this will eventually need a refresh path.
- The current card-doc mount stores source inline in the `content` payload. That is fine for a first pass, but the later reader UI may want a more structured “prose plus source” representation.

### What should be done in the future

- Rewrite the doc browser home/listing/search/reader screens to use `docsExplorer` rather than the old backend DTO fetch flow.
- Add object-oriented affordances in the Module Browser detail panel.
- After the UI cutover, write the repo playbook for adding a new docs source to this system.

### Code review instructions

- Start with:
  - [docsMountAdapters.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsMountAdapters.ts)
  - [module.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/launcher/module.tsx)
- Then review the app-level registration seam:
  - [registerAppsBrowserDocs.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/registerAppsBrowserDocs.ts)
  - [modules.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/app/modules.tsx)
- Validate with:
  - `npm test -- --run src/domain/docsRegistry.test.ts src/domain/docsMountAdapters.test.ts src/features/docsExplorer/docsRegistrySync.test.ts`
  - `node node_modules/typescript/bin/tsc --noEmit -p workspace-links/go-go-os-frontend/apps/apps-browser/tsconfig.json`
  - `node node_modules/typescript/bin/tsc --noEmit -p apps/os-launcher/tsconfig.json`
    - expected to still fail in this workspace because of pre-existing `rich-widgets` errors, not because of the new mount registration

### Technical details

Startup registration split:

```text
apps-browser startup:
  fetch /api/os/apps once
  register /docs/objects/module/<app-id>
  register /docs/objects/help/wesen-os

wesen-os startup:
  import OS_LAUNCHER_VM_PACK_METADATA
  register /docs/objects/pack/kanban.v1
  register /docs/objects/card/os-launcher
```
