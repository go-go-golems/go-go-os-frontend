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
RelatedFiles: []
ExternalSources: []
Summary: "Chronological diary for npmjs Trusted Publishing CI/CD setup."
LastUpdated: 2026-05-11T20:08:19-04:00
WhatFor: "Track setup of npmjs Trusted Publishing and GitHub Actions release workflows."
WhenToUse: "Use when implementing or reviewing npm package CI/CD publishing."
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
