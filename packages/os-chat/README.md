# @go-go-golems/os-chat

Shared chat UI, state, protocol helpers, and runtime integration primitives for go-go-os applications.

Use this package when a host app needs reusable chat windows, chat profile state, conversation hooks, timeline mapping, or chat-related runtime integrations. It is also a dependency of `@go-go-golems/os-scripting` because the scripting/debug environment can attach to chat and timeline surfaces.

## Install

```bash
npm install @go-go-golems/os-chat @go-go-golems/os-core
npm install react react-dom react-redux @reduxjs/toolkit
```

`react`, `react-dom`, `react-redux`, and `@reduxjs/toolkit` are peer dependencies.

## Main exports

```ts
import {
  ChatConversationWindow,
  chatProfilesReducer,
  chatSessionReducer,
  chatWindowReducer,
  timelineReducer,
} from '@go-go-golems/os-chat';
```

Common exports include:

- chat conversation React components,
- chat profile selectors and hooks,
- chat session/window Redux reducers,
- timeline reducer and timeline mapping helpers,
- HTTP and WebSocket runtime helpers,
- syntax highlighting and debug UI utilities used by chat surfaces.

## Theme

Some chat components include package styles. Import the theme entry from your app root when using chat UI directly:

```ts
import '@go-go-golems/os-chat/theme';
```

## Store integration

```ts
import {
  chatProfilesReducer,
  chatSessionReducer,
  chatWindowReducer,
  timelineReducer,
} from '@go-go-golems/os-chat';

const reducers = {
  chatProfiles: chatProfilesReducer,
  chatSession: chatSessionReducer,
  chatWindow: chatWindowReducer,
  timeline: timelineReducer,
};
```

Pass these reducers to your host store factory when your app uses chat state.

## Related packages

- `@go-go-golems/os-core` — theme, desktop primitives, and widgets used by chat UI.
- `@go-go-golems/os-scripting` — VM/runtime package that can integrate with chat and timeline surfaces.
