# Chat Debug Logging Playbook

This playbook explains how to enable and use namespace-based debug logging for chat lifecycle issues.

## Purpose

Diagnose unexpected chat reconnects, effect cleanup churn, and send-path failures with low-noise logs.

## Channels

- `chat:useConversation:lifecycle`
- `chat:useConversation:send`
- `chat:*` (all chat channels)

## Enable Logging

In browser devtools:

```js
localStorage.debug = 'chat:useConversation:*';
location.reload();
```

Alternative runtime helper:

```js
window.__HC_DEBUG__.enable('chat:useConversation:*');
```

## Disable Logging

```js
window.__HC_DEBUG__.disable();
localStorage.removeItem('debug');
```

## What To Look For

- `effect:start` log includes `changes` and `snapshot`.
- `effect:cleanup` log marks each cleanup run.
- `connect:ok` / `connect:error` logs confirm websocket attach outcomes.
- `send:start` / `send:ok` / `send:error` logs confirm message submit lifecycle.

## Source Files

- `packages/os-core/src/chat/debug/debugChannels.ts`
- `packages/os-core/src/chat/runtime/useConversation.ts`
