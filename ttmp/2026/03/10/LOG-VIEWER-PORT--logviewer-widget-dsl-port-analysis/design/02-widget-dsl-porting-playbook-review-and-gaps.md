---
Title: Widget DSL Porting Playbook Review and Gaps
Ticket: LOG-VIEWER-PORT
Status: active
Topics:
    - frontend
    - runtime
    - widget-dsl
    - hypercard
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/docs/widget-dsl-porting-playbook.md:The playbook under review
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/log-viewer/LogViewer.tsx:First non-Kanban widget used to validate playbook
    - /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx:Reference pack the playbook was written from
ExternalSources: []
Summary: Review of the Widget DSL Porting Playbook using LogViewer as a validation case, identifying gaps, ambiguities, and suggested additions.
LastUpdated: 2026-03-10T09:31:07.601619729-04:00
WhatFor: Improve the playbook for future widget ports
WhenToUse: When updating the porting playbook or starting the next non-Kanban port
---

# Widget DSL Porting Playbook: Review and Gaps

## Method

This review applies the Widget DSL Porting Playbook (`docs/widget-dsl-porting-playbook.md`) to the LogViewer widget as a concrete validation case. LogViewer is the first non-Kanban widget to go through this process, so it is the natural test of whether the playbook generalizes.

Each section of the playbook is evaluated for:
- **Clarity:** Can someone follow the instructions without asking questions?
- **Completeness:** Does it cover the situation LogViewer presents?
- **Accuracy:** Does the advice match what actually needs to happen?

## Overall Assessment

The playbook is strong. The four-layer model, the anti-patterns section, and the composition-over-config philosophy are all well-motivated and directly applicable to LogViewer. The core idea ("do not expose React to the VM") comes through clearly and repeatedly.

However, applying it to LogViewer exposed several gaps -- not errors, but places where the Kanban-centric perspective does not cover situations that other widgets will encounter.

## Gap 1: No Guidance on Where Computation Lives

### The Problem

The playbook says the VM "owns semantic state usage" and the host "owns rendering details." But it does not address the question: **who computes derived data from semantic state?**

In Kanban, this is simple -- the VM card builds its column/task structure and passes it to the DSL. The host just renders what it receives.

In LogViewer, this is a real design decision:
- Filtering 10,000 log entries in QuickJS per render is expensive.
- Sparkline bucketing, level counting, and service discovery are all derived computations.
- The VM only needs to *configure* filters, not *execute* them.

### What the Playbook Should Add

A new section between Phase 3 and Phase 4, titled something like "Decide Where Derived Data Is Computed."

Content should cover:

1. **Default rule:** If the computation is cheap and the VM needs the result for composition decisions, compute in the VM.
2. **Performance rule:** If the computation involves iterating large collections (hundreds+ items), prefer host-side computation with memoization.
3. **Boundary rule:** When the host computes derived data, the VM should still pass the *configuration* (filter parameters) through the DSL, and the host applies that configuration internally.
4. **Transparency rule:** Document which computations are host-owned in the pack docs so authors do not try to replicate them.

### Suggested Prose

> Not all derived state belongs in the VM. If a computation iterates a large data set (filtering thousands of log entries, computing aggregations over large lists), consider making the host perform that computation internally. The VM passes filter configuration through DSL props; the host applies those filters using memoized selectors. Document which computations are host-owned in the pack docs.

## Gap 2: No Guidance on Stream/Timer Mechanics

### The Problem

The playbook says "host owns DOM" and lists drag/drop, modals, and accessibility as host-only mechanics. But it does not mention **timers, intervals, streaming, or any form of host-driven data generation.**

LogViewer's streaming feature (`setInterval` that generates and appends log entries) is a significant host-only mechanic that the VM can configure (on/off, interval) but must not own.

### What the Playbook Should Add

Expand the "Host owns" list in the Architecture section to include:

```text
Host owns:
  - React
  - DOM
  - drag/drop
  - modals
  - accessibility
  - rendering details
  - validation
  - timers and intervals          <-- NEW
  - data streaming and polling    <-- NEW
  - scroll behavior               <-- NEW
```

And add a short note in Phase 3:

> If the widget has time-driven behaviors (streaming, polling, animation timers), these are host-only mechanics. The VM can set configuration (e.g., "streaming is on" or "poll interval is 5s") but the host owns the timer lifecycle, cleanup, and side effects.

## Gap 3: No Guidance on Optional Children and Layout Variation

### The Problem

The playbook promotes composition-style DSL (`widgets.kanban.page(header, filters, board, status)`) and says "it lets cards differ structurally." But it does not explain **what happens when a child is omitted** or how the host renderer should handle layout changes when optional areas are absent.

For LogViewer, omitting the `detail` node should produce a two-column layout instead of three-column. Omitting `status` should remove the bottom bar. The playbook does not address this.

### What the Playbook Should Add

A subsection in Phase 6 ("Design the DSL from semantic building blocks"):

> **Optional children and layout adaptation.** Not all children need to be present. The pack renderer should handle absent children gracefully:
>
> - If a child is absent, the host adapts its layout (e.g., two columns instead of three).
> - The validator should not require all children -- only the page root and at least one content child.
> - Document which children are optional and what the layout looks like without them.
> - Do not make the VM pass `showDetail: false` or `hideFilters: true` props -- let omission be the opt-out mechanism.

## Gap 4: No Guidance on Existing Widget Decomposition State

### The Problem

The playbook's Phase 4 ("Split host primitives") assumes you are starting from a monolithic widget and need to extract primitives. But LogViewer already has partial decomposition:

- `LogViewerFrame` has a clean `model + callbacks` interface (resembling a pack renderer contract).
- It uses existing shared primitives (`WidgetToolbar`, `WidgetStatusBar`, `Sparkline`).
- It has a standalone/connected dual-path architecture.

The playbook does not address: **what if the widget is already partially decomposed?**

### What the Playbook Should Add

A note at the start of Phase 4:

> **If the widget is already partially decomposed,** audit the existing decomposition before starting fresh. Look for:
>
> - Existing model/callback separations (these may map directly to pack renderer inputs).
> - Shared primitives already in use (these stay as-is; the new primitives compose around them).
> - Standalone/connected dual paths (the standalone path may be less relevant for pack rendering, which uses its own state management).
>
> Partial decomposition is common. The goal is not to throw away existing structure but to complete it to the four-layer shape.

## Gap 5: Redux State Slice Relationship to Pack State

### The Problem

The playbook talks about "semantic state" and says VM cards should see domain concepts. But it does not explain the relationship between:

1. The existing Redux state slice (if any).
2. The pack's semantic state projection.
3. The host renderer's internal state.

LogViewer has a well-developed Redux slice (`logViewerState.ts`) with 11 actions, serialization helpers, and a standalone fallback. How does this relate to the pack renderer?

### What the Playbook Should Add

A note in Phase 3 or Phase 8:

> **If the widget already has a Redux slice,** the pack renderer typically uses it as the storage backend. The relationship is:
>
> ```text
> VM semantic state -> pack renderer -> Redux slice -> host primitives
> ```
>
> The pack renderer dispatches Redux actions in response to VM handler invocations. The Redux selector feeds data back through the renderer into host primitives.
>
> If the existing slice's action names do not match the VM handler names, add a mapping layer in the renderer rather than renaming the slice actions. The slice is internal; the VM handler names are the public contract.
>
> If the widget has a standalone (no-Redux) path, that path may still be useful for Storybook but is typically bypassed by the pack renderer.

## Gap 6: No Guidance on Pack ID Naming Convention

### The Problem

Kanban uses `kanban.v1`. The playbook shows `my-pack.v1` as an example. But there is no stated convention for naming:

- camelCase (`logViewer.v1`) vs kebab-case (`log-viewer.v1`) vs flat (`logviewer.v1`)
- Whether the namespace should match the `widgets.*` accessor name
- Whether version should always be `v1`

### What the Playbook Should Add

> **Pack ID convention:**
>
> - Use camelCase for pack IDs: `kanban.v1`, `logViewer.v1`, `incidentTimeline.v1`.
> - The pack ID's base name should match the `widgets.*` accessor: `widgets.logViewer.*` maps to pack ID `logViewer.v1`.
> - Start with `.v1`. Increment only for breaking schema changes. Minor additions (new optional props) do not need a version bump.

## Gap 7: No Guidance on Large Data Serialization

### The Problem

Kanban has a moderate number of tasks (tens to low hundreds). LogViewer can have thousands of entries. The playbook does not address **serialization cost** when passing data between VM and host.

If the VM card naively passes `state.logs.entries` (10,000+ entries) through every render cycle, the JSON serialization overhead could be significant.

### What the Playbook Should Add

> **Large collections.** If the semantic state includes large collections (hundreds+ items), avoid passing them through DSL node props on every render. Instead:
>
> - Let the host read the collection directly from semantic state.
> - Pass only identifiers, counts, or small derived summaries through DSL props.
> - Document which data the host reads directly vs. what comes through props.
>
> This is a performance optimization. The DSL contract stays the same -- the host just has an internal fast path for bulk data.

## Gap 8: Testing Strategy Beyond Storybook

### The Problem

Phase 11 ("Validate the whole path") lists validation commands but does not explain **what to test** at each level. It lists Storybook checks, pack tests, demo card tests, and runtime smoke, but does not say what assertions to make.

### What the Playbook Should Add

A more structured testing guide:

> **What to test per layer:**
>
> 1. **Host primitives (Storybook):** Visual regression, empty/dense/edge states, callback invocation.
> 2. **Pack validator:** Rejects malformed nodes (missing required props, wrong types, unexpected children). Accepts all valid node shapes including minimal and maximal variants.
> 3. **Pack renderer:** Given a valid node tree and a mock runtime context, produces the expected component tree. Handler refs are correctly wired.
> 4. **VM demo cards:** Card source evaluates without errors. Render function returns a valid node tree. Handlers dispatch correct actions.
> 5. **Integration:** End-to-end smoke in the running system. Verify that user interactions (click, type, toggle) correctly round-trip through handler -> action -> state -> re-render.

## Gap 9: Migration Path for Existing Widget Users

### The Problem

If the LogViewer is already used somewhere (stories, launcher modules, direct imports), the playbook does not discuss how to migrate existing consumers to the new pack-based rendering path.

### What the Playbook Should Add

> **Migration path for existing consumers:**
>
> The host primitives and the direct-use widget can coexist. The port does not delete the old widget -- it adds a new consumption path (the pack). Existing direct-use consumers can migrate at their own pace.
>
> The typical progression is:
> 1. Extract primitives, keep the original component working.
> 2. Add pack renderer that uses the same primitives.
> 3. Author VM demo cards that prove the pack works.
> 4. Migrate existing consumers from direct component import to pack-rendered cards.
> 5. Deprecate direct component import when all consumers are migrated.

## Gap 10: No Guidance on Handling Pre-Existing Shared Primitives

### The Problem

The playbook assumes each widget port creates its own primitives from scratch. But LogViewer already uses shared primitives from `rich-widgets/src/primitives/`:

- `WidgetToolbar` (generic toolbar container)
- `WidgetStatusBar` (generic status bar container)
- `Sparkline` (generic sparkline chart)

These are not LogViewer-specific. The playbook does not discuss the relationship between pack-specific primitives and shared cross-pack primitives.

### What the Playbook Should Add

> **Shared vs. pack-specific primitives.** Some primitives (toolbars, status bars, charts) are generic enough to be shared across multiple packs. These should live in a shared primitives directory, not inside the pack-specific widget folder.
>
> When extracting primitives, ask: "Would another pack need this exact component?" If yes, keep it in the shared primitives layer. If no, put it in the pack-specific directory.
>
> Pack-specific primitives typically compose around shared ones. For example, `LogViewerToolbar` wraps `WidgetToolbar` with log-specific search and sparkline content.

## Summary of Recommended Playbook Additions

| # | Gap | Suggested Section |
|---|---|---|
| 1 | Computation placement (VM vs host) | New section between Phase 3 and 4 |
| 2 | Timer/streaming mechanics | Expand host-owns list + Phase 3 note |
| 3 | Optional children and layout adaptation | Subsection in Phase 6 |
| 4 | Partially decomposed starting point | Note at start of Phase 4 |
| 5 | Redux slice relationship to pack state | Note in Phase 3 or 8 |
| 6 | Pack ID naming convention | New short section or appendix |
| 7 | Large data serialization cost | Note in Phase 6 or new appendix |
| 8 | Structured testing strategy | Expand Phase 11 |
| 9 | Migration path for existing consumers | New section after Phase 11 |
| 10 | Shared vs pack-specific primitives | Note in Phase 4 |

## Overall Verdict

The playbook is solid for its intended purpose and works well for Kanban-like widgets. The gaps found are mostly about scenarios that Kanban did not encounter: large data sets, streaming, partial pre-existing decomposition, shared primitives, and optional layout regions.

None of these gaps invalidate the playbook's architecture or philosophy. They are additive -- they extend the playbook's coverage without contradicting its core principles.

The four-layer model, the anti-patterns, and the "domain concepts not host widgets" rule all hold up perfectly under LogViewer validation. The recommended additions would make the playbook robust enough to handle the next 5-10 widget ports without requiring further structural changes.
