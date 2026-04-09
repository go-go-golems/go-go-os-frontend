// Shell component exports
// Extracted from os-core/src/components/shell/windowing/

// Window primitives
export { DesktopIconLayer, type DesktopIconLayerProps } from './DesktopIconLayer';
export { DesktopMenuBar, type DesktopMenuBarProps } from './DesktopMenuBar';
export { WindowLayer, type WindowLayerProps } from './WindowLayer';
export { WindowResizeHandle, type WindowResizeHandleProps } from './WindowResizeHandle';
export { WindowSurface, type WindowSurfaceProps } from './WindowSurface';
export { WindowTitleBar, type WindowTitleBarProps } from './WindowTitleBar';

// Hooks
export { useContentMinSize } from './useContentMinSize';

// Window scope context
export {
  DesktopWindowScopeProvider,
  useDesktopWindowId,
  type DesktopWindowScopeProviderProps,
} from './windowScope';

// Public types
export type {
  DesktopWindowDef,
  DesktopIconDef,
  DesktopMenuSection,
  DesktopMenuEntry,
  DesktopCommandInvocation,
  DesktopActionEntry,
  DesktopActionItem,
  DesktopActionSeparator,
  DesktopActionSection,
} from './types';
