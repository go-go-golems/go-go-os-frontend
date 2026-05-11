---
Title: Diary
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
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../2026-05-11--npm-go-go-os-test/.storybook/main.ts
      Note: |-
        Storybook workaround to remove after patch
        removed Storybook VM package optimizeDeps workaround
    - Path: ../../../../../../../2026-05-11--npm-go-go-os-test/README.md
      Note: documents no package-internal workaround needed after 0.1.1
    - Path: ../../../../../../../2026-05-11--npm-go-go-os-test/package.json
      Note: demo consumes VM patch versions 0.1.1
    - Path: ../../../../../../../2026-05-11--npm-go-go-os-test/vite.config.ts
      Note: |-
        consumer workaround to remove after patch
        removed VM package optimizeDeps workaround
    - Path: .github/workflows/launcher-ci.yml
      Note: CI gate for stale generated VM source modules (commit f4f445b)
    - Path: .github/workflows/publish-github-package-canary.yml
      Note: Canary publish gate for stale generated VM source modules (commit f4f445b)
    - Path: package.json
      Note: root scripts for generating/checking VM sources
    - Path: packages/os-kanban/README.md
      Note: documents no package-specific Vite workaround for Kanban runtime package (commit aabda33)
    - Path: packages/os-kanban/package.json
      Note: docs patch version 0.1.2
    - Path: packages/os-kanban/src/runtime-packages/kanban.package.vm.js
      Note: source-of-truth Kanban runtime prelude to generate from
    - Path: packages/os-kanban/src/runtime-packages/kanbanPackageSource.generated.ts
      Note: generated Kanban runtime prelude string
    - Path: packages/os-scripting/README.md
      Note: documents no Vite optimizeDeps workaround and host toast chrome for notify.show (commit aabda33)
    - Path: packages/os-scripting/package.json
      Note: docs patch version 0.1.2
    - Path: packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js
      Note: source-of-truth QuickJS bootstrap to generate from
    - Path: packages/os-scripting/src/plugin-runtime/stackBootstrapSource.generated.ts
      Note: generated QuickJS bootstrap source string
    - Path: packages/os-ui-cards/README.md
      Note: documents generated prelude modules and current notify.show action schema (commit aabda33)
    - Path: packages/os-ui-cards/package.json
      Note: docs patch version 0.1.2
    - Path: packages/os-ui-cards/src/runtime-packages/ui.package.vm.js
      Note: source-of-truth UI runtime prelude to generate from
    - Path: packages/os-ui-cards/src/runtime-packages/uiPackageSource.generated.ts
      Note: generated UI runtime prelude string
    - Path: scripts/packages/generate-vm-source-modules.mjs
      Note: |-
        generator and check mode for VM source string modules
        Check script executed by the new workflow steps
ExternalSources: []
Summary: Chronological implementation diary for replacing published VM package ?raw imports with generated TypeScript source modules.
LastUpdated: 2026-05-11T21:55:00-04:00
WhatFor: Use this to continue or review the Option A raw-source module fix for published VM packages.
WhenToUse: Before changing VM prelude imports, generation scripts, package patch versions, or demo Vite workaround configuration.
---






# Diary

## Goal

This diary records the work to implement the Option A fix: keep `.vm.js` files as readable source-of-truth files, generate TypeScript string modules from them, import those generated modules in published runtime code, publish patch versions, and remove the standalone demo's VM-package Vite workaround.

## Step 1: Created the ticket and designed the Option A fix

I created a dedicated docmgr ticket for the bundler-agnostic VM source module patch. The design documents why the current first-release workaround exists, which package imports cause it, and how to replace those imports with generated TypeScript modules without changing VM runtime behavior.

The design intentionally keeps `.vm.js` files as readable authoring files. The generated `.generated.ts` files become the import targets for package runtime code, while a generator `--check` mode protects against stale generated output.

### Prompt Context

**User prompt (verbatim):** "Alright, create a new docmgr ticket to do the proper option A fix, along with a design/implementation guide (upload to remarkable) and tasks."

**Assistant interpretation:** Create a planning ticket for the proper generated-source-module patch, write a detailed design/implementation guide and tasks, upload the documentation bundle to reMarkable, and prepare the work for later implementation.

**Inferred user intent:** Remove the public VM package family's Vite-specific `?raw` consumer workaround and document a safe implementation plan before editing package code.

**Commit (code):** pending at time of step.

### What I did

- Created docmgr ticket `vm-raw-source-modules` in `go-go-os-frontend`.
- Added the design document:
  - `design-doc/01-bundler-agnostic-vm-source-modules-option-a-fix.md`
- Added this diary:
  - `reference/01-diary.md`
- Wrote a task list in:
  - `tasks.md`
- Gathered evidence from:
  - `packages/os-scripting/src/plugin-runtime/runtimeService.ts`
  - `packages/os-ui-cards/src/runtimeRegistration.tsx`
  - `packages/os-kanban/src/runtimeRegistration.tsx`
  - `scripts/packages/build-dist.mjs`
  - package metadata for `os-scripting`, `os-ui-cards`, and `os-kanban`
- Searched for `?raw` imports to distinguish public runtime imports from tests/stories.

### Why

- The current VM packages are usable, but consumers need Vite-specific `optimizeDeps` configuration because published package runtime code imports `.vm.js?raw` files.
- A good public package should not require the consumer to know about package-internal VM prelude files.
- The Option A fix is small but touches publication behavior, generated files, package versions, and demo validation, so it needs a design before implementation.

### What worked

- The source evidence clearly identified three public runtime import sites:

```text
packages/os-scripting/src/plugin-runtime/runtimeService.ts
packages/os-ui-cards/src/runtimeRegistration.tsx
packages/os-kanban/src/runtimeRegistration.tsx
```

- The design can leave test/story `?raw` imports alone initially because they are not shipped as public runtime entry points.
- The existing package dist builder already copies `.vm.js` assets, so the patch only needs to change runtime imports and generated modules, not remove source assets.

### What didn't work

- N/A. This was a planning/documentation step.

### What I learned

- The main package contract problem is not the existence of `.vm.js` files in published packages; it is the published runtime JavaScript import query `?raw`.
- The cleanest public package behavior is to make `installPrelude` values ordinary string imports before the package reaches the consumer bundler.

### What was tricky to build

- The tricky part is preserving developer ergonomics while removing consumer bundler assumptions. Keeping `.vm.js` as source-of-truth files preserves readability, while generated TypeScript modules provide bundler-agnostic imports.
- Another subtlety is deciding what not to change: tests and Storybook fixtures can continue to use `?raw` until there is a broader cleanup need.

### What warrants a second pair of eyes

- Review whether generated files should be committed or generated in package `prebuild` scripts. The design recommends committing generated files plus adding a `--check` mode.
- Review whether package READMEs should be patched in `0.1.1` to remove or de-emphasize the Vite workaround.

### What should be done in the future

- Implement the generator and import changes.
- Publish `os-scripting@0.1.1`, `os-ui-cards@0.1.1`, and `os-kanban@0.1.1`.
- Remove the Vite workaround from the standalone demo and validate stages 07-09.

### Code review instructions

- Start with the design doc.
- Check the three runtime-critical import sites.
- Ensure generated modules use `JSON.stringify` rather than hand-authored template literals.
- Validate that package dist output no longer contains runtime `.vm.js?raw` imports.

### Technical details

Target generated files:

```text
packages/os-scripting/src/plugin-runtime/stackBootstrapSource.generated.ts
packages/os-ui-cards/src/runtime-packages/uiPackageSource.generated.ts
packages/os-kanban/src/runtime-packages/kanbanPackageSource.generated.ts
```

Target patch versions:

```text
@go-go-golems/os-scripting@0.1.1
@go-go-golems/os-ui-cards@0.1.1
@go-go-golems/os-kanban@0.1.1
```


## Step 2: Generated VM source modules and replaced runtime imports

I implemented the first half of the Option A fix. The packages still keep `.vm.js` files as the readable source of truth, but the runtime-critical package code now imports generated TypeScript modules that export those VM files as ordinary JavaScript strings.

This step removes the published-runtime dependency on Vite `?raw` for the three important import sites while leaving tests and stories alone. The generator has a `--check` mode so future edits to VM source files can be detected before publishing stale generated modules.

### Prompt Context

**User prompt (verbatim):** "go ahead, commit at appropriat eintervals, and keep a detailed diary as you worok"

**Assistant interpretation:** Implement the planned Option A patch incrementally, commit focused changes, and update the diary as work progresses.

**Inferred user intent:** Move from design to implementation while preserving reviewable checkpoints and continuation-friendly documentation.

**Commit (code):** `9246f3a` — "Generate VM source modules"

### What I did

- Added generator script:
  - `scripts/packages/generate-vm-source-modules.mjs`
- Added root scripts:

```json
"generate:vm-sources": "node scripts/packages/generate-vm-source-modules.mjs",
"check:vm-sources": "node scripts/packages/generate-vm-source-modules.mjs --check"
```

- Generated and committed:
  - `packages/os-scripting/src/plugin-runtime/stackBootstrapSource.generated.ts`
  - `packages/os-ui-cards/src/runtime-packages/uiPackageSource.generated.ts`
  - `packages/os-kanban/src/runtime-packages/kanbanPackageSource.generated.ts`
- Replaced runtime-critical imports:
  - `runtimeService.ts` now imports `./stackBootstrapSource.generated`
  - `os-ui-cards/runtimeRegistration.tsx` now imports `./runtime-packages/uiPackageSource.generated`
  - `os-kanban/runtimeRegistration.tsx` now imports `./runtime-packages/kanbanPackageSource.generated`
- Ran validation:

```bash
npm run check:vm-sources
npm run typecheck -w packages/os-scripting
npm test -w packages/os-scripting
npm run typecheck -w packages/os-ui-cards
npm test -w packages/os-ui-cards
npm run typecheck -w packages/os-kanban
npm test -w packages/os-kanban
```

### Why

- Published package runtime code should import ordinary JS/TS modules, not Vite raw-query modules from `node_modules`.
- The generated modules make the VM source strings available to package code without requiring consumer bundlers to understand `?raw`.

### What worked

- The generator wrote all three modules and `--check` reported them up to date.
- Typecheck and test suites passed for all three target packages.
- The import replacements were behavior-preserving: install prelude values remain strings.

### What didn't work

- N/A for this step. The implementation matched the design and validation passed.

### What I learned

- The generated output is compact enough to commit directly, and `JSON.stringify` safely handles the VM JavaScript source without template literal escaping hazards.
- We can fix the public package issue without disrupting test/story fixtures that still use `?raw` in the monorepo.

### What was tricky to build

- The key constraint was not to overcorrect. Only runtime imports that ship in public package code needed to change. Test and Storybook raw imports are still acceptable because they are local tooling concerns.
- The generator must run from the workspace root because its manifest paths are root-relative.

### What warrants a second pair of eyes

- Review the generated file policy: generated files are committed and checked with `--check` rather than generated in every package prebuild.
- Review whether the generator manifest should eventually be discovered from package metadata instead of hardcoded.

### What should be done in the future

- Bump and publish `os-scripting`, `os-ui-cards`, and `os-kanban` patch versions.
- Verify dist output no longer contains runtime `?raw` imports.
- Remove the demo workaround after consuming the patches.

### Code review instructions

- Start with `scripts/packages/generate-vm-source-modules.mjs`.
- Confirm generated modules point back to their `.vm.js` source files.
- Confirm runtime import sites no longer use `.vm.js?raw`.
- Re-run the validation commands listed above.

### Technical details

The generator supports:

```bash
npm run generate:vm-sources
npm run check:vm-sources
```

The generated modules use this pattern:

```ts
// Generated by scripts/packages/generate-vm-source-modules.mjs.
// Source: ./stack-bootstrap.vm.js
// Do not edit by hand.

const source = "...";

export default source;
```


## Step 3: Published patch packages and removed the demo Vite workaround

I finished the Option A patch by bumping the three VM runtime packages to `0.1.1`, building and inspecting dist artifacts, publishing the patches to npm, and updating the standalone demo to consume the new patch versions. After that, I removed the package-specific Vite and Storybook `optimizeDeps` workaround from the demo and revalidated stages 07 through 09.

This proves the patch goal: consumers no longer need to exclude `@go-go-golems/os-scripting`, `@go-go-golems/os-ui-cards`, or `@go-go-golems/os-kanban` from Vite dependency optimization just to consume published package internals.

### Prompt Context

**User prompt (verbatim):** (see Step 2)

**Assistant interpretation:** Continue implementation through package publication, demo cleanup, validation, docs, and commits.

**Inferred user intent:** Complete the Option A fix end-to-end, not just source changes.

**Commit (code):** `0aacc8e` — "Bump VM packages for raw source patch"; demo commit `23da0e9` — "Consume VM raw source patch packages"

### What I did

- Bumped packages:
  - `@go-go-golems/os-scripting` from `0.1.0` to `0.1.1`
  - `@go-go-golems/os-ui-cards` from `0.1.0` to `0.1.1`
  - `@go-go-golems/os-kanban` from `0.1.0` to `0.1.1`
- Built dist artifacts:

```bash
npm run build:dist -w packages/os-scripting
npm run build:dist -w packages/os-ui-cards
npm run build:dist -w packages/os-kanban
```

- Verified runtime-critical raw imports were absent from dist:

```bash
rg -n "stack-bootstrap\.vm\.js\?raw|ui\.package\.vm\.js\?raw|kanban\.package\.vm\.js\?raw" packages/os-scripting/dist packages/os-ui-cards/dist packages/os-kanban/dist
```

- Dry-ran and published:

```text
@go-go-golems/os-scripting@0.1.1
@go-go-golems/os-ui-cards@0.1.1
@go-go-golems/os-kanban@0.1.1
```

- Verified npmjs has `latest: 0.1.1` for all three packages using a temporary npm userconfig that points the scope at npmjs.
- Updated demo dependencies to `^0.1.1`.
- Removed workaround config from:
  - `2026-05-11--npm-go-go-os-test/vite.config.ts`
  - `2026-05-11--npm-go-go-os-test/.storybook/main.ts`
- Updated demo README to explain that published package internals no longer need a Vite workaround.
- Validated demo:

```bash
rm -rf node_modules/.vite
npm ls @go-go-golems/os-scripting @go-go-golems/os-ui-cards @go-go-golems/os-kanban
npm run typecheck
npm run build
npm run build-storybook
npm run dev -- --host 127.0.0.1 --force
```

- Browser-smoked stages 07-09.

### Why

- Source changes alone are not enough; the package fix only matters after dist artifacts are published and a clean consumer app can remove the workaround.
- The demo needed to prove Vite dev startup specifically, because that is where the original `?raw` package-import problem appeared.

### What worked

- Dry-run publish showed generated modules included in package tarballs:
  - `plugin-runtime/stackBootstrapSource.generated.js`
  - `runtime-packages/uiPackageSource.generated.js`
  - `runtime-packages/kanbanPackageSource.generated.js`
- Patch package publishes succeeded using the existing `.envrc` `NPM_TOKEN` through a temporary npm config.
- Demo dependency tree deduped to `0.1.1` for all three VM packages.
- Demo typecheck, production build, Storybook build, and Vite dev startup passed without the workaround.
- Browser smoke passed:
  - Stage 07 displayed `Hello from QuickJS`.
  - Stage 08 incremented draft state from `0` to `1`.
  - Stage 09 displayed `VM-authored Kanban`.

### What didn't work

- A plain `npm view` was still affected by the global/home npm scope config that points `@go-go-golems` at GitHub Packages, causing:

```text
npm error code E403
npm error 403 Forbidden - GET https://npm.pkg.github.com/@go-go-golems%2fos-scripting
```

- Using `--registry https://registry.npmjs.org/` alone was not enough in that shell because the scoped registry config still won. I used a temporary `NPM_CONFIG_USERCONFIG` with `@go-go-golems:registry=https://registry.npmjs.org/` to verify npmjs.
- Browser console still reports `/favicon.ico` 404. This is unrelated to the VM package patch.

### What I learned

- For scoped packages, npm's scoped registry config can override explicit registry flags in surprising ways. Verification should use a temporary npm userconfig when the home config points the scope elsewhere.
- The package patch fixed the original Vite dev optimization failure: the demo no longer needs `optimizeDeps.exclude` for the VM package family.

### What was tricky to build

- The tricky part was validating the absence of a workaround. It was not enough to run production builds; I had to clear `node_modules/.vite`, start the dev server with `--force`, and smoke stages 07-09 in the browser.
- Another sharp edge was npm verification. Because global config still points `@go-go-golems` to GitHub Packages, publication verification needed explicit clean npm userconfig rather than relying on normal `npm view` commands.

### What warrants a second pair of eyes

- Review whether generated source modules should be included in package tarballs but `.vm.js` source assets should remain too. Keeping both is useful for inspection but duplicates a little source text.
- Review whether the root `check:vm-sources` script should be wired into CI.

### What should be done in the future

- Add a CI/release checklist item to run `npm run check:vm-sources` before package builds.
- Consider adding a small scripted browser regression for demo stages 07-09.

### Code review instructions

- Review package source commit `9246f3a` first, then version bump commit `0aacc8e`.
- Review demo commit `23da0e9` to confirm the workaround was removed rather than just hidden.
- Validate with the commands listed above.

### Technical details

Published patch versions:

```text
@go-go-golems/os-scripting@0.1.1
@go-go-golems/os-ui-cards@0.1.1
@go-go-golems/os-kanban@0.1.1
```

Demo dependency tree after update:

```text
@go-go-golems/os-kanban@0.1.1
├── @go-go-golems/os-scripting@0.1.1 deduped
└── @go-go-golems/os-ui-cards@0.1.1 deduped
@go-go-golems/os-scripting@0.1.1
@go-go-golems/os-ui-cards@0.1.1
```


## Step 4: Published README-only VM package follow-up releases

After the raw-source patch was published, the package README pages still needed to explain the new consumer contract clearly. I updated the three README files most directly affected by the Vite raw-import fix and published documentation patch releases so npm users see the corrected guidance.

The README updates now say that consumers no longer need package-specific Vite `optimizeDeps` exclusions for the VM package family. They also clarify that app-local `*.vm.js?raw` imports are still fine, and they document the host-toast pattern needed for `notify.show` runtime actions.

### Prompt Context

**User prompt (verbatim):** "do 4. 
5. silence 404"

**Assistant interpretation:** Complete the suggested README pass for VM packages, publish the resulting public npm package pages, and separately silence the demo favicon 404.

**Inferred user intent:** Polish the public consumer experience now that the package behavior is fixed, and remove the last distracting browser-console noise.

**Commit (code):** `aabda33` — "Document VM package bundler behavior"

### What I did

- Updated README guidance for:
  - `packages/os-scripting/README.md`
  - `packages/os-ui-cards/README.md`
  - `packages/os-kanban/README.md`
- Added bundler notes explaining that `0.1.1+` package internals use generated JavaScript string modules and do not require Vite dependency-optimization workarounds.
- Corrected the `@go-go-golems/os-ui-cards` notification example from the older `{ scope, command }` shape to the current runtime action contract:

```js
ctx.dispatch({
  type: 'notify.show',
  payload: { message: 'Hello from the VM' },
});
```

- Added `notify.show` host-chrome guidance to `@go-go-golems/os-scripting` and `@go-go-golems/os-ui-cards` docs.
- Bumped and published README/doc patch releases:

```text
@go-go-golems/os-scripting@0.1.2
@go-go-golems/os-ui-cards@0.1.2
@go-go-golems/os-kanban@0.1.2
```

- Validated generated source modules and dist README copying:

```bash
npm run check:vm-sources
npm run build:dist -w packages/os-scripting
npm run build:dist -w packages/os-ui-cards
npm run build:dist -w packages/os-kanban
```

- Dry-ran and published all three packages with the temporary npmjs userconfig/token workflow.
- Verified npmjs versions and dist-tags after propagation:

```text
@go-go-golems/os-scripting latest 0.1.2
@go-go-golems/os-ui-cards latest 0.1.2
@go-go-golems/os-kanban latest 0.1.2
```

### Why

- The previous patch fixed the actual package behavior, but public npm pages needed to explain the new behavior so consumers do not copy the temporary workaround into new apps.
- The notification example needed to teach the current action schema and the host presenter requirement discovered while fixing stage 08.

### What worked

- `build-dist.mjs` copied the updated READMEs into each package's `dist/` folder.
- Dry-run tarballs showed the updated README sizes and `0.1.2` package versions.
- Publishing succeeded non-interactively via `NPM_TOKEN` and a temporary npm userconfig.
- Npmjs verification showed `latest: 0.1.2` for all three packages after a short propagation delay.

### What didn't work

- The immediate publish command's trailing `npm view` check showed stale `latest` values for `os-scripting` and `os-ui-cards`:

```text
@go-go-golems/os-scripting 0.1.1
@go-go-golems/os-ui-cards 0.1.1
@go-go-golems/os-kanban 0.1.2
```

- Waiting briefly and rechecking with a clean temporary npm userconfig showed the expected `0.1.2` dist-tags for all three packages.

### What I learned

- Npm package-page/documentation releases can still have propagation lag even when publish succeeds.
- README examples need to be kept in sync with runtime action schema evolution; stale docs can make a working runtime look broken to consumers.

### What was tricky to build

- The package behavior had already changed in `0.1.1`, but the docs release itself needed a new patch version so npm package pages update. That means this was a docs-only code commit plus a real npm release.
- The README had to distinguish app-authored `?raw` imports from package-internal `?raw` imports. The former remains a normal Vite pattern; the latter was the thing removed from published runtime code.

### What warrants a second pair of eyes

- Review the `RuntimeToastHost` README snippet in `@go-go-golems/os-scripting`; it intentionally uses `state as any` to keep the public example compact.
- Review whether `@go-go-golems/os-chat` and `@go-go-golems/os-confirm` need similar README polish in a later docs-only release.

### What should be done in the future

- Add a package documentation checklist before future npm releases: bundler notes, action schema examples, host chrome requirements, and minimal install snippets.

### Code review instructions

- Review the three README files first.
- Confirm the corrected `notify.show` runtime action shape in `packages/os-ui-cards/README.md`.
- Validate package docs release with:

```bash
npm run check:vm-sources
npm run build:dist -w packages/os-scripting
npm run build:dist -w packages/os-ui-cards
npm run build:dist -w packages/os-kanban
npm view @go-go-golems/os-scripting dist-tags --registry https://registry.npmjs.org/
npm view @go-go-golems/os-ui-cards dist-tags --registry https://registry.npmjs.org/
npm view @go-go-golems/os-kanban dist-tags --registry https://registry.npmjs.org/
```

### Technical details

Published versions:

```text
@go-go-golems/os-scripting@0.1.2
@go-go-golems/os-ui-cards@0.1.2
@go-go-golems/os-kanban@0.1.2
```

The generated-source-module contract is unchanged from `0.1.1`; this step only updates public package documentation and version metadata.

## Step 5: Wired generated VM source checks into CI and canary publishing

I added the committed VM source-module freshness check to both the platform CI workflow and the GitHub Packages canary publish workflow. This makes the Option A generated-source invariant visible before package builds and before publish smoke tests, instead of relying on a human to remember `check:vm-sources` locally.

This is a small workflow change, but it protects the central package contract from this ticket: the readable `.vm.js` files remain the source of truth, and the generated TypeScript source-string modules must stay in sync before packages are built or published.

### Prompt Context

**User prompt (verbatim):** "continue, keep diary, commit at appropriate intervals. Once you get to the dashboardUX, stop and let me know"

**Assistant interpretation:** Continue through the remaining package/demo hardening follow-ups, keep the relevant docmgr diary current, and make focused commits. Stop if a follow-up reaches an area named `dashboardUX`.

**Inferred user intent:** Move from manual validation toward repeatable CI/release checks while preserving a reviewable implementation trail.

**Commit (code):** f4f445b — "CI: check generated VM source modules"

### What I did
- Updated `.github/workflows/launcher-ci.yml` to run `pnpm run check:vm-sources` after dependency installation and before the platform build.
- Updated `.github/workflows/publish-github-package-canary.yml` to run `pnpm run check:vm-sources` before building publish artifacts.
- Validated locally with:

```bash
pnpm run check:vm-sources
```

### Why
- The generated VM source modules are committed files and can go stale when a source `.vm.js` runtime prelude changes.
- CI should fail before build/publish when generated files are stale.
- The canary publish workflow is a release-adjacent path, so it should enforce the same invariant before producing artifacts.

### What worked
- `pnpm run check:vm-sources` reported:

```text
VM source modules are up to date.
```

- The workflow change is minimal and does not alter build or package scripts.

### What didn't work
- N/A

### What I learned
- The platform CI and canary publish workflow were the two existing workflow-level gates for this repository.
- The check belongs before package artifact generation, not after, because stale generated source should block artifacts from being created.

### What was tricky to build
- The canary workflow still uses `npm run ... -w` for per-package scripts after installing with pnpm. I kept the new root generated-source check as `pnpm run check:vm-sources` to match the root workflow install/run style and avoid changing unrelated publish semantics.

### What warrants a second pair of eyes
- Confirm whether future public npm publishing automation should share this GitHub Packages canary workflow or have a separate npmjs workflow with the same generated-source gate.

### What should be done in the future
- Add the same `check:vm-sources` step to any future npmjs.org release workflow.
- Consider adding a prepack guard if package publishing ever happens outside GitHub Actions.

### Code review instructions
- Review `.github/workflows/launcher-ci.yml` first to see the platform CI gate.
- Review `.github/workflows/publish-github-package-canary.yml` to confirm the gate runs before `Build publish artifacts`.
- Validate with:

```bash
pnpm run check:vm-sources
```

### Technical details
- The gate executes:

```bash
node scripts/packages/generate-vm-source-modules.mjs --check
```

- The script compares generated output for:
  - `packages/os-scripting/src/plugin-runtime/stackBootstrapSource.generated.ts`
  - `packages/os-ui-cards/src/runtime-packages/uiPackageSource.generated.ts`
  - `packages/os-kanban/src/runtime-packages/kanbanPackageSource.generated.ts`
