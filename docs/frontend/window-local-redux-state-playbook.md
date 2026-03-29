# Window-local Redux State Playbook

This playbook defines a repeatable pattern for UI state that must be isolated per desktop window.

## Use This Pattern When

- State is view-local and ephemeral (spinners, selected tab, transient compose state).
- Multiple windows can show the same domain data at the same time.
- `useState` in a window component is causing lifecycle races or reconnect flicker.

## State Model

Store per-window UI state in a dedicated slice keyed by `windowId`.

```ts
type Slice = {
  byWindowId: Record<string, WindowLocalState>;
};
```

Rules:
- `windowId` is the primary key.
- Keep payloads minimal and serializable.
- Keep conversation/domain identifiers inside the window state (`convId`) so stale windows can be detected.

## Wiring Steps

1. Create `chatWindowSlice` (or app-specific `*WindowSlice`) with:
   - `setWindowConversation` (or equivalent bind action),
   - one or more mutation actions for local state transitions,
   - `clearWindowState` for cleanup.
2. Add reducer to all app stores that host the windowed UI.
3. Pass `windowId` from launcher/module render params to window components.
4. In the window component:
   - dispatch `setWindowConversation` on mount/conv switch,
   - dispatch `clearWindowState` on unmount cleanup,
   - dispatch transition actions from user events (`send`, tab change, etc.).
5. Compute rendered booleans via selectors (not local effects that call `setState` every render).

## Selector Pattern

Prefer selectors that combine:
- window-local state (`byWindowId[windowId]`),
- domain state (timeline, session, etc.),
- deterministic gating logic.

For pending AI indicator:
- do not show before user message append,
- show after user append and before AI-side timeline signal,
- hide on AI-side signal or terminal error.

## Guardrails

- Never key window-local state by `convId` alone when multiple windows are possible.
- Avoid local reconciliation loops (`useEffect` + `setState`) for derived UI state.
- Keep cleanup explicit (`clearWindowState`) to avoid stale memory and reused indicators.
- Keep selectors idempotent and pure.

## Validation Checklist

- Open two chat windows with same conversation: behavior remains isolated by `windowId`.
- Submit prompt: no spinner until user message is appended.
- Spinner appears only between user append and first AI-side timeline entity.
- Refocus/unfocus window: no incorrect spinner resurrection from stale local state.
- Unit tests cover slice transitions and selector behavior.

## Reference Files

- `packages/os-core/src/chat/state/chatWindowSlice.ts`
- `packages/os-core/src/chat/state/selectors.ts`
- `packages/os-core/src/chat/components/ChatConversationWindow.tsx`
- `apps/inventory/src/launcher/module.tsx`
- `apps/inventory/src/launcher/renderInventoryApp.tsx`
