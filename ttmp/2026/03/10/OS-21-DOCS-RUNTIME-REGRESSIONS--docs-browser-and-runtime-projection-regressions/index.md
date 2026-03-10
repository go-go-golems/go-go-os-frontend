---
Title: Docs browser and runtime projection regressions
Ticket: OS-21-DOCS-RUNTIME-REGRESSIONS
Status: active
Topics:
    - debugging
    - frontend
    - go-go-os
    - plugins
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Track the analysis, implementation, verification, and final bookkeeping for docs-browser and runtime projection regressions fixed in OS-21.
LastUpdated: 2026-03-10T12:45:24.780514283-04:00
WhatFor: "Track analysis, implementation, and verification for docs-browser and plugin-runtime regressions reported in review comments and CI."
WhenToUse: "Use when reviewing the root cause, patch set, test coverage, and diary for OS-21."
---

# Docs browser and runtime projection regressions

## Overview

This ticket addresses three concrete regressions plus one failing CI symptom tied to the same runtime bug:

- docs home kind chips open free-text search instead of the kind facet
- docs catalog mount refreshes do not invalidate stale cached mount data when a mount is replaced at the same path
- runtime host treats `domain: 'all'` and omitted capabilities as an empty projection allowlist
- `PluginCardSessionHost.rerender.test.tsx` times out because projected domain updates never reach VM render state under the default/all case

The work is intentionally document-first: analysis first, then task tracking, then implementation and verification.

## Key Links

- [Bug report analysis](./analysis/01-bug-report-analysis.md)
- [Diary](./reference/01-diary.md)
- [Tasks](./tasks.md)
- [Changelog](./changelog.md)

## Status

Current status: **active**

## Topics

- debugging
- frontend
- go-go-os
- plugins

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
