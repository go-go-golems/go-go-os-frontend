---
Title: Analyze QuickJS runtime lifecycle ownership, surface mounting, and React host boundaries
Ticket: APP-28-RUNTIME-SESSION-LIFECYCLE-OWNERSHIP
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - runtime
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Analyze how QuickJS runtime sessions are created, mounted, recovered, and disposed today; explain why React host lifecycle currently owns too much of VM lifecycle; and lay out a service-owned runtime session manager architecture that decouples VM ownership from surface mounting."
LastUpdated: 2026-03-11T21:44:18.040196589-04:00
WhatFor: "Use this ticket when debugging disappearing runtime VMs, reasoning about RuntimeSurfaceSessionHost mount/unmount behavior, or planning a refactor that moves QuickJS runtime ownership out of React effect cleanup."
WhenToUse: "Use when you need an architecture overview of RuntimeSurfaceSessionHost, QuickJSRuntimeService, session brokers, task-manager sources, and the relationship between surface windows and runtime VM ownership."
---

# Analyze QuickJS runtime lifecycle ownership, surface mounting, and React host boundaries

## Overview

This ticket captures a focused architecture analysis of how the frontend currently manages QuickJS runtime sessions for surface windows, why that lifecycle is fragile, and how it should be reorganized.

The immediate trigger was a real crash: runtime surface windows such as `os-launcher`, `Inventory`, and `HyperCard Tools` were intermittently failing with `Runtime session not found: <sessionId>`. The logs showed that the session id was correct, but the local `QuickJSRuntimeService` instance no longer had a VM for that id. Investigation showed that `RuntimeSurfaceSessionHost` was both:

1. mounting a runtime session into a React subtree, and
2. treating React cleanup as the authority that disposes the underlying QuickJS VM.

That coupling is the core problem this ticket documents.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

Primary deliverable:
- [Design doc](./design-doc/01-intern-guide-to-quickjs-runtime-lifecycle-ownership-surface-mounting-and-react-host-boundaries.md)

Supporting deliverable:
- [Investigation diary](./reference/01-investigation-diary.md)

## Topics

- architecture
- frontend
- hypercard
- runtime

## Tasks

See [tasks.md](./tasks.md) for the current task list.

Current task focus:
- complete the first ownership refactor slices that move VM lifetime out of React cleanup
- validate the new `RuntimeSessionManager` + window lifecycle middleware path
- converge tooling and attach flows on the service-owned session source of truth
- identify the remaining follow-up slices for APP-26 / APP-22 / APP-25 integration

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
