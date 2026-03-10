# Changelog

## 2026-03-10

- Initial workspace created


## 2026-03-10

Created the ticket, wrote the initial bug analysis, seeded the diary, and added implementation tasks for the docs-browser and runtime regressions.

### Related Files

- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocCenterHome.tsx — Reported kind-chip search bug under analysis
- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsCatalogStore.ts — Reported stale mount cache bug under analysis
- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx — Reported runtime projection bug under analysis


## 2026-03-10

Implemented the docs-browser kind-filter navigation fix, invalidated docs catalog caches on registry refresh, aligned runtime projected-domain semantics with normalized full-access policy, and added regression coverage plus targeted verification.

### Related Files

- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocBrowserContext.tsx — Structured search navigation now carries facet state
- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/components/doc-browser/DocSearchScreen.tsx — Search screen now initializes from structured filter state
- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/apps/apps-browser/src/domain/docsCatalogStore.ts — Registry notifications now invalidate cached docs data
- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/pluginCardRuntime/selectors.ts — Selector now supports all-access projection semantics
- /home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx — Host projection now uses normalized runtime capabilities

