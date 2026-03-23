# Changelog

## 2026-03-10

- Created APP-20 to design a more versatile Kanban runtime primitive model beyond the current single `widgets.kanban.board(...)` helper.
- Added the design guide, task breakdown, and investigation diary covering the current runtime-pack limitation, fixed issue taxonomy constraints, and the need for Storybook-backed widget extraction as the primitive surface expands.
- Uploaded the APP-20 bundle to reMarkable so the design can be reviewed outside the repo.
- Converted APP-20 from a pure design ticket into an implementation ticket with direct-cutover slices for host widget extraction, taxonomy refactor, runtime-pack DSL replacement, Storybook coverage, VM card rewrites, and validation.
- Implemented the direct cutover in `go-go-os-frontend`: extracted richer host shell pieces, added `KanbanHighlights`, switched the Kanban data model from hardcoded tags/priorities to descriptor-driven taxonomy, and replaced the runtime contract with a structured `kanban.v1` page DSL.
- Implemented the `os-launcher` follow-through: rewrote the demo VM cards and pack docs to the new page-style DSL, added `Incident Command` and `Release Cutline`, regenerated VM metadata, and updated the launcher surface so all five cards are reachable.
- Refined the demos to be more visually distinct and less repetitive, including a single-lane `Focus Inbox`, a two-lane `Release Cutline`, a denser five-lane `Sprint Radar`, and new highlight strips above the board.
- Validated the cutover with focused runtime-pack tests, `hypercard-runtime` typecheck, `os-launcher` plugin tests, Storybook taxonomy checks, and a Playwright smoke opening the new `Incident Command` card through the real runtime session host.

## 2026-03-09

- Initial workspace created
