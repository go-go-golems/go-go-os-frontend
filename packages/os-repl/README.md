# @go-go-golems/os-repl

Terminal and REPL-oriented React UI components and theme styles from go-go-os.

This package is useful when you want command-line or terminal-like interaction patterns inside a React app. It can be used directly, and it is also reused by higher-level packages such as `@go-go-golems/os-widgets`.

## Installation

```bash
npm install @go-go-golems/os-repl react react-dom @reduxjs/toolkit react-redux
```

## Main exports

The package exports:

- `MacRepl`
- `MAC_REPL_STATE_KEY`
- `createMacReplStateSeed`
- `macReplActions`
- `macReplReducer`
- `selectMacReplState`
- REPL controller helpers such as `resolveReplCompletionState` and `executeReplSubmission`
- built-in sample data and demo driver helpers

## Theme usage

Import the package theme CSS:

```ts
import '@go-go-golems/os-repl/theme';
```

If you are already importing `@go-go-golems/os-widgets/theme`, the REPL theme is already included there.

## Minimal example

```tsx
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  MacRepl,
  MAC_REPL_STATE_KEY,
  macReplReducer,
} from '@go-go-golems/os-repl';
import '@go-go-golems/os-repl/theme';

const store = configureStore({
  reducer: {
    [MAC_REPL_STATE_KEY]: macReplReducer,
  },
});

export function App() {
  return (
    <Provider store={store}>
      <MacRepl />
    </Provider>
  );
}
```

## When to use this package

Use `@go-go-golems/os-repl` when you want:

- a retro/mac-style REPL component
- command submission and completion behavior
- terminal-oriented UI building blocks

Do not start with this package if your goal is a general design-system consumer app. In that case, begin with `@go-go-golems/os-core` and add `os-repl` only when you specifically need REPL functionality.

## Notes

- This package is published as ESM.
- The theme export is CSS-only and intended as a side-effect import.
- The reducer and state key are intended for explicit Redux store wiring in standalone consumers.

## License

MIT
