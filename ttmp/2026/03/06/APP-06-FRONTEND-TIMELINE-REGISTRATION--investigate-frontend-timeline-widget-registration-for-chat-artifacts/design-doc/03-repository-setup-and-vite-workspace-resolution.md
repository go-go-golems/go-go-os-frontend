---
Title: Repository Setup and Vite Workspace Resolution
Ticket: APP-06-FRONTEND-TIMELINE-REGISTRATION
Status: active
Topics:
    - frontend
    - chat
    - timeline
    - hypercard
    - wesen-os
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/apps/os-launcher/vite.config.ts
      Note: Vite workspace alias and dependency optimization setup
    - Path: ../../../../../../../wesen-os/package.json
      Note: Root workspace package manager entry point
    - Path: ../../../../../../../wesen-os/pnpm-workspace.yaml
      Note: Workspace package discovery
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.tsx
      Note: Linked app source imported directly by os-launcher
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/components/ChatConversationWindow.tsx
      Note: Shared frontend package consumed through workspace-links
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/WindowSurface.tsx
      Note: Example source file that may appear in the browser under nested node_modules while still resolving to workspace source
ExternalSources: []
Summary: Explains how wesen-os composes the local monorepo-like development environment across multiple linked repositories, how Vite resolves @hypercard packages from workspace-links, why browser URLs can show nested node_modules paths, and how the current alias-based setup preserves HMR after preserveSymlinks was removed.
LastUpdated: 2026-03-06T18:10:00-05:00
WhatFor: Use when debugging frontend import resolution, duplicate package instances, HMR failures, or confusing browser module paths in the merged wesen-os development environment.
WhenToUse: Use before changing Vite resolution rules, when linked package edits do not reload correctly, or when a developer needs to understand which repo/file to edit for a given frontend module.
---

# Repository Setup and Vite Workspace Resolution

## Why This Document Exists

The `wesen-os` repository is not a self-contained frontend monorepo in the normal sense.

Instead, it acts as the development host that pulls together:

- its own top-level app shell and backend launcher code
- frontend packages from `go-go-os-frontend`
- app implementations from repositories such as `go-go-app-inventory` and `go-go-app-sqlite`
- sometimes additional app-specific or tool-specific repositories

Those external repositories are mounted into `wesen-os` under `workspace-links/`.

This is convenient because a developer can work on the merged system from one place, but it also means package resolution is more subtle than in a single ordinary pnpm monorepo. This document explains that setup and the specific Vite behavior that matters for chat/timeline development.

## Mental Model

Think of `wesen-os` as the dev-time composition root.

```text
wesen-os
  apps/os-launcher
    Vite app shell
    imports launchers and shared packages

  workspace-links/
    go-go-os-frontend/
      packages/chat-runtime
      packages/hypercard-runtime
      packages/engine
      packages/desktop-os
      ...

    go-go-app-inventory/
      apps/inventory

    go-go-app-sqlite/
      apps/sqlite

    ...
```

The important consequence is:

- the dev server is started from `wesen-os`
- the code you are editing may actually live under `workspace-links/...`
- the package import may look like `@hypercard/chat-runtime`
- the browser may show an odd `/@fs/.../node_modules/...` path
- but the real source of truth is usually a file under `workspace-links/.../packages/.../src/...`

## Which Repository Owns What

For frontend chat and timeline work, the most important ownership split is:

- `wesen-os`
  - owns the combined launcher app
  - owns the Vite setup
  - owns the environment where linked repos are composed together
- `go-go-os-frontend`
  - owns shared frontend packages like `@hypercard/chat-runtime`, `@hypercard/hypercard-runtime`, `@hypercard/engine`, and `@hypercard/desktop-os`
- `go-go-app-inventory`
  - owns the inventory app UI and launcher integration
  - consumes shared packages from `go-go-os-frontend`

When you see this import:

```ts
import { formatAppKey, parseAppKey } from '@hypercard/desktop-os';
```

inside inventory, the source does not live in inventory. It lives in the shared frontend repo under a path like:

- [desktop-os source package](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/desktop-os)

Likewise, if the browser shows a module path ending in:

- [WindowSurface.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/WindowSurface.tsx)

that is still shared frontend source, even if the browser URL looks like it came from nested `node_modules`.

## Why Browser URLs Can Look Wrong

Before the recent Vite change, `apps/os-launcher/vite.config.ts` used:

```ts
resolve: {
  preserveSymlinks: true,
}
```

That tells Vite to keep the symlinked package identity instead of resolving to the real filesystem path.

In practice, that can produce browser URLs like:

```text
/@fs/.../apps/sqlite/node_modules/@hypercard/desktop-os/node_modules/@hypercard/hypercard-runtime/node_modules/@hypercard/engine/src/...
```

That path looks like a vendored dependency tree, but it often still points at the same physical workspace file.

The downsides of `preserveSymlinks: true` in this repository shape are:

- duplicate logical module identities for the same source package
- more risk of multiple instances of shared runtime state
- harder-to-reason-about renderer/module registration
- weaker HMR behavior for linked workspace packages
- confusing browser paths during debugging

This matters directly for chat runtime work because global registries are sensitive to duplicate package instances.

## Why Removing preserveSymlinks Broke Resolution At First

After removing `preserveSymlinks`, Vite started resolving linked source files by real path.

That fixed one problem, but it exposed another one:

- linked app files under `workspace-links/go-go-app-inventory/...`
- were now being transformed from their real filesystem location
- and their bare imports like `@hypercard/desktop-os` or `@hypercard/engine`
- no longer resolved automatically through the old symlink-shaped package path

That is why Vite started failing with errors like:

```text
Failed to resolve import "@hypercard/desktop-os"
```

The failure did not mean the package was missing. It meant the app shell needed an explicit mapping from package name to source entrypoint for the linked repositories.

## Current Vite Resolution Strategy

The current fix lives in:

- [vite.config.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/vite.config.ts)

The strategy is:

1. keep `preserveSymlinks` off
2. scan workspace package roots for `package.json`
3. read each `@hypercard/*` package `name` and `exports`
4. generate exact-match Vite aliases from package export name to real source path
5. continue excluding shared workspace packages from `optimizeDeps`

This means Vite now uses the real workspace source path while still understanding imports like:

```ts
import { ChatConversationWindow } from '@hypercard/chat-runtime';
import { HypercardCardRenderer } from '@hypercard/hypercard-runtime';
import { formatAppKey } from '@hypercard/desktop-os';
```

### Resolution Flow

```text
inventory source file
  imports @hypercard/chat-runtime
    -> Vite alias table matches exact package export
    -> alias points to workspace-links/go-go-os-frontend/packages/chat-runtime/src/index.ts
    -> Vite transforms real source file
    -> HMR watches real source path
```

### Why Exact-Match Aliases Matter

The alias implementation uses exact-match regular expressions rather than a simple object map.

That is important because these imports are different:

- `@hypercard/engine`
- `@hypercard/engine/desktop-core`
- `@hypercard/engine/theme`

If the root alias greedily matches subpaths, Vite can route submodule imports to the wrong file. Exact-match aliases prevent that.

## How HMR Works In This Setup

If a developer edits a shared package file such as:

- [ChatConversationWindow.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/components/ChatConversationWindow.tsx)
- [hypercardCard.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/timeline/hypercardCard.tsx)
- [WindowSurface.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/engine/src/components/shell/windowing/WindowSurface.tsx)

the desired behavior is:

1. Vite is serving the app from `wesen-os/apps/os-launcher`
2. the shared package import resolves to the real source path
3. Vite watches that real source path
4. the browser reloads or hot-updates the module

That is the main reason to prefer the current setup over `preserveSymlinks: true`.

## optimizeDeps And Why It Matters

The Vite config also excludes the shared workspace packages from dependency prebundling.

That matters because if a workspace package is prebundled as a dependency instead of treated as live source:

- edits may not invalidate the correct graph
- HMR gets less predictable
- the package can behave more like a third-party library than local code

In this repository, the shared packages should behave like first-party source during development.

## What To Edit When Something Breaks

Use this rule of thumb:

- if the error is about dev-server resolution, aliases, HMR, or browser import URLs:
  - start in [vite.config.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/vite.config.ts)
- if the error is in chat UI rendering or reducers:
  - start in [chat-runtime](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime)
- if the error is in HyperCard artifacts/cards:
  - start in [hypercard-runtime](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime)
- if the error is inventory-specific host wiring:
  - start in [inventory launcher](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.tsx)

## Debug Checklist

When a linked package import fails in the browser or dev server:

1. Confirm the package exists under `workspace-links/.../package.json`.
2. Confirm that package `name` begins with `@hypercard/`.
3. Confirm the package has an `exports` entry for the import path being used.
4. Confirm `vite.config.ts` alias generation is scanning that repository root.
5. Restart Vite after config changes.
6. If the import is a special launcher seam, check the explicit fallback aliases too.

When HMR does not pick up shared package edits:

1. Confirm the edited file is under a real source path, not built output.
2. Confirm the package is excluded from `optimizeDeps`.
3. Confirm Vite is not running with `preserveSymlinks: true`.
4. Confirm the browser is loading the app from the current dev server instance.

## Practical Example

Suppose you edit:

- [renderInventoryApp.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/apps/inventory/src/launcher/renderInventoryApp.tsx)

and that file imports:

```ts
import { formatAppKey, parseAppKey } from '@hypercard/desktop-os';
```

The resolution path is:

```text
renderInventoryApp.tsx
  -> @hypercard/desktop-os
  -> Vite alias generated from package.json exports
  -> workspace-links/go-go-os-frontend/packages/desktop-os/src/index.ts
  -> desktop-os source files
```

That is why the import is valid even though inventory itself does not contain the implementation.

## Recommended Team Rule

Treat `wesen-os` as the composition and tooling repo, not the exclusive owner of frontend code.

For code changes:

- edit the real owning package under `workspace-links/...`
- use `wesen-os` Vite only as the integrated execution environment
- keep Vite resolution rules explicit and source-oriented
- avoid returning to `preserveSymlinks: true` unless there is a specific, demonstrated need

That gives the cleanest mental model for future work on chat, cards, timeline rendering, and shared frontend packages.
