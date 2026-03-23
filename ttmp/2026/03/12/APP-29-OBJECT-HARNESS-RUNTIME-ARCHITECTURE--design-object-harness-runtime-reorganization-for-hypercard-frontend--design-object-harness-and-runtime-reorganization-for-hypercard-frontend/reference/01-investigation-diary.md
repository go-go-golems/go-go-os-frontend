---
Title: Investigation diary
Ticket: APP-29-OBJECT-HARNESS-RUNTIME-ARCHITECTURE--design-object-harness-runtime-reorganization-for-hypercard-frontend
Status: active
Topics:
    - frontend
    - architecture
    - runtime
    - documentation
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts
      Note: Primary evidence file for artifact-to-runtime flow.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts
      Note: Primary evidence file for current protocol vocabulary.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts
      Note: Primary evidence file for pending injection behavior.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Primary evidence file for current bootstrap semantics.
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx
      Note: Primary evidence file for mixed host responsibilities.
ExternalSources: []
Summary: Diary of the evidence-gathering and writing work used to produce the APP-29 architecture guide.
LastUpdated: 2026-03-12T20:11:18.747870282-04:00
WhatFor: Record how the APP-29 architecture analysis was assembled, including evidence files, commands, pitfalls, and review guidance.
WhenToUse: Use when continuing the ticket, validating the design guide, or retracing the investigation steps.
---


# Investigation diary

## Goal

Capture the evidence-gathering and writing steps used to produce the APP-29 architecture guide for separating object, harness, and runtime concerns.

## Context

This ticket was created from a longer design conversation about how the current HyperCard frontend architecture maps to a cleaner model centered on objects, harnesses, and runtimes. The main requirement was not just to answer conversationally, but to produce a durable, intern-level guide that can drive future refactoring work.

## Quick Reference

- Ticket id:
  - `APP-29-OBJECT-HARNESS-RUNTIME-ARCHITECTURE--design-object-harness-runtime-reorganization-for-hypercard-frontend`
- Main guide:
  - `design-doc/01-intern-guide-to-object-harness-runtime-session-surface-and-artifact-architecture-cleanup.md`
- Key evidence files:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts`

## Step 1: Build The Architecture Guide From Current Code Paths

This step translated a long conceptual conversation into a file-backed architecture guide. The main constraint was to stay honest about what the codebase does today while still proposing a clearer future model.

The working approach was evidence first: identify the files where the current system already behaves like objects, harnesses, runtimes, and live activations, then write the guide around those existing seams and the places where they are currently mixed.

### Prompt Context

**User prompt (verbatim):** "Let's use this full conversation and really hone in on fleshing out your last take on the architecture, including how to potentially reorganize our codebase in that direction. 

Create a detailed analysis / design / implementation guide that is very detailed for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file
  references.
  It should be very clear and detailed. Store in the ticket and the nupload to remarkable."

**Assistant interpretation:** Create a new architecture ticket, gather line-anchored evidence from the frontend runtime code, write a detailed intern-level guide that explains the current model and proposes a reorganization, then publish it through the ticket and reMarkable workflow.

**Inferred user intent:** Produce a durable reference that can be used to onboard engineers and drive a real architecture cleanup rather than an ad hoc rename pass.

**Commit (code):** N/A - documentation ticket, no product code changes in this step.

### What I did

- Created the APP-29 ticket workspace with index, tasks, changelog, design doc, and diary files.
- Collected line-anchored evidence from:
  - runtime worker contracts,
  - VM bootstrap,
  - main runtime surface host,
  - runtime and JS brokers,
  - artifact extraction and persistence,
  - runtime surface registry,
  - desktop windowing,
  - launcher adapters,
  - task-manager and debug tooling.
- Mapped the current code into three conceptual layers:
  - object-like definitions,
  - harness-like adapters,
  - runtime executors.
- Wrote a detailed guide with:
  - current-state walkthroughs,
  - sequence diagrams,
  - current-to-target translation tables,
  - API sketches,
  - migration phases,
  - risks, alternatives, and open questions.
- Updated ticket bookkeeping to match the actual deliverables.

### Why

- The current vocabulary is overloaded and hard to teach.
- The code already has several harness-like seams, but they are not framed explicitly.
- The user wanted a design guide that is useful for implementation, not just conceptual discussion.

### What worked

- The `spawn inventory demo-a` path gave a clean explanation of what a current live session actually is.
- The artifact flow provided a concrete example of how persisted content and runtime-local behavior are currently mixed.
- The pack/surface-type handling gave a precise example of why strict contract failures are better than hidden defaults.
- The REPL, attached-session, JS-console, task-manager, and debug paths together provided strong evidence that harnesses are already real in the codebase.

### What didn't work

- My first ticket-path lookup was too loose and matched `tasks.md` instead of `index.md`.
- Command that failed:

```bash
pwd && ticket_dir=$(rg --files /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/12 | rg 'APP-29-OBJECT-HARNESS-RUNTIME-ARCHITECTURE' | sed 's#/index.md##' | head -n1) && printf '%s\n' "$ticket_dir" && ls -la "$ticket_dir" && printf '\n--- index.md ---\n' && sed -n '1,220p' "$ticket_dir/index.md"
```

- Error observed:

```text
sed: can't read /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/12/APP-29-OBJECT-HARNESS-RUNTIME-ARCHITECTURE--design-object-harness-runtime-reorganization-for-hypercard-frontend--design-object-harness-and-runtime-reorganization-for-hypercard-frontend/tasks.md/index.md: Not a directory
```

- Fix:
  - restricted the search to `/index.md$`
  - used `dirname` on the result

### What I learned

- The codebase already wants an object/harness/runtime split. The evidence is there in the number of adapters over the same live sessions.
- `surface type` is best understood as a window harness contract rather than a runtime identity.
- `session` is overloaded enough that an internal term like `activation` would likely improve clarity during migration.

### What was tricky to build

- The hardest part was staying truthful about the current architecture while still proposing a cleaner target. It would have been easy to write a cleaner but inaccurate story.
- Another tricky point was avoiding overuse of `class`/`instance` language. The current code behaves more like capability-based objects with live execution containers than like strict inheritance-driven classes.
- Artifact handling was also tricky because the current system legitimately treats artifacts as both persisted objects and runtime injection sources. The guide had to preserve both truths without collapsing them into one concept again.

### What warrants a second pair of eyes

- Whether `activation` should be introduced publicly or remain an internal migration term.
- Whether `surface` should remain a first-class product term or become a specialized object entrypoint term.
- Whether artifact opening should create fresh activations by default or materialize into shared ones.
- How much compatibility layering is acceptable before it becomes another long-lived source of confusion.

### What should be done in the future

- Review the terminology with maintainers before code renames start.
- Split the proposed migration into smaller execution tickets.
- Prototype at least one non-window harness such as an icon harness to verify the architecture generalizes.

### Code review instructions

- Start with the design guide:
  - `design-doc/01-intern-guide-to-object-harness-runtime-session-surface-and-artifact-architecture-cleanup.md`
- Then inspect these evidence files in order:
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts`
  - `/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeSurfaceRegistry.ts`
- Validate docs with:

```bash
docmgr doctor --ticket APP-29-OBJECT-HARNESS-RUNTIME-ARCHITECTURE--design-object-harness-runtime-reorganization-for-hypercard-frontend --stale-after 30
```

### Technical details

Evidence-gathering commands used:

```bash
rg --files /home/manuel/workspaces/2026-03-02/os-openai-app-server/openai-app-server/ttmp/2026/03/12 | rg 'APP-29-OBJECT-HARNESS-RUNTIME-ARCHITECTURE'

nl -ba /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts | sed -n '1,260p'
nl -ba /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js | sed -n '1,260p'
nl -ba /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/RuntimeSurfaceSessionHost.tsx | sed -n '1,260p'
nl -ba /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/repl/runtimeBroker.ts | sed -n '1,260p'
nl -ba /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts | sed -n '1,260p'
```

## Usage Examples

- Continue the architecture work by turning the migration phases into implementation tickets.
- Re-run the evidence commands and compare the file anchors to the design guide when the code changes.
- Extend the guide if new harness families or runtime lanes are added.

## Related

- `design-doc/01-intern-guide-to-object-harness-runtime-session-surface-and-artifact-architecture-cleanup.md`
- `index.md`
- `tasks.md`
- `changelog.md`
