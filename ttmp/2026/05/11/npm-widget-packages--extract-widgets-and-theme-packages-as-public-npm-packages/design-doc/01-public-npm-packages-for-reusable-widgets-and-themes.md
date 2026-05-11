---
Title: Public npm packages for reusable widgets and themes
Ticket: npm-widget-packages
Status: active
Topics:
    - frontend
    - react
    - npm
    - widgets
    - theme
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: package.json
      Note: workspace scripts
    - Path: packages/os-core/src/theme/index.ts
      Note: core theme CSS entrypoint
    - Path: packages/os-widgets/package.json
      Note: main rich widget package metadata
    - Path: packages/os-widgets/src/index.ts
      Note: standalone widget component/state barrel exports
    - Path: packages/os-widgets/src/launcher/modules.tsx
      Note: go-go-os shell launcher integration that should remain optional
    - Path: packages/os-widgets/src/log-viewer/LogViewer.tsx
      Note: representative stateful widget component pattern
    - Path: packages/os-widgets/src/log-viewer/logViewerState.ts
      Note: representative Redux state/reducer/selector pattern
    - Path: packages/os-widgets/src/parts.ts
      Note: public data-part theming constants
    - Path: packages/os-widgets/src/theme/index.ts
      Note: widget theme CSS import hub
    - Path: pnpm-workspace.yaml
      Note: workspace package globs
    - Path: scripts/packages/build-dist.mjs
      Note: existing build-dist pipeline for publishable package artifacts
ExternalSources: []
Summary: Analysis, design, and implementation guide for extracting go-go-os-frontend widgets and themes as public npm packages usable from standalone React projects.
LastUpdated: 2026-05-11T12:45:00-04:00
WhatFor: Guides a new engineer through the current package architecture and the steps needed to publish reusable widget/theme packages publicly on npm.
WhenToUse: Use before changing package metadata, splitting exports, adding package smoke tests, or publishing the first public release.
---


# Public npm packages for reusable widgets and themes

## 1. Executive summary

The `go-go-os-frontend` repository already contains a monorepo-style React package layout that is close to publishable: the root workspace includes `packages/*`, each package has a scoped name, package metadata, TypeScript config, and most packages expose `exports`. The main candidates for standalone reuse are:

- `@go-go-golems/os-core`: desktop primitives, shared components, theming entrypoints, state helpers, and low-level UI contracts.
- `@go-go-golems/os-repl`: terminal/REPL widgets and CSS.
- `@go-go-golems/os-widgets`: rich standalone widgets such as Log Viewer, Chart View, MacWrite, Node Editor, Oscilloscope, Calendar, Graph Navigator, and others.
- `@go-go-golems/os-kanban`: a domain widget package built on top of the core/widgets/runtime stack.

However, the packages are not ready for public npm publication yet. The root project is private, each package is currently `private: true`, and package `publishConfig` points at GitHub Packages instead of the public npm registry. The `build:dist` script exists, but a validation run failed because the workspace does not currently provide a local TypeScript compiler to `npm exec -- tsc`.

The recommended design is to publish a small family of public npm packages with explicit standalone and host-integration boundaries:

```text
@go-go-golems/os-core       -> shared React primitives + desktop/theme base
@go-go-golems/os-repl       -> reusable REPL/terminal widget + CSS
@go-go-golems/os-widgets    -> standalone rich widgets + reducers + CSS
@go-go-golems/os-kanban     -> optional higher-level board widget package
@go-go-golems/os-shell      -> optional go-go-os shell integration package, not required by standalone apps
```

The key architectural rule is: a standalone React project must be able to import widget components, state helpers, and CSS without importing the go-go-os shell runtime unless it explicitly imports a launcher/shell integration entrypoint.

## 2. Problem statement and scope

### 2.1 User goal

The user wants to extract widgets and theme-related packages from `go-go-os-frontend` as public npm packages so they can be reused in standalone React projects. The user also wants a detailed technical implementation guide suitable for a new intern.

### 2.2 What “standalone React project” means

A standalone consumer should be able to install packages from npm and write something like:

```tsx
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LogViewer, logViewerReducer, LOG_VIEWER_STATE_KEY } from '@go-go-golems/os-widgets';
import '@go-go-golems/os-core/theme';
import '@go-go-golems/os-widgets/theme';

const store = configureStore({
  reducer: {
    [LOG_VIEWER_STATE_KEY]: logViewerReducer,
  },
});

export function App() {
  return (
    <Provider store={store}>
      <LogViewer />
    </Provider>
  );
}
```

The consumer should not need:

- the `go-go-os-frontend` monorepo checkout,
- TypeScript path aliases pointing into `src`,
- `workspace:*` dependencies,
- the go-go-os shell launcher runtime,
- a custom CSS build step beyond normal Vite/Webpack CSS imports.

### 2.3 In scope

- Public npm package metadata and release readiness.
- TypeScript declaration and JavaScript build output.
- CSS/theme asset publication.
- Standalone React usage examples.
- Package boundary cleanup.
- Smoke testing package tarballs outside the monorepo.

### 2.4 Out of scope for this document

- Rewriting the visual design of widgets.
- Replacing Redux with another state manager.
- Publishing secrets or npm credentials.
- Changing backend APIs.
- Implementing the code changes in this documentation-only pass.

## 3. Current-state architecture with evidence

### 3.1 Workspace layout

The root `package.json` defines a private workspace with `packages/*` and `apps/*`. Evidence: `package.json:2-7` shows the root package name, private flag, and workspace list. The root scripts already include packaging-oriented commands: `package.json:10-13` defines normal build, `build:publish-v1`, `pack:smoke-v1`, and `install:smoke-v1`.

`pnpm-workspace.yaml` also declares the same workspace shape:

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

This means the repository already has the right high-level layout for a package monorepo, but the publication policy is still private/internal.

### 3.2 Package inventory

Observed packages and their current roles:

| Package | Current role | Standalone-public suitability |
| --- | --- | --- |
| `@go-go-golems/os-core` | Core desktop widgets, theming, Redux helpers, shell primitives | High, but split or document shell-specific entrypoints |
| `@go-go-golems/os-repl` | Terminal/REPL UI components and CSS | High |
| `@go-go-golems/os-widgets` | Rich widgets, primitives, reducers, launcher modules, theme CSS | High if launcher imports are isolated |
| `@go-go-golems/os-kanban` | Kanban runtime modules and view components | Medium/high; depends on scripting/ui-cards/widgets |
| `@go-go-golems/os-shell` | go-go-os launcher contracts and shell runtime helpers | Integration package, not required for standalone widgets |
| `@go-go-golems/os-scripting` | Runtime/session/plugin infrastructure | Advanced integration package, not a first-wave standalone widget dependency |
| `@go-go-golems/os-ui-cards` | UI card runtime renderer | Optional runtime package |
| `@go-go-golems/os-chat` | Chat UI and CodeMirror-heavy helpers | Separate package; not central to widget extraction |
| `@go-go-golems/os-confirm` | Confirm runtime/components | Separate package |

A small Node inventory confirmed every package is currently `private=true` and versioned as `0.1.0`. This must be changed before public npm publication.

### 3.3 Current package metadata pattern

`packages/os-widgets/package.json` is representative:

- Name/version/description exist at lines `2-4`.
- It is currently private at line `5`.
- It has MIT license and repository metadata at lines `7-17`.
- It publishes JS, declarations, CSS, VM JS, JSON, and README via `files` at lines `18-25`.
- It points `publishConfig.registry` at GitHub Packages at lines `26-28`.
- It exposes `.` / `./theme` / `./launcher` at lines `29-33`.
- It depends on `@go-go-golems/os-repl` and has core/shell/React/Redux peer dependencies at lines `43-53`.

For public npm, the important corrections are:

```jsonc
{
  "private": false,              // or remove the field
  "publishConfig": {
    "access": "public"
  }
}
```

Do not keep `"registry": "https://npm.pkg.github.com"` if the goal is public npmjs.com publication.

### 3.4 Build pipeline

The repository includes `scripts/packages/build-dist.mjs`, which is designed to build package artifacts for publication.

Important behavior:

- It treats the current package directory as the package being built (`build-dist.mjs:8-12`).
- It copies `.css` and `.vm.js` assets (`build-dist.mjs:20-40`, `265-273`).
- It rewrites source export paths from `./src/*.ts(x)` to dist declaration paths for TypeScript (`build-dist.mjs:59-85`).
- It reads workspace package versions and rewrites `workspace:*` dependencies to concrete versions (`build-dist.mjs:328-365`).
- It writes a publish-ready `dist/package.json` and `.npmignore` (`build-dist.mjs:367-415`).
- It runs `npm exec -- tsc -p <temporary tsconfig>` (`build-dist.mjs:255-263`).

This is a useful foundation. The build pipeline already understands monorepo package references and publication package metadata. The first immediate build blocker is that `typescript` is not installed where `npm exec -- tsc` can find it.

### 3.5 Theme entrypoints

The core theme entrypoint is `packages/os-core/src/theme/index.ts`:

```ts
import './desktop/tokens.css';
import './desktop/shell.css';
import './desktop/primitives.css';
import './desktop/syntax.css';
import './desktop/animations.css';

export { HyperCardTheme, type HyperCardThemeProps } from './HyperCardTheme';
```

Evidence: `packages/os-core/src/theme/index.ts:1-9`.

The widget theme entrypoint is `packages/os-widgets/src/theme/index.ts`, which imports all widget CSS files plus the REPL theme:

```ts
import './primitives.css';
import '@go-go-golems/os-repl/theme';
import './rich-widgets-launcher.css';
import './sparkline.css';
// ... many widget-specific CSS files ...
```

Evidence: `packages/os-widgets/src/theme/index.ts:1-25`.

This means consumers should load CSS through side-effect imports:

```ts
import '@go-go-golems/os-core/theme';
import '@go-go-golems/os-widgets/theme';
```

Because these imports are side effects, packages should explicitly mark CSS/theme modules as side effects in package metadata:

```jsonc
{
  "sideEffects": [
    "**/*.css",
    "./dist/theme/index.js",
    "./dist/theme/*.js"
  ]
}
```

### 3.6 Widget export pattern

`packages/os-widgets/src/index.ts` is a large barrel file. It exports:

- shared primitives (`Sparkline`, `WidgetToolbar`, `WidgetStatusBar`, `ModalOverlay`, `ProgressBar`, etc.) at lines `1-23`,
- widget components and props (`LogViewer`, `ChartView`, `MacWrite`, etc.) throughout the file,
- Redux state keys, reducers, selectors, actions, and seed helpers, for example Log Viewer at lines `25-42`,
- `MacRepl` symbols re-exported from `@go-go-golems/os-repl` at lines `74-99`.

This is already convenient for consumers. The risk is that the barrel may become too broad for tree-shaking if any imported module has shell-only side effects. The standalone root export should remain component/state focused and should not import `src/launcher/modules.tsx`.

### 3.7 Widget state pattern

The Log Viewer state file is a good model for other widgets:

- `LOG_VIEWER_STATE_KEY` is defined at `packages/os-widgets/src/log-viewer/logViewerState.ts:4`.
- Seed input and stored state types are defined at lines `10-34`.
- Serialization/deserialization converts `Date` into numeric timestamps at lines `59-71`.
- `createLogViewerStateSeed` materializes a safe initial state at lines `73-90`.
- A Redux slice exposes reducers and actions at lines `130-187`.
- A selector safely unwraps either direct or nested module state at lines `188-210`.

This pattern matters because standalone React consumers need to know how to wire reducers into their own store.

### 3.8 Widget component pattern

`packages/os-widgets/src/log-viewer/LogViewer.tsx` shows the runtime component pattern:

- React hooks and `react-redux` are used at lines `1-10`.
- The component imports UI primitives from `@go-go-golems/os-core` at line `9`.
- It imports stable `data-part` constants from `../parts` at line `11`.
- It defines public props at lines `47-51`.
- It separates view model/callback concerns with `LogViewerModel` and `LogViewerCallbacks` at lines `53-76`.
- It renders semantic `data-part` attributes, for example the root uses `data-part={P.lv}` at lines `208-212`.

The `data-part` pattern is the main theming hook for downstream apps.

### 3.9 Theme part constants

`packages/os-widgets/src/parts.ts` defines `RICH_PARTS`, a stable list of DOM `data-part` values. The comments at lines `1-5` explain the convention: camelCase keys map to kebab-case values in the DOM. Examples include shared primitive parts at lines `7-34`, Log Viewer parts at lines `38-55`, and many widget-specific sections after that.

This should be documented as a public API contract. Once packages are public, changing a `data-part` value is a styling breaking change.

### 3.10 Shell launcher integration

`packages/os-widgets/src/launcher/modules.tsx` is not just widget UI. It imports go-go-os shell contracts and desktop runtime helpers:

- `LaunchableAppModule` from `@go-go-golems/os-shell/contracts/launchableAppModule` at line `2`.
- `formatAppKey` from `@go-go-golems/os-shell/runtime/appKey` at line `3`.
- `openWindow` and `DesktopIconLayer` from `@go-go-golems/os-core` at lines `4-5`.
- A large `RICH_WIDGETS` registry at lines `136-159`.
- Individual launcher module exports at lines `300-477`.
- A combined `RICH_WIDGET_MODULES` list at lines `479-503`.

This is useful inside go-go-os but should be treated as an optional integration entrypoint, not a requirement for standalone widget consumers.

## 4. Gap analysis

### 4.1 Publication blockers

1. **Packages are private.** Each package inventory showed `private=true`, and `packages/os-widgets/package.json:5` confirms this for the main widget package.
2. **Registry points to GitHub Packages.** `packages/os-widgets/package.json:26-28` uses `https://npm.pkg.github.com`, not npmjs.com.
3. **TypeScript compiler missing.** `npm run build:dist -w packages/os-core` failed with `This is not the tsc command you are looking for`.
4. **Root package lacks `typescript` devDependency.** Root `package.json:23-36` lists Storybook/Vitest/Biome dependencies but not TypeScript.
5. **Public API boundaries are mixed.** `os-widgets` has a clean root export but also a shell launcher export that requires `@go-go-golems/os-shell`.
6. **Smoke scripts do not include every target.** Root `pack:smoke-v1` only includes core/repl/scripting at `package.json:12`, while `install:smoke-v1` omits `os-widgets` and `os-kanban` at line `13`.
7. **CSS side effects are implicit.** Package metadata includes CSS files but does not explicitly declare `sideEffects`.
8. **README/package examples may be missing or incomplete.** The build script copies package READMEs if present (`build-dist.mjs:410-415`), so each package needs package-level docs.

### 4.2 Standalone reuse gaps

A standalone app needs a narrow dependency story. Today `@go-go-golems/os-widgets` has these peer dependencies:

```json
{
  "@go-go-golems/os-shell": "workspace:*",
  "@go-go-golems/os-core": "workspace:*",
  "@reduxjs/toolkit": "^2.0.0",
  "react": "^18 || ^19",
  "react-dom": "^18 || ^19",
  "react-redux": "^9.0.0"
}
```

For a component-only import, `@go-go-golems/os-shell` should not be required. Options:

- Move `@go-go-golems/os-shell` from peer dependency to optional peer with `peerDependenciesMeta.optional = true`.
- Split the launcher into `@go-go-golems/os-widgets-shell`.
- Keep `./launcher` but ensure root and `./theme` do not import it, and document that consumers only need `os-shell` when importing `@go-go-golems/os-widgets/launcher`.

Recommended first implementation: keep `./launcher`, mark shell as optional, and add smoke tests proving root imports work without `os-shell`. If package managers warn too aggressively or consumers dislike optional shell peers, split the launcher in a later major/minor release before broad publication.

## 5. Proposed package architecture

### 5.1 Package dependency diagram

```mermaid
graph TD
  React[react / react-dom]
  Redux[@reduxjs/toolkit / react-redux]
  Core[@go-go-golems/os-core]
  Repl[@go-go-golems/os-repl]
  Widgets[@go-go-golems/os-widgets]
  Kanban[@go-go-golems/os-kanban]
  Shell[@go-go-golems/os-shell]
  Standalone[Standalone React App]
  GoGoOS[go-go-os shell app]

  React --> Core
  React --> Repl
  React --> Widgets
  Redux --> Widgets
  Core --> Widgets
  Repl --> Widgets
  Widgets --> Kanban
  Shell -. optional launcher only .-> Widgets
  Standalone --> Core
  Standalone --> Widgets
  GoGoOS --> Shell
  GoGoOS --> Widgets
```

Read this diagram as follows: standalone apps depend on `os-core` and `os-widgets`; go-go-os shell apps additionally depend on `os-shell` and launcher entrypoints.

### 5.2 Public entrypoint model

Recommended `@go-go-golems/os-widgets` exports:

```jsonc
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./theme": {
      "types": "./dist/theme/index.d.ts",
      "import": "./dist/theme/index.js"
    },
    "./theme/*.css": "./dist/theme/*.css",
    "./launcher": {
      "types": "./dist/launcher/modules.d.ts",
      "import": "./dist/launcher/modules.js"
    }
  }
}
```

If the existing build script continues to accept simple string exports, use string exports initially, but move toward conditional exports before public release because consumers and bundlers handle them more predictably.

### 5.3 Package metadata standard

Each public package should follow this standard:

```jsonc
{
  "name": "@go-go-golems/os-widgets",
  "version": "0.1.0",
  "description": "Reusable rich React widgets and theme CSS from go-go-os.",
  "type": "module",
  "license": "MIT",
  "private": false,
  "publishConfig": {
    "access": "public"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "sideEffects": [
    "**/*.css",
    "./dist/theme/index.js",
    "./dist/theme/*.js"
  ]
}
```

For scoped public npm packages, `publishConfig.access = "public"` is important. Without it, npm may treat scoped packages as private by default and reject publication depending on account settings.

### 5.4 Standalone widget API contract

Every widget should expose the same categories of API:

```ts
// Component
export { LogViewer, type LogViewerProps } from './log-viewer/LogViewer';

// State integration
export {
  LOG_VIEWER_STATE_KEY,
  createLogViewerStateSeed,
  logViewerActions,
  logViewerReducer,
  selectLogViewerState,
} from './log-viewer/logViewerState';

// Domain types and test/sample helpers that are useful to consumers
export { type LogEntry, type LogLevel, LOG_LEVELS } from './log-viewer/types';
export { generateSampleLogs } from './log-viewer/sampleData';
```

The root export should not export shell module helpers unless those helpers are in a separate subpath.

### 5.5 Theming API contract

The public theming contract has three levels:

1. **Theme imports** load base CSS.
2. **CSS custom properties** let consumers override colors, spacing, fonts, borders, and effects.
3. **`data-part` attributes** let consumers target a stable DOM part.

Example consumer override:

```css
/* consumer-app/src/go-go-theme-overrides.css */
:root {
  --hc-font-ui: ui-monospace, SFMono-Regular, Menlo, monospace;
  --rw-accent: #6d5efc;
}

[data-part="lv"] {
  border-radius: 12px;
}

[data-part="widget-toolbar"] {
  backdrop-filter: blur(8px);
}
```

Consumer usage:

```ts
import '@go-go-golems/os-core/theme';
import '@go-go-golems/os-widgets/theme';
import './go-go-theme-overrides.css';
```

The order matters: package CSS first, consumer overrides last.

## 6. Pseudocode and key implementation flows

### 6.1 Build flow

```pseudo
for package in publishablePackages:
    remove package/dist
    create temporary tsconfig:
        copy package tsconfig
        remove project references
        rewrite workspace aliases to built dependency declaration files
        disable declaration maps for published artifacts
    run npm exec -- tsc -p tempTsconfig
    if tsc fails:
        stop
    copy CSS and VM JS assets from src to dist
    remove test/story declarations and JS from dist
    read package.json
    rewrite exports from ./src/foo.tsx to ./foo.js for runtime
    rewrite types from ./src/foo.tsx to ./foo.d.ts
    rewrite workspace:* dependency versions to concrete semver
    write dist/package.json
    copy README.md into dist
```

This is mostly what `scripts/packages/build-dist.mjs` already does.

### 6.2 Standalone smoke app flow

```pseudo
create temp directory outside monorepo
npm create vite@latest consumer -- --template react-ts
cd consumer
npm install react react-dom @reduxjs/toolkit react-redux
npm install /absolute/path/to/os-core.tgz /absolute/path/to/os-repl.tgz /absolute/path/to/os-widgets.tgz
write src/App.tsx that imports LogViewer and theme CSS
npm run build
npm run test or run Playwright screenshot smoke if available
```

This proves the packages do not depend on workspace path aliases.

### 6.3 Store wiring helper flow

Intern-friendly API helper to consider adding:

```ts
export interface RichWidgetReducerMapOptions {
  include?: readonly RichWidgetId[];
}

export function createRichWidgetReducerMap(options: RichWidgetReducerMapOptions = {}) {
  const ids = new Set(options.include ?? ALL_RICH_WIDGET_IDS);
  const reducers: Record<string, Reducer> = {};

  if (ids.has('log-viewer')) reducers[LOG_VIEWER_STATE_KEY] = logViewerReducer;
  if (ids.has('chart-view')) reducers[CHART_VIEW_STATE_KEY] = chartViewReducer;
  // ... repeat for each widget

  return reducers;
}
```

Consumer usage:

```ts
const store = configureStore({
  reducer: {
    ...createRichWidgetReducerMap({ include: ['log-viewer', 'chart-view'] }),
  },
});
```

This is optional but helpful for new consumers.

## 7. Implementation plan

### Phase 0: Confirm naming, npm org, and licensing

- Confirm npm scope: likely `@go-go-golems`.
- Confirm npm organization exists and current account has publish rights.
- Confirm MIT license is intended for all public packages.
- Add package keywords such as `react`, `widgets`, `desktop`, `theme`, `redux`, `go-go-golems`.

### Phase 1: Fix local package build validation

1. Add TypeScript to root dev dependencies:

   ```bash
   cd go-go-os-frontend
   npm install -D typescript
   ```

2. Re-run targeted build:

   ```bash
   npm run build:dist -w packages/os-core
   npm run build:dist -w packages/os-repl
   npm run build:dist -w packages/os-widgets
   ```

3. If successful, run broader package build:

   ```bash
   npm run build:publish-v1
   ```

4. Commit the lockfile/package updates if this repository uses npm lockfiles. If it uses pnpm, use `pnpm add -D typescript -w` instead and align scripts.

### Phase 2: Change publication metadata

For each package selected for public npm:

- Remove `private: true` or set `private: false`.
- Replace GitHub Packages registry with `publishConfig.access = "public"`.
- Add `sideEffects` for CSS/theme entrypoints.
- Ensure `files` publishes `dist` and docs, not raw `src`.
- Ensure workspace dependencies are normal dependencies when required at runtime and peer dependencies only when the consumer must supply them.

Candidate package list for Phase 2:

```text
packages/os-core/package.json
packages/os-repl/package.json
packages/os-widgets/package.json
packages/os-kanban/package.json (optional first wave)
```

### Phase 3: Clarify standalone vs shell boundaries

- Keep root `@go-go-golems/os-widgets` component/state-only.
- Keep theme in `@go-go-golems/os-widgets/theme`.
- Keep launcher integration in `@go-go-golems/os-widgets/launcher` only.
- Mark `@go-go-golems/os-shell` optional if only `./launcher` needs it.
- Add tests that import only root and theme without `os-shell` installed.

If optional peer behavior is noisy or unreliable, create a separate integration package:

```text
@go-go-golems/os-widgets           -> standalone widgets
@go-go-golems/os-widgets-shell     -> go-go-os LaunchableAppModule wrappers
```

### Phase 4: Add README files and API references

Each package should have a README copied by the build script. Minimum sections:

- What the package is.
- Install command.
- Peer dependencies.
- CSS imports.
- Minimal React example.
- Redux store wiring example.
- Theming override example.
- API table listing exported components, reducers, state keys, selectors, actions.
- Browser support and bundler expectations.

### Phase 5: Improve package smoke tests

Update root scripts so the first wave includes the actual target packages:

```jsonc
{
  "scripts": {
    "pack:smoke-v1": "npm run build:publish-v1 && node scripts/packages/pack-smoke.mjs packages/os-core packages/os-repl packages/os-widgets packages/os-kanban",
    "install:smoke-v1": "npm run build:publish-v1 && node scripts/packages/install-smoke.mjs packages/os-core packages/os-repl packages/os-widgets packages/os-kanban"
  }
}
```

Then add a stronger standalone consumer smoke script. The existing `install-smoke.mjs` should be reviewed to confirm it installs tarballs outside the workspace and compiles a real React/Vite import.

### Phase 6: Dry-run publication

Commands:

```bash
npm run build:publish-v1
npm pack --dry-run -w packages/os-core
npm pack --dry-run -w packages/os-repl
npm pack --dry-run -w packages/os-widgets
npm publish --dry-run --access public ./packages/os-core/dist
npm publish --dry-run --access public ./packages/os-repl/dist
npm publish --dry-run --access public ./packages/os-widgets/dist
```

Inspect every tarball:

```bash
tar -tzf go-go-golems-os-widgets-0.1.0.tgz | sort | less
```

Look for:

- `package/dist/index.js`,
- `package/dist/index.d.ts`,
- CSS files under `package/dist/theme/`,
- `package/package.json`,
- `package/README.md`,
- no `src/**/*.stories.*`,
- no `src/**/*.test.*`,
- no private secrets or local paths.

### Phase 7: Publish public npm packages

Only after dry-run and standalone smoke tests pass:

```bash
npm publish --access public ./packages/os-core/dist
npm publish --access public ./packages/os-repl/dist
npm publish --access public ./packages/os-widgets/dist
```

Consider enabling npm provenance in CI later:

```bash
npm publish --access public --provenance ./packages/os-widgets/dist
```

## 8. Testing and validation strategy

### 8.1 Repository validation

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build:publish-v1
```

Expected outcome: all pass. Current known blocker: `build:dist` fails until TypeScript is installed.

### 8.2 Package tarball validation

Run dry-runs and inspect contents:

```bash
npm pack --dry-run -w packages/os-widgets
npm publish --dry-run --access public ./packages/os-widgets/dist
```

### 8.3 Standalone consumer validation

Create a consumer outside the workspace and test both runtime and types:

```bash
mkdir -p /tmp/go-go-os-package-smoke
cd /tmp/go-go-os-package-smoke
npm create vite@latest app -- --template react-ts
cd app
npm install
npm install /path/to/os-core.tgz /path/to/os-repl.tgz /path/to/os-widgets.tgz
npm install @reduxjs/toolkit react-redux
npm run build
```

The smoke app should import:

- `@go-go-golems/os-core/theme`,
- `@go-go-golems/os-widgets/theme`,
- one simple primitive,
- one stateful widget,
- one reducer/action/selector.

### 8.4 Visual validation

Use Storybook and a standalone app screenshot pass:

```bash
npm run storybook
npm run build-storybook
```

Visually check:

- theme CSS loads,
- widgets have expected spacing and colors,
- no missing CSS due to tree-shaking,
- dark/light/modern/classic layers still work if documented.

## 9. Risks, alternatives, and open questions

### 9.1 Risks

- **Shell dependency leakage:** If the root widget package imports launcher code, standalone consumers may need `@go-go-golems/os-shell` unnecessarily.
- **CSS tree-shaking:** Without `sideEffects`, bundlers can drop CSS side-effect imports.
- **Workspace alias leakage:** Published packages must not contain `workspace:*` dependencies or `../package/src` paths.
- **Unstable DOM part names:** Public `data-part` values become a styling contract.
- **Version synchronization:** Packages with internal dependencies need coordinated version bumps.
- **npm access mistakes:** Scoped packages require `--access public` or publish config.

### 9.2 Alternatives considered

#### Alternative A: Publish only `@go-go-golems/os-widgets`

Rejected as first choice because `os-widgets` depends on `os-core` and `os-repl`. Publishing only widgets would either bundle internal packages or produce unresolved imports.

#### Alternative B: Bundle all widgets and core into one package

This is simpler for installation but worse for maintenance and tree-shaking. It also hides clear ownership boundaries between primitives, REPL, widgets, and shell.

#### Alternative C: Split every widget into its own package immediately

This maximizes install granularity but creates too much release overhead for the first public version. A better path is to publish one `os-widgets` package with subpath exports and split later if users ask for smaller packages.

#### Alternative D: Publish from raw `src` TypeScript

Rejected because standalone consumers should not need the same TypeScript/bundler configuration as the monorepo. Publish built JS and declarations.

### 9.3 Open questions

- Should `@go-go-golems/os-kanban` be included in the first public wave or wait until core/repl/widgets are proven?
- Should launcher integrations stay as optional subpath exports or move to a separate package before first public release?
- Should the project use npm workspaces, pnpm workspaces, or both? The repo has both root npm workspace metadata and `pnpm-workspace.yaml`.
- Should releases be manual at first, or should CI publish with provenance?
- What browser support policy should the packages document?

## 10. File-by-file intern guide

Start here:

1. `package.json` — root workspace scripts and dev dependencies. Key lines: `2-21`.
2. `pnpm-workspace.yaml` — package workspace globs.
3. `scripts/packages/build-dist.mjs` — package build/publish artifact generator. Key regions: `20-40`, `59-85`, `255-273`, `328-415`.
4. `packages/os-core/package.json` — core package metadata and exports.
5. `packages/os-core/src/index.ts` — public core barrel. Key lines: `1-32`.
6. `packages/os-core/src/theme/index.ts` — core CSS/theme entrypoint. Key lines: `1-9`.
7. `packages/os-repl/package.json` — REPL package metadata and theme export.
8. `packages/os-widgets/package.json` — main widget package metadata. Key lines: `2-60`.
9. `packages/os-widgets/src/index.ts` — public widget component/state exports.
10. `packages/os-widgets/src/theme/index.ts` — widget CSS import hub. Key lines: `1-25`.
11. `packages/os-widgets/src/parts.ts` — public `data-part` theming contract.
12. `packages/os-widgets/src/log-viewer/LogViewer.tsx` — example stateful component pattern.
13. `packages/os-widgets/src/log-viewer/logViewerState.ts` — example reducer/selector/seed pattern.
14. `packages/os-widgets/src/launcher/modules.tsx` — go-go-os shell integration; treat as optional for standalone.
15. `packages/os-widgets/tsconfig.json` — paths/references that must not leak into published packages.

## 11. Final recommendation

Implement the extraction as a publication hardening project, not a rewrite. The codebase already has the package skeletons, theme entrypoints, and public barrels needed for reuse. The critical work is to:

1. fix build tooling by adding TypeScript,
2. publish built `dist` artifacts rather than raw `src`,
3. change package metadata from private GitHub Packages to public npm,
4. isolate shell launcher integration from standalone component imports,
5. explicitly preserve CSS side effects,
6. prove everything in an external React consumer app before the first public publish.

This path is low-risk because it preserves current widget code while making the package boundaries and npm behavior explicit.
