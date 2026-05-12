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
