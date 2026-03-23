---
Title: Analyze reusable REPL shell architecture and HyperCard runtime attach/spawn bridge
Ticket: APP-22-HYPERCARD-REPL-RUNTIME-BRIDGE
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - widgets
    - repl
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Refresh APP-22 around the current RuntimeSession / RuntimeBundle / RuntimePackage model, a reusable multi-language REPL shell architecture, HyperCard-specific runtime integration, autocomplete/help providers, and REPL-driven window launch workflows.
LastUpdated: 2026-03-11T12:15:00-04:00
WhatFor: Use this ticket to understand how to turn the current MacRepl proof of concept into a reusable REPL platform and how to connect one concrete driver to HyperCard runtime sessions, packages, and window-launch workflows.
WhenToUse: Use when planning a reusable REPL shell, HyperCard runtime tooling, runtime attach/spawn tooling, autocomplete/help systems, or a future multi-language developer console.
---

# Analyze reusable REPL shell architecture and HyperCard runtime attach/spawn bridge

## Overview

APP-22 started as a ticket about turning `MacRepl` into a HyperCard REPL. After APP-16 and APP-23, that framing is no longer enough. The runtime has cleaner boundaries now:

- runtime core owns `RuntimeSession`, `RuntimeBundle`, `RuntimePackage`, `RuntimeSurface`, and `RuntimeSurfaceType`
- `ui` and `kanban` are concrete extracted packages
- host apps register packages explicitly

That means the REPL design should also become cleaner. The right target is not “make MacRepl talk to HyperCard directly.” The right target is:

- a reusable REPL shell that can outlive HyperCard and be reused for other languages or tool domains
- a generic REPL protocol for execution, completion, help, inspection, and effects
- one concrete HyperCard runtime driver that knows how to spawn or attach to `RuntimeSession`s
- a host effect path that can open real windows and runtime surfaces from REPL results

This ticket is therefore the architecture and investigation ticket for two connected systems:

1. a reusable multi-language REPL shell platform
2. a HyperCard runtime bridge for one concrete driver on top of that platform

## Current Scope

Current scope:

- analyze the current `MacRepl` proof of concept and its coupling points
- analyze the current post-APP-16 runtime/package model
- define a reusable REPL shell architecture
- define pluggable completion/help/introspection seams
- define a HyperCard runtime broker for spawn and attach
- define how REPL commands can open render windows using the existing desktop/windowing path
- define the implementation order that gets a useful tool quickly without prematurely locking the shell to JavaScript/HyperCard only

## Main Guide

- [Intern guide to reusable REPL shell architecture, HyperCard runtime attach/spawn, and window-launch workflows](./design/01-intern-guide-to-reusable-repl-shell-architecture-hypercard-runtime-attach-spawn-and-window-launch.md)

## Tasks

See [tasks.md](./tasks.md) for the updated implementation and analysis backlog.

## Diary

- [Investigation diary](./reference/01-investigation-diary.md)

## Changelog

See [changelog.md](./changelog.md).

## Structure

- `design/` — architecture and design documents
- `reference/` — context summaries and diaries
- `playbooks/` — future implementation playbooks
- `scripts/` — temporary code and tooling
- `various/` — working notes
- `archive/` — deprecated material
