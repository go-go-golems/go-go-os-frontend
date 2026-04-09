# @go-go-golems/macos1-react

Standalone React UI package for macos1 theming, base widget primitives, rich widget primitives, and shell components.

## Installation

```bash
npm install @go-go-golems/macos1-react
```

## Usage

### Theme

```tsx
import { Macos1Theme } from '@go-go-golems/macos1-react';
import '@go-go-golems/macos1-react/theme';

function App() {
  return (
    <Macos1Theme>
      <MyContent />
    </Macos1Theme>
  );
}
```

### Primitives

```tsx
import { Btn, Checkbox, ContextMenu } from '@go-go-golems/macos1-react/primitives';
```

### Rich Widgets

```tsx
import { Sparkline, CommandPalette, WidgetToolbar } from '@go-go-golems/macos1-react/rich';
```

### Shell Components

```tsx
import { DesktopMenuBar, DesktopIconLayer, WindowLayer } from '@go-go-golems/macos1-react/shell';
```

### Parts

```tsx
import { PARTS, RICH_PARTS } from '@go-go-golems/macos1-react/parts';
```

## Subpath Exports

- `@go-go-golems/macos1-react` — Root package (theme + top-level helpers)
- `@go-go-golems/macos1-react/theme` — Theming system (CSS + Macos1Theme component)
- `@go-go-golems/macos1-react/primitives` — Base widget primitives
- `@go-go-golems/macos1-react/rich` — Rich widget primitives
- `@go-go-golems/macos1-react/shell` — Shell components
- `@go-go-golems/macos1-react/parts` — PARTS and RICH_PARTS constants

## Peer Dependencies

- `react` ^18 or ^19
- `react-dom` ^18 or ^19

## CSS Side Effects

Importing the theme automatically loads all CSS:

```tsx
import '@go-go-golems/macos1-react/theme';
```

## License

MIT
