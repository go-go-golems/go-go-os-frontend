# Changelog

## 2026-03-09

- Initial workspace created
- Added the APP-17 design scope, detailed implementation guide, task plan, and diary for moving Stacks and Cards ownership from inventory into `hypercard-runtime` with startup registration from `wesen-os`.

## 2026-03-10

- Implemented the package-owned runtime debug surface in `hypercard-runtime`, including explicit `ownerAppId` handling, a stack registration registry, shared window payload helpers, and focused registry tests (`8cf7b35`).
- Switched inventory to the shared runtime debug app by exporting `inventoryStack`, removing inventory-specific Stacks and Cards route glue, and launching `app.launch.hypercard-runtime-debug` instead (`61f7848`).
- Registered the shared Stacks and Cards app from `wesen-os` startup via a thin launcher wrapper that binds the inventory and `os-launcher` stacks (`222b4a9`).
- Validated the move with `npx vitest run src/hypercard/debug/runtimeDebugRegistry.test.tsx`, `npm run typecheck -w packages/hypercard-runtime`, and `npx tsc --build tsconfig.json` in inventory; recorded the pre-existing `os-launcher` Vitest linked `.js` import failures and the pre-existing linked `@hypercard/rich-widgets` TypeScript failures in the diary.
- Added runtime-debug actions for launching predefined stack cards and editing built-in `os-launcher` Kanban cards directly from the running plugin-session list, and widened the `os-launcher` card adapter so generic stack-card launches render correctly (`9103e99`, `bab1458`, `2f4d7c6`).
- Validated the APP-17 polish with `npm run test -- --run src/app/kanbanVmModule.test.tsx src/app/runtimeDebugModule.test.tsx`, `npm run typecheck -w packages/hypercard-runtime`, and a live Playwright smoke in `wesen-os` that opened `Incident Command` from `Stacks & Cards` and reopened its source editor from the session table.
- Fixed the shared `Plugin Sessions` table so it resolves each session’s actively running card from windowing navigation state instead of listing every cached `cardState` bucket, which previously made one session appear to own all built-in stack cards (`8378ac6`).
