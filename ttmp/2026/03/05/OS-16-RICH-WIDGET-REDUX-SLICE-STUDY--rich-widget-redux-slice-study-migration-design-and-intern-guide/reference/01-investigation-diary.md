---
Title: Investigation diary
Ticket: OS-16-RICH-WIDGET-REDUX-SLICE-STUDY
Status: active
Topics:
    - frontend
    - widgets
    - storybook
    - state-management
    - architecture
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-05T20:24:43.229488207-05:00
WhatFor: ""
WhenToUse: ""
---

# Investigation diary

## Goal

Record the widget-by-widget Redux-slice study, including the code audit commands, the launcher/store architecture references that informed the recommendations, and the final documentation outputs prepared for the new migration ticket.

## Context

The user asked for a new docmgr ticket that studies every rich widget and decides whether replacing local state with a Redux slice makes sense, what the slice shape should be, and how a new intern should implement the migration. This ticket follows OS-15, which expanded Storybook coverage and added the shared Storybook helpers that make slice seeding practical.

## Quick Reference

### Ticket outputs

- Design doc:
  - `ttmp/2026/03/05/OS-16-RICH-WIDGET-REDUX-SLICE-STUDY--rich-widget-redux-slice-study-migration-design-and-intern-guide/design-doc/01-rich-widget-redux-slice-analysis-and-migration-design.md`
- Intern guide:
  - `ttmp/2026/03/05/OS-16-RICH-WIDGET-REDUX-SLICE-STUDY--rich-widget-redux-slice-study-migration-design-and-intern-guide/playbooks/01-rich-widget-redux-slice-implementation-guide-for-interns.md`

### Core architecture references

- `packages/desktop-os/src/contracts/launchableAppModule.ts:9`
- `packages/desktop-os/src/store/createLauncherStore.ts:14`
- `packages/desktop-os/src/store/createLauncherStore.ts:71`
- `packages/rich-widgets/src/launcher/modules.tsx:80`
- `packages/rich-widgets/src/launcher/richWidgetsLauncherState.ts:1`
- `packages/rich-widgets/src/storybook/seededStore.tsx:1`

### Commands used for the audit

- `docmgr ticket create-ticket --ticket OS-16-RICH-WIDGET-REDUX-SLICE-STUDY --title "Rich widget Redux slice study, migration design, and intern guide" --topics frontend,widgets,storybook,state-management,architecture`
- `docmgr doc add --ticket OS-16-RICH-WIDGET-REDUX-SLICE-STUDY --doc-type design-doc --title "Rich widget Redux slice analysis and migration design"`
- `docmgr doc add --ticket OS-16-RICH-WIDGET-REDUX-SLICE-STUDY --doc-type playbooks --title "Rich widget Redux slice implementation guide for interns"`
- `docmgr doc add --ticket OS-16-RICH-WIDGET-REDUX-SLICE-STUDY --doc-type reference --title "Investigation diary"`
- `rg -n "useState\\(|useReducer\\(|export interface .*Props" packages/rich-widgets/src/{calculator,calendar,chart-view,chat-browser,control-room,deep-research,game-finder,graph-navigator,kanban,log-viewer,logic-analyzer,mac-write,music-player,node-editor,oscilloscope,repl,steam-launcher,stream-launcher,system-modeler,youtube-retro}/*.tsx`
- `sed -n '1,240p' packages/desktop-os/src/store/createLauncherStore.ts`
- `sed -n '1,240p' packages/desktop-os/src/contracts/launchableAppModule.ts`

## Usage Examples

### Example: verify the launcher reducer contract before adding a slice

1. Read `packages/desktop-os/src/contracts/launchableAppModule.ts:24` to see the `state` field shape.
2. Read `packages/desktop-os/src/store/createLauncherStore.ts:14` and `packages/desktop-os/src/store/createLauncherStore.ts:71`.
3. Confirm that duplicate reducer keys are rejected.
4. Choose a unique key such as `app_rw_mac_calendar`.

### Example: verify a widget’s current local-state surface

1. Open the widget component, for example `packages/rich-widgets/src/chat-browser/ChatBrowser.tsx:196`.
2. List durable state, story-worthy UI state, and transient state separately.
3. Compare the result to the recommendation matrix in the design doc.
4. Use the intern playbook to map the durable state into a slice and keep the rest local.

## Related

- `ttmp/2026/03/05/OS-15-RICH-WIDGET-STORYBOOK-COVERAGE--rich-widget-storybook-coverage-redux-scenarios-and-cleanup-follow-through/design-doc/01-rich-widget-storybook-matrix-and-rollout-plan.md`
- `ttmp/2026/03/01/OS-07-ADD-RICH-WIDGETS--import-and-integrate-rich-macos-widgets-into-frontend-collection/playbooks/01-widget-porting-playbook.md`

## Step 1: Create the ticket and audit the codebase

I created `OS-16-RICH-WIDGET-REDUX-SLICE-STUDY` as a follow-on to the Storybook work. The purpose is narrower and more concrete than OS-07 or OS-08: evaluate every rich widget’s local state, decide whether Redux makes sense, and document the resulting slice shapes and migration steps for an intern.

I then audited the rich-widget components directly rather than relying on memory. I used `rg` to enumerate `useState`, `useReducer`, and props interfaces across all 20 composite widgets, and then opened the launcher/store integration files to make sure the recommendations fit the actual reducer registration contract.

### What I learned

- The launcher architecture already supports widget reducers cleanly, but it wants **unique state keys per module**, not a single duplicated reducer key.
- The current package already has the Storybook seeding infrastructure needed for slice-backed stories.
- The widgets are not uniform. Some want a slice immediately; some only want a seed prop; some should stay local.

### Why the recommendations are shaped this way

- I treated Storybook determinism, persistence value, and external observability as the primary signals for Redux.
- I explicitly did **not** recommend Redux for purely visual or animation-heavy widgets where the state has no external value.

### Review path

1. Read the design doc first for the 20-widget matrix.
2. Read the intern guide second for the step-by-step migration pattern.
3. Spot-check the code references in the matrix against the component files.

## Step 2: Upload the completed bundle to reMarkable

After the ticket docs were written and `docmgr doctor` passed, I bundled the OS-16 workspace and uploaded it to reMarkable so the research packet is available off-device.

### Command

- `remarquee upload bundle ttmp/2026/03/05/OS-16-RICH-WIDGET-REDUX-SLICE-STUDY--rich-widget-redux-slice-study-migration-design-and-intern-guide --remote-dir /ai/2026/03/05/OS-16-RICH-WIDGET-REDUX-SLICE-STUDY --name OS-16-RICH-WIDGET-REDUX-SLICE-STUDY --non-interactive`

### Result

- Uploaded:
  - `OS-16-RICH-WIDGET-REDUX-SLICE-STUDY.pdf`
- Remote location:
  - `/ai/2026/03/05/OS-16-RICH-WIDGET-REDUX-SLICE-STUDY`
