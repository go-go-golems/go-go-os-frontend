# Changelog

## 2026-03-09

- Initial workspace created

## 2026-03-10

- Added a detailed design and implementation guide for the fully decoupled runtime-pack architecture
- Recorded the current coupling points and the target app-level pack registration model
- Added a phased task plan for future implementation work

## 2026-03-11

- Refreshed APP-16 after APP-23 so the ticket now uses the current `RuntimeBundle`, `RuntimePackage`, `RuntimeSurface`, and `RuntimeSurfaceType` model instead of the older stack/card-oriented framing
- Reframed the ticket from “invent runtime-pack registration” to “extract concrete runtime packages out of runtime core and register them from the host app”
- Updated the design guide to distinguish between what already exists in runtime core today and what still needs to move physically into external packages
- Rewrote the task list into an extraction-focused execution plan for the future Kanban package move and later `ui` package decision
- Expanded the APP-16 task list again so each implementation slice now includes more concrete file-level and validation-level subtasks, especially around extraction seams, host registration, docs mounts, and the later `ui` package decision
- Implemented the first APP-16 code checkpoint: runtime package and surface-type registries no longer self-register built-ins at import time, runtime core now exposes explicit built-in registration helpers, and focused tests now prove registries can stay empty until registration happens (`go-go-os-frontend` `da66c38`)
- Wired the current built-in runtime registration helper into the live `os-launcher` and inventory app entrypoints so behavior stays unchanged while the hidden registry side effects are removed (`wesen-os` `2c44368`, `go-go-app-inventory` `c9fc6f0`)
- Fixed a branch regression where opening windows like `Stacks & Cards`, `Inventory`, and `Rich Widgets` could hit a React maximum-update-depth loop through repeated min-size dispatches; the desktop controller and reducer now both short-circuit unchanged min-size updates, and the window layer now has a per-window error boundary fallback (`go-go-os-frontend` `0ce1bd2`)
- Implemented the main APP-16 Kanban extraction slice: created `packages/kanban-runtime`, moved the Kanban VM prelude, `kanban.v1` validator/renderer, host widgets, stories, and theme assets out of `hypercard-runtime` / `rich-widgets`, and removed Kanban ownership from runtime core (`go-go-os-frontend`)
- Changed host registration to the cleaner final shape where `kanban-runtime` exports package and surface-type definitions and `wesen-os` / inventory register them through their own `@hypercard/hypercard-runtime` imports, avoiding cross-package singleton traps during tests and app bootstrap (`wesen-os`, `go-go-app-inventory`)
- Revalidated the extraction with focused `hypercard-runtime` and `kanban-runtime` Vitest suites, `os-launcher` bundle/runtime-debug tests, inventory launcher/bundle tests, and a live browser smoke at `http://localhost:5173` opening `Stacks & Cards`, `Rich Widgets`, and `Inventory` without page errors
- Recorded the post-Kanban decision explicitly: `ui` is not a temporary built-in exception and is the next concrete package to extract after `kanban`
- Re-homed Kanban surface-type docs metadata into `@hypercard/kanban-runtime` while keeping `os-launcher` VM demo surface docs in the launcher bundle, and updated docs registration so `/docs/objects/surface-type/kanban.v1/*` comes from the package while `/docs/objects/surface/os-launcher/*` still comes from launcher `vmmeta`
- Added focused tests proving the mixed docs ownership model: a mocked registration test for `registerAppsBrowserDocs`, a real integration test resolving both Kanban surface-type docs and `os-launcher` demo surface docs, and the existing apps-browser docs-mount adapter tests
- Implemented the second APP-16 extraction slice: created `packages/ui-runtime`, moved `ui.package.vm.js`, `ui.card.v1` validation/rendering, and UI surface-type docs metadata out of `hypercard-runtime`, and removed the last concrete first-party package ownership from runtime core (`go-go-os-frontend`)
- Updated `os-launcher` and inventory startup registration to register `ui` explicitly through host-owned bootstrap code instead of relying on runtime-core defaults, and added a narrow startup registration test in `os-launcher` (`wesen-os`, `go-go-app-inventory`)
- Updated docs registration so `/docs/objects/surface-type/ui.card.v1/*` is mounted from `@hypercard/ui-runtime`, while inventory continues to own only its runtime surface docs under `/docs/objects/surface/inventory/*`
- Revalidated the `ui` extraction with focused `ui-runtime`, `kanban-runtime`, and `hypercard-runtime` suites, `os-launcher` startup/docs/runtime-debug tests, inventory `vmmeta` generation and bundle tests, Storybook coverage, and `docmgr doctor`
- Removed the last duplicated Kanban package docs source from `os-launcher` by deleting `src/domain/vm/docs/kanban-pack.docs.vm.js`, regenerating launcher `vmmeta`, and leaving package-level `kanban.v1` docs owned only by `@hypercard/kanban-runtime` while `os-launcher` keeps only surface-level demo docs
