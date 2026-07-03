export { RuntimeDebugPane, type RuntimeDebugPaneProps } from '../../components/shell/RuntimeDebugPane';
export {
  DesktopIconLayer,
  type DesktopIconLayerProps,
} from '@go-go-golems/macos1-react/shell';
export {
  DesktopMenuBar,
  type DesktopMenuBarProps,
} from '@go-go-golems/macos1-react/shell';
export { DesktopShell, type DesktopShellProps } from '../../components/shell/windowing/DesktopShell';
export {
  DesktopShellView,
  type DesktopShellViewProps,
} from '../../components/shell/windowing/DesktopShellView';
export {
  composeDesktopContributions,
  mergeActionSections,
  routeContributionCommand,
  type ComposedDesktopContributions,
  type DesktopCommandContext,
  type DesktopCommandHandler,
  type DesktopContribution,
  type StartupWindowContext,
  type StartupWindowFactory,
} from '../../components/shell/windowing/desktopContributions';
export {
  DesktopWindowMenuRuntimeProvider,
  DesktopWindowScopeProvider,
  useDesktopWindowId,
  useOpenDesktopContextMenu,
  useRegisterContextActions,
  useRegisterIconContextActions,
  useRegisterWidgetContextActions,
  useRegisterWindowContextActions,
  useRegisterWindowMenuSections,
  type DesktopWindowMenuRuntime,
} from '../../components/shell/windowing/desktopMenuRuntime';
export {
  applyActionVisibility,
  isActionVisible,
  isContextCommandAllowed,
} from '../../components/shell/windowing/contextActionVisibility';
export {
  buildContextTargetKey,
  normalizeContextTargetRef,
  resolveContextActions,
  resolveContextActionPrecedenceKeys,
  type ContextActionRegistryEntry,
  type ContextActionRegistryState,
} from '../../components/shell/windowing/contextActionRegistry';
export {
  createAppWindowContentAdapter,
  createFallbackWindowContentAdapter,
} from '../../components/shell/windowing/defaultWindowContentAdapters';
export {
  routeDesktopCommand,
  type DesktopCommandRouteContext,
} from '../../components/shell/windowing/desktopCommandRouter';
export {
  useDesktopShellController,
  type DesktopShellControllerResult,
} from '../../components/shell/windowing/useDesktopShellController';
export {
  renderWindowContentWithAdapters,
  type WindowAdapterContext,
  type WindowContentAdapter,
} from '../../components/shell/windowing/windowContentAdapter';
export type {
  DesktopActionEntry,
  DesktopActionItem,
  DesktopActionSection,
  DesktopActionVisibility,
  DesktopActionVisibilityContext,
  DesktopVisibilityContextResolver,
  DesktopVisibilityContextResolverArgs,
  DesktopContextMenuOpenRequest,
  DesktopCommandInvocation,
  DesktopCommandSource,
  ContextTargetKind,
  DesktopContextTargetRef,
  DesktopFolderIconOptions,
  DesktopIconDef,
  DesktopIconKind,
  DesktopMenuEntry,
  DesktopMenuItem,
  DesktopMenuSection,
  DesktopMenuSeparator,
  DesktopWindowDef,
} from '../../components/shell/windowing/types';
export {
  useWindowInteractionController,
  type WindowInteractionConstraints,
  type WindowInteractionControllerOptions,
} from '../../components/shell/windowing/useWindowInteractionController';
export {
  WindowLayer,
  type WindowLayerProps,
} from '@go-go-golems/macos1-react/shell';
export {
  WindowResizeHandle,
  type WindowResizeHandleProps,
} from '@go-go-golems/macos1-react/shell';
export { WindowSurface, type WindowSurfaceProps } from '@go-go-golems/macos1-react/shell';
export { WindowTitleBar, type WindowTitleBarProps } from '@go-go-golems/macos1-react/shell';
