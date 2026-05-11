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
RelatedFiles:
    - Path: packages/os-shell/README.md
      Note: public README described in diary step 2
    - Path: packages/os-shell/package.json
      Note: public package metadata and export boundary described in diary steps 2-4
    - Path: packages/os-shell/src/index.ts
      Note: root exports and bundle type re-exports described in diary step 3
    - Path: packages/os-shell/src/store/createLauncherStore.ts
      Note: public shell store extraction described in diary step 2
    - Path: ttmp/2026/05/11/os-shell-public-package--extract-and-publish-public-os-shell-package/design/01-os-shell-public-package-design-and-implementation-guide.md
      Note: design guide created in diary step 1
ExternalSources: []
Summary: Chronological diary for extracting and publishing the public @go-go-golems/os-shell package.
LastUpdated: 2026-05-11T17:45:00-04:00
WhatFor: Records implementation steps, validation, failures, commits, and publish results.
WhenToUse: Use while reviewing or continuing the os-shell publication work.
---


# Diary

## Goal

This diary records the package-boundary, implementation, validation, and publishing work that turned `@go-go-golems/os-shell` from a private monorepo package into a public npm package for shell, launcher, app-registry, and window-manager consumers.

## Step 1: Created the package-boundary ticket

This step separated the shell/window-manager publication work from the already completed core/widget package publication. The intent was to make the package boundary explicit before changing package metadata or adding a consumer example.

It produced a ticket workspace, an implementation guide, and a task checklist so the later code work could be reviewed against a concrete public-package plan instead of being treated as an ad hoc package.json edit.

### Prompt Context

**User prompt (verbatim):** "make os-shell package. Add a design/implementation guide to the ticket, a list of tasks to extract the os-shell package out, then do it, make a set of examples in the demo project (can you build it before publishing?) then publish"

**Assistant interpretation:** Create a docmgr ticket, document the shell package boundary, implement the public `@go-go-golems/os-shell` package, validate it with demo examples before publishing, then publish to npm.

**Inferred user intent:** Promote the previously planned stage-05 shell/window-manager boundary into a real public package and consumer example.

**Commit (code):** `6103327` — "Plan public os-shell package"

### What I did

- Created docmgr ticket `os-shell-public-package`.
- Wrote `design/01-os-shell-public-package-design-and-implementation-guide.md`.
- Replaced the generated task list with a package extraction and publishing checklist.
- Ran `docmgr doctor --ticket os-shell-public-package --stale-after 30`.
- Committed the ticket baseline.

### Why

- The shell/window-manager API is a package-boundary decision, not just another consumer example.
- The user explicitly asked for a design/implementation guide and a task list before implementation.
- A dedicated ticket makes it clear which decisions belong to package publication versus demo-app evolution.

### What worked

- The ticket workspace was created successfully.
- `docmgr doctor` passed for the new ticket.
- The initial guide captured the key package decision: `os-shell` should be the public shell/window-manager import boundary.

### What didn't work

- I initially tried the wrong `docmgr` command shapes:
  - `docmgr ticket create ... --title ...` failed with `unknown flag: --title`.
  - `docmgr ticket create-ticket ... --summary ...` failed with `unknown flag: --summary`.
- Correct command used:

```bash
docmgr ticket create-ticket --ticket os-shell-public-package --title "Extract and publish public os-shell package" --topics npm,react,desktop,design-system
```

### What I learned

- For this `docmgr` version, ticket creation uses `create-ticket`, and supported flags are narrower than I first assumed.
- The shell work needed a ticket not only for tracking but also to document why `os-shell` should be a public boundary while implementation still delegates some internals to `os-core`.

### What was tricky to build

- The planning step needed to distinguish the public API boundary from physical file movement. Moving all shell code out of `os-core` immediately would be larger and riskier than establishing `os-shell` as the public import surface first.
- The guide therefore framed the first release as a boundary extraction rather than a full source-tree extraction.

### What warrants a second pair of eyes

- Review whether the guide’s decision to publish `os-shell` while delegating existing implementation to `os-core` is acceptable for the first public release.
- Review whether the task list should require a later physical extraction ticket.

### What should be done in the future

- After the first public release, consider a follow-up ticket to move shell implementation files physically into `packages/os-shell` if long-term package ownership requires it.

### Code review instructions

- Start with `ttmp/2026/05/11/os-shell-public-package--extract-and-publish-public-os-shell-package/design/01-os-shell-public-package-design-and-implementation-guide.md`.
- Then read `tasks.md` to compare the implementation against the planned sequence.
- Validate ticket health with:

```bash
docmgr doctor --ticket os-shell-public-package --stale-after 30
```

### Technical details

Ticket path:

```text
ttmp/2026/05/11/os-shell-public-package--extract-and-publish-public-os-shell-package
```

## Step 2: Made os-shell publishable and removed the private scripting dependency

This step turned the existing private package into a publishable npm package. The main technical issue was that `os-shell` depended on private `@go-go-golems/os-scripting`, which would make the public package unusable for standalone consumers.

I kept the first release focused: make `@go-go-golems/os-shell` the public import boundary, remove unpublished transitive dependencies, and expose shell/window-manager entrypoints while leaving larger physical source movement for a future cleanup if needed.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Implement the public package changes required by the `os-shell-public-package` ticket.

**Inferred user intent:** Produce a real npm-installable shell package, not only a monorepo-local package.

**Commit (code):** `8aa7aaa` — "Make os-shell publishable"

### What I did

- Updated `packages/os-shell/package.json`:
  - set `private` to `false`
  - changed `publishConfig` to public npm access
  - removed `@go-go-golems/os-scripting` from dependencies
  - added public exports for desktop/windowing/store/runtime/registry entrypoints
  - added public keywords and peer dependency metadata
- Updated `packages/os-shell/tsconfig.json` to remove `os-scripting` paths and references.
- Added re-export entrypoints:
  - `packages/os-shell/src/desktop-core.ts`
  - `packages/os-shell/src/desktop-react.ts`
  - `packages/os-shell/src/windowing.ts`
- Reimplemented `packages/os-shell/src/store/createLauncherStore.ts` using public dependencies only:
  - `@reduxjs/toolkit`
  - `@go-go-golems/os-core`
- Updated `packages/os-shell/src/__tests__/launcherStore.test.ts` for the new public shell store shape.
- Rewrote `packages/os-shell/README.md` as a public npm README.
- Ran package validation and dist build.

### Why

- Public consumers cannot install a package that depends on an unpublished private workspace package.
- New shell/window-manager examples should import from `@go-go-golems/os-shell`, not from deep or ambiguous `os-core` entrypoints.
- Reusing the existing shell implementation through re-exports reduced risk while establishing the correct public package name.

### What worked

Validation passed:

```bash
npm run typecheck -w packages/os-shell
npm test -w packages/os-shell
npm run build:dist -w packages/os-shell
```

Results:

- Typecheck passed.
- 5 test files passed.
- 23 tests passed.
- `packages/os-shell/dist/package.json` rewrote `@go-go-golems/os-core` from `workspace:*` to `0.1.1`.
- `packages/os-shell/dist/package.json` had `publishConfig.access = public`.

### What didn't work

- The original `createLauncherStore()` imported `CORE_APP_REDUCER_KEYS` and `createAppStore` from private `@go-go-golems/os-scripting`.
- That dependency was incompatible with the first public `os-shell` release.
- I replaced it with a public shell-local store factory and an exported `SHELL_CORE_REDUCER_KEYS` constant.

### What I learned

- The store boundary was the real extraction point. Package metadata alone was not enough; the public package had to stop importing private runtime reducers and middleware.
- The public shell store can expose `windowing`, `notifications`, and `debug` while reserving historical keys such as `runtimeSessions` and `hypercardArtifacts` to avoid future collisions.

### What was tricky to build

- `createLauncherStore()` previously inherited more runtime state from `os-scripting` than a public shell package should expose. The tricky part was preserving reducer-key collision protection without depending on the private store factory.
- The solution was to keep the reserved key list but install only public reducers in the actual store shape.

### What warrants a second pair of eyes

- Review `SHELL_CORE_REDUCER_KEYS` and confirm which reserved keys should remain reserved even though they are not installed by the public shell store.
- Review whether `os-shell` root re-exports too much from `os-core/desktop-react` and `os-core/desktop-core`, or whether some exports should remain subpath-only.
- Review whether `react-dom` should remain a peer dependency even though the package mostly re-exports React components that need it at the app level.

### What should be done in the future

- Add a package-boundary test that asserts `packages/os-shell/dist/package.json` never contains `workspace:*` or private unpublished package dependencies.
- Consider physically moving shell implementation files out of `os-core` after the public import boundary has stabilized.

### Code review instructions

- Start in `packages/os-shell/package.json` and inspect `exports`, `dependencies`, `peerDependencies`, and `publishConfig`.
- Review `packages/os-shell/src/store/createLauncherStore.ts` for store-shape changes.
- Review `packages/os-shell/src/__tests__/launcherStore.test.ts` for expected reducer keys.
- Validate with:

```bash
npm run typecheck -w packages/os-shell
npm test -w packages/os-shell
npm run build:dist -w packages/os-shell
node -e "const p=require('./packages/os-shell/dist/package.json'); console.log(p)"
```

### Technical details

Public store shape after this step:

```text
{
  windowing,
  notifications,
  debug,
  ...sharedReducers,
  ...moduleReducers
}
```

Reserved reducer keys:

```text
pluginCardRuntime
runtimeSessions
windowing
notifications
debug
hypercardArtifacts
```

## Step 3: Validated os-shell with a local demo artifact before publishing

This step answered the user’s explicit question: yes, the demo can be built before publishing. I packed the `os-shell` dist output into a local tarball, installed that tarball into the standalone consumer app, and added the stage-05 shell/window-manager example against the package artifact shape.

The important point is that the demo imported `@go-go-golems/os-shell` as a package, not from monorepo source paths. That made the pre-publish validation meaningful.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Prove the package artifact works in the demo project before pushing it to npm.

**Inferred user intent:** Avoid publishing a package that only works inside the monorepo or through workspace aliases.

**Commit (code):** `ed765bc` — "Validate os-shell with demo artifact"

### What I did

- Added `RuntimeBundleDefinition` and `RuntimeSurfaceMeta` type re-exports from `packages/os-shell/src/index.ts` so consumers can type shell bundles from the shell package root.
- Rebuilt `packages/os-shell/dist`.
- Packed the dist artifact:

```bash
cd go-go-os-frontend/packages/os-shell/dist
npm pack --pack-destination /tmp
```

- Produced:

```text
/tmp/go-go-golems-os-shell-0.1.0.tgz
```

- Installed that tarball in the standalone demo project.
- Added the demo stage in the consumer repo:

```text
examples/05-window-manager-shell
```

- Validated the demo before publication.

### Why

- A local tarball is closer to npm consumption than a workspace link because it uses the dist package metadata, rewritten exports, and rewritten dependency versions.
- This catches missing exports and type issues before publishing an immutable npm version.

### What worked

Pre-publish demo validation passed in `2026-05-11--npm-go-go-os-test`:

```bash
npm run typecheck
npm run build
npm run build-storybook
npm run dev -- --host 127.0.0.1
```

Browser smoke passed for `05 Window manager shell` against the tarball-installed package.

### What didn't work

- The first demo typecheck failed because `RuntimeBundleDefinition` requires a `plugin` field:

```text
examples/05-window-manager-shell/src/WindowManagerShellExample.tsx(13,7): error TS2741: Property 'plugin' is missing in type '{ id: string; name: string; icon: string; homeSurface: string; surfaces: { home: { id: string; type: string; title: string; icon: string; ui: { t: string; value: string; }; }; notes: { id: string; type: string; title: string; icon: string; ui: { ...; }; }; metrics: { ...; }; }; }' but required in type 'RuntimeBundleDefinition'.
```

- I fixed it by adding:

```ts
plugin: {
  packageIds: [],
  bundleCode: '',
},
```

### What I learned

- The shell demo needs to teach the runtime bundle contract, including `plugin`, even when no plugin code is used.
- The root `os-shell` package should re-export the relevant bundle types so consumers do not have to discover type definitions under `os-core`.

### What was tricky to build

- The package artifact changed the shape of validation: import and type resolution came from `dist`, not from TypeScript source paths. That exposed missing ergonomic exports and the required `plugin` property.
- The fix was not to weaken types; it was to satisfy the existing runtime contract explicitly in the example.

### What warrants a second pair of eyes

- Review whether `RuntimeBundleDefinition.plugin` should remain required for simple shell examples.
- Review whether the README should include a minimal `plugin: { packageIds: [], bundleCode: '' }` example prominently.
- Review the stage-05 demo for whether it is too low-level for new consumers or appropriately minimal.

### What should be done in the future

- Add a purpose-built helper such as `createStaticShellBundle()` only if multiple consumer examples repeat the same boilerplate.
- Do not add that helper solely as a backwards-compatibility shim; add it only if it becomes a clear public API improvement.

### Code review instructions

- Review `packages/os-shell/src/index.ts` for root type re-exports.
- Review the generated package with:

```bash
npm run build:dist -w packages/os-shell
cd packages/os-shell/dist && npm pack --pack-destination /tmp
```

- In the demo project, validate with:

```bash
npm install /tmp/go-go-golems-os-shell-0.1.0.tgz
npm run typecheck
npm run build
npm run build-storybook
```

### Technical details

The demo package temporarily used a file dependency during this step:

```json
"@go-go-golems/os-shell": "file:../../../../../../tmp/go-go-golems-os-shell-0.1.0.tgz"
```

That dependency was later replaced with the public npm version after publication.

## Step 4: Published os-shell and revalidated from npm

This step published the package and then repeated consumer validation from the public dependency instead of the local tarball. The key outcome is that the standalone demo now depends on `@go-go-golems/os-shell@^0.1.0` from npm.

The only confusing part was npm registry configuration: this machine has global `@go-go-golems` scope configuration pointing at GitHub Packages, so registry checks must be run from a repo-local npmjs context or with an explicit user config.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Publish the package after local artifact validation, then prove the demo works from the public registry.

**Inferred user intent:** Complete the end-to-end package lifecycle: design, build, demo validation, publish, and registry consumer validation.

**Commit (code):** `0e2a8d9` — "Record os-shell publication"

### What I did

- Rebuilt the publish artifact:

```bash
npm run build:dist -w packages/os-shell
```

- Published:

```bash
npm publish --access public ./packages/os-shell/dist
```

- Verified the package version with an authenticated npmjs-registry check:

```text
@go-go-golems/os-shell@0.1.0
```

- Switched the demo project dependency from the local tarball to:

```json
"@go-go-golems/os-shell": "^0.1.0"
```

- Revalidated the demo project from the public package.
- Updated the diary, tasks, and changelog.

### Why

- npm versions are immutable; publishing should happen only after artifact and demo validation.
- Revalidating from npm catches mistakes that a local tarball may not reveal, especially registry dependency resolution and lockfile behavior.

### What worked

- Publish succeeded:

```text
+ @go-go-golems/os-shell@0.1.0
```

- A second publish attempt confirmed the version existed:

```text
npm error 403 403 Forbidden - PUT https://registry.npmjs.org/@go-go-golems%2fos-shell - You cannot publish over the previously published versions: 0.1.0.
```

- Authenticated npmjs check returned:

```text
0.1.0
```

- Demo validation from public npm dependency passed:

```bash
npm run typecheck
npm run build
npm run build-storybook
npm run dev -- --host 127.0.0.1
```

- Browser smoke selected `05 Window manager shell`; the stage rendered with no browser console errors.

### What didn't work

- An immediate repo-local `npm view` after publish briefly returned:

```text
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@go-go-golems%2fos-shell - Not found
```

- Outside repo-local npmjs contexts, `npm view` used global GitHub Packages scope config and returned:

```text
npm error code E403
npm error 403 403 Forbidden - GET https://npm.pkg.github.com/@go-go-golems%2fos-shell - Permission permission_denied: The token provided does not match expected scopes.
```

- The underlying issue was local/global npm scope configuration, not package absence. Running from `go-go-os-frontend` with its `.npmrc` or with an explicit npmjs user config resolved the package.

### What I learned

- Registry verification commands must control `@go-go-golems:registry` explicitly on this machine.
- A successful publish followed by a 403 "cannot publish over" response is useful evidence that npm accepted the first publish even if an earlier view command was affected by registry propagation/configuration.

### What was tricky to build

- The tricky part was separating three states that looked similar in terminal output: npm propagation delay, wrong scoped registry, and genuine package absence.
- I diagnosed this by checking `npm config get @go-go-golems:registry`, running commands from the repo with `.npmrc`, and retrying publish to confirm the version already existed.

### What warrants a second pair of eyes

- Review the repo-local `.npmrc` and global npm config interaction before automating future releases.
- Review whether release verification scripts should always create a temporary npmjs user config to avoid GitHub Packages bleed-through.

### What should be done in the future

- Configure Trusted Publishers/GitHub Actions OIDC so future publishes do not rely on local tokens and local registry state.
- Add a release verification script that explicitly sets `@go-go-golems:registry=https://registry.npmjs.org/`.

### Code review instructions

- Review `packages/os-shell/dist/package.json` after `npm run build:dist -w packages/os-shell`.
- Verify the published version from an npmjs-scoped config:

```bash
npm view @go-go-golems/os-shell version
```

- In the demo repo, validate:

```bash
npm install @go-go-golems/os-shell@^0.1.0 --registry https://registry.npmjs.org/
npm run typecheck
npm run build
npm run build-storybook
```

### Technical details

Published package:

```text
@go-go-golems/os-shell@0.1.0
```

Relevant commits:

```text
6103327 Plan public os-shell package
8aa7aaa Make os-shell publishable
ed765bc Validate os-shell with demo artifact
0e2a8d9 Record os-shell publication
```
