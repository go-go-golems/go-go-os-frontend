---
Title: ""
Ticket: ""
Status: ""
Topics: []
DocType: ""
Intent: ""
Owners: []
RelatedFiles:
    - Path: .github/workflows/launcher-ci.yml
      Note: Existing CI workflow to align with npm publish validation
    - Path: .github/workflows/publish-github-package-canary.yml
      Note: Existing package publishing workflow pattern to adapt for npmjs Trusted Publishing
    - Path: .github/workflows/publish-npm.yml
      Note: Trusted Publishing workflow implementation (commit e5e5fa2)
    - Path: package.json
      Note: Root scripts for build:publish-v1 and check:vm-sources
    - Path: scripts/packages/generate-vm-source-modules.mjs
      Note: Generated VM source freshness check required before publication
    - Path: scripts/packages/pack-smoke.mjs
      Note: Package artifact smoke-check script that should run before npm publish
    - Path: scripts/packages/package-sets.mjs
      Note: Shared package-set definitions used by CI/CD (commit e5e5fa2)
    - Path: scripts/packages/publish-npm-package-set.mjs
      Note: npmjs package-set publish helper (commit e5e5fa2)
ExternalSources: []
Summary: ""
LastUpdated: 0001-01-01T00:00:00Z
WhatFor: ""
WhenToUse: ""
---



# npmjs Trusted Publishing CI/CD Design

## Executive Summary

This ticket tracks the CI/CD pipeline for publishing the public `@go-go-golems/*` frontend packages to npmjs through npm Trusted Publishing. Package-side Trusted Publisher connections have been configured on npmjs for the current public package family. The remaining repository-side work is to add a GitHub Actions workflow named `publish-npm.yml` that uses GitHub OIDC, the protected `npm-production` environment, package validation, pack smoke checks, and `npm publish --provenance`.

The target trusted identity is:

```text
Repository: go-go-golems/go-go-os-frontend
Workflow: publish-npm.yml
Environment: npm-production
```

No long-lived `NPM_TOKEN` should be required for the trusted publishing path.

## Problem Statement

The packages have been published manually and with local npm token handling so far. That proved the package surfaces, but it leaves release work dependent on local operator state and long-lived credentials. Future package releases should be repeatable, reviewable, and tied to GitHub Actions provenance.

The pipeline must protect package-boundary invariants discovered during the project:

- generated VM source modules must be fresh;
- package dist artifacts must contain JS, declarations, CSS, README, and generated VM strings;
- package theme JS entrypoints must survive production tree-shaking;
- packages must publish to `https://registry.npmjs.org/`, not GitHub Packages;
- package versions are immutable and must not be republished accidentally.

## Proposed Solution

Add a manual GitHub Actions workflow:

```text
.github/workflows/publish-npm.yml
```

The workflow should run through `workflow_dispatch`, use the `npm-production` environment, and request OIDC permission:

```yaml
permissions:
  contents: read
  id-token: write

environment: npm-production
```

The workflow publishes selected package sets in dependency order. It should default to dry-run mode and support real publishing only after environment approval.

Recommended inputs:

```text
package_set: single | first-wave | shell-stack | vm-stack | all
package_name: optional package name for single-package test release
npm_tag: latest | next | canary
 dry_run: true by default
skip_existing: true by default
```

The publish command should be:

```bash
npm publish packages/<pkg>/dist \
  --access public \
  --tag "$NPM_TAG" \
  --registry=https://registry.npmjs.org/ \
  --provenance
```

## Trusted Publisher Package State

Verified package-side npmjs Trusted Publisher configuration:

| Package | Trusted publisher |
|---|---|
| `@go-go-golems/os-core` | `go-go-golems/go-go-os-frontend`, `publish-npm.yml`, `npm-production` |
| `@go-go-golems/os-repl` | `go-go-golems/go-go-os-frontend`, `publish-npm.yml`, `npm-production` |
| `@go-go-golems/os-widgets` | `go-go-golems/go-go-os-frontend`, `publish-npm.yml`, `npm-production` |
| `@go-go-golems/os-shell` | `go-go-golems/go-go-os-frontend`, `publish-npm.yml`, `npm-production` |
| `@go-go-golems/os-chat` | `go-go-golems/go-go-os-frontend`, `publish-npm.yml`, `npm-production` |
| `@go-go-golems/os-confirm` | `go-go-golems/go-go-os-frontend`, `publish-npm.yml`, `npm-production` |
| `@go-go-golems/os-scripting` | `go-go-golems/go-go-os-frontend`, `publish-npm.yml`, `npm-production` |
| `@go-go-golems/os-ui-cards` | `go-go-golems/go-go-os-frontend`, `publish-npm.yml`, `npm-production` |
| `@go-go-golems/os-kanban` | `go-go-golems/go-go-os-frontend`, `publish-npm.yml`, `npm-production` |

## Design Decisions

### Use Trusted Publishing rather than npm tokens

Trusted Publishing removes the long-lived npm automation token from the release path. npm verifies a short-lived GitHub OIDC token and checks that it matches the package's configured trusted publisher.

### Use a manual protected release workflow first

The first production workflow should be manually triggered. Automatic publish-on-merge can come later after the package validation and versioning process is stable.

### Publish dist artifacts only

The workflow should publish `packages/<pkg>/dist`, not source package directories. Dist publishing verifies that workspace dependency rewriting, declaration output, CSS copying, generated VM source modules, and package metadata are present before publication.

### Keep dry-run as the default

The workflow should default to `dry_run: true` because npm versions are immutable and a real release should be a deliberate action.

## Alternatives Considered

### npm automation token

A token-based workflow is simpler to bootstrap but stores a long-lived credential and is more sensitive to registry configuration mistakes. It remains useful as an emergency fallback but should not be the default path.

### Fully automatic release on merge

This is too aggressive for the current package family. Package side effects, VM source generation, and consumer-app validation have all produced subtle failures; manual approval is still appropriate.

### Changesets immediately

Changesets would improve version management, but the first priority is to establish trusted publishing and artifact validation. Changesets can be layered on later.

## Implementation Plan

1. Add `.github/workflows/publish-npm.yml`.
2. Add or adapt a package-set publish helper if the workflow would otherwise become too shell-heavy.
3. Ensure the workflow runs:
   - `pnpm install --frozen-lockfile`;
   - `pnpm run check:vm-sources`;
   - selected package typechecks/tests;
   - selected package `build:dist`;
   - `scripts/packages/pack-smoke.mjs`;
   - existing-version checks with `npm view`;
   - `npm publish --provenance` in real mode.
4. Create or verify GitHub Environment `npm-production` with required reviewers.
5. Test dry-run for a single package.
6. Bump a low-risk package patch version and publish one real trusted-publishing release.
7. Expand to package sets after the first release succeeds.

## Validation Checklist

```bash
pnpm install --frozen-lockfile
pnpm run check:vm-sources
pnpm run build:publish-v1
node scripts/packages/pack-smoke.mjs packages/os-chat
```

Workflow validation:

```text
workflow_dispatch package_set=single package_name=@go-go-golems/os-chat dry_run=true
workflow_dispatch package_set=single package_name=@go-go-golems/os-chat dry_run=false
```

Post-publish validation:

```bash
npm view @go-go-golems/os-chat@<version> version --registry=https://registry.npmjs.org/
npm view @go-go-golems/os-chat@<version> dist --registry=https://registry.npmjs.org/
```
