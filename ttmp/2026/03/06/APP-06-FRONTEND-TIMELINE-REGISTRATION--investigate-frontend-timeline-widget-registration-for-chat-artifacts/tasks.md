# Tasks

## Investigation

- [x] Map the backend projection path for generic tool events and inventory HyperCard events.
- [x] Narrow the target scope to card-first cutover; treat widget paths as legacy/non-target.
- [x] Map the frontend decode path from `timeline.upsert` to Redux timeline state.
- [x] Identify where default chat renderers and HyperCard renderers are registered.
- [x] Compare inventory store wiring against apps-browser store wiring.
- [x] Audit tests to determine which layers have coverage and which do not.

## Design

- [x] Write a detailed intern-facing design and implementation guide.
- [x] Record a chronological investigation diary with commands, evidence, and conclusions.
- [x] Capture the main architectural finding that “registration” currently spans renderer bootstrap, entity remap, and store wiring.
- [x] Propose a clearer target design for chat-enabled host stores and timeline extensions.
- [x] Write a handoff-ready card-cutover implementation plan that a median developer can execute without rediscovering the architecture.

## Card Cutover Implementation

- [x] Phase 1. Add a `timelineRenderers` prop to `ChatConversationWindow` so host apps can inject renderer overrides explicitly.
- [x] Phase 1. Merge host-provided renderers after global/builtin renderer resolution so host overrides win.
- [x] Phase 1. Keep builtin chat rows (`message`, `tool_call`, `tool_result`, `status`, `log`) working unchanged.

- [x] Phase 2. Remove inventory’s live dependency on `registerHypercardTimelineModule()`.
- [x] Phase 2. Update inventory to import `HypercardCardRenderer` directly and pass it to `ChatConversationWindow` through `timelineRenderers`.
- [x] Phase 2. Keep `ensureChatModulesRegistered()` only for default chat SEM handlers and builtin renderers.

- [x] Phase 3. Remove HyperCard-specific remap logic from `packages/chat-runtime/src/chat/sem/timelineMapper.ts`.
- [x] Phase 3. Update `timelineMapper` tests to expect `hypercard.card.v2` as the stored/rendered kind.
- [x] Phase 3. Stop using `hypercard_card` as a live frontend alias kind.

- [x] Phase 4. Simplify `artifactRuntime.ts` to operate on `hypercard.card.v2` directly.
- [x] Phase 4. Remove widget-specific extraction branches from the live artifact/runtime-card path.
- [x] Phase 4. Preserve extraction of `artifactId`, `runtimeCardId`, and `runtimeCardCode` from first-class card payloads.

- [x] Phase 5. Remove widget renderer/registration code from the live package surface.
- [x] Phase 5. Remove `registerHypercardWidgetSemHandlers()` and `registerHypercardCardSemHandlers()` unless a real production caller still exists.
- [x] Phase 5. Delete or explicitly deprecate `registerHypercardTimeline.ts` from the live inventory path.

- [x] Phase 6. Update debug tooling so Timeline Debug shows `hypercard.card.v2` directly instead of a private remapped alias.
- [x] Phase 6. Remove widget and `hypercard_card` assumptions from debug color/label helpers.

- [x] Phase 7. Add one chat-runtime test for explicit host renderer overrides.
- [x] Phase 7. Add one inventory host-level integration test that renders `ChatConversationWindow` from a `hypercard.card.v2` `timeline.upsert`.
- [x] Phase 7. Add one inventory or chat-runtime regression test confirming builtin `tool_call` rows still render.
- [x] Phase 7. Add one artifact-runtime test confirming runtime-card fields still extract from `hypercard.card.v2`.
- [x] Phase 7. Do not add characterization tests for `hypercard_card`, widgets, or global HyperCard registration.

- [ ] Phase 8. Validate the live inventory app manually: Event Viewer, Timeline Debug, rendered card row, and Open/Edit actions.
- [ ] Phase 8. Confirm builtin `tool_call` rows still render after the cutover.

## Validation

- [x] Run focused package tests for chat-runtime and hypercard-runtime registration paths.
- [x] Run the current apps-browser launcher tests to confirm they do not cover chat-window integration.
- [x] Run the final card-only tests once the cutover lands.
- [ ] Validate a real end-to-end conversation with card and tool-call rows after the fix.
