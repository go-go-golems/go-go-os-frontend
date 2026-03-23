---
Title: MacCalendar Widget DSL Port Analysis
Ticket: CALENDAR-PORT
Status: active
Topics:
    - frontend
    - runtime
    - widget-dsl
    - hypercard
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: docs/widget-dsl-porting-playbook.md
      Note: Master porting playbook
    - Path: workspace-links/go-go-os-frontend/packages/rich-widgets/src/calendar/MacCalendar.tsx
      Note: Main calendar component with EventModal
    - Path: workspace-links/go-go-os-frontend/packages/rich-widgets/src/calendar/macCalendarState.ts
      Note: Redux slice with 10 actions and event serialization
    - Path: workspace-links/go-go-os-frontend/packages/rich-widgets/src/calendar/sampleData.ts
      Note: Initial events
    - Path: workspace-links/go-go-os-frontend/packages/rich-widgets/src/calendar/types.ts
      Note: CalendarEvent
    - Path: workspace-links/go-go-os-frontend/packages/rich-widgets/src/theme/calendar.css
      Note: Calendar theme with design tokens
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-10T11:13:02.05085832-04:00
WhatFor: ""
WhenToUse: ""
---


# MacCalendar Widget DSL Port Analysis

## Overview

<!-- Provide a brief overview of the ticket, its goals, and current status -->

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- frontend
- runtime
- widget-dsl
- hypercard

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
