---
Title: Investigation diary
Ticket: APP-20-KANBAN-PRIMITIVE-EXPANSION
Status: active
Topics:
    - architecture
    - frontend
    - hypercard
    - wesen-os
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx
      Note: Investigated as the current single-root Kanban runtime-pack contract
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoardView.tsx
      Note: Investigated as the current monolithic board shell composition
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/types.ts
      Note: Investigated as the source of fixed taxonomy constraints
    - Path: /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/docs/kanban-pack.docs.vm.js
      Note: Investigated as the VM-facing documentation for the current narrow Kanban pack
ExternalSources: []
Summary: Investigation diary for APP-20 capturing the original Kanban primitive limitations, the direct-cutover implementation, and the later pivot from a shell-shaped DSL to a page-style compositional DSL.
LastUpdated: 2026-03-10T01:17:00-04:00
WhatFor: Record the evidence and implementation reasoning behind APP-20 so later work can extend the Kanban primitive surface coherently.
WhenToUse: Use when continuing APP-20, reviewing the page-style `kanban.v1` contract, or planning extracted Kanban widgets and stories.
---

# Investigation diary

## Goal

Capture why the original `kanban.v1` pack felt too rigid and record how APP-20 replaced it with a more composable Kanban primitive family with Storybook-backed host widget extraction.

## Step 2: Convert APP-20 Into A Direct-Cutover Implementation Ticket

The user explicitly said we do not need backwards compatibility if it makes implementation easier. That changes the shape of the work materially. Instead of layering `kanban.v2` beside `kanban.v1`, or adding wrappers so old cards still run, the cleanest route is to replace the internal Kanban pack contract in place and update the demo cards, docs, tests, and host widgets as one coordinated refactor.

### Prompt Context

**User prompt (verbatim):**

> we don't need backwards compatibility, if tha tmakes things easiesr.
>
> Add detailed tasks to the ticket, then work on them one by one, commit as you go, keep a detailed diary

**Assistant interpretation:** Turn APP-20 into an implementation ticket and execute it as a direct cutover rather than a compatibility migration.

**Inferred user intent:** Prefer a coherent internal API reset over extra adapter code.

**Commit (code):** Pending

### What I did

- Re-read the current Kanban pack, host widget, taxonomy, and VM-doc code to confirm the old surface is still narrowly scoped.
- Converted the APP-20 task list from broad future slices into concrete implementation steps.
- Made the direct-cutover strategy explicit in the ticket so the implementation does not drift toward wrappers or compatibility helpers.

### Why

- The current Kanban runtime surface is still internal and demo-driven enough that a clean replacement is cheaper than maintaining two DSLs.
- The user already approved the main tradeoff: simpler implementation over compatibility.

### What worked

- The code seams are good enough to support a direct replacement. `KanbanBoardView`, `KanbanTaskCard`, `KanbanTaskModal`, and `kanbanV1Pack.tsx` are centralized enough that the refactor can happen in controlled slices.

### What didn't work

- The old task list was too coarse for real execution. It named broad ideas but did not break them into reviewable implementation steps.

### What I learned

- The no-compatibility decision removes a lot of complexity. We can replace the runtime helper surface, validator, docs, and demo cards together instead of carrying compatibility branches.

### What should be done next

- Implement Slice 1 first: host widget extraction plus Storybook support.
- After that, cut over taxonomy and then replace the runtime DSL in one pass.

## Step 3: Extract The Kanban Host Shell And Add Storybook Coverage

I implemented the first APP-20 slice in `go-go-os-frontend` as a host-side refactor. The old `KanbanBoardView` rendered everything inline. I extracted distinct host components for the shell:

- `KanbanHeaderBar`
- `KanbanFilterBar`
- `KanbanLaneView`
- `KanbanStatusBar`

and then rewired `KanbanBoardView` to compose them instead of rendering toolbar, lane layout, and status bar inline. I also added dedicated Storybook stories for each extracted piece and updated the existing board, board-view, task-card, and task-modal stories so the new subcomponents remain reviewable outside the VM path.

### Commit

- `69e0905` in `go-go-os-frontend` — `Extract kanban host shell widgets`

### Validation

- `npm run storybook:check` in `workspace-links/go-go-os-frontend`
  - passed
- `npm run typecheck -w packages/rich-widgets`
  - still fails in this workspace because of the existing linked-package `TS6059` / `TS6307` rootDir problem, not because of this Kanban slice

### What mattered

- The extraction made the host surface real instead of theoretical. The next taxonomy/runtime-pack work landed on explicit host seams rather than on one giant `KanbanBoardView`.

## Step 4: Replace Hardcoded Kanban Enums With Descriptor-Driven Taxonomy

The second major slice was the data model cutover. I removed the hardcoded `TagId` and `Priority` unions and replaced them with descriptor-driven taxonomy:

- `issueTypes`
- `priorities`
- `labels`

The task shape is now:

```text
task = {
  id,
  col,
  title,
  type,
  labels[],
  priority,
  desc,
}
```

State now carries `taxonomy`, `filterType`, and `filterPriority`. `KanbanTaskCard` renders issue type and labels through descriptor lookups. `KanbanTaskModal` edits issue type, labels, and priority from the board taxonomy instead of from hardcoded arrays.

### Commit

- included in `0a45c2e` in `go-go-os-frontend`

### Validation

- `npx vitest run packages/rich-widgets/src/kanban/kanbanState.test.ts`
  - passed
- Storybook taxonomy scenarios were updated and revalidated via `npm run storybook:check`

### What mattered

- This is the slice that actually unlocks “custom bug types and all that.” The board can now carry its own issue vocabulary instead of inheriting one fixed enum set.

## Step 5: Replace The Runtime-Pack DSL In Place

Because the user explicitly said compatibility is not required, I did a direct cutover of `kanban.v1` instead of creating `kanban.v2`.

Old style:

```text
widgets.kanban.board({...})
```

New style:

```text
widgets.kanban.shell({
  taxonomy: widgets.kanban.taxonomy({...}),
  header: widgets.kanban.header({...}),
  filters: widgets.kanban.filters({...}),   // optional
  board: widgets.kanban.board({...}),
  status: widgets.kanban.status({...}),     // optional
})
```

I replaced:

- `packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx`
- `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
- the runtime-pack tests
- the fixture card used by runtime-service integration tests

with the new shell contract. There is no dual support branch and no legacy wrapper API.

### Commit

- `0a45c2e` in `go-go-os-frontend` — `Refactor kanban pack to structured shell DSL`

### Validation

- `npx vitest run packages/hypercard-runtime/src/runtime-packs/runtimePackRegistry.test.tsx packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts`
  - passed
- `npm run typecheck -w packages/hypercard-runtime`
  - passed

### What was tricky

- The new validator needed explicit narrowing for the nested shell node shapes so TypeScript would accept the new validation helpers cleanly.

## Step 6: Rewrite The `os-launcher` Demo Cards, Docs, And Metadata

After the shared runtime and host changes were in place, I rewrote the authored Kanban cards in `apps/os-launcher`.

What changed:

- rewrote the shared VM prelude in `00-runtimePrelude.vm.js`
- rewrote the three original cards to the new shell DSL
- added two new cards:
  - `kanbanIncidentCommand`
  - `kanbanReleaseTrain`
- rewrote `kanban-pack.docs.vm.js` to document the new helpers
- regenerated:
  - `kanban.vmmeta.json`
  - `kanbanVmmeta.generated.ts`
- updated the `Kanban VM` launcher window so all five cards appear

One subtle issue surfaced during this slice: the Go vmmeta generator no longer inferred handler names once the cards switched to `handlers: kanbanCardHandlers(board)`. I fixed the launcher metadata projection to tolerate `handlerNames: null` and default it to an empty array instead of crashing.

### Commit

- `a676c7a` in `wesen-os` — `Rewrite os-launcher kanban VM cards to new shell API`

### Validation

- `npm run vmmeta:generate` in `apps/os-launcher`
  - passed
- `npm run test -- --run src/domain/pluginBundle.test.ts` in `apps/os-launcher`
  - passed
- `npm run typecheck` in `apps/os-launcher`
  - still fails because of existing linked `@hypercard/rich-widgets` state/type issues outside APP-20; after fixing the new `hypercard-runtime` errors, the remaining failures are pre-existing unrelated ones in other rich-widget modules

## Step 7: Browser Smoke On The Live App

I used Playwright against `http://localhost:5173`.

What I verified:

- the desktop loaded successfully
- the `Kanban VM` icon opened the Kanban browser window
- the browser window listed all five cards after I updated the launcher surface:
  - Sprint Board
  - Bug Triage
  - Personal Planner
  - Incident Command
  - Release Train
- clicking `Incident Command` opened the actual VM-hosted card window
- the rendered window showed:
  - custom incident issue types
  - SEV priorities
  - custom labels
  - custom status metrics

There was one transient interruption during smoke testing where the Vite websocket dropped and the page had to recover, but after recovery the smoke test passed and exposed one real issue: the launcher window still listed only three cards. I fixed that by updating `kanbanVmModule.tsx` and then repeated the smoke successfully.

### What this proves

- The new authoring style is not just test-level or fixture-level. The `os-launcher` UI can open the new `kanban.v1` shell cards through the real runtime session host.

## Step 1: Confirm That The Current Pack Is Too Monolithic For Real Kanban Variation

The user asked for a new ticket rather than more example cards, and that was the right direction. The current examples are repetitive because the current contract is repetitive. The code audit showed that the rigidity is structural: one root runtime node, one host board view, and fixed issue taxonomy types.

That also surfaced an implementation requirement the user called out explicitly: when these new host pieces are extracted, they need Storybook coverage. That belongs in the ticket because this work is as much about making the Kanban host layer reusable and inspectable as it is about expanding the VM DSL.

### Prompt Context

**User prompt (verbatim):**

> ok, make a few more runtime cards for kanban, but I think we shold be able to :

## Step 8: Pivot The Implemented DSL From Shell Objects To Page-Style Composition

After the first APP-20 implementation landed, the user pushed on the authoring ergonomics rather than on the mechanics. That was the right correction. The earlier cutover had already extracted host seams and descriptor-driven taxonomy, but the VM surface still felt too object-heavy because it centered on a shell config object. The user wanted something closer to React-style composition so cards could read like examples rather than like structured configuration blobs.

I therefore did a second direct cutover, still without compatibility layers, from the temporary `widgets.kanban.shell({...})` shape to a compositional `widgets.kanban.page(...)` contract with child nodes such as `taxonomy`, `header`, `filters`, `highlights`, `board`, and `status`. I also used that pivot to make the example set more visibly varied: one-lane, two-lane, five-lane, and incident-oriented boards with distinct highlight strips instead of near-clones.

### Prompt Context

**User prompt (verbatim):**

> yes, pivot to new style, more varied examples.

**Assistant interpretation:** Replace the interim shell-style Kanban DSL with a more compositional page-style API and refresh the demos so they are visually and structurally distinct.

**Inferred user intent:** Make the Kanban VM examples feel like real authored examples with flexible composition, not like data-only skins over one fixed board shell.

**Commit (code):**
- `c4d3c05` in `go-go-os-frontend` — `Expand kanban rich widget shells and stories`
- `5bd2620` in `go-go-os-frontend` — `Cut kanban runtime pack over to page composition`
- `f83ddcb` in `wesen-os` — `Refresh kanban vm demos for page-style composition`

### What I did

- Added a new `KanbanHighlights` host widget and its Storybook stories.
- Extended `KanbanBoardView` and `KanbanBoard` so demo boards can vary title, subtitle, action label, filter bar visibility, status metrics, and highlight strips.
- Replaced the runtime helper `widgets.kanban.shell(...)` with `widgets.kanban.page(...)`.
- Updated `kanbanV1Pack.tsx` so the validator and renderer accept page children instead of a single shell prop bag.
- Rewrote the runtime fixture card and runtime-pack tests to the new `kanban.page` tree shape.
- Reworked the `os-launcher` card docs and five demo cards so they render distinct board shapes:
  - `Sprint Radar`
  - `Bug Triage Desk`
  - `Focus Inbox`
  - `Incident Command`
  - `Release Cutline`
- Regenerated `kanban.vmmeta.json` and `kanbanVmmeta.generated.ts` after the authored VM source changed.

### Why

- The shell object worked technically, but it still made the DSL feel like one large prop object.
- The user wanted a React-like composition style and more visibly different examples.
- The direct-cutover strategy was already approved, so replacing the DSL again was cleaner than carrying both shapes.

### What worked

- The page-style DSL reads much more naturally in authored cards.
- The runtime-pack tests, Storybook taxonomy check, `hypercard-runtime` typecheck, `vmmeta` generation, and `os-launcher` plugin bundle tests all passed after the cutover.
- The new examples cover a wider range of layouts without introducing raw host UI primitives into the VM surface.

### What didn't work

- The earlier APP-20 docs still described a shell-oriented design and possible `kanban.v2` versioning, so the ticket documentation had to be revised after the implementation pivot.
- The `wesen-os` root repo still has unrelated pre-existing dirty files (`go.work`, `pnpm-lock.yaml`, and workspace-link pointers), so I had to stage the app files explicitly.

### What I learned

- There are two different kinds of flexibility here:
  - descriptor-driven data flexibility, which APP-20 already solved
  - composition-style authoring flexibility, which required a second DSL pivot
- The page-style DSL is a better fit for “example cards” because the source reads like assembled widgets rather than nested configuration.

### What was tricky to build

- The validator and renderer both had to change shape at the same time. The old root was one object with nested optional children; the new root is a child list with required node kinds. That changed validation, rendering, runtime tests, and docs together.
- The examples also needed to become more varied without becoming over-engineered. I kept shared board data and handlers in the runtime prelude, but kept each card’s page composition and highlights local so the examples still read as examples.

### What warrants a second pair of eyes

- The current page DSL still has a relatively small primitive set. It is more flexible than before, but future work may still want lane-level or panel-level composition.
- The examples are intentionally opinionated now. Review whether the current balance between shared helpers and card-local code is readable enough for new authors.

### What should be done in the future

- Use APP-19 / APP-17 follow-up work to display the generated built-in VM source directly in `Stacks & Cards`, which will make reviewing these page-style examples much easier.
- If the next Kanban feature needs significantly smaller composition units, continue extending `widgets.kanban.page(...)` rather than falling back to raw `ui.*`.

### Code review instructions

- Start in [kanbanV1Pack.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx) to see the page node contract.
- Then read [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js) for the VM authoring helpers.
- Review [KanbanHighlights.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanHighlights.tsx) and [KanbanBoardView.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoardView.tsx) for the new host shell surface.
- Finish with the authored cards under [apps/os-launcher/src/domain/vm/cards](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/cards) and the docs in [kanban-pack.docs.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/docs/kanban-pack.docs.vm.js).
- Validate with:
  - `npx vitest run packages/hypercard-runtime/src/runtime-packs/runtimePackRegistry.test.tsx packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts packages/rich-widgets/src/kanban/kanbanState.test.ts`
  - `npm run storybook:check`
  - `npm run typecheck -w packages/hypercard-runtime`
  - `npm run vmmeta:generate`
  - `npm run test -- --run src/domain/pluginBundle.test.ts`

### Technical details

Implemented page-style root:

```text
widgets.kanban.page(
  widgets.kanban.taxonomy({...}),
  widgets.kanban.header({...}),
  widgets.kanban.highlights({...}),   // optional
  widgets.kanban.filters({...}),      // optional
  widgets.kanban.board({...}),
  widgets.kanban.status({...}),       // optional
)
```

Validation results captured during this step:

- `npx vitest run packages/hypercard-runtime/src/runtime-packs/runtimePackRegistry.test.tsx packages/hypercard-runtime/src/plugin-runtime/runtimeService.integration.test.ts packages/rich-widgets/src/kanban/kanbanState.test.ts`
  - passed
- `npm run storybook:check`
  - passed
- `npm run typecheck -w packages/hypercard-runtime`
  - passed
- `npm run vmmeta:generate`
  - passed
- `npm run test -- --run src/domain/pluginBundle.test.ts`
  - passed
>
> - separate the headerbar out / its submodules
> - register custom bug types and all that
> - becase right now there isn't much flexibility at all and the card examples all just use kanban.board.
>
> Create a new ticket for that, for making the kanban board primitives more versatile.

**Assistant interpretation:** Create a dedicated design ticket for expanding the Kanban primitive model rather than adding more examples on top of the current monolithic pack.

**Inferred user intent:** Make the Kanban runtime pack expressive enough for real product usage, especially around header composition and custom issue taxonomies.

**Commit (code):** N/A

### What I did

- Created APP-20.
- Audited the current runtime-pack validator and renderer in `kanbanV1Pack.tsx`.
- Audited `KanbanBoardView.tsx` to map which parts of the board shell are currently welded together.
- Audited `types.ts` to confirm that issue taxonomy is still hardcoded.
- Audited the VM docs to confirm they explicitly teach only `widgets.kanban.board(...)`.
- Added Storybook requirements to the ticket tasks and design plan for all future Kanban widget extraction work.
- Prepared the ticket bundle for reMarkable review so the design can be handed off cleanly.

### Why

- More example cards would not meaningfully increase flexibility if the primitive surface itself remains board-only.
- Storybook coverage needs to be an explicit part of the plan so the extracted host widgets remain reviewable and reusable.

### What worked

- The evidence aligns across runtime pack, host view, type layer, and docs: the system is currently too monolithic.
- The ticket now has a concrete design direction instead of vague “make Kanban more flexible” wording.

### What didn't work

- There is no implementation in this ticket yet. The current pack remains board-only.

### What I learned

- The current rigidity is not just a missing helper or two. It is built into the validator, host composition, and taxonomy model.
- Storybook is part of the architecture here, not just QA polish, because the host widget layer needs its own review surface.

### What was tricky to build

- The tricky part was making sure the ticket addressed the actual architectural bottleneck instead of just the sample cards. It would have been easy to write a ticket about “more Kanban examples,” but the real issue is that the primitive model itself is too coarse.
- I handled that by grounding the ticket in the current validator and host composition code before writing the plan.

### What warrants a second pair of eyes

- Review whether the next iteration should be `kanban.v2` rather than mutating `kanban.v1`.
- Review the proposed boundary between taxonomy descriptors and issue-editor configuration.

### What should be done in the future

- Implement the APP-20 slices starting with host widget extraction and Storybook stories.
- Add new runtime cards only after the richer primitive surface exists.

### Code review instructions

- Start with [kanbanV1Pack.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-packs/kanbanV1Pack.tsx).
- Then read [KanbanBoardView.tsx](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/KanbanBoardView.tsx).
- Then read [types.ts](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/rich-widgets/src/kanban/types.ts) and [kanban-pack.docs.vm.js](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/apps/os-launcher/src/domain/vm/docs/kanban-pack.docs.vm.js).

### Technical details

- Current constraint in one line:

```text
widgets.kanban.board(...)
  ->
kind: 'kanban.board' only
  ->
KanbanBoardView with embedded toolbar/footer/modal
  ->
fixed TagId/Priority enums
```

- Desired direction:

```text
shell/header/status primitives
  +
descriptor-driven issue taxonomies
  +
lane / issue / summary sub-primitives
  +
Storybook stories for every extracted host widget
```

## Related

- `../index.md`
- `../tasks.md`
- `../changelog.md`
- `../design-doc/01-intern-guide-to-expanding-kanban-runtime-primitives-beyond-a-single-board-root.md`
