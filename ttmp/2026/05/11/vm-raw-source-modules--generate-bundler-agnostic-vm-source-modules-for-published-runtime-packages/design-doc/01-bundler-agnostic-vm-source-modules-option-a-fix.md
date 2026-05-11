---
Title: Bundler-Agnostic VM Source Modules Option A Fix
Ticket: vm-raw-source-modules
Status: active
Topics:
    - frontend
    - react
    - npm
    - vm
    - quickjs
    - runtime
    - vite
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/os-kanban/package.json
      Note: target package for 0.1.1 patch publication
    - Path: packages/os-kanban/src/runtimeRegistration.tsx
      Note: imports kanban.package.vm.js?raw today and should import generated source module
    - Path: packages/os-scripting/package.json
      Note: target package for 0.1.1 patch publication
    - Path: packages/os-scripting/src/plugin-runtime/runtimeService.ts
      Note: imports stack-bootstrap.vm.js?raw today and should import generated source module
    - Path: packages/os-ui-cards/package.json
      Note: target package for 0.1.1 patch publication
    - Path: packages/os-ui-cards/src/runtimeRegistration.tsx
      Note: imports ui.package.vm.js?raw today and should import generated source module
    - Path: scripts/packages/build-dist.mjs
      Note: current package dist builder copies .vm.js assets but does not inline raw imports
ExternalSources: []
Summary: Design and implementation guide for replacing published Vite ?raw VM imports with generated TypeScript string modules.
LastUpdated: 2026-05-11T19:35:00-04:00
WhatFor: Use this to implement the Option A fix that makes os-scripting, os-ui-cards, and os-kanban easier to consume from any bundler.
WhenToUse: Before changing VM prelude imports, package build scripts, or the standalone demo Vite workaround.
---


# Bundler-Agnostic VM Source Modules Option A Fix

## Executive Summary

The first public VM package release works, but it leaks a Vite-specific implementation detail into consumer applications. Published package JavaScript in `@go-go-golems/os-scripting`, `@go-go-golems/os-ui-cards`, and `@go-go-golems/os-kanban` currently imports runtime prelude files with `?raw`:

```ts
import stackBootstrapSource from './stack-bootstrap.vm.js?raw';
import uiPackagePrelude from './runtime-packages/ui.package.vm.js?raw';
import kanbanPackagePrelude from './runtime-packages/kanban.package.vm.js?raw';
```

This is convenient inside the monorepo because Vite understands `?raw`, but it is not a good public package contract. In a consumer Vite dev server, dependency optimization hands `node_modules` package code to esbuild before Vite's raw import transform handles the query. The result is a dev-time error even though production build can succeed:

```text
No matching export in "node_modules/@go-go-golems/os-scripting/plugin-runtime/stack-bootstrap.vm.js?raw" for import "default"
```

The standalone demo currently works by excluding VM packages from Vite dependency optimization and explicitly including the CommonJS `debug` dependency:

```ts
optimizeDeps: {
  exclude: ['@go-go-golems/os-scripting', '@go-go-golems/os-ui-cards', '@go-go-golems/os-kanban'],
  include: ['debug'],
}
```

This ticket implements the proper Option A fix: generate normal TypeScript modules that export VM source strings, import those modules from package runtime code, publish patch versions, and then remove the Vite workaround from the demo. Consumers should be able to install and use the VM package family without knowing that the package authors store QuickJS preludes in `.vm.js` files.

## Problem Statement

The VM runtime packages need to ship JavaScript source strings to the browser. Those strings are evaluated inside QuickJS as runtime bootstraps and runtime package preludes. There are three production-critical prelude imports:

| Package | Current source file | Current import site | Runtime purpose |
|---|---|---|---|
| `@go-go-golems/os-scripting` | `src/plugin-runtime/stack-bootstrap.vm.js` | `src/plugin-runtime/runtimeService.ts` | Defines `defineRuntimeBundle`, `defineRuntimeSurface`, and the runtime bundle host inside QuickJS. |
| `@go-go-golems/os-ui-cards` | `src/runtime-packages/ui.package.vm.js` | `src/runtimeRegistration.tsx` | Registers the VM-side `ui` helper API. |
| `@go-go-golems/os-kanban` | `src/runtime-packages/kanban.package.vm.js` | `src/runtimeRegistration.tsx` | Registers the VM-side `widgets.kanban` helper API. |

The current implementation imports these files with Vite's raw import query. That makes the package code depend on a bundler feature that is not part of JavaScript or TypeScript module semantics. It also creates different behavior between Vite production builds and Vite dev dependency optimization.

The expected public package behavior is:

- consumers import normal package exports,
- consumers do not configure bundlers for package internals,
- package runtime preludes are regular JavaScript string exports,
- readable `.vm.js` authoring files remain in source control,
- generated string modules stay synchronized with authoring files,
- tests and Storybook continue to work in the monorepo,
- the standalone demo can delete its `optimizeDeps` workaround after upgrading patch versions.

## Evidence and Current-State Analysis

### `os-scripting` imports the VM bootstrap with `?raw`

`packages/os-scripting/src/plugin-runtime/runtimeService.ts` imports `stack-bootstrap.vm.js?raw` at line 12. That imported string is later passed into `DEFAULT_RUNTIME_SESSION_MANAGER.ensureSession(...)` and used as the bootstrap source for the QuickJS session.

Relevant evidence:

```text
packages/os-scripting/src/plugin-runtime/runtimeService.ts:12
import stackBootstrapSource from './stack-bootstrap.vm.js?raw';
```

The same file installs runtime packages by reading registered package definitions and calling `this.sessionService.installPrelude(sessionId, runtimePackage.installPrelude)` in lines 153-158. That means every package prelude must already be a JavaScript source string by the time `QuickJSRuntimeService` loads a bundle.

### `os-ui-cards` imports the UI prelude with `?raw`

`packages/os-ui-cards/src/runtimeRegistration.tsx` imports `ui.package.vm.js?raw` at line 2 and places it in `UI_RUNTIME_PACKAGE.installPrelude` at line 11.

Current shape:

```ts
import uiPackagePrelude from './runtime-packages/ui.package.vm.js?raw';

export const UI_RUNTIME_PACKAGE: RuntimePackageDefinition = {
  packageId: 'ui',
  installPrelude: uiPackagePrelude,
  surfaceTypes: ['ui.card.v1'],
};
```

This is a public import path because consumer apps import `UI_RUNTIME_PACKAGE` from `@go-go-golems/os-ui-cards` and pass it into `registerRuntimePackage`.

### `os-kanban` imports the Kanban prelude with `?raw`

`packages/os-kanban/src/runtimeRegistration.tsx` imports `kanban.package.vm.js?raw` at line 1 and places it in `KANBAN_RUNTIME_PACKAGE.installPrelude` at line 14.

Current shape:

```ts
import kanbanPackagePrelude from './runtime-packages/kanban.package.vm.js?raw';

export const KANBAN_RUNTIME_PACKAGE: RuntimePackageDefinition = {
  packageId: 'kanban',
  installPrelude: kanbanPackagePrelude,
  dependencies: ['ui'],
};
```

This is visible to consumers as soon as they import `KANBAN_RUNTIME_PACKAGE`.

### The dist builder currently copies `.vm.js` assets but does not inline them

`scripts/packages/build-dist.mjs` treats `.vm.js` as an asset suffix. Lines 20-37 define asset copying. This is why published packages contain the `.vm.js` files, but it does not solve the public package issue because the generated package JavaScript still imports `?raw`.

Current behavior:

```js
const assetSuffixes = ['.css', '.vm.js'];
```

The asset files are useful for inspection and source maps, but the runtime package code should not require consumers to import them through a Vite query.

### Tests and stories also use `?raw`, but they are not the primary public package problem

A repository search finds many `?raw` imports in tests and stories. Those can remain for now because tests and stories run in the monorepo's Vite/Vitest/Storybook context. The public package issue is specifically package runtime code that ships in `dist` and is imported by consumers.

Implementation should therefore prioritize replacing `?raw` in these public runtime import sites:

```text
packages/os-scripting/src/plugin-runtime/runtimeService.ts
packages/os-ui-cards/src/runtimeRegistration.tsx
packages/os-kanban/src/runtimeRegistration.tsx
```

Tests and stories can be cleaned up later if desired, but do not need to block the patch.

## Desired End State

The runtime import sites should become ordinary TypeScript imports:

```ts
import stackBootstrapSource from './stackBootstrapSource.generated';
import uiPackagePrelude from './runtime-packages/uiPackageSource.generated';
import kanbanPackagePrelude from './runtime-packages/kanbanPackageSource.generated';
```

The generated modules should look like this:

```ts
// Generated from ./stack-bootstrap.vm.js. Do not edit by hand.
const source = "...escaped VM JavaScript source...";
export default source;
```

After patch publication, a consumer should not need this workaround:

```ts
optimizeDeps: {
  exclude: ['@go-go-golems/os-scripting', '@go-go-golems/os-ui-cards', '@go-go-golems/os-kanban'],
  include: ['debug'],
}
```

The standalone demo should still build and run stages 07-09 from registry packages.

## Proposed Solution: Option A Generated TypeScript Source Modules

Option A keeps `.vm.js` as the readable authoring format and adds a small generator that writes `.generated.ts` modules next to the relevant source files. Package runtime code imports the generated TypeScript modules instead of importing `.vm.js?raw`.

### Generated file layout

Create these generated modules:

```text
packages/os-scripting/src/plugin-runtime/stackBootstrapSource.generated.ts
packages/os-ui-cards/src/runtime-packages/uiPackageSource.generated.ts
packages/os-kanban/src/runtime-packages/kanbanPackageSource.generated.ts
```

Keep these authoring files unchanged as the source of truth:

```text
packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js
packages/os-ui-cards/src/runtime-packages/ui.package.vm.js
packages/os-kanban/src/runtime-packages/kanban.package.vm.js
```

### Generator script

Add a repository script:

```text
scripts/packages/generate-vm-source-modules.mjs
```

The script should read a small hardcoded manifest of source-to-output mappings and write TypeScript modules.

Pseudocode:

```js
#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const workspaceRoot = process.cwd();

const modules = [
  {
    source: 'packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js',
    target: 'packages/os-scripting/src/plugin-runtime/stackBootstrapSource.generated.ts',
  },
  {
    source: 'packages/os-ui-cards/src/runtime-packages/ui.package.vm.js',
    target: 'packages/os-ui-cards/src/runtime-packages/uiPackageSource.generated.ts',
  },
  {
    source: 'packages/os-kanban/src/runtime-packages/kanban.package.vm.js',
    target: 'packages/os-kanban/src/runtime-packages/kanbanPackageSource.generated.ts',
  },
];

for (const entry of modules) {
  const sourcePath = path.join(workspaceRoot, entry.source);
  const targetPath = path.join(workspaceRoot, entry.target);
  const source = await readFile(sourcePath, 'utf8');
  const relative = path.relative(path.dirname(targetPath), sourcePath).replaceAll(path.sep, '/');
  const content = [
    '// Generated by scripts/packages/generate-vm-source-modules.mjs.',
    `// Source: ${relative}`,
    '// Do not edit by hand.',
    '',
    `const source = ${JSON.stringify(source)};`,
    '',
    'export default source;',
    '',
  ].join('\n');
  await writeFile(targetPath, content, 'utf8');
}
```

Using `JSON.stringify(source)` is intentional. It handles quotes, backticks, newlines, and other JavaScript escaping safely. Avoid `String.raw` for generated content because source files may contain backticks, `${...}`, or backslash sequences that are easier to mishandle in template literals.

### Package scripts

Add a root script in `go-go-os-frontend/package.json` if appropriate:

```json
{
  "scripts": {
    "generate:vm-sources": "node scripts/packages/generate-vm-source-modules.mjs"
  }
}
```

If each package should be independently buildable, add a `pregenerate` or `prebuild` style script only if it does not disrupt current package workflows. The simplest safe pattern for this ticket is:

1. commit generated files,
2. add a root generator script,
3. add a CI/check command that regenerates and fails if generated files differ.

### Check script

Add an optional check mode:

```bash
node scripts/packages/generate-vm-source-modules.mjs --check
```

Pseudocode:

```js
const check = process.argv.includes('--check');
if (check) {
  const existing = await readFile(targetPath, 'utf8').catch(() => null);
  if (existing !== content) {
    console.error(`${entry.target} is stale; run npm run generate:vm-sources`);
    process.exitCode = 1;
  }
} else {
  await writeFile(targetPath, content, 'utf8');
}
```

This prevents future edits to `.vm.js` files from silently leaving stale generated modules.

## Import Changes

### `os-scripting`

Before:

```ts
import stackBootstrapSource from './stack-bootstrap.vm.js?raw';
```

After:

```ts
import stackBootstrapSource from './stackBootstrapSource.generated';
```

No runtime service behavior should change. The value remains a string containing the VM bootstrap.

### `os-ui-cards`

Before:

```ts
import uiPackagePrelude from './runtime-packages/ui.package.vm.js?raw';
```

After:

```ts
import uiPackagePrelude from './runtime-packages/uiPackageSource.generated';
```

`UI_RUNTIME_PACKAGE.installPrelude` remains a string.

### `os-kanban`

Before:

```ts
import kanbanPackagePrelude from './runtime-packages/kanban.package.vm.js?raw';
```

After:

```ts
import kanbanPackagePrelude from './runtime-packages/kanbanPackageSource.generated';
```

`KANBAN_RUNTIME_PACKAGE.installPrelude` remains a string and `dependencies: ['ui']` remains unchanged.

## Versioning and Publication Plan

Publish patch versions:

```text
@go-go-golems/os-scripting@0.1.1
@go-go-golems/os-ui-cards@0.1.1
@go-go-golems/os-kanban@0.1.1
```

`os-chat` and `os-confirm` do not need patch releases for this issue because they do not contain runtime-critical `.vm.js?raw` imports in published package code.

Dependency impact:

- `os-ui-cards@0.1.1` should depend on `os-scripting@0.1.1`.
- `os-kanban@0.1.1` should depend on `os-scripting@0.1.1` and `os-ui-cards@0.1.1`.
- `os-kanban` can continue depending on `os-widgets@0.1.2` unless another package update requires a bump.

Build/publish order:

1. `os-scripting@0.1.1`
2. `os-ui-cards@0.1.1`
3. `os-kanban@0.1.1`

## Standalone Demo Migration

After publishing patch versions, update the demo dependencies:

```json
{
  "@go-go-golems/os-scripting": "^0.1.1",
  "@go-go-golems/os-ui-cards": "^0.1.1",
  "@go-go-golems/os-kanban": "^0.1.1"
}
```

Then remove the workaround from `vite.config.ts` and `.storybook/main.ts`:

```ts
const vmRuntimePackages = [
  '@go-go-golems/os-scripting',
  '@go-go-golems/os-ui-cards',
  '@go-go-golems/os-kanban',
];

optimizeDeps: {
  exclude: vmRuntimePackages,
  include: ['debug'],
}
```

The demo's own `.vm.js?raw` imports should remain. Those are consumer-authored raw imports, not published package internals, and they are handled by the consumer's Vite app directly.

## Implementation Phases

### Phase 1: Generator and generated modules

Files:

```text
scripts/packages/generate-vm-source-modules.mjs
packages/os-scripting/src/plugin-runtime/stackBootstrapSource.generated.ts
packages/os-ui-cards/src/runtime-packages/uiPackageSource.generated.ts
packages/os-kanban/src/runtime-packages/kanbanPackageSource.generated.ts
```

Tasks:

- Add generator script with normal and `--check` modes.
- Generate modules using `JSON.stringify`.
- Commit generated modules.
- Add root script if package conventions allow it.

Validation:

```bash
node scripts/packages/generate-vm-source-modules.mjs --check
```

### Phase 2: Replace public runtime imports

Files:

```text
packages/os-scripting/src/plugin-runtime/runtimeService.ts
packages/os-ui-cards/src/runtimeRegistration.tsx
packages/os-kanban/src/runtimeRegistration.tsx
```

Tasks:

- Replace the three runtime-critical `?raw` imports with generated module imports.
- Do not change tests/stories unless they fail.
- Run targeted tests.

Validation:

```bash
npm run typecheck -w packages/os-scripting
npm test -w packages/os-scripting
npm run typecheck -w packages/os-ui-cards
npm test -w packages/os-ui-cards
npm run typecheck -w packages/os-kanban
npm test -w packages/os-kanban
```

### Phase 3: Bump versions and build dist

Files:

```text
packages/os-scripting/package.json
packages/os-ui-cards/package.json
packages/os-kanban/package.json
```

Tasks:

- Bump all three packages to `0.1.1`.
- Run `build:dist` in dependency order.
- Inspect dist JS for absence of runtime-critical `?raw` imports.

Validation:

```bash
npm run build:dist -w packages/os-scripting
npm run build:dist -w packages/os-ui-cards
npm run build:dist -w packages/os-kanban
rg -n "stack-bootstrap\.vm\.js\?raw|ui\.package\.vm\.js\?raw|kanban\.package\.vm\.js\?raw" packages/*/dist
```

The final `rg` should find no matches in package runtime code. It may still find README examples if docs mention consumer-authored raw bundle imports; that is acceptable only if the match is clearly documentation, not runtime JS.

### Phase 4: Publish patch versions

Commands:

```bash
npm publish packages/os-scripting/dist --access public --registry https://registry.npmjs.org/
npm publish packages/os-ui-cards/dist --access public --registry https://registry.npmjs.org/
npm publish packages/os-kanban/dist --access public --registry https://registry.npmjs.org/
```

Use the existing `.envrc` `NPM_TOKEN` through a temporary npm userconfig, as established by the VM package publication step. Do not print the token.

Verify:

```bash
npm view @go-go-golems/os-scripting version --registry https://registry.npmjs.org/
npm view @go-go-golems/os-ui-cards version --registry https://registry.npmjs.org/
npm view @go-go-golems/os-kanban version --registry https://registry.npmjs.org/
```

### Phase 5: Demo cleanup and validation

Files in `2026-05-11--npm-go-go-os-test`:

```text
package.json
package-lock.json
vite.config.ts
.storybook/main.ts
README.md
```

Tasks:

- Install patch versions.
- Remove `optimizeDeps.exclude` / `include: ['debug']` workaround.
- Update README to remove or archive the workaround note.
- Keep `src/raw-imports.d.ts`, because consumer-authored examples still import local `.vm.js?raw` bundles.

Validation:

```bash
rm -rf node_modules/.vite
npm ls @go-go-golems/os-scripting @go-go-golems/os-ui-cards @go-go-golems/os-kanban
npm run typecheck
npm run build
npm run build-storybook
npm run dev -- --host 127.0.0.1 --force
```

Browser smoke:

- Stage 07 shows `Hello from QuickJS`.
- Stage 08 increments `Count stored in runtime surface draft: 0` to `1`.
- Stage 09 shows `VM-authored Kanban`.
- Browser console has no errors.

## Testing Strategy

### Unit and integration tests

The patch should not change runtime behavior. Existing tests should pass without snapshot updates unless they assert import paths.

Target suites:

```bash
npm test -w packages/os-scripting
npm test -w packages/os-ui-cards
npm test -w packages/os-kanban
```

Important areas:

- QuickJS runtime bundle loading,
- runtime package installation order,
- UI runtime registration,
- Kanban runtime registration,
- `RuntimeSurfaceSessionHost` render/event behavior.

### Generated source consistency

Add a check mode and run it in validation:

```bash
node scripts/packages/generate-vm-source-modules.mjs --check
```

This check should fail if someone edits `.vm.js` but does not regenerate `.generated.ts`.

### Dist artifact inspection

Inspect published artifacts before publish:

```bash
rg -n "\?raw" packages/os-scripting/dist packages/os-ui-cards/dist packages/os-kanban/dist
```

Expected result:

- no runtime JS imports with `?raw`,
- possible README references only if intentionally documented.

### Consumer validation

The final proof is the standalone demo without the workaround. If `npm run dev -- --host 127.0.0.1 --force` starts without VM package optimization exclusions, the patch achieved its primary goal.

## Risks and Mitigations

### Risk: generated files become stale

Mitigation: add `--check` mode and include it in validation. Consider adding a CI target later.

### Risk: generated files are edited by hand

Mitigation: generated header says `Do not edit by hand`; code review should check that source-of-truth `.vm.js` files and generated files match.

### Risk: TypeScript import extension mismatch

Generated imports should omit the extension:

```ts
import source from './stackBootstrapSource.generated';
```

This follows current TypeScript/bundler resolution patterns and avoids emitting `.ts` import extensions into dist JS.

### Risk: package patch does not remove all public `?raw` imports

Mitigation: run `rg -n "\.vm\.js\?raw" packages/os-scripting/src packages/os-ui-cards/src packages/os-kanban/src` and manually classify remaining matches. Runtime service/registration code should have no such imports. Tests/stories can remain.

### Risk: consumers using non-Vite bundlers still hit other assumptions

This patch removes the most obvious Vite-specific package runtime import. QuickJS WASM packaging may still have bundler-specific behavior. Mitigation: keep the standalone Vite demo as the first consumer proof and later add a minimal webpack/next/esbuild smoke if demand appears.

## Alternatives Considered

### Alternative B: rewrite raw imports in `build-dist.mjs`

The dist builder could rewrite `?raw` imports while generating publish artifacts. This avoids generated files in source, but it makes the build script more complex and hides the public package behavior from normal source review. It is also harder to test in package-local source mode.

Rejected for this ticket.

### Alternative C: inline string constants by hand

The VM source could be pasted into TypeScript template literals. This removes generation but makes VM code harder to read and easier to break through escaping mistakes.

Rejected.

### Alternative D: keep documenting the Vite workaround

The workaround is acceptable for the first release but not a good public package contract. It requires every consumer to learn about package internals and creates extra Storybook/Vite configuration.

Rejected as the long-term state.

## API and File Reference

### Source-of-truth VM files

```text
packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js
packages/os-ui-cards/src/runtime-packages/ui.package.vm.js
packages/os-kanban/src/runtime-packages/kanban.package.vm.js
```

### Generated modules to add

```text
packages/os-scripting/src/plugin-runtime/stackBootstrapSource.generated.ts
packages/os-ui-cards/src/runtime-packages/uiPackageSource.generated.ts
packages/os-kanban/src/runtime-packages/kanbanPackageSource.generated.ts
```

### Runtime import sites to change

```text
packages/os-scripting/src/plugin-runtime/runtimeService.ts
packages/os-ui-cards/src/runtimeRegistration.tsx
packages/os-kanban/src/runtimeRegistration.tsx
```

### Package metadata to bump

```text
packages/os-scripting/package.json
packages/os-ui-cards/package.json
packages/os-kanban/package.json
```

### Consumer workaround to remove after patch

```text
2026-05-11--npm-go-go-os-test/vite.config.ts
2026-05-11--npm-go-go-os-test/.storybook/main.ts
2026-05-11--npm-go-go-os-test/README.md
```


## Implementation Outcome

The Option A fix was implemented and published as patch versions:

```text
@go-go-golems/os-scripting@0.1.1
@go-go-golems/os-ui-cards@0.1.1
@go-go-golems/os-kanban@0.1.1
```

The generated modules were added and package runtime imports now use them instead of Vite raw-query imports. The standalone demo was updated to consume the patch versions and no longer needs package-specific `optimizeDeps.exclude` / `include: ['debug']` configuration. The demo still keeps `src/raw-imports.d.ts` because its own examples intentionally import local VM bundles with `?raw`.

Validation completed:

```bash
npm run check:vm-sources
npm run typecheck -w packages/os-scripting
npm test -w packages/os-scripting
npm run typecheck -w packages/os-ui-cards
npm test -w packages/os-ui-cards
npm run typecheck -w packages/os-kanban
npm test -w packages/os-kanban
npm run build:dist -w packages/os-scripting
npm run build:dist -w packages/os-ui-cards
npm run build:dist -w packages/os-kanban
```

Standalone demo validation completed after removing the workaround:

```bash
rm -rf node_modules/.vite
npm ls @go-go-golems/os-scripting @go-go-golems/os-ui-cards @go-go-golems/os-kanban
npm run typecheck
npm run build
npm run build-storybook
npm run dev -- --host 127.0.0.1 --force
```

Browser smoke verified stages 07, 08, and 09. The only browser console error was the pre-existing harmless `/favicon.ico` 404.
