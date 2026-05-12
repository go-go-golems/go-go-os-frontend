---
Title: Diary
Ticket: npm-trusted-publishing-cicd
Status: active
Topics:
    - npm
    - go-go-os
    - frontend
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: .github/workflows/publish-npm.yml
      Note: Trusted Publishing workflow implementation diary target (commit e5e5fa2)
    - Path: packages/os-core/package.json
      Note: os-core 0.1.2 trusted publish version bump (commit 8d47026)
    - Path: scripts/packages/package-sets.mjs
      Note: |-
        Package-set diary target (commit e5e5fa2)
        vm-stack includes os-widgets before os-kanban (commit 8d47026)
    - Path: scripts/packages/publish-npm-package-set.mjs
      Note: Publish helper diary target (commit e5e5fa2)
    - Path: ttmp/2026/05/11/npm-trusted-publishing-cicd--set-up-npmjs-trusted-publishing-ci-cd-for-public-packages/playbooks/01-npm-trusted-publishing-release-runbook.md
      Note: Release runbook written after first trusted publishes
ExternalSources: []
Summary: Chronological diary for npmjs Trusted Publishing CI/CD setup.
LastUpdated: 2026-05-11T20:08:19-04:00
WhatFor: Track setup of npmjs Trusted Publishing and GitHub Actions release workflows.
WhenToUse: Use when implementing or reviewing npm package CI/CD publishing.
---



# Diary

## Goal

Capture the setup of npmjs Trusted Publishing CI/CD for the public `@go-go-golems/*` frontend packages.

## Step 1: Created the CI/CD ticket and recorded npmjs trusted-publisher state

I created a dedicated docmgr ticket for the npmjs Trusted Publishing pipeline because the earlier publishing tickets covered package extraction, manual publication, and package-boundary fixes, but not a focused CI/CD implementation plan. This ticket now owns the repository-side `publish-npm.yml` workflow work and the release runbook for trusted OIDC publishing.

The npmjs package-side configuration has already been completed for the nine current public packages. Each package trusts `go-go-golems/go-go-os-frontend`, workflow `publish-npm.yml`, and environment `npm-production`.

### Prompt Context

**User prompt (verbatim):** "Do you have a docmgr ticket to set up the CICD pipelines?"

**Assistant interpretation:** Check whether there is a dedicated ticket for npmjs CI/CD publishing; if not, create one and seed it with the current trusted-publishing state and next steps.

**Inferred user intent:** Keep the upcoming GitHub Actions Trusted Publishing implementation tracked separately from the previous package-publication and static-site deployment work.

**Commit (code):** N/A — documentation/ticket setup only so far.

### What I did
- Confirmed that related notes existed in previous tickets, but no dedicated CI/CD ticket existed.
- Created ticket `npm-trusted-publishing-cicd`.
- Added design doc `design-doc/01-npmjs-trusted-publishing-ci-cd-design.md`.
- Added this diary.
- Updated `tasks.md` with package-side setup complete and workflow implementation still pending.

### Why
- The CI/CD pipeline has its own lifecycle, risks, and validation criteria.
- Trusted Publishing involves both external npmjs settings and repository-side GitHub Actions configuration, so it needs a focused ticket.

### What worked
- npmjs Trusted Publisher configuration was verified for all nine packages before creating this ticket.
- The new design doc records the trusted identity and target workflow name.

### What didn't work
- N/A

### What I learned
- The package-side trusted identity is intentionally strict: repository, workflow filename, and environment name must match exactly.

### What was tricky to build
- The ticket needed to distinguish package-side npmjs setup, which is done, from repository-side workflow setup, which still needs to be implemented.

### What warrants a second pair of eyes
- Confirm that the GitHub Environment `npm-production` exists and has the desired required reviewers before running real publishes.

### What should be done in the future
- Implement `.github/workflows/publish-npm.yml`.
- Test with a dry run and then one low-risk real patch release.

### Code review instructions
- Start with `design-doc/01-npmjs-trusted-publishing-ci-cd-design.md`.
- Review `tasks.md` for the remaining implementation sequence.

### Technical details
- Trusted publisher values:

```text
Repository: go-go-golems/go-go-os-frontend
Workflow: publish-npm.yml
Environment: npm-production
```

## Step 2: Configured npmjs Trusted Publishers for the public package family

I used the npmjs web UI through Playwright to configure Trusted Publisher connections for the current public `@go-go-golems/*` package family. The user logged in to npmjs and completed the required security-key 2FA prompts after each submitted package settings change. I filled the same GitHub Actions trusted-publisher identity for each package and then verified all package settings pages showed the expected repository, workflow, and environment.

This step completed the npmjs package-side prerequisite for OIDC-based publication. It does not yet add the repository-side GitHub Actions workflow; that remains tracked as the next implementation task in this ticket.

### Prompt Context

**User prompt (verbatim):** "ok, use playwright to set it up for every npmjs package. I'll login for you"

**Assistant interpretation:** Use the browser to configure npmjs Trusted Publishing settings for every already-published package after the user completes login and interactive 2FA challenges.

**Inferred user intent:** Finish the npmjs package-side setup so the repository can later publish through GitHub Actions OIDC without an npm token.

**Commit (code):** N/A — external npmjs settings change only.

### What I did
- Opened npmjs login in Playwright and waited for the user to authenticate.
- Confirmed `@go-go-golems/os-core` was already configured by the user.
- Configured Trusted Publisher settings for:
  - `@go-go-golems/os-repl`
  - `@go-go-golems/os-widgets`
  - `@go-go-golems/os-shell`
  - `@go-go-golems/os-chat`
  - `@go-go-golems/os-confirm`
  - `@go-go-golems/os-scripting`
  - `@go-go-golems/os-ui-cards`
  - `@go-go-golems/os-kanban`
- Used these values for every package:

```text
Provider: GitHub Actions
Organization or user: go-go-golems
Repository: go-go-os-frontend
Workflow filename: publish-npm.yml
Environment name: npm-production
```

- Verified all nine packages show the expected trusted publisher state:

```text
go-go-golems/go-go-os-frontend
publish-npm.yml
npm-production
```

### Why
- npm Trusted Publishing requires package-side trust configuration before `npm publish --provenance` can authenticate via GitHub Actions OIDC.
- The workflow filename and environment name are part of the trusted identity, so configuring them now fixes the repository-side workflow contract.
- This removes the need for long-lived npm automation tokens for these packages once the GitHub Actions workflow exists.

### What worked
- `@go-go-golems/os-core` was already configured when I inspected its settings page.
- Each remaining package accepted the Trusted Publisher connection after the user completed the security-key prompt.
- Final verification across all packages returned `trustedPublisher: true` for every package.

### What didn't work
- npm required a security-key 2FA challenge for each package settings change. I could fill and submit the forms, but the user had to complete each 2FA prompt manually.
- There was no bulk npmjs UI operation for applying the same Trusted Publisher configuration to multiple packages, so the setup proceeded package by package.

### What I learned
- npm's Trusted Publisher settings page exposes the configured identity as plain visible text, which makes automated verification possible after setup.
- The package-side setup is strict but simple: repository, workflow filename, and environment must match the future GitHub Actions job exactly.

### What was tricky to build
- The browser flow redirects to a separate `npm | Security Key` page after each submitted package. The automation had to pause at each 2FA challenge and resume only after the user confirmed completion.
- Verification needed to navigate back to each package's `/access` page and inspect the rendered settings text.

### What warrants a second pair of eyes
- Confirm in GitHub that the `npm-production` environment exists and has the desired required reviewers/branch restrictions before real publication.
- Confirm the eventual workflow file is named exactly `.github/workflows/publish-npm.yml`; npmjs will not trust a differently named workflow.

### What should be done in the future
- Implement `.github/workflows/publish-npm.yml` with `id-token: write`, `environment: npm-production`, package validation, pack smoke, and `npm publish --provenance`.
- Run a dry-run dispatch first, then publish one low-risk patch release to prove end-to-end OIDC publication.

### Code review instructions
- Review the design doc's Trusted Publisher package-state table.
- When reviewing the future workflow, ensure the job identity matches npmjs exactly:

```yaml
permissions:
  contents: read
  id-token: write

environment: npm-production
```

- Publish command should include:

```bash
npm publish <dist-dir> --access public --provenance --registry=https://registry.npmjs.org/
```

### Technical details
- Final verified package list:

```text
@go-go-golems/os-core
@go-go-golems/os-repl
@go-go-golems/os-widgets
@go-go-golems/os-shell
@go-go-golems/os-chat
@go-go-golems/os-confirm
@go-go-golems/os-scripting
@go-go-golems/os-ui-cards
@go-go-golems/os-kanban
```

- Final verification checked that each package settings page included all of:

```text
go-go-golems/go-go-os-frontend
publish-npm.yml
npm-production
```

## Step 3: Added the GitHub Actions Trusted Publishing workflow

I implemented the repository-side Trusted Publishing pipeline. The new workflow is named exactly `publish-npm.yml`, matching the npmjs Trusted Publisher configuration that was applied to every package. It runs through `workflow_dispatch`, uses the protected `npm-production` environment, requests GitHub OIDC with `id-token: write`, validates selected packages, builds dist artifacts, runs pack smoke checks, and then publishes through a dedicated npmjs helper.

This step turns the package-side npmjs trust configuration into an executable release path. The workflow defaults to dry-run mode and has an additional confirmation guard for real `latest` publishes.

### Prompt Context

**User prompt (verbatim):** "then work on the next task"

**Assistant interpretation:** Continue from the new `npm-trusted-publishing-cicd` ticket task list and implement the next unchecked items: the Trusted Publishing workflow and package-set publish helper.

**Inferred user intent:** Move from npmjs package-side setup to repository-side CI/CD implementation.

**Commit (code):** e5e5fa2 — "Add npm trusted publishing workflow"

### What I did
- Added `.github/workflows/publish-npm.yml`.
- Added `scripts/packages/publish-npm-package-set.mjs`.
- Extended `scripts/packages/package-sets.mjs` with release-oriented package-set names:
  - `first-wave`
  - `shell-stack`
  - `vm-stack`
  - `all`
- Kept existing package-set names for compatibility:
  - `os-core`
  - `os-shell-stack`
  - `os-inventory-stack`
- Marked the workflow/helper tasks complete in `tasks.md`.

### Why
- npmjs now trusts the exact workflow identity, but no matching workflow existed yet.
- Publishing logic should live in a script rather than being entirely embedded in GitHub Actions shell steps.
- The workflow needs to be safe by default because npm versions are immutable.

### What worked
- `node --check scripts/packages/publish-npm-package-set.mjs` passed.
- Built a publish artifact for `@go-go-golems/os-core` with:

```bash
pnpm --filter @go-go-golems/os-core run build:dist
```

- Tested the helper in skip-existing dry-run mode:

```bash
node scripts/packages/publish-npm-package-set.mjs --package packages/os-core --tag latest --dry-run --skip-existing
```

- The helper detected that `@go-go-golems/os-core@0.1.1` already exists on npmjs and skipped it.

### What didn't work
- N/A for this implementation step.

### What I learned
- The existing `build-dist.mjs` already rewrites `workspace:` dependencies to each dependency package's actual version, so the npmjs helper should publish the dist manifest as built rather than rewriting internal dependency versions to the current package's version.
- The existing GitHub Packages publishing helper has canary-specific version rewriting behavior and should not be reused directly for npmjs stable releases.

### What was tricky to build
- `workflow_dispatch` needs a safe single-package path because the first trusted-publishing test should not publish an entire package set.
- A real `latest` publish now requires both `dry_run=false` and `confirm_latest_publish=CONFIRM_LATEST`, plus the GitHub environment approval.
- The helper includes a second guard: real `latest` publishing requires `CONFIRM_LATEST_PUBLISH=true` in the environment.

### What warrants a second pair of eyes
- Review the GitHub Actions expression used to set `CONFIRM_LATEST_PUBLISH` in the publish step.
- Confirm whether `vm-stack` should include `os-widgets` when publishing a new `os-kanban` version that depends on a newer `os-widgets` version.
- Confirm GitHub Environment `npm-production` exists with required reviewers before the first real run.

### What should be done in the future
- Run the workflow in dry-run mode for a single low-risk package.
- Bump a package version and perform the first real Trusted Publishing release.
- Add a release runbook after the first successful publish.

### Code review instructions
- Start with `.github/workflows/publish-npm.yml` and verify:
  - workflow filename matches npmjs settings;
  - `environment: npm-production` is present;
  - `permissions.id-token: write` is present;
  - dry-run defaults to true;
  - real `latest` publishes require confirmation.
- Review `scripts/packages/publish-npm-package-set.mjs` for version-exists checks and publish flags.
- Validate locally with:

```bash
node --check scripts/packages/publish-npm-package-set.mjs
pnpm --filter @go-go-golems/os-core run build:dist
node scripts/packages/publish-npm-package-set.mjs --package packages/os-core --tag latest --dry-run --skip-existing
```

### Technical details
- Real publishes use npmjs registry and provenance:

```bash
npm publish packages/<pkg>/dist \
  --access public \
  --tag <tag> \
  --registry=https://registry.npmjs.org/ \
  --provenance
```

- Dry runs intentionally do not add `--provenance`; the real OIDC path is exercised by an actual publish after package version bump and environment approval.

## Step 4: Ran the first single-package dry-run workflow

I moved the new Trusted Publishing workflow onto `main` so GitHub Actions would expose it through `workflow_dispatch`, then ran the first single-package dry-run for `@go-go-golems/os-core`. The first two attempts found workflow environment/setup issues; after fixing those, the third run completed successfully and exercised the validation path through package build, pack smoke, and npmjs existing-version detection.

This proves the manual workflow can be dispatched and can validate a package without publishing. It does not yet prove the final OIDC `npm publish --provenance` path because this run skipped an already-published version in dry-run mode.

### Prompt Context

**User prompt (verbatim):** "do it"

**Assistant interpretation:** Make the workflow available on the default branch and run the next ticket task: a single-package dry-run workflow dispatch.

**Inferred user intent:** Validate the new Trusted Publishing CI/CD pipeline from GitHub Actions rather than only local scripts.

**Commit (code):** c07df2b — "Fix npm publish workflow install setup"

**Commit (code):** 738c4c3 — "Use Node 24 for npm trusted publishing"

### What I did
- Tried to dispatch `publish-npm.yml` from the task branch; GitHub returned 404 because the workflow was not on the default branch yet.
- Merged `origin/main` into `task/npm-packages-go-go-os`.
- Pushed the branch HEAD to `main`, making `publish-npm.yml` visible to GitHub Actions.
- Dispatched a single-package dry-run:

```bash
gh workflow run publish-npm.yml \
  --repo go-go-golems/go-go-os-frontend \
  --ref main \
  -f package_set=single \
  -f package_name=@go-go-golems/os-core \
  -f npm_tag=latest \
  -f dry_run=true \
  -f skip_existing=true \
  -f confirm_latest_publish=''
```

- Fixed two workflow setup failures and reran until the workflow passed.
- Marked the single-package dry-run task complete.

### Why
- GitHub only listed the new manual workflow after the workflow file existed on `main`.
- Running the workflow in GitHub Actions is necessary to validate environment setup, tool versions, package resolution, and CI shell behavior.

### What worked
- After the fixes, run `25705092100` passed.
- The successful run used:

```text
node v24.14.1
npm 11.11.0
pnpm 10.33.4
```

- `check:vm-sources` passed:

```text
VM source modules are up to date.
```

- Pack smoke passed:

```text
packages/os-core: packed go-go-golems-os-core-0.1.1.tgz (190 entries, 80010 bytes)
```

- The publish helper correctly skipped the existing version:

```text
==> @go-go-golems/os-core@0.1.1 (packages/os-core/dist)
@go-go-golems/os-core@0.1.1 already exists on npmjs; skipping.

Publish summary:
- @go-go-golems/os-core@0.1.1: skipped-existing
```

### What didn't work
- Dispatch from the task branch failed because the workflow was not known to GitHub Actions yet:

```text
HTTP 404: Not Found (https://api.github.com/repos/go-go-golems/go-go-os-frontend/actions/workflows/publish-npm.yml)
```

- First run on `main` failed in `Setup Node` because `actions/setup-node` cache mode expected a committed `pnpm-lock.yaml`:

```text
Dependencies lock file is not found in /home/runner/work/go-go-os-frontend/go-go-os-frontend. Supported file patterns: pnpm-lock.yaml
```

- I removed `cache: pnpm` and changed install from `pnpm install --frozen-lockfile` to `pnpm install`, matching the existing repository CI style.

- Second run failed while trying to upgrade npm under Node 22.22.2:

```text
npm error code MODULE_NOT_FOUND
npm error Cannot find module 'promise-retry'
```

- I switched the publish workflow to Node 24 and removed the npm self-upgrade step. Node 24 provided npm 11.11.0, which is suitable for trusted publishing.

### What I learned
- This repository currently tracks `package-lock.json` but not `pnpm-lock.yaml`; workflows using pnpm should not enable setup-node's pnpm cache or frozen-lockfile mode until the pnpm lockfile is intentionally committed.
- Node 24 is a better default for this publish workflow because it provides a recent npm without mutating npm during the run.
- The Node 20 actions deprecation warning still appears for current GitHub actions, but it is non-failing and unrelated to the Node runtime selected for project commands.

### What was tricky to build
- There are two different Node versions in play: the JavaScript runtime used internally by GitHub Actions, and the Node runtime installed for repository commands. Setting `node-version: '24'` fixes the latter but does not remove the former deprecation warning from action implementations.
- A dry-run against an already-published version validates setup and skip behavior, but it intentionally does not exercise npm's final OIDC publish acceptance path.

### What warrants a second pair of eyes
- Confirm whether the repository should start committing `pnpm-lock.yaml`. If yes, restore `cache: pnpm` and `pnpm install --frozen-lockfile`.
- Confirm whether Node 24 is acceptable for all package build scripts before the first real publish.

### What should be done in the future
- Bump a low-risk package version and perform the first real trusted publish.
- After the first real publish, document the exact release runbook and verification commands.

### Code review instructions
- Review commits `c07df2b` and `738c4c3` for the CI setup fixes.
- Review GitHub Actions run `25705092100` for the successful dry-run.
- Validate locally with:

```bash
node --check scripts/packages/publish-npm-package-set.mjs
pnpm --filter @go-go-golems/os-core run build:dist
node scripts/packages/publish-npm-package-set.mjs --package packages/os-core --tag latest --dry-run --skip-existing
```

### Technical details
- Successful workflow run:

```text
https://github.com/go-go-golems/go-go-os-frontend/actions/runs/25705092100
```

- Failed setup runs retained for evidence:
  - `25705047151` — setup-node pnpm cache failed due to missing tracked pnpm lockfile.
  - `25705070699` — npm self-upgrade failed under Node 22.22.2.

## Step 5: Committed the pnpm lockfile and published the first trusted package release

I committed `pnpm-lock.yaml` so the CI workflows can use deterministic pnpm installs with setup-node caching and `--frozen-lockfile`. After that, I completed the first real npmjs Trusted Publishing release by bumping `@go-go-golems/os-chat` to `0.1.1`, running local validation, running a workflow dry-run, and then running the real `publish-npm` workflow with provenance enabled.

This step proves the full OIDC path, not only dry-run behavior. npmjs accepted the publish from GitHub Actions as a trusted publisher, recorded the publisher as GitHub Actions, and published a signed provenance statement.

### Prompt Context

**User prompt (verbatim):** "can we commit the lockfile?"

**Assistant interpretation:** Commit `pnpm-lock.yaml` and adjust CI to take advantage of a tracked lockfile, then continue the trusted-publishing release path.

**Inferred user intent:** Make CI installs reproducible and remove the earlier workflow compromise that used non-frozen pnpm installs because the lockfile was ignored.

**Commit (code):** fe991a6 — "Track pnpm lockfile for CI installs"

**Commit (code):** 0fa1a3e — "Bump os-chat for trusted publish"

### What I did
- Removed `pnpm-lock.yaml` from `.gitignore`.
- Committed `pnpm-lock.yaml`.
- Restored deterministic CI install behavior:
  - `pnpm install --frozen-lockfile`
  - `cache: pnpm` in Node setup.
- Applied this to:
  - `.github/workflows/publish-npm.yml`
  - `.github/workflows/launcher-ci.yml`
  - `.github/workflows/publish-github-package-canary.yml`
- Validated locally:

```bash
pnpm install --lockfile-only
pnpm install --frozen-lockfile
```

- Pushed the lockfile/workflow changes to `main` and reran the single-package dry-run workflow.
- Bumped `packages/os-chat/package.json` from `0.1.0` to `0.1.1`.
- Locally validated `os-chat`:

```bash
pnpm --filter @go-go-golems/os-chat run typecheck
pnpm --filter @go-go-golems/os-chat run test
pnpm --filter @go-go-golems/os-chat run build:dist
node scripts/packages/pack-smoke.mjs packages/os-chat
node scripts/packages/publish-npm-package-set.mjs --package packages/os-chat --tag latest --dry-run
```

- Ran the workflow dry-run for `@go-go-golems/os-chat@0.1.1`.
- Ran the real workflow publish with:

```text
package_set=single
package_name=@go-go-golems/os-chat
npm_tag=latest
dry_run=false
skip_existing=false
confirm_latest_publish=CONFIRM_LATEST
```

### Why
- A committed lockfile allows the release workflow to use strict dependency resolution and caching.
- `os-chat@0.1.1` was a low-risk first trusted release because its pending change was package metadata for theme side-effect preservation.
- A real publish was necessary to prove the OIDC Trusted Publishing path and npm provenance, which dry-run cannot fully prove.

### What worked
- Lockfile-backed dry-run workflow `25705216761` passed.
- `os-chat` local validation passed:
  - typecheck passed;
  - 22 test files passed;
  - 110 tests passed;
  - pack smoke produced `go-go-golems-os-chat-0.1.1.tgz`.
- `os-chat` workflow dry-run `25705249264` passed.
- Real publish workflow `25705272997` passed.
- npmjs registry now serves `@go-go-golems/os-chat@0.1.1`.
- The registry metadata confirms Trusted Publishing:

```json
{
  "name": "GitHub Actions",
  "email": "npm-oidc-no-reply@github.com",
  "trustedPublisher": {
    "id": "github"
  }
}
```

- The workflow logs confirmed provenance:

```text
npm notice publish Signed provenance statement with source and build information from GitHub Actions
npm notice publish Provenance statement published to transparency log: https://search.sigstore.dev/?logIndex=1513355990
+ @go-go-golems/os-chat@0.1.1
```

### What didn't work
- Local `npm view` continued to use a scope registry override pointing `@go-go-golems` at GitHub Packages, causing:

```text
npm error 403 403 Forbidden - GET https://npm.pkg.github.com/@go-go-golems%2fos-chat
```

- I verified the published package directly through the npm registry API instead:

```text
https://registry.npmjs.org/@go-go-golems%2fos-chat/0.1.1
```

### What I learned
- Tracking `pnpm-lock.yaml` is the right choice for this repository now that CI/CD package publishing depends on repeatable installs.
- npm provenance was successfully generated by the Trusted Publishing workflow with Node 24 and npm 11.11.0.
- Local npm registry configuration can still confuse manual verification even after the CI path is clean; direct registry API checks are useful evidence.

### What was tricky to build
- The repository had an ignored but locally present `pnpm-lock.yaml`; committing it required removing the ignore rule and validating that frozen installs succeed.
- The first real publish needed both workflow-level confirmation and script-level confirmation for `latest`.
- Local npm config overrides made `npm view --registry=https://registry.npmjs.org/` insufficient, because scoped registry config still sent the request to GitHub Packages.

### What warrants a second pair of eyes
- Review the committed lockfile because it is large and becomes part of release determinism.
- Confirm whether all CI workflows should move from Node 22 to Node 24 to reduce the GitHub Node 20 action deprecation warnings and align publish/build runtimes.
- Verify the npm UI shows provenance/trusted publisher metadata for `@go-go-golems/os-chat@0.1.1`.

### What should be done in the future
- Add a release runbook now that the first real Trusted Publishing release succeeded.
- Consider publishing `os-core@0.1.2` for the theme side-effect metadata fix.
- Consider updating consumer examples if they should explicitly depend on `os-chat@0.1.1`.

### Code review instructions
- Review `fe991a6` for lockfile and workflow install changes.
- Review `0fa1a3e` for the `os-chat` version bump.
- Review workflow runs:
  - `25705216761` — lockfile-backed `os-core` dry-run;
  - `25705249264` — `os-chat@0.1.1` dry-run;
  - `25705272997` — real `os-chat@0.1.1` trusted publish.

### Technical details
- Published package:

```text
@go-go-golems/os-chat@0.1.1
```

- Tarball:

```text
https://registry.npmjs.org/@go-go-golems/os-chat/-/os-chat-0.1.1.tgz
```

- Provenance transparency log:

```text
https://search.sigstore.dev/?logIndex=1513355990
```

## Step 6: Cleaned npm registry config, published os-core, and wrote the release runbook

I applied the follow-up decisions from the remaining-fixes review. I cleaned the local npm scope registry so `@go-go-golems` resolves to npmjs instead of GitHub Packages, fixed the `vm-stack` package set to include `os-widgets`, published the pending `os-core@0.1.2` metadata patch through Trusted Publishing, confirmed normal CI is passing on `main`, and wrote the release runbook.

This leaves the npmjs Trusted Publishing path in a usable operator state: package-side trust is configured, the workflow is on `main`, lockfile-backed installs are enabled, two real trusted publishes have succeeded, and the repeatable release process is documented.

### Prompt Context

**User prompt (verbatim):** "1. cleanup \n2. no need to do anything\n3. ok \n4. ok\n5. ok\n6. i don't know what you mean\n7. yes\n8. ok\n9. I don't understand\n10. push to main for now"

**Assistant interpretation:** Apply the concrete follow-ups: clean local npm config, write the runbook, review/fix package sets, publish the remaining low-risk metadata patch, monitor CI, and continue pushing directly to main. Clarify confusing items in the response rather than treating them as blockers.

**Inferred user intent:** Finish turning the Trusted Publishing setup into a clean, documented, working release system with the immediate package fixes published.

**Commit (code):** 8d47026 — "Bump os-core and include widgets in VM stack"

### What I did
- Changed user npm config for the `@go-go-golems` scope to npmjs:

```bash
npm config set @go-go-golems:registry https://registry.npmjs.org/ --location=user
```

- Verified local npm lookup now works:

```bash
npm view @go-go-golems/os-chat@0.1.1 version --registry=https://registry.npmjs.org/
# 0.1.1
```

- Fixed `vm-stack` in `scripts/packages/package-sets.mjs` to include `packages/os-widgets` before `packages/os-kanban`.
- Bumped `@go-go-golems/os-core` from `0.1.1` to `0.1.2` for the theme side-effect metadata patch.
- Locally validated `os-core`:

```bash
pnpm install --lockfile-only
pnpm --filter @go-go-golems/os-core run typecheck
pnpm --filter @go-go-golems/os-core run test
pnpm --filter @go-go-golems/os-core run build:dist
node scripts/packages/pack-smoke.mjs packages/os-core
node scripts/packages/publish-npm-package-set.mjs --package packages/os-core --tag latest --dry-run
```

- Ran a workflow dry-run for `os-core@0.1.2`: run `25705488855`.
- Ran the real Trusted Publishing workflow for `os-core@0.1.2`: run `25705516239`.
- Verified registry metadata for `os-core@0.1.2` and `os-chat@0.1.1` through the npm registry API.
- Confirmed normal `go-go-os-platform-ci` runs on `main` are passing after the lockfile commit.
- Added `playbooks/01-npm-trusted-publishing-release-runbook.md`.
- Marked the release runbook task complete.

### Why
- Local npm verification was confusing because user-level config pointed the scope at GitHub Packages.
- `vm-stack` should include `os-widgets` because `os-kanban` depends on it.
- `os-core@0.1.2` publishes the remaining theme-side-effect metadata fix.
- A release runbook is needed now that the pipeline has been proven with real publishes.

### What worked
- Local npm config now reports:

```text
@go-go-golems:registry=https://registry.npmjs.org/
```

- `os-core` local validation passed:
  - Storybook taxonomy check passed for 72 story files;
  - 20 test files passed;
  - 193 tests passed;
  - pack smoke produced `go-go-golems-os-core-0.1.2.tgz`.
- `os-core@0.1.2` was published through GitHub Actions Trusted Publishing.
- Registry metadata confirms:

```text
@go-go-golems/os-core 0.1.2 GitHub Actions github
@go-go-golems/os-chat 0.1.1 GitHub Actions github
```

- The `os-core` workflow log confirms provenance:

```text
npm notice publish Signed provenance statement with source and build information from GitHub Actions
npm notice publish Provenance statement published to transparency log: https://search.sigstore.dev/?logIndex=1513414083
+ @go-go-golems/os-core@0.1.2
```

- Normal main CI is passing after the lockfile commit.

### What didn't work
- N/A in this step. The remaining GitHub Node 20 action warning is known and non-blocking per the user decision.

### What I learned
- After changing the user-level scope registry, normal `npm view ... --registry=https://registry.npmjs.org/` works again locally.
- The package-set correction was important before any future `vm-stack` publish because `os-kanban` depends on `os-widgets`.

### What was tricky to build
- `os-core` is a large package, so the local dry-run output is long. The key review signals are the package name/version, tarball file count, and final dry-run/publish line.
- The release workflow has both dry-run and real-publish guards; real latest publishes require `confirm_latest_publish=CONFIRM_LATEST`.

### What warrants a second pair of eyes
- Review `vm-stack` ordering and confirm it should publish `os-widgets` before `os-kanban` for all coordinated VM/Kanban releases.
- Review the release runbook for operator clarity before relying on it for the next multi-package release.

### What should be done in the future
- If the public examples app should consume `os-core@0.1.2`, update its dependency and redeploy.
- Consider whether to add a tiny script for registry API provenance verification.

### Code review instructions
- Review `scripts/packages/package-sets.mjs` for the `vm-stack` change.
- Review `packages/os-core/package.json` for the `0.1.2` bump.
- Review `playbooks/01-npm-trusted-publishing-release-runbook.md` as the operator entrypoint.
- Validate published packages with:

```bash
npm view @go-go-golems/os-core@0.1.2 version --registry=https://registry.npmjs.org/
npm view @go-go-golems/os-chat@0.1.1 version --registry=https://registry.npmjs.org/
```

### Technical details
- Published packages with trusted provenance:

```text
@go-go-golems/os-chat@0.1.1
@go-go-golems/os-core@0.1.2
```

- `os-core@0.1.2` provenance transparency log:

```text
https://search.sigstore.dev/?logIndex=1513414083
```

## Step 7: Published the full package stack with aligned os-core dependencies

I continued from the examples-app dependency conflict and published coordinated patch versions for the packages that still depended on `@go-go-golems/os-core@0.1.1`. Updating only the root examples app to `os-core@0.1.2` failed because published dependent packages still pinned or peered against `0.1.1`. The correct fix was to publish a consistent package stack that depends on the newly published `os-core@0.1.2` and `os-chat@0.1.1`.

The full package-set workflow completed successfully. Existing versions were skipped, and the new coordinated package versions were published with GitHub Actions Trusted Publishing and provenance.

### Prompt Context

**User prompt (verbatim):** "continue"

**Assistant interpretation:** Continue the next practical release hardening step: make the newly published `os-core@0.1.2` usable by consumers without peer/dependency conflicts by publishing dependent packages with aligned dependency metadata.

**Inferred user intent:** Finish the public package update chain rather than leaving the examples app unable to install the newer `os-core` cleanly.

**Commit (code):** b61b634 — "Bump package stack for os-core patch"

### What I did
- Attempted to update the examples app to `@go-go-golems/os-core@^0.1.2`.
- npm failed because `@go-go-golems/os-widgets@0.1.2` peers `@go-go-golems/os-core@0.1.1` and several VM packages depended on `os-core@0.1.1`.
- Bumped coordinated package versions:
  - `@go-go-golems/os-confirm@0.1.1`
  - `@go-go-golems/os-shell@0.1.1`
  - `@go-go-golems/os-scripting@0.1.3`
  - `@go-go-golems/os-ui-cards@0.1.3`
  - `@go-go-golems/os-widgets@0.1.3`
  - `@go-go-golems/os-kanban@0.1.4`
- Verified local dist manifests rewrite workspace dependencies to the aligned public versions:
  - `os-confirm` and `os-shell` depend on `os-core@0.1.2`;
  - `os-scripting` depends on `os-core@0.1.2`, `os-chat@0.1.1`, `os-repl@0.1.5`;
  - `os-ui-cards` depends on `os-core@0.1.2` and `os-scripting@0.1.3`;
  - `os-widgets` peers `os-core@0.1.2` and `os-shell@0.1.1`;
  - `os-kanban` depends on `os-core@0.1.2`, `os-scripting@0.1.3`, `os-widgets@0.1.3`, and `os-ui-cards@0.1.3`.
- Ran local validation:

```bash
pnpm install --lockfile-only
pnpm run check:vm-sources
pnpm run build:publish-v1
node scripts/packages/pack-smoke.mjs packages/os-confirm packages/os-shell packages/os-scripting packages/os-ui-cards packages/os-widgets packages/os-kanban
```

- Committed and pushed the stack bump to `main`.
- Ran full package-set dry-run workflow `25705955562`.
- Ran real full package-set publish workflow `25706017029` with `skip_existing=true` and `confirm_latest_publish=CONFIRM_LATEST`.
- Verified registry metadata for all target versions.

### Why
- Consumer apps should not need `--legacy-peer-deps` to install the newest `os-core` with the rest of the package family.
- npm package versions are immutable, so downstream packages needed new patch versions with updated dependency metadata.
- Running the full package-set workflow proved package-set release behavior, not just single-package release behavior.

### What worked
- Full package-set dry-run `25705955562` succeeded.
- Full package-set real publish `25706017029` succeeded.
- The workflow skipped already-published versions:
  - `@go-go-golems/os-core@0.1.2`
  - `@go-go-golems/os-repl@0.1.5`
  - `@go-go-golems/os-chat@0.1.1`
- The workflow published:
  - `@go-go-golems/os-scripting@0.1.3`
  - `@go-go-golems/os-ui-cards@0.1.3`
  - `@go-go-golems/os-confirm@0.1.1`
  - `@go-go-golems/os-shell@0.1.1`
  - `@go-go-golems/os-widgets@0.1.3`
  - `@go-go-golems/os-kanban@0.1.4`
- Registry verification showed trusted publisher metadata for all new package versions.

### What didn't work
- Updating the examples app directly to `@go-go-golems/os-core@^0.1.2` failed before the dependent package stack was published:

```text
npm error ERESOLVE unable to resolve dependency tree
npm error Found: @go-go-golems/os-core@0.1.2
npm error Could not resolve dependency:
npm error peer @go-go-golems/os-core@"0.1.1" from @go-go-golems/os-widgets@0.1.2
```

### What I learned
- Patch releases for foundational packages such as `os-core` often require coordinated downstream package patch releases, even when the source change is metadata-only.
- The full package-set workflow is useful because it can skip existing versions and publish only the missing coordinated patch versions.

### What was tricky to build
- `os-repl@0.1.5` remains an existing package originally published by `wesen3000`, not GitHub Actions, because it was skipped as already existing. That is expected; a future `os-repl@0.1.6` would prove trusted publishing for `os-repl` itself.
- The package stack had to preserve dependency order so packages that depend on newly bumped packages are built and published against the correct versions.

### What warrants a second pair of eyes
- Confirm whether exact internal dependency versions are desired long-term, or whether some internal dependencies should use caret ranges in published dist manifests.
- Confirm whether `os-repl` should receive a no-op or docs patch release later to prove Trusted Publishing for that package as well.

### What should be done in the future
- Update the public examples app dependencies to the newly aligned package stack and rerun its build/e2e validation.
- Consider a small install-smoke workflow that creates a clean consumer project and installs the full current package stack.

### Code review instructions
- Review `packages/*/package.json` version bumps in commit `b61b634`.
- Review workflow runs:
  - `25705955562` — full package-set dry-run;
  - `25706017029` — full package-set real publish.
- Verify registry versions with:

```bash
npm view @go-go-golems/os-scripting@0.1.3 version --registry=https://registry.npmjs.org/
npm view @go-go-golems/os-ui-cards@0.1.3 version --registry=https://registry.npmjs.org/
npm view @go-go-golems/os-confirm@0.1.1 version --registry=https://registry.npmjs.org/
npm view @go-go-golems/os-shell@0.1.1 version --registry=https://registry.npmjs.org/
npm view @go-go-golems/os-widgets@0.1.3 version --registry=https://registry.npmjs.org/
npm view @go-go-golems/os-kanban@0.1.4 version --registry=https://registry.npmjs.org/
```

### Technical details
- Provenance transparency log indexes from the full publish run:
  - `os-scripting@0.1.3`: `1513569688`
  - `os-ui-cards@0.1.3`: `1513570254`
  - `os-confirm@0.1.1`: `1513570738`
  - `os-shell@0.1.1`: `1513571277`
  - `os-widgets@0.1.3`: `1513571856`
  - `os-kanban@0.1.4`: `1513572491`

## Step 8: Published os-repl through Trusted Publishing for provenance completeness

I published `@go-go-golems/os-repl@0.1.6` through the npm Trusted Publishing workflow. This was a provenance-completeness release: `os-repl@0.1.5` was already the current functional package and was consumed successfully, but it had been published manually before Trusted Publishing existed. Publishing `0.1.6` proves the final remaining package's current latest version can also be released through GitHub Actions OIDC with npm provenance.

### Prompt Context

**User prompt (verbatim):** "publish and set trusted publishing for os-repl"

**Assistant interpretation:** The package-side Trusted Publisher was already configured for `os-repl`; publish a new patch version through the trusted workflow so the latest package version has trusted provenance.

**Inferred user intent:** Make every public package's current latest version show GitHub Actions Trusted Publisher/provenance metadata.

**Commit (code):** 9618139 — "Bump os-repl for trusted publish"

### What I did
- Bumped `packages/os-repl/package.json` from `0.1.5` to `0.1.6`.
- Ran local validation:

```bash
pnpm install --lockfile-only
pnpm --filter @go-go-golems/os-repl run typecheck
pnpm --filter @go-go-golems/os-repl run test
pnpm --filter @go-go-golems/os-repl run build:dist
node scripts/packages/pack-smoke.mjs packages/os-repl
node scripts/packages/publish-npm-package-set.mjs --package packages/os-repl --tag latest --dry-run
```

- Committed and pushed the version bump to `main` and `task/npm-packages-go-go-os`.
- Ran workflow dry-run `25707491751`.
- Ran real Trusted Publishing workflow `25707511065`.
- Verified registry metadata from npmjs.

### Why
- `os-repl@0.1.5` was skipped in the full package-set publish because the version already existed.
- A new patch release was needed for npmjs to record GitHub Actions as publisher and attach provenance to the latest `os-repl` package version.

### What worked
- Local `os-repl` tests passed:

```text
4 test files passed
11 tests passed
```

- Pack smoke passed:

```text
packages/os-repl: packed go-go-golems-os-repl-0.1.6.tgz (23 entries, 10439 bytes)
```

- Real workflow publish succeeded:

```text
+ @go-go-golems/os-repl@0.1.6
```

- Registry metadata now shows:

```json
{
  "name": "GitHub Actions",
  "email": "npm-oidc-no-reply@github.com",
  "trustedPublisher": {
    "id": "github"
  }
}
```

### What didn't work
- N/A

### What I learned
- The package-side Trusted Publisher setup for `os-repl` was already correct; only a new package version was needed to prove the trusted path.

### What was tricky to build
- This release is intentionally a provenance-completeness release. It does not introduce a new source behavior beyond republishing the current `os-repl` package state as `0.1.6`.

### What warrants a second pair of eyes
- Decide whether downstream packages that depend on exact `os-repl@0.1.5` should be bumped later to depend on `0.1.6`. This is not urgent because `0.1.5` remains valid and the examples app directly allows `^0.1.5`.

### What should be done in the future
- If strict dependency alignment is desired, publish future `os-widgets`, `os-scripting`, and dependent package patches that reference `os-repl@0.1.6`.
- Otherwise, leave the stack as-is; consumers can install `os-repl@0.1.6` directly.

### Code review instructions
- Review `packages/os-repl/package.json` for the version bump.
- Review workflow runs:
  - `25707491751` — dry-run;
  - `25707511065` — real trusted publish.
- Verify with:

```bash
npm view @go-go-golems/os-repl@0.1.6 version --registry=https://registry.npmjs.org/
```

### Technical details
- Published package:

```text
@go-go-golems/os-repl@0.1.6
```

- Tarball:

```text
https://registry.npmjs.org/@go-go-golems/os-repl/-/os-repl-0.1.6.tgz
```

- Provenance transparency log:

```text
https://search.sigstore.dev/?logIndex=1513956205
```
