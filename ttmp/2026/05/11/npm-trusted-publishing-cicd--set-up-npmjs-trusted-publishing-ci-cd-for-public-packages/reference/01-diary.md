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
    - Path: scripts/packages/package-sets.mjs
      Note: Package-set diary target (commit e5e5fa2)
    - Path: scripts/packages/publish-npm-package-set.mjs
      Note: Publish helper diary target (commit e5e5fa2)
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
