# Changelog

## 2026-03-09

- Initial workspace created
- Added APP-14 as the dedicated follow-on ticket for controlling rich widgets from VM sandboxes after APP-07 runtime-pack research and APP-11 runtime-boundary simplification.
- Scoped the ticket around one concrete case study: refactoring `KanbanBoard` into VM-usable layers instead of keeping the discussion abstract.
- Expanded `tasks.md` to include:
  - current architecture audit
  - runtime-pack contract design
  - Kanban-specific decomposition and DSL API
  - phased implementation planning and validation strategy
- Added a detailed intern-facing design guide that:
  - maps the current QuickJS runtime, host renderer, and rich-widget seams
  - defines a rich-widget runtime-pack contract on top of the APP-11 `state` plus `dispatch(action)` boundary
  - proposes a concrete Kanban split into serializable domain state, reusable React view parts, and VM-facing pack renderers/helpers
  - specifies node families, event routing, action contracts, diagrams, and phased implementation work for future code tickets
- Related the APP-14 docs to the key HyperCard runtime files, Kanban widget files, and prerequisite APP-07 and APP-11 design docs.
- Committed the initial APP-14 ticket bundle as `b409ac2` (`Add APP-14 rich widget DSL pack design`).
- Refined the design direction after review:
  - use an explicit `runtime.pack` discriminator instead of relying on an implicit pack choice
  - keep `hypercard.card.v2` as the base artifact envelope for now
  - make `kanban.v1` the first real runtime pack instead of a generic `rich.widgets.v1`
  - add follow-up implementation tasks for artifact projection, runtime-pack registry wiring, and prompt-policy updates
