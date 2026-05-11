---
Title: os-shell public package diary
Ticket: os-shell-public-package
Status: active
Topics:
    - npm
    - react
    - desktop
    - design-system
DocType: diary
Intent: implementation
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Chronological diary for extracting and publishing the public @go-go-golems/os-shell package."
LastUpdated: 2026-05-11T17:25:00-04:00
WhatFor: "Records implementation steps, validation, failures, commits, and publish results."
WhenToUse: "Use while reviewing or continuing the os-shell publication work."
---

# os-shell Public Package Diary

## Step 1: Created the package-boundary ticket

### Prompt Context

**User prompt (verbatim):** "make os-shell package. Add a design/implementation guide to the ticket, a list of tasks to extract the os-shell package out, then do it, make a set of examples in the demo project (can you build it before publishing?) then publish"

**Assistant interpretation:** Create a docmgr ticket, document the shell package boundary, implement the public `@go-go-golems/os-shell` package, validate it with demo examples before publishing, then publish to npm.

**Inferred user intent:** Promote the previously planned stage-05 shell/window-manager boundary into a real public package and consumer example.

### What I did

- Created ticket `os-shell-public-package`.
- Wrote `design/01-os-shell-public-package-design-and-implementation-guide.md`.
- Replaced the default task list with an extraction/publishing checklist.

### Next step

Update package metadata and remove private package dependencies from the public shell package.


## Step 2: Made os-shell publishable and decoupled from private scripting runtime

### What I changed

- Set `packages/os-shell/package.json` to `private: false`.
- Switched `publishConfig` from GitHub Packages to public npm access.
- Removed the runtime dependency on private `@go-go-golems/os-scripting`.
- Added public shell/window-manager entrypoints:
  - `./desktop-core`
  - `./desktop-react`
  - `./windowing`
  - `./store/createLauncherStore`
  - runtime and registry helper subpaths.
- Added `src/desktop-core.ts`, `src/desktop-react.ts`, and `src/windowing.ts` to make `@go-go-golems/os-shell` the preferred import boundary.
- Reimplemented `createLauncherStore()` using public dependencies only:
  - `@reduxjs/toolkit`
  - `@go-go-golems/os-core`
- Updated tests to assert the public shell store shape instead of the private scripting store shape.
- Rewrote `packages/os-shell/README.md` for npm consumers.

### Validation

```bash
npm run typecheck -w packages/os-shell
npm test -w packages/os-shell
npm run build:dist -w packages/os-shell
```

Results:

- Typecheck passed.
- 5 test files passed.
- 23 tests passed.
- `dist/package.json` rewrote `@go-go-golems/os-core` from `workspace:*` to `0.1.1`.
- `dist/package.json` has `publishConfig.access = public`.

### Boundary decision

The first public package does not physically move all shell implementation files out of `os-core`. Instead, it establishes `@go-go-golems/os-shell` as the public import boundary and delegates to the existing implementation. This avoids destabilizing existing apps while giving consumers the correct package to install and import.

### Next step

Install the local os-shell artifact into the standalone demo project and build stage 05 before publishing.


## Step 3: Built the demo example against a local os-shell artifact before publishing

### What I did

- Added `RuntimeBundleDefinition` and `RuntimeSurfaceMeta` type re-exports from the `os-shell` root entrypoint so consumers can type `DesktopShell` bundles without importing from `os-core` directly.
- Rebuilt `packages/os-shell/dist`.
- Packed the dist artifact with `npm pack` into `/tmp/go-go-golems-os-shell-0.1.0.tgz`.
- Installed that tarball into the standalone demo project before publication.
- Added `examples/05-window-manager-shell` in the demo project.

### Demo validation before publishing

In `2026-05-11--npm-go-go-os-test`:

```bash
npm run typecheck
npm run build
npm run build-storybook
npm run dev -- --host 127.0.0.1
```

Results:

- Typecheck passed.
- Vite production build passed.
- Storybook production build passed.
- Browser smoke passed for the new `05 Window manager shell` stage.
- Browser console only showed the existing harmless `/favicon.ico` 404.

### Important caveat

At this stage, the demo project temporarily points `@go-go-golems/os-shell` at the local tarball. After npm publication, it must be switched to `^0.1.0` and revalidated from the public registry.


## Step 4: Published os-shell and revalidated from npm

### Publish command

```bash
npm run build:dist -w packages/os-shell
npm publish --access public ./packages/os-shell/dist
```

### Published package

```text
@go-go-golems/os-shell@0.1.0
```

The first unauthenticated `npm view` check briefly returned 404 because the package was newly published and local/global npm scope configuration also points `@go-go-golems` at GitHub Packages outside repo-local `.npmrc` contexts. An authenticated npmjs-registry check returned `0.1.0`, and a second publish attempt confirmed the version already existed.

### Registry consumer validation

After publication, I switched the standalone demo dependency from the local tarball to:

```json
"@go-go-golems/os-shell": "^0.1.0"
```

Then I revalidated the demo project:

```bash
npm run typecheck
npm run build
npm run build-storybook
npm run dev -- --host 127.0.0.1
```

Browser smoke opened the root app and selected `05 Window manager shell`. The stage rendered with no browser console errors.

### Commits

- `6103327 Plan public os-shell package`
- `8aa7aaa Make os-shell publishable`
- `ed765bc Validate os-shell with demo artifact`
- demo example commit pending in the consumer repo at time of this diary entry.
