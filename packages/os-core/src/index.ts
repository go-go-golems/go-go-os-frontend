// @go-go-golems/os-core — barrel exports
//
// USAGE:
//   import { DataTable, Btn, ... } from '@go-go-golems/os-core';
//   import { DesktopShell } from '@go-go-golems/os-core/desktop-react';
//   import { openWindow } from '@go-go-golems/os-core/desktop-core';
//   import '@go-go-golems/os-core/theme';                    // load default desktop/widget css packs
//   import '@go-go-golems/os-core/theme/modern.css';         // optional theme layer
//

// ── App utilities ──
export * from './app';
// ── Card DSL ──
export * from './cards';
// ── Widgets ──
export * from '@go-go-golems/macos1-react/primitives';
// ── Debug utilities ──
export * from './debug';
// ── Diagnostics (Redux perf / FPS) ──
export * from './diagnostics';
// ── State ──
export {
  clearToast,
  notificationsReducer,
  showToast,
} from './features/notifications/notificationsSlice';
export * from './features/notifications/selectors';
// ── Theme ──
export { Macos1Theme } from '@go-go-golems/macos1-react';
export type { Macos1ThemeProps } from '@go-go-golems/macos1-react';
export { HyperCardTheme, type HyperCardThemeProps } from './theme/HyperCardTheme';
// ── Types ──
export * from './types';
