# @go-go-golems/os-confirm

plz-confirm integration components and runtime helpers for go-go-os hosts and applications.

Use this package when a React host needs reusable confirmation views and runtime plumbing for human-in-the-loop confirmation flows.

## Install

```bash
npm install @go-go-golems/os-confirm @go-go-golems/os-core
npm install react react-redux
```

`react` and `react-redux` are peer dependencies.

## Main exports

```ts
import {
  ConfirmRequestWindowHost,
  createConfirmRuntime,
  reconcileSubmitConflict409,
} from '@go-go-golems/os-confirm';
```

Common exports include:

- `ConfirmRequestWindowHost` and supporting confirmation UI,
- runtime helpers for creating confirmation clients,
- conflict reconciliation helpers for submit/update flows.

## Typical use

```tsx
import { ConfirmRequestWindowHost } from '@go-go-golems/os-confirm';

export function ReviewStep({ request }) {
  return (
    <ConfirmRequestWindowHost
      request={request}
      onSubmitResponse={(response) => {
        // send response to the host/backend runtime
      }}
      onSubmitScriptEvent={(event) => {
        // send script event to the host/backend runtime
      }}
    />
  );
}
```

Exact request and runtime shapes depend on the backend confirmation API used by the host application.

## Related packages

- `@go-go-golems/os-core` — shared theme and widget primitives.
- `@go-go-golems/os-chat` — chat hosts often surface confirmation requests as part of conversation flows.
- `@go-go-golems/os-scripting` — VM/runtime package for interactive scripted surfaces.
