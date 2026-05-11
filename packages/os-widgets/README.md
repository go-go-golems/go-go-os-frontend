# @go-go-golems/os-widgets

Reusable rich React widgets, widget-level primitives, Redux state helpers, and theme CSS from go-go-os.

This package sits above `@go-go-golems/os-core`. Use it when you want richer building blocks or complete widgets such as log viewers, chart views, editors, explorers, and dashboard-like interfaces.

## Installation

```bash
npm install @go-go-golems/os-core @go-go-golems/os-widgets react react-dom @reduxjs/toolkit react-redux
```

If you use widgets that depend on the REPL package, `@go-go-golems/os-repl` is already handled as a dependency of this package.

## Relationship to `os-core`

Use `@go-go-golems/os-core` for low-level primitives such as:

- buttons
- checkboxes
- radio buttons
- tabs
- forms
- tables
- alerts and toasts

Use `@go-go-golems/os-widgets` for:

- richer widgets
- widget-level primitives such as toolbars and status bars
- stateful view components that bundle UI conventions with reducer helpers

A typical standalone app imports both packages:

- `os-core` for the low-level design system
- `os-widgets` for richer panels and widget-specific helpers

## Theme usage

Import the base core theme first, then the widgets theme:

```ts
import '@go-go-golems/os-core/theme';
import '@go-go-golems/os-core/desktop-theme-macos1';
import '@go-go-golems/os-widgets/theme';
```

As with `os-core`, the root wrapper matters:

```tsx
<div data-widget="hypercard" className="theme-macos1">
  <App />
</div>
```

## Widget-level primitives

Small reusable exports include:

- `WidgetToolbar`
- `WidgetStatusBar`
- `SearchBar`
- `Separator`
- `Sparkline`
- `LabeledSlider`
- `ButtonGroup`
- `CommandPalette`
- `ModalOverlay`
- `EmptyState`

Example:

```tsx
import {
  WidgetToolbar,
  WidgetStatusBar,
  SearchBar,
  Sparkline,
} from '@go-go-golems/os-widgets';

export function MetricsBar() {
  return (
    <>
      <WidgetToolbar>
        <SearchBar value="" onChange={() => {}} placeholder="Search…" />
      </WidgetToolbar>
      <Sparkline data={[3, 5, 4, 7, 6, 9, 8]} />
      <WidgetStatusBar>Ready</WidgetStatusBar>
    </>
  );
}
```

## Rich widgets

The package also exports richer widgets such as:

- `LogViewer`
- `ChartView`
- `MacWrite`
- `NodeEditor`
- `MacCalendar`
- `MacSlides`
- `GraphNavigator`
- `MacCalc`
- `SystemModeler`
- `MermaidEditor`
- and other widget modules in the root export

Many of these widgets also export their own:

- state key constants
- reducers
- actions
- selectors
- sample data helpers

## Minimal Redux-backed example

```tsx
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  LogViewer,
  LOG_VIEWER_STATE_KEY,
  logViewerReducer,
} from '@go-go-golems/os-widgets';
import '@go-go-golems/os-core/theme';
import '@go-go-golems/os-core/desktop-theme-macos1';
import '@go-go-golems/os-widgets/theme';

const store = configureStore({
  reducer: {
    [LOG_VIEWER_STATE_KEY]: logViewerReducer,
  },
});

export function App() {
  return (
    <div data-widget="hypercard" className="theme-macos1">
      <Provider store={store}>
        <LogViewer />
      </Provider>
    </div>
  );
}
```

## Optional launcher integration

This package also exposes:

```text
@go-go-golems/os-widgets/launcher
```

The launcher surface is for go-go-os shell-style integrations. It is not required for normal standalone widget usage.

If you use only the root package exports and `./theme`, you can treat the launcher surface as optional. The package marks `@go-go-golems/os-shell` as an optional peer for this reason.

## Validation path for consumers

A good standalone validation path is:

```bash
npm install
npm run typecheck
npm run build
npm run build-storybook
```

This ensures that:

- the package resolves from npm
- the theme CSS is bundled correctly
- the Redux state helpers compile in the consumer environment
- Storybook can render the widgets in isolation

## Notes

- This package is published as ESM.
- Theme imports are side-effect imports and should remain explicit.
- If a widget seems visually unstyled, check theme imports and root wrapper scope first.

## License

MIT
