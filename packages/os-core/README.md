# @go-go-golems/os-core

Low-level React primitives, desktop-style UI building blocks, Redux-friendly helpers, and HyperCard/OS1-inspired theme entrypoints from go-go-os.

This is the foundation package for standalone consumers. If you are starting from scratch, begin with `@go-go-golems/os-core` and only add higher-level packages such as `@go-go-golems/os-widgets` when you need richer widgets or widget-specific primitives.

## Installation

```bash
npm install @go-go-golems/os-core react react-dom @reduxjs/toolkit react-redux
```

## What this package provides

`@go-go-golems/os-core` is the primary low-level package. It includes:

- theme entrypoints
- form and list primitives
- buttons, chips, alerts, toasts, tabs
- data display components such as tables and detail views
- shell/windowing-related exports used by the wider go-go-os system

Commonly used exports include:

- `Btn`
- `Checkbox`
- `RadioButton`
- `Chip`
- `DropdownMenu`
- `ListBox`
- `SelectableList`
- `DataTable`
- `SelectableDataTable`
- `FormView`
- `FieldRow`
- `TabControl`
- `ProgressBar`
- `AlertDialog`
- `Toast`

## Theme usage

Import the base theme and the OS1/macOS-1 layer:

```ts
import '@go-go-golems/os-core/theme';
import '@go-go-golems/os-core/desktop-theme-macos1';
```

Then wrap your app root like this:

```tsx
<div data-widget="hypercard" className="theme-macos1">
  <App />
</div>
```

The root wrapper matters. The OS1/macOS-1 theme is scoped through `data-widget="hypercard"` and `theme-macos1`.

## Minimal example

```tsx
import { useState } from 'react';
import {
  Btn,
  Checkbox,
  RadioButton,
  TabControl,
} from '@go-go-golems/os-core';
import '@go-go-golems/os-core/theme';
import '@go-go-golems/os-core/desktop-theme-macos1';

export function App() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [density, setDensity] = useState<'Compact' | 'Comfortable'>('Comfortable');
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div data-widget="hypercard" className="theme-macos1">
      <Btn isDefault>Default Action</Btn>
      <Checkbox
        label="Enable sound"
        checked={soundEnabled}
        onChange={() => setSoundEnabled(!soundEnabled)}
      />
      <RadioButton
        label="Compact"
        selected={density === 'Compact'}
        onChange={() => setDensity('Compact')}
      />
      <RadioButton
        label="Comfortable"
        selected={density === 'Comfortable'}
        onChange={() => setDensity('Comfortable')}
      />
      <TabControl
        tabs={['One', 'Two']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <div>{activeTab === 0 ? 'First tab' : 'Second tab'}</div>
      </TabControl>
    </div>
  );
}
```

## When to use `os-core` vs `os-widgets`

Use `@go-go-golems/os-core` when you want:

- primitive building blocks
- forms, lists, buttons, alerts, tables
- direct control over composition
- the smallest useful package surface

Use `@go-go-golems/os-widgets` when you want:

- richer widgets
- widget-level primitives such as toolbars, status bars, and sparklines
- a higher-level building block layer on top of `os-core`

## Storybook and standalone apps

A good standalone validation path is:

```bash
npm run typecheck
npm run build
npm run build-storybook
```

In Storybook, import the same theme entrypoints in `preview.tsx` and wrap stories with the same `data-widget="hypercard" className="theme-macos1"` root.

## Notes

- This package is published as ESM.
- CSS theme imports are side-effect imports and should not be removed.
- If the theme appears not to apply, first check the root wrapper contract.

## License

MIT
