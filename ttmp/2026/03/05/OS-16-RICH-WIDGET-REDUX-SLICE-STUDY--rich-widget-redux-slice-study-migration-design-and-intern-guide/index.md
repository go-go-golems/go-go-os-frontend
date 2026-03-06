---
Title: Rich widget Redux slice study, migration design, and intern guide
Ticket: OS-16-RICH-WIDGET-REDUX-SLICE-STUDY
Status: active
Topics:
    - frontend
    - widgets
    - storybook
    - state-management
    - architecture
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-05T20:24:42.829421846-05:00
WhatFor: ""
WhenToUse: ""
---

# Rich widget Redux slice study, migration design, and intern guide

## Overview

This ticket studies every composite rich widget in `packages/rich-widgets/src` and documents whether replacing local state with Redux makes sense, what the slice should look like, and how to implement the migration safely.

The ticket is intentionally documentation-heavy. It is meant to hand a new engineer an explicit plan instead of a vague “move some local state into Redux” directive.

## Key Links

- Design doc:
  - `design-doc/01-rich-widget-redux-slice-analysis-and-migration-design.md`
- Intern guide:
  - `playbooks/01-rich-widget-redux-slice-implementation-guide-for-interns.md`
- Diary:
  - `reference/01-investigation-diary.md`

## Status

Current status: **active**

## Topics

- frontend
- widgets
- storybook
- state-management
- architecture

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- `design-doc/` — architecture and widget recommendation matrix
- `playbooks/` — implementation guide for interns
- `reference/` — diary and audit context
- `scripts/` — reproducible ticket-local tooling if needed later
