---
Title: Postmortem - Card Rendering and Malformed Structured Block Debugging
Ticket: APP-06-FRONTEND-TIMELINE-REGISTRATION
Status: active
Topics:
    - frontend
    - chat
    - timeline
    - hypercard
    - wesen-os
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/components/ChatConversationWindow.tsx
      Note: Chat window renderer selection was one half of the original visible failure
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md
      Note: Inventory system prompt that now explicitly requires the closing hypercard card tag
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_extractors.go
      Note: Inventory runtime-card extractor that now forwards raw and partial payloads on error
    - Path: ../../../../../../../wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go
      Note: Inventory SEM bridge that now includes raw and data fields on hypercard.card.error
    - Path: ../../../../../../../geppetto/pkg/events/structuredsink/filtering_sink.go
      Note: Structured sink malformed-path logic that now reports the expected closing tag and reconstructed outer block
ExternalSources: []
Summary: Documents the debugging path from a visible frontend card-rendering failure to the deeper malformed structured-block diagnosis, explains why the final root cause was model output that closed the YAML fence but not the outer hypercard tag, and records the code and prompt changes made to improve both rendering and debugging.
LastUpdated: 2026-03-06T18:35:00-05:00
WhatFor: Use when reviewing why inventory card rows initially rendered as generic JSON, why later runs produced hypercard.card.error events, and what was changed in both frontend and backend layers to stabilize the system and improve diagnostics.
WhenToUse: Use after reproducing card failures, when onboarding a developer to the debugging history, or before making further changes to structured extraction, prompts, or chat timeline rendering.
---

# Postmortem - Card Rendering and Malformed Structured Block Debugging

## Executive Summary

This incident started as a frontend symptom:

- inventory chat received card-related backend events
- Timeline Debug showed card-like state
- the visible chat row still rendered as generic JSON instead of a proper card

The first phase of the fix was a frontend cutover:

- preserve `hypercard.card.v2` end to end
- stop remapping to `hypercard_card`
- stop depending on global renderer registration
- inject `HypercardCardRenderer` explicitly from the inventory host

That fixed the renderer-resolution architecture problem.

Once that was in place, a second class of failures became obvious:

- some runs still emitted `hypercard.card.error`
- those errors initially only said `malformed structured block`
- the UI did not provide enough information to tell whether the problem was parser behavior or model output

The second phase of the fix was diagnostics:

- include `raw` and partial `data` in `hypercard.card.error`
- improve `structuredsink` malformed diagnostics so the error names the exact missing closing tag and includes the reconstructed outer block

The final root cause for the reproduced failing case was:

- the model correctly closed the inner fenced YAML block
- but it did not emit the outer `</hypercard:card:v2>` closing tag before the stream ended

So the card extractor was not failing because the YAML was invalid. It was failing because the structured block wrapper was incomplete.

The final mitigation was prompt tightening:

- explicitly instruct the model that the outer tag must be closed
- explicitly state that stopping after the closing code fence is invalid

## Initial Symptom

The user reported that backend-projected card entities seemed to exist, but the frontend timeline row was not rendering as a card.

The observed UI state was:

- Event Viewer showed `timeline.upsert`
- Timeline Debug showed a card-like entity
- the chat row rendered generic JSON

This pointed at a renderer-resolution problem rather than a pure backend-projection failure.

## Phase 1: Frontend Root Cause

The frontend investigation showed that the old live path was too indirect:

```text
backend emits hypercard.card.v2
  -> chat-runtime remaps it to hypercard_card
  -> host depends on global HyperCard renderer registration
  -> renderer lookup may fail or resolve through the wrong module instance
  -> chat row falls back to generic JSON
```

This was fixed by changing the contract to:

```text
backend emits hypercard.card.v2
  -> chat-runtime preserves hypercard.card.v2
  -> inventory passes HypercardCardRenderer explicitly
  -> chat window resolves renderer directly
  -> card renders
```

The important lesson from that phase was:

- the visible frontend failure was real
- but it was not the only problem in the system

Once the renderer path was fixed, malformed extraction errors became much easier to see.

## Phase 2: Why The Error Was Hard To Debug

After the frontend cutover, the next failure mode surfaced as:

```yaml
type: hypercard.card.error
error: malformed structured block
```

That message was insufficient because it did not tell us:

- whether the YAML inside the card was invalid
- whether the outer `<hypercard:card:v2>` wrapper was missing a close tag
- whether the parser had partially succeeded before the final failure
- whether the model stopped too early

In other words, the system exposed the fact of failure but not the shape of failure.

## Phase 3: Adding Better Evidence

The debugging changes were made in two places.

### Inventory error payload enrichment

`hypercard.card.error` now includes:

- `error`
- `raw`
- `data`

This means:

- malformed blocks include the raw captured payload
- validation failures like missing `card.id` or `card.code` include both the raw block and the partially parsed payload
- middleware-generated “missing structured card block” errors include the full assistant text

That work lives in:

- [hypercard_extractors.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_extractors.go)
- [hypercard_events.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go)
- [hypercard_middleware.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/wesen-os/workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_middleware.go)

### Structured sink malformed-path diagnostics

`structuredsink` previously emitted a generic error and only passed the inner captured payload body to the extractor.

That was changed so malformed finalization now:

- names the expected closing tag
- reconstructs the outer block in `raw`

So instead of:

```yaml
error: malformed structured block
raw: |
  ```yaml
  ...
```

we now get:

```yaml
error: malformed structured block: stream ended before closing tag </hypercard:card:v2>
raw: |
  <hypercard:card:v2>```yaml
  ...
```

That work lives in:

- [filtering_sink.go](/home/manuel/workspaces/2026-03-02/os-openai-app-server/geppetto/pkg/events/structuredsink/filtering_sink.go)

## Decisive Evidence

The decisive evidence came from the user’s backend stream logs.

The tail of the model output showed:

- the JavaScript body closing
- then the closing code fence ``````
- then `stop_reason=stop`

What was missing after the closing fence was:

```text
</hypercard:card:v2>
```

This established the final diagnosis:

- the YAML/code fence was closed
- the outer structured block was not closed
- `structuredsink` remained in capture mode
- the stream ended
- malformed finalization ran exactly as designed

This was not a false positive from the parser. It was a real incomplete structured block.

## Root Cause

The final reproduced root cause was:

1. the prompt instructed the model to output a `<hypercard:card:v2>` block
2. the examples showed the closing tag
3. but the prompt did not emphasize strongly enough that the outer closing tag was mandatory
4. the model emitted:
   - opening tag
   - fenced YAML
   - valid `card.code`
   - closing code fence
5. then the model stopped before emitting `</hypercard:card:v2>`

So the model complied with the inner content format but failed the outer framing protocol.

## Fixes Applied

### Frontend architecture fix

Completed earlier in APP-06:

- card-only cutover
- explicit renderer injection
- removal of live `hypercard_card` alias path

### Inventory debugging fix

Committed in `go-go-app-inventory`:

- `015d859` `fix: include raw payload on hypercard card errors`

### Structured sink debugging fix

Committed in `geppetto`:

- `4cf9e48` `debug: improve malformed structured block diagnostics`

### Prompt fix

Committed in `go-go-app-inventory`:

- `5b51fe4` `prompt: require closing hypercard card tag`

The prompt now explicitly says:

- after the closing ````` fence, the model must emit `</hypercard:card:v2>`
- stopping after the code fence is invalid

## What We Learned

### 1. Visible frontend failures can hide deeper protocol failures

At first the bug looked like “card renderer not registered.”

That was true for one class of failures, but it was not the whole story. The system also had malformed model output that only became obvious after renderer selection was fixed.

### 2. Generic error messages are not enough for structured generation

`malformed structured block` was technically correct but operationally weak.

For debugging model-structured output, the system needs to expose:

- expected framing
- raw captured content
- any partial parsed state

### 3. The inner fence and outer tag are separate contracts

The model can successfully close:

- the YAML fence

while still failing to close:

- the outer HyperCard tag

That distinction matters, and the tooling now surfaces it much better.

### 4. Prompt examples are not always sufficient

Showing a correct example is weaker than stating the rule explicitly.

For protocol-like output, the prompt should say:

- exactly what must be emitted
- exactly what counts as invalid

## Recommended Follow-Up

The system is substantially better now, but a few improvements are still worth considering.

- Add a dedicated status/error reason field in inventory SEM events for malformed framing vs YAML validation vs schema validation.
- Consider exposing `expectedClose` directly as a structured field instead of only embedding it in the error string.
- Consider adding one prompt regression harness or scripted smoke test that checks whether common card prompts produce a fully closed block.
- Consider similar diagnostics for other structured block types that still rely on the same malformed-path behavior.

## Review Checklist

When reviewing or reproducing this issue later, confirm:

1. A valid card run emits `hypercard.card.v2` and renders through the injected card renderer.
2. A malformed run emits `hypercard.card.error` with:
   - `error`
   - `raw`
   - optional `data`
3. If the outer tag is missing, the error string names the missing closing tag.
4. The runtime-card prompt still explicitly requires `</hypercard:card:v2>`.

That checklist should make future debugging much faster than this incident’s initial path.
