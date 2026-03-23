---
Title: Simplify HyperCard VM State and Dispatch Boundary
Ticket: APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Detailed implementation and onboarding ticket for simplifying the HyperCard QuickJS runtime boundary from split host topology (`cardState`, `sessionState`, `globalState` plus scoped dispatch helpers) to one projected VM state and one generic dispatch(action) contract, with a direct cross-stack cutover and no legacy compatibility layer.
LastUpdated: 2026-03-09T17:54:34-04:00
WhatFor: Use this ticket to understand, design, implement, and review the HyperCard VM boundary cleanup that follows APP-07 platform analysis and APP-08 contract simplification work, with an implementation plan that rewrites the runtime, prompts, inventory cards, and fixtures together.
WhenToUse: Use when onboarding engineers to the generated-card runtime, when refactoring the QuickJS host boundary, when simplifying prompt and authoring contracts for runtime cards, or when planning multi-DSL and effect-host extensions.
---

# Simplify HyperCard VM State and Dispatch Boundary

## Overview

APP-11 is the runtime-platform continuation of the simplification work started by APP-07 and APP-08.

APP-07 mapped the generated-card platform end to end and concluded that the current HyperCard runtime is already a small general-purpose generated UI platform, even though much of the naming still sounds inventory-specific. APP-08 then simplified one external contract: frontend and backend now agree much more clearly on profile selection versus resolved runtime identity. APP-11 takes the same simplification mindset one layer deeper, into the QuickJS VM boundary itself.

Today the VM sees three separate read models and four write channels. That means generated code has to know too much about host topology: what counts as card state versus session state, where global domain slices live, and which writes should be treated as local state changes versus domain actions versus system commands. This ticket exists to document and then implement the replacement boundary where the VM sees one projected `state` object and emits one generic `dispatch(action)` call.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field
- [Design doc](./design-doc/01-intern-guide-to-hypercard-vm-boundary-simplification-runtime-flow-and-implementation-plan.md)
- [Implementation diary](./reference/01-implementation-diary.md)
- [Tasks](./tasks.md)
- [Changelog](./changelog.md)
- Background analysis ticket: `APP-07-HYPERCARD-VM-RUNTIME-PLATFORM`
- Related chat-contract tickets: `APP-08-PROFILE-RUNTIME-CONTRACT-ALIGNMENT`, `APP-09-BOOTSTRAPPED-CHAT-SESSIONS`

## Status

Current status: **active**

Current state:

- APP-11 ticket scaffold exists.
- A detailed intern-facing design and implementation guide is stored in this ticket.
- The guide explains the current runtime pipeline, the existing boundary, the target boundary, and the phased implementation plan.
- The implementation plan now assumes a direct cutover to the new API rather than temporary compatibility wrappers.
- Ticket hygiene has passed with `docmgr doctor`.
- The ticket bundle has been uploaded to reMarkable and verified at `/ai/2026/03/07/APP-11-HYPERCARD-VM-BOUNDARY-SIMPLIFICATION`.

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
