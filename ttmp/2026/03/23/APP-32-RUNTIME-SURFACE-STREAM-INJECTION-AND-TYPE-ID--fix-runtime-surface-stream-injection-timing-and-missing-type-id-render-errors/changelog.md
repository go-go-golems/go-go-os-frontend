# Changelog

## 2026-03-23

- Initial workspace created
- Added a focused design note describing the streamed-card injection failure path and the missing runtime surface type-id render failure.
- Added phased tasks covering investigation, implementation, validation, and ticket bookkeeping.
- Added an investigation diary documenting the code paths from backend card events through artifact projection and runtime render.
- Tightened the runtime-surface contract so `packId` is required end-to-end, removed implicit default-surface fallback, updated inventory prompt/examples, and refreshed targeted frontend coverage.
- Added a projection-time completion gate so streaming card entities stay visible in chat but do not register or inject runtime surfaces until the final card update arrives.
- Tightened the inventory runtime-card extractor so finalized cards with blank `runtime.pack` emit card errors instead of “ready” card events that cannot open in the frontend.
