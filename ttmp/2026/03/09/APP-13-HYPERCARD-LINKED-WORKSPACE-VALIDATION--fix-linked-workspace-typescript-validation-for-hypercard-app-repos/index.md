---
Title: Fix linked-workspace TypeScript validation for HyperCard app repos
Ticket: APP-13-HYPERCARD-LINKED-WORKSPACE-VALIDATION
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: wesen-os/workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/tsconfig.json
      Note: ARC app tsconfig currently pins rootDir to src while importing linked package source trees
    - Path: wesen-os/workspace-links/go-go-app-sqlite/apps/sqlite/tsconfig.json
      Note: Working comparison tsconfig that uses references and validates successfully
    - Path: wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: Linked runtime package file that surfaced the raw-import typing failure during ARC validation
    - Path: wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/raw-imports.d.ts
      Note: Current raw-import declaration expected to cover stack-bootstrap.vm.js?raw
    - Path: 2026/03/06/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION--simplify-hypercard-vm-state-and-dispatch-boundary/reference/01-implementation-diary.md
      Note: Diary entry that captured the ARC validation failure and spawned this follow-up ticket
ExternalSources: []
Summary: Follow-up ticket for restoring reliable targeted TypeScript validation in linked HyperCard app repos after APP-11, with focus on ARC AGI player rootDir configuration and linked package raw-import typing.
LastUpdated: 2026-03-09T19:18:23.030071091-04:00
WhatFor: Track the workspace-level TypeScript configuration issues that block app-local validation even after the HyperCard runtime API cutover is functionally complete.
WhenToUse: Use when fixing or reviewing linked-repo tsconfig setup, project references, raw-import declarations, or targeted build commands for HyperCard app repos.
---


# Fix linked-workspace TypeScript validation for HyperCard app repos

## Overview

APP-11 exposed one remaining non-runtime problem: some linked app repos cannot be validated cleanly with targeted `tsc --build` commands because their `tsconfig.json` files compile linked package sources outside the app `rootDir`, and at least one linked runtime package still depends on `*?raw` declarations that do not propagate cleanly into that app build.

This ticket is intentionally separate from APP-11. The runtime cutover is complete; this is now a tooling and workspace-composition problem. The goal is to make app-local validation trustworthy again without weakening type safety, adding compatibility shims, or hiding linked-source problems behind `skip` workflows.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

Open problem summary:

- `apps/arc-agi-player/tsconfig.json` sets `rootDir: "src"` while `paths` point at linked package source trees
- targeted ARC validation emits `TS6059` because linked sources are outside that `rootDir`
- the same build surfaced a linked-package raw-import typing failure for `stack-bootstrap.vm.js?raw`
- `apps/sqlite/tsconfig.json` is a useful local reference because it already uses package references and does not pin `rootDir`

## Topics

- architecture
- frontend
- hypercard
- wesen-os

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
