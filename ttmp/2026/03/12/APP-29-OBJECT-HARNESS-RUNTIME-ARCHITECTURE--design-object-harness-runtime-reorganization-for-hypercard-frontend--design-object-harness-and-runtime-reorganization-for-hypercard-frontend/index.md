---
Title: Design object, harness, and runtime reorganization for HyperCard frontend
Ticket: APP-29-OBJECT-HARNESS-RUNTIME-ARCHITECTURE--design-object-harness-runtime-reorganization-for-hypercard-frontend
Status: active
Topics:
    - frontend
    - architecture
    - runtime
    - documentation
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Ticket workspace for the evidence-based architecture guide and migration plan to separate object, harness, and runtime concerns in HyperCard frontend."
LastUpdated: 2026-03-12T20:11:10.340915543-04:00
WhatFor: "Track the architecture analysis, terminology cleanup, and migration planning work for the HyperCard frontend runtime model."
WhenToUse: "Use when onboarding into the current runtime architecture, reviewing the object/harness/runtime proposal, or continuing the migration plan."
---

# Design object, harness, and runtime reorganization for HyperCard frontend

## Overview

This ticket documents a proposed architecture cleanup for the HyperCard frontend. The core observation is that the current system mixes three different questions into the same terms and the same files:

- what the thing is,
- how the thing is driven,
- where the thing executes.

The target model separates those concerns into:

- objects,
- harnesses,
- runtimes.

The main deliverable is a detailed intern-facing guide that explains the current code, identifies where the abstractions leak, and lays out an incremental migration strategy.

## Key Links

- Main guide: `design-doc/01-intern-guide-to-object-harness-runtime-session-surface-and-artifact-architecture-cleanup.md`
- Diary: `reference/01-investigation-diary.md`
- Tasks: `tasks.md`
- Changelog: `changelog.md`

## Status

Current status: **active**

## Topics

- frontend
- architecture
- runtime
- docs

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Diary and supporting context
- playbooks/ - Command sequences and validation notes
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
