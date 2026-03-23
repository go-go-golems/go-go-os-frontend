# Changelog

## 2026-03-09

- Initial workspace created
- Scoped this ticket as the APP-11 follow-up for linked-workspace validation failures, not as another runtime-contract migration.
- Recorded the current known failure shape:
  - ARC AGI player targeted build emits `TS6059` because `rootDir` is pinned to `src` while `paths` import linked package source trees.
  - The same build surfaced linked raw-import typing failure for `packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts` importing `stack-bootstrap.vm.js?raw`.
- Marked `apps/sqlite/tsconfig.json` as the working comparison point because it already uses project references and validates successfully in this workspace.
