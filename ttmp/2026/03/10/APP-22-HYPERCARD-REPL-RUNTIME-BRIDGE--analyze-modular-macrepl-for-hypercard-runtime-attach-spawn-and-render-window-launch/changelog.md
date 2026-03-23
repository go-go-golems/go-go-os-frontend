# Changelog

## 2026-03-10

- Initial workspace created
- Added APP-22 as the research/design ticket for turning MacRepl into a reusable REPL shell that can eventually attach to live HyperCard runtime sessions or spawn new runtime sandboxes.
- Audited the current MacRepl proof of concept and documented that it mixes shell UI, synchronous toy command execution, and state ownership.
- Audited the current HyperCard runtime path and documented that `PluginCardSessionHost` privately owns `QuickJSCardRuntimeService`, which blocks any REPL attach mode today.
- Chose a broker-based design: reusable REPL shell in `rich-widgets`, HyperCard runtime broker and driver in `hypercard-runtime`, and existing desktop window actions for render-window launch effects.
- Wrote the intern-facing design and implementation guide with pack-aware REPL recommendations, diagrams, pseudocode, and a phased plan for spawn-first then attach mode.
- Validated the ticket with `docmgr doctor` after adding the missing `repl` and `widgets` vocabulary topics.
- Uploaded the ticket bundle to reMarkable at `/ai/2026/03/10/APP-22-HYPERCARD-REPL-RUNTIME-BRIDGE`.

## 2026-03-11

- Refreshed APP-22 after APP-16 and APP-23 so the ticket now uses the current `RuntimeSession`, `RuntimeBundle`, `RuntimePackage`, `RuntimeSurface`, and `RuntimeSurfaceType` architecture rather than the older card/stack framing
- Reframed the ticket from “MacRepl for HyperCard” to “reusable REPL shell platform plus one HyperCard runtime bridge”
- Added a much more detailed architecture section for pluggable autocomplete, on-demand help, and inspection providers
- Added a reusable `ReplProfile` / driver model so the same REPL window can be reused later for other languages or tool domains
- Clarified that HyperCard-specific runtime ownership belongs in `hypercard-runtime`, while the shell presentation remains generic and reusable
- Kept the spawn-first recommendation but expanded the attach-mode analysis around broker/registration requirements and safety concerns
- Re-uploaded the refreshed APP-22 bundle to reMarkable as `APP-22 HyperCard REPL Runtime Bridge v2` under `/ai/2026/03/11/APP-22-HYPERCARD-REPL-RUNTIME-BRIDGE`
- Expanded APP-22 from research-only tasks into a concrete implementation backlog, with the first coding slice explicitly scoped as generic REPL core extraction inside `rich-widgets/src/repl/core` while preserving the current toy command set through a demo driver
- Implemented the first code checkpoint in `go-go-os-frontend` (`a5f475d`): extracted a generic REPL core, converted the toy command engine into `BUILTIN_DEMO_REPL_DRIVER`, refactored `MacRepl` to consume driver/completion contracts, added focused tests, and added a custom-driver Storybook example
- Implemented the second code checkpoint in `go-go-os-frontend` (`5ce7147`): added a spawn-oriented runtime broker in `hypercard-runtime` that owns external runtime session handles, publishes serializable summaries, and gives the future REPL profile a clean owner seam around `QuickJSRuntimeService`
- Implemented the third code checkpoint in `go-go-os-frontend` (`f037cf3`): widened the REPL driver contract to support async execution, updated the shell to handle in-flight commands safely, and added focused validation for async driver results
- Implemented the fourth code checkpoint in `go-go-os-frontend`: extracted the full REPL shell into a dedicated `@hypercard/repl` package, moved the REPL tests/stories/theme there, rewired `rich-widgets` and Storybook to consume the package, and deleted the old `packages/rich-widgets/src/repl/*` source tree
- Implemented the fifth code checkpoint in `go-go-os-frontend`: added the first HyperCard REPL driver in `hypercard-runtime`, backed by the spawn-oriented runtime broker and package registries, with package-aware completions/help and broker-driven `spawn`, `sessions`, `use`, `surfaces`, `render`, and `event` commands
- Attached runtime package docs metadata directly to the extracted `ui` and `kanban` runtime package definitions so the new HyperCard REPL driver can use the live runtime package registry as its first help/completion source
- Implemented the sixth code checkpoint in `go-go-os-frontend`: threaded generic `ReplEffect[]` delivery through `@hypercard/repl` via `MacReplProps.onEffects`, and added an `open-surface` HyperCard REPL command that emits an `open-window` host effect for a runtime-backed surface
- Fixed the HyperCard REPL driver completion code to avoid `Array.prototype.at(...)`, which was outside the effective target/lib baseline for the `os-launcher` workspace typecheck path
- Implemented the seventh code checkpoint in `wesen-os`: added a real `hypercard-repl` launcher module in `os-launcher`, wired it into the launcher module list, and added focused tests for console and runtime-surface window routing
- Refreshed `wesen-os` workspace links with `pnpm install` so the new `@hypercard/repl` package resolves as a real workspace dependency rather than only through temporary TypeScript path aliases
- Validated the new launcher slice with focused Vitest coverage and a live `http://localhost:5173` smoke, confirming that the HyperCard REPL window opens in the running desktop shell
- Implemented the eighth code checkpoint in `go-go-os-frontend`: extended the HyperCard REPL driver with bundle-local `vmmeta` docs ingestion so help/completions can resolve runtime surface docs like `lowStock` in addition to package-level symbols like `ui.panel`
- Implemented the ninth code checkpoint in `go-go-os-frontend`: added live authoring commands for broker-owned spawned sessions:
  - `define-surface`
  - `define-render`
  - `define-handler`
- Wired `wesen-os` to pass `INVENTORY_VM_PACK_METADATA` and `OS_LAUNCHER_VM_PACK_METADATA` into the REPL bundle library so the desktop REPL uses the same generated docs metadata as the docs browser and runtime debugger
- Fixed the REPL `render` command so JSON state with spaces is parsed from the raw remainder of the line rather than being broken by naive whitespace tokenization
- Implemented the attach-mode checkpoint in `go-go-os-frontend`:
  - added an attached runtime-session registry for live host-owned interactive sessions
  - had `RuntimeSurfaceSessionHost` register ready non-preview sessions as read-only attach targets
  - added HyperCard REPL `attach` support and mixed spawned/attached session discovery in `sessions` / `use`
  - kept attached sessions intentionally read-only, allowing `surfaces` and `render` but blocking mutations and broker-only `open-surface`
- Added focused attach-mode coverage for:
  - attached session registry behavior
  - live-session attach semantics in the HyperCard REPL driver
  - host registration of ready interactive sessions in `RuntimeSurfaceSessionHost`
- Validated the attach checkpoint with focused Vitest coverage and `hypercard-runtime` package typecheck
- Fixed a usability gap in the HyperCard REPL:
  - `help` is now an executable HyperCard REPL command instead of only a completion/help-provider capability
  - the prompt now reflects the active runtime session as `hc[session-id]>`
  - attached sessions participate in `use` / `attach` completions and surface completions correctly
- Re-validated the HyperCard REPL with focused Vitest coverage and a live browser smoke showing `help attach` plus `attach session-1`
- Extended attached-session routing so `open-surface` now works for attached sessions too
  - the REPL emits the same `open-window` effect shape for attached sessions
  - the `hypercard-repl` host module now resolves either broker-owned or attached session handles when opening runtime-surface windows
  - attached surface windows remain read-only and toast instead of dispatching live events back into the session
- Re-validated the new attached `open-surface` path with focused driver/module tests and a live browser smoke that opened an attached Inventory `lowStock` window from the HyperCard REPL
