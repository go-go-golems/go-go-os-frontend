---
Title: Design a clean JS REPL profile with spawned blank runtime sessions before attach mode
Ticket: APP-24-CLEAN-JS-REPL-PROFILE
Status: active
Topics:
    - architecture
    - frontend
    - repl
    - tooling
    - hypercard
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Detailed design ticket for adding a real blank JavaScript REPL profile with spawned QuickJS sessions, positioned deliberately before HyperCard attach mode.
LastUpdated: 2026-03-11T14:15:00-04:00
WhatFor: Use this ticket to design a real plain JavaScript REPL profile with its own spawned QuickJS sessions, separate from HyperCard bundle/surface semantics and intentionally sequenced before runtime attach mode.
WhenToUse: Use when planning a blank JS console, lower-level QuickJS session APIs, or the architecture needed to keep `@hypercard/repl` reusable beyond HyperCard runtime tooling.
---

# Design a clean JS REPL profile with spawned blank runtime sessions before attach mode

## Overview

APP-22 established that the REPL shell is reusable and that HyperCard runtime tooling can sit on top of it as one concrete driver/profile. The next architectural question is what should come before attach mode for existing runtime sessions.

This ticket answers that question: build a **clean JavaScript REPL** first.

The clean JS REPL should:

- spawn its own blank QuickJS sessions
- evaluate plain JavaScript directly
- preserve globals across submissions
- remain separate from HyperCard `RuntimeBundle` / `RuntimeSurface` semantics
- prove that the REPL platform is actually multi-profile and not just a HyperCard console in disguise

This ticket is therefore the detailed design/implementation guide for a lower-level JS session broker, a plain JS REPL driver, and a simple `wesen-os` launcher module that can host it.

## Main Guide

- [Intern guide to a clean JS REPL profile with spawned blank runtime sessions](./design/01-intern-guide-to-a-clean-js-repl-profile-with-spawned-blank-runtime-sessions.md)

## Current Scope

Current scope:

- analyze why the current HyperCard runtime broker is the wrong abstraction level for a blank JS REPL
- define a lower-level QuickJS session service and broker
- define a plain JS REPL driver/profile on top of `@hypercard/repl`
- define a small `wesen-os` launcher module for the new REPL
- sequence this work before HyperCard attach mode

Out of scope for this ticket:

- attach mode for pre-existing HyperCard runtime sessions
- full debugger or inspector UI
- general multi-language runtime abstraction across non-JS engines

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Diary

- [Investigation diary](./reference/01-investigation-diary.md)

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
