# @go-go-golems/os-shell

Public desktop shell, launcher, app-registry, and window-manager APIs for go-go-os React applications.

Use this package when your consumer app is no longer only rendering individual primitives or widgets. `os-shell` is the package boundary for composing an OS-like desktop: apps, desktop icons, menus, windows, launcher contributions, and shell-owned Redux state.

## Installation

```bash
npm install @go-go-golems/os-shell @go-go-golems/os-core react react-dom @reduxjs/toolkit react-redux
```

If your shell windows render rich widgets, also install:

```bash
npm install @go-go-golems/os-widgets
```

## Layering

```text
@go-go-golems/os-core
  theme, primitives, low-level desktop state and visual pieces

@go-go-golems/os-widgets
  rich widgets such as LogViewer, ChartView, MacWrite, MacCalc

@go-go-golems/os-shell
  public shell/window-manager boundary: DesktopShell, launcher registry, app manifests, store composition
```

`os-shell` depends on `os-core`. It does not depend on `os-widgets`; the host app decides which widgets to place inside shell windows.

## Theme usage

Most shell apps should import the theme entrypoints once at the app root:

```ts
import '@go-go-golems/os-core/theme';
import '@go-go-golems/os-core/desktop-theme-macos1';
```

Then render under the OS1 root wrapper:

```tsx
<div data-widget="hypercard" className="theme-macos1">
  <App />
</div>
```

`DesktopShell` also renders its own HyperCard theme boundary, but the root wrapper keeps surrounding app chrome and Storybook examples consistent.

## Minimal DesktopShell example

```tsx
import { Provider } from 'react-redux';
import {
  DesktopShell,
  createLauncherStore,
  type RuntimeBundleDefinition,
} from '@go-go-golems/os-shell';

const bundle: RuntimeBundleDefinition = {
  id: 'demo-shell',
  name: 'Demo Shell',
  icon: '🖥️',
  homeSurface: 'home',
  surfaces: {
    home: {
      id: 'home',
      title: 'Home',
      icon: '🏠',
      type: 'report',
      ui: { t: 'text', value: 'Welcome to the shell.' },
    },
  },
};

const launcher = createLauncherStore([]);

export function App() {
  return (
    <Provider store={launcher.store}>
      <div style={{ width: 980, height: 620 }}>
        <DesktopShell bundle={bundle} />
      </div>
    </Provider>
  );
}
```

## Common exports

Desktop/window-manager exports:

- `DesktopShell`
- `DesktopShellView`
- `DesktopIconLayer`
- `DesktopMenuBar`
- `WindowLayer`
- `WindowSurface`
- `WindowTitleBar`
- `WindowResizeHandle`
- `useDesktopShellController`
- `useWindowInteractionController`
- `windowingReducer`
- `windowingActions`

Launcher/app exports:

- `AppManifest`
- `LaunchableAppModule`
- `createAppRegistry`
- `buildLauncherContributions`
- `buildLauncherIcons`
- `renderAppWindow`
- `createRenderAppWindow`

Store exports:

- `createLauncherStore`
- `collectModuleReducers`
- `selectModuleState`
- `createModuleSelector`
- `SHELL_CORE_REDUCER_KEYS`

## Store contract

`createLauncherStore()` creates a standalone Redux store with public shell reducers:

```text
windowing
notifications
debug
```

plus any shared reducers and app-module reducers you provide. It intentionally does not depend on private scripting/runtime packages.

Reserved reducer keys include:

```text
pluginCardRuntime
runtimeSessions
windowing
notifications
debug
hypercardArtifacts
```

This prevents app modules from colliding with historical or shell-owned runtime keys.

## Notes

- This package is ESM.
- The first public release keeps implementation delegation to `os-core` for compatibility, while making `os-shell` the preferred import boundary for shell consumers.
- Prefer `@go-go-golems/os-shell` imports in new shell/window-manager examples.

## License

MIT
