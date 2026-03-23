# Changelog

## 2026-03-10

- Created APP-21 to research how loaded HyperCard/runtime-card documentation could become visible in the existing doc browser and Module Browser.
- Mapped the current split between backend module docs (`/api/apps/{id}/docs`, `/api/os/docs`) and frontend-only runtime-card docs metadata (`vmmeta.generated.ts`).
- Chose a direct-cutover design direction with no compatibility layer: every docs provider should expose the same docs object format.
- Anchored the design on a Plan 9 style mounted-object model rooted at `/docs/objects/{kind}/{owner}/{slug}`.
- Documented the key recommendation: treat module docs, help docs, pack docs, and card docs as mounted subtrees in one docs-object registry instead of as unrelated fetch paths.
- Uploaded the APP-21 research bundle to reMarkable at `/ai/2026/03/10/APP-21-HYPERCARD-CARD-DOC-BROWSER-INTEGRATION`.
- Implemented the first frontend slice in `apps-browser`: canonical docs-object types, a mounted `DocsRegistry`, and stable mount snapshots for `useSyncExternalStore`-safe consumers.
- Replaced the earlier Redux docs projection direction with a no-Redux design: the docs runtime now uses an external `docsCatalogStore` plus hooks for index, collection, reader, and search state.
- Added tests for mount resolution, stable snapshot behavior, registry fan-out search, external catalog-store behavior, and Browser Detail mounted-doc rendering.
- Implemented concrete docs mount adapters for backend module docs, launcher help docs, `vmmeta` pack docs, and `vmmeta` card docs.
- Registered the default module/help mounts from `apps-browser` startup and the `os-launcher` `vmmeta` pack/card mounts from `wesen-os` startup.
- Added adapter tests for backend-to-object projection and `vmmeta` mount mapping.
- Rewrote the doc browser around canonical docs-object paths and mounted collections, including home, collection, reader, search, and topic views.
- Updated the Module Browser detail panel to show owner-matched mounted docs collections, and fixed the default docs bootstrap bug where `/api/os/apps` was parsed with the wrong response shape and no module/help mounts were registered.
