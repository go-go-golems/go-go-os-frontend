---
Title: os-shell public package design and implementation guide
Ticket: os-shell-public-package
Status: active
Topics:
    - npm
    - react
    - desktop
    - design-system
DocType: design-doc
Intent: implementation
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Design and implementation guide for publishing @go-go-golems/os-shell as the public shell/window-manager package boundary."
LastUpdated: 2026-05-11T17:20:00-04:00
WhatFor: "Explains how to extract, validate, and publish the shell/window-manager package boundary."
WhenToUse: "Use before changing package metadata, exports, store wiring, examples, or npm publishing for os-shell."
---

# os-shell Public Package Design and Implementation Guide

## Goal

Publish `@go-go-golems/os-shell` as the public package boundary for desktop-shell, launcher, app-registry, and window-manager consumption.

The package already exists in the monorepo, but it was still private and still depended on unpublished runtime packages. This ticket turns it into a public npm package and proves it from the standalone demo repository before publishing.

## Boundary

The public package boundary should teach consumers this import style:

```ts
import { DesktopShell, createLauncherStore } from '@go-go-golems/os-shell';
```

instead of deep or ambiguous imports such as:

```ts
import { DesktopShell } from '@go-go-golems/os-core/desktop-react';
```

The shell package may still delegate to `os-core` internally. The important public contract is that shell/window-manager consumers install and import `@go-go-golems/os-shell`.

## Package layering

```text
@go-go-golems/os-core
  theme, primitive widgets, low-level desktop state and view primitives

@go-go-golems/os-widgets
  rich widgets and widget-specific reducers/sample data

@go-go-golems/os-shell
  app manifests, launcher registry, store composition, DesktopShell/window manager exports

consumer app
  imports os-shell for shell/runtime composition and os-widgets for rich window contents
```

## Non-goals

- Do not publish `@go-go-golems/os-scripting` as part of this ticket.
- Do not move all source files physically out of `os-core` if that would destabilize existing apps.
- Do not create workspace-alias-only examples. Consumer validation must work before publishing via a local package artifact and after publishing via npm.

## Current problem

`packages/os-shell/package.json` was private and configured for GitHub Packages. It also had a workspace dependency on `@go-go-golems/os-scripting`, which is private and not suitable as a dependency of the first public shell package.

That means a public `os-shell` package must either:

1. publish all private transitive packages, or
2. remove the private dependency from the public shell surface.

This ticket chooses option 2.

## Public API surface

The first public shell package should expose three groups of APIs.

### 1. Manifest and launcher APIs

```ts
import {
  type AppManifest,
  type LaunchableAppModule,
  createAppRegistry,
  buildLauncherContributions,
  buildLauncherIcons,
  renderAppWindow,
} from '@go-go-golems/os-shell';
```

These APIs describe apps and turn app modules into desktop launcher contributions.

### 2. Store composition APIs

```ts
import {
  createLauncherStore,
  collectModuleReducers,
  selectModuleState,
} from '@go-go-golems/os-shell';
```

The store factory should include shell core reducers such as `windowing`, `notifications`, and `debug`, but should not depend on unpublished scripting reducers.

### 3. Desktop/window-manager APIs

```ts
import {
  DesktopShell,
  windowingActions,
  windowingReducer,
  type DesktopIconDef,
  type DesktopContribution,
} from '@go-go-golems/os-shell';
```

These exports define the public shell/window-manager boundary even if their implementation still lives in `os-core` internally.

## Store boundary

The public `createLauncherStore()` should produce a standalone Redux store with this core shape:

```text
{
  windowing: WindowingState,
  notifications: NotificationsState,
  debug: DebugState,
  ...sharedReducers,
  ...moduleReducers
}
```

It should reserve legacy engine keys so app modules cannot accidentally collide with historical runtime slices:

```text
pluginCardRuntime
runtimeSessions
windowing
notifications
debug
hypercardArtifacts
```

Only the public shell reducers are installed. Private scripting reducers remain outside this package.

## Demo validation before publish

Before npm publication, the demo project should install a local package artifact from `packages/os-shell/dist` or a packed tarball. The example should import from `@go-go-golems/os-shell` exactly as a public consumer would.

Add:

```text
examples/05-window-manager-shell
```

The stage should demonstrate:

- `DesktopShell`
- a minimal runtime bundle
- custom desktop icons
- a Redux store from `createLauncherStore([])`
- embedding the shell into the existing progressive examples navigator

## Implementation sequence

```text
1. Create ticket docs, tasks, and diary.
2. Make os-shell publishable: private false, npmjs publishConfig, public metadata.
3. Remove private os-scripting dependency from the public shell runtime.
4. Add os-shell desktop/window-manager re-export entrypoints.
5. Build os-shell dist and inspect dist/package.json.
6. Install local os-shell artifact in the demo repo.
7. Add stage 05 example that imports @go-go-golems/os-shell.
8. Validate typecheck/build/Storybook.
9. Publish @go-go-golems/os-shell.
10. Reinstall/verify from npm and record results.
```

## Review checklist

- `dist/package.json` has `private` omitted and `publishConfig.access = public`.
- No `workspace:*` dependencies remain in the dist package.
- No private unpublished package is required at install time.
- Demo imports use `@go-go-golems/os-shell`, not deep source paths.
- `npm run build:dist -w packages/os-shell` passes.
- Demo `npm run typecheck`, `npm run build`, and `npm run build-storybook` pass.
