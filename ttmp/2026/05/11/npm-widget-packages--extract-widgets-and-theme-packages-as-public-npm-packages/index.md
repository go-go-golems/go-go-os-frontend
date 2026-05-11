---
Title: Extract widgets and theme packages as public npm packages
Ticket: npm-widget-packages
Status: active
Topics:
    - frontend
    - react
    - npm
    - widgets
    - theme
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Ticket workspace for extracting go-go-os-frontend widget and theme packages into reusable public npm packages."
LastUpdated: 2026-05-11T12:45:00-04:00
WhatFor: "Coordinates the analysis, design, implementation plan, and diary for public npm publication of reusable React widget/theme packages."
WhenToUse: "Use when implementing package metadata, build, smoke-test, or release changes for go-go-os frontend packages."
---

# Extract widgets and theme packages as public npm packages

## Overview

This ticket tracks the work to make widget and theme packages from `go-go-os-frontend` reusable in standalone React projects and publishable publicly on npm.

The current deliverable is a design and implementation guide, not the implementation itself. It explains the existing package architecture, identifies current publication blockers, and gives a phased plan for making the packages public safely.

## Key Links

- [Design guide](./design-doc/01-public-npm-packages-for-reusable-widgets-and-themes.md)
- [Diary](./reference/01-diary.md)
- [Tasks](./tasks.md)
- [Changelog](./changelog.md)

## Status

Current status: **active**

Done in this investigation pass:

- Ticket created.
- Current package, build, widget, launcher, and theme architecture mapped.
- Current `build:dist` validation blocker recorded: local TypeScript compiler is missing.
- Intern-oriented design/implementation guide written.
- Diary written.

Remaining implementation work:

- Add/fix build dependencies.
- Change publication metadata for public npm.
- Isolate shell launcher dependencies from standalone widget imports.
- Add package tarball and standalone React smoke tests.
- Dry-run and then publish packages publicly.

## Topics

- frontend
- react
- npm
- widgets
- theme

## Structure

- `design-doc/` — Architecture and implementation guide.
- `reference/` — Investigation diary.
- `playbooks/` — Future command runbooks if needed.
- `scripts/` — Temporary scripts if needed.
- `sources/` — Source references if needed.
- `archive/` — Deprecated/reference-only artifacts.
